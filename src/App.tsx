import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
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
import { CoordinatorRoute } from './pages/CoordinatorRoute';
import { AdminSignInPage } from './pages/AdminSignInPage';
import { CoordinatorSignUpPage } from './pages/CoordinatorSignUpPage';
import { OnboardHomePage } from './pages/onboard/OnboardHomePage';
import { OnboardWelcomePage } from './pages/onboard/OnboardWelcomePage';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { SuperAdminRoute } from './pages/superadmin/SuperAdminRoute';
import { SuperAdminSignInPage } from './pages/superadmin/SuperAdminSignInPage';
import { classifyHost, type HostKind } from './config/host';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined ?? '';

function ApexRedirect() {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const hostname = window.location.hostname;
    // On localhost, redirect to onboard.localhost for local dev consistency.
    // In prod, the nginx layer should already 301 apex → onboard; this is a fallback.
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
        No site is configured for <code>{subdomain}</code>. Visit{' '}
        <a href="https://onboard.dock108.dev">onboard.dock108.dev</a> to learn more.
      </p>
    </div>
  );
}

function OnboardRoutes() {
  return (
    <Routes>
      <Route path="/" element={<OnboardHomePage />} />
      <Route path="/sign-up" element={<CoordinatorSignUpPage />} />
      <Route path="/welcome" element={<OnboardWelcomePage />} />
      <Route path="*" element={<OnboardHomePage />} />
    </Routes>
  );
}

function SuperAdminRoutes() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SuperAdminSignInPage />} />
      <Route
        path="/"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />
      <Route
        path="*"
        element={
          <SuperAdminRoute>
            <SuperAdminDashboard />
          </SuperAdminRoute>
        }
      />
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
        <Route path="admin/sign-in" element={<AdminSignInPage />} />
        <Route
          path="admin"
          element={
            <CoordinatorRoute>
              <PoolListingPageWrapper />
            </CoordinatorRoute>
          }
        />
        <Route
          path="admin/pools"
          element={
            <CoordinatorRoute>
              <PoolListingPageWrapper />
            </CoordinatorRoute>
          }
        />
        <Route
          path="admin/pools/new"
          element={
            <CoordinatorRoute>
              <PoolWizardPageWrapper />
            </CoordinatorRoute>
          }
        />
        <Route
          path="admin/pools/:poolId"
          element={
            <CoordinatorRoute>
              <CoordinatorDashboardPageWrapper />
            </CoordinatorRoute>
          }
        />
        <Route
          path="admin/branding"
          element={
            <CoordinatorRoute>
              <BrandingSettingsPageWrapper />
            </CoordinatorRoute>
          }
        />
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
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>{routesForHost(host)}</BrowserRouter>
    </ClerkProvider>
  );
}
