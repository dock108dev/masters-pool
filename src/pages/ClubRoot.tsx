import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
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

  return (
    <Layout clubConfig={clubConfig} poolId={pool?.id ?? null}>
      <Outlet context={{ clubConfig }} />
    </Layout>
  );
}
