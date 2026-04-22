import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../../api/mock/adapters';
import { CheckoutSuccessPage } from '../../../pages/onboard/CheckoutSuccessPage';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

/** Render the page inside a router with /admin and /admin/onboarding escape hatches. */
function renderPage(path = '/checkout/success?session_id=cs_test_abc') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/admin" element={<div data-testid="admin-page" />} />
        <Route path="/admin/onboarding" element={<div data-testid="onboarding-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}


describe('CheckoutSuccessPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Missing / invalid session_id ───────────────────────────────────────────

  it('shows error with contact support link when session_id is absent', async () => {
    renderPage('/checkout/success');
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('session-error')).toBeInTheDocument();
    expect(screen.getByTestId('contact-support-link')).toBeInTheDocument();
    expect(screen.queryByTestId('setup-form')).not.toBeInTheDocument();
  });

  it('shows error with contact support link when the API rejects the session', async () => {
    vi.spyOn(activeClient, 'verifyCheckoutSession').mockImplementation(async () => {
      // Route through a fake setTimeout so vi.runAllTimersAsync() can drain it
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      throw new Error('Invalid or expired session');
    });
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('session-error')).toHaveTextContent(
      'Invalid or expired session',
    );
    expect(screen.getByTestId('contact-support-link')).toBeInTheDocument();
  });

  // ── Already-provisioned session ────────────────────────────────────────────

  it('redirects to /admin without showing the form when session is already provisioned', async () => {
    activeClient = new MockApiClient(0, [], [], null, false, false, [], true);
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    expect(screen.queryByTestId('setup-form')).not.toBeInTheDocument();
  });

  // ── New session — form rendering ───────────────────────────────────────────

  it('shows the setup form after verifying a new session', async () => {
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('setup-form')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-success-page')).toBeInTheDocument();
  });

  it('pre-fills the club name field from session metadata', async () => {
    activeClient = new MockApiClient(0, [], [], null, false, false, [], false, 'Raritan Valley CC');
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('club-name-input')).toHaveValue('Raritan Valley CC');
  });

  it('submit button is disabled when no valid slug has been confirmed', async () => {
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('setup-form')).toBeInTheDocument();
    expect(screen.getByTestId('setup-submit-btn')).toBeDisabled();
  });

  // ── Slug integration ───────────────────────────────────────────────────────

  it('enables submit button only after slug availability is confirmed', async () => {
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('setup-form')).toBeInTheDocument();

    // Synchronous act flushes the onChange → setSlug state update immediately
    act(() => {
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'my-club' },
      });
    });

    // Advance past the 400ms debounce + delay(0) in checkSlugAvailability
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId('slug-status-available')).toBeInTheDocument();
    expect(screen.getByTestId('setup-submit-btn')).not.toBeDisabled();
  });

  it('keeps submit disabled when slug is taken', async () => {
    activeClient = new MockApiClient(0, [], [], null, false, false, ['taken-slug']);
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('setup-form')).toBeInTheDocument();

    act(() => {
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'taken-slug' },
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId('slug-status-taken')).toBeInTheDocument();
    expect(screen.getByTestId('setup-submit-btn')).toBeDisabled();
  });

  // ── Club creation ──────────────────────────────────────────────────────────

  it('calls createClub with session_id, club_name, and slug on submit', async () => {
    const spy = vi.spyOn(activeClient, 'createClub');
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      fireEvent.change(screen.getByTestId('club-name-input'), {
        target: { value: 'My Club' },
      });
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'my-club' },
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId('slug-status-available')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('setup-submit-btn'));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({
      session_id: 'cs_test_abc',
      club_name: 'My Club',
      slug: 'my-club',
    });
  });

  it('redirects to /admin after successful club creation', async () => {
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'my-club' },
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId('slug-status-available')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('setup-submit-btn'));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
  });

  it('does not call createClub a second time when submit is clicked twice', async () => {
    const spy = vi.spyOn(activeClient, 'createClub');
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'my-club' },
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId('slug-status-available')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('setup-submit-btn'));
      fireEvent.click(screen.getByTestId('setup-submit-btn'));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(spy).toHaveBeenCalledOnce();
  });

  it('shows inline error and re-enables submit when createClub fails', async () => {
    vi.spyOn(activeClient, 'createClub').mockImplementation(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      throw new Error('Club name already taken');
    });
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'my-club' },
      });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(screen.getByTestId('slug-status-available')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByTestId('setup-submit-btn'));
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('submit-error')).toHaveTextContent(
      'Club name already taken',
    );
    expect(screen.getByTestId('setup-submit-btn')).not.toBeDisabled();
  });

  // ── Idempotency — already-provisioned on re-visit ──────────────────────────

  it('redirects immediately on re-visit when already provisioned (idempotent)', async () => {
    activeClient = new MockApiClient(0, [], [], null, false, false, [], true);
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('admin-page')).toBeInTheDocument();
    expect(screen.queryByTestId('setup-form')).not.toBeInTheDocument();
  });

  // ── Already-paid, wizard not finished → redirect to /admin/onboarding ─────

  it('redirects to /admin/onboarding when session is provisioned but wizard incomplete', async () => {
    vi.spyOn(activeClient, 'verifyCheckoutSession').mockResolvedValue({
      status: 'provisioned',
      club_name: 'My Club',
      email: 'owner@example.com',
      club_slug: 'my-club',
      onboard_url: '/admin/onboarding',
    });
    renderPage();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    expect(screen.getByTestId('onboarding-page')).toBeInTheDocument();
    expect(screen.queryByTestId('setup-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-page')).not.toBeInTheDocument();
  });
});
