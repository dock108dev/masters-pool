import { Link } from 'react-router-dom';
import type { LeaderboardData, ClubConfig } from '../../types/domain';
import { GolferCell } from './GolferCell';
import { EmptyState } from '../common/EmptyState';
import { formatScore, formatLastUpdated } from '../../utils/formatting';

interface LeaderboardTableProps {
  data: LeaderboardData;
  clubConfig: ClubConfig;
}

function sortPicks(picks: LeaderboardData['standings'][0]['picks']) {
  return [...picks].sort((a, b) => {
    // Players counting toward the total come first (active, not dropped)
    if (a.counts_toward_total !== b.counts_toward_total) {
      return a.counts_toward_total ? -1 : 1;
    }
    // Among remaining, active players before cut/wd/dq
    const aActive = a.status === 'active';
    const bActive = b.status === 'active';
    if (aActive !== bActive) return aActive ? -1 : 1;
    // Within each group, sort by score (lowest first)
    const aScore = a.total_score ?? 999;
    const bScore = b.total_score ?? 999;
    if (aScore !== bScore) return aScore - bScore;
    return a.player_name.localeCompare(b.player_name);
  });
}

export function LeaderboardTable({ data, clubConfig }: LeaderboardTableProps) {
  if (data.standings.length === 0) {
    return <EmptyState title="No entries yet" description="The leaderboard will populate once entries are submitted." />;
  }

  const golferColumnHeaders = Array.from({ length: clubConfig.pickCount }, (_, i) => `Golfer ${i + 1}`);

  // Show status column only on Saturday/Sunday (after the cut)
  const day = new Date().getDay();
  const showStatus = day === 0 || day === 6;

  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-meta">
        <span className="last-updated">Last scored: {formatLastUpdated(data.last_scored_at)}</span>
      </div>
      <div className="leaderboard-scroll">
        <table className="leaderboard-table" data-testid="leaderboard-table">
          <thead>
            <tr>
              <th className="col-pos">Pos</th>
              <th className="col-entry">Entry</th>
              <th className="col-total">Total</th>
              {showStatus && <th className="col-status">Status</th>}
              {golferColumnHeaders.map((label, i) => (
                <th key={i} className="col-golfer">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.standings.map((standing) => {
              const isQualified = standing.qualification_status === 'qualified';
              const rankDisplay = standing.rank != null
                ? `${standing.is_tied ? 'T' : ''}${standing.rank}`
                : '-';
              const sortedPicks = sortPicks(standing.picks);

              return (
                <tr
                  key={standing.entry_id}
                  className={isQualified ? 'entry-qualified' : 'entry-not-qualified'}
                >
                  <td className="col-pos">{rankDisplay}</td>
                  <td className="col-entry">
                    <Link to={`/${clubConfig.code}/leaderboard/entry/${standing.entry_id}`}>
                      {standing.entry_name}
                    </Link>
                  </td>
                  <td className="col-total">{formatScore(standing.aggregate_score)}</td>
                  {showStatus && (
                    <td className="col-status">
                      <span
                        className={`qualification-badge ${isQualified ? 'qualified' : standing.qualification_status === 'pending' ? 'pending' : 'not-qualified'}`}
                      >
                        {isQualified ? 'Q' : standing.qualification_status === 'pending' ? 'P' : 'NQ'}
                      </span>
                      <span className="qualification-note">
                        {standing.qualified_golfers_count} made cut
                      </span>
                    </td>
                  )}
                  {sortedPicks.map((pick) => (
                    <GolferCell key={pick.dg_id} pick={pick} />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
