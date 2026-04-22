import { Outlet } from 'react-router-dom';
import { usePendingClub } from '../hooks/usePendingClub';
import { PendingClubBanner } from '../components/coordinator/PendingClubBanner';

export function CoordinatorLayout() {
  const { pendingClub } = usePendingClub();

  return (
    <>
      {pendingClub && <PendingClubBanner />}
      <Outlet />
    </>
  );
}
