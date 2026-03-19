import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../../components/common/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Nothing here" description="Check back later." />);
    expect(screen.getByText('Check back later.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });
});
