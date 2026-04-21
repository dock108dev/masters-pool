import type { ApiClient } from './types';
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
  PoolEventType,
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
import { API_ENDPOINTS } from './types';

/**
 * HTTP client that talks to the sports-data-admin backend.
 * Vite proxies /api → localhost:8000 and injects the API key header.
 */
export class HttpApiClient implements ApiClient {
  async getActivePool(clubCode: ClubCode): Promise<PoolSummary | null> {
    const res = await fetch(API_ENDPOINTS.pools(clubCode));
    if (!res.ok) throw new Error(`Failed to fetch pools: ${res.status}`);
    const data = await res.json();
    const pools = data.pools ?? [];
    return pools.length > 0 ? pools[0] : null;
  }

  async getPoolDetail(poolId: number): Promise<PoolSummary> {
    const res = await fetch(API_ENDPOINTS.poolDetail(poolId));
    if (!res.ok) throw new Error(`Failed to fetch pool: ${res.status}`);
    return res.json();
  }

  async getPoolField(poolId: number): Promise<PoolFieldResponse> {
    const res = await fetch(API_ENDPOINTS.poolField(poolId));
    if (!res.ok) throw new Error(`Failed to fetch field: ${res.status}`);
    const data = await res.json();

    // Map backend shape to frontend shape
    // Backend flat: { pool_id, format: "flat", field: [...] }
    // Backend bucketed: { pool_id, format: "bucketed", buckets: [...] }
    // Frontend expects: { pool_id, variant, players?: [...], buckets?: [...] }
    return {
      pool_id: data.pool_id,
      variant: data.format,
      players: data.field ?? undefined,
      buckets: data.buckets ?? undefined,
    };
  }

  async submitEntry(poolId: number, request: EntrySubmissionRequest): Promise<EntrySubmissionResponse> {
    const res = await fetch(API_ENDPOINTS.submitEntry(poolId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json().catch((parseErr: unknown) => {
        console.error('[HttpApiClient] Failed to parse submitEntry error body:', parseErr);
        return null;
      });
      const msg = err?.detail
        ? typeof err.detail === 'string'
          ? err.detail
          : JSON.stringify(err.detail)
        : `Submission failed: ${res.status}`;
      throw new Error(msg);
    }
    const data = await res.json();
    const entry = data.entry;

    // Backend doesn't return confirmation_code — use entry ID as reference
    return {
      entry_id: entry.id,
      confirmationCode: `ENTRY-${entry.id}`,
      email: entry.email,
      entry_name: entry.entry_name ?? request.entry_name,
      picks: request.picks, // Backend doesn't echo picks, use what we sent
      submittedAt: entry.submitted_at ?? new Date().toISOString(),
    };
  }

  async getLeaderboard(poolId: number): Promise<LeaderboardData> {
    const res = await fetch(API_ENDPOINTS.leaderboard(poolId));
    if (!res.ok) throw new Error(`Failed to fetch leaderboard: ${res.status}`);
    const data = await res.json();

    const standings = (data.leaderboard ?? []).map((entry: Record<string, unknown>) => ({
      rank: entry.rank ?? null,
      is_tied: entry.is_tied ?? false,
      entry_id: entry.entry_id,
      entry_name: entry.entry_name,
      email: entry.email,
      aggregate_score: entry.aggregate_score ?? null,
      qualification_status: entry.qualification_status ?? 'pending',
      qualified_golfers_count: entry.qualified_golfers_count ?? 0,
      counted_golfers_count: entry.counted_golfers_count ?? 0,
      is_complete: entry.is_complete ?? false,
      picks: ((entry.picks as Record<string, unknown>[]) ?? []).map((p: Record<string, unknown>) => ({
        dg_id: p.dg_id,
        player_name: p.player_name,
        total_score: p.total_score ?? null,
        position: p.position ?? null,
        thru: p.thru ?? null,
        r1: p.r1 ?? null,
        r2: p.r2 ?? null,
        r3: p.r3 ?? null,
        r4: p.r4 ?? null,
        status: p.status ?? 'active',
        made_cut: p.made_cut ?? true,
        counts_toward_total: p.counts_toward_total ?? false,
        is_dropped: p.is_dropped ?? false,
        bucket_number: p.bucket_number,
      })),
    }));

    const scoredAts = (data.leaderboard ?? [])
      .map((e: Record<string, unknown>) => e.last_scored_at)
      .filter(Boolean);
    const lastScoredAt = scoredAts.length > 0 ? scoredAts[0] : null;

    return {
      pool_id: data.pool_id,
      last_scored_at: lastScoredAt ?? '',
      standings,
      count: data.count ?? standings.length,
    };
  }

  async getLockStatus(poolId: number): Promise<PoolLockStatus> {
    const res = await fetch(API_ENDPOINTS.lockStatus(poolId));
    if (!res.ok) throw new Error(`Failed to fetch lock status: ${res.status}`);
    return res.json();
  }

  async getPoolEvents(poolId: number, page = 1, pageSize = 50): Promise<PoolEventsPage> {
    const url = `${API_ENDPOINTS.poolEvents(poolId)}?page=${page}&page_size=${pageSize}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch pool events: ${res.status}`);
    const data = await res.json();
    return {
      pool_id: data.pool_id ?? poolId,
      events: (data.events ?? []).map((e: Record<string, unknown>) => ({
        id: e.id,
        pool_id: e.pool_id,
        event_type: e.event_type as PoolEventType,
        actor_id: e.actor_id as string | null ?? null,
        payload: (e.payload ?? {}) as Record<string, unknown>,
        created_at: e.created_at as string,
      })),
      total: data.total ?? 0,
      page: data.page ?? page,
      page_size: data.page_size ?? pageSize,
    };
  }

