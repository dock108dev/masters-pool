import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../auth/useSession';

type Mode = 'password' | 'magic-link';

function parseNext(search: string, locationState: unknown): string {
  const params = new URLSearchParams(search);
  const next = params.get('next');
  if (next && next.startsWith('/')) return next;
  const stateReturnTo = (locationState as { returnTo?: string } | null)?.returnTo;
  if (stateReturnTo && stateReturnTo.startsWith('/')) return stateReturnTo;
  return '/admin';
}

export function AdminSignInPage() {
  const { isAuthenticated, isLoading, signIn, requestMagicLink } = useSession();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = parseNext(location.search, location.state);

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={returnTo} replace />;

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password, remember_me: remember });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMagicLinkSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const redirect = `${origin}/admin/auth/magic-link${returnTo !== '/admin' ? `?next=${encodeURIComponent(returnTo)}` : ''}`;
      await requestMagicLink({ email, redirect_url: redirect });
      setMagicLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send magic link.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="sign-in-page" data-testid="sign-in-page">
      <h1>Sign in</h1>
      <div className="sign-in-tabs" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'password'}
          onClick={() => { setMode('password'); setError(null); setMagicLinkSent(false); }}
          data-testid="tab-password"
        >
          Password
        </button>
        <button
          role="tab"
          aria-selected={mode === 'magic-link'}
          onClick={() => { setMode('magic-link'); setError(null); setMagicLinkSent(false); }}
          data-testid="tab-magic-link"
        >
          Email me a link
        </button>
      </div>

      {mode === 'password' ? (
        <form onSubmit={handlePasswordSubmit} data-testid="password-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              data-testid="email-input"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              data-testid="password-input"
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              data-testid="remember-me"
            />
            Remember me
          </label>
          {error && <p className="sign-in-error" role="alert" data-testid="sign-in-error">{error}</p>}
          <button type="submit" disabled={submitting} data-testid="sign-in-submit">
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          <p>
            <Link to={`/admin/auth/forgot${params.toString() ? `?${params.toString()}` : ''}`}>
              Forgot password?
            </Link>
          </p>
          <p>
            No account? <Link to="/admin/sign-up">Create one</Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleMagicLinkSubmit} data-testid="magic-link-form">
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              data-testid="magic-email-input"
            />
          </label>
          {error && <p className="sign-in-error" role="alert" data-testid="sign-in-error">{error}</p>}
          {magicLinkSent ? (
            <p data-testid="magic-link-sent">Check your email for a sign-in link.</p>
          ) : (
            <button type="submit" disabled={submitting} data-testid="magic-link-submit">
              {submitting ? 'Sending…' : 'Send magic link'}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
