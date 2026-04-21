# Architecture: club-golf-tools

## Overview

`club-golf-tools` is a React/TypeScript single-page application for hosting golf tournament pools at private country clubs. It supports two clubs (RVCC, Crestmont) for the Masters tournament and is being evolved into a **self-serve private pool hosting platform** that clubs can operate without manual intervention.

The frontend is intentionally thin for scoring: it handles entry collection, validation, standings display, and coordinator administration. All scoring, qualification logic, and authoritative rule enforcement live in the `sports-data-admin` backend. The frontend never computes standings — it only renders what the backend returns.

Club identity is resolved from the URL path (`/:clubCode/`). Authentication uses Clerk for coordinator/admin access; public routes (entry, leaderboard, lookup) require no login.

---

## Key Components

### API Client Layer (`src/api/`)

The API layer is interface-driven for testability and environment separation.

| File | Responsibility |
|------|---------------|
| `types.ts` | `ApiClient` interface defining all 22 endpoints + `API_ENDPOINTS` map |
| `client.ts` | Singleton export — swaps `HttpApiClient` vs `MockApiClient` at build time |
| `http.ts` | `HttpApiClient` — production HTTP calls, `X-API-Key` injection |
| `mock/adapters.ts` | `MockApiClient` — deterministic in-memory data, used in all tests |
| `mock/data.ts` | Fixture data aligned with domain types |

The Vite dev server proxies `/api/*` requests to `SPORTS_API_URL` and injects the `X-API-Key` header. The browser never handles credentials directly.

### Club Configuration (`src/config/`)

| File | Responsibility |
|------|---------------|
| `clubs.ts` | `CLUB_CONFIGS` — per-club UI config (pick counts, bucket labels, rules text) |
| `subdomain.ts` | Hostname → `ClubCode` mapping |

`ClubConfig` is the frontend-side SSOT for UI presentation and client-side validation. The backend's `pool.rules_json` is the authoritative SSOT for scoring. Both must stay manually synchronized until the backend serves config at runtime.

Both clubs have `allowSelfServiceEntry: false` — entry submission is gated by this flag. Public entry links (`/enter/:poolToken`) bypass this gate.

### Pages (`src/pages/`)

**Public routes (no authentication):**

| Page | Route | Purpose |
|------|-------|---------|
| `MarketingPage` | `/` | Platform landing page |
| `CoordinatorSignUpPage` | `/sign-up` | Clerk sign-up for new coordinators |
| `HomePage` | `/:clubCode` | Club landing |
| `RulesPage` | `/:clubCode/rules` | Club-specific rules from `ClubConfig.rulesDescription` |
| `EntryPage` | `/:clubCode/entry` | Pick selection form (gated by `allowSelfServiceEntry`) |
| `ConfirmationPage` | `/:clubCode/confirmation` | Post-submit receipt |
| `LeaderboardPage` | `/:clubCode/leaderboard` | Live standings, polls every 5 minutes |
| `EntryDetailPage` | `/:clubCode/leaderboard/entry/:entryId` | Individual entry detail |
| `LookupPage` | `/:clubCode/lookup` | Email-based entry lookup |
| `PublicEntryPage` | `/:clubCode/enter/:poolToken` | Public entry link — no login required |
| `PublicConfirmationPage` | `/:clubCode/enter/:poolToken/confirmation` | Public entry confirmation |
| `AdminSignInPage` | `/:clubCode/admin/sign-in` | Clerk sign-in for coordinators |

**Coordinator routes (Clerk authentication required via `CoordinatorRoute`):**

| Page | Route | Purpose |
|------|-------|---------|
| `AdminDashboard` | `/:clubCode/admin` | Platform-wide stats (admin only) |
| `PoolListingPage` | `/:clubCode/admin/pools` | All pools for the club |
| `PoolWizardPage` | `/:clubCode/admin/pools/new` | Multi-step pool creation wizard |
| `CoordinatorDashboardPage` | `/:clubCode/admin/pools/:poolId` | Entries, events, CSV export for a pool |
| `BrandingSettingsPage` | `/:clubCode/admin/branding` | Club logo and color settings |

