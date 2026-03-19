import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ConfirmationPage } from '../../pages/ConfirmationPage';
import { getClubConfig } from '../../config/clubs';
import type { EntrySubmissionResponse } from '../../types/domain';

const rvccConfig = getClubConfig('rvcc');

const mockConfirmation: EntrySubmissionResponse = {
  entryId: 'entry-test-001',
  confirmationCode: 'CONF-TEST99',
  email: 'user@example.com',
  displayName: 'Test Player',
  golferNames: ['Scottie Scheffler', 'Rory McIlroy', 'Jon Rahm'],
  submittedAt: '2026-04-09T10:00:00Z',
};

function renderConfirmationPage(state?: { confirmation?: EntrySubmissionResponse }) {
  const initialPath = '/rvcc/confirmation';
  const initialEntries = state !== undefined
    ? [{ pathname: initialPath, state }]
    : [initialPath];

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/:club/confirmation" element={<ConfirmationPage clubConfig={rvccConfig} />} />
        <Route path="/:club/entry" element={<div data-testid="entry-page">Entry Page</div>} />
        <Route path="/:club/leaderboard" element={<div data-testid="leaderboard-page">Leaderboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ConfirmationPage', () => {
  describe('without confirmation state', () => {
    it('shows "No Confirmation Found" heading', () => {
      renderConfirmationPage();
      expect(screen.getByRole('heading', { name: /No Confirmation Found/i })).toBeInTheDocument();
    });

    it('shows the fallback description text', () => {
      renderConfirmationPage();
      expect(screen.getByText(/arrived here without submitting an entry/i)).toBeInTheDocument();
    });

    it('renders a link back to the entry page', () => {
      renderConfirmationPage();
      const link = screen.getByRole('link', { name: /Submit an Entry/i });
      expect(link).toBeInTheDocument();
    });
  });

  describe('with confirmation state', () => {
    it('shows "Entry Submitted!" heading', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByRole('heading', { name: /Entry Submitted!/i })).toBeInTheDocument();
    });

    it('shows the confirmation code', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByText(/CONF-TEST99/)).toBeInTheDocument();
    });

    it('shows the email address', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
    });

    it('shows the display name', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByText(/Test Player/)).toBeInTheDocument();
    });

    it('shows the list of golfer picks', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByText('Scottie Scheffler')).toBeInTheDocument();
      expect(screen.getByText('Rory McIlroy')).toBeInTheDocument();
      expect(screen.getByText('Jon Rahm')).toBeInTheDocument();
    });

    it('renders the confirmation page container', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByTestId('confirmation-page')).toBeInTheDocument();
    });

    it('renders leaderboard and submit another entry links', () => {
      renderConfirmationPage({ confirmation: mockConfirmation });
      expect(screen.getByRole('link', { name: /View Leaderboard/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Submit Another Entry/i })).toBeInTheDocument();
    });
  });

  describe('with state containing no confirmation key', () => {
    it('shows "No Confirmation Found" when state has no confirmation property', () => {
      renderConfirmationPage({});
      expect(screen.getByRole('heading', { name: /No Confirmation Found/i })).toBeInTheDocument();
    });
  });
});
