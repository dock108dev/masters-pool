import { describe, it, expect } from 'vitest';
import {
  validateEmail,
  validateDisplayName,
  validateRvccPicks,
  validateCrestmontPicks,
  validateUpload,
  validateEntryForm,
  canAddGolfer,
} from '../../utils/validation';
import { CLUB_CONFIGS } from '../../config/clubs';
import { MOCK_AVAILABLE_GOLFERS, MOCK_GOLFER_BUCKETS } from '../../api/mock/data';

const rvccConfig = CLUB_CONFIGS.rvcc;         // pickCount: 7, useBuckets: false
const crestmontConfig = CLUB_CONFIGS.crestmont; // pickCount: 6, useBuckets: true

// Helpers — one valid golfer id per bucket (buckets 0-5 hold g1-g4, g5-g8, g9-g12, g13-g16, g17-g20, g21-g24)
// The mock data uses ids 'g1'..'g24'; bucketIndex 0 = g1-g4, 1 = g5-g8, 2 = g9-g12, 3 = g13-g16, 4 = g17-g20, 5 = g21-g24
const ONE_PER_BUCKET = ['g1', 'g5', 'g9', 'g13', 'g17', 'g21']; // exactly 6, one from each bucket
const SEVEN_UNIQUE   = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];

// ---------------------------------------------------------------------------
// Helper: build a fake File
// ---------------------------------------------------------------------------
function makeFile(sizeBytes: number, name = 'entry.pdf'): File {
  const buf = new ArrayBuffer(sizeBytes);
  return new File([buf], name, { type: 'application/pdf' });
}

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
    const result = validateRvccPicks(['g1', 'g2'], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 7 golfers/i);
    expect(result.errors[0]).toContain('2'); // currently selected count
  });

  it('fails when more than 7 golfers are selected', () => {
    const result = validateRvccPicks([...SEVEN_UNIQUE, 'g8'], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 7 golfers/i);
  });

  it('fails when the list contains duplicate golfer ids', () => {
    // 7 entries but 'g1' appears twice
    const result = validateRvccPicks(['g1', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6'], rvccConfig);
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
    const result = validateRvccPicks(['g1', 'g1', 'g2', 'g3', 'g4', 'g5'], rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('uses the config pickCount, not a hard-coded value', () => {
    // Verify the error message reflects the config's pickCount (7 for RVCC)
    const result = validateRvccPicks([], rvccConfig);
    expect(result.errors[0]).toContain('7');
  });
});

// ---------------------------------------------------------------------------
// validateCrestmontPicks
// ---------------------------------------------------------------------------
describe('validateCrestmontPicks', () => {
  it('fails when fewer than 6 golfers are selected', () => {
    const result = validateCrestmontPicks(['g1', 'g5'], MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 6 golfers/i);
    expect(result.errors[0]).toContain('2'); // currently selected count
  });

  it('fails when more than 6 golfers are selected', () => {
    const extra = [...ONE_PER_BUCKET, 'g2']; // 7 ids
    const result = validateCrestmontPicks(extra, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exactly 6 golfers/i);
  });

  it('fails when two golfers come from the same bucket', () => {
    // g1 and g2 are both in bucket 0 (Bucket A)
    const withDuplBucket = ['g1', 'g2', 'g9', 'g13', 'g17', 'g21'];
    const result = validateCrestmontPicks(withDuplBucket, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /only 1 golfer may be selected from/i.test(e))).toBe(true);
  });

  it('fails when a golfer id is not found in any bucket', () => {
    const withUnknown = ['g1', 'g5', 'g9', 'g13', 'g17', 'UNKNOWN'];
    const result = validateCrestmontPicks(withUnknown, MOCK_GOLFER_BUCKETS, crestmontConfig);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('"UNKNOWN"'))).toBe(true);
  });

  it('fails for duplicate golfer ids (same golfer listed twice)', () => {
    // g1 twice — one bucket collision AND duplicate check
    const withDupe = ['g1', 'g1', 'g9', 'g13', 'g17', 'g21'];
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
    const withDuplBucket = ['g1', 'g2', 'g9', 'g13', 'g17', 'g21'];
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
// validateUpload
// ---------------------------------------------------------------------------
describe('validateUpload', () => {
  it('fails when upload is required and no file is provided', () => {
    const configRequiresUpload = { ...rvccConfig, uploadRequired: true };
    const result = validateUpload(undefined, configRequiresUpload);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File upload is required.');
  });

  it('passes when upload is not required and no file is provided', () => {
    // RVCC has uploadRequired: false
    const result = validateUpload(undefined, rvccConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when the provided file exceeds 10 MB', () => {
    const bigFile = makeFile(10 * 1024 * 1024 + 1); // 1 byte over the limit
    const result = validateUpload(bigFile, rvccConfig);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('File must be under 10MB.');
  });

  it('passes when the provided file is exactly at the 10 MB boundary', () => {
    const maxFile = makeFile(10 * 1024 * 1024); // exactly 10 MB — not over
    const result = validateUpload(maxFile, rvccConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes when a valid file is provided and upload is optional', () => {
    const smallFile = makeFile(1024); // 1 KB
    const result = validateUpload(smallFile, rvccConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes when a valid file is provided and upload is required', () => {
    const configRequiresUpload = { ...rvccConfig, uploadRequired: true };
    const file = makeFile(512);
    const result = validateUpload(file, configRequiresUpload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
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
      undefined
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('RVCC: accumulates errors from email, name, and picks when all are invalid', () => {
    const result = validateEntryForm(
      '',             // invalid email
      '',             // invalid name
      ['g1'],         // wrong pick count
      rvccConfig,
      null,
      undefined
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('RVCC: includes email error when email is missing', () => {
    const result = validateEntryForm('', 'John Smith', SEVEN_UNIQUE, rvccConfig, null, undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /email is required/i.test(e))).toBe(true);
  });

  it('RVCC: includes name error when display name is too short', () => {
    const result = validateEntryForm('user@x.com', 'J', SEVEN_UNIQUE, rvccConfig, null, undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /at least 2 characters/i.test(e))).toBe(true);
  });

  it('RVCC: includes picks error when wrong number selected', () => {
    const result = validateEntryForm('user@x.com', 'Jo', ['g1'], rvccConfig, null, undefined);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /exactly 7/i.test(e))).toBe(true);
  });

  it('RVCC: skips upload validation when uploadEnabled is false', () => {
    // Provide a deliberately oversized file; rvccConfig has uploadEnabled: true
    // so we need to use a config with uploadEnabled: false to test skipping
    const noUploadConfig = { ...rvccConfig, uploadEnabled: false };
    const bigFile = makeFile(20 * 1024 * 1024);
    const result = validateEntryForm('u@x.com', 'Jo', SEVEN_UNIQUE, noUploadConfig, null, bigFile);
    expect(result.valid).toBe(true);
  });

  it('RVCC: validates upload when uploadEnabled is true and file is too large', () => {
    // rvccConfig has uploadEnabled: true, uploadRequired: false
    const bigFile = makeFile(20 * 1024 * 1024);
    const result = validateEntryForm('u@x.com', 'Jo', SEVEN_UNIQUE, rvccConfig, null, bigFile);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /under 10mb/i.test(e))).toBe(true);
  });

  // -- Crestmont (uses buckets) --

  it('Crestmont: returns valid when email, name, and 6 bucket picks are correct', () => {
    const result = validateEntryForm(
      'alice@example.com',
      'Alice Johnson',
      ONE_PER_BUCKET,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      undefined
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Crestmont: uses bucket validation (not RVCC flat-list validation)', () => {
    // Two from same bucket — only Crestmont-style validation catches this
    const withDuplBucket = ['g1', 'g2', 'g9', 'g13', 'g17', 'g21'];
    const result = validateEntryForm(
      'user@x.com',
      'Jo',
      withDuplBucket,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      undefined
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
      undefined
    );
    // validateRvccPicks will fire: 7 selected but pickCount is 6 → invalid
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /exactly 6/i.test(e))).toBe(true);
  });

  it('Crestmont: does not include upload errors (uploadEnabled is false)', () => {
    const bigFile = makeFile(20 * 1024 * 1024);
    const result = validateEntryForm(
      'alice@example.com',
      'Alice Johnson',
      ONE_PER_BUCKET,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      bigFile
    );
    // crestmontConfig.uploadEnabled is false, so no upload errors
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// canAddGolfer
// ---------------------------------------------------------------------------
describe('canAddGolfer', () => {
  // -- Already selected --

  it('disallows adding a golfer that is already in the selected list', () => {
    const result = canAddGolfer('g1', ['g1', 'g2'], MOCK_AVAILABLE_GOLFERS, rvccConfig, null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Already selected.');
  });

  // -- RVCC (no buckets): max count enforcement --

  it('RVCC: disallows adding when pickCount is already reached', () => {
    const result = canAddGolfer('g8', SEVEN_UNIQUE, MOCK_AVAILABLE_GOLFERS, rvccConfig, null);
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/maximum of 7/i);
  });

  it('RVCC: allows adding when fewer than pickCount are selected', () => {
    const result = canAddGolfer('g8', ['g1', 'g2', 'g3'], MOCK_AVAILABLE_GOLFERS, rvccConfig, null);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('RVCC: allows adding the 7th (last allowed) golfer', () => {
    const sixSelected = SEVEN_UNIQUE.slice(0, 6); // 6 golfers
    const result = canAddGolfer('g8', sixSelected, MOCK_AVAILABLE_GOLFERS, rvccConfig, null);
    expect(result.allowed).toBe(true);
  });

  // -- Crestmont (buckets): bucket collision enforcement --

  it('Crestmont: disallows adding when bucket is already used', () => {
    // g1 is in bucket 0; try to add g2 (also bucket 0)
    const result = canAddGolfer(
      'g2',
      ['g1', 'g5', 'g9'],
      MOCK_AVAILABLE_GOLFERS,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      0 // bucketIndex for g2
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/already selected a golfer from this bucket/i);
  });

  it('Crestmont: allows adding when golfer is from an unused bucket', () => {
    // Selected: g1 (bucket 0), g5 (bucket 1); adding g9 from bucket 2
    const result = canAddGolfer(
      'g9',
      ['g1', 'g5'],
      MOCK_AVAILABLE_GOLFERS,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      2 // bucketIndex for g9
    );
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('Crestmont: disallows adding when pickCount is reached even if no bucket collision', () => {
    // All 6 already selected; try to add from a notional 7th bucket
    const result = canAddGolfer(
      'g25',
      ONE_PER_BUCKET,
      MOCK_AVAILABLE_GOLFERS,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS,
      6 // hypothetical 7th bucket — no collision
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/maximum of 6/i);
  });

  it('Crestmont: allows adding when bucket check is skipped (no bucketIndex arg)', () => {
    // With no golferBucketIndex passed, bucket collision check is skipped
    const result = canAddGolfer(
      'g3',
      ['g1'],
      MOCK_AVAILABLE_GOLFERS,
      crestmontConfig,
      MOCK_GOLFER_BUCKETS
      // no golferBucketIndex
    );
    expect(result.allowed).toBe(true);
  });

  it('returns reason as undefined when addition is allowed', () => {
    const result = canAddGolfer('g8', [], MOCK_AVAILABLE_GOLFERS, rvccConfig, null);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});
