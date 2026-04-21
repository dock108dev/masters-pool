import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type {
  ClubConfig,
  AvailableGolfer,
  GolferBucket,
  EntrySubmissionResponse,
  PoolFieldResponse,
  PoolLockStatus,
} from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { validatePublicEntryForm, validateSlotSelections } from '../utils/validation';
import { fieldToGolfers, fieldToBuckets } from '../utils/fieldHelpers';
import { GolferPicker } from '../components/entry/GolferPicker';
import { BucketPicker } from '../components/entry/BucketPicker';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface PublicEntryPageProps {
  clubConfig: ClubConfig;
}

export function PublicEntryPage({ clubConfig }: PublicEntryPageProps) {
  const { poolToken } = useParams<{ poolToken: string }>();
  const navigate = useNavigate();
  // Negative IDs distinguish write-in "Other" golfers from real dg_ids
  const nextOtherIdRef = useRef(-1);

  const [email, setEmail] = useState('');
  const [entryName, setEntryName] = useState('');
  const [slotSelections, setSlotSelections] = useState<(number | null)[]>(() =>
    Array<null>(clubConfig.pickCount).fill(null)
  );
  const [slotErrors, setSlotErrors] = useState<(string | null)[]>(() =>
    Array<null>(clubConfig.pickCount).fill(null)
  );
  const [otherName, setOtherName] = useState('');
  const [otherPlayers, setOtherPlayers] = useState<{ id: number; name: string }[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: pool, loading: poolLoading, error: poolError } = useApi(
    () =>
      poolToken
        ? apiClient.getPoolByToken(clubConfig.code, poolToken)
        : Promise.resolve(null),
    [clubConfig.code, poolToken ?? '']
  );

  const { data: field, loading: fieldLoading, error: fieldError, refetch: refetchField } =
    useApi<PoolFieldResponse>(
      () => pool ? apiClient.getPoolField(pool.id) : Promise.resolve({ pool_id: 0, variant: '' }),
      [pool?.id ?? 0]
    );

  const { data: lockStatus, loading: lockStatusLoading } = useApi<PoolLockStatus>(
    () =>
      pool
        ? apiClient.getLockStatus(pool.id)
        : Promise.resolve({ locked: false, locked_at: null, lock_time: null }),
    [pool?.id ?? 0],
  );

  const golfers: AvailableGolfer[] = field ? fieldToGolfers(field) : [];
  const buckets: GolferBucket[] | null = field ? fieldToBuckets(field) : null;

  const allGolfers: AvailableGolfer[] = [
    ...golfers,
    ...otherPlayers.map((p): AvailableGolfer => ({ dg_id: p.id, player_name: p.name })),
  ];

  const selectedIds = slotSelections.filter((id): id is number => id !== null);
  const isFull = selectedIds.length >= clubConfig.pickCount;

  const handleSlotChange = (slotIndex: number, dgId: number | null) => {
    const currentId = slotSelections[slotIndex];
    if (currentId !== null && currentId < 0 && dgId !== currentId) {
      setOtherPlayers((prev) => prev.filter((p) => p.id !== currentId));
    }
    setSlotSelections((prev) => {
      const next = [...prev];
      next[slotIndex] = dgId;
      return next;
    });
    setSlotErrors((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
    setValidationErrors([]);
  };

  const handleAddOther = () => {
    const trimmed = otherName.trim();
    if (!trimmed) return;
    const firstEmptySlot = slotSelections.findIndex((s) => s === null);
    if (firstEmptySlot === -1) return;
    const id = nextOtherIdRef.current--;
    setOtherPlayers((prev) => [...prev, { id, name: trimmed }]);
    setSlotSelections((prev) => {
      const next = [...prev];
      next[firstEmptySlot] = id;
      return next;
    });
    setSlotErrors((prev) => {
      const next = [...prev];
      next[firstEmptySlot] = null;
      return next;
    });
    setOtherName('');
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const newSlotErrors = validateSlotSelections(slotSelections);
    setSlotErrors(newSlotErrors);

    const result = validatePublicEntryForm(
      email,
      entryName,
      selectedIds,
      clubConfig,
      clubConfig.useBuckets ? (buckets ?? []) : null,
    );

    if (!result.valid || newSlotErrors.some((e) => e !== null)) {
      setValidationErrors(result.errors);
      return;
    }

    setSubmitting(true);
    try {
      const picks = slotSelections
        .map((dgId, index) => ({ dgId, pick_slot: index + 1 }))
        .filter((p): p is { dgId: number; pick_slot: number } => p.dgId !== null)
        .map(({ dgId, pick_slot }) => {
          const other = otherPlayers.find((p) => p.id === dgId);
          if (other) return { dg_id: 0, pick_slot, player_name: other.name };
          const golfer = golfers.find((g) => g.dg_id === dgId);
          const player_name = golfer?.player_name;
          if (buckets) {
            const bucket = buckets.find((b) => b.golfers.some((g) => g.dg_id === dgId));
            return { dg_id: dgId, pick_slot, player_name, bucket_number: bucket?.bucket_number };
          }
          return { dg_id: dgId, pick_slot, player_name };
        });

      const response: EntrySubmissionResponse = await apiClient.submitEntry(pool!.id, {
        email,
        entry_name: entryName,
        picks,
      });

      navigate(`/${clubConfig.code}/enter/${poolToken}/confirmation`, {
        state: { confirmation: response, poolToken },
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (poolLoading || fieldLoading || lockStatusLoading) {
    return <LoadingState message="Loading entry form..." />;
  }
  if (poolError || fieldError) {
    return <ErrorState message={poolError ?? fieldError ?? 'Failed to load.'} onRetry={refetchField} />;
  }
  if (!pool) {
    return (
      <div className="page entry-page">
        <h1>Pool Not Found</h1>
        <p>This entry link is invalid or the pool no longer exists.</p>
      </div>
    );
  }

  if (lockStatus?.locked) {
    return (
      <div className="page entry-page">
        <div className="pool-locked-banner" role="alert" data-testid="pool-locked-banner">
          <h2>Pool is Closed</h2>
          <p>
            Entry submissions are closed.
            {lockStatus.locked_at
              ? ` The pool was locked on ${new Date(lockStatus.locked_at).toLocaleString()}.`
              : ''}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page entry-page">
      <h1>Submit Entry</h1>
      <p className="entry-subtitle">{clubConfig.shortName} — Pick your {clubConfig.pickCount} golfers</p>

      <form onSubmit={handleSubmit} className="entry-form" data-testid="entry-form">
        <div className="form-group">
          <label htmlFor="pub-email">Email <span className="field-optional">(optional)</span></label>
          <input
            id="pub-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            data-testid="email-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="pub-entryName">Entry Name</label>
          <input
            id="pub-entryName"
            type="text"
            value={entryName}
            onChange={(e) => setEntryName(e.target.value)}
            placeholder="Your name"
            required
            data-testid="display-name-input"
          />
        </div>

        {clubConfig.useBuckets && buckets && buckets.length > 0 ? (
          <BucketPicker
            buckets={buckets}
            slotSelections={slotSelections}
            clubConfig={clubConfig}
            onSlotChange={handleSlotChange}
            slotErrors={slotErrors}
          />
        ) : (
          golfers.length > 0 && (
            <GolferPicker
              golfers={allGolfers}
              slotSelections={slotSelections}
              clubConfig={clubConfig}
              buckets={null}
              onSlotChange={handleSlotChange}
              slotErrors={slotErrors}
            />
          )
        )}

        <div className="other-player-section" data-testid="other-player-section">
          <h4>Other</h4>
          <p className="picker-instruction">Don&apos;t see your player? Type their name below.</p>
          {otherPlayers.length > 0 && (
            <div className="other-player-list">
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="golfer-option selected"
                  onClick={() => {
                    const slotIndex = slotSelections.findIndex((s) => s === p.id);
                    if (slotIndex !== -1) handleSlotChange(slotIndex, null);
                  }}
                  data-testid={`other-player-${p.id}`}
                >
                  <span className="golfer-option-name">{p.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="other-player-input">
            <input
              type="text"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOther(); } }}
              placeholder="Last, First (e.g. Aberg, Ludvig)"
              data-testid="other-player-name"
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleAddOther}
              disabled={!otherName.trim() || !slotSelections.some((s) => s === null)}
              data-testid="add-other-player"
            >
              Add
            </button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="validation-errors" role="alert" data-testid="validation-errors">
            <ul>
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {submitError && (
          <div className="submit-error" role="alert" data-testid="submit-error">
            <p>{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary entry-submit-inline"
          disabled={submitting}
          data-testid="submit-button"
        >
          {submitting ? 'Submitting...' : 'Submit Entry'}
        </button>
      </form>

      <div
        className={`pick-banner ${isFull ? 'pick-banner-ready' : ''}`}
        data-testid="pick-banner"
      >
        {isFull ? (
          <button
            type="button"
            className="pick-banner-submit"
            disabled={submitting}
            onClick={() => {
              const form = document.querySelector<HTMLFormElement>('[data-testid="entry-form"]');
              form?.requestSubmit();
            }}
          >
            {submitting ? 'Submitting...' : `All ${clubConfig.pickCount} Selected — Submit Entry`}
          </button>
        ) : (
          <div className="pick-banner-count">
            <div className="pick-banner-dots">
              {Array.from({ length: clubConfig.pickCount }, (_, i) => (
                <span key={i} className={`pick-dot ${i < selectedIds.length ? 'pick-dot-filled' : ''}`} />
              ))}
            </div>
            <span className="pick-banner-text">
              {selectedIds.length} / {clubConfig.pickCount} golfers selected
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
