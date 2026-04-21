import type { BillingStatus, PoolStatus } from '../../types/domain';

export interface UpgradePromptProps {
  poolStatus: PoolStatus;
  billingStatus: BillingStatus;
  onUpgrade: () => void;
}

const CLOSED_STATUSES: PoolStatus[] = ['final', 'archived'];

export function UpgradePrompt({ poolStatus, billingStatus, onUpgrade }: UpgradePromptProps) {
  if (!CLOSED_STATUSES.includes(poolStatus) || billingStatus !== 'trial') return null;

  return (
    <div className="upgrade-prompt" data-testid="upgrade-prompt" role="alert">
      <div className="upgrade-prompt-content">
        <h3>Your trial pool has concluded</h3>
        <p>
          Upgrade to create more pools and keep the action going all season.
        </p>
        <button
          className="btn btn-primary upgrade-prompt-btn"
          data-testid="upgrade-prompt-btn"
          onClick={onUpgrade}
        >
          Upgrade now
        </button>
      </div>
    </div>
  );
}
