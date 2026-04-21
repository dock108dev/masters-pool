import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BucketPicker } from '../../components/entry/BucketPicker';
import { MOCK_CRESTMONT_FIELD } from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';
import type { GolferBucket } from '../../types/domain';

const crestmontConfig = CLUB_CONFIGS['crestmont'];

const mockBuckets: GolferBucket[] = (MOCK_CRESTMONT_FIELD.buckets ?? []).map((b) => ({
  bucket_number: b.bucket_number,
  label: b.label,
  golfers: b.players.map((p) => ({ dg_id: p.dg_id, player_name: p.player_name })),
}));

function renderPicker(
  slotSelections: (number | null)[] = Array<null>(crestmontConfig.pickCount).fill(null),
  slotErrors: (string | null)[] = Array<null>(crestmontConfig.pickCount).fill(null),
) {
  const onSlotChange = vi.fn();
  render(
    <BucketPicker
      buckets={mockBuckets}
      slotSelections={slotSelections}
      clubConfig={crestmontConfig}
      onSlotChange={onSlotChange}
      slotErrors={slotErrors}
    />
  );
  return { onSlotChange };
}

describe('BucketPicker', () => {
  it('renders all 6 bucket sections with data-testid', () => {
    renderPicker();
    for (const bucket of mockBuckets) {
      expect(screen.getByTestId(`bucket-${bucket.bucket_number}`)).toBeInTheDocument();
    }
  });

  it('shows each bucket label in the slot trigger', () => {
    renderPicker();
    expect(screen.getByText('Bucket A')).toBeInTheDocument();
    expect(screen.getByText('Bucket F')).toBeInTheDocument();
  });

  it('shows selected count in the instruction', () => {
    const firstGolfer = mockBuckets[0].golfers[0];
    const filled: (number | null)[] = [firstGolfer.dg_id, null, null, null, null, null];
    renderPicker(filled);
    expect(screen.getByText(/1\/6 selected/)).toBeInTheDocument();
  });

  it('calls onSlotChange when selecting a golfer from a bucket slot', async () => {
    const user = userEvent.setup();
    const { onSlotChange } = renderPicker();
    const firstGolfer = mockBuckets[0].golfers[0];
    // Open slot 0 (Bucket A)
    await user.click(screen.getByTestId('slot-trigger-0'));
    await user.click(screen.getByTestId(`slot-option-${firstGolfer.dg_id}`));
    expect(onSlotChange).toHaveBeenCalledWith(0, firstGolfer.dg_id);
  });

  it('calls onSlotChange with null when clearing a filled bucket slot', async () => {
    const user = userEvent.setup();
    const firstGolfer = mockBuckets[0].golfers[0];
    const filled: (number | null)[] = [firstGolfer.dg_id, null, null, null, null, null];
    const { onSlotChange } = renderPicker(filled);
    await user.click(screen.getByTestId('slot-clear-0'));
    expect(onSlotChange).toHaveBeenCalledWith(0, null);
  });

  it('shows selected golfer name in the bucket slot trigger', () => {
    const firstGolfer = mockBuckets[0].golfers[0];
    const filled: (number | null)[] = [firstGolfer.dg_id, null, null, null, null, null];
    renderPicker(filled);
    expect(screen.getByTestId('slot-trigger-0')).toHaveTextContent(firstGolfer.player_name);
  });

  it('shows per-slot error for an unfilled bucket slot', () => {
    const errors: (string | null)[] = ['Please select a golfer for this slot.', null, null, null, null, null];
    renderPicker(Array<null>(crestmontConfig.pickCount).fill(null), errors);
    expect(screen.getByTestId('slot-error-0')).toBeInTheDocument();
    expect(screen.getByTestId('slot-error-0')).toHaveTextContent('Please select a golfer');
    expect(screen.queryByTestId('slot-error-1')).not.toBeInTheDocument();
  });

  // ISSUE-014 acceptance criterion: bucket headings with world ranking ranges
  it('renders bucket headings with world ranking range derived from golfer rankings', () => {
    const bucketsWithRankings: GolferBucket[] = [
      {
        bucket_number: 1,
        label: 'Bucket 1',
        golfers: [
          { dg_id: 101, player_name: 'Player A', ranking: 1 },
          { dg_id: 102, player_name: 'Player B', ranking: 8 },
          { dg_id: 103, player_name: 'Player C', ranking: 15 },
        ],
      },
      {
        bucket_number: 2,
        label: 'Bucket 2',
        golfers: [
          { dg_id: 104, player_name: 'Player D', ranking: 16 },
          { dg_id: 105, player_name: 'Player E', ranking: 30 },
        ],
      },
    ];
    const onSlotChange = vi.fn();
    render(
      <BucketPicker
        buckets={bucketsWithRankings}
        slotSelections={[null, null]}
        clubConfig={{ ...crestmontConfig, pickCount: 2 }}
        onSlotChange={onSlotChange}
        slotErrors={[null, null]}
      />
    );
    expect(screen.getByText('Bucket 1 — World #1–15')).toBeInTheDocument();
    expect(screen.getByText('Bucket 2 — World #16–30')).toBeInTheDocument();
  });

  it('renders bucket label without range when golfers have no ranking data', () => {
    // mockBuckets have no rankings — label should appear without range
    renderPicker();
    expect(screen.getByText('Bucket A')).toBeInTheDocument();
    // Should NOT append a range suffix
    expect(screen.queryByText(/Bucket A — World/)).not.toBeInTheDocument();
  });
});
