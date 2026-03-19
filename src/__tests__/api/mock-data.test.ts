import { describe, it, expect } from 'vitest';
import {
  MOCK_AVAILABLE_GOLFERS,
  MOCK_GOLFER_BUCKETS,
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
  MOCK_RVCC_TOURNAMENT_SUMMARY,
  MOCK_CRESTMONT_TOURNAMENT_SUMMARY,
  MOCK_RVCC_TOURNAMENT_DETAIL,
  MOCK_CRESTMONT_TOURNAMENT_DETAIL,
} from '../../api/mock/data';

// ---------------------------------------------------------------------------
// MOCK_AVAILABLE_GOLFERS
// ---------------------------------------------------------------------------

describe('MOCK_AVAILABLE_GOLFERS', () => {
  it('has exactly 24 golfers', () => {
    expect(MOCK_AVAILABLE_GOLFERS).toHaveLength(24);
  });

  it('every golfer has id, name, ranking, and country', () => {
    for (const golfer of MOCK_AVAILABLE_GOLFERS) {
      expect(typeof golfer.id).toBe('string');
      expect(golfer.id).toBeTruthy();
      expect(typeof golfer.name).toBe('string');
      expect(golfer.name).toBeTruthy();
      expect(typeof golfer.country).toBe('string');
      expect(golfer.country).toBeTruthy();
      expect(golfer.ranking === null || typeof golfer.ranking === 'number').toBe(true);
    }
  });

  it('all golfer ids are unique', () => {
    const ids = MOCK_AVAILABLE_GOLFERS.map((g) => g.id);
    expect(new Set(ids).size).toBe(24);
  });

  it('all golfer names are unique', () => {
    const names = MOCK_AVAILABLE_GOLFERS.map((g) => g.name);
    expect(new Set(names).size).toBe(24);
  });

  it('ids follow the pattern g1..g24', () => {
    const ids = MOCK_AVAILABLE_GOLFERS.map((g) => g.id);
    const expected = Array.from({ length: 24 }, (_, i) => `g${i + 1}`);
    expect(ids).toEqual(expected);
  });

  it('rankings are 1 through 24 in order', () => {
    const rankings = MOCK_AVAILABLE_GOLFERS.map((g) => g.ranking);
    const expected = Array.from({ length: 24 }, (_, i) => i + 1);
    expect(rankings).toEqual(expected);
  });

  it('first golfer is Scottie Scheffler (ranking 1, USA)', () => {
    expect(MOCK_AVAILABLE_GOLFERS[0]).toMatchObject({
      id: 'g1',
      name: 'Scottie Scheffler',
      ranking: 1,
      country: 'USA',
    });
  });

  it('last golfer is Adam Scott (ranking 24, AUS)', () => {
    expect(MOCK_AVAILABLE_GOLFERS[23]).toMatchObject({
      id: 'g24',
      name: 'Adam Scott',
      ranking: 24,
      country: 'AUS',
    });
  });

  it('contains golfers from multiple countries', () => {
    const countries = new Set(MOCK_AVAILABLE_GOLFERS.map((g) => g.country));
    expect(countries.size).toBeGreaterThan(1);
  });
});

// ---------------------------------------------------------------------------
// MOCK_GOLFER_BUCKETS
// ---------------------------------------------------------------------------

