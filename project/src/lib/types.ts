export type Goal = 'lose_weight' | 'gain_muscle' | 'general_health' | 'define' | 'gain_strength';

export type SportKey =
  | 'running'
  | 'walking'
  | 'strength'
  | 'cycling'
  | 'combined'
  | 'football'
  | 'basketball'
  | string;

export interface Sport {
  key: SportKey;
  label: string;
  emoji: string;
}

export const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  lose_weight: 'Reducir grasa y mejorar composición corporal',
  gain_muscle: 'Ganar masa muscular y volumen',
  general_health: 'Mantenerse activo y sentirse bien',
  define: 'Marcar músculo y reducir grasa corporal',
  gain_strength: 'Aumentar la fuerza y potencia muscular',
};

export const GOAL_ORDER: Goal[] = ['gain_muscle', 'define', 'lose_weight', 'gain_strength', 'general_health'];

export const DEFAULT_SPORTS: Sport[] = [
  // Outdoor / Endurance (GPS)
  { key: 'running', label: 'Carrera / Running', emoji: '🏃' },
  { key: 'trail_running', label: 'Trail Running', emoji: '🏔️' },
  { key: 'hiking', label: 'Caminata / Senderismo', emoji: '🥾' },
  { key: 'cycling', label: 'Ciclismo de carretera', emoji: '🚴' },
  { key: 'mountain_bike', label: 'Mountain Bike (BTT)', emoji: '🚵' },
  // Indoor / Gym
  { key: 'indoor_cycling', label: 'Bici estática / Spinning', emoji: '🚴' },
  { key: 'treadmill', label: 'Cinta de correr', emoji: '🏃' },
  { key: 'elliptical', label: 'Elíptica', emoji: '🤸' },
  { key: 'rowing', label: 'Remo indoor', emoji: '🚣' },
  // Strength
  { key: 'strength', label: 'Fuerza / Musculación (Gym)', emoji: '💪' },
  // High-intensity / Competition
  { key: 'crossfit', label: 'CrossFit', emoji: '🤸‍♂️' },
  { key: 'hyrox', label: 'HYROX', emoji: '🏃‍♂️' },
  // Body-mind / Wellness
  { key: 'yoga', label: 'Yoga', emoji: '🧘' },
  { key: 'pilates', label: 'Pilates', emoji: '🧘' },
  { key: 'barre', label: 'Barre', emoji: '🩰' },
  { key: 'stretching', label: 'Estiramientos / Movilidad', emoji: '🤸' },
  // Racquet / Other
  { key: 'padel', label: 'Pádel', emoji: '🎾' },
  // Legacy / Team sports
  { key: 'swimming', label: 'Natación', emoji: '🏊' },
  { key: 'walking', label: 'Andar', emoji: '🚶' },
  { key: 'combined', label: 'Entrenamientos combinados', emoji: '🔥' },
  { key: 'football', label: 'Fútbol', emoji: '⚽' },
  { key: 'basketball', label: 'Baloncesto', emoji: '🏀' },
];

export const SPORT_CATEGORIES = [
  { title: 'Al aire libre / Resistencia (GPS)', sports: ['running', 'trail_running', 'hiking', 'cycling', 'mountain_bike'] },
  { title: 'Indoor / Gimnasio', sports: ['indoor_cycling', 'treadmill', 'elliptical', 'rowing'] },
  { title: 'Fuerza', sports: ['strength'] },
  { title: 'Alta intensidad / Competición', sports: ['crossfit', 'hyrox'] },
  { title: 'Cuerpo-mente y Bienestar', sports: ['yoga', 'pilates', 'barre', 'stretching'] },
  { title: 'Raqueta / Otros', sports: ['padel'] },
  { title: 'Otros deportes', sports: ['swimming', 'walking', 'combined', 'football', 'basketball'] },
];

export const OUTDOOR_SPORTS = ['running', 'trail_running', 'hiking', 'cycling', 'mountain_bike', 'walking'];
export const INDOOR_SPORTS = ['indoor_cycling', 'treadmill', 'elliptical', 'rowing', 'strength', 'yoga', 'pilates', 'barre', 'stretching', 'crossfit', 'hyrox'];
export const TIME_ONLY_SPORTS = ['yoga', 'pilates', 'barre', 'stretching', 'padel', 'swimming', 'football', 'basketball', 'elliptical', 'rowing', 'combined', 'crossfit', 'hyrox'];
export const STRENGTH_SPORTS = ['strength', 'crossfit', 'hyrox'];

