import { useState } from 'react';
import type { ReactNode } from 'react';
import type { OnboardingWizardState } from '../../utils/poolWizardUtils';

export interface WizardStepDef {
  id: string;
  label: string;
  render: (props: {
    state: OnboardingWizardState;
    onChange: (patch: Partial<OnboardingWizardState>) => void;
    errors: string[];
  }) => ReactNode;
  validate?: (state: OnboardingWizardState) => string[];
}

interface WizardShellProps {
  steps: WizardStepDef[];
  state: OnboardingWizardState;
  currentStep: number;
  onChange: (patch: Partial<OnboardingWizardState>) => void;
  onBack: () => void;
  onAdvance: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  summaryItems: { label: string; value: string }[];
  submitLabel?: string;
  submitDisabled?: boolean;
}

export function WizardShell({
  steps,
  state,
  currentStep,
  onChange,
  onBack,
  onAdvance,
  onSubmit,
  isSubmitting,
  submitError,
  summaryItems,
  submitLabel,
  submitDisabled,
}: WizardShellProps) {
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const step = steps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  function handleNext() {
    const errs = step.validate?.(state) ?? [];
    if (errs.length > 0) {
      setStepErrors(errs);
      return;
    }
    setStepErrors([]);
    if (isLast) {
      onSubmit();
    } else {
      onAdvance();
    }
  }

  function handleBack() {
    setStepErrors([]);
    onBack();
  }

  return (
    <div className="wizard-shell" data-testid="wizard-shell">
      <nav className="wizard-indicator" aria-label="Wizard steps">
        {steps.map((s, idx) => {
          const status =
            idx < currentStep ? 'completed' : idx === currentStep ? 'active' : 'upcoming';
          return (
            <div
              key={s.id}
              className={`wizard-indicator__step wizard-indicator__step--${status}`}
              data-testid={`wizard-step-indicator-${idx}`}
              aria-current={idx === currentStep ? 'step' : undefined}
            >
              <span className="wizard-indicator__number">{idx + 1}</span>
              <span className="wizard-indicator__label">{s.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="wizard-content">
        <main className="wizard-main">
          {step.render({ state, onChange, errors: stepErrors })}
        </main>

        {summaryItems.length > 0 && (
          <aside className="wizard-sidebar" data-testid="wizard-sidebar">
            <h3 className="wizard-sidebar__title">Summary</h3>
            <dl className="wizard-sidebar__list">
              {summaryItems.map(({ label, value }) => (
                <div key={label} className="wizard-sidebar__item">
                  <dt>{label}</dt>
                  <dd>{value || '—'}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>

      {submitError && (
        <p className="wizard-error" role="alert" data-testid="wizard-submit-error">
          {submitError}
        </p>
      )}

      <nav className="wizard-nav" aria-label="Wizard navigation">
        {!isFirst && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleBack}
            disabled={isSubmitting}
            data-testid="wizard-back-btn"
          >
            Back
          </button>
        )}
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleNext}
          disabled={isSubmitting || (isLast && (submitDisabled ?? false))}
          data-testid={isLast ? 'wizard-submit-btn' : 'wizard-next-btn'}
        >
          {isSubmitting ? 'Submitting…' : isLast ? (submitLabel ?? 'Submit') : 'Next'}
        </button>
      </nav>
    </div>
  );
}
