import type {
  ClubCode,
  PoolSummary,
  PoolFieldResponse,
  EntrySubmissionRequest,
  EntrySubmissionResponse,
  LeaderboardData,
  EntryLookupResult,
} from '../types/domain';

export interface ApiClient {
  getActivePool(clubCode: ClubCode): Promise<PoolSummary | null>;
  getPoolDetail(poolId: number): Promise<PoolSummary>;
  getPoolField(poolId: number): Promise<PoolFieldResponse>;
  submitEntry(poolId: number, request: EntrySubmissionRequest): Promise<EntrySubmissionResponse>;
  getLeaderboard(poolId: number): Promise<LeaderboardData>;
  lookupEntries(poolId: number, email: string): Promise<EntryLookupResult>;
}

export const API_BASE_URL = '/api';

export const API_ENDPOINTS = {
  pools: (clubCode: ClubCode) => `${API_BASE_URL}/golf/pools?club_code=${clubCode}&active_only=true`,
  poolDetail: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}`,
  poolField: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/field`,
  submitEntry: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/entries`,
  leaderboard: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/leaderboard`,
  lookupEntries: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/entries/by-email`,
} as const;
