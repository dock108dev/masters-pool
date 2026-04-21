# ISSUE-006: Audit Trail & Entry Event Log (Backend)

**Priority**: medium
**Labels**: phase-1, backend, audit
**Dependencies**: none
**Status**: implemented

## Description

Create an append-only `pool_events` table that logs all state-changing actions: entry submitted, entry updated, pool published, pool locked, score recalculated. Each row is immutable (no UPDATE/DELETE). Apply Row-Level Security so coordinators see only events for their pool. Expose a `/pools/:id/events` endpoint. Reference: `docs/research/audit-log-entry-trail-libraries.md`.

## Acceptance Criteria

- [ ] `pool_events` table has columns: `id`, `pool_id`, `event_type` (enum), `actor_id`, `payload` (jsonb), `created_at`. No `updated_at`.
- [ ] Database migration includes a trigger that rejects UPDATE and DELETE on `pool_events`.
- [ ] Every entry submission writes an `entry_submitted` event with the full picks snapshot in `payload`.
- [ ] Pool lock writes a `pool_locked` event with `locked_at` and `config_hash` in `payload`.
- [ ] RLS policy: a coordinator can only SELECT events where `pool_id` belongs to their club.
- [ ] Events endpoint returns events in ascending `created_at` order, paginated (default 50 per page).
- [ ] Integration test: submit an entry, lock the pool, fetch events — both event types appear in correct order.

## Implementation Notes


Attempt 1: Added append-only pool_events audit log: PoolEventType/PoolEvent/PoolEventsPage domain types in domain.ts; InMemoryPoolEventStore (append + paginated getByPool) in src/ingestion/events.ts; PoolLockJob now accepts optional PoolEventStore and emits pool_locked on fresh lock; getPoolEvents added to ApiClient interface, API_ENDPOINTS, HttpApiClient, and MockApiClient; SQL migration at migrations/001_pool_events.sql with enum, immutability triggers, ascending index, RLS policy, and role grants; 35 unit tests in events.test.ts and 4 integration tests in events-integration.test.ts covering submit→lock→fetch scenario and pagination.