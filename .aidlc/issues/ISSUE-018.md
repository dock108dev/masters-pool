# ISSUE-018: Stripe Billing Integration (Phase 5)

**Priority**: low
**Labels**: phase-5, backend, frontend, coordinator
**Dependencies**: ISSUE-007, ISSUE-008
**Status**: implemented

## Description

Implement Stripe Billing with two plans: per-pool ($100) and annual club subscription ($400/yr). First pool per club is free (trial). Pool creation endpoint gates on active Stripe subscription or unused trial. Coordinator dashboard shows billing status, invoice history link, and upgrade CTA. Stripe webhooks update club billing state on subscription changes and payment failures. Reference: `docs/research/flat-saas-pricing-benchmarks.md`.

## Acceptance Criteria

- [ ] Two Stripe products configured via dashboard; product IDs stored in `STRIPE_PER_POOL_PRICE_ID` and `STRIPE_ANNUAL_PRICE_ID` env vars — not hardcoded.
- [ ] `clubs` table gains `stripe_customer_id`, `billing_status` (`trial` | `active` | `suspended`), `trial_used` (boolean) columns.
- [ ] Pool creation endpoint returns HTTP 402 with `{ code: 'billing_required' }` when `trial_used=true` and no active Stripe subscription exists.
- [ ] First pool creation sets `trial_used=true` atomically; subsequent free creation attempts are blocked.
- [ ] Stripe webhook endpoint handles `customer.subscription.updated` (sets `billing_status`) and `invoice.payment_failed` (sets `billing_status=suspended`).
- [ ] Coordinator dashboard billing section shows current status badge, next invoice date (for active subscriptions), and a 'Manage billing' link to the Stripe customer portal.
- [ ] Integration test: pool creation with `trial_used=true` and no Stripe subscription returns 402.
- [ ] Integration test: webhook `invoice.payment_failed` event sets club `billing_status='suspended'`.
- [ ] Stripe webhook signature verification rejects requests without a valid `Stripe-Signature` header (HTTP 400).

## Implementation Notes


Attempt 1: Added Stripe billing integration (frontend + schema): BillingStatus/ClubBilling domain types in domain.ts; getClubBilling/createBillingPortalSession added to ApiClient interface, API_ENDPOINTS, HttpApiClient (with 402 handling in createPool), and MockApiClient (with billingRequired constructor option); mock fixtures MOCK_RVCC_BILLING/MOCK_CRESTMONT_BILLING/MOCK_SUSPENDED_BILLING in data.ts; billing section (status badge, next invoice date, Manage billing/Upgrade plan button) added to CoordinatorDashboardPage; migration 003_club_billing.sql adds stripe_customer_id/billing_status/trial_used columns; billing.test.ts covers getClubBilling, createBillingPortalSession, and createPool 402 behavior; CoordinatorDashboardPage.test.tsx extended with 4 billing section tests.