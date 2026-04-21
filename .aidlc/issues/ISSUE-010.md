# ISSUE-010: Coordinator Dashboard & CSV Export

**Priority**: medium
**Labels**: phase-3, frontend, coordinator
**Dependencies**: ISSUE-006, ISSUE-007, ISSUE-009
**Status**: implemented

## Description

Build a coordinator-only dashboard at `/:clubCode/admin/pools/:id` showing: entry count, list of all entries (entrant name/email, picks, submission timestamp), and a pool event log. Include a 'Download CSV' button that exports all entries. Reference: `docs/research/audit-log-entry-trail-libraries.md`.

## Acceptance Criteria

- [ ] Dashboard is accessible only to authenticated coordinators with `org:admin` role (HTTP 403 otherwise).
- [ ] Entry list renders entrant display name (or 'Anonymous' if no email), submission timestamp, and all picks.
- [ ] Picks are displayed in bucket order for bucketed pools; flat list for RVCC format.
- [ ] CSV download triggers `Content-Disposition: attachment` response from backend; no client-side CSV generation.
- [ ] CSV columns: `name`, `email`, `submitted_at`, then one column per pick slot.
- [ ] Event log section shows last 50 `pool_events` in reverse-chronological order with human-readable event descriptions.
- [ ] Vitest test: coordinator sees all entries; a user with `org:member` role cannot access the dashboard route.
- [ ] Vitest test: CSV export button triggers a fetch to the correct backend endpoint.

## Implementation Notes


Attempt 1: Built coordinator dashboard at /:clubCode/admin/pools/:id. Added PoolEntry/PoolEntriesResponse types to domain.ts; added getPoolEntries and downloadPoolEntriesCsv to ApiClient interface, API_ENDPOINTS, HttpApiClient, and MockApiClient; added MOCK_RVCC_ENTRIES/MOCK_CRESTMONT_ENTRIES fixtures. Created CoordinatorDashboardPage.tsx showing entry count, entry table (flat/bucket-ordered picks, Anonymous fallback), CSV download button, and reverse-chronological event log. Replaced PoolConfigReadOnlyPageWrapper in App.tsx and PageWrappers.tsx with CoordinatorDashboardPageWrapper. Added CoordinatorDashboardPage.test.tsx with 7 tests covering entries render, org:member access denial, CSV fetch, pick ordering, and event log ordering.