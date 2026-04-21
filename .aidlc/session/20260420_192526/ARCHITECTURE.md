# Architecture: club-golf-tools

## Overview

`club-golf-tools` is a React/TypeScript single-page application for hosting golf tournament pools at private country clubs. It currently supports two clubs (RVCC, Crestmont) for the Masters tournament and is being evolved into a **self-serve private pool hosting platform** that clubs can operate without manual intervention.

The frontend is intentionally thin: it handles entry collection, validation, and standings display. All scoring, qualification logic, and authoritative rule enforcement live in the `sports-data-admin` backend. The frontend never computes standings — it only renders what the backend returns.

Clubs are distinguished by subdomain (`rvcc.localhost`, `crestmont.localhost`). No user authentication exists; email is the entry identifier, and the backend enforces submission limits and deadlines.

---

## Key Components

### API Client Layer (`src/api/`)

The API layer is interface-driven for testability and environment separation.

| File | Responsibility |
|------|---------------|
| `types.ts` | `ApiClient` interface defining all 6 endpoints |
| `client.ts` | Singleton export — swaps `HttpApiClient` vs `MockApiClient` at build time |
| `http.ts` | `HttpApiClient` — production HTTP calls, response shape normalization, `X-API-Key` injection |
| `mock/adapters.ts` | `MockApiClient` — deterministic in-memory data, configurable latency, used in all tests |
| `mock/data.ts` | Fixture data aligned with domain types |

The Vite dev server proxies `/api/*` requests to `SPORTS_API_URL` and injects the `X-API-Key` header, so the browser never handles credentials directly.

### Club Configuration (`src/config/`)

| File | Responsibility |
|------|---------------|
| `clubs.ts` | `ClubConfig` objects per club — pick counts, bucket labels, UI copy, validation hints |
| `subdomain.ts` | Hostname → `ClubCode` mapping (`rvcc` / `crestmont`) |

`ClubConfig` is the frontend-side SSOT for UI presentation. The backend's `pool.rules_json` is the authoritative SSOT for scoring. These must stay manually synchronized.

### Pages (`src/pages/`)

| Page | Route | Purpose |
|------|-------|---------|
| `HomePage` | `/` | Club landing, quick links |
| `RulesPage` | `/rules` | Club-specific rules from `ClubConfig.rulesDescription` |
| `EntryPage` | `/entry` | Pick selection form, client-side validation, submission |
| `ConfirmationPage` | `/confirmation` | Post-submit receipt (populated via Router navigation state) |
| `LeaderboardPage` | `/leaderboard` | Live standings, polls every 5 minutes |
| `LookupPage` | `/lookup` | Email-based entry lookup |

`ClubRoot` establishes club context from the subdomain. `ClubOutlet` provides `ClubConfig` to all child pages via `useClubOutletContext()`.

### Entry Components (`src/components/entry/`)

| Component | Format | Club |
|-----------|--------|------|
| `GolferPicker` | Flat list — pick any N | RVCC |
| `BucketPicker` | Pick 1 from each of N buckets | Crestmont |

Both share a sticky bottom bar showing pick progress and the submit button. "Other" write-in golfers use negative `dg_id` values internally; the backend stores them as `dg_id=0` with an explicit `player_name`.

### Leaderboard Components (`src/components/leaderboard/`)

| Component | Responsibility |
|-----------|---------------|
| `LeaderboardTable` | Standings rows — rank, entry name, score, qualification badge |
| `GolferCell` | Per-pick display — score, position, thru, cut/WD/DQ status |

Sort order for picks: counted picks first → active over cut → by score → by name. No scoring math happens here; backend pre-computes `counts_toward_total` and `is_dropped`.

### Hooks (`src/hooks/`)

| Hook | Responsibility |
|------|---------------|
| `useApi<T>` | Generic async data fetcher — loading / error / data / refetch, optional polling interval |
| `useClubConfig` | Resolves current club from hostname via `subdomain.ts` |

### Utilities (`src/utils/`)

| File | Responsibility |
|------|---------------|
| `validation.ts` | `validateEntryForm()` — email format, name, pick count, bucket completeness |
| `formatting.ts` | Score display (+N / E / −N), position suffixes, status labels |

---

## Data Flow

### Entry Submission

```
Subdomain
  └─ useClubConfig() → ClubCode
       └─ useApi(getActivePool) → PoolSummary
            └─ useApi(getPoolField, [pool.id]) → FieldPlayer[] | FieldBucket[]
                 │
                 ▼
           EntryPage (local state: email, entryName, selectedIds, otherPlayers)
                 │
           validateEntryForm() ← ClubConfig + PoolRules
                 │
           apiClient.submitEntry(poolId, EntrySubmissionRequest)
                 │
                 ▼
           navigate('/confirmation', { state: { confirmation } })
                 │
                 ▼
           ConfirmationPage ← Router location.state
```

