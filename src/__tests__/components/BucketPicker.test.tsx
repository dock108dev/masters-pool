import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BucketPicker } from '../../components/entry/BucketPicker';
import { MOCK_GOLFER_BUCKETS } from '../../api/mock/data';
import { CLUB_CONFIGS } from '../../config/clubs';

const crestmontConfig = CLUB_CONFIGS['crestmont'];

describe('BucketPicker', () => {
  function renderPicker(selectedIds: string[] = []) {
    const onSelect = vi.fn();
    const onDeselect = vi.fn();
    render(
      <BucketPicker
        buckets={MOCK_GOLFER_BUCKETS}
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
      expect(screen.getByTestId(`bucket-${MOCK_GOLFER_BUCKETS.findIndex((b) => b.label === label)}`)).toBeInTheDocument();
    }
    // Also verify the bucket heading text appears
    expect(screen.getByText('Bucket A')).toBeInTheDocument();
    expect(screen.getByText('Bucket F')).toBeInTheDocument();
  });

  it('shows selected count', () => {
    const firstGolfer = MOCK_GOLFER_BUCKETS[0].golfers[0];
    renderPicker([firstGolfer.id]);
    expect(screen.getByText(/1\/6 selected/)).toBeInTheDocument();
  });

  it('calls onSelect when clicking golfer', async () => {
    const user = userEvent.setup();
    const { onSelect } = renderPicker();
    const firstGolfer = MOCK_GOLFER_BUCKETS[0].golfers[0];
    await user.click(screen.getByTestId(`golfer-option-${firstGolfer.id}`));
    expect(onSelect).toHaveBeenCalledWith(firstGolfer.id);
  });

  it('calls onDeselect when clicking selected golfer', async () => {
    const user = userEvent.setup();
    const firstGolfer = MOCK_GOLFER_BUCKETS[0].golfers[0];
    const { onDeselect } = renderPicker([firstGolfer.id]);
    await user.click(screen.getByTestId(`golfer-option-${firstGolfer.id}`));
    expect(onDeselect).toHaveBeenCalledWith(firstGolfer.id);
  });

  it('disables golfers in same bucket after one is selected', () => {
    const bucketA = MOCK_GOLFER_BUCKETS[0];
    const selectedGolfer = bucketA.golfers[0];
    renderPicker([selectedGolfer.id]);

    // Other golfers in Bucket A should be disabled
    const othersInBucketA = bucketA.golfers.filter((g) => g.id !== selectedGolfer.id);
    for (const golfer of othersInBucketA) {
      expect(screen.getByTestId(`golfer-option-${golfer.id}`)).toBeDisabled();
    }

    // The selected golfer itself should NOT be disabled
    expect(screen.getByTestId(`golfer-option-${selectedGolfer.id}`)).not.toBeDisabled();
  });
});
