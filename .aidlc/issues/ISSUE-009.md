# ISSUE-009: Self-Serve Public Entry Links

**Priority**: medium
**Labels**: phase-2, frontend, backend, entry
**Dependencies**: ISSUE-007, ISSUE-002
**Status**: implemented

## Description

Generate a unique, shareable entry URL per pool (e.g., `/:clubCode/enter/:poolToken`). The link is publicly accessible — no sign-in required. Optional email capture at submission. Entry form uses the slot-based picker components already built (`GolferPicker`/`BucketPicker`) driven by the pool's `rules_json`. Reference: `docs/research/entry-validation-ui-patterns.md`.

## Acceptance Criteria

- [ ] `pool_token` is a URL-safe random string (min 16 chars) generated at pool publish time.
- [ ] Visiting the entry URL before pool lock shows the entry form; after lock shows 'Pool is closed' message.
- [ ] Email field is optional; if provided it is validated (format check) client-side and server-side.
- [ ] Submitting with an invalid pick count (wrong number of golfers for the format) returns an inline form error — never reaches the backend.
- [ ] Duplicate submission from the same email for the same pool returns a 409 with a 'You already submitted an entry' message.
- [ ] Entry confirmation page at `/:clubCode/enter/:poolToken/confirmation` shows submitted picks and a shareable link.
- [ ] Vitest test: `EntryPage` with a locked pool renders the 'Pool is closed' state, not the form.
- [ ] Vitest test: submitting with an empty email still succeeds (optional field).

## Implementation Notes


Attempt 1: Added public token-based entry flow: pool_token field on PoolSummary, getPoolByToken on ApiClient/HttpApiClient/MockApiClient, duplicate-entry 409 tracking in mock, validatePublicEntryForm with optional email, new PublicEntryPage (/:clubCode/enter/:poolToken) and PublicConfirmationPage with shareable link, wired into App.tsx + PageWrappers.tsx, 9 new Vitest tests covering locked pool and optional email.