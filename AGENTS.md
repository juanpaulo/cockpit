# AGENTS.md — Cockpit

Rules for every session working in this repo. Read `README.md` (the product
spec) and `docs/plan.md` (the agreed architecture) before writing code; this
file is the binding convention layer on top of them.

## Vocabulary (use these names, not generic ones)

- **Sensor** — a data-source adapter (`src/lib/sensors/<name>/`). Implements
  `fetchReadouts(ctx: SensorContext): Promise<SensorResult>`.
- **Readout** — one normalized dashboard item (`src/lib/readouts/`). Replaces
  the README's `CockpitItem`.
- **Instrument** — a UI component rendering readouts from one sensor
  (`src/components/instruments/`), built on the generic `ui/Card` primitive.
- **Status** — `"advisory" | "caution" | "warning"`, aviation order (warning =
  most severe). Overdue task / unlocked lock → `warning`; event soon / stale
  price → `caution`; everything else → `advisory`.
- Where the README says `Integration` / `fetchItems` / `CockpitItem`, read
  `Sensor` / `fetchReadouts` / `Readout`.

## Mock mode (mandatory)

- The dev VM cannot reach the home network or real accounts. **All
  development and tests run in `DATA_MODE=mock`.**
- Fixtures in `fixtures/` mimic **raw upstream API responses**, not
  `Readout`s — sensors split transport from normalize so the same mapping
  code runs live and mock.
- Fixtures must be **entirely invented**. Never generate them from real
  emails, events, tasks, holdings, or entity names.
- Dated fixture fields use relative tokens (`"today"`, `"today+3"`,
  `"now-25m"`) resolved against the injected clock — never absolute dates.

## Public repo hygiene

- Commit only `config/*.example.yaml`, `.env.example`, and `fixtures/`.
  Never commit real config (`config/segments.yaml`, `config/profiles.yaml`,
  `config/home.yaml`), `.env`, or `data/` (SQLite, tokens, cache).
- No secrets or real personal data in code, fixtures, docs, or commit
  messages.

## Architecture rules

- TypeScript strict; Next.js App Router with **server-side data fetching
  only** — no API token ever reaches the browser.
- Follow the `docs/plan.md` folder structure; all external calls live under
  `src/lib/sensors/` and `src/lib/market-data/` — no vendor SDK imports in
  `src/app` or `src/components`.
- A failing sensor returns `{ ok: false, error: SensorError }` — it never
  throws into page render. A broken instrument must not break the page.
- Missing real config fails with a clear message naming the matching
  `.example` file.
- **v1 is read-only**: no writes back to Gmail, Calendar, Notion, or Home
  Assistant. Every readout's `url` links to the source app for actions.
- Market data: `yahoo-finance2` primary, Stooq fallback, behind
  `MarketDataProvider`; price cache TTL 15 min in SQLite.
- Minimal comments; name things well instead. Prefer editing existing files
  over creating new ones; match surrounding style.

## Testing

- Unit tests required for segment mapping and profile filtering — the parts
  that must not be wrong.
- One e2e test per page in mock mode (Playwright).
- Run lint, typecheck, and tests before opening a PR.

## PRs

- One task per PR, kept small. Short description of what changed and how it
  was tested.

## Cursor Cloud specific instructions

- Mock mode is the default (`DATA_MODE` unset or `mock`). No `.env` and no
  real `config/*.yaml` are required; missing config falls back to
  `config/*.example.yaml`, and sensors read `fixtures/`.
- `npm run typecheck` depends on generated route types (`LayoutProps` and
  `next-env.d.ts`, which is gitignored). Run `npx next typegen` after
  `npm ci`. `next dev` and `next build` generate the same files.
- Dev server: `npm run dev -- --hostname 0.0.0.0 --port 3000`.
  `GET /api/health` returns `{ ok: true, mode: "mock" }`.
- `npm run test:e2e` starts its own Next server on port 3100. Install the
  browser with `npx playwright install chromium`. Leave the port 3000 server
  running; the e2e suite does not reuse it.
- Docker Compose is the home-server deploy path. Day-to-day development runs
  Next on the host.
<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
