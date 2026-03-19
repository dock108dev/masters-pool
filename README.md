# Masters Pool Web

Golf country club pool web app supporting multiple clubs (RVCC, Crestmont) with shared architecture, club-specific rules, and mock-backed API layer.

## Quick Start

```bash
npm install
npm run dev          # Start dev server
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run build        # Production build
```

## Club Configuration

Each club is driven by a `ClubConfig` object in `src/config/clubs.ts`. The config controls:

- **Pick rules**: number of golfers, bucket mode, cut minimums, counted scores
- **UI labels**: club name, rules text, bucket labels, leaderboard column headers
- **Features**: file upload enabled/required, max entries per email

Routes are club-scoped: `/:clubCode/entry`, `/:clubCode/leaderboard`, etc. The app defaults to `/rvcc`.

### RVCC Rules
- Pick any 7 golfers. At least 5 must make the cut. Best 5 scores count.

### Crestmont Rules
- Pick 1 golfer from each of 6 buckets. At least 4 must make the cut. Best 4 scores count.

To add a new club: add a new entry to `CLUB_CONFIGS` in `src/config/clubs.ts`.

## API Contracts

The app consumes an `ApiClient` interface (`src/api/types.ts`) with these endpoints:

| Method | Description |
|---|---|
| `getActiveTournament(clubCode)` | Get active tournament for a club |
| `getTournamentDetail(id)` | Get tournament detail |
| `getAvailableGolfers(id)` | Get selectable golfers |
| `getGolferBuckets(id)` | Get bucket-grouped golfers (Crestmont) |
| `submitEntry(request)` | Submit a pool entry |
| `getLeaderboard(id)` | Get live leaderboard data |
| `lookupEntries(clubCode, email)` | Look up entries by email |
| `uploadFile(file, entryId)` | Upload entry form file |

All request/response types are in `src/types/domain.ts`.

## Swapping Mock APIs for Real APIs

1. Create a new class implementing `ApiClient` (e.g., `HttpApiClient`) that calls real endpoints
2. Update `src/api/client.ts` to instantiate `HttpApiClient` instead of `MockApiClient`
3. Endpoint URL patterns are defined in `src/api/types.ts` (`API_ENDPOINTS`)

The mock adapter (`src/api/mock/adapters.ts`) and mock data (`src/api/mock/data.ts`) can be kept for testing.

## Project Structure

```
src/
  types/domain.ts          # All domain types
  config/clubs.ts          # Club configurations
  api/
    types.ts               # ApiClient interface + endpoint URLs
    client.ts              # Active API client (swap here)
    mock/
      adapters.ts          # MockApiClient implementation
      data.ts              # Deterministic mock data
  components/
    layout/                # Header, Footer, Layout
    common/                # LoadingState, ErrorState, EmptyState
    leaderboard/           # LeaderboardTable, GolferCell
    entry/                 # GolferPicker, BucketPicker, FileUpload
  pages/                   # HomePage, RulesPage, EntryPage, etc.
  hooks/                   # useClubConfig, useApi
  utils/
    formatting.ts          # Display formatters
    validation.ts          # Entry form validators
  __tests__/               # All test files mirroring src structure
```

## Testing

```bash
npm run test              # Run all tests
npm run test:coverage     # Run with coverage report
```

349 tests across 20 test files covering:
- Club config validation
- Entry form validation (RVCC open pick, Crestmont bucket-based)
- Duplicate pick prevention and bucket enforcement
- Leaderboard rendering (golfer cells, qualification badges, column headers)
- Loading / error / empty states
- Mock API adapter behavior
- Mock data consistency
- Page-level integration tests for all major pages
- Formatting helpers
