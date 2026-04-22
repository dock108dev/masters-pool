import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { SlugAvailabilityInput } from '../../components/onboarding/SlugAvailabilityInput';
import { useAnalytics } from '../../hooks/useAnalytics';

type PageState = 'loading' | 'error' | 'form' | 'submitting';

const NO_SESSION_ID_MESSAGE =
  'No session ID found. Please contact support if you completed a payment.';

export function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  const [state, setState] = useState<PageState>(() => (sessionId ? 'loading' : 'error'));
  const [verifyError, setVerifyError] = useState<string | null>(() =>
    sessionId ? null : NO_SESSION_ID_MESSAGE,
  );
  const { capture } = useAnalytics();
  const [clubName, setClubName] = useState('');
  const [slug, setSlug] = useState('');
  const [validSlug, setValidSlug] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (!sessionId) return;

    apiClient
      .verifyCheckoutSession(sessionId)
      .then((data) => {
        if (data.status === 'provisioned') {
          const dest = data.onboard_url;
          navigate(dest && dest.startsWith('/') ? dest : '/admin', { replace: true });
          return;
        }
        capture('checkout_completed');
        setClubName(data.club_name ?? '');
        setState('form');
      })
      .catch((err: unknown) => {
        setVerifyError(
          err instanceof Error ? err.message : 'Could not verify your session.',
        );
        setState('error');
      });
  }, [sessionId, navigate, capture]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (hasSubmittedRef.current || !sessionId || !validSlug) return;
    hasSubmittedRef.current = true;
    setSubmitError(null);
    setState('submitting');

    try {
      const result = await apiClient.createClub({
        session_id: sessionId,
        club_name: clubName.trim(),
        slug: validSlug,
      });
      const dest = result.onboard_url;
      navigate(dest && dest.startsWith('/') ? dest : '/admin', { replace: true });
    } catch (err: unknown) {
      hasSubmittedRef.current = false;
      setSubmitError(
        err instanceof Error ? err.message : 'Club creation failed. Please try again.',
      );
      setState('form');
    }
  }

  if (state === 'loading') {
    return (
      <div className="marketing-page" data-testid="checkout-success-page">
        <header className="marketing-header">
          <div className="marketing-logo">Country Club Picks</div>
        </header>
        <main className="checkout-success-main">
          <p data-testid="loading-indicator">Verifying your payment…</p>
        </main>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="marketing-page" data-testid="checkout-success-page">
        <header className="marketing-header">
          <div className="marketing-logo">Country Club Picks</div>
        </header>
        <main className="checkout-success-main">
          <p className="validation-error" role="alert" data-testid="session-error">
            {verifyError}
          </p>
          <p>
            <a
              href="mailto:support@countryclubpicks.com"
              data-testid="contact-support-link"
            >
              Contact support
            </a>
          </p>
        </main>
      </div>
    );
  }

  if (state === 'submitting') {
    return (
      <div className="marketing-page" data-testid="checkout-success-page">
        <header className="marketing-header">
          <div className="marketing-logo">Country Club Picks</div>
        </header>
        <main className="checkout-success-main">
          <p data-testid="loading-indicator">Setting up your club…</p>
        </main>
      </div>
    );
  }

  return (
    <div className="marketing-page" data-testid="checkout-success-page">
      <header className="marketing-header">
        <div className="marketing-logo">Country Club Picks</div>
      </header>
      <main className="checkout-success-main">
        <h1>Payment confirmed — set up your club</h1>
        <form
          onSubmit={handleSubmit}
          className="checkout-success-form"
          data-testid="setup-form"
        >
          <div className="form-group">
            <label htmlFor="setup-club-name">Club name</label>
            <input
              id="setup-club-name"
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              required
              data-testid="club-name-input"
            />
          </div>
          <SlugAvailabilityInput
            value={slug}
            onChange={setSlug}
            onValidSlug={setValidSlug}
            apiClient={apiClient}
          />
          {submitError && (
            <p className="validation-error" role="alert" data-testid="submit-error">
              {submitError}
            </p>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!validSlug || !clubName.trim()}
            data-testid="setup-submit-btn"
          >
            Create my club
          </button>
        </form>
      </main>
      <footer className="marketing-footer">
        <p>Country Club Picks &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
