import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MockApiClient } from '../../../api/mock/adapters';
import { OnboardHomePage } from '../../../pages/onboard/OnboardHomePage';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <OnboardHomePage />
    </MemoryRouter>,
  );
}

describe('OnboardHomePage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('renders marketing content (hero, formats, pricing)', () => {
    renderPage();
    expect(screen.getByTestId('onboard-home-page')).toBeInTheDocument();
    expect(screen.getByTestId('marketing-hero')).toBeInTheDocument();
    expect(screen.getByTestId('marketing-formats')).toBeInTheDocument();
    expect(screen.getByTestId('marketing-pricing')).toBeInTheDocument();
  });

  it('renders the claim form', () => {
    renderPage();
    expect(screen.getByTestId('claim-form')).toBeInTheDocument();
    expect(screen.getByTestId('claim-club-name')).toBeInTheDocument();
    expect(screen.getByTestId('claim-contact-email')).toBeInTheDocument();
  });

  it('submits a club claim and shows success state', async () => {
    const spy = vi.spyOn(activeClient, 'submitClubClaim');
    renderPage();

    fireEvent.change(screen.getByTestId('claim-club-name'), {
      target: { value: 'Pine Valley GC' },
    });
    fireEvent.change(screen.getByTestId('claim-contact-email'), {
      target: { value: 'pro@pinevalley.example' },
    });
    fireEvent.change(screen.getByTestId('claim-expected-entries'), {
      target: { value: '42' },
    });
    fireEvent.change(screen.getByTestId('claim-notes'), {
      target: { value: 'Interested in Masters 2027.' },
    });

    fireEvent.click(screen.getByTestId('claim-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('claim-success')).toBeInTheDocument();
    });

    expect(spy).toHaveBeenCalledWith({
      club_name: 'Pine Valley GC',
      contact_email: 'pro@pinevalley.example',
      expected_entries: 42,
      notes: 'Interested in Masters 2027.',
    });
  });

  it('shows an error when the claim submission fails', async () => {
    vi.spyOn(activeClient, 'submitClubClaim').mockRejectedValue(new Error('network down'));
    renderPage();

    fireEvent.change(screen.getByTestId('claim-club-name'), { target: { value: 'x' } });
    fireEvent.change(screen.getByTestId('claim-contact-email'), {
      target: { value: 'x@y.z' },
    });
    fireEvent.click(screen.getByTestId('claim-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('claim-error')).toHaveTextContent('network down');
    });
  });
});
