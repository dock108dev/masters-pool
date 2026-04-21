import { describe, it, expect } from 'vitest';
import { classifyHost } from '../../config/host';

describe('classifyHost', () => {
  it('classifies onboard subdomains', () => {
    expect(classifyHost('onboard.dock108.dev')).toEqual({ kind: 'onboard' });
    expect(classifyHost('onboard.localhost')).toEqual({ kind: 'onboard' });
  });

  it('classifies admin subdomains', () => {
    expect(classifyHost('admin.dock108.dev')).toEqual({ kind: 'admin' });
    expect(classifyHost('admin.localhost')).toEqual({ kind: 'admin' });
  });

  it('classifies club subdomains', () => {
    expect(classifyHost('rvcc.dock108.dev')).toEqual({ kind: 'club', clubCode: 'rvcc' });
    expect(classifyHost('crestmont.localhost')).toEqual({ kind: 'club', clubCode: 'crestmont' });
  });

  it('classifies bare localhost as apex', () => {
    expect(classifyHost('localhost')).toEqual({ kind: 'apex' });
    expect(classifyHost('127.0.0.1')).toEqual({ kind: 'apex' });
  });

  it('classifies bare dock108.dev as apex', () => {
    expect(classifyHost('dock108.dev')).toEqual({ kind: 'apex' });
  });

  it('classifies unknown subdomains', () => {
    const result = classifyHost('gibberish.dock108.dev');
    expect(result.kind).toBe('unknown');
    expect(result).toMatchObject({ subdomain: 'gibberish' });
  });

  it('is case-insensitive for subdomains', () => {
    expect(classifyHost('RVCC.dock108.dev')).toEqual({ kind: 'club', clubCode: 'rvcc' });
    expect(classifyHost('ONBOARD.localhost')).toEqual({ kind: 'onboard' });
  });
});
