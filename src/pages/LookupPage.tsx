import { useState } from 'react';
import type { ClubConfig, EntryLookupResult, PoolSummary } from '../types/domain';
import { apiClient } from '../api/client';
import { validateEmail } from '../utils/validation';
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
  const [searched, setSearched] = useState(false);

  const { data: pool } = useApi<PoolSummary | null>(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code]
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
    try {
      const data = await apiClient.lookupEntries(pool.id, email);
      setResult(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed.');
    } finally {
      setLoading(false);
    }
  };

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

      {searched && result && result.entries.length === 0 && (
        <EmptyState title="No entries found" description={`No entries found for ${email}.`} />
      )}

      {result && result.entries.length > 0 && (
        <div className="lookup-results" data-testid="lookup-results">
          <h2>Entries for {result.email}</h2>
          {result.entries.map((entry) => (
            <div key={entry.entry_id} className="lookup-entry-card">
              <p><strong>{entry.entry_name}</strong></p>
              <ul>
                {entry.picks.map((pick, i) => (
                  <li key={i}>Pick {pick.pick_slot}: {pick.player_name ?? `dg_id ${pick.dg_id}`}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
