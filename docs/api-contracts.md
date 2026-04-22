# API Contracts

Typed contracts between the club-golf-tools frontend and the sports-data-admin backend Golf Pools API. All domain types are defined in `src/types/domain.ts`. The `ApiClient` interface (36 methods) and `API_ENDPOINTS` map are in `src/api/types.ts`.

## Authentication

All endpoints require an `X-API-Key` header. In production, nginx injects this header via the `SPORTS_API_KEY` env var — the browser never handles the key. In dev, the Vite proxy injects it.

Coordinator endpoints also accept a Clerk JWT via `Authorization: Bearer <token>`. The backend validates org membership server-side; the frontend never derives club access from the JWT payload.

## Base URL

`/api` (relative — resolved via nginx proxy in production, Vite proxy in dev).

---

## Pool Endpoints

### Get Active Pool

```
GET /api/golf/pools?club_code={clubCode}&active_only=true
```

Returns the first pool for the club with status in `open | locked | live`. Returns `null` when no active pool exists.

**Response:** `PoolSummary | null`

```typescript
interface PoolSummary {
  id: number;
  code: string;                    // e.g. "masters-2026-rvcc"
  name: string;
  club_code: ClubCode;             // "rvcc" | "crestmont"
  tournament_id: number;
  status: PoolStatus;              // "draft" | "open" | "locked" | "live" | "final" | "archived"
  entry_deadline: string;          // ISO 8601
  max_entries_per_email: number;
  scoring_enabled: boolean;
  rules_json: PoolRules;
  pool_token?: string;             // Present when pool is published (used for public entry links)
  entry_count?: number;            // Present in club pool listing responses
}

interface PoolRules {
  variant: string;                 // "rvcc" | "crestmont"
  pick_count: number;
  count_best: number;
  min_cuts_to_qualify: number;
  uses_buckets: boolean;
  wd_score_penalty?: number;       // Strokes added to WD player's score (absent = WD unscored)
  dq_score_penalty?: number;       // Strokes added to DQ player's score (DQ never counts)
}
```

---

### Get Pool Detail

```
GET /api/golf/pools/{poolId}
```

**Response:** `PoolSummary`

---

### Get Pool Field

```
GET /api/golf/pools/{poolId}/field
```

**RVCC response (flat list):**
```typescript
{
  pool_id: number;
  variant: "rvcc";
  players: FieldPlayer[];
}
```

**Crestmont response (bucketed):**
```typescript
{
  pool_id: number;
  variant: "crestmont";
  buckets: FieldBucket[];
}

interface FieldPlayer {
  dg_id: number;           // DataGolf player ID — stable identifier across all endpoints
  player_name: string;
}

interface FieldBucket {
  bucket_number: number;   // 1-indexed (1–6 for Crestmont)
  label: string;           // e.g. "Group 1"
  players: FieldPlayer[];
}
```

---

### Submit Entry

```
POST /api/golf/pools/{poolId}/entries
```

**Request:**
```typescript
interface EntrySubmissionRequest {
  email: string;
  entry_name: string;
  picks: EntryPick[];
}

interface EntryPick {
  dg_id: number;
  pick_slot: number;         // 1-indexed position
  bucket_number?: number;    // Required for Crestmont bucket pools
  player_name?: string;      // Required when dg_id < 0 (write-in "Other" golfer)
}
```

**Backend validation (returns `422` on failure):**
- Entry deadline has not passed
- Max entries per email not exceeded
- Pick count matches `rules_json.pick_count`
- No duplicate golfers
- All golfers are in the tournament field
- For Crestmont: exactly one pick per bucket, each from the correct bucket

**Response:** `EntrySubmissionResponse`
```typescript
interface EntrySubmissionResponse {
  entry_id: number;
  confirmationCode: string;
  email: string;
  entry_name: string;
  picks: EntryPick[];
  submittedAt: string;       // ISO 8601
}
```

---

### Get Leaderboard

```
GET /api/golf/pools/{poolId}/leaderboard
```

