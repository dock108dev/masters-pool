import type { BucketDefinition } from '../types/domain';

// Shape of wizard form state accessible to engine config components.
// WizardState in poolWizardUtils extends this with step-1 fields (tournament, name, deadline).
export interface WizardFormState {
  engine_type: string;
  // Golf-specific
  format: 'flat' | 'bucketed' | null;
  buckets: BucketDefinition[];
  pick_count: number;
  count_best: number;
  min_cuts_to_qualify: number;
  // Bracket-specific
  bracket_rounds: number;
  bracket_points_per_round: number[];
}

type ConfigFieldsProps = {
  state: WizardFormState;
  onChange: (patch: Partial<WizardFormState>) => void;
  errors: string[];
};

export interface WizardEngineRegistration {
  id: string;
  displayName: string;
  description: string;
  hasStep3: boolean;
  defaultState: Omit<WizardFormState, 'engine_type'>;
  validateStep2(state: WizardFormState): string[];
  validateStep3(state: WizardFormState): string[];
  ConfigFields: (props: ConfigFieldsProps) => React.ReactElement | null;
  Step3Fields: (props: ConfigFieldsProps) => React.ReactElement | null;
}

const _wizardEngines = new Map<string, WizardEngineRegistration>();

export function registerWizardEngine(reg: WizardEngineRegistration): void {
  _wizardEngines.set(reg.id, reg);
}

export function getWizardEngine(id: string): WizardEngineRegistration | undefined {
  return _wizardEngines.get(id);
}

export function listWizardEngines(): WizardEngineRegistration[] {
  return Array.from(_wizardEngines.values());
}

// ── Golf engine registration ─────────────────────────────────────────────────

