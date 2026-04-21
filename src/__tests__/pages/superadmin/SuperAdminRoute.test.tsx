import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SuperAdminRoute } from '../../../pages/superadmin/SuperAdminRoute';

vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(),
  useUser: vi.fn(),
}));

import { useAuth, useUser } from '@clerk/clerk-react';
const mockUseAuth = vi.mocked(useAuth);
const mockUseUser = vi.mocked(useUser);

function renderRoute(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/sign-in" element={<div>Sign In Page</div>} />
        <Route
          path="/"
          element={
            <SuperAdminRoute>
              <div data-testid="super-content">Platform Dashboard</div>
            </SuperAdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SuperAdminRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while Clerk is initializing', () => {
    mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false } as ReturnType<typeof useAuth>);
    mockUseUser.mockReturnValue({ isLoaded: false, user: null } as ReturnType<typeof useUser>);
    renderRoute();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to sign-in when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false } as ReturnType<typeof useAuth>);
    mockUseUser.mockReturnValue({ isLoaded: true, user: null } as ReturnType<typeof useUser>);
    renderRoute();
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
  });

  it('shows access denied for a non-superadmin user', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true } as ReturnType<typeof useAuth>);
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { publicMetadata: { role: 'coordinator' } },
    } as unknown as ReturnType<typeof useUser>);
    renderRoute();
    expect(screen.getByTestId('superadmin-denied')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders the dashboard for a superadmin user', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true } as ReturnType<typeof useAuth>);
    mockUseUser.mockReturnValue({
      isLoaded: true,
      user: { publicMetadata: { role: 'superadmin' } },
    } as unknown as ReturnType<typeof useUser>);
    renderRoute();
    expect(screen.getByTestId('super-content')).toBeInTheDocument();
  });
});
