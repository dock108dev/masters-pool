import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateDisplayName,
  validateRvccPicks,
  validateCrestmontPicks,
  validateEntryForm,
  canAddGolfer,
} from '../../utils/validation';
import { CLUB_CONFIGS } from '../../config/clubs';
import type { GolferBucket } from '../../types/domain';

const rvccConfig = CLUB_CONFIGS.rvcc;         // pickCount: 7, useBuckets: false
const crestmontConfig = CLUB_CONFIGS.crestmont; // pickCount: 6, useBuckets: true

// ---------------------------------------------------------------------------
// Inline fixtures — use dg_id (number) and player_name, bucket_number (1-indexed)
// ---------------------------------------------------------------------------

// 6 buckets × 4 golfers each (dg_ids 1–24)
const MOCK_GOLFER_BUCKETS: GolferBucket[] = [
  {
    bucket_number: 1,
    label: 'Bucket A',
    golfers: [
      { dg_id: 1,  player_name: 'Golfer 1' },
      { dg_id: 2,  player_name: 'Golfer 2' },
      { dg_id: 3,  player_name: 'Golfer 3' },
      { dg_id: 4,  player_name: 'Golfer 4' },
    ],
  },
  {
    bucket_number: 2,
    label: 'Bucket B',
    golfers: [
      { dg_id: 5,  player_name: 'Golfer 5' },
      { dg_id: 6,  player_name: 'Golfer 6' },
      { dg_id: 7,  player_name: 'Golfer 7' },
      { dg_id: 8,  player_name: 'Golfer 8' },
    ],
  },
  {
    bucket_number: 3,
    label: 'Bucket C',
    golfers: [
      { dg_id: 9,  player_name: 'Golfer 9' },
      { dg_id: 10, player_name: 'Golfer 10' },
      { dg_id: 11, player_name: 'Golfer 11' },
      { dg_id: 12, player_name: 'Golfer 12' },
    ],
  },
  {
    bucket_number: 4,
    label: 'Bucket D',
    golfers: [
      { dg_id: 13, player_name: 'Golfer 13' },
      { dg_id: 14, player_name: 'Golfer 14' },
      { dg_id: 15, player_name: 'Golfer 15' },
      { dg_id: 16, player_name: 'Golfer 16' },
    ],
  },
  {
    bucket_number: 5,
    label: 'Bucket E',
    golfers: [
      { dg_id: 17, player_name: 'Golfer 17' },
      { dg_id: 18, player_name: 'Golfer 18' },
      { dg_id: 19, player_name: 'Golfer 19' },
      { dg_id: 20, player_name: 'Golfer 20' },
    ],
  },
  {
    bucket_number: 6,
    label: 'Bucket F',
    golfers: [
      { dg_id: 21, player_name: 'Golfer 21' },
      { dg_id: 22, player_name: 'Golfer 22' },
      { dg_id: 23, player_name: 'Golfer 23' },
      { dg_id: 24, player_name: 'Golfer 24' },
    ],
  },
];

// One dg_id per bucket (bucket_number 1–6)
const ONE_PER_BUCKET: number[] = [1, 5, 9, 13, 17, 21];

