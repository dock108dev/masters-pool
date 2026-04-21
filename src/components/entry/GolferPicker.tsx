import type { AvailableGolfer, ClubConfig } from '../../types/domain';
import { SlotDropdown } from './SlotDropdown';

export interface GolferPickerProps {
  golfers: AvailableGolfer[];
  /** One entry per pick slot; null = unfilled. Length must equal clubConfig.pickCount. */
  slotSelections: (number | null)[];
  clubConfig: ClubConfig;
  buckets: null;
  onSlotChange: (slotIndex: number, dgId: number | null) => void;
  slotErrors: (string | null)[];
}

export function GolferPicker({
  golfers,
  slotSelections,
  clubConfig,
  onSlotChange,
  slotErrors,
}: GolferPickerProps) {
  const filledCount = slotSelections.filter((id) => id !== null).length;

  return (
    <div className="golfer-picker" data-testid="golfer-picker">
      <p className="picker-instruction">
        Select exactly {clubConfig.pickCount} golfers ({filledCount}/{clubConfig.pickCount} selected)
      </p>
      <div className="golfer-picker__slots">
        {slotSelections.map((dgId, slotIndex) => {
          const selectedGolfer = dgId !== null ? (golfers.find((g) => g.dg_id === dgId) ?? null) : null;
          // Each slot's available list excludes golfers already picked in OTHER slots
          const available = golfers.filter(
            (g) => !slotSelections.some((id, j) => j !== slotIndex && id === g.dg_id)
          );
          return (
            <SlotDropdown
              key={slotIndex}
              slotLabel={`Pick ${slotIndex + 1}`}
              slotIndex={slotIndex}
              selectedGolfer={selectedGolfer}
              availableGolfers={available}
              onSelect={(id) => onSlotChange(slotIndex, id)}
              onClear={() => onSlotChange(slotIndex, null)}
              error={slotErrors[slotIndex]}
            />
          );
        })}
      </div>
    </div>
  );
}