`ClubRoot` resolves club context from the URL parameter. `ClubOutlet` provides `ClubConfig` to all child pages via `useClubOutletContext()`.

### Entry Components (`src/components/entry/`)

| Component | Format | Club |
|-----------|--------|------|
| `GolferPicker` | Flat list — pick any N | RVCC |
| `BucketPicker` | Pick 1 from each of N buckets | Crestmont |

Both share a sticky bottom bar showing pick progress and the submit button.

### Leaderboard Components (`src/components/leaderboard/`)

| Component | Responsibility |
|-----------|---------------|
| `LeaderboardTable` | Standings rows — rank, entry name, score, qualification badge |
| `GolferCell` | Per-pick display — score, position, thru, cut/WD/DQ status |

Sort order for picks: counted picks first → active over cut → by score → by name. No scoring math happens here; the backend pre-computes `counts_toward_total` and `is_dropped`.

### Layout Components (`src/components/layout/`)

| Component | Responsibility |
|-----------|---------------|
| `Header` | Nav bar with club name and links |
| `Footer` | Club footer |
| `Layout` | Page shell wrapping header + footer |
| `LockCountdownWidget` | Shows time until pool locks; reads from `getLockStatus` |

### Coordinator Components

| Component | Responsibility |
|-----------|---------------|
| `coordinator/ReferralWidget` | Referral code display and sharing |
| `onboarding/OnboardingChecklist` | Post-signup checklist for new coordinators |
| `onboarding/UpgradePrompt` | Billing upgrade prompt on trial expiry |

### Hooks (`src/hooks/`)

| Hook | Responsibility |
|------|---------------|
| `useApi<T>` | Generic async data fetcher — loading / error / data / refetch, optional polling |
| `useClubConfig` | Resolves current club from hostname via `subdomain.ts` |

### Utilities (`src/utils/`)

| File | Responsibility |
|------|---------------|
| `validation.ts` | `validateEntryForm()` — email, name, pick count, bucket completeness |
| `formatting.ts` | Score display (+N / E / −N), position suffixes, status labels |
| `fieldHelpers.ts` | `fieldToGolfers()`, `fieldToBuckets()` — adapts API field shape to picker UI shape |
| `poolWizardUtils.ts` | Pool creation form helpers |

---

## Data Models

All types live in `src/types/domain.ts`. Key types:

| Type | Purpose |
|------|---------|
| `ClubCode` | `'rvcc' \| 'crestmont'` |
| `PoolStatus` | `'draft' \| 'open' \| 'locked' \| 'live' \| 'final' \| 'archived'` |
| `GolferStatus` | `'active' \| 'cut' \| 'wd' \| 'dq'` |
| `PoolSummary` | Pool record with rules, status, deadline, entry count |
| `PoolRules` | Pick count, cut minimum, bucket config, WD/DQ penalties |
| `PoolFieldResponse` | Field players — flat `players[]` for RVCC, `buckets[]` for Crestmont |
| `LeaderboardData` | Standings array + `last_scored_at` timestamp |
| `LeaderboardStanding` | Entry rank, aggregate score, picks with per-golfer data |
| `PoolLockStatus` | Lock state, lock time, first tee time |
| `PoolEvent` | Append-only audit event (entry_submitted, pool_locked, score_recalculated, etc.) |
| `TournamentOption` | Tournament config for pool wizard (name, year, cut_rule_type) |
| `CreatePoolRequest` | Request body for pool creation wizard |
| `ClubBranding` | Logo URL, primary color, accent color |
| `ClubBilling` | Stripe billing status, trial state, portal URL |
| `ReferralInfo` | Referral code, credit balance, referred club count |
| `AdminStats` | Platform-wide stats: pools, entries, clubs, MRR |

---

## Data Flows

### Entry Submission

