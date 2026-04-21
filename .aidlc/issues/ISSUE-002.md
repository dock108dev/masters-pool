# ISSUE-002: Pool Config Locking & Immutability

**Priority**: high
**Labels**: phase-1, backend, pool-config
**Dependencies**: none
**Status**: implemented

## Description

Add `locked_at` (timestamp) and `config_hash` (SHA-256 of rules_json) columns to the `pools` table. Implement an auto-lock job that fires at the tournament's first tee time, sets `locked_at`, and refuses further entry writes. Expose a `/pools/:id/lock-status` endpoint. Reference: `docs/research/pool-lock-timing-source.md`, `docs/research/immutable-pool-config-pattern.md`.

## Acceptance Criteria

- [ ] `locked_at` is set atomically by the auto-lock job — no race between two concurrent job invocations.
- [ ] Any write to `entries` or `pool.rules_json` after `locked_at` is set returns HTTP 409 with a machine-readable error code.
- [ ] `config_hash` matches SHA-256 of the stored `rules_json` blob; mismatches are logged as integrity alerts.
- [ ] Lock status endpoint returns `{ locked: boolean, locked_at: string | null }` and is publicly readable.
- [ ] Frontend `EntryPage` displays a 'Pool is locked' banner when `locked` is true, disabling the submission form.
- [ ] Unit test: auto-lock job idempotent — running twice does not alter `locked_at` value.
- [ ] Integration test: entry submission attempt after lock returns 409 and no row is inserted.

## Implementation Notes


Attempt 1: Added PoolLockStatus domain type; getLockStatus to ApiClient interface, MockApiClient (with lockedPoolIds constructor arg), and HttpApiClient; created src/ingestion/poolLock.ts with InMemoryPoolLockStore, PoolLockJob (idempotent lock, SHA-256 config_hash via Web Crypto, integrity check with alert callback); EntryPage now fetches lock status and renders a pool-locked-banner (disabling the form) when locked; 396 tests pass across 22 files.