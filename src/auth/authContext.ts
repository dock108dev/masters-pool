import { createContext } from 'react';
import type {
  AuthUser,
  LoginRequest,
  SignupRequest,
  MagicLinkRequest,
  VerifyMagicLinkRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
} from './types';

export interface Session {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** `true` until the initial `/auth/me` call settles on app mount. */
  isLoading: boolean;
  signIn: (request: LoginRequest) => Promise<void>;
  signUp: (request: SignupRequest) => Promise<void>;
  signOut: () => void;
  requestMagicLink: (request: MagicLinkRequest) => Promise<void>;
  verifyMagicLink: (request: VerifyMagicLinkRequest) => Promise<void>;
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  confirmPasswordReset: (request: PasswordResetConfirm) => Promise<void>;
  /**
   * Returns true if the current user holds `owner` or `admin` role for the
   * given `club_id`. Relies on `user.memberships` — if absent (SDA hasn't
   * extended `/auth/me` to include memberships yet), returns `false`.
   */
  isOwnerOf: (clubId: string) => boolean;
}

export const AuthContext = createContext<Session | null>(null);
