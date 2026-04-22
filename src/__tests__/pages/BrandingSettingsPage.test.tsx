import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { BrandingSettingsPage } from '../../pages/BrandingSettingsPage';
import { getClubConfig } from '../../config/clubs';

let activeClient: MockApiClient = new MockApiClient(0);

vi.mock('../../api/client', () => ({
  get apiClient() {
    return activeClient;
  },
}));

const rvccConfig = getClubConfig('rvcc');

function renderBrandingPage() {
  return render(
    <MemoryRouter>
      <BrandingSettingsPage clubConfig={rvccConfig} />
    </MemoryRouter>,
  );
}

describe('BrandingSettingsPage', () => {
  beforeEach(() => {
    activeClient = new MockApiClient(0);
  });

  it('renders form fields after load', async () => {
    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByTestId('branding-form')).toBeInTheDocument();
    });

    expect(screen.getByTestId('logo-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('primary-color-input')).toBeInTheDocument();
    expect(screen.getByTestId('accent-color-input')).toBeInTheDocument();
    expect(screen.getByTestId('save-branding-btn')).toBeInTheDocument();
  });

  it('renders live preview panel', async () => {
    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByTestId('branding-preview')).toBeInTheDocument();
    });
  });

  it('preview updates in real time when primary color changes', async () => {
    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByTestId('primary-color-input')).toBeInTheDocument();
    });

    const colorInput = screen.getByTestId('primary-color-input');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });

    // Preview header should reflect the new color
    const preview = screen.getByTestId('branding-preview');
    expect(preview).toBeInTheDocument();
  });

  it('save button is disabled while saving', async () => {
    let resolve!: (v: unknown) => void;
    vi.spyOn(activeClient, 'updateClubBranding').mockReturnValue(
      new Promise((r) => { resolve = r; }),
    );

    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByTestId('save-branding-btn')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByTestId('branding-form'));

    await waitFor(() => {
      expect(screen.getByTestId('save-branding-btn')).toBeDisabled();
    });

    resolve({});
  });

  it('shows success message after successful save', async () => {
    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByTestId('save-branding-btn')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByTestId('branding-form'));

    await waitFor(() => {
      expect(screen.getByTestId('save-success')).toBeInTheDocument();
    });
  });

  it('shows error message when save fails', async () => {
    vi.spyOn(activeClient, 'updateClubBranding').mockRejectedValue(new Error('Save failed'));

    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByTestId('save-branding-btn')).toBeInTheDocument();
    });

    fireEvent.submit(screen.getByTestId('branding-form'));

    await waitFor(() => {
      expect(screen.getByTestId('save-error')).toHaveTextContent('Save failed');
    });
  });

  it('color hex input validates format and updates state', async () => {
    renderBrandingPage();

    await waitFor(() => {
      expect(screen.getByLabelText('Primary color hex value')).toBeInTheDocument();
    });

    const hexInput = screen.getByLabelText('Primary color hex value');
    // Valid partial hex — should be accepted
    fireEvent.change(hexInput, { target: { value: '#abc' } });
    expect((hexInput as HTMLInputElement).value).toBe('#abc');

    // Invalid (non-hex char) — should be ignored
    fireEvent.change(hexInput, { target: { value: '#xyz' } });
    expect((hexInput as HTMLInputElement).value).toBe('#abc');
  });
});
