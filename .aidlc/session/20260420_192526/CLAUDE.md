# CLAUDE.md — club-golf-tools

## Project Identity

**Name:** Masters Pool Web (`masters-pool-web`)
**Stack:** React 19, TypeScript 5, Vite 8, Vitest 4, React Router 7
**What it does:** Golf pool frontend for the Masters tournament. Multiple clubs (RVCC, Crestmont) share components but have different pick rules. Users submit entries, view a scored leaderboard, and look up past entries by email.

The app runs against mock data by default. Swapping to the real backend (`sports-data-admin`) is a one-line change in `src/api/client.ts`.

## Style

- **TypeScript strict mode** is on. No `any`, no `@ts-ignore` without a comment explaining why.
- No unused locals or parameters — the compiler will reject them. Prefix intentionally-unused params with `_`.
- ES modules throughout (`"type": "module"` in package.json).
- Target: ES2023. JSX transform: `react-jsx` (no explicit React import needed in JSX files).
- No Prettier config — ESLint enforces code quality. Run `npm run lint` before committing.
- Line length: keep lines under 100 characters where practical; no hard formatter enforces it.
- No default exports from utility modules. Named exports only.

## Naming

| Thing | Convention | Example |
|---|---|---|
| Files (components) | PascalCase `.tsx` | `LeaderboardTable.tsx` |
| Files (utils/hooks/api) | camelCase `.ts` | `formatting.ts`, `useApi.ts` |
| Test files | mirror source name + `.test.ts(x)` | `LeaderboardTable.test.tsx` |
| React components | PascalCase | `GolferCell` |
| Hooks | `use` prefix, camelCase | `useClubConfig` |
| Types / interfaces | PascalCase | `LeaderboardStanding` |
| Variables/functions | camelCase | `aggregateScore` |
| Constants | camelCase (local) or `SCREAMING_SNAKE` for module-level | `API_ENDPOINTS` |
| CSS classes | kebab-case (inline Tailwind or plain CSS) | `golfer-cell--cut` |

Backend API fields use `snake_case` — preserve that casing in domain types that mirror API shapes. Frontend-only types use camelCase.

## Testing

**Framework:** Vitest 4 with `@testing-library/react`, `jsdom`, and `@testing-library/jest-dom`.

```bash
npm test               # run all 347 tests once
npm run test:watch     # watch mode
npm run test:coverage  # coverage report (v8, HTML output)
```

**Test file location:** `src/__tests__/` mirroring `src/` structure. A component at `src/components/leaderboard/LeaderboardTable.tsx` gets a test at `src/__tests__/components/leaderboard/LeaderboardTable.test.tsx`.

**Rules:**
- Every new component, hook, or utility function gets a test file.
- Use `MockApiClient` (from `src/api/mock/adapters.ts`) in component tests — never mock `fetch` directly.
- Deterministic mock data lives in `src/api/mock/data.ts`. Add new fixtures there; don't inline large data objects in test files.
- Test club-specific behavior separately for RVCC (flat picks) and Crestmont (bucketed picks).
- `tsconfig.app.json` excludes `src/__tests__` — the test config is separate. Keep test-only imports out of source files.

## Dependencies

**What's allowed:**
- React ecosystem packages (routing, testing library).
- Utility libraries with zero runtime overhead (e.g., type-only imports).
- New dependencies need a clear reason — open an issue or PR description explaining the trade-off.

**What's banned:**
- No CSS-in-JS libraries (no `styled-components`, `emotion`).
- No state management libraries (Redux, Zustand, Jotai) — React context + hooks is sufficient.
- No date libraries (the only date handling needed is ISO string display).
- No UI component libraries — components are hand-written to match club branding.

**Adding a new dependency:**
```bash
npm install <package>          # runtime dep
npm install -D <package>       # dev dep
```
Always commit `package-lock.json`. CI runs `npm ci` — the lock file is authoritative.

## Git

**Branch naming:** `<type>/<short-description>` — e.g., `feat/bucket-picker-validation`, `fix/leaderboard-rank-tie`, `chore/update-vite`.

**Commit message format:** Conventional Commits.
```
<type>(<scope>): <short summary>

# Types: feat, fix, refactor, chore, test, docs, ci
# Scope: optional, e.g. leaderboard, entry, api, config
```
Examples:
- `feat(entry): enforce bucket pick validation client-side`
- `fix(leaderboard): show T prefix for tied ranks`
- `chore: update Vite to 8.1`

**PR conventions:**
- PRs target `main`. There is no staging branch.
- CI must pass (lint → typecheck → test → build) before merge.
- Pushing to `main` triggers Docker image build and deploy to Hetzner automatically.

## Dev Setup

```bash
git clone https://github.com/dock108dev/masters-pool-web
cd masters-pool-web
npm install
npm run dev       # http://localhost:5173
```

The app defaults to `MockApiClient` — no backend needed for development. To connect to the real backend, set `VITE_API_BASE_URL` and swap the export in `src/api/client.ts`.

**Env vars:**
- `VITE_API_BASE_URL` — backend base URL (optional; mock is used when absent)
- `SPORTS_API_KEY` — injected by nginx in production for backend auth; not needed locally

**Docker (optional):**
```bash
docker compose up
```
Runs the nginx-served production build on port 3002.

## Important Rules

1. **Backend types are authoritative.** `src/types/domain.ts` mirrors the `sports-data-admin` API shapes. All golfers are identified by `dg_id` (number). Buckets are 1-indexed `bucket_number`. Never change these without a corresponding backend change.

2. **`ClubConfig` is UI-only.** `src/config/clubs.ts` drives rendering and client-side validation only. Scoring rules live in the backend's `pool.rules_json`. Do not move scoring logic to the frontend.

3. **The `ApiClient` interface is a seam.** `src/api/types.ts` defines the interface. `MockApiClient` and `HttpApiClient` both implement it. Tests must use `MockApiClient` — never mock `fetch` or import `HttpApiClient` in tests.

4. **Routes are club-scoped.** All user-facing routes are prefixed `/:clubCode/`. The root `/` redirects to `/rvcc`. New pages must follow this pattern.

5. **No scoring in the frontend.** `aggregate_score`, `rank`, and `qualification_status` come from the backend leaderboard endpoint. Display them; don't recompute them.

6. **CI is the gate.** The pipeline runs `lint → tsc --noEmit → vitest → vite build` in order. All four must pass. Do not skip TypeScript errors with `as any` or non-null assertions to make CI green.

7. **Mock data is deterministic.** `src/api/mock/data.ts` uses fixed seeds and static arrays. Tests that assert on leaderboard order, picks, or standings depend on this. Don't randomize mock data.
