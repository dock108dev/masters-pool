import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  ClubConfig,
  PoolEvent,
  PoolStatus,
  LeaderboardData,
} from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { OnboardingChecklist } from '../components/onboarding/OnboardingChecklist';
import { UpgradePrompt } from '../components/onboarding/UpgradePrompt';
import { ReferralWidget } from '../components/coordinator/ReferralWidget';
import { BILLING_STATUS_LABELS } from '../utils/labels';

const POOL_STATUS_LABELS: Record<PoolStatus, string> = {
  draft: 'Draft',
  open: 'Open',
  locked: 'Locked',
  live: 'Live',
  final: 'Final',
  archived: 'Archived',
};

const EVENT_LABELS: Partial<Record<string, string>> = {
  entry_submitted: 'Entry submitted',
  entry_updated: 'Entry updated',
  pool_published: 'Pool published',
  pool_locked: 'Pool locked',
  score_recalculated: 'Scores recalculated',
};

function describeEvent(event: PoolEvent): string {
  return EVENT_LABELS[event.event_type] ?? event.event_type;
}

function formatDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 'Deadline passed';
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return `Deadline in ${Math.floor(diff / 60_000)}m`;
  if (hours < 24) return `Deadline in ${hours}h`;
  return `Deadline in ${Math.floor(hours / 24)}d`;
}

interface CoordinatorDashboardPageProps {
  clubConfig: ClubConfig;
}

