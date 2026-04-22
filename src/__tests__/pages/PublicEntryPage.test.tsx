import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient, MOCK_LOCKED_AT } from '../../api/mock/adapters';
import { MOCK_RVCC_POOL } from '../../api/mock/data';
import { PublicEntryPage } from '../../pages/PublicEntryPage';
import { getClubConfig } from '../../config/clubs';
import { validatePublicEntryForm } from '../../utils/validation';

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
const RVCC_TOKEN = MOCK_RVCC_POOL.pool_token!;

function renderPublicEntryPage(
  initialPath = `/enter/${RVCC_TOKEN}`,
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/enter/:poolToken"
          element={<PublicEntryPage clubConfig={rvccConfig} />}
        />
        <Route
          path="/leaderboard"
          element={<div data-testid="leaderboard-page">Leaderboard</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicEntryPage', () => {
  describe('loading state', () => {
    it('shows a loading indicator before data resolves', () => {
      renderPublicEntryPage();
      // delay(0) is a macrotask — loading state is visible on initial render
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('locked pool', () => {
    it('renders Entries are Closed state and hides the form', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Entries are Closed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });

    it('locked banner includes the locked_at timestamp', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      renderPublicEntryPage();

      await waitFor(() => {
        const banner = screen.queryByTestId('pool-locked-banner');
        expect(banner?.textContent).toContain(new Date(MOCK_LOCKED_AT).toLocaleString());
      });
    });

    it('locked banner includes a link to the leaderboard', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();
    });
  });

  describe('closed pool (status = final)', () => {
    it('renders Entries are Closed state and hides the form', async () => {
      activeClient = new MockApiClient(
        0, [], [], null, false, false, [], false, 'Mock Club', [MOCK_RVCC_POOL.id],
      );
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Entries are Closed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });

    it('closed pool banner includes a link to the leaderboard', async () => {
      activeClient = new MockApiClient(
        0, [], [], null, false, false, [], false, 'Mock Club', [MOCK_RVCC_POOL.id],
      );
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      expect(screen.getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();
    });
  });

  describe('open pool', () => {
    it('renders the entry form when the pool is not locked', async () => {
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('entry-form')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('pool-locked-banner')).not.toBeInTheDocument();
    });

    it('shows token-error state for an unknown/expired token', async () => {
      renderPublicEntryPage(`/enter/unknown-token-that-does-not-exist`);

      await waitFor(() => {
        expect(screen.getByTestId('token-error')).toBeInTheDocument();
      });
      expect(screen.getByText(/Pool Not Found/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });

  describe('successful submission', () => {
    it('redirects to /leaderboard?submitted=true after submitting all picks', async () => {
      const user = userEvent.setup();
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('entry-form')).toBeInTheDocument();
      });

      await user.type(screen.getByTestId('display-name-input'), 'Test Entry');

      // RVCC requires 7 picks; roster is sorted by worldRank so select top-7
      const golferIds = [18417, 27349, 28237, 21209, 31560, 52955, 30925];
      for (let i = 0; i < golferIds.length; i++) {
        await user.click(screen.getByTestId(`slot-trigger-${i}`));
        await user.click(screen.getByTestId(`slot-option-${golferIds[i]}`));
      }

      await user.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-page')).toBeInTheDocument();
      });
    });
  });
});

describe('validatePublicEntryForm — optional email', () => {
  // RVCC flat picks: need exactly 7 golfer IDs
  const sevenIds = [18417, 27349, 28237, 21209, 31560, 52955, 30925];

  it('accepts an empty email string', () => {
    const result = validatePublicEntryForm('', 'Test Entry', sevenIds, rvccConfig, null);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('accepts a valid email when provided', () => {
    const result = validatePublicEntryForm('user@example.com', 'Test Entry', sevenIds, rvccConfig, null);
    expect(result.valid).toBe(true);
  });

  it('rejects a malformed email when provided', () => {
    const result = validatePublicEntryForm('not-an-email', 'Test Entry', sevenIds, rvccConfig, null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Please enter a valid email address.');
  });

  it('still requires a display name', () => {
    const result = validatePublicEntryForm('', '', sevenIds, rvccConfig, null);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /display name/i.test(e))).toBe(true);
  });

  it('still requires the correct pick count', () => {
    const result = validatePublicEntryForm('', 'Test Entry', sevenIds.slice(0, 5), rvccConfig, null);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => /exactly 7/i.test(e))).toBe(true);
  });
});
