import { describe, it, expect, beforeEach } from 'vitest';
import { MockApiClient, MOCK_LOCKED_AT } from '../../api/mock/adapters';
import {
  MOCK_RVCC_POOL,
  MOCK_CRESTMONT_POOL,
  MOCK_RVCC_FIELD,
  MOCK_CRESTMONT_FIELD,
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
} from '../../api/mock/data';
import type { ClubCode } from '../../types/domain';

// Use latency of 0 to avoid real delays in tests
let client: MockApiClient;

beforeEach(() => {
  client = new MockApiClient(0);
});

// ---------------------------------------------------------------------------
// getActivePool
// ---------------------------------------------------------------------------

describe('MockApiClient.getActivePool', () => {
  it('returns MOCK_RVCC_POOL for clubCode "rvcc"', async () => {
    const result = await client.getActivePool('rvcc');

    expect(result).not.toBeNull();
    expect(result).toEqual(MOCK_RVCC_POOL);
  });

  it('returns MOCK_CRESTMONT_POOL for clubCode "crestmont"', async () => {
    const result = await client.getActivePool('crestmont');

    expect(result).not.toBeNull();
    expect(result).toEqual(MOCK_CRESTMONT_POOL);
  });

  it('returns null for an unknown clubCode', async () => {
    const result = await client.getActivePool('unknown' as ClubCode);
    expect(result).toBeNull();
  });

  it('RVCC pool has the correct shape (PoolSummary fields)', async () => {
    const result = await client.getActivePool('rvcc');

    expect(result).toMatchObject({
      id: expect.any(Number),
      code: expect.any(String),
      name: expect.any(String),
      club_code: 'rvcc',
      tournament_id: expect.any(Number),
      status: expect.any(String),
      entry_deadline: expect.any(String),
      max_entries_per_email: expect.any(Number),
      scoring_enabled: expect.any(Boolean),
      rules_json: expect.objectContaining({
        variant: expect.any(String),
        pick_count: expect.any(Number),
        count_best: expect.any(Number),
        min_cuts_to_qualify: expect.any(Number),
        uses_buckets: expect.any(Boolean),
      }),
    });
  });

  it('RVCC pool name contains "RVCC"', async () => {
    const result = await client.getActivePool('rvcc');
    expect(result!.name).toContain('RVCC');
  });

  it('Crestmont pool name contains "Crestmont"', async () => {
    const result = await client.getActivePool('crestmont');
    expect(result!.name).toContain('Crestmont');
  });

  it('RVCC pool uses_buckets is false', async () => {
    const result = await client.getActivePool('rvcc');
    expect(result!.rules_json.uses_buckets).toBe(false);
  });

  it('Crestmont pool uses_buckets is true', async () => {
    const result = await client.getActivePool('crestmont');
    expect(result!.rules_json.uses_buckets).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getPoolDetail
// ---------------------------------------------------------------------------

describe('MockApiClient.getPoolDetail', () => {
  it('returns MOCK_CRESTMONT_POOL when poolId matches crestmont pool id', async () => {
    const result = await client.getPoolDetail(MOCK_CRESTMONT_POOL.id);

    expect(result).toEqual(MOCK_CRESTMONT_POOL);
    expect(result.club_code).toBe('crestmont');
  });

  it('returns MOCK_RVCC_POOL for any non-crestmont poolId', async () => {
    const result = await client.getPoolDetail(MOCK_RVCC_POOL.id);

    expect(result).toEqual(MOCK_RVCC_POOL);
    expect(result.club_code).toBe('rvcc');
  });

  it('returned pool has all required PoolSummary fields', async () => {
    const result = await client.getPoolDetail(MOCK_RVCC_POOL.id);

    expect(result).toMatchObject({
      id: expect.any(Number),
      code: expect.any(String),
      name: expect.any(String),
      club_code: expect.any(String),
      tournament_id: expect.any(Number),
      status: expect.any(String),
      entry_deadline: expect.any(String),
      max_entries_per_email: expect.any(Number),
      scoring_enabled: expect.any(Boolean),
      rules_json: expect.objectContaining({
        variant: expect.any(String),
        pick_count: expect.any(Number),
        count_best: expect.any(Number),
        min_cuts_to_qualify: expect.any(Number),
        uses_buckets: expect.any(Boolean),
      }),
    });
  });
});

// ---------------------------------------------------------------------------
// getPoolField
// ---------------------------------------------------------------------------

describe('MockApiClient.getPoolField', () => {
  it('returns MOCK_CRESTMONT_FIELD when poolId matches crestmont field pool_id', async () => {
    const result = await client.getPoolField(MOCK_CRESTMONT_FIELD.pool_id);

    expect(result).toEqual(MOCK_CRESTMONT_FIELD);
  });

  it('returns MOCK_RVCC_FIELD for any non-crestmont poolId', async () => {
    const result = await client.getPoolField(MOCK_RVCC_FIELD.pool_id);

    expect(result).toEqual(MOCK_RVCC_FIELD);
  });

  it('RVCC field has a players array (flat, no buckets)', async () => {
    const result = await client.getPoolField(MOCK_RVCC_FIELD.pool_id);

    expect(Array.isArray(result.players)).toBe(true);
    expect(result.buckets).toBeUndefined();
  });

  it('Crestmont field has a buckets array (no flat players)', async () => {
    const result = await client.getPoolField(MOCK_CRESTMONT_FIELD.pool_id);

    expect(Array.isArray(result.buckets)).toBe(true);
    expect(result.players).toBeUndefined();
  });

  it('RVCC field has 24 players', async () => {
    const result = await client.getPoolField(MOCK_RVCC_FIELD.pool_id);
    expect(result.players).toHaveLength(24);
  });

  it('Crestmont field has 6 buckets', async () => {
    const result = await client.getPoolField(MOCK_CRESTMONT_FIELD.pool_id);
    expect(result.buckets).toHaveLength(6);
  });

  it('each player in RVCC field has dg_id (number) and player_name (string)', async () => {
    const result = await client.getPoolField(MOCK_RVCC_FIELD.pool_id);

    for (const player of result.players!) {
      expect(typeof player.dg_id).toBe('number');
      expect(typeof player.player_name).toBe('string');
      expect(player.player_name).toBeTruthy();
    }
  });

  it('each bucket in Crestmont field has bucket_number (1-indexed), label, and players array', async () => {
    const result = await client.getPoolField(MOCK_CRESTMONT_FIELD.pool_id);

    result.buckets!.forEach((bucket, idx) => {
      expect(bucket.bucket_number).toBe(idx + 1);
      expect(typeof bucket.label).toBe('string');
      expect(Array.isArray(bucket.players)).toBe(true);
    });
  });

  it('bucket_number values are 1 through 6', async () => {
    const result = await client.getPoolField(MOCK_CRESTMONT_FIELD.pool_id);
    const numbers = result.buckets!.map((b) => b.bucket_number);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

// ---------------------------------------------------------------------------
// submitEntry
// ---------------------------------------------------------------------------

describe('MockApiClient.submitEntry', () => {
  const baseRequest = {
    email: 'tester@example.com',
    entry_name: 'Test Entry',
    picks: [
      { dg_id: 18417, pick_slot: 1 },
      { dg_id: 28237, pick_slot: 2 },
      { dg_id: 21209, pick_slot: 3 },
    ],
  };

  it('returns an object with entry_id, confirmationCode, email, entry_name, picks, submittedAt', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, baseRequest);

    expect(response.entry_id).toBeTruthy();
    expect(response.confirmationCode).toBeTruthy();
    expect(response.email).toBe('tester@example.com');
    expect(response.entry_name).toBe('Test Entry');
    expect(Array.isArray(response.picks)).toBe(true);
    expect(response.submittedAt).toBeTruthy();
  });

  it('confirmationCode starts with "CONF-"', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, baseRequest);
    expect(response.confirmationCode).toMatch(/^CONF-/);
  });

  it('echoes back the submitted email', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, { ...baseRequest, email: 'other@test.com' });
    expect(response.email).toBe('other@test.com');
  });

  it('echoes back the submitted entry_name', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, { ...baseRequest, entry_name: 'Jane Golfer' });
    expect(response.entry_name).toBe('Jane Golfer');
  });

  it('echoes back the submitted picks array', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, baseRequest);
    expect(response.picks).toEqual(baseRequest.picks);
  });

  it('submittedAt is a valid ISO-8601 date string', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, baseRequest);
    expect(new Date(response.submittedAt).toISOString()).toBe(response.submittedAt);
  });

  it('entry_id is a number', async () => {
    const response = await client.submitEntry(MOCK_RVCC_POOL.id, baseRequest);
    expect(typeof response.entry_id).toBe('number');
  });

  it('works for crestmont pool as well', async () => {
    const response = await client.submitEntry(MOCK_CRESTMONT_POOL.id, {
      ...baseRequest,
      picks: [
        { dg_id: 18417, pick_slot: 1, bucket_number: 1 },
        { dg_id: 52955, pick_slot: 2, bucket_number: 2 },
      ],
    });
    expect(response.confirmationCode).toMatch(/^CONF-/);
    expect(response.email).toBe('tester@example.com');
  });
});

