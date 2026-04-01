import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  ClubConfig,
  AvailableGolfer,
  GolferBucket,
  EntrySubmissionResponse,
  PoolFieldResponse,
} from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { validateEntryForm } from '../utils/validation';
import { GolferPicker } from '../components/entry/GolferPicker';
import { BucketPicker } from '../components/entry/BucketPicker';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface EntryPageProps {
  clubConfig: ClubConfig;
}

/** Extract last name for sorting: "Ludvig Aberg" → "Aberg", "Rory McIlroy" → "McIlroy" */
function lastNameSort(a: AvailableGolfer, b: AvailableGolfer): number {
  const lastA = a.player_name.split(' ').slice(-1)[0] ?? '';
  const lastB = b.player_name.split(' ').slice(-1)[0] ?? '';
  return lastA.localeCompare(lastB);
}

function fieldToGolfers(field: PoolFieldResponse): AvailableGolfer[] {
  if (field.players) return [...field.players].sort(lastNameSort);
  if (field.buckets) return field.buckets.flatMap((b) => b.players).sort(lastNameSort);
  return [];
}

function fieldToBuckets(field: PoolFieldResponse): GolferBucket[] | null {
  if (!field.buckets) return null;
  return field.buckets.map((b) => ({
    bucket_number: b.bucket_number,
    label: b.label,
    golfers: [...b.players].sort(lastNameSort),
  }));
}

// Write-in "Other" golfers use negative IDs to distinguish from real dg_ids
let nextOtherId = -1;

export function EntryPage({ clubConfig }: EntryPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [entryName, setEntryName] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [otherName, setOtherName] = useState('');
  const [otherPlayers, setOtherPlayers] = useState<{ id: number; name: string }[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: pool, loading: poolLoading } = useApi(
    () => apiClient.getActivePool(clubConfig.code),
    [clubConfig.code]
  );

  const { data: field, loading: fieldLoading, error: fieldError, refetch: refetchField } =
    useApi<PoolFieldResponse>(
      () => pool ? apiClient.getPoolField(pool.id) : Promise.resolve({ pool_id: 0, variant: '' }),
      [pool?.id ?? 0]
    );

  const golfers: AvailableGolfer[] = field ? fieldToGolfers(field) : [];
  const buckets: GolferBucket[] | null = field ? fieldToBuckets(field) : null;

  const handleSelect = (dgId: number) => {
    setSelectedIds((prev) => [...prev, dgId]);
    setValidationErrors([]);
  };

  const handleDeselect = (dgId: number) => {
    setSelectedIds((prev) => prev.filter((id) => id !== dgId));
    setOtherPlayers((prev) => prev.filter((p) => p.id !== dgId));
    setValidationErrors([]);
  };

  const handleAddOther = () => {
    const trimmed = otherName.trim();
    if (!trimmed) return;
    const id = nextOtherId--;
    setOtherPlayers((prev) => [...prev, { id, name: trimmed }]);
    setSelectedIds((prev) => [...prev, id]);
    setOtherName('');
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const result = validateEntryForm(
      email,
      entryName,
      selectedIds,
      clubConfig,
      clubConfig.useBuckets ? (buckets ?? []) : null,
    );

    if (!result.valid) {
      setValidationErrors(result.errors);
      return;
    }

    setSubmitting(true);
    try {
      // Build picks array with pick_slot (1-indexed) and optional bucket_number
      const picks = selectedIds.map((dgId, index) => {
        const pick_slot = index + 1;
        const other = otherPlayers.find((p) => p.id === dgId);
        if (other) {
          return { dg_id: 0, pick_slot, player_name: other.name };
        }
        if (buckets) {
          const bucket = buckets.find((b) => b.golfers.some((g) => g.dg_id === dgId));
          return { dg_id: dgId, pick_slot, bucket_number: bucket?.bucket_number };
        }
        return { dg_id: dgId, pick_slot };
      });

      const response: EntrySubmissionResponse = await apiClient.submitEntry(pool!.id, {
        email,
        entry_name: entryName,
        picks,
      });

      navigate('/confirmation', { state: { confirmation: response } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (poolLoading || fieldLoading) return <LoadingState message="Loading entry form..." />;
  if (fieldError) return <ErrorState message={fieldError} onRetry={refetchField} />;
  if (!pool) return <ErrorState message="No active pool found." />;

  return (
    <div className="page entry-page">
      <h1>Submit Entry</h1>
      <p className="entry-subtitle">{clubConfig.shortName} — Pick your {clubConfig.pickCount} golfers</p>

      <form onSubmit={handleSubmit} className="entry-form" data-testid="entry-form">
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            data-testid="email-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="entryName">Entry Name</label>
          <input
            id="entryName"
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
            selectedIds={selectedIds}
            clubConfig={clubConfig}
            onSelect={handleSelect}
            onDeselect={handleDeselect}
          />
        ) : (
          golfers.length > 0 && (
            <GolferPicker
              golfers={golfers}
              selectedIds={selectedIds}
              clubConfig={clubConfig}
              buckets={null}
              onSelect={handleSelect}
              onDeselect={handleDeselect}
            />
          )
        )}

        <div className="other-player-section" data-testid="other-player-section">
          <h4>Other</h4>
          <p className="picker-instruction">Don't see your player? Type their name below.</p>
          {otherPlayers.length > 0 && (
            <div className="other-player-list">
              {otherPlayers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="golfer-option selected"
                  onClick={() => handleDeselect(p.id)}
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
              disabled={!otherName.trim()}
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
          className="btn btn-primary"
          disabled={submitting}
          data-testid="submit-button"
        >
          {submitting ? 'Submitting...' : 'Submit Entry'}
        </button>
      </form>
    </div>
  );
}
