# ROADMAP — club-golf-tools

> **North Star:** A self-serve private pool hosting platform where a club coordinator can create, run, and close a Masters pool without the developer touching anything.

---

## Status as of April 2026

The app is a Phase 1/2/3/4/5 hybrid — features from all phases are partially implemented. The frontend has coordinator auth, pool creation wizard, public entry links, billing UI, referral system, and admin stats. Many backend-side Phase 1 items (scoring engine, data polling, auto-lock) are still in progress.

Checked items (✅) indicate the frontend implementation is complete and the feature is testable. Backend-only items (scoring engine, data polling jobs) are outside this repo's scope and remain open.

---

## Phase 1 — Hardened Single-Pool MVP

**Goal:** Lock down what already works — reliable data ingest, correct scoring, and an immutable pool config — so the 2026 Masters runs without manual intervention and can be handed to 3–5 additional clubs with confidence.

### Data & API Layer
- [ ] Select tournament data provider (SportsData.io recommended at $29/mo) and wire up credentials via env vars
- [ ] Define internal `PlayerScore` schema and adapter layer so the provider can be swapped without touching scoring code
- [ ] Implement polling job (cron, every 5 min during rounds) that upserts normalized scores to DB
- [ ] Write integration test against a fixture snapshot to confirm adapter output matches internal schema

### Pool Config & Locking
- [ ] Add `locked_at` timestamp column to `pools` table; add DB trigger that rejects `UPDATE` on config columns once `locked_at` is set
- [ ] Add `config_hash` (SHA-256 of JSON config) stored at creation for integrity verification
- [ ] Implement auto-lock job: poll for R1 first tee time, lock pool 5 min before; hard fallback to 7 AM ET Thursday if tee time unavailable
- ✅ Expose `GET /pools/:id/lock-status` endpoint — implemented in `ApiClient.getLockStatus()`
- ✅ Display lock countdown in pool UI header — `LockCountdownWidget` component

### Scoring Engine
- [ ] Implement scoring as a pure function `computeStandings(entries, playerScores, rules)` with no side effects
- [ ] Store versioned rules snapshot in `pool_config.scoring_rules` at creation; replay always uses original rules
- [ ] Support formats: flat pick-N (score best M), 4-bucket classic, captain's pick (optional)
- [ ] Implement MC penalty per pool config: fixed strokes, last-place score, or zero
- [ ] Add golden-file regression tests covering Masters cut scenarios

### Cut Rules
- [ ] Implement cut logic for Masters: top 50 + ties + within 10 shots of leader
- [ ] Correctly handle WD/DQ before cut
- [ ] Ensure tie handling includes ALL players at or better than the threshold position

### Leaderboard UI
- ✅ Pool standings page: rank, entry name, total score, picks with individual scores, cut indicators
- ✅ Polling refresh every 5 minutes via `useApi` polling interval
- ✅ Visual indicator for missed cut golfers (`is_dropped`, `status` on `LeaderboardPick`)
- ✅ Show each entry's effective score from pre-computed backend data

### Audit Trail
- ✅ Append-only `pool_events` table with immutability trigger — `migrations/001_pool_events.sql`
- ✅ RLS restricts reads to entry owner and club admin
- ✅ Events logged: `entry_submitted`, `entry_updated`, `pool_published`, `pool_locked`, `score_recalculated`

**Phase 1 is done when:**
- The 2026 Masters pool runs start-to-finish with zero developer interventions
- Scoring recompute produces identical results on every run against the same data snapshot
- Pool locks automatically at the correct time without a manual trigger
- 3 external club coordinators can view standings without asking a question

---

## Phase 2 — Self-Serve Club Onboarding

**Goal:** A club coordinator can sign up, create a pool, configure rules, share a link, and accept entries — all without the developer being involved.

### Auth & Multi-Tenancy
- ✅ Integrate Clerk — `ClerkProvider` in `App.tsx`, `CoordinatorRoute` auth guard
- ✅ Coordinator sign-up at `/sign-up` — `CoordinatorSignUpPage`
- ✅ Coordinator sign-in at `/:clubCode/admin/sign-in` — `AdminSignInPage`
- [ ] Provision club record on Clerk org creation webhook; store `clerk_org_id` as `clubs.id` foreign key
- [ ] Server-side middleware verifies `org_id` from JWT on every authenticated request

### Pool Creation Flow
- ✅ Multi-step pool creation wizard: format selection → config → review → publish — `PoolWizardPage`
- ✅ Pool listing dashboard — `PoolListingPage` with `getClubPools` endpoint
- ✅ Tournament selector from `getTournaments` endpoint (backed by `migrations/002_tournaments.sql`)
- [ ] Config becomes read-only immediately on publish; UI shows "Pool is live — rules locked" banner
- [ ] Preview of pool rules in plain English before publish

### Entry System
- ✅ Slot-based golfer picker: `GolferPicker` (flat, RVCC) and `BucketPicker` (bucketed, Crestmont)
- ✅ Live validation: all slots filled, no duplicates — `validateEntryForm()`
- ✅ Confirmation screen after submit — `ConfirmationPage`
- ✅ Entry locked indicator after pool lock (backend-enforced via deadline)

### Public Entry Links
- ✅ Public entry URL: `/:clubCode/enter/:poolToken` — `PublicEntryPage`
- ✅ Public confirmation: `/:clubCode/enter/:poolToken/confirmation` — `PublicConfirmationPage`
- ✅ Coordinator entries view: `getPoolEntries` and `downloadPoolEntriesCsv`

