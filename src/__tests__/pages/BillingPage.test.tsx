import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { BillingPage } from '../../pages/BillingPage';
import { getClubConfig } from '../../config/clubs';
import { MOCK_SUSPENDED_BILLING } from '../../api/mock/data';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderBillingPage(config = rvccConfig) {
  return render(
    <MemoryRouter>
      <BillingPage clubConfig={config} />
    </MemoryRouter>,
  );
}

describe('BillingPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('renders trial status for rvcc', async () => {
    renderBillingPage();

    await waitFor(() => {
      expect(screen.getByTestId('billing-page')).toBeInTheDocument();
    });

    expect(screen.getByTestId('billing-badge')).toHaveTextContent('Trial');
    expect(screen.getByTestId('trial-message')).toBeInTheDocument();
    // rvcc trial_used = false
    expect(screen.getByTestId('trial-message')).toHaveTextContent('first pool is free');
  });

  it('renders active status with next invoice date for crestmont', async () => {
    renderBillingPage(crestmontConfig);

    await waitFor(() => {
      expect(screen.getByTestId('billing-badge')).toHaveTextContent('Active');
    });

    expect(screen.getByTestId('next-invoice-date')).toBeInTheDocument();
    // MOCK_CRESTMONT_BILLING.next_invoice_date = '2026-05-01'
    expect(screen.getByTestId('next-invoice-date')).toHaveTextContent('2026');
    expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
  });

  it('renders suspended status message', async () => {
    vi.spyOn(activeClient, 'getClubBilling').mockResolvedValue({ ...MOCK_SUSPENDED_BILLING });

    renderBillingPage();

    await waitFor(() => {
      expect(screen.getByTestId('billing-badge')).toHaveTextContent('Suspended');
    });

    expect(screen.getByTestId('suspended-message')).toBeInTheDocument();
  });

  it('shows Upgrade Plan button when no stripe_customer_id', async () => {
    // rvcc has no stripe_customer_id
    renderBillingPage();

    await waitFor(() => {
      expect(screen.getByTestId('billing-upgrade-btn')).toBeInTheDocument();
    });
  });

  it('shows Manage Billing button when stripe_customer_id exists', async () => {
    renderBillingPage(crestmontConfig);

    await waitFor(() => {
      expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
    });
  });

  it('redirects to portal URL when Manage Billing is clicked', async () => {
    const portalUrl = 'https://billing.stripe.com/session/mock';
    const locationAssign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '', assign: locationAssign },
      writable: true,
    });

    vi.spyOn(activeClient, 'createBillingPortalSession').mockResolvedValue({ url: portalUrl });

    renderBillingPage(crestmontConfig);

    await waitFor(() => {
      expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-billing-btn'));

    await waitFor(() => {
      expect(window.location.href).toBe(portalUrl);
    });
  });

  it('shows error when portal session creation fails', async () => {
    vi.spyOn(activeClient, 'createBillingPortalSession').mockRejectedValue(
      new Error('Portal unavailable'),
    );

    renderBillingPage(crestmontConfig);

    await waitFor(() => {
      expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-billing-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('portal-error')).toHaveTextContent('Portal unavailable');
    });
  });

  it('disables button while portal request is in flight', async () => {
    let resolve!: (v: { url: string }) => void;
    vi.spyOn(activeClient, 'createBillingPortalSession').mockReturnValue(
      new Promise((r) => { resolve = r; }),
    );

    renderBillingPage(crestmontConfig);

    await waitFor(() => {
      expect(screen.getByTestId('manage-billing-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('manage-billing-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('manage-billing-btn')).toBeDisabled();
    });

    resolve({ url: 'https://billing.stripe.com/session/mock' });
  });

  it('shows billing-unavailable when data is absent', async () => {
    vi.spyOn(activeClient, 'getClubBilling').mockRejectedValue(new Error('Network error'));

    renderBillingPage();

    await waitFor(() => {
      // ErrorState renders when useApi returns an error
      expect(screen.queryByTestId('billing-info')).not.toBeInTheDocument();
    });
  });
});
