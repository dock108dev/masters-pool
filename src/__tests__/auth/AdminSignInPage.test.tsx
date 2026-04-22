import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../../auth/AuthProvider';
import { AdminSignInPage } from '../../pages/admin/AdminSignInPage';
import { MockApiClient } from '../../api/mock/adapters';
import { clearTokens } from '../../auth/tokenStorage';

function renderSignIn(initialPath = '/admin/sign-in') {
  return render(
    <AuthProvider client={new MockApiClient(0)}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/sign-in" element={<AdminSignInPage />} />
          <Route path="/admin" element={<div data-testid="admin-page">Admin</div>} />
          <Route path="/admin/pools/1" element={<div data-testid="pool-page">Pool</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe('AdminSignInPage', () => {
  beforeEach(() => clearTokens());

  it('renders the password tab by default', async () => {
    renderSignIn();
    await waitFor(() => expect(screen.getByTestId('password-form')).toBeInTheDocument());
  });

  it('logs in with email + password and redirects to /admin', async () => {
    renderSignIn();
    const user = userEvent.setup();
    await waitFor(() => screen.getByTestId('password-form'));
    await user.type(screen.getByTestId('email-input'), 'a@b.co');
    await user.type(screen.getByTestId('password-input'), 'hunter22!');
    await user.click(screen.getByTestId('sign-in-submit'));
    await waitFor(() => expect(screen.getByTestId('admin-page')).toBeInTheDocument());
  });

  it('honours ?next= query param', async () => {
    renderSignIn('/admin/sign-in?next=%2Fadmin%2Fpools%2F1');
    const user = userEvent.setup();
    await waitFor(() => screen.getByTestId('password-form'));
    await user.type(screen.getByTestId('email-input'), 'a@b.co');
    await user.type(screen.getByTestId('password-input'), 'hunter22!');
    await user.click(screen.getByTestId('sign-in-submit'));
    await waitFor(() => expect(screen.getByTestId('pool-page')).toBeInTheDocument());
  });

  it('switches to magic-link tab and sends a link', async () => {
    renderSignIn();
    const user = userEvent.setup();
    await waitFor(() => screen.getByTestId('password-form'));
    await user.click(screen.getByTestId('tab-magic-link'));
    await user.type(screen.getByTestId('magic-email-input'), 'a@b.co');
    await user.click(screen.getByTestId('magic-link-submit'));
    await waitFor(() => expect(screen.getByTestId('magic-link-sent')).toBeInTheDocument());
  });
});
