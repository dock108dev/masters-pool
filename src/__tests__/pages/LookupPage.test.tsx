import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { LookupPage } from '../../pages/LookupPage';
import { getClubConfig } from '../../config/clubs';

vi.mock('../../api/client', () => ({
  apiClient: new MockApiClient(0),
}));

const rvccConfig = getClubConfig('rvcc');

function renderLookupPage(clubConfig = rvccConfig) {
  return render(
    <MemoryRouter initialEntries={['/rvcc/lookup']}>
      <Routes>
        <Route path="/:club/lookup" element={<LookupPage clubConfig={clubConfig} />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LookupPage', () => {
  it('renders email input and lookup button', () => {
    renderLookupPage();
    expect(screen.getByTestId('lookup-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('lookup-button')).toBeInTheDocument();
  });

  it('renders the page heading', () => {
    renderLookupPage();
    expect(screen.getByRole('heading', { name: /My Entries/i })).toBeInTheDocument();
  });

  it('shows validation error when submitting with empty email', async () => {
    renderLookupPage();
    // Use fireEvent.submit to bypass jsdom's browser-level constraint validation
    // (type="email" with an invalid/empty value causes jsdom to block the submit event)
    fireEvent.submit(screen.getByTestId('lookup-form'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
  });

  it('shows validation error when submitting an invalid email format', async () => {
    renderLookupPage();
    // Set the input value directly via fireEvent so jsdom does not filter out
    // the invalid format (userEvent.type respects browser email sanitization).
    fireEvent.change(screen.getByTestId('lookup-email-input'), {
      target: { value: 'not-an-email' },
    });
    // Use fireEvent.submit to bypass jsdom's typeMismatch constraint on the email input.
    fireEvent.submit(screen.getByTestId('lookup-form'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('shows results after successful lookup', async () => {
    const user = userEvent.setup();
    renderLookupPage();
    await user.type(screen.getByTestId('lookup-email-input'), 'test@example.com');
    await user.click(screen.getByTestId('lookup-button'));
    expect(await screen.findByTestId('lookup-results')).toBeInTheDocument();
  });

  it('displays entry details in lookup results', async () => {
    const user = userEvent.setup();
    renderLookupPage();
    await user.type(screen.getByTestId('lookup-email-input'), 'test@example.com');
    await user.click(screen.getByTestId('lookup-button'));
    await screen.findByTestId('lookup-results');
    // Mock returns one entry: "Mock Entry"
    expect(screen.getByText('Mock Entry')).toBeInTheDocument();
  });

  it('displays pick slot and dg_id in lookup results', async () => {
    const user = userEvent.setup();
    renderLookupPage();
    await user.type(screen.getByTestId('lookup-email-input'), 'test@example.com');
    await user.click(screen.getByTestId('lookup-button'));
    await screen.findByTestId('lookup-results');
    // Mock returns picks with dg_ids — without player_name, falls back to dg_id display
    expect(screen.getByText(/Pick 1: dg_id 18417/)).toBeInTheDocument();
    expect(screen.getByText(/Pick 2: dg_id 28237/)).toBeInTheDocument();
  });

  it('displays the looked-up email in the results heading', async () => {
    const user = userEvent.setup();
    renderLookupPage();
    await user.type(screen.getByTestId('lookup-email-input'), 'test@example.com');
    await user.click(screen.getByTestId('lookup-button'));
    await screen.findByTestId('lookup-results');
    expect(screen.getByText(/Entries for test@example\.com/i)).toBeInTheDocument();
  });

  it('lookup button is enabled on initial render', () => {
    renderLookupPage();
    expect(screen.getByTestId('lookup-button')).not.toBeDisabled();
  });

  it('lookup button shows "Look Up" text initially', () => {
    renderLookupPage();
    expect(screen.getByTestId('lookup-button')).toHaveTextContent('Look Up');
  });
});