// ---------------------------------------------------------------------------
// getLeaderboard
// ---------------------------------------------------------------------------

describe('MockApiClient.getLeaderboard', () => {
  it('returns MOCK_RVCC_LEADERBOARD for RVCC pool id', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_LEADERBOARD.pool_id);
    expect(result).toEqual(MOCK_RVCC_LEADERBOARD);
  });

  it('returns MOCK_CRESTMONT_LEADERBOARD for Crestmont pool id', async () => {
    const result = await client.getLeaderboard(MOCK_CRESTMONT_LEADERBOARD.pool_id);
    expect(result).toEqual(MOCK_CRESTMONT_LEADERBOARD);
  });

  it('RVCC leaderboard has correct pool_id', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);
    expect(result.pool_id).toBe(MOCK_RVCC_POOL.id);
  });

  it('Crestmont leaderboard has correct pool_id', async () => {
    const result = await client.getLeaderboard(MOCK_CRESTMONT_POOL.id);
    expect(result.pool_id).toBe(MOCK_CRESTMONT_POOL.id);
  });

  it('RVCC leaderboard has 3 standings', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);
    expect(result.standings).toHaveLength(3);
    expect(result.count).toBe(3);
  });

  it('Crestmont leaderboard has at least 1 standing', async () => {
    const result = await client.getLeaderboard(MOCK_CRESTMONT_POOL.id);
    expect(result.standings.length).toBeGreaterThanOrEqual(1);
  });

  it('leaderboard has last_scored_at field', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);
    expect(result.last_scored_at).toBeTruthy();
    expect(() => new Date(result.last_scored_at)).not.toThrow();
  });

  it('each standing has required LeaderboardStanding fields', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);

    for (const standing of result.standings) {
      expect(typeof standing.entry_id).toBe('number');
      expect(typeof standing.entry_name).toBe('string');
      expect(typeof standing.email).toBe('string');
      expect(typeof standing.qualification_status).toBe('string');
      expect(typeof standing.qualified_golfers_count).toBe('number');
      expect(typeof standing.counted_golfers_count).toBe('number');
      expect(typeof standing.is_complete).toBe('boolean');
      expect(typeof standing.is_tied).toBe('boolean');
      expect(Array.isArray(standing.picks)).toBe(true);
      expect(standing.rank === null || typeof standing.rank === 'number').toBe(true);
      expect(standing.aggregate_score === null || typeof standing.aggregate_score === 'number').toBe(true);
    }
  });

  it('each pick within a standing has required LeaderboardPick fields', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);

    for (const standing of result.standings) {
      for (const pick of standing.picks) {
        expect(typeof pick.dg_id).toBe('number');
        expect(typeof pick.player_name).toBe('string');
        expect(typeof pick.status).toBe('string');
        expect(typeof pick.made_cut).toBe('boolean');
        expect(typeof pick.counts_toward_total).toBe('boolean');
        expect(typeof pick.is_dropped).toBe('boolean');
        expect(pick.total_score === null || typeof pick.total_score === 'number').toBe(true);
        expect(pick.position === null || typeof pick.position === 'number').toBe(true);
        expect(pick.thru === null || typeof pick.thru === 'number').toBe(true);
      }
    }
  });

  it('RVCC: first standing has the lowest aggregate_score (is the leader)', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);
    const qualified = result.standings.filter((s) => s.qualification_status === 'qualified');
    const scores = qualified.map((s) => s.aggregate_score as number);
    expect(scores[0]).toBe(Math.min(...scores));
  });

  it('Crestmont: first standing has 6 picks', async () => {
    const result = await client.getLeaderboard(MOCK_CRESTMONT_POOL.id);
    expect(result.standings[0].picks).toHaveLength(6);
  });

  it('Crestmont: picks include bucket_number', async () => {
    const result = await client.getLeaderboard(MOCK_CRESTMONT_POOL.id);
    const picks = result.standings[0].picks;
    expect(picks.every((p) => typeof p.bucket_number === 'number')).toBe(true);
  });

  it('not_qualified standing has null aggregate_score', async () => {
    const result = await client.getLeaderboard(MOCK_RVCC_POOL.id);
    const notQualified = result.standings.filter((s) => s.qualification_status === 'not_qualified');
    for (const standing of notQualified) {
      expect(standing.aggregate_score).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// lookupEntries
// ---------------------------------------------------------------------------

describe('MockApiClient.lookupEntries', () => {
  it('returns an object with email and entries array', async () => {
    const result = await client.lookupEntries(MOCK_RVCC_POOL.id, 'player@example.com');

    expect(result.email).toBe('player@example.com');
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it('echoes back the provided email', async () => {
    const result = await client.lookupEntries(MOCK_CRESTMONT_POOL.id, 'another@test.com');
    expect(result.email).toBe('another@test.com');
  });

  it('returns at least one entry', async () => {
    const result = await client.lookupEntries(MOCK_RVCC_POOL.id, 'anyone@example.com');
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('each entry has entry_id, entry_name, picks, submittedAt, confirmationCode', async () => {
    const result = await client.lookupEntries(MOCK_RVCC_POOL.id, 'test@example.com');

    for (const entry of result.entries) {
      expect(typeof entry.entry_id).toBe('number');
      expect(entry.entry_id).toBeTruthy();
      expect(typeof entry.entry_name).toBe('string');
      expect(Array.isArray(entry.picks)).toBe(true);
      expect(typeof entry.submittedAt).toBe('string');
      expect(typeof entry.confirmationCode).toBe('string');
      expect(entry.confirmationCode).toBeTruthy();
    }
  });

  it('first entry has expected fixture values', async () => {
    const result = await client.lookupEntries(MOCK_RVCC_POOL.id, 'test@example.com');
    const first = result.entries[0];

    expect(first.entry_id).toBe(9001);
    expect(first.entry_name).toBe('Mock Entry');
    expect(first.confirmationCode).toBe('CONF-ABC123');
  });

  it('first entry picks reference known dg_ids', async () => {
    const result = await client.lookupEntries(MOCK_RVCC_POOL.id, 'test@example.com');
    const dgIds = result.entries[0].picks.map((p) => p.dg_id);

    expect(dgIds).toContain(18417); // Scottie Scheffler
    expect(dgIds).toContain(28237); // Rory McIlroy
    expect(dgIds).toContain(21209); // Jon Rahm
  });

  it('each pick in the entry has dg_id and pick_slot', async () => {
    const result = await client.lookupEntries(MOCK_RVCC_POOL.id, 'test@example.com');

    for (const entry of result.entries) {
      for (const pick of entry.picks) {
        expect(typeof pick.dg_id).toBe('number');
        expect(typeof pick.pick_slot).toBe('number');
      }
    }
  });

  it('returns the same mock entries regardless of poolId', async () => {
    const rvcc = await client.lookupEntries(MOCK_RVCC_POOL.id, 'x@x.com');
    const crestmont = await client.lookupEntries(MOCK_CRESTMONT_POOL.id, 'x@x.com');
    expect(rvcc.entries).toEqual(crestmont.entries);
  });
});

// ---------------------------------------------------------------------------
// getLockStatus
// ---------------------------------------------------------------------------

describe('MockApiClient.getLockStatus', () => {
  it('returns locked=false for an unlocked pool', async () => {
    const status = await client.getLockStatus(MOCK_RVCC_POOL.id);
    expect(status.locked).toBe(false);
    expect(status.locked_at).toBeNull();
  });

  it('returns locked=true with locked_at for a pool configured as locked', async () => {
    const lockedClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
    const status = await lockedClient.getLockStatus(MOCK_RVCC_POOL.id);
    expect(status.locked).toBe(true);
    expect(status.locked_at).toBe(MOCK_LOCKED_AT);
  });

  it('unlocked pool id returns unlocked even when other pools are locked', async () => {
    const lockedClient = new MockApiClient(0, [MOCK_CRESTMONT_POOL.id]);
    const status = await lockedClient.getLockStatus(MOCK_RVCC_POOL.id);
    expect(status.locked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// submitEntry — pool locked (integration: 409 path)
// ---------------------------------------------------------------------------

describe('MockApiClient.submitEntry (locked pool)', () => {
  const baseRequest = {
    email: 'tester@example.com',
    entry_name: 'Test Entry',
    picks: [{ dg_id: 18417, pick_slot: 1 }],
  };

  it('throws when the pool is locked', async () => {
    const lockedClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
    await expect(lockedClient.submitEntry(MOCK_RVCC_POOL.id, baseRequest)).rejects.toThrow();
  });

  it('thrown error has machine-readable code POOL_LOCKED', async () => {
    const lockedClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
    const err = await lockedClient
      .submitEntry(MOCK_RVCC_POOL.id, baseRequest)
      .catch((e: unknown) => e);
    expect((err as { code: string }).code).toBe('POOL_LOCKED');
  });

  it('thrown error has status 409', async () => {
    const lockedClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
    const err = await lockedClient
      .submitEntry(MOCK_RVCC_POOL.id, baseRequest)
      .catch((e: unknown) => e);
    expect((err as { status: number }).status).toBe(409);
  });

  it('unlocked pool id still succeeds even when another pool is locked', async () => {
    const lockedClient = new MockApiClient(0, [MOCK_CRESTMONT_POOL.id]);
    const res = await lockedClient.submitEntry(MOCK_RVCC_POOL.id, baseRequest);
    expect(res.confirmationCode).toMatch(/^CONF-/);
  });
});
