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
  PoolEntry,
  ClubBranding,
  ClubBilling,
  ReferralInfo,
  ReferralCreditResponse,
  AdminStats,
  AdminPollHealth,
  ClubClaim,
  ClubClaimResponse,
  Player,
  PlayerScore,
  EntryLeaderboardResponse,
} from '../types/domain';

export interface SlugCheckResponse {
  available: boolean;
  reason: string | null;
}

export interface PendingClub {
  club_slug: string;
  club_name: string;
  onboard_step: number;
  payment_session_id: string;
}

export interface VerifySessionResponse {
  status: 'pending' | 'provisioned';
  club_name: string | null;
  email: string | null;
  club_slug: string | null;
  onboard_url: string | null;
}

export interface CreateClubRequest {
  session_id: string;
  club_name: string;
  slug: string;
}

export interface CreateClubResponse {
  club_slug: string;
  onboard_url: string;
}

export interface OnboardingWizardSubmitRequest {
  club_slug: string;
  pool_name: string;
  tournament_id: number;
  entry_deadline: string;
  max_entries_per_email: number;
  rules_json: CreatePoolRequest['rules_json'];
}

export interface OnboardingWizardSubmitResponse {
  pool_id: number;
  redirect_url: string;
  pool_token: string;
  entry_url: string;
}

export interface SendInvitesRequest {
  emails: string[];
}

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
  createCheckoutSession(): Promise<{ session_url: string }>;
  checkSlugAvailability(slug: string, signal?: AbortSignal): Promise<SlugCheckResponse>;
  verifyCheckoutSession(sessionId: string): Promise<VerifySessionResponse>;
  createClub(request: CreateClubRequest): Promise<CreateClubResponse>;
  submitOnboardingWizard(request: OnboardingWizardSubmitRequest): Promise<OnboardingWizardSubmitResponse>;
  sendPoolInvites(poolId: number, request: SendInvitesRequest): Promise<void>;
  lockPool(poolId: number): Promise<PoolSummary>;
  unlockPool(poolId: number): Promise<PoolSummary>;
  getPendingClub(): Promise<PendingClub | null>;
  getPlayerRoster(tournamentId: number): Promise<Player[]>;
  getLiveTournamentLeaderboard(tournamentId: number): Promise<PlayerScore[]>;
  getEntry(entryId: number): Promise<PoolEntry>;
  getEntryLeaderboard(entryId: number): Promise<EntryLeaderboardResponse | null>;
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
  checkoutSession: () => `${API_BASE_URL}/checkout/session`,
  verifyCheckoutSession: () => `${API_BASE_URL}/checkout/verify`,
  slugCheck: (slug: string) => `${API_BASE_URL}/clubs/slug-check?slug=${encodeURIComponent(slug)}`,
  createClub: () => `${API_BASE_URL}/clubs`,
  wizardSubmit: () => `${API_BASE_URL}/clubs/wizard/submit`,
  poolInvites: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/invites`,
  lockPool: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/lock`,
  unlockPool: (poolId: number) => `${API_BASE_URL}/golf/pools/${poolId}/unlock`,
  pendingClub: () => `${API_BASE_URL}/clubs/pending`,
  playerRoster: (tournamentId: number) => `${API_BASE_URL}/golf/tournaments/${tournamentId}/roster`,
  tournamentLeaderboard: (tournamentId: number) => `${API_BASE_URL}/golf/tournaments/${tournamentId}/leaderboard`,
  entry: (entryId: number) => `${API_BASE_URL}/golf/entries/${entryId}`,
  entryLeaderboard: (entryId: number) => `${API_BASE_URL}/golf/entries/${entryId}/leaderboard`,
} as const;
