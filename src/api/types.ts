import type {
  ClubCode,
  TournamentSummary,
  TournamentDetail,
  AvailableGolfer,
  GolferBucket,
  EntrySubmissionRequest,
  EntrySubmissionResponse,
  LeaderboardData,
  EntryLookupResult,
} from '../types/domain';

export interface ApiClient {
  getActiveTournament(clubCode: ClubCode): Promise<TournamentSummary | null>;
  getTournamentDetail(tournamentId: string): Promise<TournamentDetail>;
  getAvailableGolfers(tournamentId: string): Promise<AvailableGolfer[]>;
  getGolferBuckets(tournamentId: string): Promise<GolferBucket[]>;
  submitEntry(request: EntrySubmissionRequest): Promise<EntrySubmissionResponse>;
  getLeaderboard(tournamentId: string): Promise<LeaderboardData>;
  lookupEntries(clubCode: ClubCode, email: string): Promise<EntryLookupResult>;
  uploadFile?(file: File, entryId: string): Promise<{ url: string }>;
}

// TODO: Replace these with real API base URLs once backend is available
export const API_BASE_URL = '/api/v1';

export const API_ENDPOINTS = {
  activeTournament: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/tournament/active`,
  tournamentDetail: (id: string) => `${API_BASE_URL}/tournaments/${id}`,
  availableGolfers: (id: string) => `${API_BASE_URL}/tournaments/${id}/golfers`,
  golferBuckets: (id: string) => `${API_BASE_URL}/tournaments/${id}/buckets`,
  submitEntry: () => `${API_BASE_URL}/entries`,
  leaderboard: (id: string) => `${API_BASE_URL}/tournaments/${id}/leaderboard`,
  lookupEntries: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/entries/lookup`,
  uploadFile: () => `${API_BASE_URL}/uploads`,
} as const;
