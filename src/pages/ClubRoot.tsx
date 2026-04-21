import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SignedOut } from '@clerk/clerk-react';
import { useClubConfig } from '../hooks/useClubConfig';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { Layout } from '../components/layout/Layout';
import { ErrorState } from '../components/common/ErrorState';

const DEFAULT_PRIMARY = '#1e3a5f';
const DEFAULT_ACCENT = '#c9a84c';

function applyBrandingDefaults() {
  document.documentElement.style.setProperty('--club-primary', DEFAULT_PRIMARY);
  document.documentElement.style.setProperty('--club-accent', DEFAULT_ACCENT);
}

export function ClubRoot() {
  const { clubConfig, error } = useClubConfig();
  const location = useLocation();
  const clubCode = clubConfig?.code;

  const { data: pool } = useApi(
    () => (clubConfig ? apiClient.getActivePool(clubConfig.code) : Promise.resolve(null)),
    [clubConfig?.code ?? ''],
  );

  useEffect(() => {
    if (!clubCode) return;
    apiClient
      .getClubBranding(clubCode)
      .then((branding) => {
        document.documentElement.style.setProperty(
          '--club-primary',
          branding.primary_color ?? DEFAULT_PRIMARY,
        );
        document.documentElement.style.setProperty(
          '--club-accent',
          branding.accent_color ?? DEFAULT_ACCENT,
        );
      })
      .catch((err: unknown) => {
        console.warn('[ClubRoot] Could not load branding; using defaults:', err);
        applyBrandingDefaults();
      });
  }, [clubCode]);

  if (!clubConfig) {
    return (
      <div className="app-layout">
        <main className="main-content">
          <ErrorState message={error ?? 'Unknown club'} />
        </main>
      </div>
    );
  }

  const isAdminPath = /\/admin(\/|$)/.test(location.pathname);

  return (
    <Layout clubConfig={clubConfig} poolId={pool?.id ?? null}>
      {isAdminPath && (
        <SignedOut>
          <div className="coordinator-signin-bar" data-testid="coordinator-signin-bar">
            <Link
              to={`/${clubConfig.code}/admin/sign-in`}
              className="coordinator-signin-link"
            >
              Coordinator sign-in
            </Link>
          </div>
        </SignedOut>
      )}
      <Outlet context={{ clubConfig }} />
    </Layout>
  );
}
