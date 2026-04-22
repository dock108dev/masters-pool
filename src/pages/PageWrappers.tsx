import { useClubOutletContext } from './ClubOutlet';
import { HomePage } from './HomePage';
import { RulesPage } from './RulesPage';
import { EntryPage } from './EntryPage';
import { ConfirmationPage } from './ConfirmationPage';
import { LeaderboardPage } from './LeaderboardPage';
import { EntryDetailPage } from './EntryDetailPage';
import { LookupPage } from './LookupPage';
import { PoolWizardPage } from './PoolWizardPage';
import { CoordinatorDashboardPage } from './CoordinatorDashboardPage';
import { PublicEntryPage } from './PublicEntryPage';
import { PublicConfirmationPage } from './PublicConfirmationPage';
import { BrandingSettingsPage } from './BrandingSettingsPage';
import { BillingPage } from './BillingPage';
import { PoolListingPage } from './PoolListingPage';

export function HomePageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <HomePage clubConfig={clubConfig} />;
}

export function RulesPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <RulesPage clubConfig={clubConfig} />;
}

export function EntryPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <EntryPage clubConfig={clubConfig} />;
}

export function ConfirmationPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <ConfirmationPage clubConfig={clubConfig} />;
}

export function LeaderboardPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <LeaderboardPage clubConfig={clubConfig} />;
}

export function EntryDetailPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <EntryDetailPage clubConfig={clubConfig} />;
}

export function LookupPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <LookupPage clubConfig={clubConfig} />;
}

export function PoolWizardPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <PoolWizardPage clubConfig={clubConfig} />;
}

export function CoordinatorDashboardPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <CoordinatorDashboardPage clubConfig={clubConfig} />;
}

export function PublicEntryPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <PublicEntryPage clubConfig={clubConfig} />;
}

export function PublicConfirmationPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <PublicConfirmationPage clubConfig={clubConfig} />;
}

export function BrandingSettingsPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <BrandingSettingsPage clubConfig={clubConfig} />;
}

export function BillingPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <BillingPage clubConfig={clubConfig} />;
}

export function PoolListingPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <PoolListingPage clubConfig={clubConfig} />;
}
