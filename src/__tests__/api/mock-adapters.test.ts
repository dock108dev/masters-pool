import { describe, it, expect, beforeEach } from 'vitest';
import { MockApiClient } from '../../api/mock/adapters';
import type { ClubCode } from '../../types/domain';

// Use latency of 0 to avoid real delays in tests
let client: MockApiClient;

beforeEach(() => {
  client = new MockApiClient(0);
});

// ---------------------------------------------------------------------------
// getActiveTournament
// ---------------------------------------------------------------------------

describe('MockApiClient.getActiveTournament', () => {
  it('returns the RVCC tournament summary for clubCode "rvcc"', async () => {
    const result = await client.getActiveTournament('rvcc');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('masters-2026-rvcc');
    expect(result!.clubCode).toBe('rvcc');
    expect(result!.name).toContain('RVCC');
    expect(result!.year).toBe(2026);
    expect(result!.status).toBe('active');
    expect(result!.startDate).toBe('2026-04-09');
    expect(result!.endDate).toBe('2026-04-12');
  });

  it('returns the Crestmont tournament summary for clubCode "crestmont"', async () => {
    const result = await client.getActiveTournament('crestmont');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('masters-2026-crestmont');
    expect(result!.clubCode).toBe('crestmont');
    expect(result!.name).toContain('Crestmont');
    expect(result!.year).toBe(2026);
    expect(result!.status).toBe('active');
    expect(result!.startDate).toBe('2026-04-09');
    expect(result!.endDate).toBe('2026-04-12');
  });

  it('returns null for an unknown clubCode', async () => {
    const result = await client.getActiveTournament('unknown' as ClubCode);
    expect(result).toBeNull();
  });

  it('returns a value with all required TournamentSummary fields', async () => {
    const result = await client.getActiveTournament('rvcc');

    expect(result).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      year: expect.any(Number),
      clubCode: expect.any(String),
      status: expect.any(String),
      startDate: expect.any(String),
      endDate: expect.any(String),
    });
  });
});

// ---------------------------------------------------------------------------
// getTournamentDetail
// ---------------------------------------------------------------------------

describe('MockApiClient.getTournamentDetail', () => {
  it('returns RVCC tournament detail for a non-crestmont id', async () => {
    const result = await client.getTournamentDetail('masters-2026-rvcc');

    expect(result.id).toBe('masters-2026-rvcc');
    expect(result.clubCode).toBe('rvcc');
    expect(result.courseName).toBe('Augusta National Golf Club');
    expect(result.rounds).toBe(4);
    expect(result.currentRound).toBe(2);
    expect(result.entriesCount).toBe(48);
    expect(result.entryDeadline).toBe('2026-04-09T07:00:00Z');
  });

  it('returns Crestmont tournament detail when tournamentId contains "crestmont"', async () => {
    const result = await client.getTournamentDetail('masters-2026-crestmont');

    expect(result.id).toBe('masters-2026-crestmont');
    expect(result.clubCode).toBe('crestmont');
    expect(result.courseName).toBe('Augusta National Golf Club');
    expect(result.rounds).toBe(4);
    expect(result.currentRound).toBe(2);
    expect(result.entriesCount).toBe(36);
    expect(result.entryDeadline).toBe('2026-04-09T07:00:00Z');
  });

  it('returned detail extends the matching tournament summary fields', async () => {
    const detail = await client.getTournamentDetail('masters-2026-rvcc');

    // All TournamentSummary fields must still be present
    expect(detail).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      year: expect.any(Number),
      clubCode: expect.any(String),
      status: expect.any(String),
      startDate: expect.any(String),
      endDate: expect.any(String),
      // Plus TournamentDetail-specific fields
      courseName: expect.any(String),
      rounds: expect.any(Number),
      entriesCount: expect.any(Number),
      entryDeadline: expect.any(String),
    });
  });
});

// ---------------------------------------------------------------------------
// getAvailableGolfers
// ---------------------------------------------------------------------------

