import type { LeaderboardData, ClubConfig } from '../../types/domain';
import { GolferCell } from './GolferCell';
import { EmptyState } from '../common/EmptyState';
import { formatLastUpdated } from '../../utils/formatting';

interface LeaderboardTableProps {
  data: LeaderboardData;
  clubConfig: ClubConfig;
}

export function LeaderboardTable({ data, clubConfig }: LeaderboardTableProps) {
  if (data.entries.length === 0) {
    return <EmptyState title="No entries yet" description="The leaderboard will populate once entries are submitted." />;
  }

  const golferColumnHeaders = clubConfig.useBuckets && clubConfig.bucketLabels
    ? clubConfig.bucketLabels
    : Array.from({ length: clubConfig.pickCount }, (_, i) => `Golfer ${i + 1}`);

  return (
    <div className="leaderboard-wrapper">
      <div className="leaderboard-meta">
        <span>Round {data.currentRound ?? '-'}</span>
        <span className="last-updated">Last updated: {formatLastUpdated(data.lastUpdated)}</span>
      </div>
      <div className="leaderboard-scroll">
        <table className="leaderboard-table" data-testid="leaderboard-table">
          <thead>
            <tr>
              <th className="col-pos">Pos</th>
              <th className="col-entry">Entry</th>
              <th className="col-total">Total</th>
              <th className="col-status">Status</th>
              <th className="col-counted">Counted</th>
              {golferColumnHeaders.map((label, i) => (
                <th key={i} className="col-golfer">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => (
              <tr key={entry.entryId} className={entry.isQualified ? 'entry-qualified' : 'entry-not-qualified'}>
                <td className="col-pos">{entry.displayPosition}</td>
                <td className="col-entry">{entry.entryName}</td>
                <td className="col-total">{entry.displayTotal}</td>
                <td className="col-status">
                  <span className={`qualification-badge ${entry.isQualified ? 'qualified' : 'not-qualified'}`}>
                    {entry.isQualified ? 'Q' : 'NQ'}
                  </span>
                  <span className="qualification-note">{entry.qualificationNote}</span>
                </td>
                <td className="col-counted">{entry.countedCount}</td>
                {entry.golfers.map((golfer) => (
                  <GolferCell key={golfer.golferId} golfer={golfer} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
