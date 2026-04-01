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
  // uploadEnabled/uploadRequired removed — file upload is admin-only
  rulesDescription: string[];
}

// Rules from the backend pool's rules_json field
export interface PoolRules {
  variant: string;
  pick_count: number;
  count_best: number;
  min_cuts_to_qualify: number;
  uses_buckets: boolean;
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
