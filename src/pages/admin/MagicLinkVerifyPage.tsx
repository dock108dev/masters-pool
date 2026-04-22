import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../auth/useSession';

export function MagicLinkVerifyPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const next = params.get('next');
  const returnTo = next && next.startsWith('/') ? next : '/admin';
  const { verifyMagicLink, isAuthenticated } = useSession();
  const navigate = useNavigate();
  const attempted = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (attempted.current || !token) return;
    attempted.current = true;
    (async () => {
      try {
        await verifyMagicLink({ token });
        navigate(returnTo, { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed.');
      }
    })();
  }, [token, verifyMagicLink, navigate, returnTo]);

  if (isAuthenticated && !error) return <Navigate to={returnTo} replace />;
  if (!token) {
    return (
      <div data-testid="magic-link-verify-page">
        <p role="alert">Missing verification token.</p>
      </div>
    );
  }
  if (error) {
    return (
      <div data-testid="magic-link-verify-page">
        <p role="alert" data-testid="magic-link-error">{error}</p>
      </div>
    );
  }
  return (
    <div data-testid="magic-link-verify-page">
      <p>Verifying…</p>
    </div>
  );
}
