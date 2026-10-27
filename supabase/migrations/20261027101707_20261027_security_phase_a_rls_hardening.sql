-- =========================================================
-- Fase 1A: Endurecimiento RLS (no breaking)
-- Punto de restauracion: ver REVERT al final del archivo
-- =========================================================

-- get_my_profile(): lectura del perfil propio completo (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS profiles
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION get_my_profile() TO authenticated;

-- profiles: sustituir select_all_profiles por propias+publicas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_other_public" ON profiles;

CREATE POLICY "select_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "select_other_public" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() <> id);

-- workout_comments: verificar visibilidad del entreno en INSERT
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_own_workout_comments" ON workout_comments;
CREATE POLICY "insert_own_workout_comments" ON workout_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_comments.workout_id
        AND (w.user_id = auth.uid() OR w.is_shared = true)
    )
  );

-- workout_likes: verificar visibilidad del entreno en INSERT
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_own_workout_likes" ON workout_likes;
CREATE POLICY "insert_own_workout_likes" ON workout_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM workouts w
      WHERE w.id = workout_likes.workout_id
        AND (w.user_id = auth.uid() OR w.is_shared = true)
    )
  );

-- =========================================================
-- REVERT (no se ejecuta automaticamente):
-- DROP FUNCTION IF EXISTS get_my_profile();
-- DROP POLICY IF EXISTS "select_own_profile" ON profiles;
-- DROP POLICY IF EXISTS "select_other_public" ON profiles;
-- CREATE POLICY "select_all_profiles" ON profiles FOR SELECT TO authenticated USING (true);
-- DROP POLICY IF EXISTS "insert_own_workout_comments" ON workout_comments;
-- CREATE POLICY "insert_own_workout_comments" ON workout_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- DROP POLICY IF EXISTS "insert_own_workout_likes" ON workout_likes;
-- CREATE POLICY "insert_own_workout_likes" ON workout_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- =========================================================
