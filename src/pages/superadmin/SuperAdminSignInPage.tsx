import { SignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export function SuperAdminSignInPage() {
  const location = useLocation();
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ?? '/';

  return (
    <div className="main-content admin-sign-in" data-testid="superadmin-sign-in">
      <h1>Platform Admin Sign In</h1>
      <SignIn afterSignInUrl={returnTo} redirectUrl={returnTo} />
    </div>
  );
}
