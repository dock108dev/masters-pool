# ISSUE-024: Developer Operations Dashboard, Alerting & Nightly Staging Tests (Phase 5)

**Priority**: low
**Labels**: phase-5, backend, frontend, coordinator
**Dependencies**: ISSUE-003, ISSUE-001, ISSUE-018
**Status**: implemented

## Description

Provide the internal tooling the developer needs to monitor the platform hands-off: (1) a private `/admin` dashboard showing pools created, entries submitted, active clubs, MRR (from Stripe), and current data-poll health; (2) alerting (email or PagerDuty webhook) when a scoring recompute fails or the data polling gap exceeds 30 minutes during an active tournament window; (3) a nightly CI job that runs the full test suite against a live-data fixture snapshot in staging, diff-checking standings against the previous run to surface unexpected score drift. References `docs/research/real-time-leaderboard-update-patterns.md` for poll-gap detection patterns.

## Acceptance Criteria

- [ ] Private `/admin` dashboard (Clerk admin-role gated) displays: total pools, entries, active clubs, and MRR pulled from Stripe API.
- [ ] Data-poll health widget shows last successful poll timestamp per active tournament; turns red if gap > 30 min.
- [ ] An alert (configurable webhook URL in env vars) fires within 5 minutes of a recompute failure or a polling gap exceeding 30 min during a live tournament window.
- [ ] A nightly GitHub Actions job runs `vitest` + `vite build` against a staging fixture snapshot and posts a pass/fail status to the repo.
- [ ] Nightly job also diffs standings output against the prior run's golden file; any unexpected change fails the job and emails the developer.
- [ ] Vitest test: `AdminDashboard` renders MRR as '$0' when Stripe returns an empty invoice list (not a crash or undefined).
- [ ] Alert webhook is not triggered during off-tournament hours even if polling is paused (tournament window awareness via pool `locked_at` + tournament end date).

## Implementation Notes


Attempt 1: Added AdminDashboard page at /:clubCode/admin with stats cards (total pools, entries, active clubs, MRR) and a data-poll health widget (red STALE if gap>30min in tournament window). Extended ApiClient with getAdminStats/getPollHealth, wired through MockApiClient, HttpApiClient, mock data fixtures, and domain types. Added 6 Vitest tests including the required MRR=$0 case. Created .github/workflows/nightly.yml (runs daily at 03:00 UTC: lint→typecheck→test→build→standings diff) and scripts/export-standings.ts for golden-file generation.