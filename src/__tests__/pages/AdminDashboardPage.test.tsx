import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockApiClient } from '../../api/mock/adapters';
import { AdminDashboard } from '../../pages/AdminDashboard';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

describe('AdminDashboard', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('renders the dashboard with platform stats', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('stat-total-pools')).toBeInTheDocument();
    expect(screen.getByTestId('stat-total-entries')).toBeInTheDocument();
    expect(screen.getByTestId('stat-active-clubs')).toBeInTheDocument();
    expect(screen.getByTestId('stat-mrr')).toBeInTheDocument();
  });

  it('renders MRR as "$0" when Stripe returns an empty invoice list (mrr_cents = 0)', async () => {
    vi.spyOn(activeClient, 'getAdminStats').mockResolvedValue({
      total_pools: 0,
      total_entries: 0,
      active_clubs: 0,
      mrr_cents: 0,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('mrr-value')).toHaveTextContent('$0');
    });
  });

  it('renders MRR correctly for non-zero value', async () => {
    vi.spyOn(activeClient, 'getAdminStats').mockResolvedValue({
      total_pools: 2,
      total_entries: 45,
      active_clubs: 2,
      mrr_cents: 19900,
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('mrr-value')).toHaveTextContent('$199');
    });
  });

  it('renders poll health rows for active tournaments', async () => {
    render(<AdminDashboard />);

    await waitFor(() => {
      const rows = screen.getAllByTestId('poll-health-row');
      expect(rows).toHaveLength(2);
    });
  });

  it('shows STALE status and stale indicator when poll health is stale', async () => {
    vi.spyOn(activeClient, 'getPollHealth').mockResolvedValue({
      tournaments: [
        {
          pool_id: 1,
          pool_name: 'Test Pool',
          tournament_name: 'The Masters 2026',
          last_polled_at: '2026-04-13T13:00:00Z',
          is_in_window: true,
          is_stale: true,
        },
      ],
      checked_at: '2026-04-13T14:27:00Z',
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('poll-health-stale')).toBeInTheDocument();
      expect(screen.getByTestId('poll-health-stale')).toHaveTextContent('STALE');
    });
  });

  it('shows OFF-WINDOW status when not in tournament window', async () => {
    vi.spyOn(activeClient, 'getPollHealth').mockResolvedValue({
      tournaments: [
        {
          pool_id: 1,
          pool_name: 'Test Pool',
          tournament_name: 'The Masters 2026',
          last_polled_at: '2026-04-06T12:00:00Z',
          is_in_window: false,
          is_stale: false,
        },
      ],
      checked_at: '2026-04-06T12:05:00Z',
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('poll-health-ok')).toHaveTextContent('OFF-WINDOW');
    });
  });

  it('shows an error banner when stats fetch fails', async () => {
    vi.spyOn(activeClient, 'getAdminStats').mockRejectedValue(
      new Error('Network error'),
    );

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load stats');
    });
  });
});
