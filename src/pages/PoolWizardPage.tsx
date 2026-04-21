import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ClubConfig, CutRuleType, TournamentOption } from '../types/domain';
import { apiClient } from '../api/client';
import {
  listWizardEngines,
  getWizardEngine,
} from '../engines/wizardEngines';
import { buildCreatePoolRequest, type WizardState } from '../utils/poolWizardUtils';

const CUT_RULE_LABELS: Record<CutRuleType, string> = {
  masters: 'Top 50 + ties',
  pga_championship: 'Top 65 + ties',
  us_open: 'Top 60 + ties',
  the_open: 'Top 65 + ties (par floor +8)',
};

const INITIAL_STATE: WizardState = {
  tournament_id: null,
  pool_name: '',
  entry_deadline: '',
  max_entries_per_email: 3,
  engine_type: 'golf',
  format: null,
  buckets: [],
  pick_count: 7,
  count_best: 5,
  min_cuts_to_qualify: 5,
  bracket_rounds: 4,
  bracket_points_per_round: [1, 2, 4, 8],
};

function validateStep1(s: WizardState): string[] {
  const errs: string[] = [];
  if (s.tournament_id === null) errs.push('Select a tournament.');
  if (!s.pool_name.trim()) errs.push('Pool name is required.');
  if (!s.entry_deadline) errs.push('Entry deadline is required.');
  if (s.max_entries_per_email < 1) errs.push('Max entries per email must be at least 1.');
  return errs;
}

function validateStep2(s: WizardState): string[] {
  const reg = getWizardEngine(s.engine_type);
  if (!reg) return [`Unknown engine type: ${s.engine_type}`];
  return reg.validateStep2(s);
}

function validateStep3(s: WizardState): string[] {
  const reg = getWizardEngine(s.engine_type);
  if (!reg || !reg.hasStep3) return [];
  return reg.validateStep3(s);
}

interface StepProps {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
  errors: string[];
}

function Step1Form({
  state,
  onChange,
  errors,
  tournaments,
}: StepProps & { tournaments: TournamentOption[] }) {
  return (
    <div data-testid="wizard-step-1">
      <h2>Step 1 — Tournament Selection</h2>
      {errors.map((e) => (
        <p key={e} className="wizard-error" role="alert">{e}</p>
      ))}
      <label>
        Tournament
        <select
          value={state.tournament_id ?? ''}
          onChange={(e) => {
            const id = e.target.value ? Number(e.target.value) : null;
            const selected = id ? tournaments.find((t) => t.id === id) : null;
            if (selected) {
              const engineReg = getWizardEngine('golf');
              const defaults = engineReg ? engineReg.defaultState : {};
              onChange({
                tournament_id: id,
                engine_type: 'golf',
                ...defaults,
                format: selected.default_format,
              });
            } else {
              onChange({ tournament_id: null });
            }
          }}
        >
          <option value="">-- Select --</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      {state.tournament_id !== null && (() => {
        const sel = tournaments.find((t) => t.id === state.tournament_id);
        return sel ? (
          <p className="tournament-cut-rule" data-testid="cut-rule-hint">
            Cut rule: {CUT_RULE_LABELS[sel.cut_rule_type]}
          </p>
        ) : null;
      })()}
      <label>
        Pool Name
        <input
          type="text"
          value={state.pool_name}
          onChange={(e) => onChange({ pool_name: e.target.value })}
        />
      </label>
      <label>
        Entry Deadline
        <input
          type="datetime-local"
          value={state.entry_deadline}
          onChange={(e) => onChange({ entry_deadline: e.target.value })}
        />
      </label>
      <label>
        Max Entries per Email
        <input
          type="number"
          min={1}
          value={state.max_entries_per_email}
          onChange={(e) => onChange({ max_entries_per_email: Number(e.target.value) })}
        />
      </label>
    </div>
  );
}

function Step2Form({ state, onChange, errors }: StepProps) {
  const engines = listWizardEngines();
  const selectedReg = getWizardEngine(state.engine_type);

  function handleEngineChange(id: string) {
    const reg = getWizardEngine(id);
    onChange({ engine_type: id, ...(reg ? reg.defaultState : {}) });
  }

  return (
    <div data-testid="wizard-step-2">
      <h2>Step 2 — Format Template</h2>
      <fieldset>
        <legend>Pool type</legend>
        {engines.map((reg) => (
          <label key={reg.id}>
            <input
              type="radio"
              name="engine_type"
              value={reg.id}
              checked={state.engine_type === reg.id}
              onChange={() => handleEngineChange(reg.id)}
            />
            {reg.displayName}
          </label>
        ))}
      </fieldset>

      {selectedReg && (
        <selectedReg.ConfigFields state={state} onChange={onChange} errors={errors} />
      )}
    </div>
  );
}

function Step3Form({ state, onChange, errors }: StepProps) {
  const reg = getWizardEngine(state.engine_type);
  if (!reg?.hasStep3 || !reg.Step3Fields) return null;
  return <reg.Step3Fields state={state} onChange={onChange} errors={errors} />;
}

