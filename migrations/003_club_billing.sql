-- Add Stripe billing columns to clubs table.
-- billing_status: 'trial' (default) | 'active' | 'suspended'
-- trial_used: set atomically on first pool creation; blocks subsequent free pool creation
ALTER TABLE clubs
  ADD COLUMN stripe_customer_id TEXT,
  ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (billing_status IN ('trial', 'active', 'suspended')),
  ADD COLUMN trial_used BOOLEAN NOT NULL DEFAULT FALSE;
