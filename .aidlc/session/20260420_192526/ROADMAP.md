# ROADMAP — club-golf-tools

> **North Star:** A self-serve private pool hosting platform where a club coordinator can create, run, and close a Masters pool without the developer touching anything.

---

## Phase 1 — Hardened Single-Pool MVP

**Goal:** Lock down what already works — reliable data ingest, correct scoring, and an immutable pool config — so the 2026 Masters runs without manual intervention and can be handed to 3–5 additional clubs with confidence.

### Data & API Layer
- [ ] Select tournament data provider (SportsData.io recommended at $29/mo) and wire up credentials via env vars
- [ ] Define internal `PlayerScore` schema (player_id, round_scores[], position, cut_status, withdrawn) and adapter layer so the provider can be swapped without touching scoring code
- [ ] Implement polling job (cron, every 5 min during rounds) that upserts normalized scores to DB
- [ ] Write integration test against a fixture snapshot to confirm adapter output matches internal schema

### Pool Config & Locking
- [ ] Add `locked_at` timestamp column to `pools` table; add DB trigger that rejects `UPDATE` on config columns once `locked_at` is set
- [ ] Add `config_hash` (SHA-256 of JSON config) stored at creation for integrity verification
- [ ] Implement auto-lock job: poll for R1 first tee time, lock pool 5 min before; hard fallback to 7 AM ET Thursday if tee time unavailable
- [ ] Expose `GET /pools/:id/lock-status` endpoint returning `{ locked, lock_time, first_tee_time }`
- [ ] Display lock countdown and locked state clearly in pool UI header

### Scoring Engine
- [ ] Implement scoring as a pure function `computeStandings(entries, playerScores, rules)` with no side effects or datetime calls
- [ ] Store versioned rules snapshot in `pool_config.scoring_rules` at creation; replay always uses original rules
- [ ] Support formats: flat pick-N (score best M), 4-bucket classic (1 pick per bucket), and captain's pick (optional)
- [ ] Implement MC penalty per pool config: fixed strokes, last-place score, or zero
- [ ] Implement tie-breaking by `entry.created_at` then UUID (never display name)
- [ ] Add golden-file regression tests covering Masters cut scenarios (top 50 + ties + within 10 of leader)
- [ ] Implement full-recompute endpoint `POST /pools/:id/recompute` (idempotent upsert to standings projection)

### Cut Rules
- [ ] Implement cut logic for Masters: top 50 + ties + within 10 shots of leader (dual condition)
- [ ] Correctly handle WD/DQ before cut (exclude from cut calculation entirely)
- [ ] Ensure tie handling includes ALL players at or better than the threshold position — no off-by-one

### Leaderboard UI
- [ ] Pool standings page: rank, entry name, total score, picks with individual scores, cut indicators
- [ ] Polling refresh every 15–20 seconds with `stale-while-revalidate` CDN header; no WebSockets yet
- [ ] Visual indicator for missed cut golfers within an entry (strikethrough or gray)
- [ ] Show each entry's effective score after applying MC penalties

### Audit Trail
- [ ] Create append-only `entry_events` Postgres table (`event_type`, `entry_id`, `payload`, `clock_timestamp()`)
- [ ] `REVOKE UPDATE, DELETE` on `entry_events` at DB level; RLS restricts reads to entry owner and club admin
- [ ] Log events: `picks_submitted`, `picks_updated`, `pool_locked`, `score_computed`
- [ ] UI: entry confirmation screen showing timestamp of last saved picks relative to lock time

**Phase 1 is done when:**
- The 2026 Masters pool runs start-to-finish with zero developer interventions
- Scoring recompute produces identical results on every run against the same data snapshot
- Pool locks automatically at the correct time without a manual trigger
- 3 external club coordinators can view standings without asking a question

---

## Phase 2 — Self-Serve Club Onboarding

**Goal:** A club coordinator can sign up, create a pool, configure rules, share a link, and accept entries — all without the developer being involved.

### Auth & Multi-Tenancy
- [ ] Integrate Clerk with Organizations feature; each club = one Clerk org
- [ ] Provision club record on org creation webhook; store `clerk_org_id` as `clubs.id` foreign key
- [ ] Server-side middleware verifies `org_id` from JWT on every authenticated request — never trust client-supplied `club_id`
- [ ] Coordinator role: can manage pools; Viewer role: read-only standings; enforce via Clerk roles
- [ ] Club invite flow: coordinator sends email invite via Clerk; invitee joins org and is immediately scoped to that club

### Pool Creation Flow
- [ ] Multi-step pool creation wizard: (1) format selection → (2) config → (3) review → (4) publish
- [ ] Format templates out of the box: Flat Pick-6 Best-4, 4-Bucket Classic, Pick-5 Best-5, Captain's Choice, Stroke Play Pick-4
- [ ] Config form validates all fields client-side (React Hook Form + Zod); schema shared with server validator
- [ ] Preview of pool rules in plain English generated from config object before publish
- [ ] Config becomes read-only immediately on publish; UI shows "Pool is live — rules locked" banner
- [ ] `GET /clubs/:id/pools` dashboard listing all pools with status badges (draft, live, locked, closed)

### Entry System (Replace CSV)
- [ ] Slot-based golfer picker UI: each slot is an independent dropdown; selected golfers removed from other slots' options (prevents duplicates structurally)
- [ ] For bucket pools: group golfers by bucket with world ranking range labels; only show golfers eligible for that bucket's slot
- [ ] Live validation: all slots filled check, duplicate check, eligibility check — inline before submit
- [ ] Preview + Confirm screen: shows full pick list, entry name, and timestamp before final submit
- [ ] Entry locked indicator after pool lock time; no edit UI rendered if `pool.locked_at` is set
- [ ] Mobile-optimized picker: bottom-sheet on small screens; virtualized list for 150+ golfer field

