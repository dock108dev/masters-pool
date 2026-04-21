import { SignIn } from '@clerk/clerk-react';
import { useLocation } from 'react-router-dom';

export function AdminSignInPage() {
  const location = useLocation();
  // returnTo is set by CoordinatorRoute when redirecting unauthenticated users
  const returnTo =
    (location.state as { returnTo?: string } | null)?.returnTo ??
    location.pathname.replace('/sign-in', '');

  return (
    <div className="main-content admin-sign-in">
      <h1>Coordinator Sign In</h1>
      <SignIn afterSignInUrl={returnTo} redirectUrl={returnTo} />
    </div>
  );
}