  async getTournaments(): Promise<TournamentOption[]> {
    const res = await fetch(API_ENDPOINTS.tournaments());
    if (!res.ok) throw new Error(`Failed to fetch tournaments: ${res.status}`);
    const data = await res.json();
    return (data.tournaments ?? data).map((t: Record<string, unknown>) => ({
      id: t.id,
      name: t.name,
      year: t.year,
    }));
  }

  async createPool(request: CreatePoolRequest): Promise<PoolSummary> {
    const res = await fetch(API_ENDPOINTS.createPool(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await res.json().catch((parseErr: unknown) => {
        console.error('[HttpApiClient] Failed to parse createPool error body:', parseErr);
        return null;
      });
      if (res.status === 402) {
        throw Object.assign(
          new Error('A Stripe subscription is required to create additional pools.'),
          { code: err?.code ?? 'billing_required', status: 402 },
        );
      }
      const msg =
        err?.detail
          ? typeof err.detail === 'string'
            ? err.detail
            : JSON.stringify(err.detail)
          : `Pool creation failed: ${res.status}`;
      throw new Error(msg);
    }
    return res.json();
  }

  async getPoolByToken(clubCode: ClubCode, poolToken: string): Promise<PoolSummary | null> {
    const res = await fetch(API_ENDPOINTS.poolByToken(clubCode, poolToken));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch pool by token: ${res.status}`);
    return res.json();
  }

  async getPoolEntries(poolId: number): Promise<PoolEntriesResponse> {
    const res = await fetch(API_ENDPOINTS.poolEntries(poolId));
    if (!res.ok) throw new Error(`Failed to fetch entries: ${res.status}`);
    const data = await res.json();
    const entries = (data.entries ?? []).map((e: Record<string, unknown>) => ({
      entry_id: e.id ?? e.entry_id,
      entry_name: e.entry_name ?? '',
      email: (e.email as string | null) ?? null,
      submitted_at: (e.submitted_at as string) ?? '',
      picks: (e.picks as Record<string, unknown>[] ?? []).map((p: Record<string, unknown>) => ({
        dg_id: p.dg_id,
        player_name: p.player_name ?? '',
        pick_slot: p.pick_slot,
        bucket_number: p.bucket_number as number | undefined,
      })),
    }));
    return { pool_id: data.pool_id ?? poolId, entries, count: data.count ?? entries.length };
  }

  async downloadPoolEntriesCsv(poolId: number): Promise<Blob> {
    const res = await fetch(API_ENDPOINTS.poolEntriesCsv(poolId));
    if (!res.ok) throw new Error(`CSV download failed: ${res.status}`);
    return res.blob();
  }

  async getClubBranding(clubCode: ClubCode): Promise<ClubBranding> {
    const res = await fetch(API_ENDPOINTS.clubBranding(clubCode));
    if (!res.ok) throw new Error(`Failed to fetch branding: ${res.status}`);
    return res.json();
  }

  async updateClubBranding(clubCode: ClubCode, branding: Partial<ClubBranding>): Promise<ClubBranding> {
    const res = await fetch(API_ENDPOINTS.clubBranding(clubCode), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding),
    });
    if (!res.ok) throw new Error(`Failed to update branding: ${res.status}`);
    return res.json();
  }

  async getClubBilling(clubCode: ClubCode): Promise<ClubBilling> {
    const res = await fetch(API_ENDPOINTS.clubBilling(clubCode));
    if (!res.ok) throw new Error(`Failed to fetch billing: ${res.status}`);
    return res.json();
  }

  async createBillingPortalSession(clubCode: ClubCode): Promise<{ url: string }> {
    const res = await fetch(API_ENDPOINTS.billingPortal(clubCode), { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to create billing portal session: ${res.status}`);
    return res.json();
  }

