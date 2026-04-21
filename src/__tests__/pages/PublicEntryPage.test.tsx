import { render, screen, waitFor } from '@testing-library/react';
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
  initialPath = `/rvcc/enter/${RVCC_TOKEN}`,
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/:clubCode/enter/:poolToken"
          element={<PublicEntryPage clubConfig={rvccConfig} />}
        />
        <Route
          path="/:clubCode/enter/:poolToken/confirmation"
          element={<div data-testid="public-confirmation-page">Confirmed</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('PublicEntryPage', () => {
  describe('locked pool', () => {
    it('renders Pool is Closed state and hides the form', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      expect(screen.getByText(/Pool is Closed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });

    it('locked banner includes the locked_at timestamp', async () => {
      activeClient = new MockApiClient(0, [MOCK_RVCC_POOL.id]);
      renderPublicEntryPage();

      await waitFor(() => {
        expect(screen.getByTestId('pool-locked-banner')).toBeInTheDocument();
      });
      const banner = screen.getByTestId('pool-locked-banner');
      expect(banner.textContent).toContain(new Date(MOCK_LOCKED_AT).toLocaleString());
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

    it('shows "Pool Not Found" for an unknown token', async () => {
      renderPublicEntryPage(`/rvcc/enter/unknown-token-that-does-not-exist`);

      await waitFor(() => {
        expect(screen.getByText(/Pool Not Found/i)).toBeInTheDocument();
      });
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
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
