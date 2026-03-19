import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BucketPicker } from '../../components/entry/BucketPicker';
import { MOCK_CRESTMONT_FIELD } from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';
import type { GolferBucket } from '../../types/domain';

const crestmontConfig = CLUB_CONFIGS['crestmont'];

// Build GolferBucket list from the mock Crestmont field (bucketed players)
const mockBuckets: GolferBucket[] = (MOCK_CRESTMONT_FIELD.buckets ?? []).map((b) => ({
  bucket_number: b.bucket_number,
  label: b.label,
  golfers: b.players.map((p) => ({ dg_id: p.dg_id, player_name: p.player_name })),
}));

describe('BucketPicker', () => {
  function renderPicker(selectedIds: number[] = []) {
    const onSelect = vi.fn();
    const onDeselect = vi.fn();
    render(
      <BucketPicker
        buckets={mockBuckets}
        selectedIds={selectedIds}
        clubConfig={crestmontConfig}
        onSelect={onSelect}
        onDeselect={onDeselect}
      />
    );
    return { onSelect, onDeselect };
  }

  it('renders all 6 buckets with labels', () => {
    renderPicker();
    const expectedLabels = ['Bucket A', 'Bucket B', 'Bucket C', 'Bucket D', 'Bucket E', 'Bucket F'];
    for (const label of expectedLabels) {
      const bucket = mockBuckets.find((b) => b.label === label)!;
      expect(screen.getByTestId(`bucket-${bucket.bucket_number}`)).toBeInTheDocument();
    }
    // Also verify the bucket heading text appears
    expect(screen.getByText('Bucket A')).toBeInTheDocument();
    expect(screen.getByText('Bucket F')).toBeInTheDocument();
  });

  it('shows selected count', () => {
    const firstGolfer = mockBuckets[0].golfers[0];
    renderPicker([firstGolfer.dg_id]);
    expect(screen.getByText(/1\/6 selected/)).toBeInTheDocument();
  });

  it('calls onSelect when clicking golfer', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    const firstGolfer = mockBuckets[0].golfers[0];
    await user.click(screen.getByTestId(`golfer-option-${firstGolfer.dg_id}`));
    expect(onSelect).toHaveBeenCalledWith(firstGolfer.dg_id);
  });

  it('calls onDeselect when clicking selected golfer', async () => {
    const user = userEvent.setup();
    const firstGolfer = mockBuckets[0].golfers[0];
    const { onDeselect } = renderPicker([firstGolfer.dg_id]);
    await user.click(screen.getByTestId(`golfer-option-${firstGolfer.dg_id}`));
    expect(onDeselect).toHaveBeenCalledWith(firstGolfer.dg_id);
  });

  it('disables golfers in same bucket after one is selected', () => {
    const bucketA = mockBuckets[0];
    const selectedGolfer = bucketA.golfers[0];
    renderPicker([selectedGolfer.dg_id]);

    // Other golfers in Bucket A should be disabled
    const othersInBucketA = bucketA.golfers.filter((g) => g.dg_id !== selectedGolfer.dg_id);
    for (const golfer of othersInBucketA) {
      expect(screen.getByTestId(`golfer-option-${golfer.dg_id}`)).toBeDisabled();
    }

    // The selected golfer itself should NOT be disabled
    expect(screen.getByTestId(`golfer-option-${selectedGolfer.dg_id}`)).not.toBeDisabled();
  });
});