### Leaderboard Display

```
useApi(getActivePool) → PoolSummary
  └─ useApi(getLeaderboard, [pool.id], { pollInterval: 300_000 })
       └─ LeaderboardData { standings[], last_scored_at }
            │
            ▼
       LeaderboardTable
            └─ LeaderboardStanding[] → GolferCell per pick
```

### Entry Lookup

```
LookupPage (local state: email, result, loading, error)
  └─ apiClient.lookupEntries(poolId, email) → EntryLookupResult
       └─ EntryLookupEntry[] displayed inline
```

---

## State Management

The application uses no external state library. State is kept at the narrowest scope that works:

| Mechanism | Used For |
|-----------|----------|
| `useState` (component) | Form fields, async loading/error, UI toggles |
| `useApi` (hook) | Remote data — loading + error + data per resource |
| `useClubOutletContext()` | `ClubConfig` passed from `ClubRoot` → all pages |
| `useLocation().state` | Entry confirmation passed from `EntryPage` to `ConfirmationPage` |
| Vite env vars | `SPORTS_API_URL`, `SPORTS_API_KEY` — build-time secrets, never in state |

There is no global store. The leaderboard polls every 5 minutes via `useApi`'s polling interval. No optimistic updates, caching, or write-back logic exists on the frontend.

---

## Directory Structure

```
club-golf-tools/
├── src/
│   ├── api/
│   │   ├── client.ts               # Singleton export (HttpApiClient | MockApiClient)
│   │   ├── http.ts                 # Production HTTP implementation
│   │   ├── types.ts                # ApiClient interface + endpoint signatures
│   │   └── mock/
│   │       ├── adapters.ts         # In-memory mock for tests
│   │       └── data.ts             # Fixture data
│   ├── components/
│   │   ├── common/
│   │   │   ├── LoadingState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── entry/
│   │   │   ├── GolferPicker.tsx    # Flat pick format (RVCC)
│   │   │   └── BucketPicker.tsx    # Bucketed pick format (Crestmont)
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Layout.tsx
│   │   └── leaderboard/
│   │       ├── LeaderboardTable.tsx
│   │       └── GolferCell.tsx
│   ├── config/
│   │   ├── clubs.ts                # ClubConfig per club code
│   │   └── subdomain.ts            # Hostname → ClubCode
│   ├── hooks/
│   │   ├── useApi.ts
│   │   └── useClubConfig.ts
│   ├── pages/
│   │   ├── ClubRoot.tsx            # Club context resolver
│   │   ├── ClubOutlet.tsx          # Context provider
│   │   ├── PageWrappers.tsx        # Route → page connectors
│   │   ├── HomePage.tsx
│   │   ├── RulesPage.tsx
│   │   ├── EntryPage.tsx
│   │   ├── ConfirmationPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   └── LookupPage.tsx
│   ├── types/
│   │   └── domain.ts               # All shared domain types
│   ├── utils/
│   │   ├── formatting.ts
│   │   └── validation.ts
│   ├── __tests__/                  # 19 test files, ~347 tests
│   ├── App.tsx                     # Router tree
│   ├── main.tsx                    # React entry point
│   └── index.css
├── public/
├── docs/
│   └── research/                   # 12 research docs for next-phase planning
├── docker-compose.yml
├── nginx.conf                      # Reverse proxy (SPA fallback + /api passthrough)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Planned Platform Evolution

The next phase expands this into a multi-tenant self-serve platform. The architectural additions required are:

| Concern | Current State | Target State |
|---------|--------------|--------------|
| Auth | None (email only) | Club owner login (JWT or session) |
| Pool creation | Backend admin only | Self-serve UI |
| Entry input | Form submission | Form + validated CSV import |
| Scoring | Backend always on | Deterministic engine, replayable, no manual overrides |
| Pool config | Mutable until live | Immutable after lock time |
| Multi-tenancy | 2 hardcoded clubs | N clubs via DB-driven `ClubConfig` |
| Audit trail | None | Timestamped entry log, visible to club owners |
| Locking | Hardcoded timestamp | Hard lock at first tee time per tournament |

The frontend `ClubConfig` / backend `rules_json` duplication should collapse: the backend becomes the single source of truth, and the frontend fetches config at runtime rather than hardcoding it per club.
