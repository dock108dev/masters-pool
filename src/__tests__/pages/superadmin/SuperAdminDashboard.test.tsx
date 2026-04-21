import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockApiClient } from '../../../api/mock/adapters';
import { SuperAdminDashboard } from '../../../pages/superadmin/SuperAdminDashboard';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

describe('SuperAdminDashboard', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('renders the dashboard with platform stats', async () => {
    render(<SuperAdminDashboard />);
    await waitFor(() => {
      expect(screen.getByTestId('superadmin-dashboard')).toBeInTheDocument();
    });
    expect(screen.getByTestId('stat-total-pools')).toBeInTheDocument();
    expect(screen.getByTestId('stat-mrr')).toBeInTheDocument();
  });

  it('renders poll health rows for active tournaments', async () => {
    render(<SuperAdminDashboard />);
    await waitFor(() => {
      expect(screen.getAllByTestId('poll-health-row')).toHaveLength(2);
    });
  });

  it('shows an error banner when stats fetch fails', async () => {
    vi.spyOn(activeClient, 'getAdminStats').mockRejectedValue(new Error('Network error'));
    render(<SuperAdminDashboard />);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load stats');
    });
  });
});
