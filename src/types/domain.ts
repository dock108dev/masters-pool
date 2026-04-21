export type ClubCode = 'rvcc' | 'crestmont';

export type GolferStatus = 'active' | 'cut' | 'wd' | 'dq';

export type PoolStatus = 'draft' | 'open' | 'locked' | 'live' | 'final' | 'archived';

export type QualificationStatus = 'qualified' | 'pending' | 'not_qualified';

export interface ClubConfig {
  code: ClubCode;
  name: string;
  shortName: string;
  pickCount: number;
  cutMinimum: number;
  countedScores: number;
  useBuckets: boolean;
  bucketLabels?: string[];
  maxEntriesPerEmail?: number;
  allowSelfServiceEntry: boolean;
  rulesDescription: string[];
}

// Rules from the backend pool's rules_json field
export interface PoolRules {
  variant: string;
  pick_count: number;
  count_best: number;
  min_cuts_to_qualify: number;
  uses_buckets: boolean;
  /** Score added to a WD player's completed-rounds total (opt-in; absent = WD treated as unscored) */
  wd_score_penalty?: number;
  /** Score added to a DQ player's completed-rounds total for display (DQ never counts toward aggregate) */
  dq_score_penalty?: number;
}

// Matches the real backend pool list/detail response
export interface PoolSummary {
  id: number;
  code: string;
  name: string;
  club_code: ClubCode;
  tournament_id: number;
  status: PoolStatus;
  entry_deadline: string;
  max_entries_per_email: number;
  scoring_enabled: boolean;
  rules_json: PoolRules;
  /** URL-safe token generated at pool publish time; used for public entry links */
  pool_token?: string;
  /** Total entries submitted; included in club pool listing responses */
  entry_count?: number;
}

// Field endpoint types
export interface FieldPlayer {
  dg_id: number;
  player_name: string;
}

export interface FieldBucket {
  bucket_number: number; // 1-indexed
  label: string;
  players: FieldPlayer[];
}

export interface PoolFieldResponse {
  pool_id: number;
  variant: string;
  players?: FieldPlayer[];   // present for RVCC (flat)
  buckets?: FieldBucket[];   // present for Crestmont (bucketed)
}

// Kept for UI pickers — adapts FieldPlayer/FieldBucket to a shared shape
export interface AvailableGolfer {
  dg_id: number;
  player_name: string;
  ranking?: number | null;
  country?: string;
}

export interface GolferBucket {
  bucket_number: number; // 1-indexed
  label: string;
  golfers: AvailableGolfer[];
}

// Entry submission
export interface EntryPick {
  dg_id: number;
  pick_slot: number;
  bucket_number?: number;
  player_name?: string;
}

export interface EntrySubmissionRequest {
  email: string;
  entry_name: string;
  picks: EntryPick[];
}

export interface EntrySubmissionResponse {
  entry_id: number;
  confirmationCode: string;
  email: string;
  entry_name: string;
  picks: EntryPick[];
  submittedAt: string;
}

// Leaderboard
export interface LeaderboardPick {
  dg_id: number;
  player_name: string;
  total_score: number | null;
  position: number | null;
  thru: number | null;
  r1: number | null;
  r2: number | null;
  r3: number | null;
  r4: number | null;
  status: GolferStatus;
  made_cut: boolean;
  counts_toward_total: boolean;
  is_dropped: boolean;
  bucket_number?: number;
}

export interface LeaderboardStanding {
  rank: number | null;
  is_tied: boolean;
  entry_id: number;
  entry_name: string;
  email: string;
  aggregate_score: number | null;
  qualification_status: QualificationStatus;
  qualified_golfers_count: number;
  counted_golfers_count: number;
  is_complete: boolean;
  picks: LeaderboardPick[];
}

export interface LeaderboardData {
  pool_id: number;
  last_scored_at: string;
  standings: LeaderboardStanding[];
  count: number;
}

// Pool lock status — mirrors /pools/:id/lock-status response
export interface PoolLockStatus {
  locked: boolean;
  locked_at: string | null;
  lock_time: string | null;
}

