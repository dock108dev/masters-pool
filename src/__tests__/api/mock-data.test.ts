import { describe, it, expect } from 'vitest';
import {
  MOCK_RVCC_POOL,
  MOCK_CRESTMONT_POOL,
  MOCK_RVCC_FIELD,
  MOCK_CRESTMONT_FIELD,
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
} from '../../api/mock/data';

// ---------------------------------------------------------------------------
// MOCK_RVCC_POOL
// ---------------------------------------------------------------------------

describe('MOCK_RVCC_POOL', () => {
  it('has club_code "rvcc"', () => {
    expect(MOCK_RVCC_POOL.club_code).toBe('rvcc');
  });

  it('name contains "RVCC"', () => {
    expect(MOCK_RVCC_POOL.name).toContain('RVCC');
  });

  it('has a numeric id', () => {
    expect(typeof MOCK_RVCC_POOL.id).toBe('number');
  });

  it('has a non-empty code string', () => {
    expect(typeof MOCK_RVCC_POOL.code).toBe('string');
    expect(MOCK_RVCC_POOL.code).toBeTruthy();
  });

  it('has a valid PoolStatus', () => {
    const validStatuses = ['draft', 'open', 'locked', 'live', 'final', 'archived'];
    expect(validStatuses).toContain(MOCK_RVCC_POOL.status);
  });

  it('has a numeric tournament_id', () => {
    expect(typeof MOCK_RVCC_POOL.tournament_id).toBe('number');
  });

  it('has a non-empty entry_deadline string', () => {
    expect(typeof MOCK_RVCC_POOL.entry_deadline).toBe('string');
    expect(MOCK_RVCC_POOL.entry_deadline).toBeTruthy();
  });

  it('has a numeric max_entries_per_email', () => {
    expect(typeof MOCK_RVCC_POOL.max_entries_per_email).toBe('number');
  });

  it('has a boolean scoring_enabled', () => {
    expect(typeof MOCK_RVCC_POOL.scoring_enabled).toBe('boolean');
  });

  it('rules_json.uses_buckets is false', () => {
    expect(MOCK_RVCC_POOL.rules_json.uses_buckets).toBe(false);
  });

  it('rules_json has pick_count, count_best, min_cuts_to_qualify', () => {
    expect(typeof MOCK_RVCC_POOL.rules_json.pick_count).toBe('number');
    expect(typeof MOCK_RVCC_POOL.rules_json.count_best).toBe('number');
    expect(typeof MOCK_RVCC_POOL.rules_json.min_cuts_to_qualify).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// MOCK_CRESTMONT_POOL
// ---------------------------------------------------------------------------

describe('MOCK_CRESTMONT_POOL', () => {
  it('has club_code "crestmont"', () => {
    expect(MOCK_CRESTMONT_POOL.club_code).toBe('crestmont');
  });

  it('name contains "Crestmont"', () => {
    expect(MOCK_CRESTMONT_POOL.name).toContain('Crestmont');
  });

  it('has a different id from RVCC pool', () => {
    expect(MOCK_CRESTMONT_POOL.id).not.toBe(MOCK_RVCC_POOL.id);
  });

  it('rules_json.uses_buckets is true', () => {
    expect(MOCK_CRESTMONT_POOL.rules_json.uses_buckets).toBe(true);
  });

  it('both pools share the same tournament_id', () => {
    expect(MOCK_CRESTMONT_POOL.tournament_id).toBe(MOCK_RVCC_POOL.tournament_id);
  });

  it('both pools share the same entry_deadline', () => {
    expect(MOCK_CRESTMONT_POOL.entry_deadline).toBe(MOCK_RVCC_POOL.entry_deadline);
  });
});

// ---------------------------------------------------------------------------
// MOCK_RVCC_FIELD
// ---------------------------------------------------------------------------

describe('MOCK_RVCC_FIELD', () => {
  it('pool_id matches MOCK_RVCC_POOL.id', () => {
    expect(MOCK_RVCC_FIELD.pool_id).toBe(MOCK_RVCC_POOL.id);
  });

  it('variant is "rvcc"', () => {
    expect(MOCK_RVCC_FIELD.variant).toBe('rvcc');
  });

  it('has a players array', () => {
    expect(Array.isArray(MOCK_RVCC_FIELD.players)).toBe(true);
  });

  it('does not have a buckets property', () => {
    expect(MOCK_RVCC_FIELD.buckets).toBeUndefined();
  });

  it('has exactly 24 players', () => {
    expect(MOCK_RVCC_FIELD.players).toHaveLength(24);
  });

  it('every player has a numeric dg_id', () => {
    for (const player of MOCK_RVCC_FIELD.players!) {
      expect(typeof player.dg_id).toBe('number');
    }
  });

  it('every player has a non-empty player_name string', () => {
    for (const player of MOCK_RVCC_FIELD.players!) {
      expect(typeof player.player_name).toBe('string');
      expect(player.player_name).toBeTruthy();
    }
  });

  it('all dg_ids are unique', () => {
    const ids = MOCK_RVCC_FIELD.players!.map((p) => p.dg_id);
    expect(new Set(ids).size).toBe(24);
  });

  it('all player_names are unique', () => {
    const names = MOCK_RVCC_FIELD.players!.map((p) => p.player_name);
    expect(new Set(names).size).toBe(24);
  });

  it('first player is Scottie Scheffler with dg_id 18417', () => {
    expect(MOCK_RVCC_FIELD.players![0]).toMatchObject({
      dg_id: 18417,
      player_name: 'Scottie Scheffler',
    });
  });

  it('last player is Adam Scott with dg_id 10046', () => {
    expect(MOCK_RVCC_FIELD.players![23]).toMatchObject({
      dg_id: 10046,
      player_name: 'Adam Scott',
    });
  });
});

// ---------------------------------------------------------------------------
// MOCK_CRESTMONT_FIELD
// ---------------------------------------------------------------------------

describe('MOCK_CRESTMONT_FIELD', () => {
  it('pool_id matches MOCK_CRESTMONT_POOL.id', () => {
    expect(MOCK_CRESTMONT_FIELD.pool_id).toBe(MOCK_CRESTMONT_POOL.id);
  });

  it('variant is "crestmont"', () => {
    expect(MOCK_CRESTMONT_FIELD.variant).toBe('crestmont');
  });

  it('has a buckets array', () => {
    expect(Array.isArray(MOCK_CRESTMONT_FIELD.buckets)).toBe(true);
  });

  it('does not have a flat players property', () => {
    expect(MOCK_CRESTMONT_FIELD.players).toBeUndefined();
  });

  it('has exactly 6 buckets', () => {
    expect(MOCK_CRESTMONT_FIELD.buckets).toHaveLength(6);
  });

  it('bucket_number values are 1 through 6 (1-indexed)', () => {
    const numbers = MOCK_CRESTMONT_FIELD.buckets!.map((b) => b.bucket_number);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('each bucket has a non-empty label', () => {
    for (const bucket of MOCK_CRESTMONT_FIELD.buckets!) {
      expect(typeof bucket.label).toBe('string');
      expect(bucket.label).toBeTruthy();
    }
  });

  it('bucket labels are Bucket A through Bucket F', () => {
    const labels = MOCK_CRESTMONT_FIELD.buckets!.map((b) => b.label);
    expect(labels).toEqual(['Bucket A', 'Bucket B', 'Bucket C', 'Bucket D', 'Bucket E', 'Bucket F']);
  });

  it('each bucket has exactly 4 players', () => {
    for (const bucket of MOCK_CRESTMONT_FIELD.buckets!) {
      expect(bucket.players).toHaveLength(4);
    }
  });

  it('all players across all buckets are unique (24 total)', () => {
    const allIds = MOCK_CRESTMONT_FIELD.buckets!.flatMap((b) => b.players.map((p) => p.dg_id));
    expect(allIds).toHaveLength(24);
    expect(new Set(allIds).size).toBe(24);
  });

  it('Bucket 1 contains the first 4 players (including Scottie Scheffler)', () => {
    const bucket1 = MOCK_CRESTMONT_FIELD.buckets![0];
    const names = bucket1.players.map((p) => p.player_name);
    expect(names).toContain('Scottie Scheffler');
    expect(names).toContain('Xander Schauffele');
    expect(names).toContain('Rory McIlroy');
    expect(names).toContain('Jon Rahm');
  });
});

// ---------------------------------------------------------------------------
// MOCK_RVCC_LEADERBOARD
// ---------------------------------------------------------------------------

describe('MOCK_RVCC_LEADERBOARD', () => {
  it('has pool_id matching MOCK_RVCC_POOL.id', () => {
    expect(MOCK_RVCC_LEADERBOARD.pool_id).toBe(MOCK_RVCC_POOL.id);
  });

  it('has a non-empty last_scored_at timestamp', () => {
    expect(MOCK_RVCC_LEADERBOARD.last_scored_at).toBeTruthy();
    expect(() => new Date(MOCK_RVCC_LEADERBOARD.last_scored_at)).not.toThrow();
  });

  it('has 3 standings', () => {
    expect(MOCK_RVCC_LEADERBOARD.standings).toHaveLength(3);
  });

  it('count matches the number of standings', () => {
    expect(MOCK_RVCC_LEADERBOARD.count).toBe(MOCK_RVCC_LEADERBOARD.standings.length);
  });

  it('each standing has 7 picks', () => {
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      expect(standing.picks).toHaveLength(7);
    }
  });

  it('all entry_ids are unique', () => {
    const ids = MOCK_RVCC_LEADERBOARD.standings.map((s) => s.entry_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('qualified standings have a non-null aggregate_score', () => {
    const qualified = MOCK_RVCC_LEADERBOARD.standings.filter(
      (s) => s.qualification_status === 'qualified'
    );
    for (const standing of qualified) {
      expect(standing.aggregate_score).not.toBeNull();
      expect(typeof standing.aggregate_score).toBe('number');
    }
  });

  it('not_qualified standings have null aggregate_score', () => {
    const notQualified = MOCK_RVCC_LEADERBOARD.standings.filter(
      (s) => s.qualification_status === 'not_qualified'
    );
    for (const standing of notQualified) {
      expect(standing.aggregate_score).toBeNull();
    }
  });

  it('qualified standings have a non-null rank', () => {
    const qualified = MOCK_RVCC_LEADERBOARD.standings.filter(
      (s) => s.qualification_status === 'qualified'
    );
    for (const standing of qualified) {
      expect(standing.rank).not.toBeNull();
      expect(typeof standing.rank).toBe('number');
    }
  });

  it('first qualified standing has the lowest aggregate_score (is the leader)', () => {
    const qualified = MOCK_RVCC_LEADERBOARD.standings.filter(
      (s) => s.qualification_status === 'qualified'
    );
    const scores = qualified.map((s) => s.aggregate_score as number);
    expect(scores[0]).toBe(Math.min(...scores));
  });

  it('picks with status "cut" or "wd" have null total_score', () => {
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        if (pick.status === 'cut' || pick.status === 'wd') {
          expect(pick.total_score).toBeNull();
        }
      }
    }
  });

  it('picks with status "cut" or "wd" have made_cut false', () => {
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        if (pick.status === 'cut' || pick.status === 'wd') {
          expect(pick.made_cut).toBe(false);
        }
      }
    }
  });

  it('picks with status "active" have a numeric total_score', () => {
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        if (pick.status === 'active') {
          expect(typeof pick.total_score).toBe('number');
        }
      }
    }
  });

  it('picks with counts_toward_total false have is_dropped or not made_cut', () => {
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        if (!pick.counts_toward_total) {
          expect(pick.is_dropped || !pick.made_cut).toBe(true);
        }
      }
    }
  });

  it('each standing has qualification_status of "qualified" or "not_qualified" or "pending"', () => {
    const validStatuses = ['qualified', 'not_qualified', 'pending'];
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      expect(validStatuses).toContain(standing.qualification_status);
    }
  });

  it('RVCC picks do not have bucket_number', () => {
    for (const standing of MOCK_RVCC_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        expect(pick.bucket_number).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// MOCK_CRESTMONT_LEADERBOARD
// ---------------------------------------------------------------------------

describe('MOCK_CRESTMONT_LEADERBOARD', () => {
  it('has pool_id matching MOCK_CRESTMONT_POOL.id', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.pool_id).toBe(MOCK_CRESTMONT_POOL.id);
  });

  it('has a non-empty last_scored_at timestamp', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.last_scored_at).toBeTruthy();
    expect(() => new Date(MOCK_CRESTMONT_LEADERBOARD.last_scored_at)).not.toThrow();
  });

  it('has at least 1 standing', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.standings.length).toBeGreaterThanOrEqual(1);
  });

  it('count matches the number of standings', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.count).toBe(MOCK_CRESTMONT_LEADERBOARD.standings.length);
  });

  it('each standing has exactly 6 picks', () => {
    for (const standing of MOCK_CRESTMONT_LEADERBOARD.standings) {
      expect(standing.picks).toHaveLength(6);
    }
  });

  it('each pick includes a bucket_number', () => {
    for (const standing of MOCK_CRESTMONT_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        expect(typeof pick.bucket_number).toBe('number');
      }
    }
  });

  it('bucket_numbers in first standing are 1 through 6', () => {
    const bucketNumbers = MOCK_CRESTMONT_LEADERBOARD.standings[0].picks.map((p) => p.bucket_number);
    expect(bucketNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('qualified standings have non-null aggregate_score', () => {
    const qualified = MOCK_CRESTMONT_LEADERBOARD.standings.filter(
      (s) => s.qualification_status === 'qualified'
    );
    for (const standing of qualified) {
      expect(standing.aggregate_score).not.toBeNull();
      expect(typeof standing.aggregate_score).toBe('number');
    }
  });

  it('first standing is Alice Johnson at rank 1 with aggregate_score -12', () => {
    const first = MOCK_CRESTMONT_LEADERBOARD.standings[0];
    expect(first.entry_name).toBe('Alice Johnson');
    expect(first.rank).toBe(1);
    expect(first.aggregate_score).toBe(-12);
  });

  it('picks with status "cut" have null total_score and counts_toward_total false', () => {
    for (const standing of MOCK_CRESTMONT_LEADERBOARD.standings) {
      for (const pick of standing.picks) {
        if (pick.status === 'cut') {
          expect(pick.total_score).toBeNull();
          expect(pick.counts_toward_total).toBe(false);
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-pool consistency
// ---------------------------------------------------------------------------

describe('Cross-pool consistency', () => {
  it('RVCC and Crestmont pools share the same tournament_id', () => {
    expect(MOCK_RVCC_POOL.tournament_id).toBe(MOCK_CRESTMONT_POOL.tournament_id);
  });

  it('RVCC and Crestmont pools have different ids', () => {
    expect(MOCK_RVCC_POOL.id).not.toBe(MOCK_CRESTMONT_POOL.id);
  });

  it('RVCC leaderboard pool_id matches RVCC pool id', () => {
    expect(MOCK_RVCC_LEADERBOARD.pool_id).toBe(MOCK_RVCC_POOL.id);
  });

  it('Crestmont leaderboard pool_id matches Crestmont pool id', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.pool_id).toBe(MOCK_CRESTMONT_POOL.id);
  });

  it('RVCC field pool_id matches RVCC pool id', () => {
    expect(MOCK_RVCC_FIELD.pool_id).toBe(MOCK_RVCC_POOL.id);
  });

  it('Crestmont field pool_id matches Crestmont pool id', () => {
    expect(MOCK_CRESTMONT_FIELD.pool_id).toBe(MOCK_CRESTMONT_POOL.id);
  });

  it('both leaderboards share the same last_scored_at', () => {
    expect(MOCK_RVCC_LEADERBOARD.last_scored_at).toBe(MOCK_CRESTMONT_LEADERBOARD.last_scored_at);
  });
});