**Response:**
```typescript
interface LeaderboardData {
  pool_id: number;
  last_scored_at: string;         // ISO 8601 — when scoring last ran
  standings: LeaderboardStanding[];
  count: number;
}

interface LeaderboardStanding {
  rank: number | null;            // null if not qualified
  is_tied: boolean;
  entry_id: number;
  entry_name: string;
  email: string;
  aggregate_score: number | null; // null if not qualified
  qualification_status: QualificationStatus;  // "qualified" | "pending" | "not_qualified"
  qualified_golfers_count: number;
  counted_golfers_count: number;
  is_complete: boolean;
  picks: LeaderboardPick[];
}

interface LeaderboardPick {
  dg_id: number;
  player_name: string;
  total_score: number | null;
  position: number | null;
  thru: number | null;            // Holes completed in current round (18 = finished)
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  status: GolferStatus;           // "active" | "cut" | "wd" | "dq"
  made_cut: boolean;
  counts_toward_total: boolean;   // True if this pick contributes to the entry's aggregate
  is_dropped: boolean;            // True if active but not in best N (made cut, excess picks)
  bucket_number?: number;         // Present for Crestmont entries
}
```

**Qualification semantics:**
- `qualified`: enough active golfers meet `min_cuts_to_qualify`
- `pending`: cut not yet settled (round 2 not complete)
- `not_qualified`: after cut, too few active golfers

---

### Look Up Entries by Email

```
GET /api/golf/pools/{poolId}/entries/by-email?email={email}
```

**Response:**
```typescript
interface EntryLookupResult {
  email: string;
  entries: EntryLookupEntry[];
}

interface EntryLookupEntry {
  entry_id: number;
  entry_name: string;
  picks: EntryPick[];
  submittedAt: string;
  confirmationCode: string;
}
```

---

### Get Lock Status

```
GET /api/golf/pools/{poolId}/lock-status
```

**Response:**
```typescript
interface PoolLockStatus {
  locked: boolean;
  locked_at: string | null;   // ISO 8601; null if not yet locked
  lock_time: string | null;   // Scheduled lock time; null if not yet determined
}
```

---

### Get Pool Events

```
GET /api/golf/pools/{poolId}/events?page={page}&pageSize={pageSize}
```

**Response:**
```typescript
interface PoolEventsPage {
  pool_id: number;
  events: PoolEvent[];
  total: number;
  page: number;
  page_size: number;
}

interface PoolEvent {
  id: number;
  pool_id: number;
  event_type: PoolEventType;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

type PoolEventType =
  | 'entry_submitted'
  | 'entry_updated'
  | 'pool_published'
  | 'pool_locked'
  | 'score_recalculated'
  | 'email_delivery_failed';
```

---

### Create Pool

```
POST /api/golf/pools
```

Requires coordinator authentication (Clerk JWT).

**Request:**
```typescript
interface CreatePoolRequest {
  club_code: ClubCode;
  name: string;
  tournament_id: number;
  entry_deadline: string;          // ISO 8601
  max_entries_per_email: number;
  rules_json: CreatePoolRules;
}

interface CreatePoolRules extends PoolRules {
  engine_type?: string;            // Defaults to 'golf'
  buckets?: BucketDefinition[];    // Required for bucketed pools
}

interface BucketDefinition {
  label: string;
  min_picks: number;
  max_picks: number;
}
```

**Response:** `PoolSummary` (the newly created pool with status `'draft'`)

---

### Get Pool by Token

```
GET /api/golf/pools/by-token/{token}?club_code={clubCode}
```

Resolves a `pool_token` (from a public entry link) to a `PoolSummary`. Returns `null` when no matching pool exists.

**Response:** `PoolSummary | null`

---

### Get Pool Entries

```
GET /api/golf/pools/{poolId}/entries
```

Requires coordinator authentication.

**Response:**
```typescript
interface PoolEntriesResponse {
  pool_id: number;
  entries: PoolEntry[];
  count: number;
}

interface PoolEntry {
  entry_id: number;
  entry_name: string;
  email: string | null;
  submitted_at: string;
  picks: PoolEntryPick[];
}
```

---

### Download Pool Entries CSV

```
GET /api/golf/pools/{poolId}/entries/csv
```

Requires coordinator authentication.

**Response:** `Blob` (CSV file)

---

### Lock Pool

```
POST /api/golf/pools/{poolId}/lock
```

Requires coordinator authentication. Transitions pool from `open` → `locked`. Rejects further entry submissions.

**Response:** `PoolSummary` (updated)

---

### Unlock Pool

```
POST /api/golf/pools/{poolId}/unlock
```

Requires coordinator authentication. Transitions pool from `locked` → `open`.

**Response:** `PoolSummary` (updated)

---

### Send Pool Invites

```
POST /api/golf/pools/{poolId}/invites
```

Requires coordinator authentication. Sends invitation emails to the specified addresses.

**Request:**
```typescript
interface SendInvitesRequest {
  emails: string[];
}
```

