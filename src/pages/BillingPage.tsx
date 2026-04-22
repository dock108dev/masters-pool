import { useState } from 'react';
import type { ClubConfig } from '../types/domain';
import { useApi } from '../hooks/useApi';
import { apiClient } from '../api/client';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { BILLING_STATUS_LABELS } from '../utils/labels';

interface BillingPageProps {
  clubConfig: ClubConfig;
}

export function BillingPage({ clubConfig }: BillingPageProps) {
  const clubCode = clubConfig.code;
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: billing, loading, error } = useApi(
    () => apiClient.getClubBilling(clubCode),
    [clubCode],
  );

  async function handleManageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const { url } = await apiClient.createBillingPortalSession(clubCode);
      if (!url.startsWith('https://billing.stripe.com/')) {
        throw new Error('Invalid billing portal URL. Please contact support.');
      }
      window.location.href = url;
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Could not open billing portal.');
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="main-content" data-testid="billing-page">
      <h1>Billing — {clubConfig.shortName}</h1>

      {billing ? (
        <div className="billing-info" data-testid="billing-info">
          <div className="billing-status-row">
            <span
              className={`billing-badge billing-badge--${billing.billing_status}`}
              data-testid="billing-badge"
            >
              {BILLING_STATUS_LABELS[billing.billing_status]}
            </span>
          </div>

          {billing.billing_status === 'active' && billing.next_invoice_date && (
            <p data-testid="next-invoice-date">
              Next invoice: {new Date(billing.next_invoice_date).toLocaleDateString()}
            </p>
          )}

          {billing.billing_status === 'trial' && (
            <p data-testid="trial-message">
              {billing.trial_used
                ? 'Your free trial has been used.'
                : 'Your first pool is free. Upgrade to create additional pools.'}
            </p>
          )}

          {billing.billing_status === 'suspended' && (
            <p data-testid="suspended-message">
              Your subscription is suspended. Reactivate billing to create new pools.
            </p>
          )}

          {portalError && (
            <div className="submit-error" role="alert" data-testid="portal-error">
              <p>{portalError}</p>
            </div>
          )}

          {billing.stripe_customer_id ? (
            <button
              className="btn btn-secondary billing-portal-btn"
              data-testid="manage-billing-btn"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening…' : 'Manage Billing'}
            </button>
          ) : (
            <button
              className="btn btn-primary billing-upgrade-btn"
              data-testid="billing-upgrade-btn"
              onClick={handleManageBilling}
              disabled={portalLoading}
            >
              {portalLoading ? 'Opening…' : 'Upgrade Plan'}
            </button>
          )}
        </div>
      ) : (
        <p data-testid="billing-unavailable">Billing information unavailable.</p>
      )}
    </div>
  );
}
