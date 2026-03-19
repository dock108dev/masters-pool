# API Contracts

Typed contracts between the masters-pool-web frontend and the sports-data-admin backend Golf Pools API. All types are defined in `src/types/domain.ts`.

## Authentication

All endpoints require `X-API-Key` header. The frontend does not handle authentication beyond passing the key.

## Base URL

Configured in `src/api/types.ts` as `API_BASE_URL`. Currently `/api` (relative, expects a proxy or same-origin deployment).

---

## Endpoints

### Get Active Pool

```
GET /api/golf/pools?club_code={clubCode}&active_only=true
```

Returns the first pool matching the club code with status in (`open`, `locked`, `live`).

**Response:**
```typescript
{
  pools: PoolSummary[];
  count: number;
}
```

```typescript
interface PoolSummary {
  id: number;
  code: string;                    // e.g., "masters-2026-rvcc"
  name: string;
  club_code: ClubCode;            // "rvcc" | "crestmont"
  tournament_id: number;
  status: PoolStatus;             // "draft" | "open" | "locked" | "live" | "final" | "archived"
  entry_deadline: string;         // ISO 8601
  max_entries_per_email: number;
  scoring_enabled: boolean;
  rules_json: PoolRules;
}

interface PoolRules {
  variant: string;                // "rvcc" | "crestmont"
  pick_count: number;             // 7 for RVCC, 6 for Crestmont
  count_best: number;             // 5 for RVCC, 4 for Crestmont
  min_cuts_to_qualify: number;    // 5 for RVCC, 4 for Crestmont
  uses_buckets: boolean;
}
```

---

### Get Pool Field

```
GET /api/golf/pools/{poolId}/field
```

Returns available golfers for pick selection. Shape differs by variant.

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
```

```typescript
interface FieldPlayer {
  dg_id: number;                  // DataGolf player ID
  player_name: string;
}

interface FieldBucket {
  bucket_number: number;          // 1-indexed (1-6)
  label: string;                  // e.g., "Tier 1"
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
{
  email: string;
  entry_name: string;
  picks: EntryPick[];
}

interface EntryPick {
  dg_id: number;
  pick_slot: number;              // 1-indexed position
  bucket_number?: number;         // Required for Crestmont
}
```

**Backend validation:**
- Entry deadline has not passed
- Max entries per email not exceeded
- Pick count matches `rules_json.pick_count`
- No duplicate golfers
- All golfers are in the tournament field
- For Crestmont: one pick per bucket, each from the correct bucket

Returns `422` with specific error messages on validation failure.

**Response:**
```typescript
{
  entry_id: number;
  email: string;
  entry_name: string;
  picks: EntryPick[];
  // Additional fields TBD by backend
}
```

---

### Get Leaderboard

```
GET /api/golf/pools/{poolId}/leaderboard
```

**Response:**
```typescript
{
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
  aggregate_score: number | null; // Sum of counted golfer scores; null if not qualified
  qualification_status: "qualified" | "pending" | "not_qualified";
  qualified_golfers_count: number;
  counted_golfers_count: number;
  is_complete: boolean;           // All rounds finished
  picks: LeaderboardPick[];
}

interface LeaderboardPick {
  dg_id: number;
  player_name: string;
  total_score: number | null;     // Cumulative tournament score
  position: number | null;        // Current tournament position
  thru: number | null;            // Holes completed in current round (18 = finished)
  r1: number | null;              // Round 1 score
  r2: number | null;
  r3: number | null;
  r4: number | null;
  status: "active" | "cut" | "wd" | "dq";
  made_cut: boolean;
  counts_toward_total: boolean;   // True if this golfer's score contributes to aggregate
  is_dropped: boolean;            // True if actively dropped (made cut but not in best N)
  bucket_number?: number;         // Present for Crestmont entries
}
```

**Qualification status semantics:**
- `qualified`: Enough active golfers meet the minimum (5 for RVCC, 4 for Crestmont)
- `pending`: Cut has not been settled yet (round 2 not complete)
- `not_qualified`: After the cut, too few active golfers

**Counted vs dropped:**
Among active (made cut) golfers, the best N by `total_score` are `counts_toward_total: true`. The rest are `is_dropped: true`. Cut/WD/DQ golfers have both as `false`.

---

### Look Up Entries by Email

```
GET /api/golf/pools/{poolId}/entries/by-email?email={email}
```

**Response:**
```typescript
{
  email: string;
  entries: EntryLookupEntry[];
}

interface EntryLookupEntry {
  entry_id: number;
  entry_name: string;
  picks: EntryPick[];
  submittedAt: string;            // ISO 8601
  confirmationCode: string;
}
```

---

## Data Flow

```
DataGolf API → golf_leaderboard (every 5 min)
                    ↓
           golf_score_pools task (every 5 min)
                    ↓
    golf_pool_entry_score_players (per-golfer materialized)
    golf_pool_entry_scores (per-entry materialized + rank)
                    ↓
           GET /api/golf/pools/{id}/leaderboard
```

The backend materializes scored results every 5 minutes during active tournaments. Leaderboard reads are fast because results are pre-computed. The frontend does not compute scoring — it displays what the backend provides.

---

## Frontend Assumptions

These assumptions are embedded in the frontend code. If the backend deviates, these areas need updating:

1. **Pool discovery**: The frontend finds a pool by calling the list endpoint with `club_code` + `active_only=true` and using the first result. It assumes at most one active pool per club.
2. **Field endpoint shape**: RVCC returns `players[]`, Crestmont returns `buckets[]`. The frontend checks which field is present.
3. **Bucket numbering**: 1-indexed, matching `bucket_number` on both field and leaderboard responses.
4. **Golfer identity**: `dg_id` (DataGolf numeric ID) is the stable identifier across all endpoints.
5. **No pagination**: The frontend does not paginate any endpoint response.
6. **No real-time push**: The frontend does not use WebSockets or SSE for live updates. Users must refresh the leaderboard page manually.
