import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '../../auth/useSession';

export function PasswordResetRequestPage() {
  const { requestPasswordReset } = useSession();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      await requestPasswordReset({ email, redirect_url: `${origin}/admin/auth/reset` });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="password-reset-request-page">
      <h1>Reset password</h1>
      {sent ? (
        <p data-testid="reset-sent">If an account exists for that address, a reset email is on its way.</p>
      ) : (
        <form onSubmit={handleSubmit}>
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
          {error && <p role="alert">{error}</p>}
          <button type="submit" disabled={submitting} data-testid="reset-request-submit">
            {submitting ? 'Sending…' : 'Send reset email'}
          </button>
        </form>
      )}
      <p><Link to="/admin/sign-in">Back to sign in</Link></p>
    </div>
  );
}
