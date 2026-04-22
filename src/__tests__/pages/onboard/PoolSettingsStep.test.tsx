import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MOCK_TOURNAMENTS } from '../../../api/mock/data';
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

function seedSettingsStep(extra: Partial<OnboardingWizardState> = {}) {
  const state: OnboardingWizardState = {
    ...DEFAULT_ONBOARDING_WIZARD_STATE,
    step: 3,
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
      </Routes>
    </MemoryRouter>,
  );
}

describe('Pool Settings Step', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    localStorage.clear();
    seedSettingsStep();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('renders the settings step with deadline, lock timing, and fee toggle', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-step-settings')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-deadline-input')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-lock-auto')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-lock-manual')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-fee-toggle')).toBeInTheDocument();
  });

  // AC: Deadline picker respects time zone from step 1
  it('shows the club time zone next to the deadline label', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    // The sidebar also shows the time zone; match only the parenthesized hint in the label
    expect(screen.getByText(/\(America\/New_York\)/)).toBeInTheDocument();
  });

  // AC: Auto-lock shows informational banner
  it('auto-lock mode shows informational banner', async () => {
    seedSettingsStep({ lock_timing_source: 'auto' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-autolock-banner')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-autolock-banner')).toHaveTextContent(
      /automatically locked/i,
    );
  });

  it('manual lock mode hides the auto-lock banner', async () => {
    seedSettingsStep({ lock_timing_source: 'manual' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByTestId('wizard-autolock-banner')).not.toBeInTheDocument();
  });

  it('switching to manual lock hides the auto-lock banner', async () => {
    seedSettingsStep({ lock_timing_source: 'auto' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-autolock-banner')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-lock-manual')); });

    expect(screen.queryByTestId('wizard-autolock-banner')).not.toBeInTheDocument();
  });

  it('switching from manual to auto shows the auto-lock banner', async () => {
    seedSettingsStep({ lock_timing_source: 'manual' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByTestId('wizard-autolock-banner')).not.toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-lock-auto')); });

    expect(screen.getByTestId('wizard-autolock-banner')).toBeInTheDocument();
  });

  // AC: Entry fee toggle defaults to off
  it('entry fee toggle is off by default', async () => {
    seedSettingsStep({ entry_fee_enabled: false });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const toggle = screen.getByTestId('wizard-fee-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(screen.queryByTestId('wizard-fee-fields')).not.toBeInTheDocument();
  });

  it('enabling entry fee toggle shows amount and currency fields', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByTestId('wizard-fee-fields')).not.toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-fee-toggle')); });

    expect(screen.getByTestId('wizard-fee-fields')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-fee-amount-input')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-fee-currency-select')).toBeInTheDocument();
  });

  it('disabling entry fee toggle hides amount and currency fields', async () => {
    seedSettingsStep({ entry_fee_enabled: true, entry_fee_amount: 20 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-fee-fields')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-fee-toggle')); });

    expect(screen.queryByTestId('wizard-fee-fields')).not.toBeInTheDocument();
  });

  // AC: Entry fee enabled requires amount > 0
  it('blocks Next when fee is enabled but amount is 0', async () => {
    seedSettingsStep({ entry_fee_enabled: true, entry_fee_amount: 0 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/entry fee amount must be greater than 0/i)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-settings')).toBeInTheDocument();
  });

  it('allows Next when fee is enabled with a valid amount', async () => {
    seedSettingsStep({ entry_fee_enabled: true, entry_fee_amount: 20 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.queryByTestId('wizard-step-settings')).not.toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-share')).toBeInTheDocument();
  });

  it('allows Next when fee toggle is off regardless of amount', async () => {
    seedSettingsStep({ entry_fee_enabled: false, entry_fee_amount: 0 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.queryByTestId('wizard-step-settings')).not.toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-share')).toBeInTheDocument();
  });

  // AC: Past deadline shows blocking validation error
  it('blocks Next when deadline is in the past', async () => {
    vi.setSystemTime(new Date('2026-12-01T00:00:00Z'));
    seedSettingsStep({ entry_deadline: '2026-04-09T08:00' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/entry deadline must be in the future/i)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-settings')).toBeInTheDocument();
  });

  it('blocks Next when deadline is empty', async () => {
    seedSettingsStep({ entry_deadline: '' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/entry deadline is required/i)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-settings')).toBeInTheDocument();
  });

  it('allows Next when deadline is in the future', async () => {
    seedSettingsStep({ entry_deadline: '2026-04-09T08:00' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.queryByTestId('wizard-step-settings')).not.toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-share')).toBeInTheDocument();
  });

  // Warn if deadline within 24h of tournament start (non-blocking).
  // start_date '2026-04-10T02:00:00Z'; deadline '2026-04-09T11:00' (11am local) converts to
  // at most 23:00 UTC (UTC-12), giving a diff ≥3h and <24h for UTC-12 … UTC+8.
  it('shows warning when deadline is within 24h of tournament start', async () => {
    const NEAR_START: typeof MOCK_TOURNAMENTS = [
      { id: 101, name: 'The Masters 2026', year: 2026, cut_rule_type: 'masters',
        default_format: 'flat', start_date: '2026-04-10T02:00:00Z' },
    ];
    vi.spyOn(activeClient, 'getTournaments').mockResolvedValue(NEAR_START);
    seedSettingsStep({ tournament_id: 101, entry_deadline: '2026-04-09T11:00' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-deadline-warning')).toBeInTheDocument();
  });

  it('warning does not block advancing to review step', async () => {
    const NEAR_START: typeof MOCK_TOURNAMENTS = [
      { id: 101, name: 'The Masters 2026', year: 2026, cut_rule_type: 'masters',
        default_format: 'flat', start_date: '2026-04-10T02:00:00Z' },
    ];
    vi.spyOn(activeClient, 'getTournaments').mockResolvedValue(NEAR_START);
    seedSettingsStep({ tournament_id: 101, entry_deadline: '2026-04-09T11:00' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-deadline-warning')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByTestId('wizard-step-share')).toBeInTheDocument();
  });

  it('does not show warning when deadline is more than 24h before tournament start', async () => {
    seedSettingsStep({
      tournament_id: 101,
      entry_deadline: '2026-04-07T10:00',
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByTestId('wizard-deadline-warning')).not.toBeInTheDocument();
  });

  // AC: All field values round-trip through usePersistedState
  it('reads lock_timing_source from persisted state', async () => {
    seedSettingsStep({ lock_timing_source: 'manual' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const manualRadio = screen.getByTestId('wizard-lock-manual') as HTMLInputElement;
    expect(manualRadio.checked).toBe(true);
    const autoRadio = screen.getByTestId('wizard-lock-auto') as HTMLInputElement;
    expect(autoRadio.checked).toBe(false);
  });

  it('reads entry_fee_enabled and amount from persisted state', async () => {
    seedSettingsStep({ entry_fee_enabled: true, entry_fee_amount: 25, entry_fee_currency: 'CAD' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const toggle = screen.getByTestId('wizard-fee-toggle') as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    const amountInput = screen.getByTestId('wizard-fee-amount-input') as HTMLInputElement;
    expect(amountInput.value).toBe('25');
    const currencySelect = screen.getByTestId('wizard-fee-currency-select') as HTMLSelectElement;
    expect(currencySelect.value).toBe('CAD');
  });

  it('reads entry_deadline from persisted state', async () => {
    seedSettingsStep({ entry_deadline: '2026-06-01T09:00' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    const deadlineInput = screen.getByTestId('wizard-deadline-input') as HTMLInputElement;
    expect(deadlineInput.value).toBe('2026-06-01T09:00');
  });
});
