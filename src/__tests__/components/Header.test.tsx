import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { Header } from '../../components/layout/Header';
import { CLUB_CONFIGS } from '../../config/clubs';

const rvccConfig = CLUB_CONFIGS['rvcc'];
const crestmontConfig = CLUB_CONFIGS['crestmont'];

function renderHeader(config: typeof rvccConfig) {
  return render(
    <MemoryRouter>
      <Header clubConfig={config} />
    </MemoryRouter>
  );
}

describe('Header', () => {
  it('renders club short name in title', () => {
    renderHeader(rvccConfig);
    expect(screen.getByText('RVCC Masters Pool')).toBeInTheDocument();
  });

  it('renders nav links with correct paths for RVCC (entries closed)', () => {
    renderHeader(rvccConfig);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Enter' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/leaderboard');
    expect(screen.queryByRole('link', { name: 'My Entries' })).not.toBeInTheDocument();
  });

  it('renders nav links with correct paths for Crestmont (no Enter or My Entries link)', () => {
    renderHeader(crestmontConfig);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('link', { name: 'Enter' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leaderboard' })).toHaveAttribute('href', '/leaderboard');
    expect(screen.queryByRole('link', { name: 'My Entries' })).not.toBeInTheDocument();
  });
});
