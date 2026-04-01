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

  const droppedCount = clubConfig.pickCount - clubConfig.countedScores;

  return (
    <div className="page home-page">
      <div className="home-hero">
        <h1>{clubConfig.shortName} Masters Pool</h1>
        <p className="home-welcome">
          Welcome to the {clubConfig.name} Masters Tournament Pool.
          Select your golfers, follow the action, and compete for bragging rights at the club.
        </p>
      </div>

      {pool ? (
        <div className="tournament-info">
          <h2>{pool.name}</h2>
          <p className="tournament-status">Status: {pool.status}</p>
          <p className="entry-deadline">
            Entry deadline: {new Date(pool.entry_deadline).toLocaleString()}
          </p>
          <div className="home-actions">
            <Link to="/entry" className="btn btn-primary">Submit Entry</Link>
            <Link to="/lookup" className="btn btn-secondary">My Entries</Link>
          </div>
        </div>
      ) : (
        <p>No active pool at this time. Check back soon.</p>
      )}

      <div className="home-rules">
        <h2>How It Works</h2>
        <div className="rules-card">
          <div className="rules-grid">
            <div className="rule-item">
              <span className="rule-number">1</span>
              <div>
                <strong>Pick {clubConfig.pickCount} Golfers</strong>
                <p>Choose {clubConfig.useBuckets ? '1 from each bucket' : 'any players from the field'}. Up to {clubConfig.maxEntriesPerEmail} entries per email.</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-number">2</span>
              <div>
                <strong>Make the Cut</strong>
                <p>At least {clubConfig.cutMinimum} of your {clubConfig.pickCount} golfers must make the cut for your entry to qualify.</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-number">3</span>
              <div>
                <strong>Best {clubConfig.countedScores} Count</strong>
                <p>Your lowest {clubConfig.countedScores} scores are totaled.{droppedCount > 0 ? ` If all ${clubConfig.pickCount} make the cut, the ${droppedCount} highest are dropped.` : ''}</p>
              </div>
            </div>
            <div className="rule-item">
              <span className="rule-number">4</span>
              <div>
                <strong>Lowest Score Wins</strong>
                <p>The entry with the lowest aggregate counted score takes the title.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
