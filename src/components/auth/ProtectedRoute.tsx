import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '../../auth/useSession';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    const next = `${location.pathname}${location.search}`;
    const to = `/admin/sign-in?next=${encodeURIComponent(next)}`;
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}

export function AdminSignOutButton() {
  const { signOut } = useSession();
  return (
    <button
      className="admin-sign-out-btn"
      data-testid="admin-sign-out-btn"
      onClick={() => signOut()}
    >
      Sign out
    </button>
  );
}
