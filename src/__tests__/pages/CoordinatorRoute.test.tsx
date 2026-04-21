import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CoordinatorRoute } from '../../pages/CoordinatorRoute';

// Mock @clerk/clerk-react so tests run without a real Clerk environment
vi.mock('@clerk/clerk-react', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@clerk/clerk-react';
const mockUseAuth = vi.mocked(useAuth);

function renderCoordinatorRoute(path = '/rvcc/admin') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/:clubCode/admin/sign-in" element={<div>Sign In Page</div>} />
        <Route
          path="/:clubCode/admin"
          element={
            <CoordinatorRoute>
              <div data-testid="admin-content">Coordinator Dashboard</div>
            </CoordinatorRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('CoordinatorRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while Clerk is initializing', () => {
    mockUseAuth.mockReturnValue({ isLoaded: false, isSignedIn: false, orgRole: undefined } as ReturnType<typeof useAuth>);
    renderCoordinatorRoute();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to sign-in when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: false, orgRole: undefined } as ReturnType<typeof useAuth>);
    renderCoordinatorRoute();
    expect(screen.getByText('Sign In Page')).toBeInTheDocument();
  });

  it('shows access denied for org:member role', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, orgRole: 'org:member' } as ReturnType<typeof useAuth>);
    renderCoordinatorRoute();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  it('renders protected content for org:admin role', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, orgRole: 'org:admin' } as ReturnType<typeof useAuth>);
    renderCoordinatorRoute();
    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
    expect(screen.getByText('Coordinator Dashboard')).toBeInTheDocument();
  });

  it('shows access denied for unrecognized role', () => {
    mockUseAuth.mockReturnValue({ isLoaded: true, isSignedIn: true, orgRole: 'org:viewer' } as ReturnType<typeof useAuth>);
    renderCoordinatorRoute();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
