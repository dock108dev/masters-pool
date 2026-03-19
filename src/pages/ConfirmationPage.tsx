import { Link, useLocation } from 'react-router-dom';
import type { ClubConfig, EntrySubmissionResponse } from '../types/domain';

interface ConfirmationPageProps {
  clubConfig: ClubConfig;
}

export function ConfirmationPage({ clubConfig }: ConfirmationPageProps) {
  const location = useLocation();
  const confirmation = (location.state as { confirmation?: EntrySubmissionResponse } | null)?.confirmation;

  if (!confirmation) {
    return (
      <div className="page confirmation-page">
        <h1>No Confirmation Found</h1>
        <p>It looks like you arrived here without submitting an entry.</p>
        <Link to={`/${clubConfig.code}/entry`} className="btn btn-primary">Submit an Entry</Link>
      </div>
    );
  }

  return (
    <div className="page confirmation-page" data-testid="confirmation-page">
      <h1>Entry Submitted!</h1>
      <div className="confirmation-details">
        <p><strong>Confirmation Code:</strong> {confirmation.confirmationCode}</p>
        <p><strong>Email:</strong> {confirmation.email}</p>
        <p><strong>Display Name:</strong> {confirmation.displayName}</p>
        <p><strong>Submitted:</strong> {new Date(confirmation.submittedAt).toLocaleString()}</p>
        <div className="confirmation-golfers">
          <h3>Your Picks:</h3>
          <ol>
            {confirmation.golferNames.map((name, i) => (
              <li key={i}>{name}</li>
            ))}
          </ol>
        </div>
      </div>
      <div className="confirmation-actions">
        <Link to={`/${clubConfig.code}/leaderboard`} className="btn btn-primary">View Leaderboard</Link>
        <Link to={`/${clubConfig.code}/entry`} className="btn btn-secondary">Submit Another Entry</Link>
      </div>
    </div>
  );
}
