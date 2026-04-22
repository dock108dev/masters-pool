import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../../api/mock/adapters';
import { OnboardingWizardPage } from '../../../pages/onboard/OnboardingWizardPage';
import { DEFAULT_ONBOARDING_WIZARD_STATE, ONBOARDING_WIZARD_KEY } from '../../../utils/poolWizardUtils';
import type { OnboardingWizardState } from '../../../utils/poolWizardUtils';
import type { SlugAvailabilityInputProps } from '../../../components/onboarding/SlugAvailabilityInput';

vi.mock('../../../components/onboarding/SlugAvailabilityInput', () => ({
  SlugAvailabilityInput: ({ value, onChange }: SlugAvailabilityInputProps) => (
    <input data-testid="slug-input" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const MOCK_ENTRY_URL = 'https://test-club.countryclubpicks.com/enter/mock-pool-token-9999';

function seedShareStep(extra: Partial<OnboardingWizardState> = {}) {
  const state: OnboardingWizardState = {
    ...DEFAULT_ONBOARDING_WIZARD_STATE,
    step: 4,
    club_slug: 'test-club',
    club_name: 'Test Club',
    pool_name: 'Masters Pool',
    time_zone: 'America/New_York',
    tournament_id: 101,
    engine_type: 'golf',
    format: 'flat',
    entry_deadline: '2027-04-09T08:00',
    ...extra,
  };
  localStorage.setItem(ONBOARDING_WIZARD_KEY, JSON.stringify(state));
}

function renderWizardPage() {
  return render(
    <MemoryRouter initialEntries={['/admin/onboarding?club=test-club']}>
      <Routes>
        <Route path="/admin/onboarding" element={<OnboardingWizardPage />} />
        <Route
          path="/admin/pools/:poolId"
          element={<div data-testid="pool-dashboard">Dashboard</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Share & Launch Step', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    localStorage.clear();
    seedShareStep();

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  // AC: Pool creation called once on step render, not on each Next click
  it('calls submitOnboardingWizard once on step render', async () => {
    const spy = vi.spyOn(activeClient, 'submitOnboardingWizard');
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(spy).toHaveBeenCalledOnce();
  });

  it('re-renders do not duplicate the pool creation call', async () => {
    const spy = vi.spyOn(activeClient, 'submitOnboardingWizard');
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    // Force a re-render by triggering a state change that doesn't change currentStep
    fireEvent.change(screen.getByTestId('invite-emails-input'), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByTestId('invite-emails-input'), {
      target: { value: '' },
    });

    expect(spy).toHaveBeenCalledOnce();
  });

  it('shows pool-created banner and entry URL after creation', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('pool-created-banner')).toBeInTheDocument();
    const urlInput = screen.getByTestId('entry-url-display') as HTMLInputElement;
    expect(urlInput.value).toBe(MOCK_ENTRY_URL);
  });

  it('shows preview entry form link pointing to entry URL', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const link = screen.getByTestId('preview-entry-link') as HTMLAnchorElement;
    expect(link.href).toBe(MOCK_ENTRY_URL);
    expect(link.target).toBe('_blank');
  });

  // AC: Clipboard copy shows 'Copied!' for 2s
  it('copy button shows Copied! for 2s then resets', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const copyBtn = screen.getByTestId('copy-url-btn');
    expect(copyBtn).toHaveTextContent('Copy link');

    // Click the copy button and flush only microtasks (not the 2s timer)
    await act(async () => {
      fireEvent.click(copyBtn);
      // Flush the Promise microtask from clipboard.writeText
      await Promise.resolve();
    });

    expect(screen.getByTestId('copy-url-btn')).toHaveTextContent('Copied!');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(MOCK_ENTRY_URL);

    // Advance past the 2s reset timer
    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByTestId('copy-url-btn')).toHaveTextContent('Copy link');
  });

  // AC: Email invite validation
  it('Send Invites button is disabled when emails field is empty', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const btn = screen.getByTestId('send-invites-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Send Invites button is disabled for invalid email format', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: 'not-an-email' },
      });
    });

    const btn = screen.getByTestId('send-invites-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('Send Invites button is enabled for valid comma-separated emails', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: 'alice@example.com, bob@example.com' },
      });
    });

    const btn = screen.getByTestId('send-invites-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('Send Invites button is enabled for a single valid email', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: 'alice@example.com' },
      });
    });

    const btn = screen.getByTestId('send-invites-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('calls sendPoolInvites with parsed email list on submit', async () => {
    const spy = vi.spyOn(activeClient, 'sendPoolInvites');
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: 'alice@example.com, bob@example.com' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-invites-btn'));
      await vi.runAllTimersAsync();
    });

    expect(spy).toHaveBeenCalledWith(9999, {
      emails: ['alice@example.com', 'bob@example.com'],
    });
    expect(screen.getByTestId('invite-sent-confirmation')).toBeInTheDocument();
  });

  it('shows invite error when sendPoolInvites fails', async () => {
    vi.spyOn(activeClient, 'sendPoolInvites').mockRejectedValue(
      new Error('Server unavailable'),
    );
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: 'alice@example.com' },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('send-invites-btn'));
      await vi.runAllTimersAsync();
    });

    expect(screen.getByTestId('invite-error')).toHaveTextContent('Server unavailable');
  });

  // AC: Completing the step clears wizard localStorage and redirects to /admin/pools/{id}
  it('Go to Dashboard button navigates to /admin/pools/9999 and clears localStorage', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(localStorage.getItem(ONBOARDING_WIZARD_KEY)).not.toBeNull();

    // Navigate is synchronous once createdPool is set
    act(() => {
      fireEvent.click(screen.getByTestId('wizard-submit-btn'));
    });

    expect(screen.getByTestId('pool-dashboard')).toBeInTheDocument();
    expect(localStorage.getItem(ONBOARDING_WIZARD_KEY)).toBeNull();
  });

  it('Go to Dashboard button label reads "Go to Dashboard"', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-submit-btn')).toHaveTextContent('Go to Dashboard');
  });

  // AC: Idempotent re-visit — re-renders after pool creation do not make a second API call
  it('idempotent: once pool is created, additional re-renders do not call the API again', async () => {
    const spy = vi.spyOn(activeClient, 'submitOnboardingWizard');
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(spy).toHaveBeenCalledOnce();

    // Interact with the invite field (triggers re-render) — no extra API call
    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: 'test@example.com' },
      });
    });

    expect(spy).toHaveBeenCalledOnce();

    // Mock returns consistent data on repeated calls (idempotent backend)
    act(() => {
      fireEvent.change(screen.getByTestId('invite-emails-input'), {
        target: { value: '' },
      });
    });

    expect(spy).toHaveBeenCalledOnce();
    const urlInput = screen.getByTestId('entry-url-display') as HTMLInputElement;
    expect(urlInput.value).toBe(MOCK_ENTRY_URL);
  });

  // Pool creation error path
  it('shows pool creation error when submitOnboardingWizard fails', async () => {
    vi.spyOn(activeClient, 'submitOnboardingWizard').mockRejectedValue(
      new Error('Backend error'),
    );
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('pool-creation-error')).toHaveTextContent('Backend error');
    expect(screen.queryByTestId('pool-created-banner')).not.toBeInTheDocument();
  });

  it('submit button is disabled while pool creation is pending', async () => {
    // Use a slow mock to capture the pending state
    activeClient = new MockApiClient(5000); // 5s latency
    vi.spyOn(activeClient, 'submitOnboardingWizard');

    renderWizardPage();
    // Don't run timers — pool creation is in-flight
    const btn = screen.getByTestId('wizard-submit-btn') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});
