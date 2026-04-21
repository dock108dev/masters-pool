import { describe, it, expect, beforeEach } from 'vitest';
import { MockApiClient } from '../../api/mock/adapters';
import { MOCK_RVCC_BILLING, MOCK_CRESTMONT_BILLING } from '../../api/mock/data';
import type { CreatePoolRequest } from '../../types/domain';

const BASE_CREATE_REQUEST: CreatePoolRequest = {
  club_code: 'rvcc',
  name: 'Test Pool',
  tournament_id: 101,
  entry_deadline: '2026-04-09T07:00:00Z',
  max_entries_per_email: 3,
  rules_json: {
    variant: 'rvcc',
    pick_count: 7,
    count_best: 5,
    min_cuts_to_qualify: 5,
    uses_buckets: false,
  },
};

// ---------------------------------------------------------------------------
// getClubBilling
// ---------------------------------------------------------------------------

describe('MockApiClient.getClubBilling', () => {
  let client: MockApiClient;

  beforeEach(() => {
    client = new MockApiClient(0);
  });

  it('returns trial billing for rvcc', async () => {
    const result = await client.getClubBilling('rvcc');
    expect(result).toEqual(MOCK_RVCC_BILLING);
    expect(result.billing_status).toBe('trial');
    expect(result.trial_used).toBe(false);
    expect(result.stripe_customer_id).toBeNull();
  });

  it('returns active billing for crestmont', async () => {
    const result = await client.getClubBilling('crestmont');
    expect(result).toEqual(MOCK_CRESTMONT_BILLING);
    expect(result.billing_status).toBe('active');
    expect(result.trial_used).toBe(true);
    expect(result.stripe_customer_id).toBe('cus_mock_crestmont');
    expect(result.next_invoice_date).toBe('2026-05-01');
  });

  it('returns a copy, not a reference to the mock fixture', async () => {
    const a = await client.getClubBilling('rvcc');
    const b = await client.getClubBilling('rvcc');
    expect(a).not.toBe(b);
  });
});

// ---------------------------------------------------------------------------
// createBillingPortalSession
// ---------------------------------------------------------------------------

describe('MockApiClient.createBillingPortalSession', () => {
  it('returns a URL', async () => {
    const client = new MockApiClient(0);
    const result = await client.createBillingPortalSession('rvcc');
    expect(result).toHaveProperty('url');
    expect(typeof result.url).toBe('string');
    expect(result.url.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// createPool — billing_required (trial_used=true, no active subscription)
// Integration test: pool creation with billing_required returns 402-coded error
// ---------------------------------------------------------------------------

describe('MockApiClient.createPool — billing_required', () => {
  it('throws billing_required error (status 402) when billingRequired=true', async () => {
    const client = new MockApiClient(0, [], [], null, true);

    await expect(client.createPool(BASE_CREATE_REQUEST)).rejects.toMatchObject({
      code: 'billing_required',
      status: 402,
    });
  });

  it('error message mentions subscription requirement', async () => {
    const client = new MockApiClient(0, [], [], null, true);
    let caughtError: unknown;
    try {
      await client.createPool(BASE_CREATE_REQUEST);
    } catch (err) {
      caughtError = err;
    }
    expect(caughtError).toBeDefined();
    expect((caughtError as Error).message).toMatch(/subscription/i);
  });

  it('succeeds normally when billingRequired=false (default)', async () => {
    const client = new MockApiClient(0);
    const result = await client.createPool(BASE_CREATE_REQUEST);
    expect(result).toMatchObject({ club_code: 'rvcc', name: 'Test Pool' });
  });
});
