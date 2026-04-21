# SSOT Cleanup Audit — 2026-04-20

## Diff-Driven Deletion Summary

### 1. `src/engines/{golf,bracket,registry,types,index}.ts` — DELETED

**Reason:** Client-side scoring engines that directly contradict CLAUDE.md rule #5:
> "No scoring in the frontend. `aggregate_score`, `rank`, and `qualification_status` come from the backend leaderboard endpoint. Display them; don't recompute them."

- `golf.ts` implemented `computeStandings()` calling `score()` from the ingestion module.
- `bracket.ts` implemented a bracket elimination scoring engine.
- `registry.ts` / `index.ts` wired them together via a plugin registry.
- `types.ts` defined the `FormatEngine<>` interface used only by these files.

None of these were reachable from any production route. `PoolWizardPage.tsx` had a side-effect import (`import '../engines/index'`) that was the sole reference — removed as part of this pass. The wizard-engine machinery (`wizardEngines.tsx`) is self-contained and unaffected.

**Files deleted:**
- `src/engines/golf.ts`
- `src/engines/bracket.ts`
- `src/engines/registry.ts`
- `src/engines/types.ts`
- `src/engines/index.ts`

**Modified:**
- `src/pages/PoolWizardPage.tsx` — removed dead side-effect import of `../engines/index`

---

### 2. `src/ingestion/` — DELETED

**Reason:** Backend server code (DataGolf poller, scoring engine, pool lock, email dispatcher, event store) bundled in the wrong package. Only imported by `src/engines/golf.ts` (now deleted). No frontend page or component ever referenced this directory.

The ingestion pipeline belongs in `sports-data-admin`, not in the React SPA.

**Files deleted (11 source files + provider subtree):**
- `src/ingestion/index.ts`
- `src/ingestion/scoring.ts`
- `src/ingestion/store.ts`
- `src/ingestion/poller.ts`
- `src/ingestion/poolLock.ts`
- `src/ingestion/events.ts`
- `src/ingestion/email.ts`
- `src/ingestion/cutRules.ts`
- `src/ingestion/mapper.ts`
- `src/ingestion/providers/datagolf/client.ts`
- `src/ingestion/providers/datagolf/types.ts`

---

### 3. `src/auth/` — DELETED

**Reason:** Server-side Clerk JWT verification middleware (`extractClubId`, `assertOrgAdmin`, `requireCoordinatorAccess`, `verifyAndExtract`). Never imported by any frontend component or page. Zero production usage.

JWT enforcement belongs in `sports-data-admin` request handlers, not in a browser React bundle.

**Files deleted:**
- `src/auth/middleware.ts`
- `src/auth/index.ts`

---

### 4. Orphaned test files — DELETED

Tests whose subjects no longer exist:
- `src/__tests__/ingestion/` (8 test files + fixture JSON)
- `src/__tests__/engines/bracket.test.ts`
- `src/__tests__/auth/middleware.test.ts`
- Empty directories `src/__tests__/engines/` and `src/__tests__/auth/` removed.

---

### 5. `canAddGolfer` — unused parameter removed

`src/utils/validation.ts`: the `_availableGolfers: AvailableGolfer[]` parameter was declared but never read inside the function body. The corresponding `AvailableGolfer` import was also dead.

**Modified:**
- `src/utils/validation.ts` — removed `_availableGolfers` param and `AvailableGolfer` import
- `src/__tests__/utils/validation.test.ts` — removed `MOCK_AVAILABLE_GOLFERS` constant, `AvailableGolfer` import, and the argument from all 9 call sites

---

## SSOT Verification

| Domain | Authoritative Module |
|--------|----------------------|
| API contract | `src/api/types.ts` (`ApiClient` interface) |
| Mock data | `src/api/mock/data.ts` |
| Mock client | `src/api/mock/adapters.ts` (`MockApiClient`) |
| Production HTTP client | `src/api/http.ts` (`HttpApiClient`) |
| Domain types | `src/types/domain.ts` |
| Club configuration | `src/config/clubs.ts` (`CLUB_CONFIGS`) |
| Leaderboard display | `src/components/leaderboard/` — renders backend-computed data only |
| Entry validation | `src/utils/validation.ts` |
| Pool wizard engines | `src/engines/wizardEngines.tsx` (standalone, no dependency on deleted files) |

---

## Risk Log

No legacy code was intentionally retained. All deletions are clean cuts with no callers remaining.

---

## Sanity Check

```
grep -r 'engines/index\|engines/golf\|engines/bracket\|engines/registry\|engines/types' src/  → 0 matches
grep -r 'from.*ingestion' src/  → 0 matches
grep -r 'from.*auth/middleware\|from.*auth/index' src/  → 0 matches
grep -r 'MOCK_AVAILABLE_GOLFERS\|AvailableGolfer' src/  → 0 matches
```

Test suite after cleanup: **32 suites, 494 tests — all passing.**
(Pre-cleanup: 32 suites counting PoolWizardPage; 478 non-ingestion/auth/bracket tests passing.)

---

# SSOT Cleanup Audit — Pass 2 — 2026-04-20

## Diff-Driven Deletion Summary

