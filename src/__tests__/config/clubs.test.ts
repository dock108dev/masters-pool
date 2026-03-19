import { describe, it, expect } from 'vitest';
import { CLUB_CONFIGS, getClubConfig, isValidClubCode } from '../../config/clubs';
import type { ClubCode } from '../../types/domain';

// ---------------------------------------------------------------------------
// getClubConfig
// ---------------------------------------------------------------------------
describe('getClubConfig', () => {
  it('returns the RVCC config object for "rvcc"', () => {
    const config = getClubConfig('rvcc');
    expect(config).toBeDefined();
    expect(config.code).toBe('rvcc');
  });

  it('returns the same reference that lives in CLUB_CONFIGS for "rvcc"', () => {
    expect(getClubConfig('rvcc')).toBe(CLUB_CONFIGS.rvcc);
  });

  it('returns the Crestmont config object for "crestmont"', () => {
    const config = getClubConfig('crestmont');
    expect(config).toBeDefined();
    expect(config.code).toBe('crestmont');
  });

  it('returns the same reference that lives in CLUB_CONFIGS for "crestmont"', () => {
    expect(getClubConfig('crestmont')).toBe(CLUB_CONFIGS.crestmont);
  });

  it('each call with the same code returns the identical config', () => {
    expect(getClubConfig('rvcc')).toStrictEqual(getClubConfig('rvcc'));
    expect(getClubConfig('crestmont')).toStrictEqual(getClubConfig('crestmont'));
  });
});

