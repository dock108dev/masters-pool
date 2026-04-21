import type { ReactNode } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';

interface SuperAdminRouteProps {
  children: ReactNode;
}

/**
 * Gates the admin subdomain on a platform-superadmin role.
 * The role is asserted via Clerk `user.publicMetadata.role === 'superadmin'`.
 * This is distinct from the per-club `org:admin` role used by CoordinatorRoute.
 */
export function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded, user } = useUser();
  const location = useLocation();

  if (!authLoaded || !userLoaded) {
    return (
      <div className="main-content">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Navigate to="/sign-in" state={{ returnTo: location.pathname }} replace />
    );
  }

  const role = user?.publicMetadata?.role;
  if (role !== 'superadmin') {
    return (
      <div className="main-content" role="alert" data-testid="superadmin-denied">
        <h1>Access Denied</h1>
        <p>Platform admin access required. This area is restricted to superadmins.</p>
      </div>
    );
  }

  return <>{children}</>;
}