export const STRENGTH_EQUIPMENT = [
  { key: 'dumbbells', label: 'Mancuernas' },
  { key: 'barbell', label: 'Barra y discos' },
  { key: 'kettlebell', label: 'Pesa rusa (Kettlebell)' },
  { key: 'resistance_bands', label: 'Bandas elásticas' },
  { key: 'pull_up_bar', label: 'Barra de dominadas' },
  { key: 'bench', label: 'Banco' },
  { key: 'mat', label: 'Esterilla' },
  { key: 'none', label: 'Solo peso corporal' },
];

export interface Profile {
  id: string;
  display_name: string;
  goal: Goal;
  sports: string[];
  current_weight_kg: number | null;
  target_weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  birth_date: string | null;
  sex: 'male' | 'female' | null;
  onboarding_complete: boolean;
  avatar_color: string;
  avatar_url: string | null;
  equipment: string[] | null;
  created_at: string;
  updated_at: string;
  running_level: 'beginner' | 'intermediate' | 'advanced' | null;
  running_weekly_km: number | null;
  strength_location: 'gym' | 'home' | null;
  strength_equipment: string[];
  sleep_quality: 'good' | 'fair' | 'poor' | null;
  energy_level: 'high' | 'medium' | 'low' | null;
  physical_state: 'great' | 'ok' | 'sore' | 'pain' | null;
  subscription_tier: 'free_trial' | 'beta' | 'standard' | 'premium_monthly' | 'premium_yearly' | null;
  trial_started_at: string | null;
  premium_expires_at: string | null;
  premium_product_id: string | null;
  is_premium: boolean;
  legal_accepted: boolean;
  race_goal: '5k' | '10k' | '15k' | 'half_marathon' | null;
  notifications_enabled: boolean;
  notify_friends_activity: boolean;
  notify_challenges: boolean;
  notify_achievements: boolean;
  health_connected: boolean;
  health_provider: string | null;
}

export type BlockType = 'warmup' | 'main' | 'cooldown' | 'info';

export interface PlanBlock {
  name: string;
  detail: string;
  target: string;
  blockType: BlockType;
  completed: boolean;
}

export interface PlanDay {
  day: string;
  date: string;
  sport: string;
  type: 'training' | 'recovery' | 'rest';
  title: string;
  description: string;
  emoji: string;
  completed: boolean;
  blocks: PlanBlock[];
  sessionGoal?: string;
  tips?: string[];
}

