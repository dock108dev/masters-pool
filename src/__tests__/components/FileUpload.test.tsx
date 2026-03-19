import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { FileUpload } from '../../components/entry/FileUpload';
import { CLUB_CONFIGS } from '../../config/clubs';
import type { ClubConfig } from '../../types/domain';

const rvccConfig = CLUB_CONFIGS['rvcc']; // uploadEnabled: true, uploadRequired: false
const crestmontConfig = CLUB_CONFIGS['crestmont']; // uploadEnabled: false

// Make a variant of rvccConfig with uploadRequired: true
const rvccRequiredConfig: ClubConfig = { ...rvccConfig, uploadRequired: true };

describe('FileUpload', () => {
  it('returns null when uploadEnabled is false', () => {
    const { container } = render(
      <FileUpload clubConfig={crestmontConfig} selectedFile={undefined} onFileSelect={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders when uploadEnabled is true', () => {
    render(<FileUpload clubConfig={rvccConfig} selectedFile={undefined} onFileSelect={vi.fn()} />);
    expect(screen.getByTestId('file-upload')).toBeInTheDocument();
  });

  it('shows "(required)" label when uploadRequired is true', () => {
    render(<FileUpload clubConfig={rvccRequiredConfig} selectedFile={undefined} onFileSelect={vi.fn()} />);
    expect(screen.getByText(/\(required\)/)).toBeInTheDocument();
  });

  it('shows "(optional)" label when uploadRequired is false', () => {
    render(<FileUpload clubConfig={rvccConfig} selectedFile={undefined} onFileSelect={vi.fn()} />);
    expect(screen.getByText(/\(optional\)/)).toBeInTheDocument();
  });

  it('calls onFileSelect when file chosen', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    render(<FileUpload clubConfig={rvccConfig} selectedFile={undefined} onFileSelect={onFileSelect} />);

    const file = new File(['hello'], 'entry.pdf', { type: 'application/pdf' });
    const input = screen.getByTestId('file-input');
    await user.upload(input, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows file name when file selected', () => {
    const file = new File(['data'], 'myentry.pdf', { type: 'application/pdf' });
    render(<FileUpload clubConfig={rvccConfig} selectedFile={file} onFileSelect={vi.fn()} />);
    expect(screen.getByText('myentry.pdf')).toBeInTheDocument();
  });

  it('calls onFileSelect(undefined) when remove clicked', async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const file = new File(['data'], 'myentry.pdf', { type: 'application/pdf' });
    render(<FileUpload clubConfig={rvccConfig} selectedFile={file} onFileSelect={onFileSelect} />);

    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onFileSelect).toHaveBeenCalledWith(undefined);
  });
});
