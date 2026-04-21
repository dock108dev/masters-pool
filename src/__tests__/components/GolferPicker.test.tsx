import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { GolferPicker } from '../../components/entry/GolferPicker';
import { MOCK_RVCC_FIELD } from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';
import type { AvailableGolfer } from '../../types/domain';

const rvccConfig = CLUB_CONFIGS['rvcc'];

const mockGolfers: AvailableGolfer[] = (MOCK_RVCC_FIELD.players ?? []).map((p, i) => ({
  dg_id: p.dg_id,
  player_name: p.player_name,
  ranking: i + 1,
  country: 'USA',
}));

function renderPicker(
  slotSelections: (number | null)[] = Array<null>(rvccConfig.pickCount).fill(null),
  slotErrors: (string | null)[] = Array<null>(rvccConfig.pickCount).fill(null),
) {
  const onSlotChange = vi.fn();
  render(
    <GolferPicker
      golfers={mockGolfers}
      slotSelections={slotSelections}
      clubConfig={rvccConfig}
      buckets={null}
      onSlotChange={onSlotChange}
      slotErrors={slotErrors}
    />
  );
  return { onSlotChange };
}

describe('GolferPicker', () => {
  it('renders a trigger for each pick slot', () => {
    renderPicker();
    for (let i = 0; i < rvccConfig.pickCount; i++) {
      expect(screen.getByTestId(`slot-trigger-${i}`)).toBeInTheDocument();
    }
  });

  it('shows selected count in the instruction', () => {
    const twoFilled: (number | null)[] = [
      mockGolfers[0].dg_id,
      mockGolfers[1].dg_id,
      null, null, null, null, null,
    ];
    renderPicker(twoFilled);
    expect(screen.getByText(/2\/7 selected/)).toBeInTheDocument();
  });

  it('calls onSlotChange with the golfer id when selecting from a slot dropdown', async () => {
    const user = userEvent.setup();
    const { onSlotChange } = renderPicker();
    await user.click(screen.getByTestId('slot-trigger-0'));
    await user.click(screen.getByTestId(`slot-option-${mockGolfers[0].dg_id}`));
    expect(onSlotChange).toHaveBeenCalledWith(0, mockGolfers[0].dg_id);
  });

  it('calls onSlotChange with null when clearing a filled slot', async () => {
    const user = userEvent.setup();
    const filled: (number | null)[] = [mockGolfers[0].dg_id, null, null, null, null, null, null];
    const { onSlotChange } = renderPicker(filled);
    await user.click(screen.getByTestId('slot-clear-0'));
    expect(onSlotChange).toHaveBeenCalledWith(0, null);
  });

  it('shows selected golfer name in the slot trigger when a slot is filled', () => {
    const filled: (number | null)[] = [mockGolfers[0].dg_id, null, null, null, null, null, null];
    renderPicker(filled);
    expect(screen.getByTestId('slot-trigger-0')).toHaveTextContent(mockGolfers[0].player_name);
  });

  it('shows golfer ranking inside an open slot dropdown', async () => {
    const user = userEvent.setup();
    renderPicker();
    await user.click(screen.getByTestId('slot-trigger-0'));
    // mockGolfers[0] has ranking 1 (sorted by ranking in the dropdown)
    expect(screen.getByText('#1')).toBeInTheDocument();
  });

  it('shows per-slot error for slots listed in slotErrors', () => {
    const errors: (string | null)[] = [
      'Please select a golfer for this slot.',
      null, null, null, null, null, null,
    ];
    renderPicker(Array<null>(rvccConfig.pickCount).fill(null), errors);
    expect(screen.getByTestId('slot-error-0')).toBeInTheDocument();
    expect(screen.getByTestId('slot-error-0')).toHaveTextContent('Please select a golfer');
    expect(screen.queryByTestId('slot-error-1')).not.toBeInTheDocument();
  });

  // ISSUE-014 acceptance criterion: structural exclusion across slots
  it('excludes golfer A from slot 2 options after golfer A is selected in slot 1', async () => {
    const user = userEvent.setup();
    const golferA = mockGolfers[0];
    const filledSlot0: (number | null)[] = [
      golferA.dg_id,
      null, null, null, null, null, null,
    ];
    renderPicker(filledSlot0);

    // Open slot 1 (index 1)
    await user.click(screen.getByTestId('slot-trigger-1'));

    // golfer A's option should NOT appear in slot 1's open dropdown
    expect(screen.queryByTestId(`slot-option-${golferA.dg_id}`)).not.toBeInTheDocument();
  });

  it('renders ≤ 50 option elements for a large field when a slot is open', async () => {
    // Build a 150-golfer list to verify DOM node budget
    const bigField: AvailableGolfer[] = Array.from({ length: 150 }, (_, i) => ({
      dg_id: i + 1,
      player_name: `Golfer ${i + 1}`,
      ranking: i + 1,
    }));
    const user = userEvent.setup();
    const onSlotChange = vi.fn();
    render(
      <GolferPicker
        golfers={bigField}
        slotSelections={Array<null>(rvccConfig.pickCount).fill(null)}
        clubConfig={rvccConfig}
        buckets={null}
        onSlotChange={onSlotChange}
        slotErrors={Array<null>(rvccConfig.pickCount).fill(null)}
      />
    );
    await user.click(screen.getByTestId('slot-trigger-0'));
    const options = screen.getAllByRole('option');
    expect(options.length).toBeLessThanOrEqual(50);
  });
});
