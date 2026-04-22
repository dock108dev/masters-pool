import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { CoordinatorLayout } from '../../pages/CoordinatorLayout';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

function renderLayout(hasPendingClub = false, path = '/admin') {
  activeClient = new MockApiClient(
    0,    // latencyMs
    [],   // lockedPoolIds
    [],   // mockEvents
    null, // mockLockTime
    false, // billingRequired
    false, // referredClubCompleted
    [],   // takenSlugs
    false, // checkoutSessionProvisioned
    'Mock Club', // mockSessionClubName
    [],   // closedPoolIds
    hasPendingClub,
  );

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin" element={<CoordinatorLayout />}>
          <Route index element={<div data-testid="admin-child">Admin content</div>} />
        </Route>
        <Route path="/admin/onboarding" element={<div data-testid="onboarding-page">Onboarding</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CoordinatorLayout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── No pending club ────────────────────────────────────────────────────────

  it('renders child content without a banner when no pending club exists', async () => {
    renderLayout(false);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('admin-child')).toBeInTheDocument();
    expect(screen.queryByTestId('pending-club-banner')).not.toBeInTheDocument();
  });

  it('logs no errors when getPendingClub returns null (404 scenario)', async () => {
    const consoleSpy = vi.spyOn(console, 'error');
    renderLayout(false);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // ── Pending club exists ────────────────────────────────────────────────────

  it('shows the pending banner when a pending club exists', async () => {
    renderLayout(true);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('pending-club-banner')).toBeInTheDocument();
    expect(screen.getByTestId('pending-club-banner')).toHaveTextContent(
      'finish setting up your club',
    );
  });

  it('banner is non-dismissible (no close button)', async () => {
    renderLayout(true);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const banner = screen.getByTestId('pending-club-banner');
    expect(banner.querySelector('button')).toBeNull();
  });

  it('banner contains a Resume Setup link to /admin/onboarding', async () => {
    renderLayout(true);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    const link = screen.getByTestId('resume-setup-link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/onboarding');
  });

  it('still renders child content below the banner', async () => {
    renderLayout(true);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('admin-child')).toBeInTheDocument();
    expect(screen.getByTestId('pending-club-banner')).toBeInTheDocument();
  });

  // ── getPendingClub called once per mount ───────────────────────────────────

  it('calls getPendingClub exactly once on mount', async () => {
    // Set up the client first, then spy before rendering
    activeClient = new MockApiClient(0);
    const spy = vi.spyOn(activeClient, 'getPendingClub');

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<CoordinatorLayout />}>
            <Route index element={<div data-testid="admin-child">content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(spy).toHaveBeenCalledOnce();
  });

  // ── Error resilience ───────────────────────────────────────────────────────

  it('shows no banner and logs the error when getPendingClub throws', async () => {
    activeClient = new MockApiClient(0);
    vi.spyOn(activeClient, 'getPendingClub').mockRejectedValue(new Error('network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<CoordinatorLayout />}>
            <Route index element={<div data-testid="admin-child">content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.queryByTestId('pending-club-banner')).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledOnce();
    consoleSpy.mockRestore();
  });

  // ── Banner disappears after wizard completion ──────────────────────────────

  it('banner is absent when getPendingClub returns null (post-wizard completion)', async () => {
    // After wizard completes, the API returns null → no banner on next load
    renderLayout(false);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.queryByTestId('pending-club-banner')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-child')).toBeInTheDocument();
  });
});
