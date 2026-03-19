import type { ClubConfig } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LeaderboardTable } from '../components/leaderboard/LeaderboardTable';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface LeaderboardPageProps {
  clubConfig: ClubConfig;
}

export function LeaderboardPage({ clubConfig }: LeaderboardPageProps) {
  const { data: pool, loading: poolLoading } = useApi(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code]
  );

  const { data: leaderboard, loading: lbLoading, error, refetch } = useApi(
    () => pool ? apiClient.getLeaderboard(pool.id) : Promise.reject(new Error('No pool')),
    [pool?.id ?? 0]
  );

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
