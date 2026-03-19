import type { GolferBucket, ClubConfig } from '../../types/domain';
import { canAddGolfer } from '../../utils/validation';

interface BucketPickerProps {
  buckets: GolferBucket[];
  selectedIds: string[];
  clubConfig: ClubConfig;
  onSelect: (golferId: string) => void;
  onDeselect: (golferId: string) => void;
}

export function BucketPicker({ buckets, selectedIds, clubConfig, onSelect, onDeselect }: BucketPickerProps) {
  return (
    <div className="bucket-picker" data-testid="bucket-picker">
      <p className="picker-instruction">
        Select 1 golfer from each bucket ({selectedIds.length}/{clubConfig.pickCount} selected)
      </p>
      {buckets.map((bucket) => {
        const selectedFromBucket = bucket.golfers.find((g) => selectedIds.includes(g.id));

        return (
          <div key={bucket.bucketIndex} className="bucket-section" data-testid={`bucket-${bucket.bucketIndex}`}>
            <h4 className="bucket-label">
              {bucket.label}
              {selectedFromBucket && <span className="bucket-selected-name"> — {selectedFromBucket.name}</span>}
            </h4>
            <div className="golfer-list">
              {bucket.golfers.map((golfer) => {
                const isSelected = selectedIds.includes(golfer.id);
                const { allowed, reason } = isSelected
                  ? { allowed: true, reason: undefined }
                  : canAddGolfer(golfer.id, selectedIds, golfer ? [golfer] : [], clubConfig, buckets, bucket.bucketIndex);

                return (
                  <button
                    key={golfer.id}
                    type="button"
                    className={`golfer-option ${isSelected ? 'selected' : ''} ${!isSelected && !allowed ? 'disabled' : ''}`}
                    onClick={() => (isSelected ? onDeselect(golfer.id) : onSelect(golfer.id))}
                    disabled={!isSelected && !allowed}
                    title={!isSelected && !allowed ? reason : undefined}
                    data-testid={`golfer-option-${golfer.id}`}
                  >
                    <span className="golfer-option-name">{golfer.name}</span>
                    {golfer.ranking && <span className="golfer-option-rank">#{golfer.ranking}</span>}
                    <span className="golfer-option-country">{golfer.country}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
