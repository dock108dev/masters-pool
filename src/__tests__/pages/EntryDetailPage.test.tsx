import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { EntryDetailPage } from '../../pages/EntryDetailPage';
import { getClubConfig } from '../../config/clubs';
import type { LeaderboardData, PoolSummary } from '../../types/domain';
import { MOCK_RVCC_POOL, MOCK_RVCC_LEADERBOARD } from '../../api/mock/data';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const rvccConfig = getClubConfig('rvcc');

function renderDetailPage(entryId: string | number) {
  const path = `/leaderboard/entry/${entryId}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/leaderboard/entry/:entryId"
          element={<EntryDetailPage clubConfig={rvccConfig} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('EntryDetailPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers({ now: new Date('2026-04-10T15:00:00Z'), shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows loading state initially', () => {
    renderDetailPage(1);
    expect(screen.getByText('Loading entry detail...')).toBeInTheDocument();
  });

  it('renders entry name as heading after loading', async () => {
    renderDetailPage(1);
    expect(await screen.findByRole('heading', { name: 'John Smith' })).toBeInTheDocument();
  });

  it('renders the picks table', async () => {
    renderDetailPage(1);
    expect(await screen.findByTestId('entry-detail-table')).toBeInTheDocument();
  });

  it('renders all golfer names for the entry', async () => {
    renderDetailPage(1);
    await screen.findByTestId('entry-detail-table');
    expect(screen.getByText('Scottie Scheffler')).toBeInTheDocument();
    expect(screen.getByText('Rory McIlroy')).toBeInTheDocument();
  });

  it('shows Active badge for active golfers', async () => {
    renderDetailPage(1);
    await screen.findByTestId('entry-detail-table');
    const activeBadges = screen.getAllByTestId('status-badge-active');
    expect(activeBadges.length).toBeGreaterThan(0);
  });

  it('shows Cut badge for golfers who missed the cut', async () => {
    renderDetailPage(1);
    await screen.findByTestId('entry-detail-table');
    expect(screen.getByTestId('status-badge-cut')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-cut')).toHaveTextContent('Cut');
  });

  it('renders scoring formula for RVCC pool', async () => {
    renderDetailPage(1);
    await screen.findByTestId('scoring-formula');
    expect(screen.getByTestId('scoring-formula')).toHaveTextContent(
      'Sum of best 5 scores from 7 picks',
    );
  });

  it('renders last updated timestamp', async () => {
    renderDetailPage(1);
    expect(await screen.findByTestId('entry-detail-updated')).toBeInTheDocument();
    expect(screen.getByTestId('entry-detail-updated')).toHaveTextContent('Last updated');
  });

  it('renders back link to leaderboard', async () => {
    renderDetailPage(1);
    await screen.findByRole('heading', { name: 'John Smith' });
    const backLink = screen.getByRole('link', { name: /back to leaderboard/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute('href', '/leaderboard');
  });

  // Acceptance criteria: entry with WD golfer renders WD badge and shows penalty in breakdown
  it('renders WD badge for a WD golfer', async () => {
    renderDetailPage(2);
    await screen.findByTestId('entry-detail-table');
    expect(screen.getByTestId('status-badge-wd')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-wd')).toHaveTextContent('WD');
  });

  it('shows WD penalty in scoring formula when pool has wd_score_penalty', async () => {
    const poolWithPenalty: PoolSummary = {
      ...MOCK_RVCC_POOL,
      rules_json: { ...MOCK_RVCC_POOL.rules_json, wd_score_penalty: 6 },
    };
    const wdLeaderboard: LeaderboardData = {
      ...MOCK_RVCC_LEADERBOARD,
      standings: [
        {
          ...MOCK_RVCC_LEADERBOARD.standings[1], // Jane Doe — has a WD pick
          picks: MOCK_RVCC_LEADERBOARD.standings[1].picks.map((p) =>
            p.status === 'wd' ? { ...p, total_score: 6 } : p,
          ),
        },
      ],
    };

    vi.spyOn(activeClient, 'getActivePool').mockResolvedValue(poolWithPenalty);
    vi.spyOn(activeClient, 'getLeaderboard').mockResolvedValue(wdLeaderboard);

    renderDetailPage(2);
    await screen.findByTestId('entry-detail-table');

    // WD badge visible
    expect(screen.getByTestId('status-badge-wd')).toBeInTheDocument();

    // Penalty shown in formula
    expect(screen.getByTestId('scoring-formula')).toHaveTextContent('WD penalty: +6');

    // Penalty score (+6) shown in the WD pick's total column
    const wdRow = screen.getByTestId('entry-pick-35533'); // Sahith Theegala dg_id
    expect(wdRow).toHaveTextContent('+6');
  });

  // Acceptance criteria: entry not found renders ErrorState, not a crash
  it('renders ErrorState when entryId does not exist', async () => {
    renderDetailPage(99999);
    expect(await screen.findByText(/Entry #99999 not found/i)).toBeInTheDocument();
  });

  it('renders ErrorState for non-numeric entryId', async () => {
    renderDetailPage('bogus');
    expect(await screen.findByText(/Entry #bogus not found/i)).toBeInTheDocument();
  });
});

describe('LeaderboardTable entry links', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers({ now: new Date('2026-04-10T15:00:00Z'), shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('leaderboard rows link to the entry detail page', async () => {
    const { LeaderboardPage } = await import('../../pages/LeaderboardPage');
    render(
      <MemoryRouter initialEntries={['/leaderboard']}>
        <Routes>
          <Route path="/leaderboard" element={<LeaderboardPage clubConfig={rvccConfig} />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByTestId('leaderboard-table');
    const johnLink = screen.getByRole('link', { name: 'John Smith' });
    expect(johnLink).toHaveAttribute('href', '/leaderboard/entry/1');
  });
});
