# ISSUE-011: Entry Detail & Scoring Transparency

**Priority**: low
**Labels**: phase-3, frontend, leaderboard, transparency
**Dependencies**: ISSUE-003, ISSUE-004, ISSUE-005
**Status**: implemented

## Description

Add a per-entry detail page at `/:clubCode/leaderboard/entry/:entryId` that shows each picked golfer, their current score, `qualification_status` badge (active/cut/wd/dq), and the entry's aggregate score derivation. Link to this page from each row in the leaderboard standings table.

## Acceptance Criteria

- [ ] Entry detail page renders all picks with current round scores and cumulative score.
- [ ] Each golfer shows a status badge: 'Active', 'Cut', 'WD', or 'DQ' using distinct visual styles.
- [ ] Aggregate score section shows the formula used (e.g., 'Sum of best N scores from M picks') matching the pool's rules_json.
- [ ] A 'Last updated' timestamp from the leaderboard polling is shown on the detail page.
- [ ] Leaderboard table rows include a link to the entry detail page for each standing.
- [ ] Detail page handles the case where `entryId` does not exist (404 state component, not a crash).
- [ ] Vitest test: entry with a WD golfer renders 'WD' badge and shows the penalty score in the breakdown.
- [ ] Vitest test: entry not found renders `ErrorState` component, not an unhandled exception.

## Implementation Notes


Attempt 1: Added EntryDetailPage at /:clubCode/leaderboard/entry/:entryId showing all picks with status badges (Active/Cut/WD/DQ), per-round scores, scoring formula from pool.rules_json, and last_scored_at timestamp. Leaderboard table rows now link to the detail page. 404 ErrorState shown for missing entryId. Tests cover WD badge, WD penalty in formula, penalty score display, and not-found state.