export interface WeeklyPlan {
  id: string;
  user_id: string;
  week_start: string;
  plan_data: PlanDay[];
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  sport: string;
  type: 'gps' | 'manual';
  date: string;
  duration_sec: number | null;
  distance_km: number | null;
  route_geojson: GeoJSON.LineString | null;
  notes: string | null;
  is_shared: boolean;
  created_at: string;
  custom_name: string | null;
  photo_url: string | null;
  blocks_total: number;
  blocks_completed: number;
  elevation_gain_m: number | null;
  avg_speed_kmh: number | null;
  calories_est: number | null;
  steps_est: number | null;
  is_soft_rest: boolean;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_at: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  challenge_type: 'weekly_streak' | 'distance' | 'minutes' | 'flash';
  target_value: number;
  sport: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface ChallengeParticipant {
  id: string;
  challenge_id: string;
  user_id: string;
  progress_value: number;
  joined_at: string;
}

export interface WorkoutLike {
  id: string;
  workout_id: string;
  user_id: string;
  created_at: string;
}

export interface WorkoutComment {
  id: string;
  workout_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: 'Perder peso',
  gain_muscle: 'Musculación',
  general_health: 'Hacer deporte por salud',
  define: 'Definir',
  gain_strength: 'Ganar fuerza',
};

export const GOAL_EMOJIS: Record<Goal, string> = {
  lose_weight: '🔥',
  gain_muscle: '💪',
  general_health: '❤️',
  define: '🎯',
  gain_strength: '🏋️',
};

export const SPORT_EMOJIS: Record<string, string> = {
  running: '🏃',
  trail_running: '🏔️',
  hiking: '🥾',
  cycling: '🚴',
  mountain_bike: '🚵',
  indoor_cycling: '🚴',
  treadmill: '🏃',
  elliptical: '🤸',
  rowing: '🚣',
  strength: '💪',
  crossfit: '🤸‍♂️',
  hyrox: '🏃‍♂️',
  yoga: '🧘',
  pilates: '🧘',
  barre: '🩰',
  stretching: '🤸',
  padel: '🎾',
  walking: '🚶',
  combined: '🔥',
  football: '⚽',
  basketball: '🏀',
  swimming: '🏊',
  recovery: '🧘',
  rest: '😴',
};

export const DAY_EMOJIS: Record<string, string> = {
  running: '🏃',
  trail_running: '🏔️',
  hiking: '🥾',
  cycling: '🚴',
  mountain_bike: '🚵',
  indoor_cycling: '🚴',
  treadmill: '🏃',
  elliptical: '🤸',
  rowing: '🚣',
  strength: '💪',
  crossfit: '🤸‍♂️',
  hyrox: '🏃‍♂️',
  yoga: '🧘',
  pilates: '🧘',
  barre: '🩰',
  stretching: '🤸',
  padel: '🎾',
  walking: '🚶',
  combined: '🔥',
  football: '⚽',
  basketball: '🏀',
  swimming: '🏊',
  recovery: '🧘',
  rest: '😴',
  hydration: '💧',
};

export const ACHIEVEMENT_DEFINITIONS: { key: string; label: string; emoji: string; description: string; world: string }[] = [
  { key: 'first_workout', label: 'Primer Paso', emoji: '🌱', description: 'Completa tu primer entrenamiento', world: 'Mundo 1: Inicios' },
  { key: '5_workouts', label: 'En Marcha', emoji: '⚡', description: 'Completa 5 entrenamientos', world: 'Mundo 1: Inicios' },
  { key: '10_workouts', label: 'Constante', emoji: '🔥', description: 'Completa 10 entrenamientos', world: 'Mundo 2: Constancia' },
  { key: '25_workouts', label: 'Imparable', emoji: '💎', description: 'Completa 25 entrenamientos', world: 'Mundo 2: Constancia' },
  { key: '50_workouts', label: 'Leyenda', emoji: '👑', description: 'Completa 50 entrenamientos', world: 'Mundo 3: Leyenda' },
  { key: '100_minutes', label: 'Centenario', emoji: '💯', description: 'Acumula 100 minutos en una semana', world: 'Mundo 2: Constancia' },
  { key: '200_minutes', label: 'Sobrehumano', emoji: '🚀', description: 'Acumula 200 minutos en una semana', world: 'Mundo 3: Leyenda' },
  { key: '300_minutes', label: 'Élite OMS', emoji: '🏆', description: 'Alcanza los 300 minutos semanales recomendados', world: 'Mundo 3: Leyenda' },
  { key: 'first_gps', label: 'Explorador', emoji: '🗺️', description: 'Graba tu primera ruta con GPS', world: 'Mundo 1: Inicios' },
  { key: '10km_total', label: 'Maratoniano', emoji: '🏁', description: 'Recorre 10 km en total', world: 'Mundo 2: Constancia' },
  { key: '50km_total', label: 'Trail Blazer', emoji: '🛤️', description: 'Recorre 50 km en total', world: 'Mundo 3: Leyenda' },
  { key: '7_day_streak', label: 'Racha de Fuego', emoji: '🔥', description: 'Entrena 7 días seguidos', world: 'Mundo 2: Constancia' },
  { key: 'first_friend', label: 'Social', emoji: '🤝', description: 'Agrega a tu primer amigo', world: 'Mundo 1: Inicios' },
  { key: 'first_challenge', label: 'Competidor', emoji: '⚔️', description: 'Únete a tu primer reto', world: 'Mundo 2: Constancia' },
];

export interface EndlessAchievementTier {
  key: string;
  label: string;
  emoji: string;
  threshold: number;
  description: string;
}

export const ENDLESS_ACHIEVEMENTS: { category: string; categoryEmoji: string; tiers: EndlessAchievementTier[] }[] = [
  {
    category: 'Entrenamientos totales',
    categoryEmoji: '🏋️',
    tiers: [
      { key: 'workouts_50', label: '50 entrenamientos', emoji: '🥉', threshold: 50, description: 'Completa 50 entrenamientos' },
      { key: 'workouts_100', label: '100 entrenamientos', emoji: '🥈', threshold: 100, description: 'Completa 100 entrenamientos' },
      { key: 'workouts_250', label: '250 entrenamientos', emoji: '🥇', threshold: 250, description: 'Completa 250 entrenamientos' },
      { key: 'workouts_500', label: '500 entrenamientos', emoji: '💎', threshold: 500, description: 'Completa 500 entrenamientos' },
      { key: 'workouts_1000', label: '1000 entrenamientos', emoji: '👑', threshold: 1000, description: 'Completa 1000 entrenamientos' },
      { key: 'workouts_2000', label: '2000 entrenamientos', emoji: '🌟', threshold: 2000, description: 'Completa 2000 entrenamientos' },
      { key: 'workouts_5000', label: '5000 entrenamientos', emoji: '🏆', threshold: 5000, description: 'Completa 5000 entrenamientos' },
      { key: 'workouts_10000', label: '10000 entrenamientos', emoji: '🏅', threshold: 10000, description: 'Completa 10000 entrenamientos' },
    ],
  },
  {
    category: 'Semanas consecutivas activo',
    categoryEmoji: '📅',
    tiers: [
      { key: 'streak_2', label: '2 semanas activo', emoji: '🔥', threshold: 2, description: 'Entrena al menos 1 vez por semana durante 2 semanas seguidas' },
      { key: 'streak_4', label: '4 semanas activo', emoji: '⚡', threshold: 4, description: '4 semanas seguidas activo' },
      { key: 'streak_8', label: '8 semanas activo', emoji: '💎', threshold: 8, description: '8 semanas seguidas activo' },
      { key: 'streak_12', label: '12 semanas activo', emoji: '👑', threshold: 12, description: '3 meses de constancia' },
      { key: 'streak_26', label: '26 semanas activo', emoji: '🌟', threshold: 26, description: 'Medio año de constancia' },
      { key: 'streak_52', label: '52 semanas activo', emoji: '🏆', threshold: 52, description: 'Un año completo activo' },
      { key: 'streak_104', label: '104 semanas activo', emoji: '🏅', threshold: 104, description: '2 años de constancia' },
      { key: 'streak_208', label: '208 semanas activo', emoji: '💫', threshold: 208, description: '4 años de constancia imparable' },
    ],
  },
  {
    category: 'Kilómetros totales',
    categoryEmoji: '📏',
    tiers: [
      { key: 'km_100', label: '100 km', emoji: '🥉', threshold: 100, description: 'Recorre 100 km en total' },
      { key: 'km_250', label: '250 km', emoji: '🥈', threshold: 250, description: 'Recorre 250 km en total' },
      { key: 'km_500', label: '500 km', emoji: '🥇', threshold: 500, description: 'Recorre 500 km en total' },
      { key: 'km_1000', label: '1000 km', emoji: '💎', threshold: 1000, description: 'Recorre 1000 km en total' },
      { key: 'km_2500', label: '2500 km', emoji: '👑', threshold: 2500, description: 'Recorre 2500 km en total' },
      { key: 'km_5000', label: '5000 km', emoji: '🌟', threshold: 5000, description: 'Recorre 5000 km en total' },
      { key: 'km_10000', label: '10000 km', emoji: '🏆', threshold: 10000, description: 'Recorre 10000 km en total' },
      { key: 'km_25000', label: '25000 km', emoji: '🏅', threshold: 25000, description: 'Recorre 25000 km en total' },
    ],
  },
  {
    category: 'Minutos totales',
    categoryEmoji: '⏱️',
    tiers: [
      { key: 'min_500', label: '500 min totales', emoji: '🥉', threshold: 500, description: 'Acumula 500 minutos de ejercicio' },
      { key: 'min_1000', label: '1000 min totales', emoji: '🥈', threshold: 1000, description: 'Acumula 1000 minutos de ejercicio' },
      { key: 'min_2500', label: '2500 min totales', emoji: '🥇', threshold: 2500, description: 'Acumula 2500 minutos de ejercicio' },
      { key: 'min_5000', label: '5000 min totales', emoji: '💎', threshold: 5000, description: 'Acumula 5000 minutos de ejercicio' },
      { key: 'min_10000', label: '10000 min totales', emoji: '👑', threshold: 10000, description: 'Acumula 10000 minutos de ejercicio' },
      { key: 'min_25000', label: '25000 min totales', emoji: '🌟', threshold: 25000, description: 'Acumula 25000 minutos de ejercicio' },
      { key: 'min_50000', label: '50000 min totales', emoji: '🏆', threshold: 50000, description: 'Acumula 50000 minutos de ejercicio' },
      { key: 'min_100000', label: '100000 min totales', emoji: '🏅', threshold: 100000, description: 'Acumula 100000 minutos de ejercicio' },
    ],
  },
];

export const RACE_GOALS = [
  { key: '5k', label: '5K', desc: '3 semanas a carrera continua' },
  { key: '10k', label: '10K', desc: '6 semanas con series' },
  { key: '15k', label: '15K', desc: '8 semanas con tempo runs' },
  { key: 'half_marathon', label: 'Media Maratón', desc: '12 semanas con tiradas largas' },
] as const;

export const SUBSCRIPTION_INFO = {
  free_trial: { label: '2 meses gratis', durationDays: 60, price: null },
  beta: { label: 'Beta (3,99 €/mes)', durationDays: 30, price: '3,99 €' },
  standard: { label: 'Plan deportivo + alimenticio (4,99 €/mes)', durationDays: 60, price: '4,99 €' },
  premium_monthly: { label: 'Premium Mensual', durationDays: 30, price: '4,99 €' },
  premium_yearly: { label: 'Premium Anual', durationDays: 365, price: '49,99 €' },
} as const;

export type SubscriptionTier = 'free_trial' | 'beta' | 'standard' | 'premium_monthly' | 'premium_yearly';

export const PREMIUM_TIERS: SubscriptionTier[] = ['premium_monthly', 'premium_yearly'];

export function isPremiumTier(tier: string | null | undefined): boolean {
  return tier === 'premium_monthly' || tier === 'premium_yearly';
}

export const PREMIUM_SPORTS = ['crossfit', 'hyrox', 'yoga', 'pilates', 'barre', 'stretching'];

export const PREMIUM_FEATURES = [
  { icon: '∞', title: 'Entrenamientos ilimitados', desc: 'Sin límite de sesiones diarias' },
  { icon: '📊', title: 'Analíticas avanzadas', desc: 'Gráficas de progreso, tendencias y comparativas' },
  { icon: '🤸‍♂️', title: 'Todos los deportes', desc: 'CrossFit, HYROX, Yoga, Pilates y más' },
  { icon: '🎯', title: 'Planes personalizados', desc: 'Entrenamientos adaptados a tu nivel y objetivos' },
  { icon: '🔊', title: 'Audio-guía de hitos', desc: 'Notificaciones por voz durante el ejercicio' },
  { icon: '⌚', title: 'Sincronización smartwatch', desc: 'Conecta Garmin, Apple Watch, Samsung y más' },
  { icon: '🏆', title: 'Retos con amigos', desc: 'Crea y únete a retos competitivos' },
  { icon: '📈', title: 'Logros infinitos', desc: 'Sistema de gamificación sin límites' },
];

export const PREMIUM_PLANS = [
  {
    id: 'premium_monthly',
    label: 'Plan deportivo + alimenticio',
    price: '4,99 €',
    period: '/mes',
    productId: 'prod_VJOiXk3OaDZ5Lh',
    badge: null,
    savings: null,
  },
  {
    id: 'premium_yearly',
    label: 'Plan anual',
    price: '49,99 €',
    period: '/año',
    productId: 'prod_VJOin3mJuRNUd6',
    badge: 'Ahorra 16%',
    savings: 'Equivalente a 4,16 €/mes',
  },
] as const;
