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
import { MarketingPage } from './pages/MarketingPage';
import { CoordinatorSignUpPage } from './pages/CoordinatorSignUpPage';
import { AdminDashboard } from './pages/AdminDashboard';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined ?? '';

export default function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MarketingPage />} />
          <Route path="/sign-up" element={<CoordinatorSignUpPage />} />
          <Route path="/:clubCode" element={<ClubRoot />}>
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
                  <AdminDashboard />
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
      </BrowserRouter>
    </ClerkProvider>
  );
}