describe('MOCK_GOLFER_BUCKETS', () => {
  it('has exactly 6 buckets', () => {
    expect(MOCK_GOLFER_BUCKETS).toHaveLength(6);
  });

  it('each bucket has exactly 4 golfers', () => {
    for (const bucket of MOCK_GOLFER_BUCKETS) {
      expect(bucket.golfers).toHaveLength(4);
    }
  });

  it('bucketIndex values are 0 through 5', () => {
    const indices = MOCK_GOLFER_BUCKETS.map((b) => b.bucketIndex);
    expect(indices).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('bucket labels are "Bucket A" through "Bucket F"', () => {
    const labels = MOCK_GOLFER_BUCKETS.map((b) => b.label);
    expect(labels).toEqual([
      'Bucket A',
      'Bucket B',
      'Bucket C',
      'Bucket D',
      'Bucket E',
      'Bucket F',
    ]);
  });

  it('every golfer inside a bucket carries that bucket\'s bucketIndex', () => {
    for (const bucket of MOCK_GOLFER_BUCKETS) {
      for (const golfer of bucket.golfers) {
        expect(golfer.bucketIndex).toBe(bucket.bucketIndex);
      }
    }
  });

  it('each golfer in every bucket has id, name, ranking, country', () => {
    for (const bucket of MOCK_GOLFER_BUCKETS) {
      for (const golfer of bucket.golfers) {
        expect(typeof golfer.id).toBe('string');
        expect(golfer.id).toBeTruthy();
        expect(typeof golfer.name).toBe('string');
        expect(golfer.name).toBeTruthy();
        expect(typeof golfer.country).toBe('string');
        expect(golfer.ranking === null || typeof golfer.ranking === 'number').toBe(true);
      }
    }
  });

  it('all golfer ids across all buckets are unique (no duplicates)', () => {
    const allIds = MOCK_GOLFER_BUCKETS.flatMap((b) => b.golfers.map((g) => g.id));
    expect(allIds).toHaveLength(24);
    expect(new Set(allIds).size).toBe(24);
  });

  it('Bucket A contains g1–g4 (rankings 1–4)', () => {
    const bucketA = MOCK_GOLFER_BUCKETS[0];
    const ids = bucketA.golfers.map((g) => g.id);
    expect(ids).toEqual(['g1', 'g2', 'g3', 'g4']);
  });

  it('Bucket F contains g21–g24 (rankings 21–24)', () => {
    const bucketF = MOCK_GOLFER_BUCKETS[5];
    const ids = bucketF.golfers.map((g) => g.id);
    expect(ids).toEqual(['g21', 'g22', 'g23', 'g24']);
  });

  it('golfers in buckets collectively match MOCK_AVAILABLE_GOLFERS (excluding bucketIndex)', () => {
    const bucketGolferIds = MOCK_GOLFER_BUCKETS.flatMap((b) => b.golfers.map((g) => g.id)).sort();
    const availableIds = MOCK_AVAILABLE_GOLFERS.map((g) => g.id).sort();
    expect(bucketGolferIds).toEqual(availableIds);
  });
});

// ---------------------------------------------------------------------------
// MOCK_RVCC_LEADERBOARD
// ---------------------------------------------------------------------------

describe('MOCK_RVCC_LEADERBOARD', () => {
  it('has tournamentId "masters-2026-rvcc"', () => {
    expect(MOCK_RVCC_LEADERBOARD.tournamentId).toBe('masters-2026-rvcc');
  });

  it('has clubCode "rvcc"', () => {
    expect(MOCK_RVCC_LEADERBOARD.clubCode).toBe('rvcc');
  });

  it('has a non-empty tournamentName', () => {
    expect(MOCK_RVCC_LEADERBOARD.tournamentName).toBeTruthy();
  });

  it('has currentRound set to 2', () => {
    expect(MOCK_RVCC_LEADERBOARD.currentRound).toBe(2);
  });

  it('has a lastUpdated timestamp', () => {
    expect(MOCK_RVCC_LEADERBOARD.lastUpdated).toBeTruthy();
    expect(() => new Date(MOCK_RVCC_LEADERBOARD.lastUpdated)).not.toThrow();
  });

  it('has 3 entries', () => {
    expect(MOCK_RVCC_LEADERBOARD.entries).toHaveLength(3);
  });

  it('each entry has 7 golfer cells', () => {
    for (const entry of MOCK_RVCC_LEADERBOARD.entries) {
      expect(entry.golfers).toHaveLength(7);
    }
  });

  it('qualified entries (isQualified=true) have a non-null totalScore', () => {
    const qualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => e.isQualified);
    for (const entry of qualified) {
      expect(entry.totalScore).not.toBeNull();
      expect(typeof entry.totalScore).toBe('number');
    }
  });

  it('non-qualified entries have totalScore of null', () => {
    const disqualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => !e.isQualified);
    for (const entry of disqualified) {
      expect(entry.totalScore).toBeNull();
    }
  });

  it('qualified entries have a numeric position', () => {
    const qualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => e.isQualified);
    for (const entry of qualified) {
      expect(typeof entry.position).toBe('number');
    }
  });

  it('non-qualified entries have position of null', () => {
    const disqualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => !e.isQualified);
    for (const entry of disqualified) {
      expect(entry.position).toBeNull();
    }
  });

  it('displayPosition for non-qualified entries is "-"', () => {
    const disqualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => !e.isQualified);
    for (const entry of disqualified) {
      expect(entry.displayPosition).toBe('-');
    }
  });

  it('entries have unique entryIds', () => {
    const ids = MOCK_RVCC_LEADERBOARD.entries.map((e) => e.entryId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('first entry (position 1) has the lowest totalScore among qualified entries', () => {
    const qualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => e.isQualified);
    const scores = qualified.map((e) => e.totalScore as number);
    expect(scores[0]).toBe(Math.min(...scores));
  });

  it('golfer cells with status "cut" or "wd" have score of null', () => {
    for (const entry of MOCK_RVCC_LEADERBOARD.entries) {
      for (const cell of entry.golfers) {
        if (cell.status === 'cut' || cell.status === 'wd') {
          expect(cell.score).toBeNull();
        }
      }
    }
  });

  it('golfer cells with status "active" have a numeric score', () => {
    for (const entry of MOCK_RVCC_LEADERBOARD.entries) {
      for (const cell of entry.golfers) {
        if (cell.status === 'active') {
          expect(typeof cell.score).toBe('number');
        }
      }
    }
  });

  it('isCounted is false for cells with status "cut" or "wd"', () => {
    for (const entry of MOCK_RVCC_LEADERBOARD.entries) {
      for (const cell of entry.golfers) {
        if (cell.status === 'cut' || cell.status === 'wd') {
          expect(cell.isCounted).toBe(false);
        }
      }
    }
  });

  it('each entry has a non-empty qualificationNote', () => {
    for (const entry of MOCK_RVCC_LEADERBOARD.entries) {
      expect(typeof entry.qualificationNote).toBe('string');
      expect(entry.qualificationNote.length).toBeGreaterThan(0);
    }
  });

  it('countedCount is 0 for non-qualified entries', () => {
    const disqualified = MOCK_RVCC_LEADERBOARD.entries.filter((e) => !e.isQualified);
    for (const entry of disqualified) {
      expect(entry.countedCount).toBe(0);
    }
  });

  it('golfer cells have thru set to "-" when status is cut or wd', () => {
    for (const entry of MOCK_RVCC_LEADERBOARD.entries) {
      for (const cell of entry.golfers) {
        if (cell.status === 'cut' || cell.status === 'wd') {
          expect(cell.thru).toBe('-');
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// MOCK_CRESTMONT_LEADERBOARD
// ---------------------------------------------------------------------------

describe('MOCK_CRESTMONT_LEADERBOARD', () => {
  it('has tournamentId "masters-2026-crestmont"', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.tournamentId).toBe('masters-2026-crestmont');
  });

  it('has clubCode "crestmont"', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.clubCode).toBe('crestmont');
  });

  it('has currentRound set to 2', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.currentRound).toBe(2);
  });

  it('has a lastUpdated timestamp', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.lastUpdated).toBeTruthy();
    expect(() => new Date(MOCK_CRESTMONT_LEADERBOARD.lastUpdated)).not.toThrow();
  });

  it('has at least 1 entry', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('each entry has exactly 6 golfer cells', () => {
    for (const entry of MOCK_CRESTMONT_LEADERBOARD.entries) {
      expect(entry.golfers).toHaveLength(6);
    }
  });

  it('golfer cells include a bucketLabel string', () => {
    for (const entry of MOCK_CRESTMONT_LEADERBOARD.entries) {
      for (const cell of entry.golfers) {
        expect(typeof cell.bucketLabel).toBe('string');
        expect((cell.bucketLabel as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('qualified entries have non-null totalScore', () => {
    const qualified = MOCK_CRESTMONT_LEADERBOARD.entries.filter((e) => e.isQualified);
    for (const entry of qualified) {
      expect(entry.totalScore).not.toBeNull();
      expect(typeof entry.totalScore).toBe('number');
    }
  });

  it('non-qualified entries have totalScore of null', () => {
    const disqualified = MOCK_CRESTMONT_LEADERBOARD.entries.filter((e) => !e.isQualified);
    for (const entry of disqualified) {
      expect(entry.totalScore).toBeNull();
    }
  });

  it('first entry is "Alice Johnson" at position 1 with totalScore -12', () => {
    const first = MOCK_CRESTMONT_LEADERBOARD.entries[0];
    expect(first.entryName).toBe('Alice Johnson');
    expect(first.position).toBe(1);
    expect(first.totalScore).toBe(-12);
    expect(first.displayTotal).toBe('-12');
  });

  it('bucketLabels in first entry are Bucket A through Bucket F', () => {
    const labels = MOCK_CRESTMONT_LEADERBOARD.entries[0].golfers.map((c) => c.bucketLabel);
    expect(labels).toEqual([
      'Bucket A',
      'Bucket B',
      'Bucket C',
      'Bucket D',
      'Bucket E',
      'Bucket F',
    ]);
  });

  it('golfer cells with status "cut" have score null and isCounted false', () => {
    for (const entry of MOCK_CRESTMONT_LEADERBOARD.entries) {
      for (const cell of entry.golfers) {
        if (cell.status === 'cut') {
          expect(cell.score).toBeNull();
          expect(cell.isCounted).toBe(false);
          expect(cell.displayScore).toBe('CUT');
          expect(cell.thru).toBe('-');
        }
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Tournament Summaries – clubCode consistency
// ---------------------------------------------------------------------------

describe('Tournament summaries have correct clubCode', () => {
  it('MOCK_RVCC_TOURNAMENT_SUMMARY.clubCode is "rvcc"', () => {
    expect(MOCK_RVCC_TOURNAMENT_SUMMARY.clubCode).toBe('rvcc');
  });

  it('MOCK_CRESTMONT_TOURNAMENT_SUMMARY.clubCode is "crestmont"', () => {
    expect(MOCK_CRESTMONT_TOURNAMENT_SUMMARY.clubCode).toBe('crestmont');
  });

  it('MOCK_RVCC_TOURNAMENT_DETAIL.clubCode is "rvcc"', () => {
    expect(MOCK_RVCC_TOURNAMENT_DETAIL.clubCode).toBe('rvcc');
  });

  it('MOCK_CRESTMONT_TOURNAMENT_DETAIL.clubCode is "crestmont"', () => {
    expect(MOCK_CRESTMONT_TOURNAMENT_DETAIL.clubCode).toBe('crestmont');
  });

  it('RVCC leaderboard clubCode matches RVCC summary', () => {
    expect(MOCK_RVCC_LEADERBOARD.clubCode).toBe(MOCK_RVCC_TOURNAMENT_SUMMARY.clubCode);
  });

  it('Crestmont leaderboard clubCode matches Crestmont summary', () => {
    expect(MOCK_CRESTMONT_LEADERBOARD.clubCode).toBe(MOCK_CRESTMONT_TOURNAMENT_SUMMARY.clubCode);
  });

  it('RVCC detail tournamentId matches RVCC leaderboard tournamentId', () => {
    expect(MOCK_RVCC_TOURNAMENT_DETAIL.id).toBe(MOCK_RVCC_LEADERBOARD.tournamentId);
  });

  it('Crestmont detail tournamentId matches Crestmont leaderboard tournamentId', () => {
    expect(MOCK_CRESTMONT_TOURNAMENT_DETAIL.id).toBe(MOCK_CRESTMONT_LEADERBOARD.tournamentId);
  });

  it('both summaries share the same startDate and endDate (same tournament week)', () => {
    expect(MOCK_RVCC_TOURNAMENT_SUMMARY.startDate).toBe(MOCK_CRESTMONT_TOURNAMENT_SUMMARY.startDate);
    expect(MOCK_RVCC_TOURNAMENT_SUMMARY.endDate).toBe(MOCK_CRESTMONT_TOURNAMENT_SUMMARY.endDate);
  });

  it('both summaries have status "active"', () => {
    expect(MOCK_RVCC_TOURNAMENT_SUMMARY.status).toBe('active');
    expect(MOCK_CRESTMONT_TOURNAMENT_SUMMARY.status).toBe('active');
  });

  it('details inherit all fields from their corresponding summaries', () => {
    // RVCC
    expect(MOCK_RVCC_TOURNAMENT_DETAIL).toMatchObject(MOCK_RVCC_TOURNAMENT_SUMMARY);
    // Crestmont
    expect(MOCK_CRESTMONT_TOURNAMENT_DETAIL).toMatchObject(MOCK_CRESTMONT_TOURNAMENT_SUMMARY);
  });
});