```
URL param
  └─ ClubRoot → ClubCode → ClubConfig
       └─ useApi(getActivePool) → PoolSummary
            └─ useApi(getPoolField) → PoolFieldResponse
                 │
                 ▼
           EntryPage / PublicEntryPage (local state: email, entryName, picks)
                 │
           validateEntryForm() ← ClubConfig + PoolRules
                 │
           apiClient.submitEntry(poolId, request)
                 │
                 ▼
           navigate('/confirmation', { state: { confirmation } })
```

### Leaderboard Display

```
useApi(getActivePool) → PoolSummary
  └─ useApi(getLeaderboard, { pollInterval: 300_000 })
       └─ LeaderboardData { standings[], last_scored_at }
            │
            ▼
       LeaderboardTable → LeaderboardStanding[] → GolferCell per pick
```

### Pool Creation (Coordinator)

```
CoordinatorRoute (Clerk auth guard)
  └─ PoolWizardPage (multi-step: format → config → review → publish)
       └─ useApi(getTournaments) → TournamentOption[]
            │
            ▼
       apiClient.createPool(CreatePoolRequest)
            │
            ▼
       navigate('/:clubCode/admin/pools/:poolId')
```

### Coordinator Dashboard

```
CoordinatorRoute
  └─ CoordinatorDashboardPage
       ├─ useApi(getPoolDetail) → PoolSummary
       ├─ useApi(getPoolEntries) → PoolEntriesResponse
       ├─ useApi(getPoolEvents) → PoolEventsPage
       ├─ useApi(getLockStatus) → PoolLockStatus
       └─ apiClient.downloadPoolEntriesCsv(poolId) → Blob
```

---

## Authentication