function Step4Review({
  state,
  tournaments,
  onPublish,
  publishing,
  publishError,
}: {
  state: WizardState;
  tournaments: TournamentOption[];
  onPublish: () => void;
  publishing: boolean;
  publishError: string | null;
}) {
  const tournament = tournaments.find((t) => t.id === state.tournament_id);
  const engineReg = getWizardEngine(state.engine_type);

  return (
    <div data-testid="wizard-step-4">
      <h2>Step 4 — Review &amp; Publish</h2>
      {publishError && <p className="wizard-error" role="alert">{publishError}</p>}
      <dl className="review-summary">
        <dt>Tournament</dt>
        <dd>{tournament?.name ?? state.tournament_id}</dd>
        {tournament && (
          <>
            <dt>Cut Rule</dt>
            <dd>{CUT_RULE_LABELS[tournament.cut_rule_type]}</dd>
          </>
        )}
        <dt>Pool Name</dt>
        <dd>{state.pool_name}</dd>
        <dt>Entry Deadline</dt>
        <dd>{state.entry_deadline}</dd>
        <dt>Max Entries per Email</dt>
        <dd>{state.max_entries_per_email}</dd>
        <dt>Pool Type</dt>
        <dd>{engineReg?.displayName ?? state.engine_type}</dd>
        {state.engine_type === 'golf' && (
          <>
            <dt>Format</dt>
            <dd>{state.format === 'bucketed' ? 'Bucketed picks' : 'Flat picks'}</dd>
            <dt>Pick Count</dt>
            <dd>{state.pick_count}</dd>
            <dt>Best N Counted</dt>
            <dd>{state.count_best}</dd>
            <dt>Min Cuts to Qualify</dt>
            <dd>{state.min_cuts_to_qualify}</dd>
            {state.format === 'bucketed' && (
              <>
                <dt>Buckets</dt>
                <dd>
                  <ul>
                    {state.buckets.map((b, i) => (
                      <li key={i}>{b.label} (min {b.min_picks}, max {b.max_picks})</li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
          </>
        )}
        {state.engine_type === 'bracket' && (
          <>
            <dt>Rounds</dt>
            <dd>{state.bracket_rounds}</dd>
            <dt>Points per Round</dt>
            <dd>{state.bracket_points_per_round.join(', ')}</dd>
          </>
        )}
      </dl>
      <button type="button" onClick={onPublish} disabled={publishing}>
        {publishing ? 'Publishing…' : 'Publish Pool'}
      </button>
    </div>
  );
}

const VALIDATORS = [validateStep1, validateStep2, validateStep3, () => []];

interface PoolWizardPageProps {
  clubConfig: ClubConfig;
}

export function PoolWizardPage({ clubConfig }: PoolWizardPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [attempted, setAttempted] = useState(false);
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getTournaments().then(setTournaments).catch(() => {});
    apiClient.getActivePool(clubConfig.code).then((pool) => {
      if (pool) {
        navigate(`/${clubConfig.code}/admin/pools/${pool.id}`, { replace: true });
      }
    }).catch(() => {});
  }, [clubConfig.code, navigate]);

  function patch(updates: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...updates }));
  }

  const currentErrors = VALIDATORS[step - 1](state);
  const displayErrors = attempted ? currentErrors : [];

  function engineHasStep3(): boolean {
    return getWizardEngine(state.engine_type)?.hasStep3 ?? false;
  }

  function handleNext() {
    setAttempted(true);
    if (currentErrors.length > 0) return;
    setAttempted(false);
    if (step === 2 && !engineHasStep3()) {
      setStep(4);
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleBack() {
    setAttempted(false);
    if (step === 4 && !engineHasStep3()) {
      setStep(2);
    } else {
      setStep((s) => s - 1);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError(null);
    try {
      const request = buildCreatePoolRequest(state, clubConfig.code);
      await apiClient.createPool(request);
      navigate(`/${clubConfig.code}/entry`);
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed. Please try again.');
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="main-content pool-wizard" data-testid="pool-wizard">
      <h1>New Pool — {clubConfig.shortName}</h1>
      <div className="wizard-steps" aria-label="Wizard progress">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`wizard-step-indicator${step === n ? ' active' : ''}`}>
            {n}
          </span>
        ))}
      </div>

      {step === 1 && (
        <Step1Form state={state} onChange={patch} errors={displayErrors} tournaments={tournaments} />
      )}
      {step === 2 && <Step2Form state={state} onChange={patch} errors={displayErrors} />}
      {step === 3 && <Step3Form state={state} onChange={patch} errors={displayErrors} />}
      {step === 4 && (
        <Step4Review
          state={state}
          tournaments={tournaments}
          onPublish={handlePublish}
          publishing={publishing}
          publishError={publishError}
        />
      )}

      <div className="wizard-nav">
        {step > 1 && step < 4 && (
          <button type="button" onClick={handleBack}>Back</button>
        )}
        {step < 4 && (
          <button type="button" onClick={handleNext}>Next</button>
        )}
        {step === 4 && (
          <button type="button" onClick={handleBack}>Back</button>
        )}
      </div>
    </div>
  );
}
