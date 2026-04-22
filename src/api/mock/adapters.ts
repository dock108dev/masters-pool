import type { ApiClient, SlugCheckResponse, VerifySessionResponse, CreateClubRequest, CreateClubResponse, OnboardingWizardSubmitRequest, OnboardingWizardSubmitResponse, SendInvitesRequest, PendingClub } from '../types';
import type { ClubCode, EntrySubmissionRequest, PoolEvent, CreatePoolRequest, ClubBranding, ClubBilling, ClubClaim, ClubClaimResponse, PoolStatus, Player, PlayerScore, EntryLeaderboardResponse } from '../../types/domain';
import {
  MOCK_RVCC_POOL,
  MOCK_CRESTMONT_POOL,
  MOCK_RVCC_FIELD,
  MOCK_CRESTMONT_FIELD,
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
  MOCK_TOURNAMENTS,
  MOCK_RVCC_ENTRIES,
  MOCK_CRESTMONT_ENTRIES,
  MOCK_RVCC_BRANDING,
  MOCK_CRESTMONT_BRANDING,
  MOCK_RVCC_BILLING,
  MOCK_CRESTMONT_BILLING,
  MOCK_RVCC_REFERRAL,
  MOCK_CRESTMONT_REFERRAL,
  MOCK_ADMIN_STATS,
  MOCK_ADMIN_POLL_HEALTH,
  MOCK_PLAYER_ROSTER,
  MOCK_TOURNAMENT_LEADERBOARD,
} from './data';

// Use microtask (Promise.resolve) for zero latency so mock resolves within the
// current act() boundary in tests — setTimeout(0) fires outside act() when fake
// timers with shouldAdvanceTime are active, breaking state-update assertions.
const delay = (ms: number) =>
  ms === 0 ? Promise.resolve() : new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Sentinel locked_at returned for pools configured as locked in tests. */
export const MOCK_LOCKED_AT = '2026-04-09T11:00:00Z';

/** Default mock lock_time for unlocked pools. */
const MOCK_LOCK_TIME = '2026-04-09T07:00:00Z';

const ALL_MOCK_POOLS = [MOCK_RVCC_POOL, MOCK_CRESTMONT_POOL];

export class MockApiClient implements ApiClient {
  private latencyMs: number;
  private readonly lockedPoolIds: ReadonlySet<number>;
  private readonly closedPoolIds: ReadonlySet<number>;
  private readonly mockEvents: PoolEvent[];
  private readonly mockLockTime: string | null;
  private readonly billingRequired: boolean;
  private readonly referredClubCompleted: boolean;
  private readonly takenSlugs: ReadonlySet<string>;
  private readonly checkoutSessionProvisioned: boolean;
  private readonly mockSessionClubName: string;
  private readonly hasPendingClub: boolean;
  /** Tracks submitted email+pool combos to simulate 409 duplicate responses. */
  private readonly submittedEntries = new Set<string>();
  /** Mutable pool status overrides set by lockPool/unlockPool calls. */
  private readonly poolStatusOverrides: Map<number, PoolStatus> = new Map();

  constructor(
    latencyMs = 300,
    lockedPoolIds: number[] = [],
    mockEvents: PoolEvent[] = [],
    mockLockTime: string | null = MOCK_LOCK_TIME,
    billingRequired = false,
    referredClubCompleted = false,
    takenSlugs: string[] = [],
    checkoutSessionProvisioned = false,
    mockSessionClubName = 'Mock Club',
    closedPoolIds: number[] = [],
    hasPendingClub = false,
  ) {
    this.latencyMs = latencyMs;
    this.lockedPoolIds = new Set(lockedPoolIds);
    this.closedPoolIds = new Set(closedPoolIds);
    this.mockEvents = mockEvents;
    this.mockLockTime = mockLockTime;
    this.billingRequired = billingRequired;
    this.referredClubCompleted = referredClubCompleted;
    this.takenSlugs = new Set(takenSlugs);
    this.checkoutSessionProvisioned = checkoutSessionProvisioned;
    this.mockSessionClubName = mockSessionClubName;
    this.hasPendingClub = hasPendingClub;
  }

