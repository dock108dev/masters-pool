import type { GolferBucket, ClubConfig } from '../../types/domain';
import { canAddGolfer } from '../../utils/validation';

interface BucketPickerProps {
  buckets: GolferBucket[];
  selectedIds: number[];
  clubConfig: ClubConfig;
  onSelect: (dgId: number) => void;
  onDeselect: (dgId: number) => void;
}

export function BucketPicker({ buckets, selectedIds, clubConfig, onSelect, onDeselect }: BucketPickerProps) {
  return (
    <div className="bucket-picker" data-testid="bucket-picker">
      <p className="picker-instruction">
        Select 1 golfer from each bucket ({selectedIds.length}/{clubConfig.pickCount} selected)
      </p>
      {buckets.map((bucket) => {
        const selectedFromBucket = bucket.golfers.find((g) => selectedIds.includes(g.dg_id));

        return (
          <div key={bucket.bucket_number} className="bucket-section" data-testid={`bucket-${bucket.bucket_number}`}>
            <h4 className="bucket-label">
              {bucket.label}
              {selectedFromBucket && (
                <span className="bucket-selected-name"> — {selectedFromBucket.player_name}</span>
              )}
            </h4>
            <div className="golfer-list">
              {bucket.golfers.map((golfer) => {
                const isSelected = selectedIds.includes(golfer.dg_id);
                const { allowed, reason } = isSelected
                  ? { allowed: true, reason: undefined }
                  : canAddGolfer(
                      golfer.dg_id,
                      selectedIds,
                      bucket.golfers,
                      clubConfig,
                      buckets,
                      bucket.bucket_number
                    );

                return (
                  <button
                    key={golfer.dg_id}
                    type="button"
                    className={`golfer-option ${isSelected ? 'selected' : ''} ${!isSelected && !allowed ? 'disabled' : ''}`}
                    onClick={() => (isSelected ? onDeselect(golfer.dg_id) : onSelect(golfer.dg_id))}
                    disabled={!isSelected && !allowed}
                    title={!isSelected && !allowed ? reason : undefined}
                    data-testid={`golfer-option-${golfer.dg_id}`}
                  >
                    <span className="golfer-option-name">{golfer.player_name}</span>
                    {golfer.ranking != null && <span className="golfer-option-rank">#{golfer.ranking}</span>}
                    {golfer.country && <span className="golfer-option-country">{golfer.country}</span>}
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
