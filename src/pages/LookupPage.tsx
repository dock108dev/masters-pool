import { useState } from 'react';
import type { ClubConfig, EntryLookupResult, LeaderboardStanding, PoolSummary } from '../types/domain';
import { apiClient } from '../api/client';
import { validateEmail } from '../utils/validation';
import { formatScore } from '../utils/formatting';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useApi } from '../hooks/useApi';

interface LookupPageProps {
  clubConfig: ClubConfig;
}

export function LookupPage({ clubConfig }: LookupPageProps) {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<EntryLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searched, setSearched] = useState(false);

  const { data: pool } = useApi<PoolSummary | null>(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code]
  );

  const { data: leaderboard } = useApi(
    () => (pool ? apiClient.getLeaderboard(pool.id) : Promise.resolve(null)),
    [pool?.id ?? 0]
  );

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEmail(email);
    if (!validation.valid) {
      setError(validation.errors[0]);
      return;
    }
    if (!pool) {
      setError('No active pool found.');
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);
    setResult(null);
    try {
      const data = await apiClient.lookupEntries(pool.id, email);
      setResult(data);
      setSearched(true);
    } catch (err) {
      const apiErr = err as { status?: number };
      if (apiErr.status === 404) {
        setNotFound(true);
        setSearched(true);
      } else {
        setError(err instanceof Error ? err.message : 'Lookup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  function findStanding(entryId: number): LeaderboardStanding | undefined {
    return leaderboard?.standings.find((s) => s.entry_id === entryId);
  }

  return (
    <div className="page lookup-page">
      <h1>My Entries</h1>
      <p>Look up your submitted entries by email.</p>

      <form onSubmit={handleLookup} className="lookup-form" data-testid="lookup-form">
        <div className="form-group">
          <label htmlFor="lookupEmail">Email</label>
          <input
            id="lookupEmail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            data-testid="lookup-email-input"
          />
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading} data-testid="lookup-button">
          {loading ? 'Searching...' : 'Look Up'}
        </button>
      </form>

      {loading && <LoadingState message="Searching..." />}

      {notFound && (
        <EmptyState
          title="No entries found"
          description={`No entry found for ${email}.`}
          data-testid="lookup-not-found"
        />
      )}

      {searched && !notFound && result && result.entries.length === 0 && (
        <EmptyState title="No entries found" description={`No entries found for ${email}.`} />
      )}

      {result && result.entries.length > 0 && (
        <div className="lookup-results" data-testid="lookup-results">
          <h2>Entries for {result.email}</h2>
          {result.entries.map((entry) => {
            const standing = findStanding(entry.entry_id);
            const rankDisplay = standing
              ? standing.rank != null
                ? `${standing.is_tied ? 'T' : ''}${standing.rank}`
                : '-'
              : '-';
            const scoreDisplay = standing ? formatScore(standing.aggregate_score) : '-';
            const sortedPicks = [...entry.picks].sort((a, b) => a.pick_slot - b.pick_slot);

            return (
              <div key={entry.entry_id} className="lookup-entry-card" data-testid={`lookup-entry-${entry.entry_id}`}>
                <p><strong>{entry.entry_name}</strong></p>
                <p className="lookup-entry-meta">
                  Rank: <span data-testid="lookup-rank">{rankDisplay}</span>
                  {' · '}
                  Score: <span data-testid="lookup-score">{scoreDisplay}</span>
                </p>
                <ul data-testid="lookup-picks">
                  {sortedPicks.map((pick) => (
                    <li key={pick.pick_slot} data-testid={`lookup-pick-slot-${pick.pick_slot}`}>
                      Pick {pick.pick_slot}: {pick.player_name ?? `dg_id ${pick.dg_id}`}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
