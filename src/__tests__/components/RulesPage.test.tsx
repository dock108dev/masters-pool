import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RulesPage } from '../../pages/RulesPage';
import { CLUB_CONFIGS } from '../../config/clubs';

const rvccConfig = CLUB_CONFIGS['rvcc'];
const crestmontConfig = CLUB_CONFIGS['crestmont'];

describe('RulesPage', () => {
  describe('RVCC', () => {
    beforeEach(() => {
      render(<RulesPage clubConfig={rvccConfig} />);
    });

    it('renders RVCC rules correctly (all rules items)', () => {
      for (const rule of rvccConfig.rulesDescription) {
        expect(screen.getByText(rule)).toBeInTheDocument();
      }
    });

    it('shows pick count', () => {
      // pickCount 7, useBuckets false — no bucket qualifier
      expect(screen.getByText('Pick 7 golfers')).toBeInTheDocument();
    });

    it('shows cut minimum', () => {
      expect(screen.getByText(/At least 5 must make the cut to qualify/)).toBeInTheDocument();
    });

    it('shows counted scores', () => {
      expect(screen.getByText(/Best 5 scores are counted/)).toBeInTheDocument();
    });

    it('shows max entries per email when configured', () => {
      expect(screen.getByText(/Maximum 3 entries per email/)).toBeInTheDocument();
    });

    it('does not show file upload info (upload is admin-only)', () => {
      expect(screen.queryByText(/File upload/)).not.toBeInTheDocument();
    });
  });

  describe('Crestmont', () => {
    beforeEach(() => {
      render(<RulesPage clubConfig={crestmontConfig} />);
    });

    it('renders Crestmont rules correctly (bucket info shown)', () => {
      for (const rule of crestmontConfig.rulesDescription) {
        expect(screen.getByText(rule)).toBeInTheDocument();
      }
      // useBuckets: true — pick count line should include bucket qualifier
      expect(screen.getByText('Pick 6 golfers (1 from each bucket)')).toBeInTheDocument();
    });

    it('shows pick count with bucket label', () => {
      expect(screen.getByText('Pick 6 golfers (1 from each bucket)')).toBeInTheDocument();
    });

    it('shows cut minimum', () => {
      expect(screen.getByText(/At least 4 must make the cut to qualify/)).toBeInTheDocument();
    });

    it('shows counted scores', () => {
      expect(screen.getByText(/Best 4 scores are counted/)).toBeInTheDocument();
    });

    it('shows max entries per email when configured', () => {
      expect(screen.getByText(/Maximum 2 entries per email/)).toBeInTheDocument();
    });

    it('does not show file upload info (upload is admin-only)', () => {
      expect(screen.queryByText(/File upload/)).not.toBeInTheDocument();
    });
  });
});
