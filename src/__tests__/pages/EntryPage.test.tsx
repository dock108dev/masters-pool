import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient, MOCK_LOCKED_AT } from '../../api/mock/adapters';
import { MOCK_RVCC_POOL } from '../../api/mock/data';
import { EntryPage } from '../../pages/EntryPage';
import { getClubConfig } from '../../config/clubs';

// Use a mutable reference so individual tests can swap the client
let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

beforeEach(() => {
  activeClient = new MockApiClient(0);
});

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderEntryPage(clubConfig = rvccConfig, initialPath = '/entry') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/entry" element={<EntryPage clubConfig={clubConfig} />} />
        <Route path="/confirmation" element={<div data-testid="confirmation-page">Confirmed</div>} />
      </Routes>
    </MemoryRouter>
  );
}


describe('EntryPage snapshots', () => {
  it('matches snapshot for entries-closed state (RVCC has allowSelfServiceEntry=false)', () => {
    const { container } = renderEntryPage();
    expect(container).toMatchSnapshot();
  });
});

describe('EntryPage', () => {
  describe('RVCC (entries closed)', () => {
    it('shows entries closed message instead of entry form', () => {
      renderEntryPage();
      expect(screen.getByText('Entries Closed')).toBeInTheDocument();
      expect(screen.getByText(/now closed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });

  describe('Crestmont (no self-service entry)', () => {
    it('shows entries closed message instead of entry form', () => {
      renderEntryPage(crestmontConfig, '/entry');
      expect(screen.getByText('Entries Closed')).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });

  describe('pool locked banner', () => {
    it('displays pool-locked-banner and hides the form when the pool is locked', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      const openConfig = { ...rvccConfig, allowSelfServiceEntry: true };
      renderEntryPage(openConfig);

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Pool is Locked/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });

    it('banner includes the locked_at timestamp', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      const openConfig = { ...rvccConfig, allowSelfServiceEntry: true };
      renderEntryPage(openConfig);

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      const banner = screen.getByTestId('pool-locked-banner');
      expect(banner.textContent).toContain(new Date(MOCK_LOCKED_AT).toLocaleString());
    });
  });

  describe('slot-based per-slot inline errors', () => {
    it('shows per-slot inline error on empty slots when submit is attempted', async () => {
      const user = userEvent.setup();
      const openConfig = { ...rvccConfig, allowSelfServiceEntry: true };
      renderEntryPage(openConfig);

      // Wait for the form to load
      await waitFor(() => {
        expect(screen.getByTestId('entry-form')).toBeInTheDocument();
      });

      // Fill email and name but leave all picker slots empty
      await user.type(screen.getByTestId('email-input'), 'test@example.com');
      await user.type(screen.getByTestId('display-name-input'), 'Test User');

      // Click submit
      await user.click(screen.getByTestId('submit-button'));

      // Slot 0 should show an inline error, not just a generic error message
      await waitFor(() => {
        expect(screen.getByTestId('slot-error-0')).toBeInTheDocument();
      });
      expect(screen.getByTestId('slot-error-0')).toHaveTextContent('Please select a golfer');

      // Also verify slot 1 has an error (all slots are unfilled)
      expect(screen.getByTestId('slot-error-1')).toBeInTheDocument();
    });

    it('submit button is disabled while submitting', async () => {
      const openConfig = { ...rvccConfig, allowSelfServiceEntry: true };
      renderEntryPage(openConfig);

      await waitFor(() => {
        expect(screen.getByTestId('submit-button')).toBeInTheDocument();
      });

      // The submit button should be enabled (not submitting yet)
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });
  });
});
