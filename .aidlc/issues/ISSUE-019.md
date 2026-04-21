# ISSUE-019: Club Pool Listing & Management Hub (Coordinator)

**Priority**: medium
**Labels**: phase-2, frontend, backend, coordinator
**Dependencies**: ISSUE-007, ISSUE-008
**Status**: implemented

## Description

Build the coordinator pool listing page at `/:clubCode/admin/pools`. Shows all pools scoped to the coordinator's club with status badges (draft, live, locked, closed). Serves as the entry point to pool creation (ISSUE-008) and per-pool management (ISSUE-010). Backed by `GET /clubs/:id/pools` returning pools filtered by the coordinator's Clerk `org_id`. Reference: ISSUE-007 for org-scoped auth, ISSUE-008 for the creation wizard, ISSUE-010 for the single-pool dashboard.

## Acceptance Criteria

- [ ] Route `/:clubCode/admin/pools` is accessible only to coordinators with `org:admin` role; `org:member` receives HTTP 403.
- [ ] `GET /clubs/:id/pools` backend endpoint returns only pools whose `club_id` matches the coordinator's Clerk org — never cross-club data.
- [ ] Each pool card displays: pool name, format type (flat/bucket), entry count, lock time (formatted local time), and a status badge (draft | live | locked | closed).
- [ ] 'Create new pool' CTA button navigates to the pool creation wizard (ISSUE-008).
- [ ] Clicking a pool card navigates to that pool's coordinator dashboard (ISSUE-010).
- [ ] When the pool list is empty an `EmptyState` component renders with copy 'No pools yet' and a 'Create your first pool' CTA — no blank page.
- [ ] Vitest test: coordinator with `org:admin` sees all club pools; a user with `org:member` role is redirected to 403.
- [ ] Vitest test: `EmptyState` renders when `MockApiClient` returns an empty pool list.
- [ ] TypeScript strict mode passes; no `any` in the pool list or status badge logic.

## Implementation Notes


Attempt 1: Implemented /:clubCode/admin/pools coordinator pool listing page. Added entry_count?: number to PoolSummary, getClubPools(clubCode) to ApiClient interface + API_ENDPOINTS, MockApiClient, and HttpApiClient. Created PoolListingPage with pool cards (name, format, entry count, lock time, status badge), Create new pool CTA, EmptyState for empty lists. Added PoolListingPageWrapper, route in App.tsx, and 8 Vitest tests covering org:admin access, org:member 403, pool card fields, navigation, and EmptyState. All 633 tests pass.