  async getActivePool(clubCode: ClubCode) {
    await delay(this.latencyMs);
    const pool = clubCode === 'rvcc' ? MOCK_RVCC_POOL : clubCode === 'crestmont' ? MOCK_CRESTMONT_POOL : null;
    if (!pool) return null;
    const statusOverride = this.poolStatusOverrides.get(pool.id);
    if (statusOverride) return { ...pool, status: statusOverride };
    if (this.closedPoolIds.has(pool.id)) return { ...pool, status: 'final' as const };
    if (this.lockedPoolIds.has(pool.id)) return { ...pool, status: 'locked' as const };
    return pool;
  }

  async getPoolDetail(poolId: number) {
    await delay(this.latencyMs);
    const base = poolId === MOCK_CRESTMONT_POOL.id ? MOCK_CRESTMONT_POOL : MOCK_RVCC_POOL;
    const statusOverride = this.poolStatusOverrides.get(poolId);
    return statusOverride ? { ...base, status: statusOverride } : base;
  }

  async getPoolField(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_FIELD.pool_id) return MOCK_CRESTMONT_FIELD;
    return MOCK_RVCC_FIELD;
  }

  async submitEntry(poolId: number, request: EntrySubmissionRequest) {
    await delay(this.latencyMs);
    if (this.lockedPoolIds.has(poolId)) {
      const err = Object.assign(new Error('Pool is locked — entry submissions are closed.'), {
        code: 'POOL_LOCKED',
        status: 409,
      });
      throw err;
    }
    const email = request.email.trim();
    if (email) {
      const key = `${poolId}:${email.toLowerCase()}`;
      if (this.submittedEntries.has(key)) {
        throw Object.assign(new Error('You already submitted an entry for this pool.'), {
          code: 'DUPLICATE_ENTRY',
          status: 409,
        });
      }
      this.submittedEntries.add(key);
    }
    return {
      entry_id: Date.now(),
      confirmationCode: `CONF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      email: request.email,
      entry_name: request.entry_name,
      picks: request.picks,
      submittedAt: new Date().toISOString(),
    };
  }

  async getLockStatus(poolId: number) {
    await delay(this.latencyMs);
    if (this.lockedPoolIds.has(poolId)) {
      return { locked: true as const, locked_at: MOCK_LOCKED_AT, lock_time: null as null };
    }
    return { locked: false as const, locked_at: null, lock_time: this.mockLockTime };
  }

  async getLeaderboard(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_LEADERBOARD.pool_id) return MOCK_CRESTMONT_LEADERBOARD;
    return MOCK_RVCC_LEADERBOARD;
  }

  async getPoolEvents(poolId: number, page = 1, pageSize = 50) {
    await delay(this.latencyMs);
    const filtered = this.mockEvents.filter((e) => e.pool_id === poolId);
    const offset = (page - 1) * pageSize;
    return {
      pool_id: poolId,
      events: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
      page,
      page_size: pageSize,
    };
  }

  async getTournaments() {
    await delay(this.latencyMs);
    return MOCK_TOURNAMENTS;
  }

  async createPool(request: CreatePoolRequest) {
    await delay(this.latencyMs);
    if (this.billingRequired) {
      throw Object.assign(
        new Error('A Stripe subscription is required to create additional pools.'),
        { code: 'billing_required', status: 402 },
      );
    }
    return {
      id: Date.now(),
      code: `${request.club_code}-pool-${Date.now()}`,
      name: request.name,
      club_code: request.club_code,
      tournament_id: request.tournament_id,
      status: 'open' as const,
      entry_deadline: request.entry_deadline,
      max_entries_per_email: request.max_entries_per_email,
      scoring_enabled: false,
      rules_json: request.rules_json,
    };
  }

  async getPoolByToken(clubCode: ClubCode, poolToken: string) {
    await delay(this.latencyMs);
    const pool = ALL_MOCK_POOLS.find(
      (p) => p.club_code === clubCode && p.pool_token === poolToken
    );
    if (!pool) return null;
    const statusOverride = this.poolStatusOverrides.get(pool.id);
    if (statusOverride) return { ...pool, status: statusOverride };
    if (this.closedPoolIds.has(pool.id)) return { ...pool, status: 'final' as const };
    if (this.lockedPoolIds.has(pool.id)) return { ...pool, status: 'locked' as const };
    return pool;
  }

  async getPoolEntries(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_ENTRIES.pool_id) return MOCK_CRESTMONT_ENTRIES;
    return MOCK_RVCC_ENTRIES;
  }

  async downloadPoolEntriesCsv(_poolId: number) {
    await delay(this.latencyMs);
    const csv = 'name,email,submitted_at\nmock,mock@test.com,2026-04-08T10:00:00Z';
    return new Blob([csv], { type: 'text/csv' });
  }

  async getClubBranding(clubCode: ClubCode): Promise<ClubBranding> {
    await delay(this.latencyMs);
    if (clubCode === 'crestmont') return { ...MOCK_CRESTMONT_BRANDING };
    return { ...MOCK_RVCC_BRANDING };
  }

  async updateClubBranding(clubCode: ClubCode, branding: Partial<ClubBranding>): Promise<ClubBranding> {
    await delay(this.latencyMs);
    const current = clubCode === 'crestmont' ? MOCK_CRESTMONT_BRANDING : MOCK_RVCC_BRANDING;
    return { ...current, ...branding };
  }

  async getClubBilling(clubCode: ClubCode): Promise<ClubBilling> {
    await delay(this.latencyMs);
    if (clubCode === 'crestmont') return { ...MOCK_CRESTMONT_BILLING };
    return { ...MOCK_RVCC_BILLING };
  }

  async createBillingPortalSession(_clubCode: ClubCode): Promise<{ url: string }> {
    await delay(this.latencyMs);
    return { url: 'https://billing.stripe.com/session/mock' };
  }

  async getClubPools(clubCode: ClubCode) {
    await delay(this.latencyMs);
    if (clubCode === 'crestmont') {
      return [{ ...MOCK_CRESTMONT_POOL, entry_count: MOCK_CRESTMONT_ENTRIES.count }];
    }
    return [{ ...MOCK_RVCC_POOL, entry_count: MOCK_RVCC_ENTRIES.count }];
  }

  async getReferralInfo(clubCode: ClubCode) {
    await delay(this.latencyMs);
    if (clubCode === 'crestmont') return { ...MOCK_CRESTMONT_REFERRAL };
    return { ...MOCK_RVCC_REFERRAL };
  }

  async applyReferralCredit(_referralCode: string, _referredClubCode: ClubCode) {
    await delay(this.latencyMs);
    if (!this.referredClubCompleted) {
      throw Object.assign(
        new Error('Referred club has not completed a pool.'),
        { code: 'REFERRED_CLUB_INCOMPLETE', status: 400 },
      );
    }
    return { credit_balance: 1, credit_awarded: true };
  }

  async getAdminStats() {
    await delay(this.latencyMs);
    return { ...MOCK_ADMIN_STATS };
  }

  async getPollHealth() {
    await delay(this.latencyMs);
    return {
      ...MOCK_ADMIN_POLL_HEALTH,
      tournaments: MOCK_ADMIN_POLL_HEALTH.tournaments.map((t) => ({ ...t })),
    };
  }

  async createCheckoutSession(): Promise<{ session_url: string }> {
    await delay(this.latencyMs);
    return { session_url: 'https://checkout.stripe.com/pay/mock_cs_test_xxx' };
  }

  async checkSlugAvailability(slug: string, _signal?: AbortSignal): Promise<SlugCheckResponse> {
    await delay(this.latencyMs);
    const available = !this.takenSlugs.has(slug);
    return { available, reason: available ? null : 'taken' };
  }

  async submitClubClaim(_claim: ClubClaim): Promise<ClubClaimResponse> {
    await delay(this.latencyMs);
    return {
      claim_id: `claim_${Date.now().toString(36)}`,
      received_at: new Date().toISOString(),
    };
  }

  async verifyCheckoutSession(_sessionId: string): Promise<VerifySessionResponse> {
    await delay(this.latencyMs);
    if (this.checkoutSessionProvisioned) {
      return {
        status: 'provisioned',
        club_name: this.mockSessionClubName,
        email: 'owner@example.com',
        club_slug: 'mock-club',
        onboard_url: '/admin',
      };
    }
    return {
      status: 'pending',
      club_name: this.mockSessionClubName,
      email: 'owner@example.com',
      club_slug: null,
      onboard_url: null,
    };
  }

  async createClub(request: CreateClubRequest): Promise<CreateClubResponse> {
    await delay(this.latencyMs);
    return {
      club_slug: request.slug,
      onboard_url: '/admin',
    };
  }

  async submitOnboardingWizard(
    request: OnboardingWizardSubmitRequest,
  ): Promise<OnboardingWizardSubmitResponse> {
    await delay(this.latencyMs);
    const poolId = 9999;
    const token = 'mock-pool-token-9999';
    return {
      pool_id: poolId,
      redirect_url: `/admin/pools/${poolId}`,
      pool_token: token,
      entry_url: `https://${request.club_slug}.countryclubpicks.com/enter/${token}`,
    };
  }

  async lockPool(poolId: number) {
    await delay(this.latencyMs);
    this.poolStatusOverrides.set(poolId, 'locked');
    const base = poolId === MOCK_CRESTMONT_POOL.id ? MOCK_CRESTMONT_POOL : MOCK_RVCC_POOL;
    return { ...base, status: 'locked' as const };
  }

  async unlockPool(poolId: number) {
    await delay(this.latencyMs);
    this.poolStatusOverrides.set(poolId, 'open');
    const base = poolId === MOCK_CRESTMONT_POOL.id ? MOCK_CRESTMONT_POOL : MOCK_RVCC_POOL;
    return { ...base, status: 'open' as const };
  }

  async getPendingClub(): Promise<PendingClub | null> {
    await delay(this.latencyMs);
    if (!this.hasPendingClub) return null;
    return {
      club_slug: 'pending-club',
      club_name: 'Pending Club',
      onboard_step: 1,
      payment_session_id: 'cs_mock_pending',
    };
  }

  async getPlayerRoster(_tournamentId: number): Promise<Player[]> {
    await delay(this.latencyMs);
    return [...MOCK_PLAYER_ROSTER];
  }

  async getLiveTournamentLeaderboard(_tournamentId: number): Promise<PlayerScore[]> {
    await delay(this.latencyMs);
    return [...MOCK_TOURNAMENT_LEADERBOARD];
  }

  async sendPoolInvites(_poolId: number, _request: SendInvitesRequest): Promise<void> {
    await delay(this.latencyMs);
  }

  async getEntry(entryId: number) {
    await delay(this.latencyMs);
    const allEntries = [...MOCK_RVCC_ENTRIES.entries, ...MOCK_CRESTMONT_ENTRIES.entries];
    const entry = allEntries.find((e) => e.entry_id === entryId);
    if (!entry) {
      throw Object.assign(new Error(`Entry ${entryId} not found`), { status: 404 });
    }
    return entry;
  }

  async getEntryLeaderboard(entryId: number): Promise<EntryLeaderboardResponse | null> {
    await delay(this.latencyMs);
    const allStandings = [
      ...MOCK_RVCC_LEADERBOARD.standings,
      ...MOCK_CRESTMONT_LEADERBOARD.standings,
    ];
    const standing = allStandings.find((s) => s.entry_id === entryId);
    if (!standing) return null;
    return { standing, last_scored_at: MOCK_RVCC_LEADERBOARD.last_scored_at };
  }

  async lookupEntries(_poolId: number, email: string) {
    await delay(this.latencyMs);
    return {
      email,
      entries: [
        {
          entry_id: 9001,
          entry_name: 'Mock Entry',
          picks: [
            { dg_id: 18417, pick_slot: 1 },
            { dg_id: 28237, pick_slot: 2 },
            { dg_id: 21209, pick_slot: 3 },
          ],
          submittedAt: '2026-04-01T10:00:00Z',
          confirmationCode: 'CONF-ABC123',
        },
      ],
    };
  }
}
