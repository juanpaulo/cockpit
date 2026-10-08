# Cockpit

A self-hosted daily dashboard that shows everything I need to deal with today in one place: email, calendar, Notion tasks, investments, and a quick view of key home automations.

It runs on a home server next to Home Assistant and is served on a subdomain (e.g. `cockpit.example.com`) through a Cloudflare Tunnel.

---

## Goals

- One screen that answers "what do I need to do today?"
- Organized by **segment**, so each part of life is separate
- Works equally well on phone, tablet, and desktop browser
- **Read-only in v1.** Every item links back to its source app (Gmail, Calendar, Notion, HA) for any action.

## Non-goals (v1)

- No work accounts (work mail/calendar). Planned for a later version.
- No writing back: no replying, archiving, or completing tasks from Cockpit
- No Home Assistant control (toggles planned for v2, see Roadmap)
- No native mobile app. Responsive web only.

---

## Segments

```
Personal
├── Family
├── Investments
├── Home Automation
└── General        (anything personal that isn't tagged more specifically)
Work               (placeholder only in v1, hidden by default)
```

Segments are defined in `config/segments.yaml` so adding one later (e.g. a side business) is config, not code.

### How items get assigned to a segment

Each source uses its own native way of tagging, and `config/segments.yaml` maps those tags to segments:

| Source | How it's tagged | Example |
|---|---|---|
| Gmail | Gmail labels | `Cockpit/Family`, `Cockpit/Investments` |
| Google Calendar | One calendar per segment | "Family" calendar → Family |
| Notion tasks | A `Segment` select property on the tasks database | `Segment = Investments` |
| Investments | Always Investments | n/a |
| Home Assistant | Always Home Automation | n/a |

Anything without a tag falls into **Personal → General**. Nothing is silently dropped.

Example `config/segments.example.yaml`:

```yaml
segments:
  - id: family
    name: Family
    parent: personal
    gmail_labels: ["Cockpit/Family"]
    calendars: ["Family"]
    notion_values: ["Family"]
  - id: investments
    name: Investments
    parent: personal
    gmail_labels: ["Cockpit/Investments"]
    notion_values: ["Investments"]
  - id: home
    name: Home Automation
    parent: personal
  - id: general
    name: General
    parent: personal
    default: true
```

---

## Profiles and access

Two profiles, controlled by Cloudflare Access (Google login) in front of the app. The app reads the authenticated email from the `Cf-Access-Authenticated-User-Email` header and maps it to a profile in `config/profiles.yaml`.

| Profile | Sees |
|---|---|
| Owner | All segments |
| Family member | Family only |

- The app must **refuse requests that don't carry a valid Cloudflare Access JWT** (verify the `Cf-Access-Jwt-Assertion` header against the team's public keys). Do not trust the email header alone.
- Data comes from the owner's connected accounts; the Family member profile is a filtered view, not a separate set of integrations.
- A profile switcher is shown only to users allowed more than one profile.

Example `config/profiles.example.yaml`:

```yaml
profiles:
  - id: owner
    name: Owner
    emails: ["owner@example.com"]
    segments: ["*"]
  - id: family
    name: Family member
    emails: ["family@example.com"]
    segments: ["family"]
```

---

## Data sources (v1)

All integrations are **read-only** and use the narrowest scope available.

### Gmail
- Google OAuth, scope `gmail.readonly`
- Show: unread + starred threads from the last 7 days, grouped by segment (sender, subject, snippet, age, link to thread)

### Google Calendar
- Google OAuth, scope `calendar.readonly`
- Show: today's events plus the next 2 days, per segment, with a "now / next" highlight

### Notion tasks
- Notion internal integration token, shared with the tasks database only
- Database ID set in config (`NOTION_TASKS_DB_ID`)
- Properties used: `Name`, `Status`, `Due`, `Segment`
- Show: overdue, due today, due this week. Exclude completed.

### Investments
Two Notion databases, maintained by hand:

- **Holdings**: `Ticker`, `Exchange` (TSE / NYSE / NASDAQ), `Quantity`, `Currency`
- **Key dates**: `Name`, `Date`, `Type` (dividend, tax, furusato nozei, other)

Prices come from a market data provider that supports both TSE and US tickers (Devin to propose one in the planning session, with the free-tier limits).

Show:
- Total portfolio value in JPY, with daily change
- Watchlist: each holding's price and daily % change
- Upcoming dates in the next 30 days

