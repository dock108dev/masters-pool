import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { HomePage } from '../../pages/HomePage';
import { getClubConfig } from '../../config/clubs';

vi.mock('../../api/client', () => ({
  apiClient: new MockApiClient(0),
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderHomePage(clubConfig = rvccConfig, path = '/rvcc') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:club" element={<HomePage clubConfig={clubConfig} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  it('renders loading state initially', () => {
    renderHomePage();
    expect(screen.getByText('Loading tournament...')).toBeInTheDocument();
  });

  it('renders RVCC club name in heading', async () => {
    renderHomePage();
    expect(await screen.findByRole('heading', { name: /RVCC Masters Pool/i })).toBeInTheDocument();
  });

  it('renders Crestmont club name in heading', async () => {
    renderHomePage(crestmontConfig, '/crestmont');
    expect(await screen.findByRole('heading', { name: /Crestmont Masters Pool/i })).toBeInTheDocument();
  });

  it('shows tournament name after loading', async () => {
    renderHomePage();
    // MOCK_RVCC_TOURNAMENT_DETAIL name
    expect(await screen.findByText(/The Masters 2026 - RVCC Pool/i)).toBeInTheDocument();
  });

  it('shows course name after loading', async () => {
    renderHomePage();
    expect(await screen.findByText('Augusta National Golf Club')).toBeInTheDocument();
  });

  it('shows tournament dates after loading', async () => {
    renderHomePage();
    expect(await screen.findByText(/2026-04-09/)).toBeInTheDocument();
    expect(screen.getByText(/2026-04-12/)).toBeInTheDocument();
  });

  it('shows tournament status after loading', async () => {
    renderHomePage();
    expect(await screen.findByText(/Status:\s*active/i)).toBeInTheDocument();
  });

  it('shows current round info when tournament is active', async () => {
    renderHomePage();
    // MOCK_RVCC_TOURNAMENT_DETAIL: currentRound=2, rounds=4
    expect(await screen.findByText(/Round 2 of 4/i)).toBeInTheDocument();
  });

  it('shows entries count after loading', async () => {
    renderHomePage();
    // MOCK_RVCC_TOURNAMENT_DETAIL: entriesCount=48
    expect(await screen.findByText(/48 entries submitted/i)).toBeInTheDocument();
  });

  it('renders Submit Entry link after loading', async () => {
    renderHomePage();
    expect(await screen.findByRole('link', { name: /Submit Entry/i })).toBeInTheDocument();
  });

  it('renders View Leaderboard link after loading', async () => {
    renderHomePage();
    expect(await screen.findByRole('link', { name: /View Leaderboard/i })).toBeInTheDocument();
  });

  it('renders How It Works link after loading', async () => {
    renderHomePage();
    expect(await screen.findByRole('link', { name: /How It Works/i })).toBeInTheDocument();
  });

  it('shows Crestmont tournament info after loading', async () => {
    renderHomePage(crestmontConfig, '/crestmont');
    expect(await screen.findByText(/The Masters 2026 - Crestmont Pool/i)).toBeInTheDocument();
    expect(screen.getByText(/36 entries submitted/i)).toBeInTheDocument();
  });
});