// ---------------------------------------------------------------------------
// isValidClubCode
// ---------------------------------------------------------------------------
describe('isValidClubCode', () => {
  it('returns true for "rvcc"', () => {
    expect(isValidClubCode('rvcc')).toBe(true);
  });

  it('returns true for "crestmont"', () => {
    expect(isValidClubCode('crestmont')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidClubCode('')).toBe(false);
  });

  it('returns false for an unrecognised club code', () => {
    expect(isValidClubCode('unknown')).toBe(false);
  });

  it('returns false for a close-but-wrong spelling', () => {
    expect(isValidClubCode('RVCC')).toBe(false);   // case-sensitive
    expect(isValidClubCode('Crestmont')).toBe(false);
  });

  it('returns false for a numeric string', () => {
    expect(isValidClubCode('123')).toBe(false);
  });

  it('acts as a type guard — narrows string to ClubCode', () => {
    const code: string = 'rvcc';
    if (isValidClubCode(code)) {
      const cfg = getClubConfig(code as ClubCode);
      expect(cfg).toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// RVCC config shape
// ---------------------------------------------------------------------------
describe('RVCC club config', () => {
  const rvcc = CLUB_CONFIGS.rvcc;

  it('has code "rvcc"', () => {
    expect(rvcc.code).toBe('rvcc');
  });

  it('has the correct full name', () => {
    expect(rvcc.name).toBe('Raritan Valley Country Club');
  });

  it('has shortName "RVCC"', () => {
    expect(rvcc.shortName).toBe('RVCC');
  });

  it('has pickCount of 7', () => {
    expect(rvcc.pickCount).toBe(7);
  });

  it('has cutMinimum of 5', () => {
    expect(rvcc.cutMinimum).toBe(5);
  });

  it('has countedScores of 5', () => {
    expect(rvcc.countedScores).toBe(5);
  });

  it('has useBuckets set to false', () => {
    expect(rvcc.useBuckets).toBe(false);
  });

  it('does not define bucketLabels (no bucket system)', () => {
    expect(rvcc.bucketLabels).toBeUndefined();
  });

  it('does not have uploadEnabled property (file upload is admin-only)', () => {
    expect((rvcc as Record<string, unknown>).uploadEnabled).toBeUndefined();
  });

  it('does not have uploadRequired property (file upload is admin-only)', () => {
    expect((rvcc as Record<string, unknown>).uploadRequired).toBeUndefined();
  });

  it('has a non-empty rulesDescription array', () => {
    expect(Array.isArray(rvcc.rulesDescription)).toBe(true);
    expect(rvcc.rulesDescription.length).toBeGreaterThan(0);
  });

  it('rulesDescription entries are non-empty strings', () => {
    for (const rule of rvcc.rulesDescription) {
      expect(typeof rule).toBe('string');
      expect(rule.trim().length).toBeGreaterThan(0);
    }
  });

  it('mentions 7 golfers somewhere in the rules', () => {
    const joined = rvcc.rulesDescription.join(' ');
    expect(joined).toMatch(/7 golfer/i);
  });

  it('mentions 5 counted scores in the rules', () => {
    const joined = rvcc.rulesDescription.join(' ');
    expect(joined).toMatch(/5/);
  });
});

// ---------------------------------------------------------------------------
// Crestmont config shape
// ---------------------------------------------------------------------------
describe('Crestmont club config', () => {
  const crestmont = CLUB_CONFIGS.crestmont;

  it('has code "crestmont"', () => {
    expect(crestmont.code).toBe('crestmont');
  });

  it('has the correct full name', () => {
    expect(crestmont.name).toBe('Crestmont Country Club');
  });

  it('has shortName "Crestmont"', () => {
    expect(crestmont.shortName).toBe('Crestmont');
  });

  it('has pickCount of 6', () => {
    expect(crestmont.pickCount).toBe(6);
  });

  it('has cutMinimum of 4', () => {
    expect(crestmont.cutMinimum).toBe(4);
  });

  it('has countedScores of 4', () => {
    expect(crestmont.countedScores).toBe(4);
  });

  it('has useBuckets set to true', () => {
    expect(crestmont.useBuckets).toBe(true);
  });

  it('has exactly 6 bucketLabels', () => {
    expect(Array.isArray(crestmont.bucketLabels)).toBe(true);
    expect(crestmont.bucketLabels).toHaveLength(6);
  });

  it('bucketLabels are "Bucket A" through "Bucket F"', () => {
    expect(crestmont.bucketLabels).toEqual([
      'Bucket A',
      'Bucket B',
      'Bucket C',
      'Bucket D',
      'Bucket E',
      'Bucket F',
    ]);
  });

  it('does not have uploadEnabled property (file upload is admin-only)', () => {
    expect((crestmont as Record<string, unknown>).uploadEnabled).toBeUndefined();
  });

  it('does not have uploadRequired property (file upload is admin-only)', () => {
    expect((crestmont as Record<string, unknown>).uploadRequired).toBeUndefined();
  });

  it('has a non-empty rulesDescription array', () => {
    expect(Array.isArray(crestmont.rulesDescription)).toBe(true);
    expect(crestmont.rulesDescription.length).toBeGreaterThan(0);
  });

  it('rulesDescription entries are non-empty strings', () => {
    for (const rule of crestmont.rulesDescription) {
      expect(typeof rule).toBe('string');
      expect(rule.trim().length).toBeGreaterThan(0);
    }
  });

  it('mentions 6 buckets in the rules', () => {
    const joined = crestmont.rulesDescription.join(' ');
    expect(joined).toMatch(/6 bucket/i);
  });

  it('mentions 4 counted scores in the rules', () => {
    const joined = crestmont.rulesDescription.join(' ');
    expect(joined).toMatch(/4/);
  });
});

// ---------------------------------------------------------------------------
// Cross-config invariants
// ---------------------------------------------------------------------------
describe('CLUB_CONFIGS cross-config invariants', () => {
  it('CLUB_CONFIGS contains exactly two entries', () => {
    expect(Object.keys(CLUB_CONFIGS)).toHaveLength(2);
  });

  it('each config code matches its key in CLUB_CONFIGS', () => {
    for (const [key, config] of Object.entries(CLUB_CONFIGS)) {
      expect(config.code).toBe(key);
    }
  });

  it('pickCount equals the number of bucketLabels for Crestmont', () => {
    const c = CLUB_CONFIGS.crestmont;
    expect(c.bucketLabels).toHaveLength(c.pickCount);
  });

  it('cutMinimum is less than or equal to pickCount for both configs', () => {
    for (const config of Object.values(CLUB_CONFIGS)) {
      expect(config.cutMinimum).toBeLessThanOrEqual(config.pickCount);
    }
  });

  it('countedScores is less than or equal to cutMinimum for both configs', () => {
    for (const config of Object.values(CLUB_CONFIGS)) {
      expect(config.countedScores).toBeLessThanOrEqual(config.cutMinimum);
    }
  });

  it('all configs have non-empty name, shortName, and code', () => {
    for (const config of Object.values(CLUB_CONFIGS)) {
      expect(config.name.length).toBeGreaterThan(0);
      expect(config.shortName.length).toBeGreaterThan(0);
      expect(config.code.length).toBeGreaterThan(0);
    }
  });
});
