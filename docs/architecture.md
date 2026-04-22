# Architecture: club-golf-tools

## Overview

`club-golf-tools` is a React/TypeScript single-page application for hosting golf tournament pools at private country clubs. It supports two clubs (RVCC, Crestmont) and is being evolved into a **self-serve private pool hosting platform** that clubs can operate without manual intervention.

The frontend is intentionally thin for scoring: it handles entry collection, validation, standings display, and coordinator administration. All scoring, qualification logic, and authoritative rule enforcement live in the `sports-data-admin` backend. The frontend never computes standings — it only renders what the backend returns.

Club identity is resolved from the **hostname** — paths never carry a `clubCode`. Authentication uses Clerk for coordinator/admin access; public routes (entry, leaderboard, lookup) require no login.

---

## Key Components

### API Client Layer (`src/api/`)

The API layer is interface-driven for testability and environment separation.

| File | Responsibility |
|------|---------------|
| `types.ts` | `ApiClient` interface (36 methods) + `API_ENDPOINTS` constant map |
| `client.ts` | Singleton export — swaps `HttpApiClient` vs `MockApiClient` at build time |
| `http.ts` | `HttpApiClient` — production HTTP calls, `X-API-Key` injection |
| `mock/adapters.ts` | `MockApiClient` — deterministic in-memory data, used in all tests |
| `mock/data.ts` | Fixture data aligned with domain types |

The Vite dev server proxies `/api/*` requests to `SPORTS_API_URL` and injects the `X-API-Key` header. The browser never handles credentials directly.

### Host Classification (`src/config/`)

| File | Responsibility |
|------|---------------|
| `clubs.ts` | `CLUB_CONFIGS` — per-club UI config (pick counts, bucket labels, rules text) |
| `host.ts` | `classifyHost(hostname)` → `HostKind` union used by `App.tsx` to select the route tree |

`classifyHost` maps the current hostname to one of four routing intents:

| Hostname pattern | `HostKind` | Route tree |
|---|---|---|
| `countryclubpicks.com`, `localhost`, etc. | `{ kind: 'onboard' }` | Onboarding + marketing |
| `admin.*` | `{ kind: 'admin' }` | Platform superadmin dashboard |
| `rvcc.*`, `crestmont.*` | `{ kind: 'club', clubCode }` | Club public + coordinator routes |
| Anything else | `{ kind: 'unknown' }` | 404 / empty |

`ClubConfig` is the frontend-side SSOT for UI presentation and client-side validation. The backend's `pool.rules_json` is the authoritative SSOT for scoring. Both must remain synchronized.

Both clubs currently have `allowSelfServiceEntry: false` — entry submission is gated by this flag. Public entry links (`/enter/:poolToken`) bypass this gate.

### Pages (`src/pages/`)

**Onboarding / apex routes (no authentication):**

| Page | Path | Purpose |
|------|------|---------|
| `OnboardHomePage` | `/` | Marketing landing + claim-your-club form |
| `CheckoutPage` | `/checkout` | Stripe checkout redirect |
| `CheckoutSuccessPage` | `/checkout/success` | Post-payment club creation step |
| `OnboardingWizardPage` | `/admin/onboarding` | Multi-step pool-setup wizard (Clerk-protected) |

**Superadmin routes (HTTP Basic Auth at Caddy layer):**

| Page | Path | Purpose |
|------|------|---------|
| `SuperAdminDashboard` | `/` | Platform stats: MRR, total pools/entries, poll health |

**Club public routes (no authentication):**

| Page | Path | Purpose |
|------|------|---------|
| `HomePage` | `/` | Club landing |
| `RulesPage` | `/rules` | Club-specific rules from `ClubConfig.rulesDescription` |
| `EntryPage` | `/entry` | Pick selection form (gated by `allowSelfServiceEntry`) |
| `ConfirmationPage` | `/confirmation` | Post-submit receipt |
| `LeaderboardPage` | `/leaderboard` | Live standings, polls every 5 minutes |
| `EntryDetailPage` | `/leaderboard/entry/:entryId` | Individual entry detail |
| `LookupPage` | `/lookup` | Email-based entry lookup |
| `PublicEntryPage` | `/enter/:poolToken` | Public entry link — no login required |
| `PublicConfirmationPage` | `/enter/:poolToken/confirmation` | Public entry confirmation |
| `AdminSignInPage` | `/admin/sign-in` | Clerk sign-in for coordinators |

