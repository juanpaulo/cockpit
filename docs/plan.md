# Cockpit — Architecture Plan (v1)

Derived from `README.md`. This document proposes the folder structure, the
`CockpitItem` type and integration interface, the mock-mode design, and a
market data provider for the Investments segment. No application code is
written in this step; the snippets below are proposals to be implemented in
later build steps.

## 1. Folder structure

```
cockpit/
├── config/                        # committed templates only
│   ├── segments.example.yaml
│   ├── profiles.example.yaml
│   └── home.example.yaml
├── fixtures/                      # invented JSON for mock mode (committed)
│   ├── gmail.json
│   ├── calendar.json
│   ├── notion-tasks.json
│   ├── holdings.json
│   ├── key-dates.json
│   ├── market-quotes.json
│   └── home-assistant.json
├── data/                          # SQLite db + token cache (gitignored)
├── docs/
│   ├── plan.md                    # this file
│   └── deploy.md                  # added in the deploy step
├── public/
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx               # "Today" overview
│   │   ├── segment/[id]/page.tsx  # per-segment view
│   │   └── api/                   # minimal: /api/health, OAuth callbacks
│   ├── components/
│   │   ├── cards/                 # one card type per source
│   │   ├── layout/                # phone tabs / tablet grid / desktop sidebar
│   │   └── ui/                    # primitives (Card, Badge, Timestamp, ...)
│   ├── lib/
│   │   ├── auth/                  # Cloudflare Access JWT verify, email → profile
│   │   ├── config/                # YAML loaders + zod validation, .example fallback
│   │   ├── segments/              # segment tree + tag → segment mapping
│   │   ├── profiles/              # profile model + item filtering
│   │   ├── items/                 # CockpitItem types, grouping/sorting helpers
│   │   ├── integrations/
│   │   │   ├── types.ts           # Integration interface (below)
│   │   │   ├── registry.ts        # picks live vs mock impls via DATA_MODE
│   │   │   ├── gmail/
│   │   │   ├── calendar/
│   │   │   ├── notion-tasks/
│   │   │   ├── investments/       # Notion holdings/dates + price provider
│   │   │   └── home-assistant/
│   │   ├── market-data/           # MarketDataProvider interface + impls
│   │   │   ├── types.ts
│   │   │   ├── yahoo.ts           # primary (see §4)
│   │   │   └── stooq.ts           # fallback (see §4)
│   │   ├── mocks/                 # fixture loader + mock integrations
│   │   ├── cache/                 # SQLite access, price cache (15 min TTL)
│   │   └── errors.ts              # IntegrationError, ConfigError
├── tests/                         # unit + e2e (mock mode only)
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

Notes:

- All external calls live under `src/lib/integrations/` and
  `src/lib/market-data/`. Nothing in `src/app` or `src/components` imports a
  vendor SDK directly.
- `src/lib/auth/` is the only code that reads `Cf-Access-*` headers; pages
  receive a resolved profile, never raw headers.
- Unit tests for segment mapping and profile filtering sit next to
  `src/lib/segments/` and `src/lib/profiles/` (`*.test.ts`); e2e tests live in
  `tests/e2e/`.

## 2. `CockpitItem` and the integration interface

### Item shape

README defines the common shape as
`id, source, segment, title, subtitle, timestamp, url, status`. Proposed:

```ts
type SourceId =
  | "gmail"
  | "calendar"
  | "notion-task"
  | "investment"
  | "home-assistant";

