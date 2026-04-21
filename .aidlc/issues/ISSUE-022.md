# ISSUE-022: Platform Format Abstraction Engine (Phase 4)

**Priority**: low
**Labels**: phase-4, backend, frontend, scoring
**Dependencies**: ISSUE-016
**Status**: implemented

## Description

Generalize the pool engine beyond golf so that tournament type (golf, basketball, etc.) is a top-level config dimension. Deliver: (1) a `FormatEngine` interface with a pluggable `computeStandings` contract that the existing golf engine implements; (2) one non-golf pool format (e.g., bracket-style tournament) as a concrete proof of the abstraction; (3) pool creation wizard exposes a format selector that lists available engine types. New formats must be addable via config/registration, not code changes to the core engine.

## Acceptance Criteria

- [ ] A `FormatEngine` interface (or abstract class) is defined; the existing golf scoring engine implements it without behavioral change.
- [ ] A second, non-golf format module (e.g., bracket pool) is registered and passes its own unit tests using the same `computeStandings` contract.
- [ ] Pool creation wizard renders a format selector; selecting a non-golf format shows its config fields (not golf-specific ones).
- [ ] Adding a third format requires zero changes to the core engine or routing — only a new module registration.
- [ ] Existing golf pool tests pass unchanged after the abstraction is introduced.
- [ ] Vitest test: `computeStandings` called with bracket-format entries returns correct bracket standings without importing golf-specific logic.

## Implementation Notes


Attempt 1: Introduced FormatEngine abstraction in src/engines/: types.ts (interface + BaseStanding), registry.ts (registerEngine/getEngine/listEngines), golf.ts (wraps existing score() unchanged), bracket.ts (BracketFormatEngine with computeStandings, ranking, and BracketStanding), index.ts (registers both). Added wizardEngines.tsx with WizardEngineRegistration registry driving PoolWizardPage step 2 engine selector; bracket skips step 3 via hasStep3 flag. Extended CreatePoolRules with engine_type/bracket fields. 8 bracket tests including isolation test verifying no golf imports.