**Club coordinator routes (Clerk authentication via `ProtectedRoute`):**

| Page | Path | Purpose |
|------|------|---------|
| `PoolListingPage` | `/admin` or `/admin/pools` | All pools for the club |
| `PoolWizardPage` | `/admin/pools/new` | Multi-step pool creation wizard |
| `CoordinatorDashboardPage` | `/admin/pools/:poolId` | Entries, events, CSV export for a pool |
| `BrandingSettingsPage` | `/admin/branding` | Club logo and color settings |
| `BillingPage` | `/admin/billing` | Stripe billing & subscription status |

`ClubRoot` resolves club context from the hostname. `ClubOutlet` provides `ClubConfig` to all child pages via `useClubOutletContext()`.

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

### Coordinator & Onboarding Components

| Component | Responsibility |
|-----------|---------------|
| `coordinator/ReferralWidget` | Referral code display and sharing |
| `onboarding/WizardShell` | 3-step wizard container for onboarding |
| `onboarding/OnboardingChecklist` | Post-signup checklist for new coordinators |
| `onboarding/SlugAvailabilityInput` | Real-time slug validation (debounced `checkSlugAvailability`) |
| `onboarding/UpgradePrompt` | Billing upgrade prompt on trial expiry |

### Hooks (`src/hooks/`)

| Hook | Responsibility |
|------|---------------|
| `useApi<T>` | Generic async data fetcher — loading / error / data / refetch, optional polling |
| `useAnalytics` | PostHog event capture wrapper (no-ops when `VITE_POSTHOG_KEY` absent) |
| `useClubConfig` | Resolves current club from hostname via `classifyHost` |
| `useCoordinatorAuth` | Clerk auth state + sign-in redirect |
| `usePendingClub` | Fetches pending club state during onboarding |
| `usePersistedState<T>` | localStorage-backed `useState` |
| `usePlayerRoster` | Fetches tournament player list for the onboarding wizard |
| `useTournamentLeaderboard` | Fetches live tournament scores for the superadmin dashboard |

### Utilities (`src/utils/`)

| File | Responsibility |
|------|---------------|
| `validation.ts` | `validateEntryForm()` — email, name, pick count, bucket completeness |
| `formatting.ts` | Score display (+N / E / −N), position suffixes, status labels |
| `fieldHelpers.ts` | `fieldToGolfers()`, `fieldToBuckets()` — adapts API field shape to picker UI shape |
| `poolWizardUtils.ts` | Pool creation form validation and helpers |

### Engines (`src/engines/`)

| File | Responsibility |
|------|---------------|
| `wizardEngines.tsx` | Plug-in registry for pool creation formats. The Golf engine (flat + bucketed) is registered by default. Exports `ConfigFields` and `Step3Fields` React components used by `PoolWizardPage`. |

---

## Data Models

All types live in `src/types/domain.ts`. Key types:

| Type | Purpose |
|------|---------|
| `ClubCode` | `'rvcc' \| 'crestmont'` |
| `PoolStatus` | `'draft' \| 'open' \| 'locked' \| 'live' \| 'final' \| 'archived'` |
| `GolferStatus` | `'active' \| 'cut' \| 'wd' \| 'dq'` |
| `QualificationStatus` | `'qualified' \| 'pending' \| 'not_qualified'` |
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
| `PendingClub` | In-progress onboarding club (slug, name, step, session ID) |

Types for onboarding and checkout also live in `src/api/types.ts`: `SlugCheckResponse`, `PendingClub`, `VerifySessionResponse`, `CreateClubRequest/Response`, `OnboardingWizardSubmitRequest/Response`, `SendInvitesRequest`.

---

## Data Flows

### Entry Submission

