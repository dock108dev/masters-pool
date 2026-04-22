import { useState, useRef, useEffect } from 'react';
import type { AvailableGolfer } from '../../types/domain';

export interface SlotDropdownProps {
  slotLabel: string;
  slotIndex: number;
  selectedGolfer: AvailableGolfer | null;
  /** Golfers available for selection; negative dg_ids (other players) are excluded from the list. */
  availableGolfers: AvailableGolfer[];
  onSelect: (dgId: number) => void;
  onClear: () => void;
  error?: string | null;
}

const MAX_VISIBLE = 50;

export function SlotDropdown({
  slotLabel,
  slotIndex,
  selectedGolfer,
  availableGolfers,
  onSelect,
  onClear,
  error,
}: SlotDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filteredGolfers = availableGolfers
    .filter(
      (g) =>
        g.dg_id > 0 &&
        (!searchQuery || g.player_name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (a.ranking != null && b.ranking != null) return a.ranking - b.ranking;
      if (a.ranking != null) return -1;
      if (b.ranking != null) return 1;
      return a.player_name.localeCompare(b.player_name);
    })
    .slice(0, MAX_VISIBLE);

  const open = () => {
    setIsOpen(true);
    setSearchQuery('');
  };

  const close = () => {
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleSelect = (dgId: number) => {
    onSelect(dgId);
    close();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClear();
  };

  // Focus search input when panel opens
  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <div
      className={`slot-dropdown${isOpen ? ' slot-dropdown--open' : ''}${error ? ' slot-dropdown--error' : ''}`}
      ref={containerRef}
      data-testid={`slot-${slotIndex}`}
    >
      <div className="slot-dropdown__label">{slotLabel}</div>

      <div className="slot-dropdown__control">
        <button
          type="button"
          className="slot-dropdown__trigger"
          onClick={() => (isOpen ? close() : open())}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `slot-error-${slotIndex}` : undefined}
          data-testid={`slot-trigger-${slotIndex}`}
        >
          {selectedGolfer ? (
            <span className="slot-dropdown__selected">
              <span className="slot-dropdown__selected-name">{selectedGolfer.player_name}</span>
              {selectedGolfer.ranking != null && (
                <span className="slot-dropdown__selected-rank">#{selectedGolfer.ranking}</span>
              )}
            </span>
          ) : (
            <span className="slot-dropdown__placeholder">Select a golfer</span>
          )}
          <span className="slot-dropdown__chevron" aria-hidden="true">▾</span>
        </button>

        {selectedGolfer && (
          <button
            type="button"
            className="slot-dropdown__clear"
            onClick={handleClear}
            aria-label={`Clear ${slotLabel}`}
            data-testid={`slot-clear-${slotIndex}`}
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <p
          id={`slot-error-${slotIndex}`}
          className="slot-dropdown__error"
          role="alert"
          data-testid={`slot-error-${slotIndex}`}
        >
          {error}
        </p>
      )}

      {isOpen && (
        <div
          className="slot-dropdown__panel"
          role="listbox"
          aria-label={`${slotLabel} options`}
          data-testid={`slot-panel-${slotIndex}`}
        >
          <input
            ref={searchRef}
            type="text"
            className="slot-dropdown__search"
            placeholder="Search golfers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid={`slot-search-${slotIndex}`}
          />
          <ul className="slot-dropdown__options">
            {filteredGolfers.map((golfer) => (
              <li key={golfer.dg_id}>
                <button
                  type="button"
                  className="slot-dropdown__option"
                  onClick={() => handleSelect(golfer.dg_id)}
                  role="option"
                  aria-selected={selectedGolfer?.dg_id === golfer.dg_id}
                  data-testid={`slot-option-${golfer.dg_id}`}
                >
                  <span className="slot-option__name">{golfer.player_name}</span>
                  {golfer.ranking != null && (
                    <span className="slot-option__rank">#{golfer.ranking}</span>
                  )}
                </button>
              </li>
            ))}
            {filteredGolfers.length === 0 && (
              <li className="slot-dropdown__empty">No golfers found</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
