import type { BillingStatus } from '../types/domain';

export const BILLING_STATUS_LABELS: Record<BillingStatus, string> = {
  trial: 'Trial',
  active: 'Active',
  suspended: 'Suspended',
};
