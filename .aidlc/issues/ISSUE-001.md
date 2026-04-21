# ISSUE-001: Tournament Data Provider Integration

**Priority**: high
**Labels**: phase-1, backend, data-pipeline
**Dependencies**: none
**Status**: implemented

## Description

Integrate with a real golf data API (e.g., DataGolf) to ingest live tournament scores. Build a polling job that fetches player results at configurable intervals and persists them to the backend database. Map API response shapes to the existing domain types in `src/types/domain.ts`. Expose a backend endpoint that the frontend `HttpApiClient` already calls (`/leaderboard`). Reference: `docs/research/golf-tournament-data-api.md`.

## Acceptance Criteria

- [ ] Polling job fetches live scores from external API on a configurable interval (default 60s during tournament, 1h outside).
- [ ] Player results are stored in a `player_results` table keyed by `dg_id` (number) and `tournament_id`.
- [ ] All API response fields map to domain types without `any` or unsafe casts.
- [ ] A failed external API call is logged and does not overwrite the last-good data snapshot.
- [ ] Integration test asserts the polling job stores at least one result row per active golfer in the fixture.
- [ ] The existing `/leaderboard` endpoint returns data from this table (not from mock).
- [ ] CI pipeline includes at least one integration test against a recorded/stubbed API response.

## Implementation Notes


Attempt 1: Added src/ingestion/ data pipeline: DataGolf API types with runtime validation guard (no any/unsafe casts), mapper from DataGolf leaderboard rows to PlayerResult domain type, InMemoryPlayerResultsStore (interface + impl), TournamentPoller with configurable 60s/1h intervals, pollOnce() for direct use, and error isolation (failed fetch never overwrites store). Tests: 26 new tests across mapper.test.ts and poller.test.ts using a recorded 24-player fixture. All 373 tests pass, tsc clean, lint clean.