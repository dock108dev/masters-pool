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
    expect(screen.getByText('Loading pool...')).toBeInTheDocument();
  });

  it('renders RVCC club name in heading', async () => {
    renderHomePage();
    expect(await screen.findByRole('heading', { name: /RVCC Masters Pool/i })).toBeInTheDocument();
  });

  it('renders Crestmont club name in heading', async () => {
    renderHomePage(crestmontConfig, '/crestmont');
    expect(await screen.findByRole('heading', { name: /Crestmont Masters Pool/i })).toBeInTheDocument();
  });

  it('shows pool name after loading', async () => {
    renderHomePage();
    // MOCK_RVCC_POOL name
    expect(await screen.findByText(/The Masters 2026 - RVCC Pool/i)).toBeInTheDocument();
  });

  it('shows pool status after loading', async () => {
    renderHomePage();
    expect(await screen.findByText(/Status:\s*live/i)).toBeInTheDocument();
  });

  it('shows entry deadline after loading', async () => {
    renderHomePage();
    // entry_deadline: '2026-04-09T07:00:00Z' — rendered via toLocaleString
    expect(await screen.findByText(/Entry deadline:/i)).toBeInTheDocument();
  });

  it('renders Submit Entry link after loading', async () => {
    renderHomePage();
    expect(await screen.findByRole('link', { name: /Submit Entry/i })).toBeInTheDocument();
  });

  it('renders My Entries link after loading', async () => {
    renderHomePage();
    expect(await screen.findByRole('link', { name: /My Entries/i })).toBeInTheDocument();
  });

  it('renders rules section on home page', async () => {
    renderHomePage();
    expect(await screen.findByText(/How It Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Lowest Score Wins/i)).toBeInTheDocument();
  });

  it('shows Crestmont pool name after loading', async () => {
    renderHomePage(crestmontConfig, '/crestmont');
    expect(await screen.findByText(/The Masters 2026 - Crestmont Pool/i)).toBeInTheDocument();
  });
});
