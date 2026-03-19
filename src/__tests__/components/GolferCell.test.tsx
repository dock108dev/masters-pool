import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GolferCell } from '../../components/leaderboard/GolferCell';
import type { LeaderboardGolferCell } from '../../types/domain';

function makeCell(overrides: Partial<LeaderboardGolferCell> = {}): LeaderboardGolferCell {
  return {
    golferId: 'g1',
    golferName: 'Scottie Scheffler',
    score: -5,
    displayScore: '-5',
    thru: 'F',
    status: 'active',
    isCounted: true,
    ...overrides,
  };
}

function renderCell(golfer: LeaderboardGolferCell) {
  // GolferCell renders a <td>, which requires a table context.
  return render(
    <table>
      <tbody>
        <tr>
          <GolferCell golfer={golfer} />
        </tr>
      </tbody>
    </table>
  );
}

describe('GolferCell', () => {
  it('renders golfer name and score for active golfer', () => {
    renderCell(makeCell());
    expect(screen.getByText('Scottie Scheffler')).toBeInTheDocument();
    // Active golfers show score / thru
    expect(screen.getByText('-5 / F')).toBeInTheDocument();
  });

  it('renders CUT status correctly', () => {
    renderCell(makeCell({ status: 'cut', displayScore: 'CUT', thru: '-', isCounted: false }));
    expect(screen.getByText('CUT')).toBeInTheDocument();
    // Should not show "CUT / -" format — just the displayScore
    expect(screen.queryByText('CUT / -')).not.toBeInTheDocument();
  });

  it('renders WD status correctly', () => {
    renderCell(makeCell({ status: 'wd', displayScore: 'WD', thru: '-', isCounted: false }));
    expect(screen.getByText('WD')).toBeInTheDocument();
    expect(screen.queryByText('WD / -')).not.toBeInTheDocument();
  });

  it('applies golfer-counted class when isCounted true', () => {
    renderCell(makeCell({ isCounted: true }));
    const cell = screen.getByTestId('golfer-cell-g1');
    expect(cell).toHaveClass('golfer-counted');
    expect(cell).not.toHaveClass('golfer-not-counted');
  });

  it('applies golfer-not-counted class when isCounted false', () => {
    renderCell(makeCell({ isCounted: false }));
    const cell = screen.getByTestId('golfer-cell-g1');
    expect(cell).toHaveClass('golfer-not-counted');
    expect(cell).not.toHaveClass('golfer-counted');
  });

  it('applies golfer-inactive class for cut/wd/dq', () => {
    const statuses = ['cut', 'wd', 'dq'] as const;
    for (const status of statuses) {
      const { unmount } = renderCell(
        makeCell({ status, displayScore: status.toUpperCase(), thru: '-', isCounted: false })
      );
      expect(screen.getByTestId('golfer-cell-g1')).toHaveClass('golfer-inactive');
      unmount();
    }
  });
});
