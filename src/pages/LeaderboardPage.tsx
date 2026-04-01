import { Link } from 'react-router-dom';
import type { ClubConfig } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface LeaderboardPageProps {
  clubConfig: ClubConfig;
}

// Leaderboard data is hidden until the tournament starts
const LEADERBOARD_UNLOCK = new Date('2026-04-09T12:00:00Z'); // 8 AM ET

export function LeaderboardPage({ clubConfig }: LeaderboardPageProps) {
  const now = new Date();
  const locked = now < LEADERBOARD_UNLOCK;

  const { data: pool, loading: poolLoading } = useApi(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code]
  );

  const { data: leaderboard, loading: lbLoading, error, refetch } = useApi(
    () => (!locked && pool) ? apiClient.getLeaderboard(pool.id) : Promise.reject(new Error('No pool')),
    [pool?.id ?? 0, locked]
  );

  if (locked) {
    return (
      <div className="page leaderboard-page">
        <h1>{clubConfig.shortName} Leaderboard</h1>
        <p>Pre-tournament. The leaderboard will be available when the tournament begins on Thursday, April 9th at 8:00 AM ET.</p>
        <p>If you need to look up or validate your entries, check <Link to="/lookup">My Entries</Link>.</p>
      </div>
    );
  }

  if (poolLoading || lbLoading) return <LoadingState message="Loading leaderboard..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!leaderboard) return <ErrorState message="Leaderboard unavailable." />;

  return (
    <div className="page leaderboard-page">
      <h1>{clubConfig.shortName} Leaderboard</h1>
      <LeaderboardTable data={leaderboard} clubConfig={clubConfig} />
    </div>
  );
}
