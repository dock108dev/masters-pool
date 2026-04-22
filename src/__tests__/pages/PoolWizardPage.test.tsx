import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { PoolWizardPage } from '../../pages/PoolWizardPage';
import { buildCreatePoolRequest } from '../../utils/poolWizardUtils';
import { getClubConfig } from '../../config/clubs';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

// Wizard page checks for existing active pool on mount; we want no redirect by default
beforeEach(() => {
  activeClient = new MockApiClient(0);
  vi.spyOn(activeClient, 'getActivePool').mockResolvedValue(null);
});

const rvccConfig = getClubConfig('rvcc');

function renderWizard(clubConfig = rvccConfig) {
  return render(
    <MemoryRouter initialEntries={['/admin/pools/new']}>
      <Routes>
        <Route
          path="/admin/pools/new"
          element={<PoolWizardPage clubConfig={clubConfig} />}
        />
        <Route path="/entry" element={<div data-testid="entry-page">Entry</div>} />
        <Route
          path="/admin/pools/:poolId"
          element={<div data-testid="readonly-page">Read-only</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

// ── Step navigation helpers ──────────────────────────────────────────────────

async function fillStep1() {
  // Wait for async tournament options to load before interacting with the select
  await waitFor(() => screen.getByRole('option', { name: /masters 2026/i }));
  fireEvent.change(screen.getByRole('combobox'), { target: { value: '101' } });
  fireEvent.change(screen.getByLabelText(/pool name/i), {
    target: { value: 'Test Masters Pool' },
  });
  fireEvent.change(screen.getByLabelText(/entry deadline/i), {
    target: { value: '2026-04-09T07:00' },
  });
  fireEvent.change(screen.getByLabelText(/max entries per email/i), {
    target: { value: '3' },
  });
}

function clickNext() {
  fireEvent.click(screen.getByRole('button', { name: /next/i }));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('PoolWizardPage', () => {
  it('renders step 1 on initial load', async () => {
    renderWizard();
    await waitFor(() => {
      expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument();
    });
  });

  it('blocks progression from step 1 when fields are empty', async () => {
    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));
    clickNext();
    expect(screen.getByTestId('wizard-step-1')).toBeInTheDocument();
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('advances from step 1 to step 2 when all fields are filled', async () => {
    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));
    await fillStep1();
    clickNext();
    expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument();
  });

  // ── Required AC test 1 ────────────────────────────────────────────────────
  it('blocks progression from step 2 when bucketed format has no groups', async () => {
    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));

    await fillStep1();
    clickNext();

    // On step 2: select bucketed format (auto-fills defaults with 6 groups)
    expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('wizard-format-bucketed'));

    // Confirm groups were pre-filled
    await waitFor(() => expect(screen.getByTestId('bucket-definitions')).toBeInTheDocument());

    // Remove all 6 groups — re-query each time to avoid stale references
    let removeBtns = screen.getAllByRole('button', { name: /remove group/i });
    while (removeBtns.length > 0) {
      fireEvent.click(removeBtns[0]);
      removeBtns = screen.queryAllByRole('button', { name: /remove group/i });
    }

    // No group rows should remain
    expect(screen.queryAllByTestId(/bucket-row-/)).toHaveLength(0);

    // Attempt to advance — should be blocked
    clickNext();

    expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument();
    expect(screen.getByText(/add at least one group/i)).toBeInTheDocument();
  });

  // Golf engine has hasStep3:false so flat format goes step 2 → step 4 directly.
  it('advances from step 2 to step 4 review with flat format', async () => {
    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));

    await fillStep1();
    clickNext();

    fireEvent.click(screen.getByTestId('wizard-format-flat'));
    clickNext();

    expect(screen.getByTestId('wizard-step-4')).toBeInTheDocument();
  });

  it('renders step 4 review with correct summary', async () => {
    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));

    await fillStep1();
    clickNext();

    fireEvent.click(screen.getByTestId('wizard-format-flat'));
    clickNext();

    expect(screen.getByTestId('wizard-step-4')).toBeInTheDocument();
    expect(screen.getByText('Test Masters Pool')).toBeInTheDocument();
    expect(screen.getByText('Flat picks')).toBeInTheDocument();
  });

  it('redirects to entry page on successful publish', async () => {
    const mockCreatePool = vi.spyOn(activeClient, 'createPool');

    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));

    await fillStep1();
    clickNext();
    fireEvent.click(screen.getByTestId('wizard-format-flat'));
    clickNext();

    // Publish
    fireEvent.click(screen.getByRole('button', { name: /publish pool/i }));

    await waitFor(() => {
      expect(screen.getByTestId('entry-page')).toBeInTheDocument();
    });

    expect(mockCreatePool).toHaveBeenCalledOnce();
  });

  it('shows error if publish fails', async () => {
    vi.spyOn(activeClient, 'createPool').mockRejectedValue(new Error('Server error'));

    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));

    await fillStep1();
    clickNext();
    fireEvent.click(screen.getByTestId('wizard-format-flat'));
    clickNext();

    fireEvent.click(screen.getByRole('button', { name: /publish pool/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/server error/i)).toBeInTheDocument();
  });

  it('redirects to read-only view when an active pool already exists', async () => {
    const { MOCK_RVCC_POOL } = await import('../../api/mock/data');
    vi.spyOn(activeClient, 'getActivePool').mockResolvedValue(MOCK_RVCC_POOL);

    renderWizard();

    await waitFor(() => {
      expect(screen.getByTestId('readonly-page')).toBeInTheDocument();
    });
  });

  // ── Tournament pre-fill AC tests ─────────────────────────────────────────

  it('shows cut rule hint after tournament selection', async () => {
    renderWizard();
    await waitFor(() => screen.getByRole('option', { name: /masters 2026/i }));

    // No hint before selection
    expect(screen.queryByTestId('cut-rule-hint')).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '101' } });

    expect(screen.getByTestId('cut-rule-hint')).toBeInTheDocument();
    expect(screen.getByTestId('cut-rule-hint')).toHaveTextContent('Top 50 + ties');
  });

  it('shows correct cut rule label for each major', async () => {
    renderWizard();
    await waitFor(() => screen.getByRole('option', { name: /masters 2026/i }));

    const cases: Array<{ value: string; expected: RegExp }> = [
      { value: '101', expected: /top 50 \+ ties/i },
      { value: '102', expected: /top 65 \+ ties/i },
      { value: '103', expected: /top 60 \+ ties/i },
      { value: '104', expected: /top 65 \+ ties \(par floor \+8\)/i },
    ];

    for (const { value, expected } of cases) {
      fireEvent.change(screen.getByRole('combobox'), { target: { value } });
      expect(screen.getByTestId('cut-rule-hint')).toHaveTextContent(expected);
    }
  });

  it('pre-fills flat format when tournament with default_format=flat is selected', async () => {
    renderWizard();
    await waitFor(() => screen.getByRole('option', { name: /masters 2026/i }));

    // Select Masters (default_format: flat)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '101' } });
    fireEvent.change(screen.getByLabelText(/pool name/i), { target: { value: 'Test Pool' } });
    fireEvent.change(screen.getByLabelText(/entry deadline/i), { target: { value: '2026-04-09T07:00' } });
    clickNext();

    // Step 2 should show flat radio pre-selected
    await waitFor(() => expect(screen.getByTestId('wizard-step-2')).toBeInTheDocument());
    const flatRadio = screen.getByTestId('wizard-format-flat') as HTMLInputElement;
    expect(flatRadio.checked).toBe(true);
  });

  it('shows all four major tournaments in step 1 dropdown', async () => {
    renderWizard();
    await waitFor(() => screen.getByRole('option', { name: /masters 2026/i }));

    expect(screen.getByRole('option', { name: /masters 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /pga championship 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /us open 2026/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /the open 2026/i })).toBeInTheDocument();
  });

  it('shows cut rule in step 4 review', async () => {
    renderWizard();
    await waitFor(() => screen.getByTestId('wizard-step-1'));

    await fillStep1(); // selects Masters 2026 (id: 101)
    clickNext();
    fireEvent.click(screen.getByTestId('wizard-format-flat'));
    clickNext();

    expect(screen.getByTestId('wizard-step-4')).toBeInTheDocument();
    expect(screen.getByText('Top 50 + ties')).toBeInTheDocument();
  });
});