Authentication uses [Clerk](https://clerk.com). The `ClerkProvider` wraps the entire app in `App.tsx`.

- **Public routes**: no auth required
- **Coordinator routes**: wrapped in `CoordinatorRoute`, which checks Clerk session and redirects to `/:clubCode/admin/sign-in` if unauthenticated
- **Sign-up**: `/sign-up` uses Clerk's hosted sign-up; coordinators land there from the marketing page
- The Clerk publishable key is set via `VITE_CLERK_PUBLISHABLE_KEY`

The nginx CSP allows Clerk CDN domains (`clerk.io`, `clerk.accounts.dev`).

---

## State Management

The application uses no external state library. State is kept at the narrowest scope that works:

| Mechanism | Used For |
|-----------|----------|
| `useState` (component) | Form fields, async loading/error, UI toggles |
| `useApi` (hook) | Remote data — loading + error + data per resource |
| `useClubOutletContext()` | `ClubConfig` passed from `ClubRoot` → all child pages |
| `useLocation().state` | Entry confirmation passed from `EntryPage` to `ConfirmationPage` |
| Vite env vars | `SPORTS_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY` — build-time config |

No global store. The leaderboard polls every 5 minutes via `useApi`'s polling interval.

---

## Database Migrations

Migrations in `migrations/` target the `sports-data-admin` backend database. They establish tables required for frontend features:

| Migration | Table | Purpose |
|-----------|-------|---------|
| `001_pool_events.sql` | `pool_events` | Append-only audit log; RLS restricts reads; immutability trigger rejects updates/deletes |
| `002_tournaments.sql` | `tournaments` | Tournament config (name, year, cut_rule_type); seeds 5 major tournaments |
| `003_club_billing.sql` | `clubs` (columns) | Adds Stripe billing columns: `stripe_customer_id`, `billing_status`, `trial_used` |

---

## Directory Structure

```
club-golf-tools/
├── src/
│   ├── api/
│   │   ├── client.ts               # Singleton export (HttpApiClient | MockApiClient)
│   │   ├── http.ts                 # Production HTTP implementation
│   │   ├── types.ts                # ApiClient interface (22 methods) + API_ENDPOINTS
│   │   └── mock/
│   │       ├── adapters.ts         # In-memory mock for tests
│   │       └── data.ts             # Deterministic fixture data
│   ├── components/
│   │   ├── common/                 # LoadingState, ErrorState, EmptyState
│   │   ├── coordinator/            # ReferralWidget
│   │   ├── entry/                  # GolferPicker (RVCC), BucketPicker (Crestmont)
│   │   ├── layout/                 # Header, Footer, Layout, LockCountdownWidget
│   │   ├── leaderboard/            # LeaderboardTable, GolferCell
│   │   └── onboarding/             # OnboardingChecklist, UpgradePrompt
│   ├── config/
│   │   ├── clubs.ts                # CLUB_CONFIGS for RVCC and Crestmont
│   │   └── subdomain.ts            # Hostname → ClubCode
│   ├── engines/
│   │   └── wizardEngines.tsx       # Pool wizard UI step engine
│   ├── hooks/
│   │   ├── useApi.ts               # Generic async fetcher with polling
│   │   └── useClubConfig.ts        # Club config from subdomain
│   ├── pages/                      # All route-level components (public + coordinator)
│   ├── types/
│   │   └── domain.ts               # All shared domain types (314 lines)
│   ├── utils/
│   │   ├── fieldHelpers.ts         # Field response adapters for pickers
│   │   ├── formatting.ts           # Score, position, status display
│   │   ├── poolWizardUtils.ts      # Pool creation form helpers
│   │   └── validation.ts           # Entry form validation
│   ├── __tests__/                  # 32 test suites, ~468 tests
│   ├── App.tsx                     # Router tree + ClerkProvider
│   ├── main.tsx                    # React entry point
│   └── index.css
├── migrations/                     # Backend DB migrations (001–003)
├── scripts/
│   └── export-standings.ts         # Nightly golden file regression helper
├── docs/
│   ├── api-contracts.md            # All 22 backend endpoint signatures
│   ├── architecture.md             # This file
│   ├── design.md                   # Coding patterns and anti-patterns
│   ├── roadmap.md                  # Feature phases and acceptance criteria
│   ├── audits/                     # SSOT cleanup, security, and doc audit reports
│   └── research/                   # 12 research docs for future feature planning
├── .github/workflows/
│   ├── ci.yml                      # PR + main: lint → typecheck → test → build → deploy
│   └── nightly.yml                 # Daily standings snapshot regression test
├── docker-compose.yml              # Single service on 127.0.0.1:3002
├── nginx.conf                      # Reverse proxy, SPA fallback, security headers
├── vite.config.ts                  # Dev server, API proxy, test config
└── package.json
```

---

## CI/CD & Deployment

### CI Pipeline (`.github/workflows/ci.yml`)

On every PR and push to `main`:

1. **web**: `npm run lint` → `tsc --noEmit` → `npm test` → `npm run build`
2. **docker** (main only): build image → push to `ghcr.io`
3. **deploy** (main only): SSH to Hetzner → `docker compose up -d`

### Nightly (`.github/workflows/nightly.yml`)

Daily at 03:00 UTC: runs tests + build, generates standings snapshot via `scripts/export-standings.ts`, and diffs against the previous run. Unexpected drift fails the workflow.

### Docker

Two-stage build: Node 22 Alpine → nginx Alpine. Serves the Vite build at port 3002. nginx:

- Proxies `/api/*` to `https://sda.dock108.dev` with injected `X-API-Key`
- SPA fallback: `try_files $uri $uri/ /index.html`
- Static asset caching: 1-year for `/assets/`
- Security headers: CSP (allows Clerk CDN), HSTS, X-Frame-Options, Permissions-Policy

---

## Planned Platform Evolution

The next phase hardens multi-tenancy and self-serve onboarding. Key remaining work:

| Concern | Current State | Target State |
|---------|--------------|--------------|
| Club config | Hardcoded in `src/config/clubs.ts` | Backend-driven, fetched at runtime |
| Multi-tenancy | 2 clubs, hardcoded | N clubs via DB-driven config |
| Self-service entry | Gated by `allowSelfServiceEntry: false` | Enabled per pool after coordinator publishes |
| Pool locking | Lock status visible; auto-lock backend-driven | Hard lock at first tee time, automatic |
| Scoring | Backend always on | Deterministic engine, full recompute on demand |

See [docs/roadmap.md](roadmap.md) for full phase details and acceptance criteria.
