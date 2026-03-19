export type ClubCode = 'rvcc' | 'crestmont';

export type GolferStatus = 'active' | 'cut' | 'wd' | 'dq';

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
  uploadEnabled: boolean;
  uploadRequired: boolean;
  rulesDescription: string[];
}

export interface TournamentSummary {
  id: string;
  name: string;
  year: number;
  clubCode: ClubCode;
  status: 'upcoming' | 'active' | 'completed';
  startDate: string;
  endDate: string;
}

export interface TournamentDetail extends TournamentSummary {
  courseName: string;
  rounds: number;
  currentRound: number | null;
  entriesCount: number;
  entryDeadline: string;
}

export interface GolferBucket {
  bucketIndex: number;
  label: string;
  golfers: AvailableGolfer[];
}

export interface AvailableGolfer {
  id: string;
  name: string;
  ranking: number | null;
  country: string;
  bucketIndex?: number;
}

export interface EntrySubmissionRequest {
  clubCode: ClubCode;
  tournamentId: string;
  email: string;
  displayName: string;
  golferIds: string[];
  uploadFile?: File;
}

export interface EntrySubmissionResponse {
  entryId: string;
  confirmationCode: string;
  email: string;
  displayName: string;
  golferNames: string[];
  submittedAt: string;
}

export interface LeaderboardGolferCell {
  golferId: string;
  golferName: string;
  score: number | null;
  displayScore: string;
  thru: string;
  status: GolferStatus;
  isCounted: boolean;
  bucketLabel?: string;
}

export interface LeaderboardEntry {
  entryId: string;
  position: number | null;
  displayPosition: string;
  entryName: string;
  email: string;
  totalScore: number | null;
  displayTotal: string;
  isQualified: boolean;
  qualificationNote: string;
  countedCount: number;
  golfers: LeaderboardGolferCell[];
}

export interface LeaderboardData {
  tournamentId: string;
  tournamentName: string;
  clubCode: ClubCode;
  currentRound: number | null;
  lastUpdated: string;
  entries: LeaderboardEntry[];
}

export interface EntryLookupResult {
  email: string;
  entries: EntryLookupEntry[];
}

export interface EntryLookupEntry {
  entryId: string;
  displayName: string;
  golferNames: string[];
  submittedAt: string;
  confirmationCode: string;
}
