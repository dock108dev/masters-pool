import type { AuthTokens } from './types';

const ACCESS_KEY = 'auth.access_token';
const REFRESH_KEY = 'auth.refresh_token';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage full or disabled — fail silently; session won't persist
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function readTokens(): AuthTokens | null {
  const access = safeGet(ACCESS_KEY);
  if (!access) return null;
  return { accessToken: access, refreshToken: safeGet(REFRESH_KEY) };
}

export function writeTokens(tokens: AuthTokens): void {
  safeSet(ACCESS_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    safeSet(REFRESH_KEY, tokens.refreshToken);
  } else {
    safeRemove(REFRESH_KEY);
  }
}

export function clearTokens(): void {
  safeRemove(ACCESS_KEY);
  safeRemove(REFRESH_KEY);
}
