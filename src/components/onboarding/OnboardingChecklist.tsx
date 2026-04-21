export interface OnboardingChecklistProps {
  hasCreatedPool: boolean;
  hasSharedLink: boolean;
  entryCount: number;
  hasViewedStandings: boolean;
}

interface Step {
  id: string;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'create-pool', label: 'Create your pool', description: 'Set up your pool format and rules' },
  { id: 'share-link', label: 'Share your link', description: 'Send the entry link to your club members' },
  { id: 'collect-entries', label: 'Collect entries', description: 'Wait for members to submit their picks' },
  { id: 'view-standings', label: 'View standings', description: 'Track the action during the tournament' },
];

export function OnboardingChecklist({
  hasCreatedPool,
  hasSharedLink,
  entryCount,
  hasViewedStandings,
}: OnboardingChecklistProps) {
  const completedFlags = [hasCreatedPool, hasSharedLink, entryCount > 0, hasViewedStandings];
  const completedCount = completedFlags.filter(Boolean).length;
  const allComplete = completedCount === STEPS.length;

  return (
    <div className="onboarding-checklist" data-testid="onboarding-checklist">
      <div className="onboarding-header">
        <h3>Getting Started</h3>
        <span className="onboarding-progress" data-testid="onboarding-progress">
          {completedCount} / {STEPS.length} complete
        </span>
      </div>

      {allComplete && (
        <p className="onboarding-complete" data-testid="onboarding-all-complete">
          Your pool is live and running. Good luck!
        </p>
      )}

      <div className="onboarding-steps">
        {STEPS.map((step, i) => {
          const done = completedFlags[i];
          return (
            <div
              key={step.id}
              className={`onboarding-step ${done ? 'step--complete' : 'step--pending'}`}
              data-testid={`step-${step.id}`}
            >
              <span className="step-check" aria-hidden="true">{done ? '✓' : '○'}</span>
              <span className="step-label">{step.label}</span>
              {!done && <span className="step-description">{step.description}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
