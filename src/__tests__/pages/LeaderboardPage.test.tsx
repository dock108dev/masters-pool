import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { LeaderboardPage } from '../../pages/LeaderboardPage';
import { getClubConfig } from '../../config/clubs';
import { MOCK_PRE_TOURNAMENT_RVCC_POOL, MOCK_EMPTY_LEADERBOARD, MOCK_RVCC_POOL } from '../../api/mock/data';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderLeaderboardPage(clubConfig = rvccConfig, path = '/leaderboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/leaderboard" element={<LeaderboardPage clubConfig={clubConfig} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LeaderboardPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers({ now: new Date('2026-04-09T13:00:00Z'), shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders loading state initially', () => {
    renderLeaderboardPage();
    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
  });

  it('renders leaderboard table after loading', async () => {
    renderLeaderboardPage();
    expect(await screen.findByTestId('leaderboard-table')).toBeInTheDocument();
  });

  it('shows club short name in heading for RVCC', async () => {
    renderLeaderboardPage();
    expect(await screen.findByRole('heading', { name: /RVCC Leaderboard/i })).toBeInTheDocument();
  });

  it('shows club short name in heading for Crestmont', async () => {
    renderLeaderboardPage(crestmontConfig, '/leaderboard');
    expect(await screen.findByRole('heading', { name: /Crestmont Leaderboard/i })).toBeInTheDocument();
  });

  it('renders RVCC leaderboard entry names', async () => {
    renderLeaderboardPage();
    expect(await screen.findByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('renders Crestmont leaderboard entry names', async () => {
    renderLeaderboardPage(crestmontConfig, '/leaderboard');
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
  });

  it('renders leaderboard table headers', async () => {
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');
    expect(screen.getByText('Pos')).toBeInTheDocument();
    expect(screen.getByText('Entry')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('shows Last updated timestamp after data loads', async () => {
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');
    expect(screen.getByTestId('leaderboard-status')).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });

  it('does not show stale badge immediately after load', async () => {
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');
    expect(screen.queryByTestId('leaderboard-stale-badge')).not.toBeInTheDocument();
  });

  it('shows stale badge when data is older than 60 seconds', async () => {
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');

    // Future leaderboard fetches fail so lastUpdatedAt stays at load time
    vi.spyOn(activeClient, 'getLeaderboard').mockRejectedValue(new Error('fetch failed'));

    // Advance past stale threshold (60s) + stale check interval (10s)
    await act(async () => {
      vi.advanceTimersByTime(71_000);
    });

    expect(screen.getByTestId('leaderboard-stale-badge')).toBeInTheDocument();
    expect(screen.getByText('Data may be stale')).toBeInTheDocument();
  });

  it('shows pre-tournament banner when pool scoring is not enabled', async () => {
    vi.spyOn(activeClient, 'getActivePool').mockResolvedValue(MOCK_PRE_TOURNAMENT_RVCC_POOL);
    vi.spyOn(activeClient, 'getLeaderboard').mockResolvedValue(MOCK_EMPTY_LEADERBOARD);
    renderLeaderboardPage();
    expect(await screen.findByTestId('pre-tournament-banner')).toBeInTheDocument();
    expect(screen.getByText("Tournament hasn't started yet")).toBeInTheDocument();
  });

  it('shows error banner after 3 consecutive fetch failures', async () => {
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');

    vi.spyOn(activeClient, 'getLeaderboard').mockRejectedValue(new Error('network error'));

    // 3 poll intervals at 60s each = 181s to trigger 3 failures
    await act(async () => {
      vi.advanceTimersByTime(181_000);
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Unable to update/i)).toBeInTheDocument();
    // Leaderboard data still visible
    expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
  });

  it('polls leaderboard every 60s when pool status is live', async () => {
    const spy = vi.spyOn(activeClient, 'getLeaderboard');
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');
    const callsAfterLoad = spy.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });

    expect(spy.mock.calls.length).toBe(callsAfterLoad + 1);
  });

  it('does not poll when pool status is not live', async () => {
    vi.spyOn(activeClient, 'getActivePool').mockResolvedValue({
      ...MOCK_RVCC_POOL,
      status: 'final',
    });
    const spy = vi.spyOn(activeClient, 'getLeaderboard');
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');
    const callsAfterLoad = spy.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(61_000);
    });

    expect(spy.mock.calls.length).toBe(callsAfterLoad);
  });

  it('shows scores-not-available when leaderboard data cannot be fetched', async () => {
    vi.spyOn(activeClient, 'getLeaderboard').mockRejectedValue(new Error('no data'));
    renderLeaderboardPage();
    expect(await screen.findByTestId('scores-not-available')).toBeInTheDocument();
    expect(screen.getByText(/Scores not yet available/i)).toBeInTheDocument();
  });
});
