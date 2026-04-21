# ISSUE-023: Self-Serve Onboarding, Trial Flow & Referral Mechanics (Phase 5)

**Priority**: low
**Labels**: phase-5, frontend, backend, coordinator
**Dependencies**: ISSUE-007, ISSUE-018
**Status**: implemented

## Description

Deliver the growth-facing UX layer for Phase 5: (1) a public marketing/landing page with format demos, pricing, and a 'Start Free' CTA; (2) coordinator signup flow that provisions a trial pool with no credit card required; (3) an in-app onboarding checklist (create pool → share link → collect entries → view standings) that clears items automatically as the coordinator completes each step; (4) an in-app upgrade prompt when the trial pool closes; (5) a coordinator referral link that awards one free pool credit to the referring club when the referred club completes their first pool. References `docs/research/flat-saas-pricing-benchmarks.md` and `docs/research/pool-hosting-saas-competitive-landscape.md`.

## Acceptance Criteria

- [ ] Public marketing page is accessible at `/` (unauthenticated); renders format demos, pricing tiers, and a 'Start Free' button that routes to coordinator signup.
- [ ] Coordinator signup flow completes without a credit card; a trial pool is auto-provisioned and the coordinator lands on the onboarding checklist.
- [ ] Onboarding checklist shows four steps; each step auto-checks when the corresponding action is detected (e.g., first entry submitted marks 'collect entries' complete).
- [ ] When a trial pool closes, an upgrade prompt appears in the dashboard with a direct path to billing (ISSUE-018 Stripe flow).
- [ ] Each coordinator has a unique referral URL; sharing it and having the referred club complete their first pool credits the referring club one free pool (backend credit ledger).
- [ ] Vitest test: `OnboardingChecklist` marks 'collect entries' complete when `entryCount > 0` is passed as a prop.
- [ ] Vitest test: `ReferralCredit` backend endpoint returns 400 if the referred club has not completed a pool, 200 with updated credit balance if they have.

## Implementation Notes


Attempt 1: Implemented Phase 5 onboarding/growth UX: (1) MarketingPage at `/` with format demos, pricing tiers, and Start Free CTA; (2) CoordinatorSignUpPage at `/sign-up` via Clerk; (3) OnboardingChecklist component (4 steps, auto-checks from props) integrated into CoordinatorDashboardPage; (4) UpgradePrompt shown when trial pool is final/archived; (5) ReferralWidget with copy-to-clipboard, credit balance, and referral stats; (6) getReferralInfo/applyReferralCredit added to ApiClient interface, MockApiClient, and HttpApiClient; (7) new referredClubCompleted flag on MockApiClient constructor.