club_pool_app_v1_controlled_braindump.md

⸻

🎯 Core Objective

Scale from:

* 1 manually run pool

To:

* 5–15 concurrent club pools
* minimal intervention during event
* zero scoring errors
* minimal “where do I click” questions

⸻

🧠 Product Definition (locked)

This is:

a hosted, per-club pool system with:

* simple entry UX
* accurate scoring
* clean leaderboard

This is NOT:

* a platform
* a marketplace
* self-serve onboarding
* generalized system (yet)

⸻

🔑 Constraints (important, don’t break these)

* You onboard every club manually
* You control pool creation
* You can fix things live
* UI must not confuse non-technical users
* Backend correctness > frontend polish

⸻

🧩 Supported Formats (locked for v1)

1. Bucket Format (CSV + optional UI later)

* 6 buckets
* 1 pick per bucket
* need 4 to make cut
* all 6 count (or configurable but default this)

2. Pick X of Y

* pick 7
* best 5 count
* 5 must make cut

⸻

🖥️ Frontend Focus (this is where scaling happens)

1. Entry Page (highest priority)

Must:

* load fast
* be mobile-first
* require zero explanation

Flow:

1. open link
2. enter name
3. pick players
4. submit
5. confirmation

⸻

UX Rules (strict)

* No scrolling through 150 players blindly → grouping/search required
* Show:
    * selected count (e.g. “3/7 selected”)
* Prevent:
    * invalid submission
* Lock:
    * after submission (no edits for v1)

⸻

Bucket UX

* display buckets clearly:
    * “Bucket A”, “Bucket B”… or real labels
* show:
    * selected player per bucket
* prevent:
    * multiple picks per bucket

⸻

Pick X UX

* full player list
* tap to select/deselect
* sticky counter (top or bottom)

⸻

📊 Leaderboard (second highest priority)

This is what people actually watch.

Must be:

* clean
* fast
* readable at a glance

⸻

Required Fields

* rank
* entry name
* total score
* players
* status:
    * active
    * cut

⸻

Visual Signals (important)

* highlight:
    * players who made cut
    * players who missed
* show:
    * how many count toward score

⸻

Performance Requirement

* must load instantly
* must not lag under:
    * ~100–300 entries per pool

⸻

🧑‍💼 Club Pro Experience (minimal but necessary)

You are onboarding → keep this thin.

⸻

Login (simple)

* email + password OR magic link
* no signup flow
* you create accounts

⸻

Dashboard

For each club:

* list of pools
* links:
    * entry page
    * leaderboard
* maybe:
    * entry count

⸻

No advanced features yet

* no editing pools
* no complex controls
* no analytics

⸻

🛠️ Operational Reality (this is where you win or lose)

You will:

* create pools manually
* configure rules
* validate players
* test before sending link

⸻

Pre-Event Checklist (you need this mentally)

For each pool:

* players loaded correctly
* rules correct
* entry link tested
* leaderboard empty + working
* lock time verified

⸻

⚙️ Backend Requirements (DOCUMENT ONLY — DO NOT BUILD YET)

This is the most important section long term.

⸻

1. Scoring Engine (critical)

Must handle:

* per-player score
* cut status
* aggregation rules:
    * best N scores
    * minimum players making cut

Must be:

* deterministic
* re-runnable

⸻

2. Data Sync

Need:

* player list (pre-event)
* scores (during + post cut)

Requirements:

* consistent IDs for players
* no duplication
* no stale data

⸻

3. Recompute Ability (this is huge)

You MUST be able to:

* recompute all scores for a pool

Because:

* data will be wrong at some point
* rules might change
* fixes must be instant

⸻

4. Entry Storage

Must store:

* entry name
* picks
* timestamp

Must be:

* immutable after lock

⸻

5. Pool Config

Store:

* format type
* rules
* lock time
* player set

⸻

6. Isolation Between Pools

Each pool:

* fully independent
* no shared state issues

Because:
👉 multiple clubs running at once

⸻

7. CSV Handling

Must support:

* entry import (optional)
* bucket definition import

Needs:

* flexible parsing
* error handling

⸻

⚠️ Failure Modes (these will happen)

1. Bad player matching

* CSV names don’t match
* fix: manual mapping fallback

⸻

2. Scoring mismatch

* leaderboard wrong
* fix: recompute

⸻

3. Late entries

* someone wants in after lock
* decision:
    * either allow manual add
    * or strict no

⸻

4. Load spike

* everyone opens leaderboard at once
* must not crash

⸻

5. Confused users

* “did my picks save?”
* fix: strong confirmation screen

⸻

🧪 Testing Strategy (don’t skip this)

Before event:

* create fake pool
* submit 10–20 entries
* simulate:
    * cut scenarios
    * scoring variations

Goal:
👉 trust the system before real money is involved

⸻

🚀 Scaling Reality (v1 expectations)

You can realistically support:

* 5–10 clubs
* 50–150 entries each

IF:

* scoring is solid
* frontend is simple
* you are available for issues

⸻

❌ What we are NOT doing (guardrails)

* no payments
* no automation onboarding
* no complex rule builder
* no notifications system
* no user accounts for players
* no editing entries post-submit

⸻

🧠 Final Anchor

This succeeds if:

* clubs don’t text you constantly
* leaderboard is trusted
* entry process is painless

This fails if:

* scoring is wrong once
* users are confused entering picks
* you have to manually fix everything mid-event

⸻