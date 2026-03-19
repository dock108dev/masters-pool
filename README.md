# Masters Pool Web

Golf country club pool frontend for the Masters tournament. Supports multiple clubs (RVCC, Crestmont) with shared components, club-specific rules, and a typed API client layer aligned with the [sports-data-admin](https://github.com/dock108dev/sports-data-admin) backend.

Currently runs against mock data. Swap one line in `src/api/client.ts` to connect to the real backend.

## Quick Start

```bash
npm install
npm run dev            # Dev server at http://localhost:5173
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report (v8)
npm run build          # Production build → dist/
```

## Club Configuration

Each club is defined in `src/config/clubs.ts` as a `ClubConfig` object controlling:

- **Pick rules**: number of golfers, bucket mode, cut minimums, scored count
- **UI labels**: club name, rules text, bucket labels, leaderboard column headers
- **Limits**: max entries per email

The frontend `ClubConfig` is for UI rendering and client-side validation. The backend's `pool.rules_json` is authoritative for scoring.

Routes are club-scoped: `/:clubCode/entry`, `/:clubCode/leaderboard`, etc. Root (`/`) redirects to `/rvcc`.

### RVCC
Pick any 7 golfers. At least 5 must make the cut. Best 5 scores count. Lowest aggregate wins.

### Crestmont
Pick 1 golfer from each of 6 buckets. At least 4 must make the cut. Best 4 scores count. Lowest aggregate wins.

## Backend API

The app consumes the `sports-data-admin` Golf Pools API via a typed `ApiClient` interface (`src/api/types.ts`):

| Method | Backend Endpoint | Description |
|---|---|---|
| `getActivePool(clubCode)` | `GET /api/golf/pools?club_code={code}&active_only=true` | Find the active pool for a club |
| `getPoolDetail(poolId)` | `GET /api/golf/pools/{poolId}` | Pool detail with rules and status |
| `getPoolField(poolId)` | `GET /api/golf/pools/{poolId}/field` | Selectable golfers (flat or bucketed) |
| `submitEntry(poolId, request)` | `POST /api/golf/pools/{poolId}/entries` | Submit entry with picks |
| `getLeaderboard(poolId)` | `GET /api/golf/pools/{poolId}/leaderboard` | Materialized standings |
| `lookupEntries(poolId, email)` | `GET /api/golf/pools/{poolId}/entries/by-email?email=...` | Look up entries by email |

The backend uses `X-API-Key` header authentication. All golfers are identified by DataGolf `dg_id` (number). Buckets use 1-indexed `bucket_number`. See `docs/api-contracts.md` for full request/response shapes.

### Swapping Mocks for Real API

1. Implement the `ApiClient` interface with `fetch` calls (endpoint patterns are in `API_ENDPOINTS`)
2. Update `src/api/client.ts` to export the new client instead of `MockApiClient`

Mock adapter and data are kept for tests.

## Project Structure

```
src/
  types/domain.ts           # All domain types (aligned with backend API shapes)
  config/clubs.ts           # ClubConfig for RVCC and Crestmont
  api/
    types.ts                # ApiClient interface + API_ENDPOINTS
    client.ts               # Active client instance (swap mock → real here)
    mock/
      adapters.ts           # MockApiClient with configurable latency
      data.ts               # Deterministic mock data
  components/
    layout/                 # Header, Footer, Layout
    common/                 # LoadingState, ErrorState, EmptyState
    leaderboard/            # LeaderboardTable, GolferCell
    entry/                  # GolferPicker (RVCC), BucketPicker (Crestmont)
  pages/                    # HomePage, RulesPage, EntryPage, ConfirmationPage,
                            # LeaderboardPage, LookupPage, ClubRoot, PageWrappers
  hooks/                    # useClubConfig, useApi
  utils/
    formatting.ts           # Score, position, thru display formatters
    validation.ts           # Email, name, pick count, bucket enforcement
  __tests__/                # Mirrors src/ structure
```

## Testing

```bash
npm run test              # 347 tests across 19 files
npm run test:coverage     # With v8 coverage report
```

Coverage areas:
- Club config driven rendering (RVCC vs Crestmont)
- Pick validation (count, duplicates, bucket enforcement)
- Leaderboard rendering (standings, golfer cells, qualification badges)
- Loading, error, and empty states
- Mock API adapter behavior and data consistency
- Page-level integration tests for all screens
- Formatting and validation helpers

## Key Design Decisions

- **No scoring logic in the frontend.** The backend computes rankings, qualification status, counted/dropped picks, and aggregate scores. The frontend only displays pre-computed results.
- **No authentication.** Entry submission uses email as identifier. The backend enforces entry limits and deadlines.
- **File upload is admin-only.** CSV bulk import is a backend admin feature, not a self-service frontend flow.
- **Club config is duplicated intentionally.** The frontend `ClubConfig` drives UI (labels, validation hints). The backend `rules_json` is authoritative for scoring. They must stay in sync manually.