interface CockpitItem {
  id: string;            // stable, unique per source (used for dedup/keys)
  source: SourceId;
  segment: string;       // resolved segment id; "general" when unmatched
  title: string;
  subtitle?: string;
  timestamp: string;     // ISO 8601; drives "last updated" and sorting
  url: string;           // deep link back to the source app
  status: "default" | "warning" | "urgent";
  meta?: Record<string, unknown>; // per-source extras (price, entity state, ...)
}
```

Design decisions:

- **`segment` is a resolved id, not a raw tag.** Integrations don't know the
  segment tree. Each item carries its native tag in `meta` (e.g. the Gmail
  label or calendar name), and a single shared mapper in `src/lib/segments/`
  assigns `segment` post-fetch against `config/segments.yaml`. Untagged items
  land in `general` — nothing is silently dropped, per README.
- **`status`** covers the two visible needs: `urgent` (overdue task, lock
  unlocked) and `warning` (event soon, stale price). Cards render it as a
  small badge; no decorative color coding beyond that.
- **`meta`** keeps the common shape flat while letting cards pull
  source-specific fields (e.g. `meta.changePercent` for a holding,
  `meta.state` for an HA entity) without a discriminated union. Card
  components narrow `meta` with a per-source schema.

### Integration interface

README requires `fetchItems(): Promise<CockpitItem[]>`. Proposed expansion:

```ts
interface Integration {
  readonly id: SourceId;
  readonly name: string;

  fetchItems(ctx: IntegrationContext): Promise<IntegrationResult>;
}

interface IntegrationContext {
  config: AppConfig;      // typed YAML config + env secrets
  cache: Cache;           // SQLite-backed cache
  now: Date;              // injected clock (mock-mode determinism, tests)
}

type IntegrationResult =
  | { ok: true; items: CockpitItem[]; fetchedAt: string }
  | { ok: false; error: IntegrationError; fetchedAt: string };
```

Rationale:

- **Errors are data, not throws.** README requires a failing source to show an
  error on its own card without breaking the page. Returning
  `IntegrationResult` makes that the normal path; the overview renders the
  error card when `ok: false`.
- **`IntegrationContext`** keeps integrations pure and testable — the mock
  context swaps in fixture-backed HTTP and a fixed clock.
- The Investments segment is a composite: it pulls holdings/key dates from
  Notion, then enriches with `MarketDataProvider` quotes before emitting
  items. The provider is injected via `ctx`, so it stays swappable.

## 3. Mock mode (`DATA_MODE=mock`)

Constraints from README: the dev VM cannot reach the home network or real
accounts; fixtures must be entirely invented; all UI work and tests run
against mocks.

Design:

- **`DATA_MODE=live | mock`** in `.env`. `mock` swaps every integration's
  transport for fixture reads. Optional `MOCK_INTEGRATIONS=gmail,calendar`
  allows partial mocking when developing against a subset of live accounts.
- **Fixtures mimic raw upstream responses, not `CockpitItem`s.** Each
  integration is split into *transport* (call the API / read the fixture) and
  *normalize* (raw JSON → `CockpitItem`). Mock mode changes only transport,
  so mapping and segment logic — the parts that must not be wrong — run
  identically in mock and live, and are what the unit tests cover.
- **Fixture loader** (`src/lib/mocks/`): reads `fixtures/<source>.json`,
  validates it with zod against the upstream response schema, and throws a
  clear `ConfigError` naming the fixture file if missing or malformed —
  mirroring the README's rule for missing real config.
- **Deterministic clock.** Dated fixture fields (`due`, `start`, `date`) are
  written as relative offsets (`"today"`, `"today+3"`, `"now-25m"`) that the
  loader resolves against `ctx.now`. This keeps "due today / this week / next
  30 days" scenarios stable in CI and demos; absolute dates would silently rot.
- **`data/` is never used in mock mode** except for OAuth-token storage code
  paths that exist anyway; tests may set `DATA_DIR` to a temp dir.

## 4. Market data provider (Investments)

Requirements: TSE + US (NYSE/NASDAQ) quotes, JPY conversion for the portfolio
total, refresh ≤ 15 min, free tier, single API key slot
(`MARKET_DATA_API_KEY`).

### Free-tier survey (checked 2026-10)

| Provider | Free tier | TSE coverage on free tier |
|---|---|---|
| **Yahoo Finance** (unofficial, `yahoo-finance2`) | unlimited-ish, keyless; subject to informal rate limits and ToS | Yes — `7203.T` |
| **Stooq** | free CSV endpoint, no key, no published quota; mostly EOD / delayed | Yes — `7203.jp` |
| Twelve Data | 8 req/min, **800/day**; real-time **US only** | No — international needs paid Grow ($29+/mo) |
| Finnhub | 60 req/min, no daily cap; real-time **US only** | No — real-time international is Enterprise |
| Alpha Vantage | **25 req/day** | Partial (`XXXX.TYO`), but 25/day can't serve a watchlist at 15-min refresh |
| Marketstack | 1,000 req/**month** | Yes (XTYO), but quota is far too small |
| EOD Historical Data | 20 req/day | Yes, but quota too small |
| Polygon.io | free tier is US stocks only | No |

The keyed free tiers all fail one of two ways: TSE is paywalled (Twelve Data,
Finnhub, Polygon) or the daily quota can't sustain 15-min refreshes for even a
handful of holdings (Alpha Vantage, Marketstack, EODHD).

### Recommendation

**Primary: Yahoo Finance via `yahoo-finance2`** (community library, unofficial
but the de-facto choice for self-hosted dashboards):

- TSE: `7203.T` / `9984.T`; US: `AAPL`, `MSFT` — one endpoint, both markets.
- FX pairs (`USDJPY=X`, `EURJPY=X`) cover the JPY portfolio total without a
  second provider.
- Delayed ~15 min — exactly the freshness budget the README allows.
- No key needed; `MARKET_DATA_API_KEY` remains reserved for a keyed provider
  if one is ever adopted.

**Fallback: Stooq** (`stooq.com/q/l/` CSV). Keyless, covers `7203.jp`,
`aapl.us`, and `usdjpy`. EOD-to-slightly-delayed data is acceptable here
because Cockpit is a glanceable dashboard, not a trading tool. Implement it
behind the same interface so `MARKET_DATA_PROVIDER=stooq` switches providers
config-only.

Mitigations for Yahoo being unofficial: small retry/backoff on 429s, always
serve the last cached quote when a refresh fails (show `fetchedAt` on the
card), and keep the provider behind the interface below so it can be replaced
by a paid keyed API later without touching the Investments integration.

### Provider interface

```ts
interface SymbolRef {
  ticker: string;                     // "7203", "AAPL"
  exchange: "TSE" | "NYSE" | "NASDAQ"; // from Notion Holdings `Exchange`
}