**Phase 2 is done when:**
- A new club coordinator can sign up, create a pool, share a link, and collect entries in under 30 minutes with zero developer assistance
- 5 new clubs are onboarded using only the self-serve flow
- Zero entries are submitted with invalid picks

---

## Phase 3 — Trust, Transparency & Operations

**Goal:** Make the system explainable and trustworthy at scale — users can answer their own questions, coordinators can audit anything, and the developer is not a support channel.

### Scoring Transparency
- [ ] Entry detail page: shows each pick's round-by-round scores and running total
- [ ] Cut status badge on each golfer within an entry
- [ ] Scoring breakdown: shows how each pick contributes to entry total
- ✅ `last_scored_at` timestamp on standings page — displayed in `LeaderboardPage`

### Coordinator Dashboard
- ✅ Entries table with submission time and picks preview — `CoordinatorDashboardPage`
- ✅ Export entries to CSV — `downloadPoolEntriesCsv`
- ✅ Pool event log visible to coordinator — `getPoolEvents` endpoint + display in dashboard
- [ ] Deadline extension guard: coordinator cannot extend lock after first tee time has passed

### Notifications
- [ ] Opt-in email on entry confirmation
- [ ] Opt-in email when pool locks
- [ ] Coordinator email on pool lock confirmation

### Error States & Edge Cases
- [ ] Handle WD/DQ mid-tournament: mark pick as WD in UI, apply MC penalty automatically
- [ ] Display "no entries yet" and "pool not started" states with clear next-step prompts

**Phase 3 is done when:**
- Coordinators answer their own questions using the dashboard — no developer DMs for 2 consecutive tournament weeks
- The audit trail can reconstruct full scoring history for any entry in under 60 seconds

---

## Phase 4 — Multi-Tournament & Expansion

**Goal:** Extend the platform beyond Masters to all four majors, and lay the groundwork for other sport formats.

### Additional Majors
- ✅ Tournament config table — `migrations/002_tournaments.sql` seeds Masters 2025/2026, PGA, US Open, The Open
- ✅ Pool creation wizard shows tournament selector with per-tournament defaults
- [ ] Cut rule implementations: PGA Championship (top 65 + ties), U.S. Open (top 60 + ties), The Open (top 65 + ties + par floor)
- [ ] Extend data provider adapter to fetch field and scores for additional majors
- [ ] Auto-lock job parameterized by tournament

### Real-Time Leaderboard (Optional Upgrade)
- [ ] Evaluate SSE + Redis fan-out if polling latency becomes a complaint at scale

### Branding
- ✅ Per-club logo and color scheme — `BrandingSettingsPage`, `getClubBranding`, `updateClubBranding`
- [ ] Branding applied to public entry URL and standings page header

**Phase 4 is done when:**
- At least 2 majors beyond Masters are running pools with 5+ clubs each
- Club branding is applied correctly on all public-facing pages

---

## Phase 5 — Growth & Monetization

**Goal:** Formalize pricing, reduce onboarding friction to near-zero, and establish a repeatable sales motion for country clubs.

### Pricing & Billing
- ✅ Stripe Billing integration: `ClubBilling` type, `getClubBilling`, `createBillingPortalSession`
- ✅ Trial period support: `trial_used` flag, `billing_status: 'trial'` — `migrations/003_club_billing.sql`
- ✅ Club billing dashboard — `getClubBilling` rendered in coordinator admin
- [ ] Pool creation gated on active subscription or trial eligibility check

### Self-Serve Sales Motion
- ✅ Public marketing page — `MarketingPage` at `/`
- ✅ Coordinator signup flow — `CoordinatorSignUpPage` at `/sign-up`
- ✅ Onboarding checklist in dashboard — `OnboardingChecklist` component
- ✅ In-app upgrade prompt — `UpgradePrompt` component

### Referral & Viral Mechanics
- ✅ Coordinator referral: `getReferralInfo`, `applyReferralCredit`, `ReferralWidget` component
- [ ] "Powered by [platform]" attribution in pool standings footer (opt-out for paying clubs)

### Operational
- ✅ Developer usage dashboard: `getAdminStats` (MRR, pools, entries, clubs) — `AdminDashboard`
- ✅ Poll health monitoring: `getPollHealth` surfaced in `AdminDashboard`
- [ ] Alerting on scoring recompute failures or data polling gaps > 30 min

**Phase 5 is done when:**
- 10+ clubs paying without any manual sales involvement
- Developer involvement per pool is less than 5 minutes (monitoring only)

---

## Guardrails (Non-Negotiable Across All Phases)

- Scoring must always be deterministic — same inputs, same output, every time
- Entries must be validated server-side before persistence — client validation is UX, not security
- Pool configs must be immutable after publish — no exceptions, no admin backdoor
- Pools must lock at the correct time automatically — no manual lock required
- The system must be self-explanatory to coordinators — if a question requires developer support, it's a UX bug
- Payments flow through clubs — platform never touches entry fees or payouts

---

## Dependency Map

```
Phase 1 (scoring, locking, data)
  └── Phase 2 (auth, pool creation, entry UI)
        └── Phase 3 (transparency, coordinator tools)
              └── Phase 4 (multi-tournament, expansion)
                    └── Phase 5 (billing, growth)
```

Phases 1 and 2 are sequential. Phases 3 and 4 can be partially parallelized once Phase 2 is stable.
