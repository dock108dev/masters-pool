import { describe, it, expect } from 'vitest';
import { classifyHost } from '../../config/host';

describe('classifyHost', () => {
  it('classifies the countryclubpicks apex as onboard', () => {
    expect(classifyHost('countryclubpicks.com')).toEqual({ kind: 'onboard' });
    expect(classifyHost('www.countryclubpicks.com')).toEqual({ kind: 'onboard' });
  });

  it('classifies bare localhost as onboard', () => {
    expect(classifyHost('localhost')).toEqual({ kind: 'onboard' });
    expect(classifyHost('127.0.0.1')).toEqual({ kind: 'onboard' });
  });

  it('classifies the legacy dock108.dev apex as onboard', () => {
    expect(classifyHost('dock108.dev')).toEqual({ kind: 'onboard' });
  });

  it('classifies onboard.* subdomains as onboard', () => {
    expect(classifyHost('onboard.countryclubpicks.com')).toEqual({ kind: 'onboard' });
    expect(classifyHost('onboard.localhost')).toEqual({ kind: 'onboard' });
    expect(classifyHost('onboard.dock108.dev')).toEqual({ kind: 'onboard' });
  });

  it('classifies admin.* subdomains as admin', () => {
    expect(classifyHost('admin.countryclubpicks.com')).toEqual({ kind: 'admin' });
    expect(classifyHost('admin.localhost')).toEqual({ kind: 'admin' });
    expect(classifyHost('admin.dock108.dev')).toEqual({ kind: 'admin' });
  });

  it('classifies club subdomains on both zones', () => {
    expect(classifyHost('rvcc.countryclubpicks.com')).toEqual({ kind: 'club', clubCode: 'rvcc' });
    expect(classifyHost('crestmont.countryclubpicks.com')).toEqual({ kind: 'club', clubCode: 'crestmont' });
    expect(classifyHost('rvcc.dock108.dev')).toEqual({ kind: 'club', clubCode: 'rvcc' });
    expect(classifyHost('crestmont.localhost')).toEqual({ kind: 'club', clubCode: 'crestmont' });
  });

  it('classifies unknown subdomains', () => {
    const result = classifyHost('gibberish.countryclubpicks.com');
    expect(result.kind).toBe('unknown');
    expect(result).toMatchObject({ subdomain: 'gibberish' });
  });

  it('is case-insensitive for subdomains', () => {
    expect(classifyHost('RVCC.countryclubpicks.com')).toEqual({ kind: 'club', clubCode: 'rvcc' });
    expect(classifyHost('ADMIN.countryclubpicks.com')).toEqual({ kind: 'admin' });
  });
});