**Response:** `void` (204)

---

### Get Entry

```
GET /api/golf/entries/{entryId}
```

Returns a single pool entry. Throws 404 if not found.

**Response:** `PoolEntry`

---

### Get Entry Leaderboard

```
GET /api/golf/entries/{entryId}/leaderboard
```

Returns scoring detail for a single entry. Returns `null` when scoring has not run yet.

**Response:** `EntryLeaderboardResponse | null`

```typescript
interface EntryLeaderboardResponse {
  entry_id: number;
  entry_name: string;
  picks: LeaderboardPick[];
  aggregate_score: number | null;
  qualification_status: QualificationStatus;
}
```

---

## Club Endpoints

### Get Club Pools

```
GET /api/clubs/{clubCode}/pools
```

Requires coordinator authentication. Returns all pools for the club across all statuses.

**Response:** `PoolSummary[]`

---

### Get Club Branding

```
GET /api/clubs/{clubCode}/branding
```

**Response:**
```typescript
interface ClubBranding {
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
}
```

---

### Update Club Branding

```
PATCH /api/clubs/{clubCode}/branding
```

Requires coordinator authentication.

**Request:** `Partial<ClubBranding>`

**Response:** `ClubBranding` (updated)

---

### Get Club Billing

```
GET /api/clubs/{clubCode}/billing
```

Requires coordinator authentication.

**Response:**
```typescript
interface ClubBilling {
  billing_status: BillingStatus;           // "trial" | "active" | "suspended"
  stripe_customer_id: string | null;
  trial_used: boolean;
  next_invoice_date: string | null;        // ISO 8601; present when active
  billing_portal_url: string | null;       // Stripe portal URL; present when stripe_customer_id exists
}
```

---

### Create Billing Portal Session

```
POST /api/clubs/{clubCode}/billing/portal
```

Requires coordinator authentication. Creates a Stripe customer portal session.

**Response:** `{ url: string }`

---

### Get Referral Info

```
GET /api/clubs/{clubCode}/referral
```

Requires coordinator authentication.

**Response:**
```typescript
interface ReferralInfo {
  referral_code: string;
  referral_url: string;
  credit_balance: number;
  referred_clubs_count: number;
}
```

---

### Apply Referral Credit

```
POST /api/clubs/referral/apply
```

**Request:** `{ referral_code: string; referred_club_code: ClubCode }`

**Response:**
```typescript
interface ReferralCreditResponse {
  credit_balance: number;
  credit_awarded: boolean;
}
```

---

### Check Slug Availability

```
GET /api/clubs/slug-check?slug={slug}
```

Real-time availability check for a proposed club slug. Used by `SlugAvailabilityInput` during onboarding (debounced, supports `AbortSignal`).

**Response:**
```typescript
interface SlugCheckResponse {
  available: boolean;
  reason: string | null;   // Human-readable reason when unavailable
}
```

---

### Create Club

```
POST /api/clubs
```

Creates a new club after a successful Stripe checkout. Called from `CheckoutSuccessPage` once the session is verified.

**Request:**
```typescript
interface CreateClubRequest {
  session_id: string;   // Stripe checkout session ID
  club_name: string;
  slug: string;
}
```

**Response:**
```typescript
interface CreateClubResponse {
  club_slug: string;
  onboard_url: string;  // Relative URL for the onboarding wizard
}
```

---

### Get Pending Club

```
GET /api/clubs/pending
```

Returns the in-progress onboarding club for the authenticated coordinator. Returns `null` (404) when no pending club exists.

**Response:** `PendingClub | null`

```typescript
interface PendingClub {
  club_slug: string;
  club_name: string;
  onboard_step: number;
  payment_session_id: string;
}
```

---

## Tournament Endpoints

### Get Tournaments

```
GET /api/golf/tournaments
```

Returns available tournaments for the pool creation wizard.

**Response:** `TournamentOption[]`

```typescript
interface TournamentOption {
  id: number;
  name: string;
  year: number;
  cut_rule_type: CutRuleType;        // "masters" | "pga_championship" | "us_open" | "the_open"
  default_format: 'flat' | 'bucketed';
}
```

---

### Get Tournament Player Roster

```
GET /api/golf/tournaments/{tournamentId}/roster
```

Returns the full player field for a tournament. Used by the superadmin dashboard and onboarding wizard.

**Response:** `Player[]`

