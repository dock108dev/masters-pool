import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalytics } from '../../hooks/useAnalytics';
import { apiClient } from '../../api/client';
import { WizardShell } from '../../components/onboarding/WizardShell';
import type { WizardStepDef } from '../../components/onboarding/WizardShell';
import { SlugAvailabilityInput } from '../../components/onboarding/SlugAvailabilityInput';
import { getWizardEngine, listWizardEngines } from '../../engines/wizardEngines';
import { buildCreatePoolRequest } from '../../utils/poolWizardUtils';
import {
  ONBOARDING_WIZARD_KEY,
  DEFAULT_ONBOARDING_WIZARD_STATE,
} from '../../utils/poolWizardUtils';
import type { OnboardingWizardState } from '../../utils/poolWizardUtils';
import { usePersistedState } from '../../hooks/usePersistedState';
import type { TournamentOption } from '../../types/domain';
import type { OnboardingWizardSubmitResponse } from '../../api/types';

const STEP_COUNT = 5;
const SHARE_STEP_INDEX = 4;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseInviteEmails(raw: string): string[] {
  return raw.split(',').map((e) => e.trim()).filter(Boolean);
}

function isValidInviteList(raw: string): boolean {
  const emails = parseInviteEmails(raw);
  return emails.length > 0 && emails.every((e) => EMAIL_RE.test(e));
}

const IANA_ZONES: string[] = (() => {
  try {
    return (Intl as { supportedValuesOf(k: string): string[] }).supportedValuesOf('timeZone');
  } catch {
    return [
      'America/New_York', 'America/Chicago', 'America/Denver',
      'America/Los_Angeles', 'America/Phoenix', 'Pacific/Honolulu',
    ];
  }
})();

function buildSummaryItems(state: OnboardingWizardState): { label: string; value: string }[] {
  const engine = getWizardEngine(state.engine_type);
  const lockLabel = state.lock_timing_source === 'auto' ? 'Auto (tournament start)' : 'Manual';
  const feeLabel = state.entry_fee_enabled
    ? `${state.entry_fee_amount} ${state.entry_fee_currency}`
    : '';
  return [
    { label: 'Club name', value: state.club_name },
    { label: 'Club slug', value: state.club_slug },
    { label: 'Time zone', value: state.time_zone },
    { label: 'Pool name', value: state.pool_name },
    { label: 'Engine', value: engine?.displayName ?? state.engine_type },
    { label: 'Format', value: state.format ?? '' },
    { label: 'Deadline', value: state.entry_deadline },
    { label: 'Lock', value: lockLabel },
    { label: 'Entry fee', value: feeLabel },
  ].filter(({ value }) => value !== '');
}

