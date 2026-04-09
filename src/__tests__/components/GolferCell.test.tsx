import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GolferCell } from '../../components/leaderboard/GolferCell';
import type { LeaderboardPick } from '../../types/domain';

function makePick(overrides: Partial<LeaderboardPick> = {}): LeaderboardPick {
  return {
    dg_id: 18417,
    player_name: 'Scottie Scheffler',
    total_score: -5,
    position: 1,
    thru: 18,
    r1: -3,
    r2: -2,
    r3: null,
    r4: null,
    status: 'active',
    made_cut: true,
    counts_toward_total: true,
    is_dropped: false,
    ...overrides,
  };
}

function renderCell(pick: LeaderboardPick) {
  // GolferCell renders a <td>, which requires a table context.
  return render(
    <table>
      <tbody>
        <tr>
          <GolferCell pick={pick} />
        </tr>
      </tbody>
    </table>
  );
}

describe('GolferCell', () => {
  it('renders golfer name, thru, and total for active golfer', () => {
    renderCell(makePick());
    expect(screen.getByText('Scottie Scheffler')).toBeInTheDocument();
    // thru=18 formats as 'F'
    expect(screen.getByText('Thru F')).toBeInTheDocument();
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('renders CUT status correctly', () => {
    renderCell(makePick({ status: 'cut', total_score: null, thru: null, counts_toward_total: false }));
    expect(screen.getByText('CUT')).toBeInTheDocument();
    // Should not show "CUT / -" format — just the status
    expect(screen.queryByText('CUT / -')).not.toBeInTheDocument();
  });

  it('renders WD status correctly', () => {
    renderCell(makePick({ status: 'wd', total_score: null, thru: null, counts_toward_total: false }));
    expect(screen.getByText('WD')).toBeInTheDocument();
    expect(screen.queryByText('WD / -')).not.toBeInTheDocument();
  });

  it('applies golfer-counted class when counts_toward_total is true', () => {
    renderCell(makePick({ counts_toward_total: true }));
    const cell = screen.getByTestId('golfer-cell-18417');
    expect(cell).toHaveClass('golfer-counted');
    expect(cell).not.toHaveClass('golfer-not-counted');
  });

  it('applies golfer-not-counted class when counts_toward_total is false', () => {
    renderCell(makePick({ counts_toward_total: false }));
    const cell = screen.getByTestId('golfer-cell-18417');
    expect(cell).toHaveClass('golfer-not-counted');
    expect(cell).not.toHaveClass('golfer-counted');
  });

  it('applies golfer-inactive class for cut/wd/dq', () => {
    const statuses = ['cut', 'wd', 'dq'] as const;
    for (const status of statuses) {
      const { unmount } = renderCell(
        makePick({ status, total_score: null, thru: null, counts_toward_total: false })
      );
      expect(screen.getByTestId('golfer-cell-18417')).toHaveClass('golfer-inactive');
      unmount();
    }
  });

  it('applies golfer-dropped class when is_dropped is true', () => {
    renderCell(makePick({ is_dropped: true, counts_toward_total: false }));
    const cell = screen.getByTestId('golfer-cell-18417');
    expect(cell).toHaveClass('golfer-dropped');
  });
});
