-- Migration: 002_tournaments
-- Creates the tournaments config table used by pool creation and scoring.
-- Each row represents one major for a given year. Cut rule logic is enforced
-- by the scoring engine — this table only stores the configuration.

BEGIN;

-- ---------------------------------------------------------------------------
-- Cut rule type enum
-- ---------------------------------------------------------------------------

CREATE TYPE cut_rule_type AS ENUM (
  'masters',          -- Top 50 + ties
  'pga_championship', -- Top 65 + ties
  'us_open',          -- Top 60 + ties
  'the_open'          -- Top 65 + ties + par floor at +8 or better
);

-- ---------------------------------------------------------------------------
-- tournaments table
-- ---------------------------------------------------------------------------

CREATE TABLE tournaments (
  id                  SERIAL          PRIMARY KEY,
  name                TEXT            NOT NULL,
  year                INTEGER         NOT NULL,
  cut_rule_type       cut_rule_type   NOT NULL,
  -- URL for the tee-time source used by the auto-lock job (no hardcoded URLs in code)
  tee_time_source_url TEXT            NOT NULL,
  default_format      TEXT            NOT NULL DEFAULT 'flat'
                        CHECK (default_format IN ('flat', 'bucketed')),
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT clock_timestamp(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT clock_timestamp(),

  CONSTRAINT tournaments_name_year_unique UNIQUE (name, year)
);

-- ---------------------------------------------------------------------------
-- Seed the four majors for 2026
-- ---------------------------------------------------------------------------

INSERT INTO tournaments (id, name, year, cut_rule_type, tee_time_source_url, default_format) VALUES
  (100, 'The Masters',       2025, 'masters',          'https://www.masters.com/en_US/scores/feeds/2025/scores.json',           'flat'),
  (101, 'The Masters',       2026, 'masters',          'https://www.masters.com/en_US/scores/feeds/2026/scores.json',           'flat'),
  (102, 'PGA Championship',  2026, 'pga_championship', 'https://www.pga.com/events/pgachampionship/field-and-tee-times',        'flat'),
  (103, 'US Open',           2026, 'us_open',          'https://www.usopen.com/en_US/scores/feeds/2026/scores.json',            'flat'),
  (104, 'The Open',          2026, 'the_open',         'https://www.theopen.com/en_GB/scores/feeds/2026/scores.json',           'flat');

-- Reset sequence past the seeded IDs
SELECT setval('tournaments_id_seq', 200);

-- ---------------------------------------------------------------------------
-- Foreign key from pools to tournaments
-- (Assumes pools table exists with a tournament_id column; add if absent)
-- ---------------------------------------------------------------------------

-- Add tournament_id column if the pools table was created without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pools' AND column_name = 'tournament_id'
  ) THEN
    ALTER TABLE pools ADD COLUMN tournament_id INTEGER;
  END IF;
END$$;

ALTER TABLE pools
  ADD CONSTRAINT pools_tournament_id_fk
  FOREIGN KEY (tournament_id) REFERENCES tournaments (id)
  ON DELETE RESTRICT;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX tournaments_year_idx ON tournaments (year DESC);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT ON tournaments TO app_role;
GRANT USAGE, SELECT ON SEQUENCE tournaments_id_seq TO app_role;

COMMIT;
