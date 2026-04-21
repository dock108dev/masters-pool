import type { GolferBucket, ClubConfig } from '../../types/domain';
import { SlotDropdown } from './SlotDropdown';

export interface BucketPickerProps {
  buckets: GolferBucket[];
  /** One entry per bucket slot; index = bucket_number - 1; null = unfilled. */
  slotSelections: (number | null)[];
  clubConfig: ClubConfig;
  onSlotChange: (slotIndex: number, dgId: number | null) => void;
  slotErrors: (string | null)[];
}

function bucketHeading(bucket: GolferBucket): string {
  const rankings = bucket.golfers
    .map((g) => g.ranking)
    .filter((r): r is number => r != null && r > 0);
  if (rankings.length === 0) return bucket.label;
  return `${bucket.label} — World #${Math.min(...rankings)}–${Math.max(...rankings)}`;
}

export function BucketPicker({
  buckets,
  slotSelections,
  clubConfig,
  onSlotChange,
  slotErrors,
}: BucketPickerProps) {
  const filledCount = slotSelections.filter((id) => id !== null).length;

  return (
    <div className="bucket-picker" data-testid="bucket-picker">
      <p className="picker-instruction">
        Select 1 golfer from each bucket ({filledCount}/{clubConfig.pickCount} selected)
      </p>
      {buckets.map((bucket) => {
        const slotIndex = bucket.bucket_number - 1;
        const dgId = slotSelections[slotIndex] ?? null;
        const selectedGolfer = dgId !== null ? (bucket.golfers.find((g) => g.dg_id === dgId) ?? null) : null;
        const heading = bucketHeading(bucket);

        return (
          <div
            key={bucket.bucket_number}
            className="bucket-section"
            data-testid={`bucket-${bucket.bucket_number}`}
          >
            <SlotDropdown
              slotLabel={heading}
              slotIndex={slotIndex}
              selectedGolfer={selectedGolfer}
              availableGolfers={bucket.golfers}
              onSelect={(id) => onSlotChange(slotIndex, id)}
              onClear={() => onSlotChange(slotIndex, null)}
              error={slotErrors[slotIndex]}
            />
          </div>
        );
      })}
    </div>
  );
}