// ── Required AC test 2 ────────────────────────────────────────────────────────

describe('buildCreatePoolRequest', () => {
  it('flat format produces rules_json with no buckets key', () => {
    const state = {
      tournament_id: 101,
      pool_name: 'Test Pool',
      entry_deadline: '2026-04-09T07:00',
      max_entries_per_email: 3,
      format: 'flat' as const,
      buckets: [],
      pick_count: 7,
      count_best: 5,
      min_cuts_to_qualify: 5,
    };

    const request = buildCreatePoolRequest(state, 'rvcc');

    expect('buckets' in request.rules_json).toBe(false);
    expect(request.rules_json.uses_buckets).toBe(false);
    expect(request.rules_json.variant).toBe('flat');
  });

  it('bucketed format produces rules_json with buckets key', () => {
    const buckets = [
      { label: 'Group 1', min_picks: 1, max_picks: 1 },
      { label: 'Group 2', min_picks: 1, max_picks: 1 },
    ];
    const state = {
      tournament_id: 101,
      pool_name: 'Test Pool',
      entry_deadline: '2026-04-09T07:00',
      max_entries_per_email: 2,
      format: 'bucketed' as const,
      buckets,
      pick_count: 2,
      count_best: 2,
      min_cuts_to_qualify: 1,
    };

    const request = buildCreatePoolRequest(state, 'crestmont');

    expect(request.rules_json.buckets).toEqual(buckets);
    expect(request.rules_json.uses_buckets).toBe(true);
    expect(request.rules_json.variant).toBe('bucketed');
  });
});
