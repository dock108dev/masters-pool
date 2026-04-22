import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ApiClient } from '../api/types';
import { apiClient as defaultApiClient } from '../api/client';
import type {
  AuthUser,
  AuthTokenResponse,
  LoginRequest,
  SignupRequest,
  MagicLinkRequest,
  VerifyMagicLinkRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from './types';
import { AuthContext, type Session } from './authContext';
import { clearTokens, readTokens, writeTokens } from './tokenStorage';

function persistTokens(tokens: AuthTokenResponse, prevRefresh: string | null): void {
  writeTokens({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? prevRefresh,
  });
}

interface AuthProviderProps {
  children: ReactNode;
  /** Override the API client — primarily for tests. */
  client?: ApiClient;
}

export function AuthProvider({ children, client = defaultApiClient }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, if we have a stored access token, resolve the current user.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const stored = readTokens();
      if (!stored?.accessToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const me = await client.getCurrentUser();
        if (cancelled) return;
        if (!me) {
          clearTokens();
          setUser(null);
        } else {
          setUser(me);
        }
      } catch {
        if (!cancelled) {
          clearTokens();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const afterTokenResponse = useCallback(
    async (tokens: AuthTokenResponse) => {
      const prev = readTokens();
      persistTokens(tokens, prev?.refreshToken ?? null);
      const me = await client.getCurrentUser();
      setUser(me);
    },
    [client],
  );

  const signIn = useCallback(
    async (request: LoginRequest) => {
      const tokens = await client.login(request);
      await afterTokenResponse(tokens);
    },
    [client, afterTokenResponse],
  );

  const signUp = useCallback(
    async (request: SignupRequest) => {
      const tokens = await client.signup(request);
      await afterTokenResponse(tokens);
    },
    [client, afterTokenResponse],
  );

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const requestMagicLink = useCallback(
    (request: MagicLinkRequest) => client.requestMagicLink(request),
    [client],
  );

  const verifyMagicLink = useCallback(
    async (request: VerifyMagicLinkRequest) => {
      const tokens = await client.verifyMagicLink(request);
      await afterTokenResponse(tokens);
    },
    [client, afterTokenResponse],
  );

  const requestPasswordReset = useCallback(
    (request: PasswordResetRequest) => client.requestPasswordReset(request),
    [client],
  );

  const confirmPasswordReset = useCallback(
    (request: PasswordResetConfirm) => client.confirmPasswordReset(request),
    [client],
  );

  const isOwnerOf = useCallback(
    (clubId: string) => {
      if (!user?.memberships) return false;
      return user.memberships.some(
        (m) => m.club_id === clubId && (m.role === 'owner' || m.role === 'admin'),
      );
    },
    [user],
  );

  const value = useMemo<Session>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      signIn,
      signUp,
      signOut,
      requestMagicLink,
      verifyMagicLink,
      requestPasswordReset,
      confirmPasswordReset,
      isOwnerOf,
    }),
    [
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
      requestMagicLink,
      verifyMagicLink,
      requestPasswordReset,
      confirmPasswordReset,
      isOwnerOf,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