  async getClubPools(clubCode: ClubCode): Promise<PoolSummary[]> {
    const res = await fetch(API_ENDPOINTS.clubPools(clubCode));
    if (!res.ok) throw new Error(`Failed to fetch club pools: ${res.status}`);
    const data = await res.json();
    return data.pools ?? [];
  }

  async getReferralInfo(clubCode: ClubCode): Promise<ReferralInfo> {
    const res = await fetch(API_ENDPOINTS.referralInfo(clubCode));
    if (!res.ok) throw new Error(`Failed to fetch referral info: ${res.status}`);
    return res.json();
  }

  async applyReferralCredit(referralCode: string, referredClubCode: ClubCode): Promise<ReferralCreditResponse> {
    const res = await fetch(API_ENDPOINTS.referralCredit(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referral_code: referralCode, referred_club_code: referredClubCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch((parseErr: unknown) => {
        console.error('[HttpApiClient] Failed to parse applyReferralCredit error body:', parseErr);
        return null;
      });
      throw Object.assign(
        new Error(err?.detail ?? `Referral credit failed: ${res.status}`),
        { code: err?.code ?? 'REFERRAL_ERROR', status: res.status },
      );
    }
    return res.json();
  }

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(API_ENDPOINTS.adminStats());
    if (!res.ok) throw new Error(`Failed to fetch admin stats: ${res.status}`);
    return res.json();
  }

  async getPollHealth(): Promise<AdminPollHealth> {
    const res = await fetch(API_ENDPOINTS.pollHealth());
    if (!res.ok) throw new Error(`Failed to fetch poll health: ${res.status}`);
    return res.json();
  }

  async submitClubClaim(claim: ClubClaim): Promise<ClubClaimResponse> {
    // TODO: backend endpoint POST /api/onboarding/club-claims does not yet exist.
    // Expected to accept ClubClaim and return { claim_id, received_at }.
    const res = await fetch(API_ENDPOINTS.clubClaims(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim),
    });
    if (!res.ok) throw new Error(`Failed to submit club claim: ${res.status}`);
    return res.json();
  }

  async lookupEntries(poolId: number, email: string): Promise<EntryLookupResult> {
    const url = `${API_ENDPOINTS.lookupEntries(poolId)}?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (res.status === 404) {
      throw Object.assign(new Error(`No entry found for ${email}`), { status: 404 });
    }
    if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
    const data = await res.json();

    const entries = (data.entries ?? []).map((e: Record<string, unknown>) => ({
      entry_id: e.id,
      entry_name: e.entry_name ?? '',
      picks: (e.picks as Record<string, unknown>[] ?? []).map((p: Record<string, unknown>) => ({
        dg_id: p.dg_id,
        pick_slot: p.pick_slot,
        player_name: p.player_name,
        bucket_number: p.bucket_number,
      })),
      submittedAt: e.submitted_at ?? '',
      confirmationCode: `ENTRY-${e.id}`,
    }));

    return { email, entries };
  }
}
