import { SignIn, useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

export function AdminSignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? '/admin';

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Navigate to={returnTo} replace />;
  }

  return (
    <div className="sign-in-page" data-testid="sign-in-page">
      <SignIn forceRedirectUrl={returnTo} />
    </div>
  );
}
