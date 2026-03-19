import { Link } from 'react-router-dom';
import type { ClubConfig } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface HomePageProps {
  clubConfig: ClubConfig;
}

export function HomePage({ clubConfig }: HomePageProps) {
  const { data: pool, loading, error, refetch } = useApi(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code]
  );

  if (loading) return <LoadingState message="Loading pool..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page home-page">
      <h1>{clubConfig.shortName} Masters Pool</h1>
      {pool ? (
        <div className="tournament-info">
          <h2>{pool.name}</h2>
          <p className="tournament-status">Status: {pool.status}</p>
          <p className="entry-deadline">
            Entry deadline: {new Date(pool.entry_deadline).toLocaleString()}
          </p>
          <div className="home-actions">
            <Link to={`/${clubConfig.code}/entry`} className="btn btn-primary">Submit Entry</Link>
            <Link to={`/${clubConfig.code}/leaderboard`} className="btn btn-secondary">View Leaderboard</Link>
            <Link to={`/${clubConfig.code}/rules`} className="btn btn-secondary">How It Works</Link>
          </div>
        </div>
      ) : (
        <p>No active pool at this time. Check back soon.</p>
      )}
    </div>
  );
}
