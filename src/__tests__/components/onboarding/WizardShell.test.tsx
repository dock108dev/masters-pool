import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../../api/mock/adapters';
import { WizardShell } from '../../../components/onboarding/WizardShell';
import type { WizardStepDef } from '../../../components/onboarding/WizardShell';
import { OnboardingWizardPage } from '../../../pages/onboard/OnboardingWizardPage';
import { DEFAULT_ONBOARDING_WIZARD_STATE, ONBOARDING_WIZARD_KEY } from '../../../utils/poolWizardUtils';
import type { OnboardingWizardState } from '../../../utils/poolWizardUtils';
import type { SlugAvailabilityInputProps } from '../../../components/onboarding/SlugAvailabilityInput';

vi.mock('../../../components/onboarding/SlugAvailabilityInput', () => ({
  SlugAvailabilityInput: ({ value, onChange, onValidSlug }: SlugAvailabilityInputProps) => (
    <div data-testid="slug-availability-input">
      <input
        data-testid="slug-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        data-testid="slug-confirm-btn"
        type="button"
        onClick={() => onValidSlug(value)}
      >
        Confirm
      </button>
    </div>
  ),
}));

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

// ── Minimal step defs for WizardShell unit tests ──────────────────────────────

const MOCK_STEPS: WizardStepDef[] = [
  {
    id: 'identity',
    label: 'Identity',
    render: ({ state, onChange, errors }) => (
      <div data-testid="step-identity">
        {errors.map((e) => (
          <p key={e} role="alert" data-testid="step-error">{e}</p>
        ))}
        <input
          data-testid="step1-input"
          value={state.pool_name}
          onChange={(e) => onChange({ pool_name: e.target.value })}
        />
      </div>
    ),
    validate: (state) => (state.pool_name.trim() ? [] : ['Pool name is required.']),
  },
  {
    id: 'format',
    label: 'Format',
    render: () => <div data-testid="step-format">Format content</div>,
  },
  {
    id: 'settings',
    label: 'Settings',
    render: () => <div data-testid="step-settings">Settings content</div>,
  },
  {
    id: 'share',
    label: 'Share',
    render: () => <div data-testid="step-share">Share content</div>,
  },
];

// Stateful wrapper that wires up WizardShell with real useState-backed state.
function StatefulShell({
  initialStep = 0,
  initialState = DEFAULT_ONBOARDING_WIZARD_STATE,
  onSubmit = vi.fn(),
  isSubmitting = false,
  submitError = null as string | null,
  summaryItems = [] as { label: string; value: string }[],
}: {
  initialStep?: number;
  initialState?: OnboardingWizardState;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  summaryItems?: { label: string; value: string }[];
}) {
  const [step, setStep] = useState(initialStep);
  const [state, setState] = useState(initialState);
  return (
    <WizardShell
      steps={MOCK_STEPS}
      state={state}
      currentStep={step}
      onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))}
      onBack={() => setStep((s) => Math.max(0, s - 1))}
      onAdvance={() => setStep((s) => Math.min(MOCK_STEPS.length - 1, s + 1))}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      submitError={submitError}
      summaryItems={summaryItems}
    />
  );
}

// ── WizardShell unit tests ────────────────────────────────────────────────────

