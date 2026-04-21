import { apiClient } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import type { TournamentPollHealth } from '../../types/domain';

function formatMrr(cents: number): string {
  if (cents === 0) return '$0';
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

function PollHealthRow({ entry }: { entry: TournamentPollHealth }) {
  return (
    <div
      className={`poll-health-row${entry.is_stale ? ' poll-health-row--stale' : ''}`}
      data-testid="poll-health-row"
    >
      <span className="poll-health-row__name">{entry.pool_name}</span>
      <span
        className={entry.is_stale ? 'poll-health-row__status--stale' : 'poll-health-row__status--ok'}
        data-testid={entry.is_stale ? 'poll-health-stale' : 'poll-health-ok'}
      >
        {entry.is_in_window ? (entry.is_stale ? 'STALE' : 'OK') : 'OFF-WINDOW'}
      </span>
      <span className="poll-health-row__timestamp">
        Last polled: {formatTimestamp(entry.last_polled_at)}
      </span>
    </div>
  );
}

export function SuperAdminDashboard() {
  const { data: stats, loading: statsLoading, error: statsError } = useApi(
    () => apiClient.getAdminStats(),
    [],
  );

  const { data: pollHealth, loading: pollLoading } = useApi(
    () => apiClient.getPollHealth(),
    [],
    { pollingInterval: 60_000 },
  );

  return (
    <div className="main-content" data-testid="superadmin-dashboard">
      <h1>Platform Operations</h1>

      {statsError && (
        <div className="error-banner" role="alert">
          Failed to load stats: {statsError}
        </div>
      )}

      <section className="admin-stats" aria-label="Platform statistics">
        <dl>
          <div className="stat-card" data-testid="stat-total-pools">
            <dt>Total Pools</dt>
            <dd>{statsLoading ? '…' : (stats?.total_pools ?? '—')}</dd>
          </div>
          <div className="stat-card" data-testid="stat-total-entries">
            <dt>Total Entries</dt>
            <dd>{statsLoading ? '…' : (stats?.total_entries ?? '—')}</dd>
          </div>
          <div className="stat-card" data-testid="stat-active-clubs">
            <dt>Active Clubs</dt>
            <dd>{statsLoading ? '…' : (stats?.active_clubs ?? '—')}</dd>
          </div>
          <div className="stat-card" data-testid="stat-mrr">
            <dt>MRR</dt>
            <dd data-testid="mrr-value">
              {statsLoading ? '…' : stats != null ? formatMrr(stats.mrr_cents) : '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="admin-poll-health" aria-label="Data poll health">
        <h2>Data Poll Health</h2>
        {pollLoading && !pollHealth && <p>Checking poll status…</p>}
        {pollHealth && pollHealth.tournaments.length === 0 && <p>No active tournaments.</p>}
        {pollHealth?.tournaments.map((t) => <PollHealthRow key={t.pool_id} entry={t} />)}
        {pollHealth && (
          <p className="poll-health-checked-at">
            Checked at: {formatTimestamp(pollHealth.checked_at)}
          </p>
        )}
      </section>
    </div>
  );
}