```typescript
interface Player {
  id: number;           // DataGolf player ID
  name: string;
  worldRank: number;
  tier: 'elite' | 'strong' | 'mid' | 'longshot';
}
```

---

### Get Live Tournament Leaderboard

```
GET /api/golf/tournaments/{tournamentId}/leaderboard
```

Returns the current in-progress tournament leaderboard (raw scores, not pool standings). Used by the superadmin dashboard.

**Response:** `PlayerScore[]`

```typescript
interface PlayerScore extends Player {
  totalStrokes: number;
  thru: number;
  status: 'active' | 'cut' | 'wd';
}
```

---

## Admin Endpoints

### Get Admin Stats

```
GET /api/admin/stats
```

Platform-wide stats. Requires developer/admin role.

**Response:**
```typescript
interface AdminStats {
  total_pools: number;
  total_entries: number;
  active_clubs: number;
  mrr_cents: number;               // Monthly recurring revenue from Stripe, in cents
}
```

---

### Get Poll Health

```
GET /api/admin/poll-health
```

Data polling health for active tournaments. Requires developer/admin role.

**Response:**
```typescript
interface AdminPollHealth {
  tournaments: TournamentPollHealth[];
  checked_at: string;
}

interface TournamentPollHealth {
  pool_id: number;
  pool_name: string;
  tournament_name: string;
  last_polled_at: string | null;   // null if never polled
  is_in_window: boolean;           // True if within active tournament window
  is_stale: boolean;               // True when in_window AND gap > 30 min since last poll
}
```

---

## Onboarding & Checkout Endpoints

### Submit Club Claim

```
POST /api/onboarding/club-claims
```

Lead capture for prospective clubs. Rate-limited (429 with `Retry-After` header).

**Request:**
```typescript
interface ClubClaim {
  club_name: string;
  contact_email: string;
  expected_entries?: number;
  notes?: string;
}
```

**Response:**
```typescript
interface ClubClaimResponse {
  claim_id: string;
  received_at: string;   // ISO 8601
}
```

---

### Create Checkout Session

```
POST /api/checkout/session
```

Creates a Stripe Checkout session for the self-serve onboarding flow.

**Response:** `{ session_url: string }`

Redirect the browser to `session_url` to start the Stripe-hosted checkout.

---

### Verify Checkout Session

```
POST /api/checkout/verify
```

Polls or confirms a Stripe session after the user returns from checkout.

**Request:** `{ session_id: string }`

**Response:**
```typescript
interface VerifySessionResponse {
  status: 'pending' | 'provisioned';
  club_name: string | null;
  email: string | null;
  club_slug: string | null;
  onboard_url: string | null;   // Relative URL; present when status is 'provisioned'
}
```

---

### Submit Onboarding Wizard

```
POST /api/clubs/wizard/submit
```

Finalizes club onboarding — creates the first pool and returns entry link. Requires Clerk authentication.

**Request:**
```typescript
interface OnboardingWizardSubmitRequest {
  club_slug: string;
  pool_name: string;
  tournament_id: number;
  entry_deadline: string;           // ISO 8601
  max_entries_per_email: number;
  rules_json: CreatePoolRequest['rules_json'];
}
```

**Response:**
```typescript
interface OnboardingWizardSubmitResponse {
  pool_id: number;
  redirect_url: string;
  pool_token: string;
  entry_url: string;   // Shareable public entry URL
}
```

---

## Frontend Assumptions

These assumptions are embedded in the frontend code. If the backend deviates, these areas need updating:

1. **Pool discovery**: The frontend finds a pool by calling the list endpoint with `club_code + active_only=true` and using the first result. At most one active pool per club is expected.
2. **Field shape**: RVCC returns `players[]`, Crestmont returns `buckets[]`. The frontend checks which field is present.
3. **Bucket numbering**: 1-indexed, matching `bucket_number` on both field and leaderboard responses.
4. **Golfer identity**: `dg_id` (DataGolf numeric ID) is the stable identifier across all endpoints.
5. **No pagination**: The frontend does not paginate any endpoint response except pool events.
6. **No real-time push**: The leaderboard polls every 5 minutes via `useApi`. No WebSockets or SSE.

---

## Data Flow

```
DataGolf API → golf_leaderboard (every 5 min during rounds)
                    ↓
           golf_score_pools task
                    ↓
    golf_pool_entry_scores (per-entry materialized + rank)
                    ↓
           GET /api/golf/pools/{id}/leaderboard
```

Leaderboard reads are fast because results are pre-computed by the backend. The frontend never computes scores.