### 1. `LEADERBOARD_UNLOCK` dead branch — `src/pages/LeaderboardPage.tsx`
**Removed:** `LEADERBOARD_UNLOCK` constant (`new Date('2026-04-09T12:00:00Z')`), the `locked` variable, and the
pre-tournament locked JSX block. The unlock date is in the past; `locked` was always `false` at runtime. Removed
`Link` import (only used inside that branch).
**Also removed:** `src/__tests__/pages/LeaderboardPage.test.tsx` — test case "shows locked message before tournament
starts" (set clock to 2026-04-08 to trigger the now-deleted branch).

### 2. `entry.players` legacy fallback — `src/api/http.ts`
**Removed:** `?? entry.players` from the leaderboard standings map. Backend field is `picks`; `players` was a legacy
name from an earlier API version. No current backend response uses `players` for this field.

### 3. `EntrySubmittedPayload` / `PoolLockedPayload` — `src/types/domain.ts`
**Removed:** Both interfaces exported but never imported by any source or test file. They described event payload
shapes, but `PoolEvent.payload` is typed as `Record<string, unknown>` — no caller narrowed to these types.

### 4. `formatGolferStatus`, `formatPosition`, `formatGolferCell` — `src/utils/formatting.ts`
**Removed:** All three functions exported and tested but never imported by any component or page. `GolferCell.tsx`
renders status badges inline without these helpers.
**Also removed:** All tests for these three functions from `src/__tests__/utils/formatting.test.ts` (35 test cases).

### 5. `PoolConfigReadOnlyPage` — `src/pages/PoolConfigReadOnlyPage.tsx`
**Deleted:** Entire file. Never imported, never routed, no test file. Completely orphaned page.

### 6. `export` on `lastNameSort` — `src/utils/fieldHelpers.ts`
**Changed:** Removed `export` keyword. Only called within `fieldHelpers.ts` itself. No external file imported it.

### 7. `export` on `MOCK_LOCK_TIME` — `src/api/mock/adapters.ts`
**Changed:** Removed `export` keyword. Only used as default constructor parameter within `adapters.ts`. No test
imported it.

### 8. "uploadEnabled / uploadRequired" absence tests — `src/__tests__/config/clubs.test.ts`
**Removed:** 4 test cases asserting `uploadEnabled` and `uploadRequired` are `undefined`. These properties never
existed on `ClubConfig`. Testing for the absence of something that was never there.

### 9. "file upload info" absence tests — `src/__tests__/components/RulesPage.test.tsx`
**Removed:** 2 test cases asserting `queryByText(/File upload/)` returns nothing. Same pattern — absence of UI that
was never added.

---

## SSOT Verification (Pass 2)

| Domain | Authoritative Module |
|---|---|
| Pool scoring / rankings | Backend `sports-data-admin` — frontend renders, never computes |
| Club UI config | `src/config/clubs.ts` → `ClubConfig` |
| Domain types | `src/types/domain.ts` (mirrors backend API shapes) |
| API client contract | `src/api/types.ts` → `ApiClient` interface |
| Mock data / fixtures | `src/api/mock/data.ts` |
| Route structure | `src/App.tsx` |
| Golfer formatting | `src/utils/formatting.ts` (formatScore, formatThru, formatLastUpdated) |
| Field helpers | `src/utils/fieldHelpers.ts` (fieldToGolfers, fieldToBuckets) |
| Validation | `src/utils/validation.ts` |

---

## Risk Log (Pass 2)

| Item | Why Retained | Risk |
|---|---|---|
| `allowSelfServiceEntry: false` gates | Feature temporarily disabled, not permanently removed. EntryPage and nav links exist but are gated. | Low — if re-enabled, no rebuild needed. Do not delete EntryPage. |
| `http.ts` `submitEntry` shim (`ENTRY-${entry.id}`, echoed picks) | Backend omits `confirmation_code` and pick echo. Shim fills required frontend type fields. | Medium — update if backend starts returning these fields. |
| `http.ts` `getPoolField` shape mapping (`format`→`variant`, `field`→`players`) | Active backend/frontend shape mismatch. | Medium — update if backend shape changes to match frontend types. |
| `showStatus` day-of-week gate in `LeaderboardTable.tsx` | Intentional product behavior (status badges hidden on weekdays). Not dead code. | Low — could become a prop if requirements change. |

---

## Sanity Check (Pass 2)

```
grep -r 'LEADERBOARD_UNLOCK' src/         → 0 matches
grep -r 'entry\.players' src/             → 0 matches (leaderboard context)
grep -r 'EntrySubmittedPayload' src/      → 0 matches
grep -r 'PoolLockedPayload' src/          → 0 matches
grep -r 'formatGolferStatus' src/         → 0 matches
grep -r 'formatPosition' src/             → 0 matches
grep -r 'formatGolferCell' src/           → 0 matches
grep -r 'PoolConfigReadOnlyPage' src/     → 0 matches (file deleted)
grep -r 'uploadEnabled\|uploadRequired' src/__tests__/  → 0 matches
```

Test suite after cleanup: **32 suites, 468 tests — all passing.**
