import { describe, it, expect } from 'vitest';
import {
  formatScore,
  formatThru,
  formatLastUpdated,
} from '../../utils/formatting';

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

