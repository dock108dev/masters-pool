# ISSUE-012: WD/DQ & Edge Case UI Handling

**Priority**: medium
**Labels**: phase-3, frontend, edge-cases
**Dependencies**: ISSUE-003, ISSUE-004
**Status**: implemented

## Description

Ensure the frontend `LeaderboardTable` and `GolferCell` components render gracefully for all player status values: WD (withdrawal mid-tournament), DQ (disqualification), and ties at the exact cut line. Add empty-state components for pools with no entries, no active tournament, and pre-tournament state.

## Acceptance Criteria

- [ ] `GolferCell` renders a strikethrough style for `qualification_status: 'cut'` and a 'WD' pill for `wd`.
- [ ] `GolferCell` renders a 'DQ' pill and visually de-emphasizes the row for `dq` status.
- [ ] A golfer who WDs after round 2 shows their completed rounds' score plus the configured penalty.
- [ ] `LeaderboardPage` renders an `EmptyState` component (not a blank page) when the standings array is empty.
- [ ] `LeaderboardPage` renders a pre-tournament banner ('Tournament hasn't started yet') when no results exist.
- [ ] Vitest test: `GolferCell` with `qualification_status: 'wd'` matches snapshot showing WD pill.
- [ ] Vitest test: `LeaderboardTable` with empty `standings` array renders `EmptyState`, not a table with zero rows.
- [ ] All edge case tests use `MockApiClient` fixtures from `src/api/mock/data.ts` — no inline test data.

## Implementation Notes


Attempt 1: GolferCell now renders distinct WD/DQ pills (status-pill--wd/dq classes) and a strikethrough class (golfer-name--strikethrough) for cut players. LeaderboardPage shows a pre-tournament banner ('Tournament hasn't started yet') when pool.scoring_enabled is false. Mock fixtures added: MOCK_WD_PICK_WITH_SCORE, MOCK_DQ_PICK, MOCK_EMPTY_LEADERBOARD, MOCK_PRE_TOURNAMENT_RVCC_POOL. Tests added for all edge cases including snapshots for WD/DQ pills, EmptyState verification, and the pre-tournament banner.