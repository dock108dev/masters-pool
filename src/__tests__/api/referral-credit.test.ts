import { describe, it, expect, beforeEach } from 'vitest';
import { MockApiClient } from '../../api/mock/adapters';
import { MOCK_RVCC_REFERRAL, MOCK_CRESTMONT_REFERRAL } from '../../api/mock/data';

// ---------------------------------------------------------------------------
// getReferralInfo
// ---------------------------------------------------------------------------

describe('MockApiClient.getReferralInfo', () => {
  let client: MockApiClient;

  beforeEach(() => {
    client = new MockApiClient(0);
  });

  it('returns referral info for rvcc', async () => {
    const result = await client.getReferralInfo('rvcc');
    expect(result).toEqual(MOCK_RVCC_REFERRAL);
    expect(result.credit_balance).toBe(0);
    expect(typeof result.referral_url).toBe('string');
    expect(result.referral_url.length).toBeGreaterThan(0);
  });

  it('returns referral info for crestmont', async () => {
    const result = await client.getReferralInfo('crestmont');
    expect(result).toEqual(MOCK_CRESTMONT_REFERRAL);
    expect(result.credit_balance).toBe(1);
    expect(result.referred_clubs_count).toBe(1);
  });

  it('returns a copy, not a reference to the mock fixture', async () => {
    const a = await client.getReferralInfo('rvcc');
    const b = await client.getReferralInfo('rvcc');
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// applyReferralCredit — 400 when referred club has not completed a pool
// ---------------------------------------------------------------------------

describe('MockApiClient.applyReferralCredit — referred club incomplete', () => {
  it('returns 400 if the referred club has not completed a pool', async () => {
    const client = new MockApiClient(0, [], [], null, false, false);
    await expect(client.applyReferralCredit('ref-code', 'rvcc')).rejects.toMatchObject({
      status: 400,
    });
  });

  it('error message mentions incomplete pool', async () => {
    const client = new MockApiClient(0, [], [], null, false, false);
    let caught: unknown;
    try {
      await client.applyReferralCredit('ref-code', 'rvcc');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeDefined();
    expect((caught as Error).message).toMatch(/not completed/i);
  });

  it('error code is REFERRED_CLUB_INCOMPLETE', async () => {
    const client = new MockApiClient(0, [], [], null, false, false);
    await expect(client.applyReferralCredit('ref-code', 'rvcc')).rejects.toMatchObject({
      code: 'REFERRED_CLUB_INCOMPLETE',
    });
  });
});

// ---------------------------------------------------------------------------
// applyReferralCredit — 200 when referred club has completed a pool
// ---------------------------------------------------------------------------

describe('MockApiClient.applyReferralCredit — referred club completed', () => {
  it('returns updated credit balance when referred club has completed a pool', async () => {
    const client = new MockApiClient(0, [], [], null, false, true);
    const result = await client.applyReferralCredit('ref-code', 'rvcc');
    expect(result.credit_awarded).toBe(true);
    expect(result.credit_balance).toBeGreaterThan(0);
  });

  it('credit_awarded is true', async () => {
    const client = new MockApiClient(0, [], [], null, false, true);
    const result = await client.applyReferralCredit('ref-code', 'crestmont');
    expect(result.credit_awarded).toBe(true);
  });
});
