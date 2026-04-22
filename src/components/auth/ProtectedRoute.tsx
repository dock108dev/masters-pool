import type { ReactNode } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return (
      <Navigate to="/admin/sign-in" state={{ returnTo: location.pathname }} replace />
    );
  }

  return <>{children}</>;
}

export function AdminSignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      className="admin-sign-out-btn"
      data-testid="admin-sign-out-btn"
      onClick={() => void signOut({ redirectUrl: '/admin/sign-in' })}
    >
      Sign out
    </button>
  );
}
