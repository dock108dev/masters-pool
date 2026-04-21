# ISSUE-004: Masters Cut Rules & WD/DQ Handling

**Priority**: high
**Labels**: phase-1, backend, scoring, cut-rules
**Dependencies**: ISSUE-003
**Status**: implemented

## Description

Implement the Masters-specific cut rule within the scoring engine: after round 2, retain players who are in the top 50 and ties, AND within 10 shots of the 36-hole leader. Mark cut players with `qualification_status: 'cut'`. Handle WD (withdrawal) and DQ (disqualification) with distinct statuses and a configurable score penalty. Reference: `docs/research/cut-rule-variations.md`.

## Acceptance Criteria

- [ ] A player at exactly +10 relative to the 36-hole leader is retained; a player at +11 is cut.
- [ ] Ties at the cut line are all retained (bubble players all stay if tied).
- [ ] WD players receive `qualification_status: 'wd'` and their score is replaced by the penalty defined in `rules_json`.
- [ ] DQ players receive `qualification_status: 'dq'` and are excluded from ranking but still appear in standings.
- [ ] Golden-file test: fixture with a bubble group of 4 tied players at +10 — all 4 are retained.
- [ ] Golden-file test: WD on day 1 vs WD on day 3 produce different penalty applications per rules_json.
- [ ] Cut rule logic is isolated in its own module; swappable for PGA/US Open rules without touching the engine core.

## Implementation Notes


Attempt 1: Created src/ingestion/cutRules.ts with CutRuleEngine interface and MastersCutRule (top-50+ties and within-10-of-leader, using MAX for correct additive logic). Extended PoolRules with optional wd_score_penalty/dq_score_penalty. Updated scoring.ts buildPickData to apply penalties (completed rounds + penalty). Added golden fixtures: wd-penalty-day1.json, wd-penalty-day3.json, cut-rules/masters-bubble.json (56 players). Added cutRules.test.ts (bubble group, leader+10 boundary, WD/DQ exclusion) and extended scoring.test.ts with WD penalty day-1-vs-day-3 comparison. 454 tests pass.