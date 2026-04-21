# Code Cleanup Report — 2026-04-20

## Summary

Cleanup pass covering dead code, comment quality, consistency, file size, and duplicate utilities. All 468 tests pass and the production build succeeds after changes. No behavioral changes.

---

## Dead Code Removed

None found. No unused imports, commented-out blocks, or unreachable code existed in the source files audited.

---

## Duplicate Utilities Consolidated

### `buildGolferBucketMap` extracted in `src/utils/validation.ts`

**Problem:** The same logic to map `dg_id → bucket_number` was written inline twice:
- `validateCrestmontPicks` (was lines 58–63)
- `canAddGolfer` (was lines 164–169)

**Fix:** Extracted to a private helper `buildGolferBucketMap(buckets)` at the top of the file. Both callers now use it.

### `lastNameSort` / `fieldToGolfers` / `fieldToBuckets` (prior pass)

These were already extracted to `src/utils/fieldHelpers.ts` in a prior cleanup pass.

---

## Anti-Patterns Fixed

### Module-level mutable counter (`nextOtherId`) — `EntryPage.tsx` and `PublicEntryPage.tsx`

**Problem:** Both pages declared `let nextOtherId = -1` at module scope. This value persisted across component remounts and between the two pages, which could produce overlapping negative IDs in edge cases (e.g., server-side rendering, hot-reload, or simultaneous open tabs).

**Fix:** Moved to `useRef(-1)` inside each component, making the counter local to each component instance. The WHY comment was preserved and relocated to the `useRef` declaration.

Files changed:
- `src/pages/EntryPage.tsx` — `let nextOtherId` → `useRef`, added `useRef` to React import
- `src/pages/PublicEntryPage.tsx` — same

### `useEffect` dependency array in `ClubRoot.tsx`

**Problem:** The effect body referred to `clubConfig.code` but the ESLint exhaustive-deps rule saw `clubConfig` as the dependency. Using `clubConfig?.code` in the array is technically correct (only the code string matters) but triggers a lint warning because the object reference is what's in scope.

**Fix:** Extracted `const clubCode = clubConfig?.code` before the effect. The effect body and dependency array both use the primitive `clubCode`. No behavioral change — the effect still only re-runs when the club code string changes.

File changed: `src/pages/ClubRoot.tsx`

---

## Comment Quality

### `LockCountdownWidget.tsx`

**Problem:** Comment on the `setTimeout(() => setRemainingSeconds(null), 0)` call said "Wrap in setTimeout to satisfy react-hooks/set-state-in-effect — not synchronous in effect body". The rule name cited (`react-hooks/set-state-in-effect`) doesn't exist; the actual reason is that wrapping the call gives this branch a cleanup function (via `clearTimeout`), ensuring consistent cleanup return across all effect branches.

**Fix:** Updated to: "Defer via setTimeout so this branch returns a cleanup function that cancels the update on unmount"

---

## Minor

- Removed trailing blank line at end of `src/utils/formatting.ts`.

---

## Files Over 500 Lines

None. All source files are under 500 lines. Files closest to the threshold:

| File | Lines | Notes |
|------|-------|-------|
| `src/api/mock/data.ts` | 455 | Fixture data — expected size; watch for growth |
| `src/pages/PoolWizardPage.tsx` | 409 | Multi-step form; consider extracting step sub-components if it grows |
| `src/pages/EntryPage.tsx` | 345 | Acceptable for a form page with picker logic |
| `src/pages/PublicEntryPage.tsx` | 352 | Same |
| `src/api/http.ts` | 334 | One method per API endpoint — expected size |
| `src/types/domain.ts` | 314 | Type-only file — expected size |

`EntryPage` and `PublicEntryPage` share substantial JSX structure. They could be merged with a single validation-strategy prop, but that refactor is out of scope here.

---

## Consistency — No Issues Found

- No unused imports detected across source files
- No TODO/FIXME comments in production code
- No commented-out code blocks
- All naming conventions followed: PascalCase components, camelCase utils/hooks, `SCREAMING_SNAKE` for module-level constants
- All utility modules use named exports only (no default exports)
- Import ordering consistent throughout: library → types → api/hooks/utils → components

---

## Pre-existing Items Flagged for Follow-up (Out of Scope)

| File | Issue | Note |
|------|-------|------|
| `src/pages/EntryPage.tsx` + `PublicEntryPage.tsx` | ~150 lines of shared form logic | Could be extracted to a `useEntryForm` hook; deferred as a refactor, not cleanup |
| `src/api/mock/data.ts` | 455 lines of fixture data | Under the 500-line threshold but growing; could be split by domain (rvcc, crestmont, admin) |
