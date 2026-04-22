import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminSignInPage } from '../../pages/admin/AdminSignInPage';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(),
  SignIn: ({ forceRedirectUrl }: { forceRedirectUrl: string }) => (
    <div data-testid="clerk-sign-in" data-redirect={forceRedirectUrl}>
      Clerk Sign In
    </div>
  ),
}));

import { useAuth } from '@clerk/clerk-react';
const mockUseAuth = vi.mocked(useAuth);

function renderSignInPage(initialPath = '/admin/sign-in', state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: initialPath, state }]}>
      <Routes>
        <Route path="/admin/sign-in" element={<AdminSignInPage />} />
        <Route path="/admin" element={<div data-testid="admin-page">Admin</div>} />
        <Route path="/admin/pools/1" element={<div data-testid="pool-page">Pool</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminSignInPage', () => {
  it('renders nothing while Clerk is loading', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
      factorVerificationAge: null,
      has: vi.fn(),
      signOut: vi.fn(),
      getToken: vi.fn(),
    });

    const { container } = renderSignInPage();
    expect(container.firstChild).toBeNull();
  });

  it('renders Clerk SignIn component when not signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
      factorVerificationAge: null,
      has: vi.fn(),
      signOut: vi.fn(),
      getToken: vi.fn(),
    });

    renderSignInPage();
    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    expect(screen.getByTestId('clerk-sign-in')).toBeInTheDocument();
  });

  it('passes /admin as default forceRedirectUrl when no returnTo state', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
      factorVerificationAge: null,
      has: vi.fn(),
      signOut: vi.fn(),
      getToken: vi.fn(),
    });

    renderSignInPage('/admin/sign-in');
    expect(screen.getByTestId('clerk-sign-in')).toHaveAttribute('data-redirect', '/admin');
  });

  it('passes returnTo state as forceRedirectUrl when provided', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      sessionId: null,
      actor: null,
      orgId: null,
      orgRole: null,
      orgSlug: null,
      orgPermissions: null,
      factorVerificationAge: null,
      has: vi.fn(),
      signOut: vi.fn(),
      getToken: vi.fn(),
    });

    renderSignInPage('/admin/sign-in', { returnTo: '/admin/pools/1' });
    expect(screen.getByTestId('clerk-sign-in')).toHaveAttribute(
      'data-redirect',
      '/admin/pools/1',
    );
  });

  it('redirects to returnTo when already signed in', () => {
    mockUseAuth.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      userId: 'user_123',
      sessionId: 'sess_abc',
      actor: null,
      orgId: 'org_xyz',
      orgRole: 'org:admin',
      orgSlug: 'rvcc',
      orgPermissions: [],
      factorVerificationAge: null,
      has: vi.fn(),
      signOut: vi.fn(),
      getToken: vi.fn(),
    });

    renderSignInPage('/admin/sign-in', { returnTo: '/admin/pools/1' });
    expect(screen.getByTestId('pool-page')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });
});