describe('MockApiClient.getAvailableGolfers', () => {
  it('returns an array of 24 golfers', async () => {
    const golfers = await client.getAvailableGolfers('any-tournament-id');
    expect(golfers).toHaveLength(24);
  });

  it('every golfer has id, name, ranking, and country fields', async () => {
    const golfers = await client.getAvailableGolfers('masters-2026-rvcc');

    for (const golfer of golfers) {
      expect(golfer.id).toBeTruthy();
      expect(typeof golfer.id).toBe('string');
      expect(golfer.name).toBeTruthy();
      expect(typeof golfer.name).toBe('string');
      expect(typeof golfer.country).toBe('string');
      // ranking is number | null per the domain type
      expect(golfer.ranking === null || typeof golfer.ranking === 'number').toBe(true);
    }
  });

  it('rankings are unique and run from 1 to 24', async () => {
    const golfers = await client.getAvailableGolfers('masters-2026-rvcc');
    const rankings = golfers.map((g) => g.ranking).sort((a, b) => (a ?? 0) - (b ?? 0));
    expect(rankings).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it('ids are unique', async () => {
    const golfers = await client.getAvailableGolfers('masters-2026-rvcc');
    const ids = golfers.map((g) => g.id);
    expect(new Set(ids).size).toBe(24);
  });

  it('the first golfer is Scottie Scheffler ranked 1', async () => {
    const golfers = await client.getAvailableGolfers('masters-2026-rvcc');
    expect(golfers[0]).toMatchObject({ id: 'g1', name: 'Scottie Scheffler', ranking: 1, country: 'USA' });
  });

  it('the last golfer is Adam Scott ranked 24', async () => {
    const golfers = await client.getAvailableGolfers('masters-2026-rvcc');
    expect(golfers[23]).toMatchObject({ id: 'g24', name: 'Adam Scott', ranking: 24, country: 'AUS' });
  });

  it('returns the same data regardless of tournamentId', async () => {
    const a = await client.getAvailableGolfers('masters-2026-rvcc');
    const b = await client.getAvailableGolfers('masters-2026-crestmont');
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// getGolferBuckets
// ---------------------------------------------------------------------------

describe('MockApiClient.getGolferBuckets', () => {
  it('returns exactly 6 buckets', async () => {
    const buckets = await client.getGolferBuckets('any-id');
    expect(buckets).toHaveLength(6);
  });

  it('each bucket has bucketIndex, label, and a golfers array of 4', async () => {
    const buckets = await client.getGolferBuckets('masters-2026-rvcc');

    buckets.forEach((bucket, index) => {
      expect(bucket.bucketIndex).toBe(index);
      expect(typeof bucket.label).toBe('string');
      expect(bucket.label).toBeTruthy();
      expect(bucket.golfers).toHaveLength(4);
    });
  });

  it('bucket labels are A through F', async () => {
    const buckets = await client.getGolferBuckets('masters-2026-rvcc');
    const labels = buckets.map((b) => b.label);
    expect(labels).toEqual(['Bucket A', 'Bucket B', 'Bucket C', 'Bucket D', 'Bucket E', 'Bucket F']);
  });

  it('every golfer inside a bucket carries that bucket\'s bucketIndex', async () => {
    const buckets = await client.getGolferBuckets('masters-2026-rvcc');

    for (const bucket of buckets) {
      for (const golfer of bucket.golfers) {
        expect(golfer.bucketIndex).toBe(bucket.bucketIndex);
      }
    }
  });

  it('bucket golfers collectively cover all 24 available golfers', async () => {
    const buckets = await client.getGolferBuckets('masters-2026-rvcc');
    const allIds = buckets.flatMap((b) => b.golfers.map((g) => g.id));
    expect(allIds).toHaveLength(24);
    expect(new Set(allIds).size).toBe(24);
  });

  it('Bucket A contains the top-4 ranked golfers', async () => {
    const buckets = await client.getGolferBuckets('masters-2026-rvcc');
    const bucketA = buckets[0];
    const names = bucketA.golfers.map((g) => g.name);
    expect(names).toContain('Scottie Scheffler');
    expect(names).toContain('Xander Schauffele');
    expect(names).toContain('Rory McIlroy');
    expect(names).toContain('Jon Rahm');
  });

  it('returns the same data regardless of tournamentId', async () => {
    const a = await client.getGolferBuckets('masters-2026-rvcc');
    const b = await client.getGolferBuckets('masters-2026-crestmont');
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// submitEntry
// ---------------------------------------------------------------------------

describe('MockApiClient.submitEntry', () => {
  const baseRequest = {
    clubCode: 'rvcc' as ClubCode,
    tournamentId: 'masters-2026-rvcc',
    email: 'tester@example.com',
    displayName: 'Test Player',
    golferIds: ['g1', 'g2', 'g3'],
  };

  it('returns an object with entryId, confirmationCode, email, displayName, golferNames, submittedAt', async () => {
    const response = await client.submitEntry(baseRequest);

    expect(response.entryId).toBeTruthy();
    expect(response.confirmationCode).toBeTruthy();
    expect(response.email).toBe('tester@example.com');
    expect(response.displayName).toBe('Test Player');
    expect(Array.isArray(response.golferNames)).toBe(true);
    expect(response.submittedAt).toBeTruthy();
  });

  it('entryId starts with "entry-"', async () => {
    const response = await client.submitEntry(baseRequest);
    expect(response.entryId).toMatch(/^entry-/);
  });

  it('confirmationCode starts with "CONF-"', async () => {
    const response = await client.submitEntry(baseRequest);
    expect(response.confirmationCode).toMatch(/^CONF-/);
  });

  it('echoes back the submitted email', async () => {
    const response = await client.submitEntry({ ...baseRequest, email: 'other@test.com' });
    expect(response.email).toBe('other@test.com');
  });

  it('echoes back the submitted displayName', async () => {
    const response = await client.submitEntry({ ...baseRequest, displayName: 'Jane Golfer' });
    expect(response.displayName).toBe('Jane Golfer');
  });

  it('resolves golferIds to golfer names from the available pool', async () => {
    const response = await client.submitEntry({ ...baseRequest, golferIds: ['g1', 'g3', 'g5'] });
    expect(response.golferNames).toContain('Scottie Scheffler');
    expect(response.golferNames).toContain('Rory McIlroy');
    expect(response.golferNames).toContain('Collin Morikawa');
    expect(response.golferNames).toHaveLength(3);
  });

  it('returns an empty golferNames array when no golferIds match', async () => {
    const response = await client.submitEntry({ ...baseRequest, golferIds: ['unknown-id'] });
    expect(response.golferNames).toHaveLength(0);
  });

  it('submittedAt is a valid ISO-8601 date string', async () => {
    const response = await client.submitEntry(baseRequest);
    expect(new Date(response.submittedAt).toISOString()).toBe(response.submittedAt);
  });

  it('generates unique entryIds across two concurrent submissions', async () => {
    // Introduce a tiny gap so Date.now() differs between the two calls
    const r1 = await client.submitEntry(baseRequest);
    await new Promise((resolve) => setTimeout(resolve, 2));
    const r2 = await client.submitEntry(baseRequest);
    expect(r1.entryId).not.toBe(r2.entryId);
  });
});

// ---------------------------------------------------------------------------
// getLeaderboard
// ---------------------------------------------------------------------------

describe('MockApiClient.getLeaderboard', () => {
  it('returns RVCC leaderboard for a non-crestmont tournamentId', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-rvcc');

    expect(leaderboard.tournamentId).toBe('masters-2026-rvcc');
    expect(leaderboard.clubCode).toBe('rvcc');
    expect(leaderboard.tournamentName).toContain('RVCC');
  });

  it('returns Crestmont leaderboard when tournamentId contains "crestmont"', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-crestmont');

    expect(leaderboard.tournamentId).toBe('masters-2026-crestmont');
    expect(leaderboard.clubCode).toBe('crestmont');
    expect(leaderboard.tournamentName).toContain('Crestmont');
  });

  it('RVCC leaderboard has 3 entries', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-rvcc');
    expect(leaderboard.entries).toHaveLength(3);
  });

  it('Crestmont leaderboard has at least 1 entry', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-crestmont');
    expect(leaderboard.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('leaderboard has currentRound and lastUpdated fields', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-rvcc');
    expect(typeof leaderboard.currentRound === 'number' || leaderboard.currentRound === null).toBe(true);
    expect(leaderboard.lastUpdated).toBeTruthy();
  });

  it('each entry has required LeaderboardEntry fields', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-rvcc');

    for (const entry of leaderboard.entries) {
      expect(typeof entry.entryId).toBe('string');
      expect(typeof entry.entryName).toBe('string');
      expect(typeof entry.email).toBe('string');
      expect(typeof entry.displayPosition).toBe('string');
      expect(typeof entry.displayTotal).toBe('string');
      expect(typeof entry.isQualified).toBe('boolean');
      expect(typeof entry.qualificationNote).toBe('string');
      expect(typeof entry.countedCount).toBe('number');
      expect(Array.isArray(entry.golfers)).toBe(true);
    }
  });

  it('each golfer cell within an entry has required fields', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-rvcc');

    for (const entry of leaderboard.entries) {
      for (const cell of entry.golfers) {
        expect(typeof cell.golferId).toBe('string');
        expect(typeof cell.golferName).toBe('string');
        expect(typeof cell.displayScore).toBe('string');
        expect(typeof cell.thru).toBe('string');
        expect(['active', 'cut', 'wd', 'dq']).toContain(cell.status);
        expect(typeof cell.isCounted).toBe('boolean');
      }
    }
  });

  it('RVCC: first entry is the leader with the lowest totalScore', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-rvcc');
    const qualified = leaderboard.entries.filter((e) => e.isQualified);
    const scores = qualified.map((e) => e.totalScore as number);
    expect(scores[0]).toBe(Math.min(...scores));
  });

  it('Crestmont: first entry has 6 golfer cells', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-crestmont');
    expect(leaderboard.entries[0].golfers).toHaveLength(6);
  });

  it('Crestmont: golfer cells include bucketLabel', async () => {
    const leaderboard = await client.getLeaderboard('masters-2026-crestmont');
    const cells = leaderboard.entries[0].golfers;
    expect(cells.every((c) => typeof c.bucketLabel === 'string')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// lookupEntries
// ---------------------------------------------------------------------------

describe('MockApiClient.lookupEntries', () => {
  it('returns an object with email and entries array', async () => {
    const result = await client.lookupEntries('rvcc', 'player@example.com');

    expect(result.email).toBe('player@example.com');
    expect(Array.isArray(result.entries)).toBe(true);
  });

  it('echoes back the provided email', async () => {
    const result = await client.lookupEntries('crestmont', 'another@test.com');
    expect(result.email).toBe('another@test.com');
  });

  it('returns at least one entry', async () => {
    const result = await client.lookupEntries('rvcc', 'anyone@example.com');
    expect(result.entries.length).toBeGreaterThanOrEqual(1);
  });

  it('each entry has entryId, displayName, golferNames, submittedAt, confirmationCode', async () => {
    const result = await client.lookupEntries('rvcc', 'test@example.com');

    for (const entry of result.entries) {
      expect(typeof entry.entryId).toBe('string');
      expect(entry.entryId).toBeTruthy();
      expect(typeof entry.displayName).toBe('string');
      expect(Array.isArray(entry.golferNames)).toBe(true);
      expect(typeof entry.submittedAt).toBe('string');
      expect(typeof entry.confirmationCode).toBe('string');
      expect(entry.confirmationCode).toBeTruthy();
    }
  });

  it('first entry has expected fixture values', async () => {
    const result = await client.lookupEntries('rvcc', 'test@example.com');
    const first = result.entries[0];

    expect(first.entryId).toBe('entry-mock-1');
    expect(first.displayName).toBe('Mock Entry');
    expect(first.golferNames).toContain('Scottie Scheffler');
    expect(first.golferNames).toContain('Rory McIlroy');
    expect(first.golferNames).toContain('Jon Rahm');
    expect(first.confirmationCode).toBe('CONF-ABC123');
  });

  it('returns the same mock entries regardless of clubCode', async () => {
    const rvcc = await client.lookupEntries('rvcc', 'x@x.com');
    const crestmont = await client.lookupEntries('crestmont', 'x@x.com');
    expect(rvcc.entries).toEqual(crestmont.entries);
  });
});

// ---------------------------------------------------------------------------
// uploadFile
// ---------------------------------------------------------------------------

describe('MockApiClient.uploadFile', () => {
  it('returns an object with a url string', async () => {
    const file = new File(['content'], 'scorecard.png', { type: 'image/png' });
    const result = await client.uploadFile(file, 'entry-123');

    expect(result).toHaveProperty('url');
    expect(typeof result.url).toBe('string');
  });

  it('url is a valid URL string', async () => {
    const file = new File(['data'], 'file.pdf', { type: 'application/pdf' });
    const result = await client.uploadFile(file, 'entry-abc');

    expect(() => new URL(result.url)).not.toThrow();
  });

  it('url points to the expected placeholder host', async () => {
    const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });
    const result = await client.uploadFile(file, 'entry-xyz');

    expect(result.url).toBe('https://placeholder.example.com/uploads/mock-file');
  });

  it('returns the same url regardless of the file or entryId passed', async () => {
    const file1 = new File(['a'], 'a.png', { type: 'image/png' });
    const file2 = new File(['b'], 'b.png', { type: 'image/png' });

    const r1 = await client.uploadFile(file1, 'entry-1');
    const r2 = await client.uploadFile(file2, 'entry-2');

    expect(r1.url).toBe(r2.url);
  });
});
