import type { ApiClient } from '../types';
import type { ClubCode, EntrySubmissionRequest, PoolEvent, CreatePoolRequest, ClubBranding, ClubBilling } from '../../types/domain';
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
} from './data';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Sentinel locked_at returned for pools configured as locked in tests. */
export const MOCK_LOCKED_AT = '2026-04-09T11:00:00Z';

/** Default mock lock_time for unlocked pools. */
const MOCK_LOCK_TIME = '2026-04-09T07:00:00Z';

const ALL_MOCK_POOLS = [MOCK_RVCC_POOL, MOCK_CRESTMONT_POOL];

export class MockApiClient implements ApiClient {
  private latencyMs: number;
  private readonly lockedPoolIds: ReadonlySet<number>;
  private readonly mockEvents: PoolEvent[];
  private readonly mockLockTime: string | null;
  private readonly billingRequired: boolean;
  private readonly referredClubCompleted: boolean;
  /** Tracks submitted email+pool combos to simulate 409 duplicate responses. */
  private readonly submittedEntries = new Set<string>();

  constructor(
    latencyMs = 300,
    lockedPoolIds: number[] = [],
    mockEvents: PoolEvent[] = [],
    mockLockTime: string | null = MOCK_LOCK_TIME,
    billingRequired = false,
    referredClubCompleted = false,
  ) {
    this.latencyMs = latencyMs;
    this.lockedPoolIds = new Set(lockedPoolIds);
    this.mockEvents = mockEvents;
    this.mockLockTime = mockLockTime;
    this.billingRequired = billingRequired;
    this.referredClubCompleted = referredClubCompleted;
  }

  async getActivePool(clubCode: ClubCode) {
    await delay(this.latencyMs);
    if (clubCode === 'rvcc') return MOCK_RVCC_POOL;
    if (clubCode === 'crestmont') return MOCK_CRESTMONT_POOL;
    return null;
  }

  async getPoolDetail(poolId: number) {
    await delay(this.latencyMs);
    if (poolId === MOCK_CRESTMONT_POOL.id) return MOCK_CRESTMONT_POOL;
    return MOCK_RVCC_POOL;
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
    return pool ?? null;
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
