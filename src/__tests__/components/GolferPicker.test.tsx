import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GolferPicker } from '../../components/entry/GolferPicker';
import { MOCK_AVAILABLE_GOLFERS } from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';

const rvccConfig = CLUB_CONFIGS['rvcc'];

describe('GolferPicker', () => {
  function renderPicker(selectedIds: string[] = [], overrides?: Partial<Parameters<typeof GolferPicker>[0]>) {
    const onSelect = vi.fn();
    const onDeselect = vi.fn();
    render(
      <GolferPicker
        golfers={MOCK_AVAILABLE_GOLFERS}
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
    for (const golfer of MOCK_AVAILABLE_GOLFERS) {
      expect(screen.getByTestId(`golfer-option-${golfer.id}`)).toBeInTheDocument();
    }
  });

  it('shows selected count', () => {
    renderPicker(['g1', 'g2']);
    expect(screen.getByText(/2\/7 selected/)).toBeInTheDocument();
  });

  it('calls onSelect when clicking unselected golfer', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    await user.click(screen.getByTestId('golfer-option-g1'));
    expect(onSelect).toHaveBeenCalledWith('g1');
  });

  it('calls onDeselect when clicking selected golfer', async () => {
    const user = userEvent.setup();
    const { onDeselect } = renderPicker(['g1']);
    await user.click(screen.getByTestId('golfer-option-g1'));
    expect(onDeselect).toHaveBeenCalledWith('g1');
  });

  it('disables golfers when max picked reached (7 for rvcc)', () => {
    // Select 7 golfers (the full pick count for RVCC)
    const sevenIds = MOCK_AVAILABLE_GOLFERS.slice(0, 7).map((g) => g.id);
    renderPicker(sevenIds);
    // Unselected golfers should be disabled
    const unselectedGolfer = screen.getByTestId(`golfer-option-${MOCK_AVAILABLE_GOLFERS[7].id}`);
    expect(unselectedGolfer).toBeDisabled();
  });

  it('shows golfer ranking and country', () => {
    renderPicker();
    // First golfer: Scottie Scheffler, ranking 1, USA
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getAllByText('USA').length).toBeGreaterThan(0);
  });
});