### Public Entry Links
- [ ] Generate shareable `pools/:id/enter` URL requiring no login for entrants (link is the auth)
- [ ] Optional entrant email capture for notifications (not required to submit)
- [ ] Pool admin can view all entries with creation timestamps and entry names

**Phase 2 is done when:**
- A new club coordinator can sign up, create a pool, share a link, and collect entries in under 30 minutes with zero developer assistance
- 5 new clubs are onboarded using only the self-serve flow
- Zero entries are submitted with invalid picks (structural validation prevents it)

---

## Phase 3 — Trust, Transparency & Operations

**Goal:** Make the system explainable and trustworthy at scale — users can answer their own questions, coordinators can audit anything, and the developer is not a support channel.

### Scoring Transparency
- [ ] Entry detail page: shows each pick's round-by-round scores and running total
- [ ] Cut status badge on each golfer within an entry (active / missed cut / WD / DQ)
- [ ] Scoring breakdown tooltip: shows how each pick contributes to entry total (e.g., "best 4 of 6 picks used")
- [ ] Last-updated timestamp on standings page tied to data poll timestamp
- [ ] Recompute history log visible to club admins: timestamp, trigger, result hash

### Coordinator Dashboard
- [ ] Entries table with sortable columns: name, submission time, picks preview, locked status
- [ ] Export entries to CSV (post-lock, for club's own records — not for re-import)
- [ ] Pool event log visible to coordinator: lock event, scoring recomputes, late submission attempts
- [ ] Deadline extension guard: coordinator cannot extend lock after first tee time has passed

### Notifications
- [ ] Opt-in email on entry confirmation (Resend or Postmark; no auth required for entrant)
- [ ] Opt-in email when pool locks (confirms picks are saved, shows entry summary)
- [ ] Coordinator email on pool lock confirmation

### Error States & Edge Cases
- [ ] Handle WD/DQ mid-tournament: mark pick as WD in UI, apply MC penalty automatically, recompute standings
- [ ] Handle tie at cut line: ensure all tied players are included, recompute standings idempotently
- [ ] Display "no entries yet" and "pool not started" states with clear next-step prompts
- [ ] 404 and locked pool states on entry link have clear explanatory copy (not generic errors)

**Phase 3 is done when:**
- Coordinators answer their own questions using the dashboard — no developer DMs for 2 consecutive tournament weeks
- The audit trail can reconstruct the full scoring history for any entry in under 60 seconds
- At least 8 clubs run pools with zero manual intervention from the developer

---

## Phase 4 — Multi-Tournament & Expansion

**Goal:** Extend the platform beyond Masters to all four majors, and lay the groundwork for other sport formats.

### Additional Majors
- [ ] Add cut rule implementations: PGA Championship (top 65 + ties), U.S. Open (top 60 + ties), The Open Championship (top 65 + ties + par floor)
- [ ] Tournament config table with per-tournament field data, cut rules, and scoring rule defaults
- [ ] Extend data provider adapter to fetch field and scores for PGA Championship, U.S. Open, The Open
- [ ] Auto-lock job parameterized by tournament (not hardcoded to Masters tee time source)
- [ ] Pool creation wizard shows tournament selector; pre-fills format defaults per tournament

### Real-Time Leaderboard (Optional Upgrade)
- [ ] Evaluate SSE + Redis fan-out if polling latency becomes a complaint at scale
- [ ] If using Supabase: enable Supabase Realtime on standings projection table as zero-infra upgrade
- [ ] Alternatively: integrate Ably free tier (6M messages/mo, 200 peak connections) for push updates

### Platform Flexibility
- [ ] Abstract format engine: tournament type (golf, basketball, football) is a top-level config dimension
- [ ] Implement one non-golf pool type (e.g., March Madness bracket) as proof of abstraction
- [ ] Pool templates are user-selectable at creation; new templates addable via config without code change

### Branding
- [ ] Per-club logo and color scheme stored in club config; applied to standings page and entry link
- [ ] Custom pool name and description shown on public entry URL

**Phase 4 is done when:**
- At least 2 majors beyond Masters are running pools with 5+ clubs each
- One non-golf pool format is live and used by at least 1 club
- Club branding is applied correctly on all public-facing pages

---

## Phase 5 — Growth & Monetization

**Goal:** Formalize pricing, reduce onboarding friction to near-zero, and establish a repeatable sales motion for country clubs.

### Pricing & Billing
- [ ] Implement Stripe Billing with two plans: per-pool ($100) and annual club subscription ($400/yr)
- [ ] Trial period: first pool free (removes spreadsheet inertia barrier)
- [ ] Club dashboard shows billing status, invoice history, and upgrade/downgrade path
- [ ] Pool creation gated on active subscription or trial eligibility check

### Self-Serve Sales Motion
- [ ] Public marketing page with format demos, pricing, and "start free" CTA
- [ ] Coordinator signup flow starts with trial pool (no credit card required)
- [ ] Onboarding checklist in dashboard: create pool → share link → collect entries → view standings
- [ ] In-app upgrade prompt when trial pool closes

### Referral & Viral Mechanics
- [ ] Coordinator referral link: referring club gets one free pool credit when referred club completes first pool
- [ ] "Powered by [platform]" attribution in pool standings footer (opt-out for paying clubs)

### Operational
- [ ] Usage dashboard for developer: pools created, entries submitted, active clubs, MRR
- [ ] Alerting on scoring recompute failures or data polling gaps > 30 min during active tournaments
- [ ] Automated test suite runs nightly against live tournament data in staging environment

**Phase 5 is done when:**
- 10+ clubs paying without any manual sales involvement from the developer
- Churn rate under 20% after first paid pool
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
