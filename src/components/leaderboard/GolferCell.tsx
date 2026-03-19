import type { LeaderboardGolferCell } from '../../types/domain';

interface GolferCellProps {
  golfer: LeaderboardGolferCell;
}

export function GolferCell({ golfer }: GolferCellProps) {
  const isMissedCut = golfer.status === 'cut' || golfer.status === 'wd' || golfer.status === 'dq';
  const className = [
    'golfer-cell',
    golfer.isCounted ? 'golfer-counted' : 'golfer-not-counted',
    isMissedCut ? 'golfer-inactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td className={className} data-testid={`golfer-cell-${golfer.golferId}`}>
      <span className="golfer-name">{golfer.golferName}</span>
      <span className="golfer-score">
        {isMissedCut ? golfer.displayScore : `${golfer.displayScore} / ${golfer.thru}`}
      </span>
    </td>
  );
}
