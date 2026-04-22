import { Link } from 'react-router-dom';

export function PendingClubBanner() {
  return (
    <div className="pending-club-banner" role="alert" data-testid="pending-club-banner">
      <span className="pending-club-banner-text">
        You have an incomplete setup — finish setting up your club.
      </span>
      <Link
        to="/admin/onboarding"
        className="pending-club-banner-link"
        data-testid="resume-setup-link"
      >
        Resume Setup
      </Link>
    </div>
  );
}