```
Hostname
  └─ classifyHost() → ClubCode
       └─ ClubRoot → ClubConfig (via ClubOutlet)
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

After 3 consecutive polling failures, a degraded-data banner is shown.

### Pool Creation (Coordinator)

```
ProtectedRoute (Clerk auth guard)
  └─ PoolWizardPage (3 steps: format → config → review/publish)
       └─ useApi(getTournaments) → TournamentOption[]
            │
       wizardEngines registry → Golf engine → ConfigFields / Step3Fields
            │
            ▼
       apiClient.createPool(CreatePoolRequest) → PoolSummary
            │
            ▼
       navigate('/admin/pools/:poolId')
```

### Coordinator Dashboard

```
ProtectedRoute
  └─ CoordinatorDashboardPage
       ├─ useApi(getPoolDetail) → PoolSummary
       ├─ useApi(getPoolEntries) → PoolEntriesResponse
       ├─ useApi(getPoolEvents) → PoolEventsPage
       ├─ useApi(getLockStatus) → PoolLockStatus
       ├─ apiClient.lockPool / unlockPool → PoolSummary
       ├─ apiClient.sendPoolInvites → void
       └─ apiClient.downloadPoolEntriesCsv(poolId) → Blob
```

### Onboarding Flow (Apex Host)

```
OnboardHomePage → submitClubClaim → ClubClaimResponse (lead capture)

  OR (self-serve conversion):

OnboardHomePage → createCheckoutSession → { session_url }
  └─ Stripe Checkout (external)
       └─ /checkout/success?session_id=...
            └─ verifyCheckoutSession → VerifySessionResponse
                 │  (status: 'provisioned')
                 ▼
            createClub({ session_id, club_name, slug })
                 └─ /admin/onboarding (Clerk-protected)
                      └─ OnboardingWizardPage → submitOnboardingWizard
                           └─ OnboardingWizardSubmitResponse { pool_id, pool_token, entry_url }
```

### Branding Application

```
ClubRoot.mount()
  └─ apiClient.getClubBranding(clubCode)
       ├─ success → set CSS custom properties (--club-primary, --club-accent)
       └─ error   → apply hard-coded defaults (console.warn emitted)
