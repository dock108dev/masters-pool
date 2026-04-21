import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MockApiClient, MOCK_LOCKED_AT } from '../../api/mock/adapters';
import { LockCountdownWidget } from '../../components/layout/LockCountdownWidget';
import { MOCK_RVCC_POOL } from '../../api/mock/data';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const BASE_NOW = new Date('2026-04-01T12:00:00Z');

describe('LockCountdownWidget', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers({ now: BASE_NOW, shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders countdown matching 0:01:30 when lock_time is 90 seconds in the future', async () => {
    const lockTime = new Date(BASE_NOW.getTime() + 90_000).toISOString();
    vi.spyOn(activeClient, 'getLockStatus').mockResolvedValue({
      locked: false,
      locked_at: null,
      lock_time: lockTime,
    });

    render(<LockCountdownWidget poolId={MOCK_RVCC_POOL.id} />);

    expect(await screen.findByText(/0:01:30/)).toBeInTheDocument();
  });

  it('renders Pool Locked badge when locked=true', async () => {
    vi.spyOn(activeClient, 'getLockStatus').mockResolvedValue({
      locked: true,
      locked_at: MOCK_LOCKED_AT,
      lock_time: null,
    });

    render(<LockCountdownWidget poolId={MOCK_RVCC_POOL.id} />);

    expect(await screen.findByText(/Pool Locked/)).toBeInTheDocument();
  });

  it('renders Lock time TBD when lock_time is null and pool is not locked', async () => {
    vi.spyOn(activeClient, 'getLockStatus').mockResolvedValue({
      locked: false,
      locked_at: null,
      lock_time: null,
    });

    render(<LockCountdownWidget poolId={MOCK_RVCC_POOL.id} />);

    expect(await screen.findByText('Lock time TBD')).toBeInTheDocument();
  });

  it('renders Pool Locked when lock_time is already past', async () => {
    const pastTime = new Date(BASE_NOW.getTime() - 5_000).toISOString();
    vi.spyOn(activeClient, 'getLockStatus').mockResolvedValue({
      locked: false,
      locked_at: null,
      lock_time: pastTime,
    });

    render(<LockCountdownWidget poolId={MOCK_RVCC_POOL.id} />);

    expect(await screen.findByText(/Pool Locked/)).toBeInTheDocument();
  });

  it('countdown badge has correct test id', async () => {
    const lockTime = new Date(BASE_NOW.getTime() + 3600_000).toISOString();
    vi.spyOn(activeClient, 'getLockStatus').mockResolvedValue({
      locked: false,
      locked_at: null,
      lock_time: lockTime,
    });

    render(<LockCountdownWidget poolId={MOCK_RVCC_POOL.id} />);

    expect(await screen.findByTestId('lock-badge')).toBeInTheDocument();
  });

  it('renders nothing while data is loading', () => {
    // getLockStatus never resolves during the test (vi.useFakeTimers without advancing)
    vi.useRealTimers();
    vi.useFakeTimers({ now: BASE_NOW });
    vi.spyOn(activeClient, 'getLockStatus').mockImplementation(
      () => new Promise(() => {}),
    );

    render(<LockCountdownWidget poolId={MOCK_RVCC_POOL.id} />);

    expect(screen.queryByTestId('lock-badge')).not.toBeInTheDocument();
  });
});