describe('WizardShell', () => {
  it('renders the first step content and step indicator', () => {
    render(<StatefulShell />);
    expect(screen.getByTestId('step-identity')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-indicator-0')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-indicator-1')).toBeInTheDocument();
  });

  it('step indicator has correct active/completed/upcoming classes', () => {
    render(<StatefulShell initialStep={1} />);
    expect(screen.getByTestId('wizard-step-indicator-0').className).toContain('completed');
    expect(screen.getByTestId('wizard-step-indicator-1').className).toContain('active');
    expect(screen.getByTestId('wizard-step-indicator-2').className).toContain('upcoming');
  });

  it('step indicator marks current step with aria-current="step"', () => {
    render(<StatefulShell initialStep={1} />);
    expect(screen.getByTestId('wizard-step-indicator-1')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByTestId('wizard-step-indicator-0')).not.toHaveAttribute('aria-current');
  });

  it('Back button is hidden on the first step', () => {
    render(<StatefulShell initialStep={0} />);
    expect(screen.queryByTestId('wizard-back-btn')).not.toBeInTheDocument();
  });

  it('Back button is visible on step 2', () => {
    render(<StatefulShell initialStep={1} />);
    expect(screen.getByTestId('wizard-back-btn')).toBeInTheDocument();
  });

  it('shows Next button on non-final steps', () => {
    render(<StatefulShell initialStep={0} />);
    expect(screen.getByTestId('wizard-next-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-submit-btn')).not.toBeInTheDocument();
  });

  it('shows Submit button on the final step', () => {
    render(<StatefulShell initialStep={3} />);
    expect(screen.getByTestId('wizard-submit-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-next-btn')).not.toBeInTheDocument();
  });

  it('clicking Next with invalid state shows errors and does not advance', () => {
    render(<StatefulShell initialStep={0} />);
    // step 1 requires pool_name — leave it empty
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('step-error')).toHaveTextContent('Pool name is required.');
    expect(screen.getByTestId('step-identity')).toBeInTheDocument();
  });

  it('clicking Next with valid state advances to next step', () => {
    render(<StatefulShell initialStep={0} />);
    fireEvent.change(screen.getByTestId('step1-input'), {
      target: { value: 'Masters Pool 2026' },
    });
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('step-format')).toBeInTheDocument();
    expect(screen.queryByTestId('step-identity')).not.toBeInTheDocument();
  });

  it('clicking Back from step 2 returns to step 1', () => {
    render(<StatefulShell initialStep={1} />);
    expect(screen.getByTestId('step-format')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('wizard-back-btn'));
    expect(screen.getByTestId('step-identity')).toBeInTheDocument();
  });

  it('clicking Back does not clear forward step state', () => {
    // Advance past step 1 with valid data, then go back and verify data persists
    render(<StatefulShell initialStep={0} />);
    fireEvent.change(screen.getByTestId('step1-input'), {
      target: { value: 'My Pool' },
    });
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('step-format')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('wizard-back-btn'));
    expect(screen.getByTestId('step1-input')).toHaveValue('My Pool');
  });

  it('validation errors are cleared when navigating back', () => {
    render(<StatefulShell initialStep={0} />);
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    expect(screen.getByTestId('step-error')).toBeInTheDocument();
    // provide valid value and advance, then back
    fireEvent.change(screen.getByTestId('step1-input'), { target: { value: 'Pool' } });
    fireEvent.click(screen.getByTestId('wizard-next-btn'));
    fireEvent.click(screen.getByTestId('wizard-back-btn'));
    expect(screen.queryByTestId('step-error')).not.toBeInTheDocument();
  });

  it('calls onSubmit when Next is clicked on the final step', () => {
    const onSubmit = vi.fn();
    render(<StatefulShell initialStep={3} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('wizard-submit-btn'));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('shows submit error when submitError prop is set', () => {
    render(<StatefulShell submitError="Something went wrong" />);
    expect(screen.getByTestId('wizard-submit-error')).toHaveTextContent('Something went wrong');
  });

  it('disables nav buttons when isSubmitting is true', () => {
    render(<StatefulShell initialStep={3} isSubmitting={true} />);
    expect(screen.getByTestId('wizard-submit-btn')).toBeDisabled();
  });

  it('renders sidebar when summaryItems are provided', () => {
    render(
      <StatefulShell summaryItems={[{ label: 'Pool', value: 'Masters 2026' }]} />,
    );
    expect(screen.getByTestId('wizard-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Masters 2026')).toBeInTheDocument();
  });

  it('does not render sidebar when summaryItems is empty', () => {
    render(<StatefulShell summaryItems={[]} />);
    expect(screen.queryByTestId('wizard-sidebar')).not.toBeInTheDocument();
  });
});

// ── OnboardingWizardPage integration tests ────────────────────────────────────

