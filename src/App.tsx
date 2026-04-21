import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClubRoot } from './pages/ClubRoot';
import {
  HomePageWrapper,
  RulesPageWrapper,
  EntryPageWrapper,
  ConfirmationPageWrapper,
  LeaderboardPageWrapper,
  EntryDetailPageWrapper,
  LookupPageWrapper,
  PoolWizardPageWrapper,
  CoordinatorDashboardPageWrapper,
  PublicEntryPageWrapper,
  PublicConfirmationPageWrapper,
  BrandingSettingsPageWrapper,
  PoolListingPageWrapper,
} from './pages/PageWrappers';
import { OnboardHomePage } from './pages/onboard/OnboardHomePage';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { classifyHost, type HostKind } from './config/host';

function ApexRedirect() {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const hostname = window.location.hostname;
    const targetHost = hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'onboard.localhost'
      : `onboard.${hostname}`;
    window.location.replace(`${protocol}//${targetHost}${port}${window.location.pathname}`);
  }
  return <div className="main-content"><p>Redirecting…</p></div>;
}

function UnknownHostPage({ subdomain }: { subdomain: string }) {
  return (
    <div className="main-content" role="alert" data-testid="unknown-host">
      <h1>Unknown site</h1>
      <p>
        No site is configured for <code>{subdomain}</code>.
      </p>
    </div>
  );
}

function OnboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<OnboardHomePage />} />
      <Route path="*" element={<OnboardHomePage />} />
    </Routes>
  );
}

function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SuperAdminDashboard />} />
      <Route path="*" element={<SuperAdminDashboard />} />
    </Routes>
  );
}

function ClubRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ClubRoot />}>
        <Route index element={<HomePageWrapper />} />
        <Route path="rules" element={<RulesPageWrapper />} />
        <Route path="entry" element={<EntryPageWrapper />} />
        <Route path="confirmation" element={<ConfirmationPageWrapper />} />
        <Route path="leaderboard" element={<LeaderboardPageWrapper />} />
        <Route path="leaderboard/entry/:entryId" element={<EntryDetailPageWrapper />} />
        <Route path="lookup" element={<LookupPageWrapper />} />
        <Route path="enter/:poolToken" element={<PublicEntryPageWrapper />} />
        <Route path="enter/:poolToken/confirmation" element={<PublicConfirmationPageWrapper />} />
        <Route path="admin" element={<PoolListingPageWrapper />} />
        <Route path="admin/pools" element={<PoolListingPageWrapper />} />
        <Route path="admin/pools/new" element={<PoolWizardPageWrapper />} />
        <Route path="admin/pools/:poolId" element={<CoordinatorDashboardPageWrapper />} />
        <Route path="admin/branding" element={<BrandingSettingsPageWrapper />} />
      </Route>
    </Routes>
  );
}

function routesForHost(host: HostKind) {
  switch (host.kind) {
    case 'apex':
      return <ApexRedirect />;
    case 'onboard':
      return <OnboardRoutes />;
    case 'admin':
      return <SuperAdminRoutes />;
    case 'club':
      return <ClubRoutes />;
    case 'unknown':
      return <UnknownHostPage subdomain={host.subdomain} />;
  }
}

export default function App() {
  const host = classifyHost();
  return <BrowserRouter>{routesForHost(host)}</BrowserRouter>;
}
