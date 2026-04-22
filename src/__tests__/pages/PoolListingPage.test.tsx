import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { PoolListingPage } from '../../pages/PoolListingPage';
import { getClubConfig } from '../../config/clubs';
import type { PoolSummary } from '../../types/domain';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderPoolListing(_clubCode = 'rvcc', config = rvccConfig) {
  return render(
    <MemoryRouter initialEntries={['/admin/pools']}>
      <Routes>
        <Route path="/admin/pools/new" element={<div data-testid="wizard-page">Pool Wizard</div>} />
        <Route path="/admin/pools/:poolId" element={<div data-testid="dashboard-page">Dashboard</div>} />
        <Route path="/admin/pools" element={<PoolListingPage clubConfig={config} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PoolListingPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('renders all club pools', async () => {
    renderPoolListing('rvcc', rvccConfig);

    await waitFor(() => {
      expect(screen.getByTestId('pool-listing-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pool-card-1')).toBeInTheDocument();
    expect(screen.getByText('The Masters 2026 - RVCC Pool')).toBeInTheDocument();
  });

  it('shows pool name, format, entry count, lock time, and status badge', async () => {
    renderPoolListing('rvcc', rvccConfig);

    await waitFor(() => {
      expect(screen.getByTestId('pool-card-1')).toBeInTheDocument();
    });

    // Format: flat → "Flat"
    expect(screen.getByTestId('pool-format-1')).toHaveTextContent('Flat');

    // Entry count from mock (RVCC has 3)
    expect(screen.getByTestId('pool-entry-count-1')).toHaveTextContent('3');

    // Lock time rendered (just check it's present)
    expect(screen.getByTestId('pool-lock-time-1')).toBeInTheDocument();

    // Status badge — RVCC pool status is 'live' → badge shows "Live"
    expect(screen.getByTestId('pool-status-badge-1')).toHaveTextContent('Live');
  });

  it('shows Bucketed format for Crestmont pools', async () => {
    renderPoolListing('crestmont', crestmontConfig);

    await waitFor(() => {
      expect(screen.getByTestId('pool-card-2')).toBeInTheDocument();
    });

    expect(screen.getByTestId('pool-format-2')).toHaveTextContent('Bucketed');
  });

  it('renders status badge correctly for each pool status', async () => {
    const draftPool: PoolSummary = {
      id: 99,
      code: 'draft-pool',
      name: 'Draft Pool',
      club_code: 'rvcc',
      tournament_id: 101,
      status: 'draft',
      entry_deadline: '2026-04-09T07:00:00Z',
      max_entries_per_email: 1,
      scoring_enabled: false,
      rules_json: { variant: 'rvcc', pick_count: 7, count_best: 5, min_cuts_to_qualify: 5, uses_buckets: false },
      entry_count: 0,
    };

    vi.spyOn(activeClient, 'getClubPools').mockResolvedValue([draftPool]);
    renderPoolListing();

    await waitFor(() => {
      expect(screen.getByTestId('pool-status-badge-99')).toHaveTextContent('Draft');
    });
  });

  it('renders Create new pool button and navigates to wizard', async () => {
    renderPoolListing('rvcc', rvccConfig);

    await waitFor(() => {
      expect(screen.getByTestId('create-pool-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-pool-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('wizard-page')).toBeInTheDocument();
    });
  });

  it('navigates to coordinator dashboard when a pool card is clicked', async () => {
    renderPoolListing('rvcc', rvccConfig);

    await waitFor(() => {
      expect(screen.getByTestId('pool-card-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('pool-card-1'));
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });
  });

  it('renders EmptyState when MockApiClient returns an empty pool list', async () => {
    vi.spyOn(activeClient, 'getClubPools').mockResolvedValue([]);
    renderPoolListing('rvcc', rvccConfig);

    await waitFor(() => {
      expect(screen.getByTestId('no-pools')).toBeInTheDocument();
    });

    expect(screen.getByText('No pools yet')).toBeInTheDocument();
    expect(screen.getByTestId('create-first-pool-btn')).toBeInTheDocument();
  });

  it('Create your first pool CTA navigates to wizard from empty state', async () => {
    vi.spyOn(activeClient, 'getClubPools').mockResolvedValue([]);
    renderPoolListing('rvcc', rvccConfig);

    await waitFor(() => {
      expect(screen.getByTestId('create-first-pool-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-first-pool-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('wizard-page')).toBeInTheDocument();
    });
  });
});
