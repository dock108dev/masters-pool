import { useClubOutletContext } from './ClubOutlet';
import { HomePage } from './HomePage';
import { RulesPage } from './RulesPage';
import { EntryPage } from './EntryPage';
import { ConfirmationPage } from './ConfirmationPage';
import { LeaderboardPage } from './LeaderboardPage';
import { LookupPage } from './LookupPage';

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

export function LookupPageWrapper() {
  const { clubConfig } = useClubOutletContext();
  return <LookupPage clubConfig={clubConfig} />;
}
