-- Migration: 001_pool_events
-- Creates the append-only pool_events audit log table.
-- Rows are immutable: UPDATE and DELETE are rejected by triggers.
-- RLS restricts SELECT to coordinators of the event's pool's club.

BEGIN;

-- ---------------------------------------------------------------------------
-- Event type enum
-- ---------------------------------------------------------------------------

CREATE TYPE pool_event_type AS ENUM (
  'entry_submitted',
  'entry_updated',
  'pool_published',
  'pool_locked',
  'score_recalculated'
);

-- ---------------------------------------------------------------------------
-- pool_events table
-- ---------------------------------------------------------------------------

CREATE TABLE pool_events (
  id          BIGSERIAL        PRIMARY KEY,
  pool_id     INTEGER          NOT NULL,
  event_type  pool_event_type  NOT NULL,
  actor_id    TEXT,
  payload     JSONB            NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT clock_timestamp()
  -- No updated_at — rows are immutable
);

-- ---------------------------------------------------------------------------
-- Immutability trigger — rejects UPDATE and DELETE at the DB level
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION pool_events_reject_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'pool_events rows are immutable: % is not allowed', TG_OP;
END;
$$;

CREATE TRIGGER pool_events_no_update
  BEFORE UPDATE ON pool_events
  FOR EACH ROW EXECUTE FUNCTION pool_events_reject_mutation();

CREATE TRIGGER pool_events_no_delete
  BEFORE DELETE ON pool_events
  FOR EACH ROW EXECUTE FUNCTION pool_events_reject_mutation();

-- ---------------------------------------------------------------------------
-- Indexes for common query patterns
-- ---------------------------------------------------------------------------

-- Primary access pattern: all events for a pool in chronological order
CREATE INDEX pool_events_pool_id_created_at_idx
  ON pool_events (pool_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE pool_events ENABLE ROW LEVEL SECURITY;

-- Coordinators may only SELECT events whose pool_id belongs to their club.
-- Assumes:
--   pools(id, club_id)
--   club_coordinators(club_id, user_id)
--   app.current_user_id set per-request via SET LOCAL app.current_user_id = ...
CREATE POLICY pool_events_coordinator_select ON pool_events
  FOR SELECT
  USING (
    pool_id IN (
      SELECT p.id
      FROM   pools p
      JOIN   club_coordinators cc ON cc.club_id = p.club_id
      WHERE  cc.user_id = current_setting('app.current_user_id', true)::INTEGER
    )
  );

-- App role may INSERT but never UPDATE or DELETE
-- (triggers above provide a second enforcement layer)
GRANT INSERT, SELECT ON pool_events TO app_role;
REVOKE UPDATE, DELETE ON pool_events FROM app_role;
GRANT USAGE, SELECT ON SEQUENCE pool_events_id_seq TO app_role;

COMMIT;