// Seven unique dg_ids for RVCC tests
const SEVEN_UNIQUE: number[] = [1, 2, 3, 4, 5, 6, 7];

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------
describe('validateEmail', () => {
  it('fails with an error when email is empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required.');
  });

  it('fails when email is only whitespace', () => {
    const result = validateEmail('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required.');
  });

  it('fails for an address missing the @ sign', () => {
    const result = validateEmail('notanemail.com');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please enter a valid email address.');
  });

  it('fails for an address missing the domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please enter a valid email address.');
  });

  it('fails for an address missing the TLD', () => {
    const result = validateEmail('user@domain');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please enter a valid email address.');
  });

  it('passes for a well-formed email address', () => {
    const result = validateEmail('user@example.com');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for an email with sub-domain', () => {
    const result = validateEmail('jane.doe@mail.example.org');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for an email with + addressing', () => {
    const result = validateEmail('user+tag@example.com');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateDisplayName
// ---------------------------------------------------------------------------
describe('validateDisplayName', () => {
  it('fails when name is empty', () => {
    const result = validateDisplayName('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Display name is required.');
  });

  it('fails when name is only whitespace', () => {
    const result = validateDisplayName('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Display name is required.');
  });

  it('fails when trimmed name is a single character (too short)', () => {
    const result = validateDisplayName('A');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Display name must be at least 2 characters.');
  });

  it('fails when padded name trims to 1 character', () => {
    const result = validateDisplayName('  X  ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Display name must be at least 2 characters.');
  });

  it('passes for a name with exactly 2 characters', () => {
    const result = validateDisplayName('Jo');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes for a normal full name', () => {
    const result = validateDisplayName('John Smith');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateRvccPicks
// ---------------------------------------------------------------------------
describe('validateRvccPicks', () => {
  it('fails when fewer than 7 golfers are selected', () => {
    const result = validateRvccPicks([1, 2], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 7 golfers/i);
    expect(result.errors[0]).toContain('2'); // currently selected count
  });

  it('fails when more than 7 golfers are selected', () => {
    const result = validateRvccPicks([...SEVEN_UNIQUE, 8], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 7 golfers/i);
  });

  it('fails when the list contains duplicate golfer ids', () => {
    // 7 entries but dg_id 1 appears twice
    const result = validateRvccPicks([1, 1, 2, 3, 4, 5, 6], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /duplicate/i.test(e))).toBe(true);
  });

  it('passes with exactly 7 unique golfer ids', () => {
    const result = validateRvccPicks(SEVEN_UNIQUE, rvccConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reports both wrong-count and duplicate errors together', () => {
    // 6 items with a duplicate — wrong count AND duplicates
    const result = validateRvccPicks([1, 1, 2, 3, 4, 5], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('uses the config pickCount, not a hard-coded value', () => {
    const result = validateRvccPicks([], rvccConfig);
    expect(result.errors[0]).toContain('7');
  });
});

// ---------------------------------------------------------------------------
// validateCrestmontPicks
// ---------------------------------------------------------------------------
describe('validateCrestmontPicks', () => {
  it('fails when fewer than 6 golfers are selected', () => {
    const result = validateCrestmontPicks([1, 5], MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 6 golfers/i);
    expect(result.errors[0]).toContain('2'); // currently selected count
  });

  it('fails when more than 6 golfers are selected', () => {
    const extra = [...ONE_PER_BUCKET, 2]; // 7 ids
    const result = validateCrestmontPicks(extra, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 6 golfers/i);
  });

  it('fails when two golfers come from the same bucket', () => {
    // dg_id 1 and 2 are both in bucket_number 1 (Bucket A)
    const withDuplBucket = [1, 2, 9, 13, 17, 21];
    const result = validateCrestmontPicks(withDuplBucket, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /only 1 golfer may be selected from/i.test(e))).toBe(true);
  });

  it('fails when a golfer dg_id is not found in any bucket', () => {
    const withUnknown = [1, 5, 9, 13, 17, 9999];
    const result = validateCrestmontPicks(withUnknown, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('9999'))).toBe(true);
  });

  it('fails for duplicate golfer ids (same golfer listed twice)', () => {
    // dg_id 1 twice — one bucket collision AND duplicate check
    const withDupe = [1, 1, 9, 13, 17, 21];
    const result = validateCrestmontPicks(withDupe, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /duplicate/i.test(e))).toBe(true);
  });

  it('passes with exactly 6 golfers, one from each bucket', () => {
    const result = validateCrestmontPicks(ONE_PER_BUCKET, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('uses the bucket label in the duplicate-bucket error message', () => {
    const withDuplBucket = [1, 2, 9, 13, 17, 21];
    const result = validateCrestmontPicks(withDuplBucket, MOCK_GOLFER_BUCKETS, crestmontConfig);
    const bucketError = result.errors.find(e => /bucket a/i.test(e));
    expect(bucketError).toBeDefined();
  });

  it('uses the config pickCount, not a hard-coded value', () => {
    const result = validateCrestmontPicks([], MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.errors[0]).toContain('6');
  });
});

// ---------------------------------------------------------------------------
// validateEntryForm
// ---------------------------------------------------------------------------
describe('validateEntryForm', () => {
  // -- RVCC (no buckets) --

  it('RVCC: returns valid when email, name, and 7 golfers are all correct', () => {
    const result = validateEntryForm(
      'user@example.com',
      'John Smith',
      SEVEN_UNIQUE,
      rvccConfig,
      null,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('RVCC: accumulates errors from email, name, and picks when all are invalid', () => {
    const result = validateEntryForm(
      '',       // invalid email
      '',       // invalid name
      [1],      // wrong pick count
      rvccConfig,
      null,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('RVCC: includes email error when email is missing', () => {
    const result = validateEntryForm('', 'John Smith', SEVEN_UNIQUE, rvccConfig, null);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /email is required/i.test(e))).toBe(true);
  });

  it('RVCC: includes name error when display name is too short', () => {
    const result = validateEntryForm('user@x.com', 'J', SEVEN_UNIQUE, rvccConfig, null);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /at least 2 characters/i.test(e))).toBe(true);
  });

  it('RVCC: includes picks error when wrong number selected', () => {
    const result = validateEntryForm('user@x.com', 'Jo', [1], rvccConfig, null);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /exactly 7/i.test(e))).toBe(true);
  });

  // -- Crestmont (uses buckets) --

  it('Crestmont: returns valid when email, name, and 6 bucket picks are correct', () => {
    const result = validateEntryForm(
      'alice@example.com',
      'Alice Johnson',
      ONE_PER_BUCKET,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Crestmont: uses bucket validation (not RVCC flat-list validation)', () => {
    // Two from same bucket — only Crestmont-style validation catches this
    const withDuplBucket = [1, 2, 9, 13, 17, 21];
    const result = validateEntryForm(
      'user@x.com',
      'Jo',
      withDuplBucket,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
    );
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /only 1 golfer may be selected from/i.test(e))).toBe(true);
  });

  it('Crestmont: falls back to RVCC validation when buckets arg is null', () => {
    // When buckets is null even though useBuckets is true, branch takes RVCC path
    const result = validateEntryForm(
      'user@x.com',
      'Jo',
      SEVEN_UNIQUE,
      crestmontConfig,
      null, // no buckets provided
    );
    // validateRvccPicks will fire: 7 selected but pickCount is 6 → invalid
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /exactly 6/i.test(e))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// canAddGolfer
// ---------------------------------------------------------------------------
describe('canAddGolfer', () => {
  // -- Already selected --

  it('disallows adding a golfer that is already in the selected list', () => {
    const result = canAddGolfer(1, [1, 2], rvccConfig, null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Already selected.');
  });

  // -- RVCC (no buckets): max count enforcement --

  it('RVCC: disallows adding when pickCount is already reached', () => {
    const result = canAddGolfer(8, SEVEN_UNIQUE, rvccConfig, null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/maximum of 7/i);
  });

  it('RVCC: allows adding when fewer than pickCount are selected', () => {
    const result = canAddGolfer(8, [1, 2, 3], rvccConfig, null);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('RVCC: allows adding the 7th (last allowed) golfer', () => {
    const sixSelected = SEVEN_UNIQUE.slice(0, 6); // 6 golfers
    const result = canAddGolfer(8, sixSelected, rvccConfig, null);
    expect(result.allowed).toBe(true);
  });

  // -- Crestmont (buckets): bucket collision enforcement --

  it('Crestmont: disallows adding when bucket is already used', () => {
    // dg_id 1 is in bucket_number 1; try to add dg_id 2 (also bucket_number 1)
    const result = canAddGolfer(
      2,
      [1, 5, 9],
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      1, // golferBucketNumber for dg_id 2
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/already selected a golfer from this bucket/i);
  });

  it('Crestmont: allows adding when golfer is from an unused bucket', () => {
    // Selected: dg_id 1 (bucket 1), dg_id 5 (bucket 2); adding dg_id 9 from bucket 3
    const result = canAddGolfer(
      9,
      [1, 5],
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      3, // golferBucketNumber for dg_id 9
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('Crestmont: disallows adding when pickCount is reached even if no bucket collision', () => {
    // All 6 already selected; try to add from a notional 7th bucket
    const result = canAddGolfer(
      25,
      ONE_PER_BUCKET,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      7, // hypothetical 7th bucket — no collision
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/maximum of 6/i);
  });

  it('Crestmont: allows adding when bucket check is skipped (no golferBucketNumber arg)', () => {
    // With no golferBucketNumber passed, bucket collision check is skipped
    const result = canAddGolfer(
      3,
      [1],
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      // no golferBucketNumber
    );
    expect(result.allowed).toBe(true);
  });

  it('returns reason as undefined when addition is allowed', () => {
    const result = canAddGolfer(8, [], rvccConfig, null);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});
