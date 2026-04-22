import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MockApiClient } from '../../../api/mock/adapters';
import { CheckoutPage } from '../../../pages/onboard/CheckoutPage';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const mockLocation = { href: '' };
vi.stubGlobal('location', mockLocation);

function renderPage() {
  return render(
    <MemoryRouter>
      <CheckoutPage />
    </MemoryRouter>,
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
    mockLocation.href = '';
  });

  it('renders the checkout page with a Get Started button', () => {
    renderPage();
    expect(screen.getByTestId('checkout-page')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-btn')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-btn')).toHaveTextContent('Get Started — $299 / year');
  });

  it('disables the button and shows loading text while the request is in flight', async () => {
    // Use a client with latency so we can observe the loading state
    activeClient = new MockApiClient(100);
    renderPage();

    fireEvent.click(screen.getByTestId('checkout-btn'));

    expect(screen.getByTestId('checkout-btn')).toBeDisabled();
    expect(screen.getByTestId('checkout-btn')).toHaveTextContent('Redirecting…');

    await waitFor(() => {
      expect(mockLocation.href).toBe('https://checkout.stripe.com/pay/mock_cs_test_xxx');
    });
  });

  it('redirects to the session_url returned by the API on success', async () => {
    const fakeUrl = 'https://checkout.stripe.com/pay/cs_test_abc123';
    vi.spyOn(activeClient, 'createCheckoutSession').mockResolvedValue({
      session_url: fakeUrl,
    });

    renderPage();
    fireEvent.click(screen.getByTestId('checkout-btn'));

    await waitFor(() => {
      expect(mockLocation.href).toBe(fakeUrl);
    });
  });

  it('calls createCheckoutSession via ApiClient, not raw fetch', async () => {
    const spy = vi.spyOn(activeClient, 'createCheckoutSession');
    renderPage();
    fireEvent.click(screen.getByTestId('checkout-btn'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledOnce();
    });
  });

  it('shows an inline error and re-enables the button when the API call fails', async () => {
    vi.spyOn(activeClient, 'createCheckoutSession').mockRejectedValue(
      new Error('payment service unavailable'),
    );

    renderPage();
    fireEvent.click(screen.getByTestId('checkout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toHaveTextContent(
        'payment service unavailable',
      );
    });

    expect(screen.getByTestId('checkout-btn')).not.toBeDisabled();
    expect(screen.getByTestId('checkout-btn')).toHaveTextContent('Get Started — $299 / year');
  });

  it('clears a previous error when the button is clicked again', async () => {
    const spy = vi.spyOn(activeClient, 'createCheckoutSession');
    spy.mockRejectedValueOnce(new Error('first failure'));

    renderPage();
    fireEvent.click(screen.getByTestId('checkout-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toBeInTheDocument();
    });

    // Second attempt succeeds — error should disappear
    spy.mockResolvedValueOnce({ session_url: 'https://checkout.stripe.com/pay/cs_ok' });
    fireEvent.click(screen.getByTestId('checkout-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('checkout-error')).not.toBeInTheDocument();
    });
  });

  it('does not expose any Stripe key in the rendered output', () => {
    renderPage();
    expect(document.body.innerHTML).not.toMatch(/sk_/);
    expect(document.body.innerHTML).not.toMatch(/pk_/);
  });
});
