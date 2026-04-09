import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MockApiClient } from '../../api/mock/adapters';
import { EntryPage } from '../../pages/EntryPage';
import { getClubConfig } from '../../config/clubs';

vi.mock('../../api/client', () => ({
  apiClient: new MockApiClient(0),
}));

const rvccConfig = getClubConfig('rvcc');
const crestmontConfig = getClubConfig('crestmont');

function renderEntryPage(clubConfig = rvccConfig, initialPath = '/rvcc/entry') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/:club/entry" element={<EntryPage clubConfig={clubConfig} />} />
        <Route path="/:club/confirmation" element={<div data-testid="confirmation-page">Confirmed</div>} />
      </Routes>
    </MemoryRouter>
  );
}


describe('EntryPage', () => {
  describe('RVCC (entries closed)', () => {
    it('shows entries closed message instead of entry form', () => {
      renderEntryPage();
      expect(screen.getByText('Entries Closed')).toBeInTheDocument();
      expect(screen.getByText(/now closed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });

  describe('Crestmont (no self-service entry)', () => {
    it('shows entries closed message instead of entry form', () => {
      renderEntryPage(crestmontConfig, '/crestmont/entry');
      expect(screen.getByText('Entries Closed')).toBeInTheDocument();
      expect(screen.getByText(/now closed/i)).toBeInTheDocument();
      expect(screen.queryByTestId('entry-form')).not.toBeInTheDocument();
    });
  });
});
