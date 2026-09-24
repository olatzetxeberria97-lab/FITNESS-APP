/*
# PULSE v2 Expansion: Legal, Sport-Specific Data, Photos, Gamification, Challenges, Subscriptions

## Overview
Adds legal consent tracking, sport-specific onboarding data, workout photos, block breakdowns,
achievements/gamification, friend challenges, and subscription tiers.

## New Tables
1. legal_consents — user_id, 5 boolean consent flags, accepted_at
2. workout_photos — workout_id, storage_path
3. workout_blocks — workout_id, block_name, block_type, completed, sort_order
4. achievements — user_id, achievement_key, unlocked_at (unique per user)
5. challenges — creator_id, title, description, type, target, sport, dates
6. challenge_participants — challenge_id, user_id, progress_value (unique pair)

## Modified Tables
### profiles: +running_level, +running_weekly_km, +strength_location, +strength_equipment,
  +sleep_quality, +subscription_tier, +trial_started_at, +legal_accepted
### workouts: +custom_name, +photo_url, +blocks_total, +blocks_completed, +elevation_gain_m,
  +avg_speed_kmh, +calories_est, +steps_est, +is_soft_rest

## Security
- All new tables RLS enabled, owner-scoped
- Storage bucket 'workout-photos' (private) with per-user folder policies
- MIME/size validation at app level (JPG/PNG, 5MB)
*/

-- ===== PROFILES: new columns =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='running_level') THEN
    ALTER TABLE profiles ADD COLUMN running_level text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='running_weekly_km') THEN
    ALTER TABLE profiles ADD COLUMN running_weekly_km numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='strength_location') THEN
    ALTER TABLE profiles ADD COLUMN strength_location text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='strength_equipment') THEN
    ALTER TABLE profiles ADD COLUMN strength_equipment text[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='sleep_quality') THEN
    ALTER TABLE profiles ADD COLUMN sleep_quality text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription_tier') THEN
    ALTER TABLE profiles ADD COLUMN subscription_tier text DEFAULT 'free_trial';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='trial_started_at') THEN
    ALTER TABLE profiles ADD COLUMN trial_started_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='legal_accepted') THEN
    ALTER TABLE profiles ADD COLUMN legal_accepted boolean DEFAULT false;
  END IF;
END $$;

-- ===== WORKOUTS: new columns =====
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='custom_name') THEN
    ALTER TABLE workouts ADD COLUMN custom_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='photo_url') THEN
    ALTER TABLE workouts ADD COLUMN photo_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='blocks_total') THEN
    ALTER TABLE workouts ADD COLUMN blocks_total integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='blocks_completed') THEN
    ALTER TABLE workouts ADD COLUMN blocks_completed integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='elevation_gain_m') THEN
    ALTER TABLE workouts ADD COLUMN elevation_gain_m numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='avg_speed_kmh') THEN
    ALTER TABLE workouts ADD COLUMN avg_speed_kmh numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='calories_est') THEN
    ALTER TABLE workouts ADD COLUMN calories_est integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='steps_est') THEN
    ALTER TABLE workouts ADD COLUMN steps_est integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workouts' AND column_name='is_soft_rest') THEN
    ALTER TABLE workouts ADD COLUMN is_soft_rest boolean DEFAULT false;
  END IF;
END $$;

-- ===== LEGAL CONSENTS =====
CREATE TABLE IF NOT EXISTS legal_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  terms_accepted boolean NOT NULL DEFAULT false,
  privacy_accepted boolean NOT NULL DEFAULT false,
  age_confirmed boolean NOT NULL DEFAULT false,
  ip_rights_accepted boolean NOT NULL DEFAULT false,
  conduct_accepted boolean NOT NULL DEFAULT false,
  accepted_at timestamptz DEFAULT now()
);

ALTER TABLE legal_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_consents" ON legal_consents;
CREATE POLICY "select_own_consents" ON legal_consents FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_consents" ON legal_consents;
CREATE POLICY "insert_own_consents" ON legal_consents FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== WORKOUT PHOTOS =====
CREATE TABLE IF NOT EXISTS workout_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workout_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_photos" ON workout_photos;
CREATE POLICY "select_own_photos" ON workout_photos FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_photos.workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_photos" ON workout_photos;
CREATE POLICY "insert_own_photos" ON workout_photos FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_photos.workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_photos" ON workout_photos;
CREATE POLICY "delete_own_photos" ON workout_photos FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_photos.workout_id AND workouts.user_id = auth.uid())
  );

-- ===== WORKOUT BLOCKS =====
CREATE TABLE IF NOT EXISTS workout_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  block_name text NOT NULL,
  block_type text NOT NULL DEFAULT 'main',
  completed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE workout_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_blocks" ON workout_blocks;
CREATE POLICY "select_own_blocks" ON workout_blocks FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_blocks.workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_blocks" ON workout_blocks;
CREATE POLICY "insert_own_blocks" ON workout_blocks FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_blocks.workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_blocks" ON workout_blocks;
CREATE POLICY "update_own_blocks" ON workout_blocks FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_blocks.workout_id AND workouts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_blocks.workout_id AND workouts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_blocks" ON workout_blocks;
CREATE POLICY "delete_own_blocks" ON workout_blocks FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM workouts WHERE workouts.id = workout_blocks.workout_id AND workouts.user_id = auth.uid())
  );

-- ===== ACHIEVEMENTS =====
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_key text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_achievements" ON achievements;
CREATE POLICY "select_own_achievements" ON achievements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_achievements" ON achievements;
CREATE POLICY "insert_own_achievements" ON achievements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ===== CHALLENGES (table first, policies after participants table exists) =====
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL DEFAULT 'weekly_streak',
  target_value integer NOT NULL DEFAULT 1,
  sport text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL DEFAULT (CURRENT_DATE + 7),
  created_at timestamptz DEFAULT now()
);

-- ===== CHALLENGE PARTICIPANTS (created before challenges policies) =====
CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  progress_value integer NOT NULL DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- Now enable RLS and add policies for challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_challenges" ON challenges;
CREATE POLICY "select_challenges" ON challenges FOR SELECT
  TO authenticated USING (
    auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenges.id AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.user_id = auth.uid() AND f.friend_id = challenges.creator_id
    )
  );

DROP POLICY IF EXISTS "insert_own_challenges" ON challenges;
CREATE POLICY "insert_own_challenges" ON challenges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "update_own_challenges" ON challenges;
CREATE POLICY "update_own_challenges" ON challenges FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "delete_own_challenges" ON challenges;
CREATE POLICY "delete_own_challenges" ON challenges FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

-- Challenge participants RLS
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_challenge_participants" ON challenge_participants;
CREATE POLICY "select_challenge_participants" ON challenge_participants FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM challenges c WHERE c.id = challenge_participants.challenge_id AND c.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM challenge_participants cp2
      WHERE cp2.challenge_id = challenge_participants.challenge_id AND cp2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_participation" ON challenge_participants;
CREATE POLICY "insert_own_participation" ON challenge_participants FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON challenge_participants;
CREATE POLICY "update_own_progress" ON challenge_participants FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);

-- ===== STORAGE BUCKET =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout-photos', 'workout-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "users_upload_own_photos" ON storage.objects;
CREATE POLICY "users_upload_own_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_read_own_photos" ON storage.objects;
CREATE POLICY "users_read_own_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "users_delete_own_photos" ON storage.objects;
CREATE POLICY "users_delete_own_photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'workout-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
