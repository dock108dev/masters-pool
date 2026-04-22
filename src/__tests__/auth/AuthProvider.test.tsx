import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../auth/AuthProvider';
import { useSession } from '../../auth/useSession';
import { MockApiClient, MOCK_AUTH_USER } from '../../api/mock/adapters';
import { clearTokens, readTokens, writeTokens } from '../../auth/tokenStorage';

function Probe() {
  const s = useSession();
  return (
    <div>
      <span data-testid="loading">{String(s.isLoading)}</span>
      <span data-testid="auth">{String(s.isAuthenticated)}</span>
      <span data-testid="email">{s.user?.email ?? ''}</span>
      <span data-testid="owns-rvcc">{String(s.isOwnerOf('club_rvcc'))}</span>
      <span data-testid="owns-unknown">{String(s.isOwnerOf('club_unknown'))}</span>
      <button data-testid="login" onClick={() => void s.signIn({ email: 'a@b.co', password: 'pw' })}>
        login
      </button>
      <button data-testid="signout" onClick={() => s.signOut()}>
        signout
      </button>
    </div>
  );
}

describe('AuthProvider + useSession', () => {
  beforeEach(() => {
    clearTokens();
  });

  it('starts unauthenticated when no stored token', async () => {
    render(
      <AuthProvider client={new MockApiClient(0)}>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('');
  });

  it('resolves user on mount when a token is already stored', async () => {
    writeTokens({ accessToken: 'existing', refreshToken: 'r' });
    const client = new MockApiClient(0);
    // signedIn starts false; call login via mock to flip it
    await client.login({ email: 'x@y.z', password: 'pw' });
    render(
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('email').textContent).toBe(MOCK_AUTH_USER.email);
  });

  it('signIn persists tokens and sets user; signOut clears', async () => {
    const client = new MockApiClient(0);
    render(
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));

    await act(async () => {
      screen.getByTestId('login').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(readTokens()?.accessToken).toBeTruthy();

    await act(async () => {
      screen.getByTestId('signout').click();
    });
    expect(screen.getByTestId('auth').textContent).toBe('false');
    expect(readTokens()).toBeNull();
  });

  it('isOwnerOf reads from user.memberships', async () => {
    const client = new MockApiClient(0);
    render(
      <AuthProvider client={client}>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'));
    await act(async () => {
      screen.getByTestId('login').click();
    });
    await waitFor(() => expect(screen.getByTestId('auth').textContent).toBe('true'));
    expect(screen.getByTestId('owns-rvcc').textContent).toBe('true');
    expect(screen.getByTestId('owns-unknown').textContent).toBe('false');
  });
});