registerWizardEngine({
  id: 'golf',
  displayName: 'Golf Pool',
  description: 'Pick golfers; score is the sum of your best N finishes.',
  hasStep3: false,
  defaultState: {
    format: null,
    buckets: [],
    pick_count: 7,
    count_best: 5,
    min_cuts_to_qualify: 5,
    bracket_rounds: 4,
    bracket_points_per_round: [1, 2, 4, 8],
  },
  validateStep2(state) {
    const errs: string[] = [];
    if (!state.format) {
      errs.push('Select a format.');
      return errs;
    }
    if (state.format === 'flat') {
      if (state.pick_count < 1) errs.push('Pick count (N) must be at least 1.');
      if (state.count_best < 1 || state.count_best > state.pick_count) {
        errs.push('Best count (M) must be between 1 and pick count (N).');
      }
      if (state.min_cuts_to_qualify < 1 || state.min_cuts_to_qualify > state.pick_count) {
        errs.push('Min cuts to qualify must be between 1 and pick count.');
      }
    }
    if (state.format === 'bucketed') {
      if (state.buckets.length === 0) errs.push('Add at least one group.');
      const emptyLabel = state.buckets.some((b) => !b.label.trim());
      if (emptyLabel) errs.push('Each group must have a non-empty name.');
      const labels = state.buckets.map((b) => b.label.trim().toLowerCase());
      if (labels.length !== new Set(labels).size) errs.push('Group names must be unique.');
      if (state.count_best < 1 || state.count_best > state.buckets.length) {
        errs.push('Best count (M) must be between 1 and the number of groups.');
      }
    }
    return errs;
  },
  validateStep3(_state) {
    return [];
  },
  ConfigFields({ state, onChange, errors }) {
    function handleFormatChange(format: 'flat' | 'bucketed') {
      const buckets =
        format === 'bucketed'
          ? [1, 2, 3, 4, 5, 6].map((n) => ({ label: `Group ${n}`, min_picks: 1, max_picks: 1 }))
          : [];
      const pick_count = format === 'bucketed' ? 6 : 7;
      const count_best = format === 'bucketed' ? 4 : 5;
      const min_cuts_to_qualify = format === 'bucketed' ? 4 : 5;
      onChange({ format, buckets, pick_count, count_best, min_cuts_to_qualify });
    }

    function addBucket() {
      onChange({
        buckets: [
          ...state.buckets,
          { label: `Group ${state.buckets.length + 1}`, min_picks: 1, max_picks: 1 },
        ],
      });
    }

    function removeBucket(idx: number) {
      onChange({ buckets: state.buckets.filter((_, i) => i !== idx) });
    }

    function updateBucket(idx: number, patch: Partial<BucketDefinition>) {
      onChange({ buckets: state.buckets.map((b, i) => (i === idx ? { ...b, ...patch } : b)) });
    }

    return (
      <>
        {errors.map((e) => (
          <p key={e} className="wizard-error" role="alert">{e}</p>
        ))}
        <fieldset>
          <legend>Pick format</legend>
          <label>
            <input
              type="radio"
              name="format"
              value="flat"
              checked={state.format === 'flat'}
              onChange={() => handleFormatChange('flat')}
              data-testid="wizard-format-flat"
            />
            Pick any N, best M count
          </label>
          <label>
            <input
              type="radio"
              name="format"
              value="bucketed"
              checked={state.format === 'bucketed'}
              onChange={() => handleFormatChange('bucketed')}
              data-testid="wizard-format-bucketed"
            />
            Pick one from each group, best M count
          </label>
        </fieldset>

        {state.format === 'flat' && (
          <div data-testid="flat-config">
            <label>
              Total picks per entry (N)
              <input
                type="number"
                min={1}
                data-testid="wizard-pick-count"
                value={state.pick_count}
                onChange={(e) => onChange({ pick_count: Number(e.target.value) })}
              />
            </label>
            <label>
              Best scores counted (M)
              <input
                type="number"
                min={1}
                data-testid="wizard-count-best"
                value={state.count_best}
                onChange={(e) => onChange({ count_best: Number(e.target.value) })}
              />
            </label>
            <label>
              Min golfers to make cut
              <input
                type="number"
                min={1}
                data-testid="wizard-min-cuts"
                value={state.min_cuts_to_qualify}
                onChange={(e) => onChange({ min_cuts_to_qualify: Number(e.target.value) })}
              />
            </label>
            <p data-testid="scoring-summary" className="wizard-scoring-summary">
              Each entry picks {state.pick_count} golfers; best {state.count_best} scores count.
            </p>
          </div>
        )}

        {state.format === 'bucketed' && (
          <div data-testid="bucket-definitions">
            <h3>Group Definitions</h3>
            {state.buckets.map((bucket, idx) => (
              <div key={idx} className="bucket-row" data-testid={`bucket-row-${idx}`}>
                <input
                  type="text"
                  aria-label={`Group ${idx + 1} name`}
                  value={bucket.label}
                  onChange={(e) => updateBucket(idx, { label: e.target.value })}
                />
                <label>
                  Min picks
                  <input
                    type="number"
                    min={1}
                    aria-label={`Group ${idx + 1} min picks`}
                    value={bucket.min_picks}
                    onChange={(e) => updateBucket(idx, { min_picks: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Max picks
                  <input
                    type="number"
                    min={1}
                    aria-label={`Group ${idx + 1} max picks`}
                    value={bucket.max_picks}
                    onChange={(e) => updateBucket(idx, { max_picks: Number(e.target.value) })}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeBucket(idx)}
                  aria-label={`Remove group ${idx + 1}`}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addBucket} data-testid="add-group-btn">Add Group</button>
            <label>
              Best groups counted (M)
              <input
                type="number"
                min={1}
                data-testid="wizard-count-best-bucketed"
                value={state.count_best}
                onChange={(e) => onChange({ count_best: Number(e.target.value) })}
              />
            </label>
            <p data-testid="scoring-summary" className="wizard-scoring-summary">
              Each entry picks one from each of {state.buckets.length} group
              {state.buckets.length !== 1 ? 's' : ''}; best {state.count_best} count.
            </p>
          </div>
        )}
      </>
    );
  },
  Step3Fields(_props) {
    return null;
  },
});

// ── Bracket engine registration ──────────────────────────────────────────────

registerWizardEngine({
  id: 'bracket',
  displayName: 'Bracket Pool',
  description: 'Pick matchup winners; earn points for each correct pick.',
  hasStep3: false,
  defaultState: {
    format: null,
    buckets: [],
    pick_count: 0,
    count_best: 0,
    min_cuts_to_qualify: 0,
    bracket_rounds: 4,
    bracket_points_per_round: [1, 2, 4, 8],
  },
  validateStep2(state) {
    const errs: string[] = [];
    if (state.bracket_rounds < 1) errs.push('Rounds must be at least 1.');
    if (state.bracket_points_per_round.some((p) => p < 1)) {
      errs.push('Each round must award at least 1 point.');
    }
    return errs;
  },
  validateStep3(_state) {
    return [];
  },
  ConfigFields({ state, onChange, errors }) {
    return (
      <>
        {errors.map((e) => (
          <p key={e} className="wizard-error" role="alert">{e}</p>
        ))}
        <label>
          Number of rounds
          <input
            type="number"
            min={1}
            data-testid="bracket-rounds-input"
            value={state.bracket_rounds}
            onChange={(e) => {
              const rounds = Math.max(1, Number(e.target.value));
              const pts = Array.from({ length: rounds }, (_, i) =>
                state.bracket_points_per_round[i] ?? Math.pow(2, i),
              );
              onChange({ bracket_rounds: rounds, bracket_points_per_round: pts });
            }}
          />
        </label>
        <div data-testid="bracket-points-per-round">
          <p>Points per round:</p>
          {Array.from({ length: state.bracket_rounds }, (_, i) => (
            <label key={i}>
              Round {i + 1}
              <input
                type="number"
                min={1}
                aria-label={`Round ${i + 1} points`}
                value={state.bracket_points_per_round[i] ?? 1}
                onChange={(e) => {
                  const pts = [...state.bracket_points_per_round];
                  pts[i] = Number(e.target.value);
                  onChange({ bracket_points_per_round: pts });
                }}
              />
            </label>
          ))}
        </div>
      </>
    );
  },
  Step3Fields(_props) {
    return null;
  },
});
