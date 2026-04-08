import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { EntryPage } from '../../pages/EntryPage';
import { getClubConfig } from '../../config/clubs';

vi.mock('../../api/client', () => ({
  apiClient: new MockApiClient(0),
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderEntryPage(clubConfig = rvccConfig, initialPath = '/rvcc/entry') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/:club/entry" element={<EntryPage clubConfig={clubConfig} />} />
        <Route path="/:club/confirmation" element={<div data-testid="confirmation-page">Confirmed</div>} />
      </Routes>
    </MemoryRouter>
  );
}

/**
 * Wait for the RVCC entry form to be fully settled.
 *
 * EntryPage has two sequential useApi calls (tournament → golfers). With a
 * 0 ms mock delay, the golfer hook fires twice — once immediately with an empty
 * tournament dep, and again after the tournament resolves. This creates a
 * brief intermediate render where the form appears before the second golfer
 * load starts. Waiting for a golfer name (which is only present in the final
 * stable render) ensures all async activity has completed.
 */
async function waitForRvccFormStable() {
  // "Scottie Scheffler" is rendered by GolferPicker only after the real
  // golfer list has loaded (second, stable load).
  await screen.findByText('Scottie Scheffler');
}


describe('EntryPage', () => {
  describe('RVCC', () => {
    it('renders loading state initially', async () => {
      renderEntryPage();
      // Loading state is shown synchronously on the initial render
      expect(screen.getByText('Loading entry form...')).toBeInTheDocument();
      // Drain async effects to avoid act() warnings during cleanup
      await waitForRvccFormStable();
    });

    it('renders email and display name inputs after loading', async () => {
      renderEntryPage();
      await waitForRvccFormStable();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('display-name-input')).toBeInTheDocument();
    });

    it('renders golfer picker for RVCC config (no buckets)', async () => {
      renderEntryPage();
      await waitForRvccFormStable();
      // GolferPicker renders a selection counter: "0/7 selected"
      expect(screen.getByText(/0\/7 selected/i)).toBeInTheDocument();
    });

    it('shows validation errors when submitting with empty form', async () => {
      renderEntryPage();
      // Wait for stable form — see waitForRvccFormStable comment for why
      // we wait for golfer content rather than just the form element.
      await waitForRvccFormStable();
      // Use fireEvent.submit to bypass jsdom's browser-level constraint validation
      // so that React's onSubmit handler runs and displays app-level errors.
      fireEvent.submit(screen.getByTestId('entry-form'));
      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
      });
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Display name is required/i)).toBeInTheDocument();
    });

    it('shows golfer count validation error when submitting without picks', async () => {
      renderEntryPage();
      await waitForRvccFormStable();
      fireEvent.submit(screen.getByTestId('entry-form'));
      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
      });
      expect(screen.getByText(/You must select exactly 7 golfers/i)).toBeInTheDocument();
    });

    it('submit button is enabled when form loads', async () => {
      renderEntryPage();
      await waitForRvccFormStable();
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });

    it('submit button text is "Submit Entry" when not submitting', async () => {
      renderEntryPage();
      await waitForRvccFormStable();
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Submit Entry');
    });
  });

  describe('Crestmont (no self-service entry)', () => {
    it('shows club-managed message instead of entry form', () => {
      renderEntryPage(crestmontConfig, '/crestmont/entry');
      expect(screen.getByText('Entries')).toBeInTheDocument();
      expect(screen.getByText(/managed by the club/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });
});
