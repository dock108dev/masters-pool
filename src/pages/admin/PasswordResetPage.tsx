import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../auth/useSession';

export function PasswordResetPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { confirmPasswordReset } = useSession();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div data-testid="password-reset-page">
        <p role="alert">Missing reset token.</p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset({ token: token!, new_password: password });
      navigate('/admin/sign-in?reset=ok', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div data-testid="password-reset-page">
      <h1>Set a new password</h1>
      <form onSubmit={handleSubmit}>
        <label>
          New password (8+ characters)
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            data-testid="password-input"
          />
        </label>
        {error && <p role="alert" data-testid="reset-error">{error}</p>}
        <button type="submit" disabled={submitting} data-testid="reset-submit">
          {submitting ? 'Saving…' : 'Save new password'}
        </button>
      </form>
      <p><Link to="/admin/sign-in">Back to sign in</Link></p>
    </div>
  );
}