interface Quote {
  symbol: SymbolRef;
  price: number;
  currency: "JPY" | "USD" | string;
  changePercent: number;              // vs previous close
  asOf: string;                       // ISO 8601
}

interface MarketDataProvider {
  getQuotes(symbols: SymbolRef[]): Promise<Quote[]>;
  getFxRate(from: string, to: string): Promise<number>; // e.g. USD→JPY
}
```

Each provider owns a `SymbolRef → provider symbol` mapper (`7203`+TSE →
`7203.T` / `7203.jp`; `AAPL`+NYSE → `AAPL` / `aapl.us`).

### Caching and refresh

- SQLite `price_cache` table keyed by provider symbol; TTL 15 min, matching
  README. `getQuotes` reads cache first and only calls the provider for stale
  or missing entries, batched into one request per cycle.
- Worst case (a dashboard open 24/7): ~96 refresh cycles/day × (holdings + 1 FX
  call). For ~15 holdings that's ~1,500 requests/day — within Yahoo's informal
  tolerance, and the only options that beat it are paid plans. If rate limits
  ever bite, extending TTL (e.g. 30 min for TSE when the market is closed) is
  a config change.
- TSE and US market hours barely overlap; the cache can optionally skip
  refreshes when the relevant exchange is closed (future optimization, not
  required for v1).

## 5. Open questions

1. Confirm Yahoo Finance as primary vs paying ~$29/mo for Twelve Data Grow —
   the recommendation assumes free-tier-only.
2. `Work` segment stays a hidden placeholder in v1 — assumed folded into the
   layout rather than config.
3. E2E runner: Playwright is the obvious default for the responsive
   breakpoints; flagging only so it's confirmed before the skeleton step.
