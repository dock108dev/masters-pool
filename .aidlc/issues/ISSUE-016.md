# ISSUE-016: Multi-Tournament Expansion (Phase 4)

**Priority**: low
**Labels**: phase-4, backend, frontend, scoring, data-pipeline
**Dependencies**: ISSUE-001, ISSUE-003, ISSUE-004, ISSUE-008
**Status**: implemented

## Description

Extend the platform to support all four majors beyond Masters. Introduce a `tournaments` config table (field data, cut rules, tee time source per event). Implement cut rule variants for PGA Championship, US Open, and The Open. Parameterize the data provider adapter and auto-lock job by tournament ID rather than hardcoding Masters constants. Update pool creation wizard to include tournament selector with per-tournament defaults. Reference: ISSUE-001 (data adapter), ISSUE-003 (scoring engine), ISSUE-004 (cut rules).

## Acceptance Criteria

- [ ] `tournaments` table stores: `id`, `name`, `cut_rule_type`, `tee_time_source_url`, `default_format`, `year`.
- [ ] Cut rule implementations: PGA Championship (top 65 + ties), US Open (top 60 + ties), The Open (top 65 + ties + par floor at +8 or better).
- [ ] Auto-lock job reads `tee_time_source_url` from the pool's linked tournament row — no hardcoded Masters URL.
- [ ] Data provider adapter accepts a `tournamentId` parameter; fetches field and scores for whichever major is requested.
- [ ] Pool creation wizard step 1 offers tournament selector; selecting a tournament pre-fills cut rule type and format defaults.
- [ ] Golden-file test: scoring a fixture with PGA Championship cut rule (top 65 + ties) produces correct standings for a player ranked exactly 65th.
- [ ] Golden-file test: US Open cut rule excludes a player at position 61 when no tie exists.
- [ ] All four majors can run pools without code changes — only tournament row configuration required.

## Implementation Notes


Attempt 1: Added CutRuleType ('masters'|'pga_championship'|'us_open'|'the_open') and extended TournamentOption with cut_rule_type and default_format in domain.ts. Expanded MOCK_TOURNAMENTS to include all four 2026 majors. Updated PoolWizardPage Step1Form to pre-fill format and pick-count defaults when a tournament is selected, and displays a cut-rule hint. Step4Review now shows the cut rule. Added migrations/002_tournaments.sql with cut_rule_type enum, tournaments table, seed rows for all four majors, and FK from pools. Added 5 new wizard tests covering hint display, per-major labels, format pre-fill, dropdown coverage, and review display.