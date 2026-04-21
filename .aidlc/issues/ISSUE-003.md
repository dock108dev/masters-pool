# ISSUE-003: Deterministic Scoring Engine (Backend)

**Priority**: high
**Labels**: phase-1, backend, scoring
**Dependencies**: none
**Status**: implemented

## Description

Implement a pure, side-effect-free scoring function that takes a pool config snapshot and a list of player results, and produces a ranked leaderboard with per-entry aggregate scores. The function must be versioned so that replaying historical results with the same rules_json produces identical output. Reference: `docs/research/deterministic-scoring-engine-design.md`.

## Acceptance Criteria

- [ ] Scoring function signature: `score(config: PoolConfigSnapshot, results: PlayerResult[]) -> LeaderboardStanding[]`.
- [ ] Given the same inputs, output is byte-identical across invocations and server restarts.
- [ ] Golden-file test suite: at least 5 fixture sets (normal round, cut day, tie scenario, WD golfer, all picks cut) with committed expected JSON outputs.
- [ ] Running golden-file tests with altered fixtures causes test failure with a diff showing exact changed lines.
- [ ] Scoring function is not called from any frontend code — it lives exclusively in the backend.
- [ ] `aggregate_score`, `rank`, and `qualification_status` in leaderboard endpoint come exclusively from this function.
- [ ] TypeScript strict mode passes; no `any` types in scoring module.

## Implementation Notes


Attempt 1: Added src/ingestion/scoring.ts: pure score() function with PoolConfigSnapshot/PoolEntry types, deterministic ranking (standard competition ranks, entry_id tiebreak), and SCORING_ENGINE_VERSION. Added 5 golden-file fixture sets (normal-round, cut-day, tie-scenario, wd-golfer, all-picks-cut) with committed expected JSON outputs. Created src/__tests__/ingestion/scoring.test.ts with 80 tests covering all acceptance criteria. Updated src/ingestion/index.ts to export the new symbols.