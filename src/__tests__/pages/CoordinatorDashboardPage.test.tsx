import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { CoordinatorDashboardPage } from '../../pages/CoordinatorDashboardPage';
import { getClubConfig } from '../../config/clubs';
import { MOCK_SUSPENDED_BILLING, MOCK_RVCC_POOL } from '../../api/mock/data';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const rvccConfig = getClubConfig('rvcc');

function renderDashboard(poolId = 1) {
  return render(
    <MemoryRouter initialEntries={[`/admin/pools/${poolId}`]}>
      <Routes>
        <Route
          path="/admin/pools/:poolId"
          element={<CoordinatorDashboardPage clubConfig={rvccConfig} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CoordinatorDashboardPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    // Ensure createObjectURL and revokeObjectURL are available in jsdom
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('renders the dashboard with all entries for an org:admin coordinator', async () => {
    renderDashboard(1);

    await waitFor(() => {
      expect(screen.getByTestId('coordinator-dashboard')).toBeInTheDocument();
    });

    // Entry count heading
    expect(screen.getByText(/Entries \(3\)/i)).toBeInTheDocument();

    // All three mock entries should be visible
    expect(screen.getByTestId('entry-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('entry-row-2')).toBeInTheDocument();
    expect(screen.getByTestId('entry-row-3')).toBeInTheDocument();

    // Entry names
    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();

    // Anonymous email fallback (Bob Wilson has null email)
    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('renders picks in flat (pick_slot) order for RVCC pools', async () => {
    renderDashboard(1);

    await waitFor(() => screen.getByTestId('entry-row-1'));

    // John Smith's picks should be in pick_slot order
    const row = screen.getByTestId('entry-row-1');
    const picksCell = row.querySelectorAll('td')[3];
    expect(picksCell.textContent).toContain('Scottie Scheffler');
    // Scheffler (slot 1) should appear before McIlroy (slot 2)
    const schefflerIdx = picksCell.textContent!.indexOf('Scottie Scheffler');
    const mcilroyIdx = picksCell.textContent!.indexOf('Rory McIlroy');
    expect(schefflerIdx).toBeLessThan(mcilroyIdx);
  });

  it('shows the Download CSV button', async () => {
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('download-csv-btn'));
    expect(screen.getByTestId('download-csv-btn')).toBeInTheDocument();
  });

  it('calls downloadPoolEntriesCsv with the correct pool id when CSV button is clicked', async () => {
    const csvSpy = vi.spyOn(activeClient, 'downloadPoolEntriesCsv');
    renderDashboard(1);

    await waitFor(() => screen.getByTestId('download-csv-btn'));

    fireEvent.click(screen.getByTestId('download-csv-btn'));

    await waitFor(() => {
      expect(csvSpy).toHaveBeenCalledWith(1);
    });
  });

  it('uses pool name in download filename', async () => {
    const anchors: HTMLAnchorElement[] = [];
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreate(tag) as HTMLElement;
      if (tag === 'a') anchors.push(el as HTMLAnchorElement);
      return el;
    });

    renderDashboard(1);
    await waitFor(() => screen.getByTestId('download-csv-btn'));
    fireEvent.click(screen.getByTestId('download-csv-btn'));

    await waitFor(() => anchors.some((a) => a.download !== ''));
    const downloadAnchor = anchors.find((a) => a.download !== '');
    expect(downloadAnchor?.download).toBe('the-masters-2026-rvcc-pool-entries.csv');

    vi.restoreAllMocks();
  });

  it('shows loading state on button while download is in progress', async () => {
    let resolve!: (b: Blob) => void;
    vi.spyOn(activeClient, 'downloadPoolEntriesCsv').mockReturnValue(
      new Promise<Blob>((res) => { resolve = res; }),
    );

    renderDashboard(1);
    await waitFor(() => screen.getByTestId('download-csv-btn'));

    fireEvent.click(screen.getByTestId('download-csv-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('download-csv-btn')).toBeDisabled();
      expect(screen.getByTestId('download-csv-btn')).toHaveTextContent('Downloading…');
    });

    await act(async () => { resolve(new Blob(['a,b'], { type: 'text/csv' })); });

    await waitFor(() => {
      expect(screen.getByTestId('download-csv-btn')).not.toBeDisabled();
      expect(screen.getByTestId('download-csv-btn')).toHaveTextContent('Download CSV');
    });
  });

  it('shows inline error message when CSV download fails', async () => {
    vi.spyOn(activeClient, 'downloadPoolEntriesCsv').mockRejectedValue(new Error('network error'));

    renderDashboard(1);
    await waitFor(() => screen.getByTestId('download-csv-btn'));

    fireEvent.click(screen.getByTestId('download-csv-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('csv-error')).toBeInTheDocument();
      expect(screen.getByTestId('csv-error')).toHaveTextContent('Failed to download CSV');
    });

    expect(screen.getByTestId('download-csv-btn')).not.toBeDisabled();
  });

  it('shows event log section', async () => {
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('event-log-section'));
    expect(screen.getByText('Event Log')).toBeInTheDocument();
    // No events configured in default mock, so shows empty state
    expect(screen.getByText('No events recorded.')).toBeInTheDocument();
  });

  it('shows events in reverse-chronological order when events are present', async () => {
    const mockEvents = [
      {
        id: 1,
        pool_id: 1,
        event_type: 'pool_published' as const,
        actor_id: 'user_1',
        payload: {},
        created_at: '2026-04-07T09:00:00Z',
      },
      {
        id: 2,
        pool_id: 1,
        event_type: 'entry_submitted' as const,
        actor_id: null,
        payload: {},
        created_at: '2026-04-08T10:00:00Z',
      },
      {
        id: 3,
        pool_id: 1,
        event_type: 'pool_locked' as const,
        actor_id: 'user_1',
        payload: {},
        created_at: '2026-04-09T11:00:00Z',
      },
    ];
    activeClient = new MockApiClient(0, [], mockEvents);

    renderDashboard(1);
    await waitFor(() => screen.getByTestId('event-log'));

    const items = screen.getAllByRole('listitem');
    // Reversed: pool_locked first, entry_submitted second, pool_published last
    expect(items[0].textContent).toContain('Pool locked');
    expect(items[1].textContent).toContain('Entry submitted');
    expect(items[2].textContent).toContain('Pool published');
  });
});

describe('CoordinatorDashboardPage — billing section', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('shows billing section with Trial badge for RVCC (default mock)', async () => {
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('billing-section'));
    expect(screen.getByTestId('billing-badge')).toHaveTextContent('Trial');
    expect(screen.getByTestId('trial-info')).toBeInTheDocument();
    expect(screen.getByTestId('billing-upgrade-btn')).toBeInTheDocument();
  });

  it('shows billing section with Active badge and next invoice date for Crestmont', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/pools/2']}>
        <Routes>
          <Route
            path="/admin/pools/:poolId"
            element={<CoordinatorDashboardPage clubConfig={getClubConfig('crestmont')} />}
          />
        </Routes>
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByTestId('billing-badge'));
    expect(screen.getByTestId('billing-badge')).toHaveTextContent('Active');
    expect(screen.getByTestId('next-invoice-date')).toBeInTheDocument();
    expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
  });

  it('shows Suspended badge and manage billing button for suspended club', async () => {
    vi.spyOn(activeClient, 'getClubBilling').mockResolvedValue({ ...MOCK_SUSPENDED_BILLING });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('billing-badge'));
    expect(screen.getByTestId('billing-badge')).toHaveTextContent('Suspended');
    expect(screen.getByTestId('suspended-info')).toBeInTheDocument();
    expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
  });

  it('opens billing portal when Manage billing is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/pools/2']}>
        <Routes>
          <Route
            path="/admin/pools/:poolId"
            element={<CoordinatorDashboardPage clubConfig={getClubConfig('crestmont')} />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const portalSpy = vi.spyOn(activeClient, 'createBillingPortalSession').mockResolvedValue({
      url: 'https://billing.stripe.com/session/test',
    });
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    await waitFor(() => screen.getByTestId('manage-billing-btn'));
    fireEvent.click(screen.getByTestId('manage-billing-btn'));

    await waitFor(() => {
      expect(portalSpy).toHaveBeenCalledWith('crestmont');
      expect(openSpy).toHaveBeenCalledWith(
        'https://billing.stripe.com/session/test',
        '_blank',
        'noopener,noreferrer',
      );
    });
  });
});

