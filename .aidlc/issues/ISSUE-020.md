# ISSUE-020: Email-Based Entry Lookup (Frontend + Backend)

**Priority**: high
**Labels**: phase-1, frontend, backend, entry
**Dependencies**: ISSUE-003, ISSUE-009
**Status**: implemented

## Description

Allow any user to retrieve their submitted entry by entering their email address. The lookup flow lives at `/:clubCode/lookup` (or accessible from the leaderboard page). The backend exposes `GET /pools/:id/entries?email=<encoded>` — returns matching entry or 404. Frontend renders the entry detail inline (picks, current rank, score). If no entry found, shows a clear 'No entry found for that email' state. References `docs/research/entry-validation-ui-patterns.md` for input patterns.

## Acceptance Criteria

- [ ] Route `/:clubCode/lookup` renders an email input form with a submit button.
- [ ] On submit, calls `GET /pools/:poolId/entries?email=<urlencoded>` — loading spinner shown while pending.
- [ ] Successful response renders golfer picks, current rank, and aggregate score (same data shape as ISSUE-011 entry detail).
- [ ] If backend returns 404, renders 'No entry found for [email]' message — no stack trace or raw error.
- [ ] Email field validates format client-side before submitting (same regex as ISSUE-009 entry form).
- [ ] Lookup result is not cached between sessions — re-entering email always re-fetches.
- [ ] Vitest test: `LookupPage` with a 404 response renders the not-found message, not an error boundary.
- [ ] Vitest test: `LookupPage` with a valid response renders the entry's picks in correct order.

## Implementation Notes


Attempt 1: Enhanced LookupPage with 404 handling (shows 'No entry found for [email]' instead of generic error), leaderboard cross-reference for rank/score display, pick_slot-sorted picks, and two new Vitest tests covering the 404 not-found case and pick ordering. Also updated HttpApiClient.lookupEntries to throw a status-annotated error on 404.