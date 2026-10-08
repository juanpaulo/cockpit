# Cockpit — Architecture Plan (v1)

Derived from `README.md`. This document proposes the folder structure, the
`Readout` type and sensor interface, the mock-mode design, and a
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
│   │   ├── instruments/           # one instrument type per sensor
│   │   ├── layout/                # phone tabs / tablet grid / desktop sidebar
│   │   └── ui/                    # primitives (Card, Badge, Timestamp, ...)
│   ├── lib/
│   │   ├── auth/                  # Cloudflare Access JWT verify, email → profile
│   │   ├── config/                # YAML loaders + zod validation, .example fallback
│   │   ├── segments/              # segment tree + tag → segment mapping
│   │   ├── profiles/              # profile model + readout filtering
│   │   ├── readouts/              # Readout types, grouping/sorting helpers
│   │   ├── sensors/
│   │   │   ├── types.ts           # Sensor interface (below)
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
│   │   ├── mocks/                 # fixture loader + mock sensors
│   │   ├── cache/                 # SQLite access, price cache (15 min TTL)
│   │   └── errors.ts              # SensorError, ConfigError
├── tests/                         # unit + e2e (mock mode only)
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

Notes:

- All external calls live under `src/lib/sensors/` and
  `src/lib/market-data/`. Nothing in `src/app` or `src/components` imports a
  vendor SDK directly.
- `src/lib/auth/` is the only code that reads `Cf-Access-*` headers; pages
  receive a resolved profile, never raw headers.
- Unit tests for segment mapping and profile filtering sit next to
  `src/lib/segments/` and `src/lib/profiles/` (`*.test.ts`); e2e tests live in
  `tests/e2e/`.

## 2. `Readout` and the sensor interface

Glossary (cockpit theme):

| Term | Meaning |
|---|---|
| **Sensor** | A data-source adapter (Gmail, Calendar, Notion, HA, …) that emits readouts. |
| **Readout** | One normalized item shown on the dashboard (an email, event, task, holding, entity). |
| **Instrument** | A UI component that renders readouts from one sensor, built on the generic `ui/Card` primitive. |

Naming is deliberately different from the README's `CockpitItem` /
`Integration` / `fetchItems`: same concepts, renamed to the cockpit theme
(`Sensor` → `fetchReadouts()` → `Readout` → `Instrument`). Where the README
says "integration", read "sensor".

### Readout shape

README defines the common shape as
`id, source, segment, title, subtitle, timestamp, url, status`. Proposed:

```ts
type SourceId =
  | "gmail"
  | "calendar"
  | "notion-task"
  | "investment"
  | "home-assistant";

interface Readout {
  id: string;            // stable, unique per source (used for dedup/keys)
  source: SourceId;
  segment: string;       // resolved segment id; "general" when unmatched
  title: string;
  subtitle?: string;
  timestamp: string;     // ISO 8601; drives "last updated" and sorting
  url: string;           // deep link back to the source app
  status: "advisory" | "caution" | "warning"; // aviation order: warning = most severe
  meta?: Record<string, unknown>; // per-source extras (price, entity state, ...)
}
```

Design decisions:

- **`segment` is a resolved id, not a raw tag.** Sensors don't know the
  segment tree. Each readout carries its native tag in `meta` (e.g. the Gmail
  label or calendar name), and a single shared mapper in `src/lib/segments/`
  assigns `segment` post-fetch against `config/segments.yaml`. Untagged items
  land in `general` — nothing is silently dropped, per README.
- **`status`** follows aviation severity order — `advisory` (neutral default)
  < `caution` < `warning`. An overdue task or unlocked lock is `warning`; an
  event starting soon or a stale price is `caution`. Instruments render it as
  a small badge; no decorative color coding beyond that.
- **`meta`** keeps the common shape flat while letting instruments pull
  source-specific fields (e.g. `meta.changePercent` for a holding,
  `meta.state` for an HA entity) without a discriminated union. Instrument
  components narrow `meta` with a per-source schema.

### Sensor interface

README requires `fetchReadouts(): Promise<Readout[]>` (written there as
`fetchItems(): Promise<CockpitItem[]>`). Proposed expansion:

```ts
interface Sensor {
  readonly id: SourceId;
  readonly name: string;

  fetchReadouts(ctx: SensorContext): Promise<SensorResult>;
}

interface SensorContext {
  config: AppConfig;      // typed YAML config + env secrets
  cache: Cache;           // SQLite-backed cache
  now: Date;              // injected clock (mock-mode determinism, tests)
}

type SensorResult =
  | { ok: true; readouts: Readout[]; fetchedAt: string }
  | { ok: false; error: SensorError; fetchedAt: string };
```

Rationale:

- **Errors are data, not throws.** README requires a failing source to show an
  error on its own card without breaking the page. Returning
  `SensorResult` makes that the normal path; the overview renders an
  error instrument when `ok: false`.
- **`SensorContext`** keeps sensors pure and testable — the mock
  context swaps in fixture-backed transport and a fixed clock.
- The Investments segment is a composite sensor: it pulls holdings/key dates
  from Notion, then enriches with `MarketDataProvider` quotes before emitting
  readouts. The provider is injected via `ctx`, so it stays swappable.

## 3. Mock mode (`DATA_MODE=mock`)

Constraints from README: the dev VM cannot reach the home network or real
accounts; fixtures must be entirely invented; all UI work and tests run
against mocks.

Design:

- **`DATA_MODE=live | mock`** in `.env`. `mock` swaps every sensor's
  transport for fixture reads. Optional `MOCK_SENSORS=gmail,calendar`
  allows partial mocking when developing against a subset of live accounts.
- **Fixtures mimic raw upstream responses, not `Readout`s.** Each
  sensor is split into *transport* (call the API / read the fixture) and
  *normalize* (raw JSON → `Readout`). Mock mode changes only transport,
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
instrument), and keep the provider behind the interface below so it can be
replaced by a paid keyed API later without touching the Investments sensor.

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

## 5. Resolved questions

1. **Market data:** confirmed — Yahoo Finance primary (TSE via `7203.T`,
   US tickers, `USDJPY=X` for JPY totals), Stooq fallback, no paid provider.
2. **Work segment:** stays a hidden placeholder in v1, folded into the
   layout rather than config — confirmed.
3. **E2E runner:** Playwright for the responsive breakpoints — confirmed.
