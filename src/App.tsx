import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClubRoot } from './pages/ClubRoot';
import { HomePageWrapper, RulesPageWrapper, EntryPageWrapper, ConfirmationPageWrapper, LeaderboardPageWrapper, LookupPageWrapper } from './pages/PageWrappers';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/:clubCode" element={<ClubRoot />}>
          <Route index element={<HomePageWrapper />} />
          <Route path="rules" element={<RulesPageWrapper />} />
          <Route path="entry" element={<EntryPageWrapper />} />
          <Route path="confirmation" element={<ConfirmationPageWrapper />} />
          <Route path="leaderboard" element={<LeaderboardPageWrapper />} />
          <Route path="lookup" element={<LookupPageWrapper />} />
        </Route>
        <Route path="/" element={<Navigate to="/rvcc" replace />} />
        <Route path="*" element={<Navigate to="/rvcc" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
