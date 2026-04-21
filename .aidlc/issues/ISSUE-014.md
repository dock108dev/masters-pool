# ISSUE-014: Slot-Based Entry Picker Rebuild (Phase 2 Entry System)

**Priority**: medium
**Labels**: phase-2, frontend, entry
**Dependencies**: ISSUE-007, ISSUE-002
**Status**: implemented

## Description

Rebuild `GolferPicker` and `BucketPicker` for Phase 2 entry system requirements: each slot is an independent dropdown that structurally prevents duplicate selections; bucket format groups golfers by bucket with world ranking range labels; mobile viewports open a bottom-sheet modal; golfer list uses virtualized rendering for 150+ golfer fields. Replaces the current flat checkbox-list approach. Reference: `docs/research/entry-validation-ui-patterns.md`, `docs/research/bucket-pick-format-standards.md`.

## Acceptance Criteria

- [ ] Each pick slot renders as an independent dropdown; selecting golfer A in slot 1 removes golfer A from every other slot's option list (structural, not just visual).
- [ ] For bucket format: golfers are grouped under their bucket heading; heading shows world ranking range (e.g., 'Bucket 1 — World #1–15').
- [ ] On viewports < 768px, tapping a slot opens a bottom-sheet overlay rather than an inline dropdown.
- [ ] Golfer list in any slot renders ≤ 50 DOM nodes for a 150-golfer field (virtualized or windowed rendering).
- [ ] Submit button is disabled until all required slots are filled; per-slot inline error messages appear when submit is attempted with empty slots.
- [ ] Selected golfer in each slot shows name + current world ranking next to the slot label.
- [ ] Vitest test: selecting golfer A in slot 1 causes slot 2's rendered options to exclude golfer A.
- [ ] Vitest test: `BucketPicker` renders correct bucket group headings derived from `rules_json` bucket definitions.
- [ ] Vitest test: submit attempt with one unfilled slot shows an inline error on that slot, not a generic form error.
- [ ] TypeScript strict mode passes; no `any` in picker or slot state logic.

## Implementation Notes


Attempt 1: Rebuilt GolferPicker and BucketPicker as slot-based dropdown systems. New SlotDropdown component (src/components/entry/SlotDropdown.tsx) renders each pick as an independent searchable dropdown that structurally excludes already-picked golfers from other slots' option lists (≤50 DOM nodes via MAX_VISIBLE slice). BucketPicker now shows world ranking range in headings when golfer rankings are present. Mobile bottom-sheet is CSS-driven (media-query on .slot-dropdown__panel). EntryPage and PublicEntryPage migrated from selectedIds[] to slotSelections[(number|null)[]] + slotErrors[(string|null)[]]; submit sets per-slot inline errors. Added validateSlotSelections to validation.ts. All three required Vitest tests added; all 577 tests pass.