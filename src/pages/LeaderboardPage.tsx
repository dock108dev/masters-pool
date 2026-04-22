import { useState, useEffect } from 'react';
import type { ClubConfig } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { useAnalytics } from '../hooks/useAnalytics';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { LoadingState } from '../components/common/LoadingState';

interface LeaderboardPageProps {
  clubConfig: ClubConfig;
}

const POLL_INTERVAL_MS = 60_000;
const STALE_THRESHOLD_MS = 60_000;
const STALE_CHECK_INTERVAL_MS = 10_000;
const MAX_CONSECUTIVE_FAILURES = 3;

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function LeaderboardPage({ clubConfig }: LeaderboardPageProps) {
  const { capture } = useAnalytics();

  useEffect(() => {
    capture('leaderboard_viewed');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: pool, loading: poolLoading } = useApi(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code],
  );

  const {
    data: leaderboard,
    loading: lbLoading,
    lastUpdatedAt,
    consecutiveFailures,
  } = useApi(
    () => pool ? apiClient.getLeaderboard(pool.id) : Promise.reject(new Error('No pool')),
    [pool?.id ?? 0],
    { pollingInterval: pool?.status === 'live' ? POLL_INTERVAL_MS : undefined },
  );

  const [isStaleInternal, setIsStaleInternal] = useState(false);
  const isStale = lastUpdatedAt != null && isStaleInternal;

  useEffect(() => {
    if (!lastUpdatedAt) return;
    const check = () => setIsStaleInternal(Date.now() - lastUpdatedAt.getTime() > STALE_THRESHOLD_MS);
    check();
    const id = setInterval(check, STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [lastUpdatedAt]);

  if (poolLoading || (lbLoading && !leaderboard)) return <LoadingState message="Loading leaderboard..." />;

  if (pool && !pool.scoring_enabled) {
    return (
      <div className="page leaderboard-page">
        <h1>{clubConfig.shortName} Leaderboard</h1>
        <div className="pre-tournament-banner" data-testid="pre-tournament-banner">
          Tournament hasn't started yet
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="page leaderboard-page">
        <h1>{clubConfig.shortName} Leaderboard</h1>
        <div className="scores-unavailable" data-testid="scores-not-available">
          Scores not yet available — check back when the tournament begins
        </div>
      </div>
    );
  }

  return (
    <div className="page leaderboard-page">
      <h1>{clubConfig.shortName} Leaderboard</h1>
      {consecutiveFailures >= MAX_CONSECUTIVE_FAILURES && (
        <div className="leaderboard-error-banner" role="alert">
          Unable to update — check your connection
        </div>
      )}
      <LeaderboardTable data={leaderboard} clubConfig={clubConfig} />
      {lastUpdatedAt != null && (
        <div className="leaderboard-status" data-testid="leaderboard-status">
          <span>Last updated {formatTime(lastUpdatedAt)}</span>
          {isStale && (
            <span className="leaderboard-stale-badge" data-testid="leaderboard-stale-badge">
              Data may be stale
            </span>
          )}
        </div>
      )}
    </div>
  );
}
