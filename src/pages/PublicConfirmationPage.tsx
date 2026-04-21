import { useParams, useLocation, Link } from 'react-router-dom';
import type { ClubConfig, EntrySubmissionResponse } from '../types/domain';

interface PublicConfirmationPageProps {
  clubConfig: ClubConfig;
}

export function PublicConfirmationPage({ clubConfig: _clubConfig }: PublicConfirmationPageProps) {
  const { clubCode, poolToken } = useParams<{ clubCode: string; poolToken: string }>();
  const location = useLocation();
  const confirmation = (
    location.state as { confirmation?: EntrySubmissionResponse } | null
  )?.confirmation;

  const entryUrl =
    typeof window !== 'undefined' && clubCode && poolToken
      ? `${window.location.origin}/${clubCode}/enter/${poolToken}`
      : null;

  if (!confirmation) {
    return (
      <div className="page confirmation-page">
        <h1>No Confirmation Found</h1>
        <p>It looks like you arrived here without submitting an entry.</p>
        {entryUrl && <Link to={`/${clubCode}/enter/${poolToken}`} className="btn btn-primary">Submit an Entry</Link>}
      </div>
    );
  }

  return (
    <div className="page confirmation-page" data-testid="public-confirmation-page">
      <h1>Entry Submitted!</h1>
      <div className="confirmation-details">
        <p><strong>Confirmation Code:</strong> {confirmation.confirmationCode}</p>
        {confirmation.email && (
          <p><strong>Email:</strong> {confirmation.email}</p>
        )}
        <p><strong>Entry Name:</strong> {confirmation.entry_name}</p>
        <p><strong>Submitted:</strong> {new Date(confirmation.submittedAt).toLocaleString()}</p>
        <div className="confirmation-golfers">
          <h3>Your Picks:</h3>
          <ol>
            {confirmation.picks.map((pick, i) => (
              <li key={i}>
                Pick {pick.pick_slot}: {pick.player_name ?? `dg_id ${pick.dg_id}`}
                {pick.bucket_number != null ? ` (Bucket ${pick.bucket_number})` : ''}
              </li>
            ))}
          </ol>
        </div>
      </div>
      {entryUrl && (
        <div className="confirmation-share" data-testid="shareable-link">
          <p><strong>Share this entry link:</strong></p>
          <code>{entryUrl}</code>
        </div>
      )}
      <div className="confirmation-actions">
        <Link to={`/${clubCode}/leaderboard`} className="btn btn-primary">View Leaderboard</Link>
        {entryUrl && (
          <Link to={`/${clubCode}/enter/${poolToken}`} className="btn btn-secondary">Submit Another Entry</Link>
        )}
      </div>
    </div>
  );
}