describe('CoordinatorDashboardPage — pool status card', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it.each([
    ['draft', 'Draft'],
    ['open', 'Open'],
    ['locked', 'Locked'],
    ['live', 'Live'],
  ] as const)('shows %s badge for pool with status %s', async (status, label) => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('pool-status-badge'));
    expect(screen.getByTestId('pool-status-badge')).toHaveTextContent(label);
  });

  it('shows entry count in status card', async () => {
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('pool-entry-count'));
    expect(screen.getByTestId('pool-entry-count')).toHaveTextContent('3 entries');
  });

  it('shows deadline in status card', async () => {
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('pool-deadline'));
    // deadline is in the past for MOCK_RVCC_POOL (2026-04-09), today is 2026-04-21
    expect(screen.getByTestId('pool-deadline')).toHaveTextContent('Deadline passed');
  });
});

describe('CoordinatorDashboardPage — lock/unlock pool', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('shows Lock Pool button when pool is open', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'open' });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('lock-pool-btn'));
    expect(screen.queryByTestId('unlock-pool-btn')).not.toBeInTheDocument();
  });

  it('shows Lock Pool button when pool is draft', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'draft' });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('lock-pool-btn'));
    expect(screen.queryByTestId('unlock-pool-btn')).not.toBeInTheDocument();
  });

  it('shows Unlock Pool button when pool is locked', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'locked' });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('unlock-pool-btn'));
    expect(screen.queryByTestId('lock-pool-btn')).not.toBeInTheDocument();
  });

  it('shows neither Lock nor Unlock when pool is live', async () => {
    // MOCK_RVCC_POOL is already live
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('actions-bar'));
    expect(screen.queryByTestId('lock-pool-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('unlock-pool-btn')).not.toBeInTheDocument();
  });

  it('shows confirmation modal with entry count when Lock Pool is clicked', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'open' });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('lock-pool-btn'));

    fireEvent.click(screen.getByTestId('lock-pool-btn'));

    expect(screen.getByTestId('lock-confirm-modal')).toBeInTheDocument();
    // RVCC has 3 entries — modal should show that count
    expect(screen.getByTestId('lock-confirm-modal')).toHaveTextContent('3');
  });

  it('calls lockPool and refetches on confirmation', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'open' });
    const lockSpy = vi.spyOn(activeClient, 'lockPool').mockResolvedValue({
      ...MOCK_RVCC_POOL,
      status: 'locked',
    });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('lock-pool-btn'));

    fireEvent.click(screen.getByTestId('lock-pool-btn'));
    await waitFor(() => screen.getByTestId('lock-confirm-modal'));
    fireEvent.click(screen.getByTestId('confirm-lock-btn'));

    await waitFor(() => {
      expect(lockSpy).toHaveBeenCalledWith(1);
    });
  });

  it('dismisses modal without locking when Cancel is clicked', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'open' });
    const lockSpy = vi.spyOn(activeClient, 'lockPool');
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('lock-pool-btn'));

    fireEvent.click(screen.getByTestId('lock-pool-btn'));
    expect(screen.getByTestId('lock-confirm-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-lock-btn'));
    expect(screen.queryByTestId('lock-confirm-modal')).not.toBeInTheDocument();
    expect(lockSpy).not.toHaveBeenCalled();
  });

  it('calls unlockPool when Unlock Pool is clicked', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'locked' });
    const unlockSpy = vi.spyOn(activeClient, 'unlockPool').mockResolvedValue({
      ...MOCK_RVCC_POOL,
      status: 'open',
    });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('unlock-pool-btn'));

    fireEvent.click(screen.getByTestId('unlock-pool-btn'));

    await waitFor(() => {
      expect(unlockSpy).toHaveBeenCalledWith(1);
    });
  });
});