export function CoordinatorDashboardPage({ clubConfig }: CoordinatorDashboardPageProps) {
  const { poolId } = useParams<{ poolId: string }>();
  const clubCode = clubConfig.code;
  const id = Number(poolId);

  const [showLockModal, setShowLockModal] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  const { data: pool, loading: poolLoading, error: poolError, refetch: refetchPool } = useApi(
    () => apiClient.getPoolDetail(id),
    [id],
  );
  const { data: entriesData, loading: entriesLoading, error: entriesError } = useApi(
    () => apiClient.getPoolEntries(id),
    [id],
  );
  const { data: eventsData, loading: eventsLoading } = useApi(
    () => apiClient.getPoolEvents(id, 1, 50),
    [id],
  );
  const { data: billing } = useApi(
    () => apiClient.getClubBilling(clubCode),
    [clubCode],
  );
  const { data: referral } = useApi(
    () => apiClient.getReferralInfo(clubCode),
    [clubCode],
  );
  const { data: leaderboardData } = useApi<LeaderboardData | null>(
    () => (pool?.status === 'live' ? apiClient.getLeaderboard(id) : Promise.resolve(null)),
    [id, pool?.status],
    { pollingInterval: pool?.status === 'live' ? 60_000 : undefined },
  );

  if (poolLoading || entriesLoading || eventsLoading) return <LoadingState />;
  if (poolError || !pool) return <ErrorState message={poolError ?? 'Pool not found'} />;
  if (entriesError || !entriesData) return <ErrorState message={entriesError ?? 'Could not load entries'} />;

  const usesBuckets = pool.rules_json.uses_buckets;
  const isLive = pool.status === 'live';
  const isLocked = pool.status === 'locked';
  const canLock = pool.status === 'open' || pool.status === 'draft';
  const reversedEvents = eventsData ? [...eventsData.events].reverse() : [];
  const entryCount = entriesData.count;

  const scoreByEntryId = new Map<number, number | null>();
  if (isLive && leaderboardData) {
    for (const standing of leaderboardData.standings) {
      scoreByEntryId.set(standing.entry_id, standing.aggregate_score);
    }
  }

  function handleManageBilling() {
    setBillingError(null);
    apiClient.createBillingPortalSession(clubCode).then(({ url }) => {
      if (!url.startsWith('https://billing.stripe.com/')) {
        setBillingError('Invalid billing portal URL. Please contact support.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }).catch((err: unknown) => {
      console.error('[CoordinatorDashboard] Failed to open billing portal:', err);
      setBillingError('Could not open billing portal. Please try again.');
    });
  }

  async function handleDownloadCsv() {
    setCsvLoading(true);
    setCsvError(null);
    try {
      const blob = await apiClient.downloadPoolEntriesCsv(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const slug = pool!.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      a.download = `${slug}-entries.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[CoordinatorDashboard] Failed to download CSV:', err);
      setCsvError('Failed to download CSV. Please try again.');
    } finally {
      setCsvLoading(false);
    }
  }

  async function handleConfirmLock() {
    setShowLockModal(false);
    setLockError(null);
    try {
      await apiClient.lockPool(id);
      refetchPool();
    } catch (err) {
      console.error('[CoordinatorDashboard] Failed to lock pool:', err);
      setLockError('Could not lock the pool. Please try again.');
    }
  }

  async function handleUnlockPool() {
    setLockError(null);
    try {
      await apiClient.unlockPool(id);
      refetchPool();
    } catch (err) {
      console.error('[CoordinatorDashboard] Failed to unlock pool:', err);
      setLockError('Could not unlock the pool. Please try again.');
    }
  }

  const hasSharedLink = Boolean(pool.pool_token);
  const hasViewedStandings = pool.scoring_enabled && entryCount > 0;

  return (
    <div className="main-content coordinator-dashboard" data-testid="coordinator-dashboard">
      <h1>Coordinator Dashboard — {clubConfig.shortName}</h1>
      <p className="pool-name">{pool.name}</p>

      <section className="dashboard-section pool-status-card" data-testid="pool-status-card">
        <div className="pool-status-header">
          <span
            className={`status-badge status-badge--${pool.status}`}
            data-testid="pool-status-badge"
          >
            {POOL_STATUS_LABELS[pool.status]}
          </span>
          <span data-testid="pool-entry-count">
            {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
          </span>
          <span data-testid="pool-deadline">{formatDeadline(pool.entry_deadline)}</span>
        </div>
      </section>

      <section className="dashboard-section actions-bar" data-testid="actions-bar">
        {isLocked ? (
          <button
            className="btn btn-secondary"
            data-testid="unlock-pool-btn"
            onClick={handleUnlockPool}
          >
            Unlock Pool
          </button>
        ) : canLock ? (
          <button
            className="btn btn-primary"
            data-testid="lock-pool-btn"
            onClick={() => setShowLockModal(true)}
          >
            Lock Pool
          </button>
        ) : null}
        {lockError && (
          <p className="lock-error" data-testid="lock-error">{lockError}</p>
        )}
        <button
          className="btn btn-secondary"
          data-testid="download-csv-btn"
          onClick={handleDownloadCsv}
          disabled={csvLoading}
        >
          {csvLoading ? 'Downloading…' : 'Download CSV'}
        </button>
        {csvError && (
          <p className="csv-error" data-testid="csv-error">{csvError}</p>
        )}
        <Link to="/leaderboard" className="btn btn-secondary" data-testid="view-leaderboard-link">
          View Leaderboard
        </Link>
      </section>

      {showLockModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          data-testid="lock-confirm-modal"
        >
          <div className="modal-content">
            <h2>Lock Pool?</h2>
            <p>
              {entryCount} {entryCount === 1 ? 'entry has' : 'entries have'} been submitted.
              No new entries will be accepted once the pool is locked.
            </p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                data-testid="confirm-lock-btn"
                onClick={handleConfirmLock}
              >
                Confirm Lock
              </button>
              <button
                className="btn btn-secondary"
                data-testid="cancel-lock-btn"
                onClick={() => setShowLockModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="dashboard-section" data-testid="onboarding-section">
        <OnboardingChecklist
          hasCreatedPool
          hasSharedLink={hasSharedLink}
          entryCount={entryCount}
          hasViewedStandings={hasViewedStandings}
        />
      </section>

      {billing && (
        <UpgradePrompt
          poolStatus={pool.status}
          billingStatus={billing.billing_status}
          onUpgrade={handleManageBilling}
        />
      )}

      <section className="dashboard-section" data-testid="entries-section">
        <h2>Entries ({entriesData.count})</h2>
        {entriesData.entries.length === 0 ? (
          <p data-testid="entries-empty-state">No entries yet.</p>
        ) : (
          <div className="entries-table-scroll">
            <table className="entries-table" data-testid="entries-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Picks</th>
                  {isLive && <th>Score</th>}
                </tr>
              </thead>
              <tbody>
                {entriesData.entries.map((entry) => {
                  const sortedPicks = usesBuckets
                    ? [...entry.picks].sort((a, b) => (a.bucket_number ?? 0) - (b.bucket_number ?? 0))
                    : [...entry.picks].sort((a, b) => a.pick_slot - b.pick_slot);
                  const score = scoreByEntryId.get(entry.entry_id);
                  return (
                    <tr key={entry.entry_id} data-testid={`entry-row-${entry.entry_id}`}>
                      <td>{entry.entry_name}</td>
                      <td>{entry.email ?? 'Anonymous'}</td>
                      <td>{new Date(entry.submitted_at).toLocaleString()}</td>
                      <td>{sortedPicks.map((p) => p.player_name).join(', ')}</td>
                      {isLive && (
                        <td data-testid={`entry-score-${entry.entry_id}`}>
                          {score !== undefined && score !== null
                            ? score > 0 ? `+${score}` : `${score}`
                            : '—'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboard-section" data-testid="billing-section">
        <h2>Billing</h2>
        {billing ? (
          <div className="billing-info">
            <span
              className={`billing-badge billing-badge--${billing.billing_status}`}
              data-testid="billing-badge"
            >
              {BILLING_STATUS_LABELS[billing.billing_status]}
            </span>
            {billing.billing_status === 'active' && billing.next_invoice_date && (
              <p className="next-invoice" data-testid="next-invoice-date">
                Next invoice: {new Date(billing.next_invoice_date).toLocaleDateString()}
              </p>
            )}
            {billing.billing_status === 'trial' && (
              <p className="trial-info" data-testid="trial-info">
                {billing.trial_used
                  ? 'Trial pool used. Upgrade to create additional pools.'
                  : 'Your first pool is free. Upgrade to create additional pools.'}
              </p>
            )}
            {billing.billing_status === 'suspended' && (
              <p className="suspended-info" data-testid="suspended-info">
                Your subscription is suspended. Reactivate billing to create new pools.
              </p>
            )}
            {billing.stripe_customer_id ? (
              <button
                className="btn btn-secondary billing-portal-btn"
                data-testid="manage-billing-btn"
                onClick={handleManageBilling}
              >
                Manage billing
              </button>
            ) : (
              <button
                className="btn btn-primary billing-upgrade-btn"
                data-testid="billing-upgrade-btn"
                onClick={handleManageBilling}
              >
                Upgrade plan
              </button>
            )}
          </div>
        ) : (
          <p data-testid="billing-unavailable">Billing information unavailable.</p>
        )}
        {billingError && (
          <p className="billing-error" data-testid="billing-error">{billingError}</p>
        )}
      </section>

      <section className="dashboard-section" data-testid="event-log-section">
        <h2>Event Log</h2>
        {reversedEvents.length === 0 ? (
          <p>No events recorded.</p>
        ) : (
          <ol className="event-log" reversed data-testid="event-log">
            {reversedEvents.map((event) => (
              <li key={event.id} data-testid={`event-${event.id}`}>
                <span className="event-description">{describeEvent(event)}</span>
                {' — '}
                <span className="event-time">{new Date(event.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {referral && (
        <section className="dashboard-section" data-testid="referral-section">
          <ReferralWidget
            referralUrl={referral.referral_url}
            creditBalance={referral.credit_balance}
            referredClubsCount={referral.referred_clubs_count}
          />
        </section>
      )}
    </div>
  );
}