function renderWizardPage(path = '/admin/onboarding?club=test-club') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/onboarding" element={<OnboardingWizardPage />} />
        <Route path="/admin/pools/:poolId" element={<div data-testid="pool-dashboard-page" />} />
        <Route path="/admin" element={<div data-testid="admin-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OnboardingWizardPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('renders the wizard page with step 1 active', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(screen.getByTestId('onboarding-wizard-page')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-identity')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-indicator-0').className).toContain('active');
  });

  it('shows error page when no club param and no saved state', async () => {
    renderWizardPage('/admin/onboarding');
    await act(async () => { await vi.runAllTimersAsync(); });
    expect(screen.getByTestId('wizard-no-club-error')).toBeInTheDocument();
  });

  // ── State serialization round-trip ─────────────────────────────────────────

  it('restores persisted step and values after page remount (round-trip)', async () => {
    const saved: OnboardingWizardState = {
      ...DEFAULT_ONBOARDING_WIZARD_STATE,
      step: 2,
      club_slug: 'test-club',
      pool_name: 'Restored Pool',
    };
    localStorage.setItem(ONBOARDING_WIZARD_KEY, JSON.stringify(saved));

    renderWizardPage('/admin/onboarding?club=test-club');
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-step-format')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-step-identity')).not.toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-indicator-0').className).toContain('completed');
    expect(screen.getByTestId('wizard-step-indicator-1').className).toContain('completed');
    expect(screen.getByTestId('wizard-step-indicator-2').className).toContain('active');
  });

  it('persists state to localStorage when form values change', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('wizard-club-name-input'), {
        target: { value: 'Pine Valley GC' },
      });
    });

    const raw = localStorage.getItem(ONBOARDING_WIZARD_KEY);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!) as OnboardingWizardState;
    expect(parsed.club_name).toBe('Pine Valley GC');
  });

  it('clears localStorage and redirects to /admin/pools/{id} on successful submit', async () => {
    const spy = vi.spyOn(activeClient, 'submitOnboardingWizard');
    const saved: OnboardingWizardState = {
      ...DEFAULT_ONBOARDING_WIZARD_STATE,
      step: 4,
      club_slug: 'test-club',
      pool_name: 'Masters Pool',
      tournament_id: 1,
      entry_deadline: '2026-04-10T08:00',
      max_entries_per_email: 2,
      engine_type: 'golf',
      format: 'flat',
    };
    localStorage.setItem(ONBOARDING_WIZARD_KEY, JSON.stringify(saved));

    renderWizardPage('/admin/onboarding?club=test-club');
    // Pool creation triggers automatically on step 4 render
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-step-share')).toBeInTheDocument();
    // submitOnboardingWizard was called once on render (not on submit click)
    expect(spy).toHaveBeenCalledOnce();

    act(() => {
      fireEvent.click(screen.getByTestId('wizard-submit-btn'));
    });

    expect(localStorage.getItem(ONBOARDING_WIZARD_KEY)).toBeNull();
    expect(screen.getByTestId('pool-dashboard-page')).toBeInTheDocument();
  });

  it('shows submit error and preserves storage when submission fails', async () => {
    vi.spyOn(activeClient, 'submitOnboardingWizard').mockImplementation(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      throw new Error('Backend unavailable');
    });
    const saved: OnboardingWizardState = {
      ...DEFAULT_ONBOARDING_WIZARD_STATE,
      step: 4,
      club_slug: 'test-club',
      pool_name: 'Masters Pool',
      tournament_id: 1,
      entry_deadline: '2026-04-10T08:00',
      engine_type: 'golf',
      format: 'flat',
    };
    localStorage.setItem(ONBOARDING_WIZARD_KEY, JSON.stringify(saved));

    renderWizardPage('/admin/onboarding?club=test-club');
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.click(screen.getByTestId('wizard-submit-btn'));
    });
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-submit-error')).toHaveTextContent('Backend unavailable');
    expect(localStorage.getItem(ONBOARDING_WIZARD_KEY)).not.toBeNull();
  });

  it('navigating away and returning restores the last step', async () => {
    const saved: OnboardingWizardState = {
      ...DEFAULT_ONBOARDING_WIZARD_STATE,
      step: 3,
      club_slug: 'test-club',
    };
    localStorage.setItem(ONBOARDING_WIZARD_KEY, JSON.stringify(saved));

    renderWizardPage('/admin/onboarding?club=test-club');
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-step-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-step-identity')).not.toBeInTheDocument();
  });

  // ── Club identity step tests ───────────────────────────────────────────────

  it('club identity step: shows per-field errors when Next is clicked with empty form', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-step-identity')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/Club name must be at least 2 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Slug must be available before continuing/)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-identity')).toBeInTheDocument();
  });

  it('club identity step: blocks Next when slug is not yet confirmed', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('wizard-club-name-input'), {
        target: { value: 'Pine Valley GC' },
      });
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'pine-valley' },
      });
    });

    // Slug typed but not confirmed — clicking Next should show an error
    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/Slug must be available before continuing/)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-identity')).toBeInTheDocument();
  });

  it('club identity step: advances after all fields are valid and slug is confirmed', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('wizard-club-name-input'), {
        target: { value: 'Pine Valley GC' },
      });
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'pine-valley' },
      });
      fireEvent.click(screen.getByTestId('slug-confirm-btn'));
      fireEvent.change(screen.getByTestId('wizard-timezone-select'), {
        target: { value: 'America/New_York' },
      });
    });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByTestId('wizard-step-pool-identity')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-step-identity')).not.toBeInTheDocument();
  });

  it('club identity step: completed values appear in summary sidebar', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => {
      fireEvent.change(screen.getByTestId('wizard-club-name-input'), {
        target: { value: 'Crestmont CC' },
      });
      fireEvent.change(screen.getByTestId('slug-input'), {
        target: { value: 'crestmont' },
      });
      fireEvent.click(screen.getByTestId('slug-confirm-btn'));
      fireEvent.change(screen.getByTestId('wizard-timezone-select'), {
        target: { value: 'America/Chicago' },
      });
    });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    // On step 2 (pool identity), the sidebar should show club identity values
    expect(screen.getByTestId('wizard-sidebar')).toBeInTheDocument();
    expect(screen.getByText('Crestmont CC')).toBeInTheDocument();
    expect(screen.getByText('crestmont')).toBeInTheDocument();
    expect(screen.getByText('America/Chicago')).toBeInTheDocument();
  });

  it('club identity step: time zone defaults to browser locale', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    expect(screen.getByTestId('wizard-timezone-select')).toHaveValue(tz);
  });
});