```

---

## Authentication

Authentication uses [Clerk](https://clerk.com). `ClerkProvider` wraps the entire app in `App.tsx`.

| Route type | Auth mechanism |
|---|---|
| Public club routes | None required |
| Coordinator routes (`/admin/*` on club hosts) | `ProtectedRoute` — Clerk session; redirects to `/admin/sign-in` if absent |
| Onboarding wizard (`/admin/onboarding`) | Clerk session via `useCoordinatorAuth` |
| Superadmin (`admin.*` host) | HTTP Basic Auth at the Caddy edge layer |

The Clerk publishable key is set via `VITE_CLERK_PUBLISHABLE_KEY`. The nginx CSP allows Clerk CDN domains (`clerk.io`, `clerk.accounts.dev`).

---

## State Management

The application uses no external state library. State is kept at the narrowest scope that works:

| Mechanism | Used For |
|-----------|----------|
| `useState` (component) | Form fields, async loading/error, UI toggles |
| `useApi` (hook) | Remote data — loading + error + data per resource |
| `useClubOutletContext()` | `ClubConfig` + active pool passed from `ClubRoot` to all child pages |
| `usePersistedState` | Wizard step progress persisted across page reloads (localStorage) |
| `useLocation().state` | Entry confirmation passed from `EntryPage` to `ConfirmationPage` |
| Vite env vars | `SPORTS_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY` — dev-time config |

No global store. The leaderboard polls every 5 minutes via `useApi`'s `pollInterval` option.

---

## Database Migrations

Migrations in `migrations/` target the `sports-data-admin` backend database:

| Migration | Table | Purpose |
|-----------|-------|---------|
| `001_pool_events.sql` | `pool_events` | Append-only audit log; immutability trigger rejects updates/deletes |
| `002_tournaments.sql` | `tournaments` | Tournament config (name, year, cut_rule_type); seeds 5 major tournaments |
| `003_club_billing.sql` | `clubs` (columns) | Adds Stripe billing columns: `stripe_customer_id`, `billing_status`, `trial_used` |

---

## Directory Structure

```
club-golf-tools/
├── src/
│   ├── api/
│   │   ├── client.ts               # Singleton export (HttpApiClient | MockApiClient)
│   │   ├── http.ts                 # Production HTTP implementation (36 methods)
│   │   ├── types.ts                # ApiClient interface (36 methods) + API_ENDPOINTS
│   │   └── mock/
│   │       ├── adapters.ts         # In-memory mock for tests
│   │       └── data.ts             # Deterministic fixture data
│   ├── components/
│   │   ├── auth/                   # ProtectedRoute (Clerk session guard)
│   │   ├── common/                 # LoadingState, ErrorState, EmptyState
│   │   ├── coordinator/            # ReferralWidget
│   │   ├── entry/                  # GolferPicker (RVCC), BucketPicker (Crestmont), SlotDropdown
│   │   ├── layout/                 # Header, Footer, Layout, LockCountdownWidget
│   │   ├── leaderboard/            # LeaderboardTable, GolferCell
│   │   └── onboarding/             # WizardShell, OnboardingChecklist, SlugAvailabilityInput, UpgradePrompt
│   ├── config/
│   │   ├── clubs.ts                # CLUB_CONFIGS for RVCC and Crestmont
│   │   └── host.ts                 # classifyHost() → HostKind (routing intent from hostname)
│   ├── engines/
│   │   └── wizardEngines.tsx       # Pool wizard engine registry (Golf engine registered)
│   ├── hooks/
│   │   ├── useApi.ts               # Generic async fetcher with optional polling
│   │   ├── useAnalytics.ts         # PostHog wrapper
│   │   ├── useClubConfig.ts        # Club config from hostname
│   │   ├── useCoordinatorAuth.ts   # Clerk auth + redirect
│   │   ├── usePendingClub.ts       # Pending onboarding club state
│   │   ├── usePersistedState.ts    # localStorage-backed useState
│   │   ├── usePlayerRoster.ts      # Tournament player list
│   │   └── useTournamentLeaderboard.ts  # Live tournament scores
│   ├── pages/
│   │   ├── onboard/                # OnboardHomePage, CheckoutPage, CheckoutSuccessPage, OnboardingWizardPage
│   │   ├── superadmin/             # SuperAdminDashboard
│   │   ├── admin/                  # AdminSignInPage
│   │   ├── PageWrappers.tsx        # Context-injection wrappers for all club pages
│   │   └── *.tsx                   # Club pages (Entry, Leaderboard, Lookup, PoolWizard, etc.)
│   ├── types/
│   │   └── domain.ts               # All shared domain types
│   ├── utils/
│   │   ├── fieldHelpers.ts         # Field response adapters for pickers
│   │   ├── formatting.ts           # Score, position, status display
│   │   ├── poolWizardUtils.ts      # Pool creation form helpers
│   │   └── validation.ts           # Entry form validation
│   ├── __tests__/                  # Vitest test suites (pages + utils)
│   ├── App.tsx                     # Router tree + ClerkProvider + host classification
│   ├── main.tsx                    # React entry point
│   └── index.css
├── migrations/                     # Backend DB migrations (001–003)
├── scripts/
│   └── export-standings.ts         # Nightly golden file regression helper
├── docs/
│   ├── api-contracts.md            # All 36 backend endpoint signatures
│   ├── architecture.md             # This file
│   ├── braindump.md                # Strategic vision for the self-serve platform
│   ├── design.md                   # Coding patterns and anti-patterns
│   ├── roadmap.md                  # Feature phases and acceptance criteria
│   ├── audits/                     # SSOT, security, error-handling, and doc audit reports
│   └── research/                   # 31 research docs for feature planning
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

| Concern | Current State | Target State |
|---------|--------------|--------------|
| Club config | Hardcoded in `src/config/clubs.ts` | Backend-driven, fetched at runtime |
| Multi-tenancy | 2 clubs, hardcoded | N clubs via DB-driven config |
| Self-service entry | `allowSelfServiceEntry: false` | Enabled per pool after coordinator publishes |
| Pool locking | Lock status visible; auto-lock backend-driven | Hard lock at first tee time, automatic |

See [docs/roadmap.md](roadmap.md) for full phase details and acceptance criteria.
