import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SlotDropdown } from '../../components/entry/SlotDropdown';
import type { AvailableGolfer } from '../../types/domain';

const GOLFERS: AvailableGolfer[] = [
  { dg_id: 1, player_name: 'Golfer Alpha', ranking: 1 },
  { dg_id: 2, player_name: 'Golfer Beta', ranking: 2 },
  { dg_id: 3, player_name: 'Golfer Gamma', ranking: 3 },
];

function renderSlot({
  slotIndex = 0,
  selectedGolfer = null,
  availableGolfers = GOLFERS,
  error = null,
  onSelect = vi.fn(),
  onClear = vi.fn(),
}: {
  slotIndex?: number;
  selectedGolfer?: AvailableGolfer | null;
  availableGolfers?: AvailableGolfer[];
  error?: string | null;
  onSelect?: ReturnType<typeof vi.fn>;
  onClear?: ReturnType<typeof vi.fn>;
} = {}) {
  render(
    <SlotDropdown
      slotLabel={`Pick ${slotIndex + 1}`}
      slotIndex={slotIndex}
      selectedGolfer={selectedGolfer}
      availableGolfers={availableGolfers}
      onSelect={onSelect}
      onClear={onClear}
      error={error}
    />
  );
  return { onSelect, onClear };
}

describe('SlotDropdown — a11y', () => {
  it('trigger has no aria-invalid when error is null', () => {
    renderSlot({ error: null });
    const trigger = screen.getByTestId('slot-trigger-0');
    expect(trigger).not.toHaveAttribute('aria-invalid');
  });

  it('trigger has aria-invalid="true" when error is set', () => {
    renderSlot({ error: 'Pick required' });
    const trigger = screen.getByTestId('slot-trigger-0');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
  });

  it('trigger has no aria-describedby when error is null', () => {
    renderSlot({ error: null });
    const trigger = screen.getByTestId('slot-trigger-0');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('trigger aria-describedby points to the error element id', () => {
    renderSlot({ slotIndex: 2, error: 'Pick required' });
    const trigger = screen.getByTestId('slot-trigger-2');
    expect(trigger).toHaveAttribute('aria-describedby', 'slot-error-2');
    const errorEl = document.getElementById('slot-error-2');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl).toHaveTextContent('Pick required');
  });

  it('error element has the correct id for aria-describedby linkage', () => {
    renderSlot({ slotIndex: 1, error: 'Please select a golfer for this slot.' });
    const errorEl = document.getElementById('slot-error-1');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl?.tagName.toLowerCase()).toBe('p');
  });

  it('no error element is rendered when error is null', () => {
    renderSlot({ slotIndex: 0, error: null });
    expect(document.getElementById('slot-error-0')).not.toBeInTheDocument();
  });
});

describe('SlotDropdown — duplicate prevention', () => {
  it('golfer absent from availableGolfers does not appear in the open panel', async () => {
    const user = userEvent.setup();
    // Provide only Golfer Beta and Gamma — Alpha is excluded (already picked elsewhere)
    renderSlot({ availableGolfers: [GOLFERS[1], GOLFERS[2]] });

    await user.click(screen.getByTestId('slot-trigger-0'));

    expect(screen.queryByTestId(`slot-option-${GOLFERS[0].dg_id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`slot-option-${GOLFERS[1].dg_id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`slot-option-${GOLFERS[2].dg_id}`)).toBeInTheDocument();
  });

  it('selects a golfer and calls onSelect with the correct dg_id', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderSlot({ onSelect });

    await user.click(screen.getByTestId('slot-trigger-0'));
    await user.click(screen.getByTestId(`slot-option-${GOLFERS[0].dg_id}`));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect).toHaveBeenCalledWith(GOLFERS[0].dg_id);
  });

  it('shows "No golfers found" when all are excluded from available list', async () => {
    const user = userEvent.setup();
    renderSlot({ availableGolfers: [] });

    await user.click(screen.getByTestId('slot-trigger-0'));

    expect(screen.getByText('No golfers found')).toBeInTheDocument();
  });
});

describe('SlotDropdown — incomplete submission state', () => {
  it('shows error message text when error prop is provided', () => {
    renderSlot({ error: 'Please select a golfer for this slot.' });
    expect(screen.getByTestId('slot-error-0')).toHaveTextContent('Please select a golfer for this slot.');
  });

  it('adds slot-dropdown--error class to container when error is set', () => {
    renderSlot({ error: 'Pick required' });
    const container = screen.getByTestId('slot-0');
    expect(container.className).toContain('slot-dropdown--error');
  });

  it('clears error styling when no error is provided', () => {
    renderSlot({ error: null });
    const container = screen.getByTestId('slot-0');
    expect(container.className).not.toContain('slot-dropdown--error');
  });
});
