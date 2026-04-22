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

function seedFormatStep(extra: Partial<OnboardingWizardState> = {}) {
  const state: OnboardingWizardState = {
    ...DEFAULT_ONBOARDING_WIZARD_STATE,
    step: 2,
    club_slug: 'test-club',
    club_name: 'Test Club',
    pool_name: 'Masters Pool',
    time_zone: 'America/New_York',
    tournament_id: 1,
    entry_deadline: '2026-04-10T08:00',
    engine_type: 'golf',
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

describe('Pool Format Step', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    vi.useFakeTimers();
    localStorage.clear();
    seedFormatStep();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('renders the format step with flat and bucketed radio buttons', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-step-format')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-format-flat')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-format-bucketed')).toBeInTheDocument();
  });

  // AC1: flat format hides group configuration UI
  it('flat format: hides group configuration UI', async () => {
    seedFormatStep({ format: 'flat' });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByTestId('bucket-definitions')).not.toBeInTheDocument();
    expect(screen.getByTestId('flat-config')).toBeInTheDocument();
  });

  it('flat format: shows N and M inputs and a scoring summary', async () => {
    seedFormatStep({ format: 'flat', pick_count: 7, count_best: 5 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('wizard-pick-count')).toHaveValue(7);
    expect(screen.getByTestId('wizard-count-best')).toHaveValue(5);
    expect(screen.getByTestId('scoring-summary')).toHaveTextContent(
      'Each entry picks 7 golfers; best 5 scores count.',
    );
  });

  // AC4: M ≤ N validation for flat format
  it('flat format: blocks Next when M > N', async () => {
    seedFormatStep({ format: 'flat', pick_count: 3, count_best: 7 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/Best count \(M\) must be between 1 and pick count \(N\)/)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-format')).toBeInTheDocument();
  });

  it('flat format: advances to settings step when N and M are valid', async () => {
    seedFormatStep({ format: 'flat', pick_count: 7, count_best: 5, min_cuts_to_qualify: 5 });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByTestId('wizard-step-settings')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-step-format')).not.toBeInTheDocument();
  });

  // AC2: bucketed format shows groups and Add Group button
  it('bucketed format: shows at least one default group and Add Group button', async () => {
    seedFormatStep({
      format: 'bucketed',
      buckets: [{ label: 'Group 1', min_picks: 1, max_picks: 1 }],
      count_best: 1,
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('bucket-definitions')).toBeInTheDocument();
    expect(screen.getByTestId('bucket-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('add-group-btn')).toBeInTheDocument();
  });

  it('selecting bucketed radio reveals group configuration with default groups', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.queryByTestId('bucket-definitions')).not.toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-format-bucketed')); });

    expect(screen.getByTestId('bucket-definitions')).toBeInTheDocument();
    // default creates 6 groups
    expect(screen.getByTestId('bucket-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('bucket-row-5')).toBeInTheDocument();
  });

  it('selecting flat radio hides group configuration', async () => {
    seedFormatStep({
      format: 'bucketed',
      buckets: [{ label: 'Group 1', min_picks: 1, max_picks: 1 }],
      count_best: 1,
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('bucket-definitions')).toBeInTheDocument();

    act(() => { fireEvent.click(screen.getByTestId('wizard-format-flat')); });

    expect(screen.queryByTestId('bucket-definitions')).not.toBeInTheDocument();
    expect(screen.getByTestId('flat-config')).toBeInTheDocument();
  });

  it('Add Group button appends a new group row', async () => {
    seedFormatStep({
      format: 'bucketed',
      buckets: [{ label: 'Group 1', min_picks: 1, max_picks: 1 }],
      count_best: 1,
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('add-group-btn')); });

    expect(screen.getByTestId('bucket-row-1')).toBeInTheDocument();
  });

  // AC3: non-empty group names required
  it('bucketed format: blocks Next when a group name is empty', async () => {
    seedFormatStep({
      format: 'bucketed',
      buckets: [{ label: '', min_picks: 1, max_picks: 1 }],
      count_best: 1,
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/Each group must have a non-empty name/)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-format')).toBeInTheDocument();
  });

  // AC3: duplicate group names blocked
  it('bucketed format: blocks Next when group names are duplicated', async () => {
    seedFormatStep({
      format: 'bucketed',
      buckets: [
        { label: 'Elite', min_picks: 1, max_picks: 1 },
        { label: 'Elite', min_picks: 1, max_picks: 1 },
      ],
      count_best: 1,
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/Group names must be unique/)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-format')).toBeInTheDocument();
  });

  it('bucketed format: shows scoring summary reflecting group count and M', async () => {
    seedFormatStep({
      format: 'bucketed',
      buckets: [
        { label: 'Favorites', min_picks: 1, max_picks: 1 },
        { label: 'Contenders', min_picks: 1, max_picks: 1 },
      ],
      count_best: 1,
    });
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    expect(screen.getByTestId('scoring-summary')).toHaveTextContent(
      'Each entry picks one from each of 2 groups; best 1 count.',
    );
  });

  it('blocks Next when no format is selected', async () => {
    renderWizardPage();
    await act(async () => { await vi.runAllTimersAsync(); });

    act(() => { fireEvent.click(screen.getByTestId('wizard-next-btn')); });

    expect(screen.getByText(/Select a format/)).toBeInTheDocument();
    expect(screen.getByTestId('wizard-step-format')).toBeInTheDocument();
  });
});
