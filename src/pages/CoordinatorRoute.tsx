import type { ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

interface CoordinatorRouteProps {
  children: ReactNode;
}

export function CoordinatorRoute({ children }: CoordinatorRouteProps) {
  const { isSignedIn, orgRole, isLoaded } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="main-content">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate to="/admin/sign-in" state={{ returnTo: location.pathname }} replace />
    );
  }

  if (orgRole !== 'org:admin') {
    return (
      <div className="main-content" role="alert">
        <h1>Access Denied</h1>
        <p>Club coordinator access required. Your account does not have admin privileges for this club.</p>
      </div>
    );
  }

  return <>{children}</>;
}
