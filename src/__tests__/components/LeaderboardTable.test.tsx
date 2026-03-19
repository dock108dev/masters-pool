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
    const emptyData = { ...MOCK_RVCC_LEADERBOARD, entries: [] };
    render(<LeaderboardTable data={emptyData} clubConfig={rvccConfig} />);
    expect(screen.getByText('No entries yet')).toBeInTheDocument();
  });

  it('renders correct number of rows for RVCC leaderboard', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    const table = screen.getByTestId('leaderboard-table');
    const tbody = table.querySelector('tbody')!;
    const rows = within(tbody).getAllByRole('row');
    expect(rows).toHaveLength(MOCK_RVCC_LEADERBOARD.entries.length);
  });

  it('renders 7 golfer columns for RVCC', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    const table = screen.getByTestId('leaderboard-table');
    const thead = table.querySelector('thead')!;
    const headerRow = within(thead).getAllByRole('columnheader');
    // 5 fixed columns (Pos, Entry, Total, Status, Counted) + 7 golfer columns
    const golferHeaders = headerRow.filter((th) => th.textContent?.startsWith('Golfer'));
    expect(golferHeaders).toHaveLength(7);
  });

  it('renders 6 golfer columns with bucket labels for Crestmont', () => {
    render(<LeaderboardTable data={MOCK_CRESTMONT_LEADERBOARD} clubConfig={crestmontConfig} />);
    const table = screen.getByTestId('leaderboard-table');
    const thead = table.querySelector('thead')!;
    const headerRow = within(thead).getAllByRole('columnheader');
    const bucketLabels = crestmontConfig.bucketLabels!;
    const bucketHeaders = headerRow.filter((th) => bucketLabels.includes(th.textContent ?? ''));
    expect(bucketHeaders).toHaveLength(6);
    bucketLabels.forEach((label) => {
      expect(screen.getByRole('columnheader', { name: label })).toBeInTheDocument();
    });
  });

  it('shows last updated timestamp', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    // The formatted date will contain "Last updated:" prefix
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('shows qualification badge (Q/NQ)', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    // e1 and e2 are qualified, e3 is not
    const qualifiedBadges = screen.getAllByText('Q');
    const notQualifiedBadges = screen.getAllByText('NQ');
    expect(qualifiedBadges.length).toBeGreaterThan(0);
    expect(notQualifiedBadges.length).toBeGreaterThan(0);
  });

  it('shows position and total score', () => {
    render(<LeaderboardTable data={MOCK_RVCC_LEADERBOARD} clubConfig={rvccConfig} />);
    // First entry: position '1', total '-15'
    expect(screen.getByText('-15')).toBeInTheDocument();
    // Check position cells exist (there are two '1' and '2' entries)
    const table = screen.getByTestId('leaderboard-table');
    const tbody = table.querySelector('tbody')!;
    const rows = within(tbody).getAllByRole('row');
    const firstRow = rows[0];
    expect(within(firstRow).getByText('1')).toBeInTheDocument();
    expect(within(firstRow).getByText('-15')).toBeInTheDocument();
  });
});
