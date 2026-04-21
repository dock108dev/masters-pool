import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OnboardingChecklist } from '../../components/onboarding/OnboardingChecklist';

const BASE_PROPS = {
  hasCreatedPool: true,
  hasSharedLink: false,
  entryCount: 0,
  hasViewedStandings: false,
};

describe('OnboardingChecklist', () => {
  it('renders all four steps', () => {
    render(<OnboardingChecklist {...BASE_PROPS} />);
    expect(screen.getByTestId('step-create-pool')).toBeInTheDocument();
    expect(screen.getByTestId('step-share-link')).toBeInTheDocument();
    expect(screen.getByTestId('step-collect-entries')).toBeInTheDocument();
    expect(screen.getByTestId('step-view-standings')).toBeInTheDocument();
  });

  it('marks "collect entries" complete when entryCount > 0', () => {
    render(<OnboardingChecklist {...BASE_PROPS} entryCount={1} />);
    const step = screen.getByTestId('step-collect-entries');
    expect(step).toHaveClass('step--complete');
  });

  it('does not mark "collect entries" complete when entryCount is 0', () => {
    render(<OnboardingChecklist {...BASE_PROPS} entryCount={0} />);
    const step = screen.getByTestId('step-collect-entries');
    expect(step).toHaveClass('step--pending');
  });

  it('marks "create pool" complete when hasCreatedPool is true', () => {
    render(<OnboardingChecklist {...BASE_PROPS} hasCreatedPool />);
    expect(screen.getByTestId('step-create-pool')).toHaveClass('step--complete');
  });

  it('marks "share link" complete when hasSharedLink is true', () => {
    render(<OnboardingChecklist {...BASE_PROPS} hasSharedLink />);
    expect(screen.getByTestId('step-share-link')).toHaveClass('step--complete');
  });

  it('marks "view standings" complete when hasViewedStandings is true', () => {
    render(<OnboardingChecklist {...BASE_PROPS} hasViewedStandings />);
    expect(screen.getByTestId('step-view-standings')).toHaveClass('step--complete');
  });

  it('shows progress counter correctly', () => {
    render(<OnboardingChecklist {...BASE_PROPS} entryCount={5} hasSharedLink />);
    // hasCreatedPool=true, hasSharedLink=true, entryCount>0=true, hasViewedStandings=false → 3/4
    expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('3 / 4 complete');
  });

  it('shows completion message when all steps are done', () => {
    render(
      <OnboardingChecklist
        hasCreatedPool
        hasSharedLink
        entryCount={3}
        hasViewedStandings
      />,
    );
    expect(screen.getByTestId('onboarding-all-complete')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-progress')).toHaveTextContent('4 / 4 complete');
  });

  it('does not show completion message when steps are incomplete', () => {
    render(<OnboardingChecklist {...BASE_PROPS} />);
    expect(screen.queryByTestId('onboarding-all-complete')).not.toBeInTheDocument();
  });
});