// Pool event log
export type PoolEventType =
  | 'entry_submitted'
  | 'entry_updated'
  | 'pool_published'
  | 'pool_locked'
  | 'score_recalculated'
  | 'email_delivery_failed';

export interface PoolEvent {
  id: number;
  pool_id: number;
  event_type: PoolEventType;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface PoolEventsPage {
  pool_id: number;
  events: PoolEvent[];
  total: number;
  page: number;
  page_size: number;
}

// Cut rule variants — one per major; backend enforces the actual logic
export type CutRuleType = 'masters' | 'pga_championship' | 'us_open' | 'the_open';

// Tournament option — used in pool creation wizard
export interface TournamentOption {
  id: number;
  name: string;
  year: number;
  cut_rule_type: CutRuleType;
  default_format: 'flat' | 'bucketed';
}

// Bucket definition — used in the pool creation wizard and rules_json for bucketed pools
export interface BucketDefinition {
  label: string;
  min_picks: number;
  max_picks: number;
}

// Rules shape for pool creation — extends PoolRules with optional engine/format fields
export interface CreatePoolRules extends PoolRules {
  /** Format engine identifier (e.g. 'golf', 'bracket'). Defaults to 'golf' when absent. */
  engine_type?: string;
  buckets?: BucketDefinition[];
  bracket_rounds?: number;
  bracket_points_per_round?: number[];
}

// Request body for POST /api/golf/pools
export interface CreatePoolRequest {
  club_code: ClubCode;
  name: string;
  tournament_id: number;
  entry_deadline: string;
  max_entries_per_email: number;
  rules_json: CreatePoolRules;
}

// Coordinator dashboard — pool entries
export interface PoolEntryPick {
  dg_id: number;
  player_name: string;
  pick_slot: number;
  bucket_number?: number;
}

export interface PoolEntry {
  entry_id: number;
  entry_name: string;
  email: string | null;
  submitted_at: string;
  picks: PoolEntryPick[];
}

export interface PoolEntriesResponse {
  pool_id: number;
  entries: PoolEntry[];
  count: number;
}

// Club branding — fetched at runtime from GET /api/clubs/:clubCode/branding
export interface ClubBranding {
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
}

// Club billing — mirrors GET /api/clubs/:clubCode/billing
export type BillingStatus = 'trial' | 'active' | 'suspended';

export interface ClubBilling {
  billing_status: BillingStatus;
  stripe_customer_id: string | null;
  trial_used: boolean;
  /** ISO date string; present only when billing_status is 'active' */
  next_invoice_date: string | null;
  /** Stripe customer portal URL; present when stripe_customer_id exists */
  billing_portal_url: string | null;
}

// Coordinator referral
export interface ReferralInfo {
  referral_code: string;
  referral_url: string;
  credit_balance: number;
  referred_clubs_count: number;
}

export interface ReferralCreditResponse {
  credit_balance: number;
  credit_awarded: boolean;
}

// Developer operations dashboard — admin-only platform stats
export interface AdminStats {
  total_pools: number;
  total_entries: number;
  active_clubs: number;
  /** Monthly recurring revenue from Stripe, in cents. 0 when no active subscriptions. */
  mrr_cents: number;
}

export interface TournamentPollHealth {
  pool_id: number;
  pool_name: string;
  tournament_name: string;
  /** ISO timestamp of last successful data poll; null if never polled. */
  last_polled_at: string | null;
  /** True if we are currently within the active tournament window. */
  is_in_window: boolean;
  /** True only when is_in_window AND the gap since last_polled_at exceeds 30 minutes. */
  is_stale: boolean;
}

export interface AdminPollHealth {
  tournaments: TournamentPollHealth[];
  checked_at: string;
}

// Entry lookup
export interface EntryLookupEntry {
  entry_id: number;
  entry_name: string;
  picks: EntryPick[];
  submittedAt: string;
  confirmationCode: string;
}

export interface EntryLookupResult {
  email: string;
  entries: EntryLookupEntry[];
}
