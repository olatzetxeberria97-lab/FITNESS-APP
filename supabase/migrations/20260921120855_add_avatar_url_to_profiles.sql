/*
# Add avatar_url column to profiles

1. Changes
- Add `avatar_url` (text, nullable) to the `profiles` table.
- This column stores the public URL of a user-uploaded profile photo.
- When null, the app falls back to the generated colored avatar.

2. Security
- No policy changes needed: the existing update_own_profile policy
  already allows users to update any column on their own row,
  including the new avatar_url column.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
END $$;
