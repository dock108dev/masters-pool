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

  const scoreDisplay = isMissedCut
    ? pick.status.toUpperCase()
    : `${formatScore(pick.total_score)} / ${formatThru(pick.thru)}`;

  return (
    <td className={className} data-testid={`golfer-cell-${pick.dg_id}`}>
      <span className="golfer-name">{pick.player_name}</span>
      <span className="golfer-score">{scoreDisplay}</span>
    </td>
  );
}
