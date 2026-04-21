import { useParams } from 'react-router-dom';
import type { ClubConfig, PoolEvent, BillingStatus } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { OnboardingChecklist } from '../components/onboarding/OnboardingChecklist';
import { UpgradePrompt } from '../components/onboarding/UpgradePrompt';
import { ReferralWidget } from '../components/coordinator/ReferralWidget';

const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  suspended: 'Suspended',
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

interface CoordinatorDashboardPageProps {
  clubConfig: ClubConfig;
}

export function CoordinatorDashboardPage({ clubConfig }: CoordinatorDashboardPageProps) {
  const { poolId } = useParams<{ poolId: string }>();
  const clubCode = clubConfig.code;
  const id = Number(poolId);

  const { data: pool, loading: poolLoading, error: poolError } = useApi(
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

  if (poolLoading || entriesLoading || eventsLoading) return <LoadingState />;
  if (poolError || !pool) return <ErrorState message={poolError ?? 'Pool not found'} />;
  if (entriesError || !entriesData) return <ErrorState message={entriesError ?? 'Could not load entries'} />;

  const usesBuckets = pool.rules_json.uses_buckets;
  const reversedEvents = eventsData ? [...eventsData.events].reverse() : [];

  function handleManageBilling() {
    apiClient.createBillingPortalSession(clubCode).then(({ url }) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }).catch(() => {
      // portal session errors are non-critical
    });
  }

  function handleDownloadCsv() {
    apiClient.downloadPoolEntriesCsv(id).then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pool-${id}-entries.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }).catch(() => {
      // download errors are non-critical; user can retry
    });
  }

  const entryCount = entriesData.count;
  const hasSharedLink = Boolean(pool.pool_token);
  const hasViewedStandings = pool.scoring_enabled && entryCount > 0;

  return (
    <div className="main-content coordinator-dashboard" data-testid="coordinator-dashboard">
      <h1>Coordinator Dashboard — {clubConfig.shortName}</h1>
      <p className="pool-name">{pool.name}</p>

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
        <div className="section-header">
          <h2>Entries ({entriesData.count})</h2>
          <button
            className="btn btn-secondary"
            data-testid="download-csv-btn"
            onClick={handleDownloadCsv}
          >
            Download CSV
          </button>
        </div>

        {entriesData.entries.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          <div className="entries-table-scroll">
            <table className="entries-table" data-testid="entries-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Picks</th>
                </tr>
              </thead>
              <tbody>
                {entriesData.entries.map((entry) => {
                  const sortedPicks = usesBuckets
                    ? [...entry.picks].sort((a, b) => (a.bucket_number ?? 0) - (b.bucket_number ?? 0))
                    : [...entry.picks].sort((a, b) => a.pick_slot - b.pick_slot);
                  return (
                    <tr key={entry.entry_id} data-testid={`entry-row-${entry.entry_id}`}>
                      <td>{entry.entry_name}</td>
                      <td>{entry.email ?? 'Anonymous'}</td>
                      <td>{new Date(entry.submitted_at).toLocaleString()}</td>
                      <td>{sortedPicks.map((p) => p.player_name).join(', ')}</td>
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
