# Documentation Consolidation Audit

**Date:** 2026-04-20
**Scope:** Full documentation review and rewrite for `club-golf-tools`

---

## Summary

The existing documentation described the app as it was in Phase 1 (no auth, 6 API endpoints, no admin features). The actual codebase implements Phase 1/2/3/4/5 hybrid features including Clerk auth, coordinator admin pages, pool creation wizard, billing, referral system, and admin stats. Every major doc had material inaccuracies.

---

## Changes Made

### Deleted

| File | Reason |
|------|--------|
| `ARCHITECTURE.md` (root) | Moved to `docs/architecture.md`; content fully rewritten |
| `DESIGN.md` (root) | Moved to `docs/design.md`; content updated for accuracy |
| `ROADMAP.md` (root) | Moved to `docs/roadmap.md`; status updated |
| `BRAINDUMP.md` (root) | Moved to `docs/braindump.md`; content preserved as-is |

### Rewritten

#### `README.md`

**Was:** Described the app as running against mock data with no authentication, 6-method API, and a flat project structure from Phase 1.

**Now:** Accurately describes Clerk-authenticated coordinator area, public entry links, all 15 routes, 3 required env vars, and links to docs in `/docs`.

#### `docs/architecture.md` (was `ARCHITECTURE.md`)

**Was:** Described 6 API endpoints, no admin pages, no auth, no billing, 2 clubs as final state. Missing all coordinator features, public entry links, pool creation wizard, billing, tournaments config.

**Now:** Describes 22-method `ApiClient` interface, all public and coordinator routes, Clerk auth integration, `CoordinatorRoute` guard, component structure including coordinator + onboarding components, all domain types, database migrations, CI/CD pipeline, nginx config.

#### `docs/api-contracts.md`

**Was:** Documented 5 endpoints (active pool, pool field, submit entry, leaderboard, lookup). Cut off mid-document. Missing 17 endpoints.

**Now:** Documents all 22 endpoints across pool, club, tournament, and admin groups. Includes full TypeScript request/response types for each. Covers coordinator-only auth requirements.

#### `docs/roadmap.md` (was `ROADMAP.md`)

**Was:** All items unchecked despite many being implemented. No indication of current status.

**Now:** Added "Status as of April 2026" preamble explaining the Phase 1/2/3/4/5 hybrid state. Marked frontend-implemented items with ✅. Left backend-only items (scoring engine, data polling, auto-lock job) unchecked since they are outside this repo's scope.

#### `docs/design.md` (was `DESIGN.md`)

**Was:** Accurate principles but contained wrong file paths (`src/club/` doesn't exist; should be `src/config/`), wrong test file location (described co-located tests; actual location is `src/__tests__/`), and referenced MSW for testing (actual setup uses `MockApiClient`).

**Now:** Principles preserved. Fixed section 4 naming to match actual directory structure. Fixed testing section to match `MockApiClient`-based approach. Added note that code examples are illustrative.

#### `CLAUDE.md`

**Was:** Test count said "347 tests"; missing `VITE_CLERK_PUBLISHABLE_KEY` env var; stated root `/` redirects to `/rvcc`; dependencies section didn't mention Clerk.

**Now:** Removed hardcoded test count (changes frequently). Added `VITE_CLERK_PUBLISHABLE_KEY` to env vars. Fixed route description (root `/` shows marketing page, not redirect). Added Clerk to allowed dependencies.

### Preserved As-Is

| File | Reason |
|------|--------|
| `AIDLC_FUTURES.md` | Auto-generated; not part of this review |
| `docs/braindump.md` | Strategic vision; content accurate and relevant |
| `docs/research/*` | 12 research reference docs; all valid supporting material |
| `docs/audits/ssot-cleanup.md` | Accurate audit trail of prior cleanup work |
| `docs/audits/cleanup-report.md` | Accurate post-cleanup verification |
| `docs/audits/abend-handling.md` | Accurate error boundary strategy doc |
| `docs/audits/security-audit.md` | Accurate security review findings |

---

## Key Inaccuracies Corrected

| Claim | Reality |
|-------|---------|
| "No authentication" (README, ARCHITECTURE) | Clerk auth with `CoordinatorRoute` guard |
| "6 API endpoints" (ARCHITECTURE, api-contracts) | 22 methods in `ApiClient` interface |
| "2 clubs — final state" (ARCHITECTURE) | 2 clubs hardcoded; architecture supports dynamic DB-driven clubs |
| "No admin UI" (ARCHITECTURE) | Admin dashboard, pool creation wizard, coordinator dashboard, branding settings all implemented |
| "No billing" (ARCHITECTURE) | `ClubBilling` type, Stripe portal endpoint, trial system, referral system all present |
| "No tournament config" (ARCHITECTURE) | `migrations/002_tournaments.sql` seeds 5 tournaments; `getTournaments` endpoint powers pool wizard |
| "No public entry links" (ARCHITECTURE, ROADMAP) | `PublicEntryPage` and `PublicConfirmationPage` routed at `/:clubCode/enter/:poolToken` |
| "Root redirects to /rvcc" (CLAUDE.md) | Root `/` renders `MarketingPage` |
| "347 tests" (CLAUDE.md) | Test count changes; removed hardcoded number |

---

## Structure Enforced

```
/ (root)
  README.md          ← entry point, quick start, route table, links to /docs
  CLAUDE.md          ← contributor guide (Claude Code system file, must stay at root)
  AIDLC_FUTURES.md   ← auto-generated, left in place

docs/
  architecture.md    ← component breakdown, data flows, directory structure
  api-contracts.md   ← all 22 endpoint signatures
  design.md          ← coding patterns and anti-patterns
  roadmap.md         ← feature phases with current status
  braindump.md       ← strategic vision and original product thinking
  audits/            ← ssot-cleanup, cleanup-report, abend-handling, security-audit, this file
  research/          ← 12 reference research docs
```