describe('CoordinatorDashboardPage — entries empty state', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('shows empty state when pool has no entries', async () => {
    vi.spyOn(activeClient, 'getPoolEntries').mockResolvedValue({
      pool_id: 1,
      entries: [],
      count: 0,
    });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('entries-empty-state'));
    expect(screen.getByTestId('entries-empty-state')).toHaveTextContent('No entries yet.');
    expect(screen.queryByTestId('entries-table')).not.toBeInTheDocument();
  });
});

describe('CoordinatorDashboardPage — leaderboard polling', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('fetches leaderboard when pool is live', async () => {
    const leaderboardSpy = vi.spyOn(activeClient, 'getLeaderboard');
    renderDashboard(1); // MOCK_RVCC_POOL is live
    await waitFor(() => {
      expect(leaderboardSpy).toHaveBeenCalledWith(1);
    });
  });

  it('does not fetch leaderboard when pool is not live', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'open' });
    const leaderboardSpy = vi.spyOn(activeClient, 'getLeaderboard');
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('pool-status-badge'));
    expect(screen.getByTestId('pool-status-badge')).toHaveTextContent('Open');
    expect(leaderboardSpy).not.toHaveBeenCalled();
  });

  it('shows score column in entries table when pool is live', async () => {
    renderDashboard(1); // live pool
    await waitFor(() => screen.getByTestId('entries-table'));
    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toContain('Score');
  });

  it('does not show score column when pool is not live', async () => {
    vi.spyOn(activeClient, 'getPoolDetail').mockResolvedValue({ ...MOCK_RVCC_POOL, status: 'open' });
    renderDashboard(1);
    await waitFor(() => screen.getByTestId('entries-table'));
    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).not.toContain('Score');
  });

  it('polls leaderboard every 60s when pool is live', async () => {
    vi.useFakeTimers();
    const leaderboardSpy = vi.spyOn(activeClient, 'getLeaderboard');

    renderDashboard(1);

    // Let initial async fetches settle
    await act(async () => {
      vi.runAllTimers();
      await Promise.resolve();
    });

    const callCountAfterMount = leaderboardSpy.mock.calls.length;
    expect(callCountAfterMount).toBeGreaterThanOrEqual(1);

    // Advance by 60 seconds to trigger one polling cycle
    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await Promise.resolve();
    });

    expect(leaderboardSpy.mock.calls.length).toBeGreaterThan(callCountAfterMount);

    vi.useRealTimers();
  });
});

