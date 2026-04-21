import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { ClubRoot } from '../../pages/ClubRoot';

// Mock useClubConfig to return a known club
vi.mock('../../hooks/useClubConfig', () => ({
  useClubConfig: () => ({
    clubConfig: {
      code: 'rvcc',
      name: 'RVCC',
      shortName: 'RVCC',
      pickCount: 6,
      cutMinimum: 3,
      countedScores: 4,
      useBuckets: false,
      allowSelfServiceEntry: true,
      rulesDescription: [],
    },
    error: null,
  }),
}));

// Mock apiClient so ClubRoot's pool fetch doesn't make real HTTP calls.
// Fake timers are used to prevent async state updates from escaping the test.
let activeClient = new MockApiClient(0);
vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/*" element={<ClubRoot />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ClubRoot', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    // Fake timers keep async pool/lock fetches from completing during synchronous tests,
    // preventing act() warnings from state updates that escape test boundaries.
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
  describe('branding CSS custom properties', () => {
    afterEach(() => {
      document.documentElement.style.removeProperty('--club-primary');
      document.documentElement.style.removeProperty('--club-accent');
    });

    it('sets --club-primary when branding returns a primary_color', async () => {
      vi.useRealTimers();
      vi.spyOn(activeClient, 'getClubBranding').mockResolvedValue({
        logo_url: null,
        primary_color: '#123456',
        accent_color: null,
      });
      renderAt('/leaderboard');
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--club-primary')).toBe('#123456');
      });
    });

    it('applies default colors when branding fetch fails', async () => {
      vi.useRealTimers();
      vi.spyOn(activeClient, 'getClubBranding').mockRejectedValue(new Error('not found'));
      renderAt('/leaderboard');
      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue('--club-primary')).toBe('#1e3a5f');
        expect(document.documentElement.style.getPropertyValue('--club-accent')).toBe('#c9a84c');
      });
    });
  });
});
