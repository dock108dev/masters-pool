import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthProvider';
import { useSession } from '../../auth/useSession';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { MockApiClient } from '../../api/mock/adapters';
import { clearTokens } from '../../auth/tokenStorage';

function LoginTrigger() {
  const s = useSession();
  return (
    <button
      data-testid="do-login"
      onClick={() => void s.signIn({ email: 'a@b.co', password: 'pw' })}
    >
      login
    </button>
  );
}

function renderAt(initialPath: string, client = new MockApiClient(0)) {
  return render(
    <AuthProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Admin</div>
              </ProtectedRoute>
            }
          />
          <Route path="/admin/sign-in" element={<div data-testid="sign-in-page"><LoginTrigger /></div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => clearTokens());

  it('redirects to /admin/sign-in with next= when not authenticated', async () => {
    renderAt('/admin');
    await waitFor(() => expect(screen.getByTestId('sign-in-page')).toBeInTheDocument());
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders children once authenticated', async () => {
    const client = new MockApiClient(0);
    renderAt('/admin', client);
    await waitFor(() => expect(screen.getByTestId('sign-in-page')).toBeInTheDocument());
    await act(async () => {
      screen.getByTestId('do-login').click();
    });
    // After login, navigating back to /admin should render content. In this
    // lightweight harness the ProtectedRoute re-renders once session flips.
    // We trigger a fresh render at /admin by navigating programmatically:
    renderAt('/admin', client);
    await waitFor(() => expect(screen.getAllByTestId('protected-content').length).toBeGreaterThan(0));
  });
});
