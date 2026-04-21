# Masters Pool → Platform (Next Phase Braindump)

## Context (Where We Are)

- Currently running ~2 pools manually
- Charging ~$100 per pool
- Everything flows through me:
  - onboarding
  - fixing entries
  - validating picks
  - scoring sanity checks
  - answering questions

It works because:
- volume is low
- people trust me
- I can manually patch issues

This does NOT scale.

---

## Goal (What This Needs To Become)

Not a golf app. Not fantasy.

This is:

> **A self-serve private pool hosting platform**

Clubs:
- create their own pools
- configure formats
- send links
- never need me

I:
- provide infrastructure
- ensure scoring is correct
- stay out of the way

---

## Hard Reality

Going from 2 → 40 clubs is NOT:
- "just more users"

It is:
- removing myself from every critical path
- building guardrails so users can't break things
- making the system deterministic and trustable

If I don't:
- I become support
- I become QA
- I become the bottleneck

---

## What Breaks First (In Order)

### 1. Onboarding

Right now:
- I fix bad inputs
- I explain formats
- I probably touch every pool

At scale:
- this becomes 70% of time

Fix:
- self-serve pool creation
- strict validation
- no invalid states allowed

---

### 2. Entries (CSV is a trap)

Current:
- CSV upload works but is fragile
- easy to mess up formatting
- hard to validate edge cases

At scale:
- this WILL break constantly

Fix:
- UI-first entry system
- CSV only if validated BEFORE submission
- preview + confirm step required

---

### 3. Scoring Trust

If scoring is wrong once:
- product is dead

Requirements:
- deterministic
- reproducible
- locked rules

Fix:
- scoring engine = single source of truth
- no "manual adjustments"
- full recompute always possible

---

### 4. Locking + Timing

Golf is sensitive to:
- tee times
- cut rules
- late entries

If this is fuzzy:
- people complain immediately

Fix:
- hard lock at first tee
- timestamps on all entries
- no edits after lock
- visible to users

---

### 5. Support Explosion

40 clubs = hundreds of users

Questions will be:
- "did my pick save"
- "why is this guy cut"
- "this looks wrong"

Fix:
- UI answers questions before they're asked
- audit trail for entries
- clear states everywhere

---

### 6. Payments (Do Not Touch This)

Important:
- I should NOT handle money

Clubs:
- collect money
- pay out

I:
- provide standings only

Avoid:
- legal complexity
- becoming a bank
- liability

---

## Core Product Pieces (What Actually Needs To Exist)

### 1. Club Owner System

Each club gets:
- login
- dashboard
- list of pools

They can:
- create pool
- manage pool
- view entries

---

### 2. Pool Creation (Critical Path)

Must be:
- simple
- constrained
- impossible to misconfigure

Formats:
- bucket picks
- pick X of Y

Config:
- number of picks
- cut rules
- scoring rules
- entry limits

Output:
- **locked config object (SSOT)**
- cannot change after start

---

### 3. Entry System

Replace:
- CSV chaos

With:
- player picker UI
- validation before submit
- confirmation screen

Rules:
- no invalid picks
- no duplicates (if not allowed)
- no missing slots

---

### 4. Scoring Engine (Backend Core)

Inputs:
- tournament data
- player scores

Outputs:
- standings
- cut status
- rankings

Requirements:
- deterministic
- replayable
- auditable

No:
- manual overrides
- silent fixes

---

### 5. Standings + Viewing

This is the product.

Users care about:
- leaderboard
- who made the cut
- who is dead
- where they stand

Needs:
- clean UI
- fast updates
- zero confusion

---

## Data Model (SSOT Direction)

### Pool
- id
- club_id
- format
- config (locked JSON)
- start_time
- lock_time
- status

### Entry
- id
- pool_id
- name
- picks[]
- created_at
- locked_at

### Player Result
- player_id
- score
- cut_status
- position

### Computed Standings
- entry_id
- total_score
- rank
- status

---

## Expansion Strategy (Beyond Masters)

Golf majors:
- PGA Championship
- U.S. Open
- The Open Championship

Future:
- March Madness pools
- NFL survivor
- weekly pick'em

Key idea:
> pools are the product, golf is just v1

---

## Pricing (Keep It Simple For Now)

Current:
- $100 per pool

Keep:
- flat pricing

Avoid:
- per entry (too complex early)
- tiers (not needed yet)

Goal:
- easy sell to clubs
- predictable revenue

---

## Biggest Constraint: Me

Right now:
- I am the system

That must change.

Rules:
- if I touch it → automate it
- if it breaks → add validation
- if users ask → fix UX, not support

---

## Minimal Build Plan

### Phase 1 (Immediate)
- club login
- pool creation flow
- entry UI (no CSV required)
- basic standings

---

### Phase 2
- scoring engine hardening
- audit logs
- lock + timing rules

---

### Phase 3
- multi-tournament support
- sharing / invites
- branding per club

---

## Rollout Strategy

Do NOT jump to 40 clubs.

Instead:
1. onboard 3–5 more manually
2. refine product
3. remove friction
4. repeat

Target:
> 8–10 clubs with zero manual intervention

Then scale.

---

## Guardrails (Non-Negotiable)

- scoring must always be correct
- entries must be validated before save
- pools must lock correctly
- configs must be immutable after start
- system must be explainable to users

---

## The Only Question That Matters

> Can a club run a pool without me touching it once?

If no:
- nothing else matters yet

---

## Final Thought

This is not a feature problem.

It's:
- system design
- trust
- removing human dependency

If done right:
- this spreads naturally
- this expands across sports
- this becomes a real product

If not:
- it stays a side hustle capped by me
