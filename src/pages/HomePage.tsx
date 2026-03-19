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
  const { data: tournament, loading, error, refetch } = useApi(
    async () => {
      const summary = await apiClient.getActiveTournament(clubConfig.code);
      if (!summary) return null;
      return apiClient.getTournamentDetail(summary.id);
    },
    [clubConfig.code]
  );

  if (loading) return <LoadingState message="Loading tournament..." />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div className="page home-page">
      <h1>{clubConfig.shortName} Masters Pool</h1>
      {tournament ? (
        <div className="tournament-info">
          <h2>{tournament.name}</h2>
          <p className="course-name">{tournament.courseName}</p>
          <p className="tournament-dates">{tournament.startDate} — {tournament.endDate}</p>
          <p className="tournament-status">Status: {tournament.status}</p>
          {tournament.status === 'active' && tournament.currentRound && (
            <p className="current-round">Round {tournament.currentRound} of {tournament.rounds}</p>
          )}
          <p className="entries-count">{tournament.entriesCount} entries submitted</p>
          <div className="home-actions">
            <Link to={`/${clubConfig.code}/entry`} className="btn btn-primary">Submit Entry</Link>
            <Link to={`/${clubConfig.code}/leaderboard`} className="btn btn-secondary">View Leaderboard</Link>
            <Link to={`/${clubConfig.code}/rules`} className="btn btn-secondary">How It Works</Link>
          </div>
        </div>
      ) : (
        <p>No active tournament at this time. Check back soon.</p>
      )}
    </div>
  );
}
