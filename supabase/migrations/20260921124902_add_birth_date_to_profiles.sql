/*
# Add birth_date column to profiles

1. Changes
- Add `birth_date` (date, nullable) to `profiles` table.
- This stores the user's date of birth so the app can:
  - Calculate age automatically and display it on the Profile screen.
  - Show a birthday greeting notification on the user's birthday.
- The existing `age` integer column is kept for backwards compatibility
  (existing onboarding flow writes `age` directly). New signups will write
  `birth_date` instead, and the app will compute age from it at runtime.
2. Security
- No RLS policy changes needed — `profiles` already has owner-scoped CRUD
  policies. The new column inherits the same policies automatically.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birth_date date;
