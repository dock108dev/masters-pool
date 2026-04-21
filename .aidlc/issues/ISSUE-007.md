# ISSUE-007: Club Auth & Multi-Tenancy (Clerk)

**Priority**: high
**Labels**: phase-2, backend, frontend, auth
**Dependencies**: none
**Status**: implemented

## Description

Integrate Clerk for club coordinator authentication. Each club maps to a Clerk organization. Coordinators have an `org:admin` role; members have `org:member`. Backend middleware verifies the Clerk JWT on protected routes and injects `club_id` into the request context. Frontend shows a 'Sign in' flow for coordinator pages. Reference: `docs/research/multi-tenant-auth-pattern.md`.

## Acceptance Criteria

- [ ] Clerk middleware rejects requests to coordinator routes with a missing or expired JWT (HTTP 401).
- [ ] A user with `org:member` role on a protected coordinator route receives HTTP 403.
- [ ] `club_id` is derived from the Clerk organization ID — never accepted from client-supplied headers.
- [ ] Frontend `ClubRoot` renders a 'Coordinator sign-in' link for `/admin` sub-paths; non-admin routes remain public.
- [ ] Sign-in redirects back to the coordinator page after successful authentication.
- [ ] Unit test: middleware extracts correct `club_id` from valid JWT; rejects tampered JWT.
- [ ] No auth state stored in React context beyond what Clerk's provider supplies — no custom global auth store.

## Implementation Notes


Attempt 1: Added Clerk auth integration: src/auth/middleware.ts with ClerkAuthError, extractClubId, assertOrgAdmin, requireCoordinatorAccess, verifyAndExtract utilities; src/pages/CoordinatorRoute.tsx (useAuth-based guard: 401 redirect → sign-in, 403 for org:member); src/pages/AdminSignInPage.tsx (Clerk SignIn with afterSignInUrl redirect-back); ClubRoot updated to show SignedOut-wrapped coordinator sign-in link on /admin paths; App.tsx wrapped with ClerkProvider + admin/sign-in routes added; 3 new test files covering all acceptance criteria.