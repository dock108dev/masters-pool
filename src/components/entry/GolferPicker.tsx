import type { AvailableGolfer, ClubConfig } from '../../types/domain';
import { canAddGolfer } from '../../utils/validation';

interface GolferPickerProps {
  golfers: AvailableGolfer[];
  selectedIds: string[];
  clubConfig: ClubConfig;
  buckets: null;
  onSelect: (golferId: string) => void;
  onDeselect: (golferId: string) => void;
}

export function GolferPicker({ golfers, selectedIds, clubConfig, buckets, onSelect, onDeselect }: GolferPickerProps) {
  return (
    <div className="golfer-picker" data-testid="golfer-picker">
      <p className="picker-instruction">
        Select exactly {clubConfig.pickCount} golfers ({selectedIds.length}/{clubConfig.pickCount} selected)
      </p>
      <div className="golfer-list">
        {golfers.map((golfer) => {
          const isSelected = selectedIds.includes(golfer.id);
          const { allowed, reason } = isSelected
            ? { allowed: true, reason: undefined }
            : canAddGolfer(golfer.id, selectedIds, golfers, clubConfig, buckets);

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
}
