import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GolferPicker } from '../../components/entry/GolferPicker';
import { MOCK_RVCC_FIELD } from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';
import type { AvailableGolfer } from '../../types/domain';

const rvccConfig = CLUB_CONFIGS['rvcc'];

// Build AvailableGolfer list from the mock RVCC field (flat players list)
const mockGolfers: AvailableGolfer[] = (MOCK_RVCC_FIELD.players ?? []).map((p, i) => ({
  dg_id: p.dg_id,
  player_name: p.player_name,
  ranking: i + 1,
  country: 'USA',
}));

describe('GolferPicker', () => {
  function renderPicker(selectedIds: number[] = [], overrides?: Partial<Parameters<typeof GolferPicker>[0]>) {
    const onSelect = vi.fn();
    const onDeselect = vi.fn();
    render(
      <GolferPicker
        golfers={mockGolfers}
        selectedIds={selectedIds}
        clubConfig={rvccConfig}
        buckets={null}
        onSelect={onSelect}
        onDeselect={onDeselect}
        {...overrides}
      />
    );
    return { onSelect, onDeselect };
  }

  it('renders all golfers', () => {
    renderPicker();
    for (const golfer of mockGolfers) {
      expect(screen.getByTestId(`golfer-option-${golfer.dg_id}`)).toBeInTheDocument();
    }
  });

  it('shows selected count', () => {
    const firstTwo = mockGolfers.slice(0, 2).map((g) => g.dg_id);
    renderPicker(firstTwo);
    expect(screen.getByText(/2\/7 selected/)).toBeInTheDocument();
  });

  it('calls onSelect when clicking unselected golfer', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    const firstGolfer = mockGolfers[0];
    await user.click(screen.getByTestId(`golfer-option-${firstGolfer.dg_id}`));
    expect(onSelect).toHaveBeenCalledWith(firstGolfer.dg_id);
  });

  it('calls onDeselect when clicking selected golfer', async () => {
    const user = userEvent.setup();
    const firstGolfer = mockGolfers[0];
    const { onDeselect } = renderPicker([firstGolfer.dg_id]);
    await user.click(screen.getByTestId(`golfer-option-${firstGolfer.dg_id}`));
    expect(onDeselect).toHaveBeenCalledWith(firstGolfer.dg_id);
  });

  it('disables golfers when max picked reached (7 for rvcc)', () => {
    // Select 7 golfers (the full pick count for RVCC)
    const sevenIds = mockGolfers.slice(0, 7).map((g) => g.dg_id);
    renderPicker(sevenIds);
    // Unselected golfers should be disabled
    const unselectedGolfer = screen.getByTestId(`golfer-option-${mockGolfers[7].dg_id}`);
    expect(unselectedGolfer).toBeDisabled();
  });

  it('shows golfer ranking and country', () => {
    renderPicker();
    // First golfer has ranking 1
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getAllByText('USA').length).toBeGreaterThan(0);
  });
});
