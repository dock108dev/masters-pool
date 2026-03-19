import type { AvailableGolfer, ClubConfig } from '../../types/domain';
import { canAddGolfer } from '../../utils/validation';

interface GolferPickerProps {
  golfers: AvailableGolfer[];
  selectedIds: number[];
  clubConfig: ClubConfig;
  buckets: null;
  onSelect: (dgId: number) => void;
  onDeselect: (dgId: number) => void;
}

export function GolferPicker({ golfers, selectedIds, clubConfig, buckets, onSelect, onDeselect }: GolferPickerProps) {
  return (
    <div className="golfer-picker" data-testid="golfer-picker">
      <p className="picker-instruction">
        Select exactly {clubConfig.pickCount} golfers ({selectedIds.length}/{clubConfig.pickCount} selected)
      </p>
      <div className="golfer-list">
        {golfers.map((golfer) => {
          const isSelected = selectedIds.includes(golfer.dg_id);
          const { allowed, reason } = isSelected
            ? { allowed: true, reason: undefined }
            : canAddGolfer(golfer.dg_id, selectedIds, golfers, clubConfig, buckets);

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
}