export function OnboardingWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);
  const [tournamentsError, setTournamentsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedSlug, setConfirmedSlug] = useState('');

  // Share step state
  const [createdPool, setCreatedPool] = useState<OnboardingWizardSubmitResponse | null>(null);
  const [inviteEmails, setInviteEmails] = useState('');
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSending, setInviteSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const creationStarted = useRef(false);

  const { capture } = useAnalytics();
  const [wizardState, setWizardState, clearWizardState] = usePersistedState<OnboardingWizardState>(
    ONBOARDING_WIZARD_KEY,
    DEFAULT_ONBOARDING_WIZARD_STATE,
  );

  // On first visit, seed club_slug from URL param if not already persisted.
  useEffect(() => {
    const clubFromUrl = searchParams.get('club');
    if (clubFromUrl && !wizardState.club_slug) {
      setWizardState((prev) => ({ ...prev, club_slug: clubFromUrl }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    apiClient
      .getTournaments()
      .then(setTournaments)
      .catch(() => setTournamentsError('Could not load tournaments. Please refresh.'));
  }, []);

  const currentStep = wizardState.step;

  async function triggerPoolCreation() {
    if (!wizardState.tournament_id) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const poolRequest = buildCreatePoolRequest(wizardState, wizardState.club_slug as 'rvcc');
      const result = await apiClient.submitOnboardingWizard({
        club_slug: wizardState.club_slug,
        pool_name: wizardState.pool_name,
        tournament_id: wizardState.tournament_id,
        entry_deadline: wizardState.entry_deadline,
        max_entries_per_email: wizardState.max_entries_per_email,
        rules_json: poolRequest.rules_json,
      });
      capture('pool_created');
      setCreatedPool(result);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Pool creation failed. Please try again.',
      );
      // Allow retry by resetting the guard
      creationStarted.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }

  // Auto-trigger pool creation when the share step is first reached.
  useEffect(() => {
    if (currentStep !== SHARE_STEP_INDEX || creationStarted.current) return;
    creationStarted.current = true;
    void triggerPoolCreation();
  }, [currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(patch: Partial<OnboardingWizardState>) {
    setWizardState((prev) => ({ ...prev, ...patch }));
  }

  function handleBack() {
    if (currentStep > 0) {
      setWizardState((prev) => ({ ...prev, step: prev.step - 1 }));
    }
  }

  function handleAdvance() {
    if (currentStep < STEP_COUNT - 1) {
      capture('wizard_step_completed', { step: currentStep });
      setWizardState((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  }

  function handleSubmit() {
    if (createdPool) {
      clearWizardState();
      navigate(`/admin/pools/${createdPool.pool_id}`, { replace: true });
      return;
    }
    // Retry pool creation (e.g., after a prior failure)
    void triggerPoolCreation();
  }

  async function handleSendInvites() {
    if (!createdPool || !isValidInviteList(inviteEmails)) return;
    setInviteSending(true);
    setInviteError(null);
    try {
      await apiClient.sendPoolInvites(createdPool.pool_id, {
        emails: parseInviteEmails(inviteEmails),
      });
      setInviteSent(true);
      setInviteEmails('');
    } catch (err: unknown) {
      setInviteError(
        err instanceof Error ? err.message : 'Failed to send invites. Please try again.',
      );
    } finally {
      setInviteSending(false);
    }
  }

  async function handleCopyUrl() {
    if (!createdPool) return;
    try {
      await navigator.clipboard.writeText(createdPool.entry_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available — URL remains visible in the input
    }
  }

  const engine = getWizardEngine(wizardState.engine_type) ?? getWizardEngine('golf')!;
  const engines = listWizardEngines();

  const steps: WizardStepDef[] = [
    {
      id: 'club-identity',
      label: 'Club',
      render: ({ state, onChange, errors }) => (
        <div data-testid="wizard-step-identity">
          <h2>Step 1 — Club Identity</h2>
          {errors.map((e) => (
            <p key={e} className="wizard-error" role="alert">{e}</p>
          ))}
          <div className="form-group">
            <label htmlFor="wizard-club-name">Club name</label>
            <input
              id="wizard-club-name"
              type="text"
              value={state.club_name}
              onChange={(e) => onChange({ club_name: e.target.value })}
              data-testid="wizard-club-name-input"
              maxLength={80}
            />
          </div>
          <SlugAvailabilityInput
            value={state.club_slug}
            onChange={(val) => {
              onChange({ club_slug: val });
              if (val !== confirmedSlug) setConfirmedSlug('');
            }}
            onValidSlug={(slug) => setConfirmedSlug(slug)}
            apiClient={apiClient}
          />
          <div className="form-group">
            <label htmlFor="wizard-timezone">Time zone</label>
            <select
              id="wizard-timezone"
              value={state.time_zone}
              onChange={(e) => onChange({ time_zone: e.target.value })}
              data-testid="wizard-timezone-select"
            >
              <option value="">Select time zone…</option>
              {IANA_ZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>
      ),
      validate: (state) => {
        const errs: string[] = [];
        const name = state.club_name.trim();
        if (name.length < 2) errs.push('Club name must be at least 2 characters.');
        if (name.length > 80) errs.push('Club name must be 80 characters or fewer.');
        if (!state.club_slug) {
          errs.push('Club URL slug is required.');
        } else if (confirmedSlug !== state.club_slug) {
          errs.push('Slug must be available before continuing.');
        }
        if (!state.time_zone) errs.push('Time zone is required.');
        return errs;
      },
    },
    {
      id: 'pool-identity',
      label: 'Pool',
      render: ({ state, onChange, errors }) => (
        <div data-testid="wizard-step-pool-identity">
          <h2>Step 2 — Pool Identity</h2>
          {errors.map((e) => (
            <p key={e} className="wizard-error" role="alert">{e}</p>
          ))}
          {tournamentsError && (
            <p className="wizard-error" role="alert" data-testid="tournaments-load-error">
              {tournamentsError}
            </p>
          )}
          <div className="form-group">
            <label htmlFor="wizard-pool-name">Pool name</label>
            <input
              id="wizard-pool-name"
              type="text"
              value={state.pool_name}
              onChange={(e) => onChange({ pool_name: e.target.value })}
              data-testid="wizard-pool-name-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="wizard-tournament">Tournament</label>
            <select
              id="wizard-tournament"
              value={state.tournament_id ?? ''}
              onChange={(e) =>
                onChange({ tournament_id: e.target.value ? Number(e.target.value) : null })
              }
              data-testid="wizard-tournament-select"
            >
              <option value="">Select tournament…</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.year}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="wizard-max-entries">Max entries per email</label>
            <input
              id="wizard-max-entries"
              type="number"
              min={1}
              value={state.max_entries_per_email}
              onChange={(e) => onChange({ max_entries_per_email: Number(e.target.value) })}
              data-testid="wizard-max-entries-input"
            />
          </div>
        </div>
      ),
      validate: (state) => {
        const errs: string[] = [];
        if (!state.pool_name.trim()) errs.push('Pool name is required.');
        if (!state.tournament_id) errs.push('Tournament is required.');
        if (state.max_entries_per_email < 1) errs.push('Max entries must be at least 1.');
        return errs;
      },
    },
    {
      id: 'format',
      label: 'Format',
      render: ({ state, onChange, errors }) => {
        const eng = getWizardEngine(state.engine_type) ?? engine;
        return (
          <div data-testid="wizard-step-format">
            <h2>Step 2 — Pick Format</h2>
            <div className="form-group">
              <fieldset>
                <legend>Pool type</legend>
                {engines.map((e) => (
                  <label key={e.id}>
                    <input
                      type="radio"
                      name="engine_type"
                      value={e.id}
                      checked={state.engine_type === e.id}
                      onChange={() => {
                        const defaults = e.defaultState;
                        onChange({ engine_type: e.id, ...defaults });
                      }}
                      data-testid={`wizard-engine-${e.id}`}
                    />
                    {e.displayName} — {e.description}
                  </label>
                ))}
              </fieldset>
            </div>
            <eng.ConfigFields state={state} onChange={onChange} errors={errors} />
          </div>
        );
      },
      validate: (state) => {
        const eng = getWizardEngine(state.engine_type);
        return eng ? eng.validateStep2(state) : [];
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      render: ({ state, onChange, errors }) => {
        const selectedTournament = tournaments.find((t) => t.id === state.tournament_id);
        const deadlineWarning = (() => {
          if (!state.entry_deadline || !selectedTournament?.start_date) return null;
          const deadline = new Date(state.entry_deadline);
          const tournStart = new Date(selectedTournament.start_date);
          const diffHours = (tournStart.getTime() - deadline.getTime()) / (1000 * 60 * 60);
          if (diffHours >= 0 && diffHours < 24) {
            return 'Deadline is within 24 hours of the tournament start. Entries will still be open when play begins.';
          }
          return null;
        })();

        return (
          <div data-testid="wizard-step-settings">
            <h2>Step 3 — Pool Settings</h2>
            {errors.map((e) => (
              <p key={e} className="wizard-error" role="alert">{e}</p>
            ))}

            <div className="form-group">
              <label htmlFor="wizard-deadline">
                Entry deadline
                {state.time_zone && (
                  <span className="wizard-tz-hint"> ({state.time_zone})</span>
                )}
              </label>
              <input
                id="wizard-deadline"
                type="datetime-local"
                value={state.entry_deadline}
                onChange={(e) => onChange({ entry_deadline: e.target.value })}
                data-testid="wizard-deadline-input"
              />
              {deadlineWarning && (
                <p className="wizard-warning" data-testid="wizard-deadline-warning">
                  {deadlineWarning}
                </p>
              )}
            </div>

            <div className="form-group">
              <fieldset>
                <legend>Lock timing</legend>
                <label>
                  <input
                    type="radio"
                    name="lock_timing_source"
                    value="auto"
                    checked={state.lock_timing_source === 'auto'}
                    onChange={() => onChange({ lock_timing_source: 'auto' })}
                    data-testid="wizard-lock-auto"
                  />
                  {' '}Auto-lock when tournament starts
                </label>
                <label>
                  <input
                    type="radio"
                    name="lock_timing_source"
                    value="manual"
                    checked={state.lock_timing_source === 'manual'}
                    onChange={() => onChange({ lock_timing_source: 'manual' })}
                    data-testid="wizard-lock-manual"
                  />
                  {' '}Manual lock by coordinator
                </label>
              </fieldset>
              {state.lock_timing_source === 'auto' && (
                <p className="wizard-info-banner" data-testid="wizard-autolock-banner">
                  Entries will be automatically locked when the tournament&apos;s first tee time is
                  detected.
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="wizard-fee-toggle-label">
                <input
                  type="checkbox"
                  checked={state.entry_fee_enabled}
                  onChange={(e) => onChange({ entry_fee_enabled: e.target.checked })}
                  data-testid="wizard-fee-toggle"
                />
                {' '}Charge an entry fee
              </label>
              {state.entry_fee_enabled && (
                <div className="wizard-fee-fields" data-testid="wizard-fee-fields">
                  <div className="form-group">
                    <label htmlFor="wizard-fee-amount">Amount</label>
                    <input
                      id="wizard-fee-amount"
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={state.entry_fee_amount || ''}
                      onChange={(e) => onChange({ entry_fee_amount: Number(e.target.value) })}
                      data-testid="wizard-fee-amount-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="wizard-fee-currency">Currency</label>
                    <select
                      id="wizard-fee-currency"
                      value={state.entry_fee_currency}
                      onChange={(e) => onChange({ entry_fee_currency: e.target.value })}
                      data-testid="wizard-fee-currency-select"
                    >
                      <option value="USD">USD</option>
                      <option value="CAD">CAD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
      validate: (state) => {
        const errs: string[] = [];
        if (!state.entry_deadline) {
          errs.push('Entry deadline is required.');
        } else {
          const deadline = new Date(state.entry_deadline);
          if (isNaN(deadline.getTime())) {
            errs.push('Entry deadline is invalid.');
          } else if (deadline <= new Date()) {
            errs.push('Entry deadline must be in the future.');
          }
        }
        if (state.entry_fee_enabled && state.entry_fee_amount <= 0) {
          errs.push('Entry fee amount must be greater than 0.');
        }
        return errs;
      },
    },
    {
      id: 'share',
      label: 'Share',
      render: () => (
        <div data-testid="wizard-step-share">
          <h2>Step 4 — Share &amp; Launch</h2>

          {isSubmitting && (
            <p className="wizard-info-banner" data-testid="pool-creation-pending">
              Creating your pool…
            </p>
          )}

          {submitError && !isSubmitting && !createdPool && (
            <p className="wizard-error" role="alert" data-testid="pool-creation-error">
              {submitError}
            </p>
          )}

          {createdPool && (
            <>
              <p className="wizard-info-banner" data-testid="pool-created-banner">
                Your pool is ready to share!
              </p>

              <div className="form-group">
                <label htmlFor="entry-url-display">Entry link</label>
                <div className="wizard-url-row">
                  <input
                    id="entry-url-display"
                    type="text"
                    readOnly
                    value={createdPool.entry_url}
                    data-testid="entry-url-display"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void handleCopyUrl()}
                    data-testid="copy-url-btn"
                  >
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
                <a
                  href={createdPool.entry_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="preview-entry-link"
                >
                  Preview entry form
                </a>
              </div>

              <div className="form-group">
                <label htmlFor="invite-emails">
                  Invite via email{' '}
                  <span className="wizard-field-hint">(comma-separated addresses)</span>
                </label>
                <textarea
                  id="invite-emails"
                  value={inviteEmails}
                  onChange={(e) => {
                    setInviteEmails(e.target.value);
                    setInviteError(null);
                    setInviteSent(false);
                  }}
                  placeholder="alice@example.com, bob@example.com"
                  rows={3}
                  data-testid="invite-emails-input"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => void handleSendInvites()}
                  disabled={!isValidInviteList(inviteEmails) || inviteSending}
                  data-testid="send-invites-btn"
                >
                  {inviteSending ? 'Sending…' : 'Send Invites'}
                </button>
                {inviteSent && (
                  <p className="wizard-success" data-testid="invite-sent-confirmation">
                    Invites sent!
                  </p>
                )}
                {inviteError && (
                  <p className="wizard-error" role="alert" data-testid="invite-error">
                    {inviteError}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!wizardState.club_slug && !searchParams.get('club')) {
    return (
      <div className="marketing-page" data-testid="wizard-no-club-error">
        <header className="marketing-header">
          <div className="marketing-logo">Country Club Picks</div>
        </header>
        <main className="checkout-success-main">
          <p className="validation-error" role="alert">
            Club not found. Please start from the{' '}
            <a href="/">beginning of the onboarding flow</a>.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="marketing-page" data-testid="onboarding-wizard-page">
      <header className="marketing-header">
        <div className="marketing-logo">Country Club Picks</div>
      </header>
      <main className="wizard-page-main">
        <h1 className="wizard-page-title">Set up your pool</h1>
        <WizardShell
          steps={steps}
          state={wizardState}
          currentStep={currentStep}
          onChange={handleChange}
          onBack={handleBack}
          onAdvance={handleAdvance}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          summaryItems={buildSummaryItems(wizardState)}
          submitLabel="Go to Dashboard"
          submitDisabled={!createdPool && !isSubmitting}
        />
      </main>
    </div>
  );
}
