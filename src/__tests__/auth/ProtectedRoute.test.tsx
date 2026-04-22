import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(),
  useClerk: vi.fn(() => ({ signOut: vi.fn() })),
}));

import { useAuth } from '@clerk/clerk-react';
const mockUseAuth = vi.mocked(useAuth);

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <div data-testid="protected-content">Admin content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/sign-in" element={<div data-testid="sign-in-page">Sign In</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
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

    const { container } = renderWithRouter('/admin');
    expect(container.firstChild).toBeNull();
  });

  it('redirects to /admin/sign-in when not signed in', () => {
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

    renderWithRouter('/admin');
    expect(screen.getByTestId('sign-in-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children when signed in', () => {
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

    renderWithRouter('/admin');
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('sign-in-page')).not.toBeInTheDocument();
  });
});
