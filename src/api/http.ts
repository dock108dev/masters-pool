import type { ApiClient } from './types';
import type {
  ClubCode,
  PoolSummary,
  PoolFieldResponse,
  EntrySubmissionRequest,
  EntrySubmissionResponse,
  LeaderboardData,
  EntryLookupResult,
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
      const err = await res.json().catch(() => null);
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

    // Map backend "leaderboard" → frontend "standings"
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
      picks: ((entry.picks ?? entry.players) as Record<string, unknown>[] ?? []).map((p: Record<string, unknown>) => ({
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

    // Find latest last_scored_at from standings
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

  async lookupEntries(poolId: number, email: string): Promise<EntryLookupResult> {
    const url = `${API_ENDPOINTS.lookupEntries(poolId)}?email=${encodeURIComponent(email)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Lookup failed: ${res.status}`);
    const data = await res.json();

    // Map backend entry shape to frontend EntryLookupEntry
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
