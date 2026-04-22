/**
 * Types for the SDA-backed auth system.
 *
 * Matches the `/auth/*` contract documented in
 * `sports-data-admin/docs/migrations/2026-04-golf-picks-sda-reconciliation.md` §12.
 */

export type UserRole = 'guest' | 'user' | 'admin';

/**
 * Club membership for the current user. Populated opportunistically:
 * SDA may return this on `/auth/me` once the owner-endpoint work lands.
 * Treat an empty/absent list as "no confirmed memberships known."
 */
export interface ClubMembership {
  club_id: string;
  role: 'owner' | 'admin' | 'viewer';
}

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  memberships?: ClubMembership[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string | null;
}

export interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string | null;
  token_type?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface SignupRequest {
  email: string;
  password: string;
}

export interface MagicLinkRequest {
  email: string;
  redirect_url?: string;
}

export interface VerifyMagicLinkRequest {
  token: string;
}

export interface PasswordResetRequest {
  email: string;
  redirect_url?: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}