Prices are cached and refreshed at most every 15 minutes.

### Home Assistant
- HA REST API over the **local network** (Cockpit runs on the same LAN, so no tunnel hop)
- Long-lived access token, stored as a secret
- Entities are listed in `config/home.yaml` (not committed). Four card types:

| Card | Entity domain | Example IDs |
|---|---|---|
| Solar | `sensor` | `sensor.example_solar_power`, `sensor.example_solar_energy_today` |
| Locks | `lock` | `lock.example` |
| Climate | `climate` | `climate.example` |
| Garage | `cover` | `cover.example` |

- Show current state and last-changed time. v1 is display only.

---

## UX

- **Mobile-first**, responsive up to a desktop grid
  - Phone: one column, segment tabs at the top
  - Tablet: two columns, also good as an always-on home screen
  - Desktop: segment sidebar + multi-column overview
- "Today" overview first: counts per segment (unread, events, tasks due) and the next calendar event
- Light and dark mode, following the system setting
- Every card shows when it was last updated. A failing source shows a clear error on its own card and never breaks the rest of the page.
- Clean and minimal: few colors, generous spacing, no decorative charts

---

## Tech stack

- **Next.js (TypeScript)**, using the App Router. Server-side data fetching only; no API tokens ever reach the browser.
- **SQLite** for cache, OAuth tokens (encrypted at rest), and settings
- **Docker Compose** for deployment on the home server
- Config in YAML under `config/`; secrets in `.env`

### What's committed and what isn't

This is a public repo. Only templates are committed; real values stay local.

| Committed | Not committed (in `.gitignore`) |
|---|---|
| `.env.example` | `.env` |
| `config/*.example.yaml` | `config/segments.yaml`, `config/profiles.yaml`, `config/home.yaml` |
| `fixtures/` (invented data only) | `data/` (SQLite database, tokens, cache) |

The app should fail with a clear message if a real config file is missing, pointing to the matching `.example` file.

### Secrets (`.env.example`)

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NOTION_TOKEN=
NOTION_TASKS_DB_ID=
NOTION_HOLDINGS_DB_ID=
NOTION_DATES_DB_ID=
HA_BASE_URL=http://homeassistant.local:8123
HA_TOKEN=
MARKET_DATA_API_KEY=
CF_ACCESS_TEAM_DOMAIN=
CF_ACCESS_AUD=
TOKEN_ENCRYPTION_KEY=
```

---

## Development notes (for Devin)

- **The dev VM cannot reach the home network or real accounts.** Every integration must have a mock mode (`DATA_MODE=mock`) backed by JSON fixtures in `fixtures/`. All UI work and tests run against mocks.
- **Fixtures must be entirely invented.** Never generate them from real emails, events, tasks, holdings, or entity names.
- Each integration lives behind one interface (`fetchItems(): Promise<CockpitItem[]>`) so sources can be added without touching the UI.
- Common item shape: `id, source, segment, title, subtitle, timestamp, url, status`.
- Tests: unit tests for segment mapping and profile filtering (these are the parts that must not be wrong), plus one end-to-end test per page in mock mode.
- Keep PRs small: one task per PR, with a short description of what changed and how it was tested.

---

## Build plan

Each step is one Devin session and one PR.

1. **Plan:** read this README, propose the folder structure, interfaces, and a market data provider. No code.
2. **Skeleton:** Next.js app, Docker Compose, config loading from `.example` templates, `.gitignore`, segment and profile models, mock mode, empty layout for all three screen sizes
3. **Auth:** Cloudflare Access JWT verification and the profile switch, with tests proving the Family member profile only sees Family
4. **Calendar:** Google OAuth flow + Calendar integration
5. **Gmail:** Gmail integration using the same OAuth
6. **Notion tasks**
7. **Investments:** Notion holdings + dates, price fetching, cache
8. **Home Assistant:** read-only cards
9. **Polish:** "Today" overview, error states, dark mode, tablet always-on view
10. **Deploy:** production Docker build, Cloudflare Tunnel route for the chosen subdomain, setup guide in `docs/deploy.md`

---

## Roadmap (after v1)

- **v2:** Home Assistant toggles for locks, climate, and garage, with a confirmation step on locks and garage
- **v2:** Complete Notion tasks from Cockpit
- **Later:** Work segment
- **Later:** Side-business segment
