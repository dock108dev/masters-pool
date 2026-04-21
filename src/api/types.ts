import type {
  ClubCode,
  PoolSummary,
  PoolFieldResponse,
  EntrySubmissionRequest,
  EntrySubmissionResponse,
  LeaderboardData,
  EntryLookupResult,
  PoolLockStatus,
  PoolEventsPage,
  TournamentOption,
  CreatePoolRequest,
  PoolEntriesResponse,
  ClubBranding,
  ClubBilling,
  ReferralInfo,
  ReferralCreditResponse,
  AdminStats,
  AdminPollHealth,
  ClubClaim,
  ClubClaimResponse,
} from '../types/domain';

export interface ApiClient {
  getActivePool(clubCode: ClubCode): Promise<PoolSummary | null>;
  getPoolDetail(poolId: number): Promise<PoolSummary>;
  getPoolField(poolId: number): Promise<PoolFieldResponse>;
  submitEntry(poolId: number, request: EntrySubmissionRequest): Promise<EntrySubmissionResponse>;
  getLeaderboard(poolId: number): Promise<LeaderboardData>;
  lookupEntries(poolId: number, email: string): Promise<EntryLookupResult>;
  getLockStatus(poolId: number): Promise<PoolLockStatus>;
  getPoolEvents(poolId: number, page?: number, pageSize?: number): Promise<PoolEventsPage>;
  getTournaments(): Promise<TournamentOption[]>;
  createPool(request: CreatePoolRequest): Promise<PoolSummary>;
  getPoolByToken(clubCode: ClubCode, poolToken: string): Promise<PoolSummary | null>;
  getPoolEntries(poolId: number): Promise<PoolEntriesResponse>;
  downloadPoolEntriesCsv(poolId: number): Promise<Blob>;
  getClubBranding(clubCode: ClubCode): Promise<ClubBranding>;
  updateClubBranding(clubCode: ClubCode, branding: Partial<ClubBranding>): Promise<ClubBranding>;
  getClubBilling(clubCode: ClubCode): Promise<ClubBilling>;
  createBillingPortalSession(clubCode: ClubCode): Promise<{ url: string }>;
  getClubPools(clubCode: ClubCode): Promise<PoolSummary[]>;
  getReferralInfo(clubCode: ClubCode): Promise<ReferralInfo>;
  applyReferralCredit(referralCode: string, referredClubCode: ClubCode): Promise<ReferralCreditResponse>;
  getAdminStats(): Promise<AdminStats>;
  getPollHealth(): Promise<AdminPollHealth>;
  submitClubClaim(claim: ClubClaim): Promise<ClubClaimResponse>;
}

export const API_BASE_URL = '/api';

export const API_ENDPOINTS = {
  pools: (clubCode: ClubCode) => `${API_BASE_URL}/golf/pools?club_code=${clubCode}&active_only=true`,
  poolDetail: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}`,
  poolField: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/field`,
  submitEntry: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/entries`,
  leaderboard: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/leaderboard`,
  lookupEntries: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/entries/by-email`,
  lockStatus: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/lock-status`,
  poolEvents: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/events`,
  tournaments: () => `${API_BASE_URL}/golf/tournaments`,
  createPool: () => `${API_BASE_URL}/golf/pools`,
  poolByToken: (clubCode: ClubCode, token: string) =>
    `${API_BASE_URL}/golf/pools/by-token/${encodeURIComponent(token)}?club_code=${clubCode}`,
  poolEntries: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/entries`,
  poolEntriesCsv: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/entries/csv`,
  clubBranding: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/branding`,
  clubBilling: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/billing`,
  billingPortal: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/billing/portal`,
  clubPools: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/pools`,
  referralInfo: (clubCode: ClubCode) => `${API_BASE_URL}/clubs/${clubCode}/referral`,
  referralCredit: () => `${API_BASE_URL}/clubs/referral/apply`,
  adminStats: () => `${API_BASE_URL}/admin/stats`,
  pollHealth: () => `${API_BASE_URL}/admin/poll-health`,
  clubClaims: () => `${API_BASE_URL}/onboarding/club-claims`,
} as const;
