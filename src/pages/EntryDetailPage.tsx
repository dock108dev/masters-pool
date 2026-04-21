import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import type { ClubConfig, GolferStatus, LeaderboardPick, PoolSummary } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { formatScore, formatLastUpdated } from '../utils/formatting';

interface EntryDetailPageProps {
  clubConfig: ClubConfig;
}

const STATUS_LABEL: Record<GolferStatus, string> = {
  active: 'Active',
  cut: 'Cut',
  wd: 'WD',
  dq: 'DQ',
};

const STATUS_CLASS: Record<GolferStatus, string> = {
  active: 'status-badge status-badge--active',
  cut: 'status-badge status-badge--cut',
  wd: 'status-badge status-badge--wd',
  dq: 'status-badge status-badge--dq',
};

function StatusBadge({ status }: { status: GolferStatus }) {
  return (
    <span className={STATUS_CLASS[status]} data-testid={`status-badge-${status}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

function buildScoreFormula(pool: PoolSummary): string {
  const { count_best, pick_count, wd_score_penalty } = pool.rules_json;
  const base = `Sum of best ${count_best} scores from ${pick_count} picks`;
  if (wd_score_penalty != null) {
    return `${base} (WD penalty: +${wd_score_penalty})`;
  }
  return base;
}

function sortPicks(picks: LeaderboardPick[]): LeaderboardPick[] {
  return [...picks].sort((a, b) => {
    if (a.counts_toward_total !== b.counts_toward_total) {
      return a.counts_toward_total ? -1 : 1;
    }
    const aActive = a.status === 'active';
    const bActive = b.status === 'active';
    if (aActive !== bActive) return aActive ? -1 : 1;
    const aScore = a.total_score ?? 999;
    const bScore = b.total_score ?? 999;
    if (aScore !== bScore) return aScore - bScore;
    return a.player_name.localeCompare(b.player_name);
  });
}

function roundScore(val: number | null): string {
  return val != null ? formatScore(val) : '-';
}

export function EntryDetailPage({ clubConfig }: EntryDetailPageProps) {
  const { entryId } = useParams<{ entryId: string }>();

  const { data: pool, loading: poolLoading } = useApi(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code],
  );

  const { data: leaderboard, loading: lbLoading } = useApi(
    () => (pool ? apiClient.getLeaderboard(pool.id) : Promise.reject(new Error('No pool'))),
    [pool?.id ?? 0],
  );

  if (poolLoading || (lbLoading && !leaderboard)) {
    return <LoadingState message="Loading entry detail..." />;
  }

  if (!leaderboard || !pool) {
    return <ErrorState message="Entry data unavailable." />;
  }

  const entryIdNum = entryId != null ? parseInt(entryId, 10) : NaN;
  const standing = Number.isNaN(entryIdNum)
    ? undefined
    : leaderboard.standings.find((s) => s.entry_id === entryIdNum);

  if (!standing) {
    return <ErrorState message={`Entry #${entryId ?? 'unknown'} not found.`} />;
  }

  const rankDisplay =
    standing.rank != null ? `${standing.is_tied ? 'T' : ''}${standing.rank}` : '-';

  return (
    <div className="page entry-detail-page">
      <Link to={`/${clubConfig.code}/leaderboard`} className="entry-detail-back">
        ← Back to Leaderboard
      </Link>

      <h1 className="entry-detail-title">{standing.entry_name}</h1>

      <div className="entry-detail-meta">
        <span className="entry-detail-rank">Rank: {rankDisplay}</span>
        <span className="entry-detail-score">Score: {formatScore(standing.aggregate_score)}</span>
      </div>

      <section className="entry-detail-picks">
        <h2>Picks</h2>
        <table className="entry-detail-table" data-testid="entry-detail-table">
          <thead>
            <tr>
              <th>Golfer</th>
              <th>Status</th>
              <th>R1</th>
              <th>R2</th>
              <th>R3</th>
              <th>R4</th>
              <th>Total</th>
              <th>Counts</th>
            </tr>
          </thead>
          <tbody>
            {sortPicks(standing.picks).map((pick) => (
              <tr
                key={pick.dg_id}
                className={pick.counts_toward_total ? 'pick-counted' : 'pick-not-counted'}
                data-testid={`entry-pick-${pick.dg_id}`}
              >
                <td className="pick-name">{pick.player_name}</td>
                <td className="pick-status">
                  <StatusBadge status={pick.status} />
                </td>
                <td>{roundScore(pick.r1)}</td>
                <td>{roundScore(pick.r2)}</td>
                <td>{roundScore(pick.r3)}</td>
                <td>{roundScore(pick.r4)}</td>
                <td className="pick-total">{formatScore(pick.total_score)}</td>
                <td className="pick-counts">{pick.counts_toward_total ? '✓' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="entry-detail-scoring">
        <h2>Score Breakdown</h2>
        <p className="scoring-formula" data-testid="scoring-formula">
          {buildScoreFormula(pool)}
        </p>
        <p className="scoring-aggregate">
          Aggregate score: <strong>{formatScore(standing.aggregate_score)}</strong>
        </p>
      </section>

      <div className="entry-detail-updated" data-testid="entry-detail-updated">
        Last updated: {formatLastUpdated(leaderboard.last_scored_at)}
      </div>
    </div>
  );
}
