import { describe, it, expect } from 'vitest';
import {
  formatScore,
  formatGolferStatus,
  formatPosition,
  formatThru,
  formatLastUpdated,
  formatGolferCell,
} from '../../utils/formatting';
import type { GolferStatus } from '../../types/domain';

// ---------------------------------------------------------------------------
// formatScore
// ---------------------------------------------------------------------------
describe('formatScore', () => {
  it('returns "-" for null', () => {
    expect(formatScore(null)).toBe('-');
  });

  it('returns "E" for 0 (even par)', () => {
    expect(formatScore(0)).toBe('E');
  });

  it('returns "+N" for a positive score', () => {
    expect(formatScore(1)).toBe('+1');
    expect(formatScore(5)).toBe('+5');
    expect(formatScore(10)).toBe('+10');
  });

  it('returns "-N" (no prefix) for a negative score', () => {
    expect(formatScore(-1)).toBe('-1');
    expect(formatScore(-5)).toBe('-5');
    expect(formatScore(-10)).toBe('-10');
  });

  it('does not prepend "+" to negative numbers', () => {
    const result = formatScore(-3);
    expect(result.startsWith('+')).toBe(false);
  });

  it('does not return "E" for non-zero values', () => {
    expect(formatScore(1)).not.toBe('E');
    expect(formatScore(-1)).not.toBe('E');
  });
});

// ---------------------------------------------------------------------------
// formatGolferStatus
// ---------------------------------------------------------------------------
describe('formatGolferStatus', () => {
  it('returns an empty string for "active" status', () => {
    expect(formatGolferStatus('active')).toBe('');
  });

  it('returns "CUT" for "cut" status', () => {
    expect(formatGolferStatus('cut')).toBe('CUT');
  });

  it('returns "WD" for "wd" status (withdrawal)', () => {
    expect(formatGolferStatus('wd')).toBe('WD');
  });

  it('returns "DQ" for "dq" status (disqualification)', () => {
    expect(formatGolferStatus('dq')).toBe('DQ');
  });

  it('covers all four GolferStatus values', () => {
    const statuses: GolferStatus[] = ['active', 'cut', 'wd', 'dq'];
    const results = statuses.map(formatGolferStatus);
    expect(results).toEqual(['', 'CUT', 'WD', 'DQ']);
  });
});

// ---------------------------------------------------------------------------
// formatPosition
// ---------------------------------------------------------------------------
describe('formatPosition', () => {
  it('returns "-" for null position', () => {
    expect(formatPosition(null)).toBe('-');
  });

  it('returns the number as a string for a valid position', () => {
    expect(formatPosition(1)).toBe('1');
    expect(formatPosition(10)).toBe('10');
    expect(formatPosition(42)).toBe('42');
  });

  it('returns "0" for position 0', () => {
    expect(formatPosition(0)).toBe('0');
  });

  it('returns a string type, not a number', () => {
    const result = formatPosition(5);
    expect(typeof result).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// formatThru
// ---------------------------------------------------------------------------
describe('formatThru', () => {
  it('returns "-" for null', () => {
    expect(formatThru(null)).toBe('-');
  });

  it('returns "F" for 18 (finished)', () => {
    expect(formatThru(18)).toBe('F');
  });

  it('returns the number as a string for holes 1–17', () => {
    expect(formatThru(1)).toBe('1');
    expect(formatThru(9)).toBe('9');
    expect(formatThru(17)).toBe('17');
  });

  it('returns a string type, not a number', () => {
    expect(typeof formatThru(9)).toBe('string');
  });

  it('returns "0" for 0 holes completed', () => {
    expect(formatThru(0)).toBe('0');
  });
});

// ---------------------------------------------------------------------------
// formatLastUpdated
// ---------------------------------------------------------------------------
describe('formatLastUpdated', () => {
  it('formats a known ISO string to a human-readable locale string', () => {
    const result = formatLastUpdated('2026-04-10T14:30:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the month abbreviation in the output', () => {
    const result = formatLastUpdated('2026-04-10T14:30:00Z');
    expect(result).toMatch(/apr/i);
  });

  it('includes the day of the month in the output', () => {
    const result = formatLastUpdated('2026-04-10T14:30:00Z');
    expect(result).toMatch(/10/);
  });

  it('includes AM or PM because hour12 is true', () => {
    const result = formatLastUpdated('2026-04-10T14:30:00Z');
    expect(result).toMatch(/am|pm/i);
  });

  it('includes minutes (":30") in the output', () => {
    const result = formatLastUpdated('2026-04-10T14:30:00Z');
    expect(result).toMatch(/:30/);
  });

  it('handles midnight correctly without throwing', () => {
    expect(() => formatLastUpdated('2026-01-01T00:00:00Z')).not.toThrow();
  });

  it('handles end-of-year dates without throwing', () => {
    expect(() => formatLastUpdated('2026-12-31T23:59:59Z')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// formatGolferCell
// Signature: (golferName: string, score: number | null, thru: number | null, status: GolferStatus)
// ---------------------------------------------------------------------------
describe('formatGolferCell', () => {
  const name = 'Scottie Scheffler';

  it('formats an active golfer with negative score and finished thru', () => {
    // score -5, thru 18 → "F"
    const result = formatGolferCell(name, -5, 18, 'active');
    expect(result).toBe('Scottie Scheffler (-5 / F)');
  });

  it('formats an active golfer with a positive score and mid-round thru', () => {
    const result = formatGolferCell(name, 2, 14, 'active');
    expect(result).toBe('Scottie Scheffler (+2 / 14)');
  });

  it('formats an active golfer with even-par score', () => {
    const result = formatGolferCell('Tiger Woods', 0, 18, 'active');
    expect(result).toBe('Tiger Woods (E / F)');
  });

  it('formats an active golfer with null score and null thru', () => {
    const result = formatGolferCell(name, null, null, 'active');
    expect(result).toBe('Scottie Scheffler (- / -)');
  });

  it('returns "Name (CUT)" for a cut golfer, ignoring score/thru', () => {
    const result = formatGolferCell(name, -3, 18, 'cut');
    expect(result).toBe('Scottie Scheffler (CUT)');
  });

  it('returns "Name (WD)" for a withdrawn golfer, ignoring score/thru', () => {
    const result = formatGolferCell(name, 1, null, 'wd');
    expect(result).toBe('Scottie Scheffler (WD)');
  });

  it('returns "Name (DQ)" for a disqualified golfer, ignoring score/thru', () => {
    const result = formatGolferCell(name, null, null, 'dq');
    expect(result).toBe('Scottie Scheffler (DQ)');
  });

  it('does not leak score/thru into cut/wd/dq output', () => {
    expect(formatGolferCell(name, -3, 9, 'cut')).not.toContain('-3');
    expect(formatGolferCell(name, 1, 18, 'wd')).not.toContain('+1');
    expect(formatGolferCell(name, 0, 18, 'dq')).not.toContain('/ F');
  });

  it('always contains the golfer name', () => {
    const statuses: GolferStatus[] = ['active', 'cut', 'wd', 'dq'];
    for (const status of statuses) {
      expect(formatGolferCell(name, 0, 18, status)).toContain(name);
    }
  });

  it('separates score and thru with " / " for active status', () => {
    const result = formatGolferCell('Tiger Woods', 0, 18, 'active');
    expect(result).toBe('Tiger Woods (E / F)');
  });
});
