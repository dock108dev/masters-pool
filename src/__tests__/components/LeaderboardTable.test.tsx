import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';
import {
  MOCK_RVCC_LEADERBOARD,
  MOCK_CRESTMONT_LEADERBOARD,
} from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';

const rvccConfig = CLUB_CONFIGS['rvcc'];
const crestmontConfig = CLUB_CONFIGS['crestmont'];

describe('LeaderboardTable', () => {
  it('renders empty state when no entries', () => {
    const emptyData = { ...MOCK_RVCC_LEADERBOARD, standings: [] };
    render(<LeaderboardTable data={emptyData} clubConfig={rvccConfig} />);
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('renders correct number of rows for RVCC leaderboard', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    const table = screen.getByTestId('leaderboard-table');
    const tbody = table.querySelector('tbody')!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows).toHaveLength(MOCK_RVCC_LEADERBOARD.standings.length);
  });

  it('renders 7 golfer columns for RVCC', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    const table = screen.getByTestId('leaderboard-table');
    const thead = table.querySelector('thead')!;
    const headerRow = within(thead).getAllByRole('columnheader');
    // Fixed columns (Pos, Entry, Total, Status when cut made) + 7 golfer columns
    const golferHeaders = headerRow.filter((th) => th.textContent?.startsWith('Golfer'));
    expect(golferHeaders).toHaveLength(7);
  });

  it('renders 6 golfer columns for Crestmont', () => {
    render(<LeaderboardTable data={MOCK_CRESTMONT_LEADERBOARD} clubConfig={crestmontConfig} />);
    const table = screen.getByTestId('leaderboard-table');
    const thead = table.querySelector('thead')!;
    const headerRow = within(thead).getAllByRole('columnheader');
    const golferHeaders = headerRow.filter((th) => th.textContent?.startsWith('Golfer'));
    expect(golferHeaders).toHaveLength(6);
  });

  it('shows last scored timestamp', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    // The component renders "Last scored: <formatted date>"
    expect(screen.getByText(/Last scored:/)).toBeInTheDocument();
  });

  it('shows qualification badge (Q/NQ) on weekends only', () => {
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    if (isWeekend) {
      expect(screen.getAllByText('Q').length).toBeGreaterThan(0);
      expect(screen.getAllByText('NQ').length).toBeGreaterThan(0);
    } else {
      expect(screen.queryByText('NQ')).not.toBeInTheDocument();
    }
  });

  it('shows position and total score', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
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
