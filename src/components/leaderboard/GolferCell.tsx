import type { LeaderboardPick } from '../../types/domain';
import { formatScore, formatThru } from '../../utils/formatting';

interface GolferCellProps {
  pick: LeaderboardPick;
}

export function GolferCell({ pick }: GolferCellProps) {
  const { status } = pick;
  const isMissedCut = status === 'cut' || status === 'wd' || status === 'dq';
  const className = [
    'golfer-cell',
    pick.counts_toward_total ? 'golfer-counted' : 'golfer-not-counted',
    pick.is_dropped ? 'golfer-dropped' : '',
    isMissedCut ? 'golfer-inactive' : '',
    status === 'cut' ? 'golfer-cut' : '',
    status === 'dq' ? 'golfer-dq' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const nameClassName = status === 'cut'
    ? 'golfer-name golfer-name--strikethrough'
    : 'golfer-name';

  const totalDisplay = formatScore(pick.total_score);

  return (
    <td className={className} data-testid={`golfer-cell-${pick.dg_id}`}>
      <div className="golfer-cell-inner">
        <div className="golfer-info">
          <span className={nameClassName}>{pick.player_name}</span>
          {status === 'active' && (
            <span className="golfer-thru">Thru {formatThru(pick.thru)}</span>
          )}
          {status === 'cut' && (
            <span className="golfer-thru">CUT</span>
          )}
          {status === 'wd' && (
            <span className="status-pill status-pill--wd">WD</span>
          )}
          {status === 'dq' && (
            <span className="status-pill status-pill--dq">DQ</span>
          )}
        </div>
        <span className="golfer-total">{totalDisplay}</span>
      </div>
    </td>
  );
}
