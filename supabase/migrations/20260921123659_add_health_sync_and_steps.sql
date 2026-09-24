/*
# Add health app sync and daily steps tracking

1. Modified Tables
- `profiles`: add `health_connected` (boolean, default false) and `health_provider` (text, nullable)
  to track whether the user has connected a health platform and which one.
2. New Tables
- `daily_steps`: stores daily step counts synced from health platforms.
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users, not null)
  - `steps` (integer, not null)
  - `date` (date, not null) — the calendar day the steps were recorded for
  - `source` (text, nullable) — e.g. 'apple_health', 'google_fit', 'health_connect', 'samsung_health', 'huawei_health'
  - `created_at` (timestamptz, default now())
  - Unique constraint on (user_id, date) so only one record per day per user.
3. Security
- Enable RLS on `daily_steps`.
- Owner-scoped CRUD: each authenticated user can only access their own step records.
4. Indexes
- Index on `daily_steps(user_id, date)` for efficient queries.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'health_connected'
  ) THEN
    ALTER TABLE profiles ADD COLUMN health_connected boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'health_provider'
  ) THEN
    ALTER TABLE profiles ADD COLUMN health_provider text;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS daily_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  steps integer NOT NULL DEFAULT 0,
  date date NOT NULL,
  source text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily_steps" ON daily_steps;
CREATE POLICY "select_own_daily_steps" ON daily_steps
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily_steps" ON daily_steps;
CREATE POLICY "insert_own_daily_steps" ON daily_steps
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily_steps" ON daily_steps;
CREATE POLICY "update_own_daily_steps" ON daily_steps
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_daily_steps" ON daily_steps;
CREATE POLICY "delete_own_daily_steps" ON daily_steps
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date ON daily_steps(user_id, date);
