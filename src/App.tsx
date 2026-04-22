import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import { AuthProvider } from './auth/AuthProvider';
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
  BillingPageWrapper,
  PoolListingPageWrapper,
} from './pages/PageWrappers';
import { OnboardHomePage } from './pages/onboard/OnboardHomePage';
import { CheckoutPage } from './pages/onboard/CheckoutPage';
import { CheckoutSuccessPage } from './pages/onboard/CheckoutSuccessPage';
import { OnboardingWizardPage } from './pages/onboard/OnboardingWizardPage';
import { SuperAdminDashboard } from './pages/superadmin/SuperAdminDashboard';
import { AdminSignInPage } from './pages/admin/AdminSignInPage';
import { SignUpPage } from './pages/admin/SignUpPage';
import { MagicLinkVerifyPage } from './pages/admin/MagicLinkVerifyPage';
import { PasswordResetRequestPage } from './pages/admin/PasswordResetRequestPage';
import { PasswordResetPage } from './pages/admin/PasswordResetPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { CoordinatorLayout } from './pages/CoordinatorLayout';
import { classifyHost, type HostKind } from './config/host';

function RouteChangeTracker() {
  const location = useLocation();
  const { capture } = useAnalytics();
  useEffect(() => {
    capture('page_view', { path: location.pathname });
  }, [location.pathname, capture]);
  return null;
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
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
      <Route path="/admin/onboarding" element={<OnboardingWizardPage />} />
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
        <Route path="admin/sign-in" element={<AdminSignInPage />} />
        <Route path="admin/sign-up" element={<SignUpPage />} />
        <Route path="admin/auth/magic-link" element={<MagicLinkVerifyPage />} />
        <Route path="admin/auth/forgot" element={<PasswordResetRequestPage />} />
        <Route path="admin/auth/reset" element={<PasswordResetPage />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <CoordinatorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PoolListingPageWrapper />} />
          <Route path="pools" element={<PoolListingPageWrapper />} />
          <Route path="pools/new" element={<PoolWizardPageWrapper />} />
          <Route path="pools/:poolId" element={<CoordinatorDashboardPageWrapper />} />
          <Route path="branding" element={<BrandingSettingsPageWrapper />} />
          <Route path="billing" element={<BillingPageWrapper />} />
        </Route>
      </Route>
    </Routes>
  );
}

function routesForHost(host: HostKind) {
  switch (host.kind) {
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
    <AuthProvider>
      <BrowserRouter>
        <RouteChangeTracker />
        {routesForHost(host)}
      </BrowserRouter>
    </AuthProvider>
  );
}
