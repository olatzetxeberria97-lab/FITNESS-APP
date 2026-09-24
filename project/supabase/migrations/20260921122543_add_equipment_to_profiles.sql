/*
# Add equipment column to profiles

1. Changes
- Add `equipment` (text[], nullable) to the `profiles` table.
- Stores the user's available home workout equipment as an array of strings
  (e.g. ['dumbbells', 'mat', 'bands']). Null means not yet configured.
- No policy changes needed: existing update_own_profile policy covers it.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'equipment'
  ) THEN
    ALTER TABLE profiles ADD COLUMN equipment text[];
  END IF;
END $$;
