import { useState } from 'react';
import { apiClient } from '../../api/client';
import { useAnalytics } from '../../hooks/useAnalytics';

export function CheckoutPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { capture } = useAnalytics();

  async function handleGetStarted() {
    setError(null);
    setLoading(true);
    try {
      capture('checkout_started');
      const { session_url } = await apiClient.createCheckoutSession();
      if (!session_url.startsWith('https://checkout.stripe.com/')) {
        throw new Error('Invalid payment session URL. Please contact support.');
      }
      window.location.href = session_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="marketing-page" data-testid="checkout-page">
      <header className="marketing-header">
        <div className="marketing-logo">Country Club Picks</div>
      </header>

      <main className="checkout-main">
        <h1>Get Started</h1>
        <p className="checkout-description">
          You'll be redirected to Stripe to complete payment. No card details
          enter our servers.
        </p>

        {error && (
          <p
            className="validation-error"
            role="alert"
            data-testid="checkout-error"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary checkout-cta"
          onClick={handleGetStarted}
          disabled={loading}
          data-testid="checkout-btn"
        >
          {loading ? 'Redirecting…' : 'Get Started — $299 / year'}
        </button>
      </main>

      <footer className="marketing-footer">
        <p>Country Club Picks &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
