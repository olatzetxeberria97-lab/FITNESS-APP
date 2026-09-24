/*
# v3: Social interactions, race prep, notification settings

## New Tables
- `workout_likes` — likes on shared workouts (user_id + workout_id, unique pair)
- `workout_comments` — comments on shared workouts (text body, user_id, workout_id)

## New Columns
- `profiles.race_goal` — text, nullable. Values: '5k' | '10k' | '15k' | 'half_marathon' | null
- `profiles.notifications_enabled` — boolean, default true
- `profiles.notify_friends_activity` — boolean, default true
- `profiles.notify_challenges` — boolean, default true
- `profiles.notify_achievements` — boolean, default true

## Security
- RLS enabled on both new tables.
- workout_likes: read likes on visible workouts; insert/delete own likes only.
- workout_comments: read comments on visible workouts; insert own comments, delete own comments.
- profiles columns added to existing table (RLS already enabled).
*/

CREATE TABLE IF NOT EXISTS workout_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (workout_id, user_id)
);

ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_workout_likes" ON workout_likes;
CREATE POLICY "read_workout_likes"
ON workout_likes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_likes.workout_id
    AND (w.user_id = auth.uid() OR w.is_shared = true)
  )
);

DROP POLICY IF EXISTS "insert_own_workout_likes" ON workout_likes;
CREATE POLICY "insert_own_workout_likes"
ON workout_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workout_likes" ON workout_likes;
CREATE POLICY "delete_own_workout_likes"
ON workout_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS workout_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_workout_comments" ON workout_comments;
CREATE POLICY "read_workout_comments"
ON workout_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workouts w
    WHERE w.id = workout_comments.workout_id
    AND (w.user_id = auth.uid() OR w.is_shared = true)
  )
);

DROP POLICY IF EXISTS "insert_own_workout_comments" ON workout_comments;
CREATE POLICY "insert_own_workout_comments"
ON workout_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workout_comments" ON workout_comments;
CREATE POLICY "delete_own_workout_comments"
ON workout_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'race_goal') THEN
    ALTER TABLE profiles ADD COLUMN race_goal text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notifications_enabled') THEN
    ALTER TABLE profiles ADD COLUMN notifications_enabled boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_friends_activity') THEN
    ALTER TABLE profiles ADD COLUMN notify_friends_activity boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_challenges') THEN
    ALTER TABLE profiles ADD COLUMN notify_challenges boolean DEFAULT true;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'notify_achievements') THEN
    ALTER TABLE profiles ADD COLUMN notify_achievements boolean DEFAULT true;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_likes_workout ON workout_likes(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_comments_workout ON workout_comments(workout_id);
