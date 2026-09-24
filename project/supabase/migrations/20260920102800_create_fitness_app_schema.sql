/*
# Fitness App Schema - Multi-user with Auth

## Overview
Creates the full database schema for a premium fitness training app with:
- User profiles (goal, sports, weight tracking)
- Weekly AI-generated training plans
- Workout records (GPS routes + manual completions)
- Weight tracking with history
- Social/community features (friends, feed, privacy)
- Nutrition recommendations

## New Tables

1. `profiles`
   - `id` (uuid, PK, references auth.users)
   - `display_name` (text, public username for friends/search)
   - `goal` (text: 'lose_weight' | 'gain_muscle' | 'general_health')
   - `sports` (text array: selected sports + custom)
   - `current_weight_kg` (numeric, nullable)
   - `target_weight_kg` (numeric, nullable)
   - `height_cm` (numeric, nullable)
   - `age` (integer, nullable)
   - `sex` (text, nullable: 'male' | 'female')
   - `onboarding_complete` (boolean, default false)
   - `avatar_color` (text, for generated avatar)
   - `created_at`, `updated_at` (timestamps)

2. `weekly_plans`
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles)
   - `week_start` (date, Monday of the week)
   - `plan_data` (jsonb: array of days with sport, type, description, completed flag)
   - `created_at` (timestamp)

3. `workouts`
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles)
   - `sport` (text: the sport performed)
   - `type` (text: 'gps' | 'manual')
   - `date` (date, when the workout was done)
   - `duration_sec` (integer, nullable)
   - `distance_km` (numeric, nullable)
   - `route_geojson` (jsonb, nullable: GeoJSON LineString for GPS tracks)
   - `notes` (text, nullable)
   - `is_shared` (boolean, default false: visible in community feed)
   - `created_at` (timestamp)

4. `weight_logs`
   - `id` (uuid, PK)
   - `user_id` (uuid, references profiles)
   - `weight_kg` (numeric, not null)
   - `logged_at` (date, the date of the measurement)
   - `created_at` (timestamp)

5. `friendships`
   - `id` (uuid, PK)
   - `user_id` (uuid, the requester)
   - `friend_id` (uuid, the accepted friend)
   - `status` (text: 'accepted')
   - `created_at` (timestamp)
   - Unique constraint on (user_id, friend_id) to prevent duplicates

6. `friend_requests`
   - `id` (uuid, PK)
   - `sender_id` (uuid)
   - `receiver_id` (uuid)
   - `status` (text: 'pending' | 'accepted' | 'declined')
   - `created_at` (timestamp)

## Security (RLS)
- All tables have RLS enabled
- profiles: users can read all profiles (for friend search) but only update their own
- weekly_plans: owner-only CRUD
- workouts: owner can CRUD; community can SELECT shared workouts
- weight_logs: owner-only CRUD
- friendships: both parties can see; only owner can insert/delete
- friend_requests: sender and receiver can see; receiver can update status
*/

-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  goal text NOT NULL DEFAULT 'general_health',
  sports text[] NOT NULL DEFAULT '{}',
  current_weight_kg numeric,
  target_weight_kg numeric,
  height_cm numeric,
  age integer,
  sex text,
  onboarding_complete boolean NOT NULL DEFAULT false,
  avatar_color text NOT NULL DEFAULT '#00ff88',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- WEEKLY PLANS
CREATE TABLE IF NOT EXISTS weekly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  plan_data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_plans" ON weekly_plans;
CREATE POLICY "select_own_plans" ON weekly_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_plans" ON weekly_plans;
CREATE POLICY "insert_own_plans" ON weekly_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_plans" ON weekly_plans;
CREATE POLICY "update_own_plans" ON weekly_plans FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_plans" ON weekly_plans;
CREATE POLICY "delete_own_plans" ON weekly_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- WORKOUTS
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sport text NOT NULL,
  type text NOT NULL DEFAULT 'manual',
  date date NOT NULL,
  duration_sec integer,
  distance_km numeric,
  route_geojson jsonb,
  notes text,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_workouts" ON workouts;
CREATE POLICY "select_workouts" ON workouts FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR is_shared = true
  );

DROP POLICY IF EXISTS "insert_own_workouts" ON workouts;
CREATE POLICY "insert_own_workouts" ON workouts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_workouts" ON workouts;
CREATE POLICY "update_own_workouts" ON workouts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_workouts" ON workouts;
CREATE POLICY "delete_own_workouts" ON workouts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_shared ON workouts(is_shared, created_at DESC) WHERE is_shared = true;

-- WEIGHT LOGS
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL,
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weights" ON weight_logs;
CREATE POLICY "select_own_weights" ON weight_logs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_weights" ON weight_logs;
CREATE POLICY "insert_own_weights" ON weight_logs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_weights" ON weight_logs;
CREATE POLICY "update_own_weights" ON weight_logs FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_weights" ON weight_logs;
CREATE POLICY "delete_own_weights" ON weight_logs FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs(user_id, logged_at DESC);

-- FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_friendships" ON friendships;
CREATE POLICY "select_friendships" ON friendships FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "insert_own_friendships" ON friendships;
CREATE POLICY "insert_own_friendships" ON friendships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_friendships" ON friendships;
CREATE POLICY "delete_own_friendships" ON friendships FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- FRIEND REQUESTS
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_friend_requests" ON friend_requests;
CREATE POLICY "select_friend_requests" ON friend_requests FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "insert_own_friend_requests" ON friend_requests;
CREATE POLICY "insert_own_friend_requests" ON friend_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_friend_requests" ON friend_requests;
CREATE POLICY "update_friend_requests" ON friend_requests FOR UPDATE
  TO authenticated USING (auth.uid() = receiver_id) WITH CHECK (auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests(sender_id, status);
