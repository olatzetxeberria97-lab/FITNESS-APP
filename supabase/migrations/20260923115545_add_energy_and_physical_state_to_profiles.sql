/*
# Add energy_level and physical_state columns to profiles

1. Modified Tables
- `profiles`: add `energy_level` text column (stores daily energy check-in: high/medium/low)
- `profiles`: add `physical_state` text column (stores daily physical state: great/ok/sore/pain)

2. Security
- No RLS changes needed. profiles already has RLS enabled with owner-scoped policies.

3. Notes
- These columns support the expanded daily check-in feature (sleep + energy + physical state).
- Values are stored as text and are nullable (users can answer any or all questions).
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='energy_level') THEN
    ALTER TABLE profiles ADD COLUMN energy_level text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='physical_state') THEN
    ALTER TABLE profiles ADD COLUMN physical_state text;
  END IF;
END $$;