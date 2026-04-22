import type { ApiClient, SlugCheckResponse, VerifySessionResponse, CreateClubRequest, CreateClubResponse, OnboardingWizardSubmitRequest, OnboardingWizardSubmitResponse, SendInvitesRequest, PendingClub } from './types';
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
  PoolEntry,
  PoolEntryPick,
  LeaderboardStanding,
  LeaderboardPick,
  GolferStatus,
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
  PlayerTier,
  PlayerStatus,
  EntryLeaderboardResponse,
} from '../types/domain';
import { API_ENDPOINTS } from './types';

/** Parses a non-2xx response body as JSON, returning null if the body is not valid JSON. */
async function parseErrorBody(res: Response, context: string): Promise<Record<string, unknown> | null> {
  return (res.json() as Promise<Record<string, unknown>>).catch((parseErr: unknown) => {
    console.error(`[HttpApiClient] Failed to parse ${context} error body:`, parseErr);
    return null;
  });
}

/** Extracts a string detail message from a parsed error body, falling back to a default. */
function extractDetail(err: Record<string, unknown> | null, fallback: string): string {
  const d = err?.detail;
  return typeof d === 'string' ? d : fallback;
}

/**
 * HTTP client that talks to the sports-data-admin backend.
 * In dev, Vite proxies /api to SPORTS_API_URL (defaults to sda.dock108.dev) and injects X-API-Key.
 * In production, nginx handles the proxy and key injection.
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
      const err = await parseErrorBody(res, 'submitEntry');
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
      const err = await parseErrorBody(res, 'createPool');
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
      const err = await parseErrorBody(res, 'applyReferralCredit');
      throw Object.assign(
        new Error(extractDetail(err, `Referral credit failed: ${res.status}`)),
        { code: typeof err?.code === 'string' ? err.code : 'REFERRAL_ERROR', status: res.status },
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
    const res = await fetch(API_ENDPOINTS.clubClaims(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim),
    });
    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const wait = retryAfter ? ` Try again in ${retryAfter}s.` : ' Please try again later.';
        throw Object.assign(new Error(`Too many requests.${wait}`), { status: 429 });
      }
      const body = await parseErrorBody(res, 'submitClubClaim');
      const detail = body?.detail;
      const msg = typeof detail === 'string'
        ? detail
        : Array.isArray(detail) && detail[0]?.msg
          ? detail.map((d: { msg: string }) => d.msg).join('; ')
          : `Failed to submit club claim: ${res.status}`;
      throw Object.assign(new Error(msg), { status: res.status });
    }
    return res.json();
  }

  async createCheckoutSession(): Promise<{ session_url: string }> {
    const res = await fetch(API_ENDPOINTS.checkoutSession(), { method: 'POST' });
    if (!res.ok) {
      const err = await parseErrorBody(res, 'createCheckoutSession');
      throw new Error(extractDetail(err, `Checkout session failed: ${res.status}`));
    }
    return res.json();
  }

  async checkSlugAvailability(slug: string, signal?: AbortSignal): Promise<SlugCheckResponse> {
    const res = await fetch(API_ENDPOINTS.slugCheck(slug), { signal });
    if (!res.ok) throw new Error(`Slug check failed: ${res.status}`);
    return res.json();
  }

  async verifyCheckoutSession(sessionId: string): Promise<VerifySessionResponse> {
    const res = await fetch(API_ENDPOINTS.verifyCheckoutSession(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });
    if (!res.ok) {
      const err = await parseErrorBody(res, 'verifyCheckoutSession');
      throw new Error(extractDetail(err, `Session verification failed: ${res.status}`));
    }
    return res.json();
  }

  async createClub(request: CreateClubRequest): Promise<CreateClubResponse> {
    const res = await fetch(API_ENDPOINTS.createClub(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await parseErrorBody(res, 'createClub');
      throw new Error(extractDetail(err, `Club creation failed: ${res.status}`));
    }
    return res.json();
  }

  async submitOnboardingWizard(
    request: OnboardingWizardSubmitRequest,
  ): Promise<OnboardingWizardSubmitResponse> {
    const res = await fetch(API_ENDPOINTS.wizardSubmit(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await parseErrorBody(res, 'submitOnboardingWizard');
      throw new Error(extractDetail(err, `Wizard submission failed: ${res.status}`));
    }
    return res.json();
  }

  async lockPool(poolId: number): Promise<PoolSummary> {
    const res = await fetch(API_ENDPOINTS.lockPool(poolId), { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to lock pool: ${res.status}`);
    return res.json();
  }

  async unlockPool(poolId: number): Promise<PoolSummary> {
    const res = await fetch(API_ENDPOINTS.unlockPool(poolId), { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to unlock pool: ${res.status}`);
    return res.json();
  }

  async sendPoolInvites(poolId: number, request: SendInvitesRequest): Promise<void> {
    const res = await fetch(API_ENDPOINTS.poolInvites(poolId), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const err = await parseErrorBody(res, 'sendPoolInvites');
      throw new Error(extractDetail(err, `Failed to send invites: ${res.status}`));
    }
  }

  async getPendingClub(): Promise<PendingClub | null> {
    const res = await fetch(API_ENDPOINTS.pendingClub());
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch pending club: ${res.status}`);
    return res.json();
  }

  async getPlayerRoster(tournamentId: number): Promise<Player[]> {
    const res = await fetch(API_ENDPOINTS.playerRoster(tournamentId));
    if (!res.ok) throw new Error(`Failed to fetch player roster: ${res.status}`);
    const data = await res.json();
    return (data.players ?? data).map((p: Record<string, unknown>) => ({
      id: (p.id ?? p.dg_id) as number,
      name: (p.name ?? p.player_name) as string,
      worldRank: ((p.worldRank ?? p.world_rank) as number | null) ?? null,
      tier: ((p.tier as PlayerTier) ?? 'mid'),
    }));
  }

  async getLiveTournamentLeaderboard(tournamentId: number): Promise<PlayerScore[]> {
    const res = await fetch(API_ENDPOINTS.tournamentLeaderboard(tournamentId));
    if (!res.ok) throw new Error(`Failed to fetch tournament leaderboard: ${res.status}`);
    const data = await res.json();
    return (data.leaderboard ?? data).map((p: Record<string, unknown>) => ({
      id: (p.id ?? p.dg_id) as number,
      name: (p.name ?? p.player_name) as string,
      worldRank: ((p.worldRank ?? p.world_rank) as number | null) ?? null,
      tier: ((p.tier as PlayerTier) ?? 'mid'),
      totalStrokes: (p.totalStrokes ?? p.total_strokes) as number | null ?? null,
      thru: p.thru as number | null ?? null,
      status: ((p.status as PlayerStatus) ?? 'active'),
    }));
  }

  async getEntry(entryId: number): Promise<PoolEntry> {
    const res = await fetch(API_ENDPOINTS.entry(entryId));
    if (res.status === 404) {
      throw Object.assign(new Error(`Entry ${entryId} not found`), { status: 404 });
    }
    if (!res.ok) throw new Error(`Failed to fetch entry: ${res.status}`);
    const data = await res.json();
    const picks: PoolEntryPick[] = (data.picks ?? []).map((p: Record<string, unknown>) => ({
      dg_id: p.dg_id as number,
      player_name: (p.player_name ?? '') as string,
      pick_slot: p.pick_slot as number,
      bucket_number: p.bucket_number as number | undefined,
    }));
    return {
      entry_id: (data.id ?? data.entry_id) as number,
      entry_name: (data.entry_name ?? '') as string,
      email: (data.email as string | null) ?? null,
      submitted_at: (data.submitted_at ?? '') as string,
      picks,
    };
  }

  async getEntryLeaderboard(entryId: number): Promise<EntryLeaderboardResponse | null> {
    const res = await fetch(API_ENDPOINTS.entryLeaderboard(entryId));
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch entry leaderboard: ${res.status}`);
    const data = await res.json();
    if (!data || data.entry_id == null) return null;
    const picks: LeaderboardPick[] = (data.picks ?? []).map((p: Record<string, unknown>) => ({
      dg_id: p.dg_id as number,
      player_name: p.player_name as string,
      total_score: (p.total_score as number | null) ?? null,
      position: (p.position as number | null) ?? null,
      thru: (p.thru as number | null) ?? null,
      r1: (p.r1 as number | null) ?? null,
      r2: (p.r2 as number | null) ?? null,
      r3: (p.r3 as number | null) ?? null,
      r4: (p.r4 as number | null) ?? null,
      status: ((p.status as GolferStatus) ?? 'active'),
      made_cut: (p.made_cut as boolean) ?? true,
      counts_toward_total: (p.counts_toward_total as boolean) ?? false,
      is_dropped: (p.is_dropped as boolean) ?? false,
      bucket_number: p.bucket_number as number | undefined,
    }));
    const standing: LeaderboardStanding = {
      rank: (data.rank as number | null) ?? null,
      is_tied: (data.is_tied as boolean) ?? false,
      entry_id: data.entry_id as number,
      entry_name: (data.entry_name ?? '') as string,
      email: (data.email ?? '') as string,
      aggregate_score: (data.aggregate_score as number | null) ?? null,
      qualification_status: data.qualification_status ?? 'pending',
      qualified_golfers_count: (data.qualified_golfers_count as number) ?? 0,
      counted_golfers_count: (data.counted_golfers_count as number) ?? 0,
      is_complete: (data.is_complete as boolean) ?? false,
      picks,
    };
    return { standing, last_scored_at: (data.last_scored_at ?? '') as string };
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
