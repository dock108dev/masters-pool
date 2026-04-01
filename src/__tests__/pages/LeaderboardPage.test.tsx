import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { LeaderboardPage } from '../../pages/LeaderboardPage';
import { getClubConfig } from '../../config/clubs';

vi.mock('../../api/client', () => ({
  apiClient: new MockApiClient(0),
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderLeaderboardPage(clubConfig = rvccConfig, path = '/rvcc/leaderboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:club/leaderboard" element={<LeaderboardPage clubConfig={clubConfig} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LeaderboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-04-09T13:00:00Z'), shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows locked message before tournament starts', () => {
    vi.setSystemTime(new Date('2026-04-08T12:00:00Z'));
    renderLeaderboardPage();
    expect(screen.getByText(/leaderboard will be available/i)).toBeInTheDocument();
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
    renderLeaderboardPage(crestmontConfig, '/crestmont/leaderboard');
    expect(await screen.findByRole('heading', { name: /Crestmont Leaderboard/i })).toBeInTheDocument();
  });

  it('renders RVCC leaderboard entry names', async () => {
    renderLeaderboardPage();
    expect(await screen.findByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
  });

  it('renders Crestmont leaderboard entry names', async () => {
    renderLeaderboardPage(crestmontConfig, '/crestmont/leaderboard');
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument();
  });

  it('renders leaderboard table headers', async () => {
    renderLeaderboardPage();
    await screen.findByTestId('leaderboard-table');
    expect(screen.getByText('Pos')).toBeInTheDocument();
    expect(screen.getByText('Entry')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });
});
