import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClubConfig, AvailableGolfer, GolferBucket, EntrySubmissionResponse } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { validateEntryForm } from '../utils/validation';
import { GolferPicker } from '../components/entry/GolferPicker';
import { BucketPicker } from '../components/entry/BucketPicker';
import { FileUpload } from '../components/entry/FileUpload';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

interface EntryPageProps {
  clubConfig: ClubConfig;
}

export function EntryPage({ clubConfig }: EntryPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | undefined>();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: tournament, loading: tournLoading } = useApi(
    async () => {
      const summary = await apiClient.getActiveTournament(clubConfig.code);
      return summary;
    },
    [clubConfig.code]
  );

  const { data: golfers, loading: golfersLoading, error: golfersError, refetch: refetchGolfers } = useApi<AvailableGolfer[]>(
    () => tournament ? apiClient.getAvailableGolfers(tournament.id) : Promise.resolve([]),
    [tournament?.id ?? '']
  );

  const { data: buckets } = useApi<GolferBucket[]>(
    () => (tournament && clubConfig.useBuckets) ? apiClient.getGolferBuckets(tournament.id) : Promise.resolve([]),
    [tournament?.id ?? '', clubConfig.useBuckets]
  );

  const handleSelect = (golferId: string) => {
    setSelectedIds((prev) => [...prev, golferId]);
    setValidationErrors([]);
  };

  const handleDeselect = (golferId: string) => {
    setSelectedIds((prev) => prev.filter((id) => id !== golferId));
    setValidationErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const result = validateEntryForm(
      email,
      displayName,
      selectedIds,
      clubConfig,
      clubConfig.useBuckets ? (buckets ?? []) : null,
      uploadFile
    );

    if (!result.valid) {
      setValidationErrors(result.errors);
      return;
    }

    setSubmitting(true);
    try {
      const response: EntrySubmissionResponse = await apiClient.submitEntry({
        clubCode: clubConfig.code,
        tournamentId: tournament!.id,
        email,
        displayName,
        golferIds: selectedIds,
        uploadFile,
      });

      navigate(`/${clubConfig.code}/confirmation`, { state: { confirmation: response } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (tournLoading || golfersLoading) return <LoadingState message="Loading entry form..." />;
  if (golfersError) return <ErrorState message={golfersError} onRetry={refetchGolfers} />;
  if (!tournament) return <ErrorState message="No active tournament found." />;

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
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
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
          golfers && (
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

        <FileUpload
          clubConfig={clubConfig}
          selectedFile={uploadFile}
          onFileSelect={setUploadFile}
        />

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
