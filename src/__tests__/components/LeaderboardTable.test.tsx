import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { LeaderboardData, ClubConfig } from '../../types/domain';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';
import {
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
  MOCK_EMPTY_LEADERBOARD,
} from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';

const rvccConfig = CLUB_CONFIGS['rvcc'];
const crestmontConfig = CLUB_CONFIGS['crestmont'];

function renderTable(data: LeaderboardData, clubConfig: ClubConfig) {
  return render(
    <MemoryRouter>
      <LeaderboardTable data={data} clubConfig={clubConfig} />
    </MemoryRouter>,
  );
}

describe('LeaderboardTable snapshots', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('matches snapshot for RVCC leaderboard on a weekday (no status column)', () => {
    // Pin to a Monday so showStatus=false — deterministic snapshot regardless of run day
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-13T12:00:00Z')); // Monday
    const { container } = renderTable(MOCK_RVCC_LEADERBOARD, rvccConfig);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for empty leaderboard state', () => {
    const { container } = renderTable(MOCK_EMPTY_LEADERBOARD, rvccConfig);
    expect(container).toMatchSnapshot();
  });
});

describe('LeaderboardTable', () => {
  it('renders empty state when no entries', () => {
    const emptyData = { ...MOCK_RVCC_LEADERBOARD, standings: [] };
    renderTable(emptyData, rvccConfig);
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('renders EmptyState component (not a table) when standings array is empty', () => {
    renderTable(MOCK_EMPTY_LEADERBOARD, rvccConfig);
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
    expect(screen.queryByTestId('leaderboard-table')).not.toBeInTheDocument();
  });

  it('renders correct number of rows for RVCC leaderboard', () => {
    renderTable(MOCK_RVCC_LEADERBOARD, rvccConfig);
    const table = screen.getByTestId('leaderboard-table');
    const tbody = table.querySelector('tbody')!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows).toHaveLength(MOCK_RVCC_LEADERBOARD.standings.length);
  });

  it('renders 7 golfer columns for RVCC', () => {
    renderTable(MOCK_RVCC_LEADERBOARD, rvccConfig);
    const table = screen.getByTestId('leaderboard-table');
    const thead = table.querySelector('thead')!;
    const headerRow = within(thead).getAllByRole('columnheader');
    // Fixed columns (Pos, Entry, Total, Status when cut made) + 7 golfer columns
    const golferHeaders = headerRow.filter((th) => th.textContent?.startsWith('Golfer'));
    expect(golferHeaders).toHaveLength(7);
  });

  it('renders 6 golfer columns for Crestmont', () => {
    renderTable(MOCK_CRESTMONT_LEADERBOARD, crestmontConfig);
    const table = screen.getByTestId('leaderboard-table');
    const thead = table.querySelector('thead')!;
    const headerRow = within(thead).getAllByRole('columnheader');
    const golferHeaders = headerRow.filter((th) => th.textContent?.startsWith('Golfer'));
    expect(golferHeaders).toHaveLength(6);
  });

  it('shows last scored timestamp', () => {
    renderTable(MOCK_RVCC_LEADERBOARD, rvccConfig);
    // The component renders "Last scored: <formatted date>"
    expect(screen.getByText(/Last scored:/)).toBeInTheDocument();
  });

  it('shows qualification badge (Q/NQ) on weekends only', () => {
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    renderTable(MOCK_RVCC_LEADERBOARD, rvccConfig);
    if (isWeekend) {
      expect(screen.getAllByText('Q').length).toBeGreaterThan(0);
      expect(screen.getAllByText('NQ').length).toBeGreaterThan(0);
    } else {
      expect(screen.queryByText('NQ')).not.toBeInTheDocument();
    }
  });

  it('shows position and total score', () => {
    renderTable(MOCK_RVCC_LEADERBOARD, rvccConfig);
    // First entry: rank 1, aggregate_score -15
    expect(screen.getByText('-15')).toBeInTheDocument();
    // Check position cells exist
    const table = screen.getByTestId('leaderboard-table');
    const tbody = table.querySelector('tbody')!;
    const rows = within(tbody).getAllByRole('row');
    const firstRow = rows[0];
    expect(within(firstRow).getByText('1')).toBeInTheDocument();
    expect(within(firstRow).getByText('-15')).toBeInTheDocument();
  });
});
