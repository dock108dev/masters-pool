# ISSUE-013: Pool Lock Countdown Header Widget (Frontend)

**Priority**: high
**Labels**: phase-1, frontend, pool-config
**Dependencies**: ISSUE-002
**Status**: implemented

## Description

Build a frontend header component that polls `GET /pools/:id/lock-status` and displays a live countdown to the pool lock time. Transitions automatically to a 'Pool Locked' badge when the timer expires or when `locked=true` is returned. Rendered in the shared `Layout` header on all pool-scoped pages so entrants always see lock status. Reference: ISSUE-002 for the lock-status endpoint contract.

## Acceptance Criteria

- [ ] Header component fetches `/pools/:id/lock-status` on mount and displays a `HH:MM:SS` countdown when `locked=false` and `lock_time` is in the future.
- [ ] Countdown ticks every second in-browser; at zero it flips to 'Pool Locked' badge styling without requiring a page reload.
- [ ] When the endpoint returns `locked=true`, the badge shows 'Pool Locked' with `locked_at` formatted as the user's local time.
- [ ] When `lock_time` is null (fallback not yet determined), header shows 'Lock time TBD' — no countdown rendered.
- [ ] Component uses `useApi` polling at 60-second interval to stay in sync with auto-lock job.
- [ ] Vitest test: given a mock `lock_time` 90 seconds in the future, component renders a string matching `0:01:30`.
- [ ] Vitest test: component renders 'Pool Locked' badge when mock returns `{ locked: true, locked_at: '...' }`.
- [ ] No scoring or config mutation in this component — strictly read-only display.
- [ ] TypeScript strict mode passes; no `any` in the countdown logic.

## Implementation Notes


Attempt 1: Added LockCountdownWidget component to Layout header. Extended PoolLockStatus with lock_time field. MockApiClient gains 4th constructor param mockLockTime. Widget polls getLockStatus every 60s via useApi, ticks per-second with setInterval, displays HH:MM:SS countdown, 'Pool Locked', or 'Lock time TBD'. ClubRoot fetches active pool and threads poolId through Layout→Header→Widget. Header only renders widget when poolId is non-null, so existing Header/ClubRoot tests are unaffected.