import { Outlet } from 'react-router-dom';
import { useClubConfig } from '../hooks/useClubConfig';
import { Layout } from '../components/layout/Layout';
import { ErrorState } from '../components/common/ErrorState';

export function ClubRoot() {
  const { clubConfig, error } = useClubConfig();

  if (!clubConfig) {
    return (
      <div className="app-layout">
        <main className="main-content">
          <ErrorState message={error ?? 'Unknown club'} />
        </main>
      </div>
    );
  }

  return (
    <Layout clubConfig={clubConfig}>
      <Outlet context={{ clubConfig }} />
    </Layout>
  );
}
