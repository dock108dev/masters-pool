import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { CoordinatorDashboardPage } from '../../pages/CoordinatorDashboardPage';
import { getClubConfig } from '../../config/clubs';
import { MOCK_SUSPENDED_BILLING } from '../../api/mock/data';

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

