import type { LeaderboardPick } from '../../types/domain';
import { formatScore, formatThru } from '../../utils/formatting';

interface GolferCellProps {
  pick: LeaderboardPick;
}

export function GolferCell({ pick }: GolferCellProps) {
  const isMissedCut = pick.status === 'cut' || pick.status === 'wd' || pick.status === 'dq';
  const className = [
    'golfer-cell',
    pick.counts_toward_total ? 'golfer-counted' : 'golfer-not-counted',
    pick.is_dropped ? 'golfer-dropped' : '',
    isMissedCut ? 'golfer-inactive' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const thruDisplay = isMissedCut
    ? pick.status.toUpperCase()
    : `Thru ${formatThru(pick.thru)}`;

  const totalDisplay = formatScore(pick.total_score);

  return (
    <td className={className} data-testid={`golfer-cell-${pick.dg_id}`}>
      <div className="golfer-cell-inner">
        <div className="golfer-info">
          <span className="golfer-name">{pick.player_name}</span>
          <span className="golfer-thru">{thruDisplay}</span>
        </div>
        <span className="golfer-total">{totalDisplay}</span>
      </div>
    </td>
  );
}
