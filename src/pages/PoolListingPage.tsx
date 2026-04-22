import { useNavigate } from 'react-router-dom';
import type { ClubConfig, PoolStatus } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';

type BadgeStatus = 'draft' | 'live' | 'locked' | 'closed';

const STATUS_BADGE_MAP: Record<PoolStatus, BadgeStatus> = {
  draft: 'draft',
  open: 'live',
  locked: 'locked',
  live: 'live',
  final: 'closed',
  archived: 'closed',
};

const BADGE_LABELS: Record<BadgeStatus, string> = {
  draft: 'Draft',
  live: 'Live',
  locked: 'Locked',
  closed: 'Closed',
};

interface PoolListingPageProps {
  clubConfig: ClubConfig;
}

export function PoolListingPage({ clubConfig }: PoolListingPageProps) {
  const navigate = useNavigate();

  const { data: pools, loading, error } = useApi(
    () => apiClient.getClubPools(clubConfig.code),
    [clubConfig.code],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  function handleCreatePool() {
    navigate('/admin/pools/new');
  }

  function handlePoolClick(poolId: number) {
    navigate(`/admin/pools/${poolId}`);
  }

  return (
    <div className="main-content pool-listing" data-testid="pool-listing-page">
      <div className="page-header">
        <h1>{clubConfig.shortName} — Pools</h1>
        <button
          className="btn btn-primary"
          data-testid="create-pool-btn"
          onClick={handleCreatePool}
        >
          Create new pool
        </button>
      </div>

      {pools && pools.length === 0 ? (
        <div data-testid="no-pools">
          <EmptyState
            title="No pools yet"
            description="Create your first pool to get started."
          />
          <button
            className="btn btn-primary"
            data-testid="create-first-pool-btn"
            onClick={handleCreatePool}
          >
            Create your first pool
          </button>
        </div>
      ) : (
        <ul className="pool-list" data-testid="pool-list">
          {(pools ?? []).map((pool) => {
            const badge = STATUS_BADGE_MAP[pool.status];
            return (
              <li
                key={pool.id}
                className="pool-card"
                data-testid={`pool-card-${pool.id}`}
                onClick={() => handlePoolClick(pool.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePoolClick(pool.id); }}
              >
                <div className="pool-card__header">
                  <span className="pool-card__name">{pool.name}</span>
                  <span
                    className={`pool-card__badge pool-card__badge--${badge}`}
                    data-testid={`pool-status-badge-${pool.id}`}
                  >
                    {BADGE_LABELS[badge]}
                  </span>
                </div>
                <dl className="pool-card__details">
                  <div>
                    <dt>Format</dt>
                    <dd data-testid={`pool-format-${pool.id}`}>
                      {pool.rules_json.uses_buckets ? 'Bucketed' : 'Flat'}
                    </dd>
                  </div>
                  <div>
                    <dt>Entries</dt>
                    <dd data-testid={`pool-entry-count-${pool.id}`}>
                      {pool.entry_count ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt>Lock time</dt>
                    <dd data-testid={`pool-lock-time-${pool.id}`}>
                      {new Date(pool.entry_deadline).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
