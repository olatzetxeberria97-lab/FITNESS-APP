import type { Goal } from './types';

export interface NutritionResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goalLabel: string;
  advice: string;
}

export interface MealSuggestion {
  name: string;
  emoji: string;
  description: string;
  calories: number;
  mealTime: "breakfast" | "mid-morning" | "lunch" | "afternoon" | "dinner";
}

export function calculateNutrition(
  goal: Goal,
  weightKg: number | null,
  heightCm: number | null,
  age: number | null,
  sex: 'male' | 'female' | null,
): NutritionResult | null {
  if (!weightKg || !heightCm || !age || !sex) return null;

  const s = sex === 'male' ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + s;
  const tdee = bmr * 1.55;

  let targetCalories: number;
  let proteinPerKg: number;
  let fatPct: number;
  let goalLabel: string;
  let advice: string;

  if (goal === 'lose_weight') {
    targetCalories = tdee - 500;
    proteinPerKg = 2.0;
    fatPct = 0.25;
    goalLabel = 'Déficit calórico';
    advice =
      'Come en un déficit moderado de ~500 kcal para perder grasa conservando músculo. Prioriza proteína y verduras.';
  } else if (goal === 'gain_muscle') {
    targetCalories = tdee + 300;
    proteinPerKg = 2.2;
    fatPct = 0.25;
    goalLabel = 'Superávit calórico';
    advice =
      'Come en un superávit ligero de ~300 kcal para construir músculo sin ganar grasa de más. Proteína alta en cada comida.';
  } else if (goal === 'define') {
    targetCalories = tdee - 300;
    proteinPerKg = 2.4;
    fatPct = 0.25;
    goalLabel = 'Déficit moderado + proteína alta';
    advice =
      'Déficit ligero con proteína muy alta para marcar músculo mientras reduces grasa. Combina entrenamiento de fuerza y cardio.';
  } else if (goal === 'gain_strength') {
    targetCalories = tdee + 200;
    proteinPerKg = 2.0;
    fatPct = 0.3;
    goalLabel = 'Superávit ligero';
    advice =
      'Come en un superávit ligero y prioriza proteína y carbohidratos para ganar fuerza. Descansa bien entre sesiones.';
  } else {
    targetCalories = tdee;
    proteinPerKg = 1.6;
    fatPct = 0.3;
    goalLabel = 'Mantenimiento';
    advice =
      'Mantén un balance calórico equilibrado. Come variado, prioriza alimentos frescos y mantente activo.';
  }

  targetCalories = Math.round(targetCalories);
  const proteinG = Math.round((proteinPerKg * weightKg));
  const fatG = Math.round((targetCalories * fatPct) / 9);
  const carbsG = Math.round((targetCalories - proteinG * 4 - fatG * 9) / 4);

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), targetCalories, proteinG, carbsG, fatG, goalLabel, advice };
}

const mealsByGoal: Record<Goal, MealSuggestion[]> = {
  lose_weight: [
    { name: 'Desayuno proteico', emoji: '🥚', description: '3 huevos revueltos + espinacas + 1 rebanada de pan integral', calories: 320 , mealTime: "breakfast" },
    { name: 'Almuerzo ligero', emoji: '🥗', description: 'Pechuga de pollo a la plancha + ensalada mixta + vinagreta', calories: 450 , mealTime: "lunch" },
    { name: 'Snack sano', emoji: '🥜', description: 'Puñado de almendras (20 g) + 1 manzana', calories: 180 , mealTime: "mid-morning" },
    { name: 'Cena saludable', emoji: '🐟', description: 'Salmón al horno + brócoli + quinoa (50 g)', calories: 400 , mealTime: "dinner" },
    { name: 'Batido verde', emoji: '🥬', description: 'Espinacas + plátano + proteína + leche de almendra', calories: 220 , mealTime: "mid-morning" },
    { name: 'Yogur con frutos', emoji: '🫐', description: 'Yogur griego 0% + arándanos + semillas de chía', calories: 200 , mealTime: "afternoon" },
    { name: 'Tostada de aguacate', emoji: '🥑', description: 'Tostada integral + aguacate + huevo pochado + tomate', calories: 350 , mealTime: "breakfast" },
    { name: 'Ensalada de atún', emoji: '🥗', description: 'Atún + lechuga + tomate + huevo + aceitunas', calories: 380 , mealTime: "lunch" },
  ],
  gain_muscle: [
    { name: 'Desayuno de volumen', emoji: '🥣', description: 'Avena (80 g) + plátano + mantequilla de cacahuete + leche entera', calories: 650 , mealTime: "breakfast" },
    { name: 'Almuerzo alto en proteína', emoji: '🍗', description: 'Pollo (200 g) + arroz (150 g) + aguacate + verduras', calories: 750 , mealTime: "lunch" },
    { name: 'Snack post-entreno', emoji: '🥤', description: 'Batido: proteína + avena + plátano + leche', calories: 450 , mealTime: "mid-morning" },
    { name: 'Cena de recuperación', emoji: '🥩', description: 'Ternera magra (200 g) + patata + brócoli + aceite de oliva', calories: 700 , mealTime: "dinner" },
    { name: 'Puñado energético', emoji: '🥜', description: '30 g de nueces + 1 plátano + 2 tortitas de arroz', calories: 350 , mealTime: "mid-morning" },
    { name: 'Yogur proteico', emoji: '🥛', description: 'Yogur griego + muesli + miel + frutos secos', calories: 400 , mealTime: "afternoon" },
    { name: 'Tortitas de avena', emoji: '🥞', description: 'Avena + plátano + huevo + miel + frutos rojos', calories: 500 , mealTime: "breakfast" },
    { name: 'Pasta con pollo', emoji: '🍝', description: 'Pasta integral + pollo + tomate + parmesano', calories: 680 , mealTime: "lunch" },
  ],
  define: [
    { name: 'Desayuno definición', emoji: '🥚', description: '4 claras + 1 huevo entero + espinacas + 1 rebanada integral', calories: 350 , mealTime: "breakfast" },
    { name: 'Almuerzo magro', emoji: '🥗', description: 'Pollo a la plancha (180 g) + ensalada + vinagreta + 50 g arroz', calories: 500 , mealTime: "lunch" },
    { name: 'Snack proteico', emoji: '🥤', description: 'Batido de proteína + 1/2 plátano + canela', calories: 200 , mealTime: "mid-morning" },
    { name: 'Cena ligera', emoji: '🐟', description: 'Merluza al horno + brócoli + 30 g quinoa', calories: 400 , mealTime: "dinner" },
    { name: 'Yogur fit', emoji: '🫐', description: 'Yogur griego 0% + arándanos + edulcorante', calories: 150 , mealTime: "mid-morning" },
    { name: 'Rollito de pavo', emoji: '🥬', description: 'Lonchas de pavo + queso fresco + lechuga', calories: 180 , mealTime: "afternoon" },
    { name: 'Ensalada de salmón', emoji: '🥗', description: 'Salmón + espinacas + pepino + tomate + vinagreta ligera', calories: 350 , mealTime: "breakfast" },
    { name: 'Huevos revueltos', emoji: '🍳', description: '2 huevos + espinacas + 1 rebanada integral', calories: 300 , mealTime: "lunch" },
  ],
  gain_strength: [
    { name: 'Desayuno fuerza', emoji: '🥣', description: 'Avena (70 g) + 3 huevos + plátano + miel', calories: 600 , mealTime: "breakfast" },
    { name: 'Almuerzo potente', emoji: '🍗', description: 'Ternera (200 g) + arroz (150 g) + verduras + aceite', calories: 800 , mealTime: "lunch" },
    { name: 'Snack post-entreno', emoji: '🥤', description: 'Batido: proteína + avena + leche + mantequilla cacahuete', calories: 500 , mealTime: "mid-morning" },
    { name: 'Cena de fuerza', emoji: '🥩', description: 'Pollo (200 g) + patata + aguacate + brócoli', calories: 700 , mealTime: "dinner" },
    { name: 'Puñado energético', emoji: '🥜', description: '30 g nueces + 1 plátano + 2 tortitas de arroz', calories: 350 , mealTime: "mid-morning" },
    { name: 'Yogur proteico', emoji: '🥛', description: 'Yogur griego + muesli + miel + frutos secos', calories: 400 , mealTime: "afternoon" },
    { name: 'Sándwich de atún', emoji: '🥪', description: 'Pan integral + atún + aguacate + tomate + lechuga', calories: 550 , mealTime: "breakfast" },
    { name: 'Arroz con pollo', emoji: '🍚', description: 'Arroz + pollo + verduras + aceite de oliva', calories: 650 , mealTime: "lunch" },
  ],
  general_health: [
    { name: 'Desayuno equilibrado', emoji: '🥑', description: 'Tostada integral + aguacate + huevo + tomate', calories: 400 , mealTime: "breakfast" },
    { name: 'Almuerzo variado', emoji: '🍲', description: 'Lentejas + verduras + aceite de oliva + fruta', calories: 500 , mealTime: "lunch" },
    { name: 'Snack de fruta', emoji: '🍎', description: '1 pieza de fruta + puñado de frutos secos', calories: 250 , mealTime: "mid-morning" },
    { name: 'Cena ligera', emoji: '🐟', description: 'Pescado blanco + ensalada + 1 patata pequeña', calories: 450 , mealTime: "dinner" },
    { name: 'Batido de frutas', emoji: '🍓', description: 'Fresa + plátano + naranja + semillas', calories: 220 , mealTime: "mid-morning" },
    { name: 'Hummus con verduras', emoji: '🥕', description: 'Hummus casero + zanahoria + pepino + apio', calories: 200 , mealTime: "afternoon" },
    { name: 'Yogur con fruta', emoji: '🫐', description: 'Yogur natural + frutos rojos + miel + nueces', calories: 280 , mealTime: "breakfast" },
    { name: 'Sopa de verduras', emoji: '🥣', description: 'Sopa de calabaza + lentejas + pan integral', calories: 350 , mealTime: "lunch" },
  ],
};

const MEAL_TIME_ORDER: Record<string, number> = { breakfast: 0, "mid-morning": 1, lunch: 2, afternoon: 3, dinner: 4 };

export function getMealSuggestions(goal: Goal, dayOfWeek?: number): MealSuggestion[] {
  const allMeals = mealsByGoal[goal];
  const dow = dayOfWeek ?? new Date().getDay();
  const shift = dow % allMeals.length;
  const rotated = [...allMeals.slice(shift), ...allMeals.slice(0, shift)];
  return rotated.sort((a, b) => MEAL_TIME_ORDER[a.mealTime] - MEAL_TIME_ORDER[b.mealTime]);
}

const SPORT_NUTRITION_TIPS: Record<string, { sportKey: string; emoji: string; tip: string }> = {
  running: { sportKey: 'running', emoji: '🏃', tip: 'Prioriza carbohidratos antes de correr (avena, plátano, pan integral) para tener energía. Tras correr, recupera con proteína y carbs en 30-60 min. Hidrátate con electrolitos si superas 60 min.' },
  trail_running: { sportKey: 'trail_running', emoji: '🏔️', tip: 'Necesitas más calorías por el desnivel. Lleva geles o fruta en salidas largas. Recupera con proteína y carbs complejos tras la ruta. Hidratación con sales minerales es clave.' },
  cycling: { sportKey: 'cycling', emoji: '🚴', tip: 'Carga carbohidratos antes de salidas largas (pasta, arroz, avena). Durante la ruta, hidrátate cada 15-20 min. Tras rodar, recupera con batido proteico y carbs para reponer glucógeno.' },
  mountain_bike: { sportKey: 'mountain_bike', emoji: '⛰️', tip: 'Mayor gasto calórico por el terreno técnico. Lleva barritas energéticas y frutos secos. Recupera con proteína y antioxidantes (frutos rojos, verduras) para reducir inflamación.' },
  indoor_cycling: { sportKey: 'indoor_cycling', emoji: '🚲', tip: 'Hidrátate constantemente por el calor indoor. Tras la sesión, recupera con proteína y carbs. Prioriza alimentos antiinflamatorios como pescado azul y verduras.' },
  strength: { sportKey: 'strength', emoji: '🏋️', tip: 'Proteína en cada comida (1.8-2.2 g/kg) para maximizar la hipertrofia. Come carbs 1-2 h antes de entrenar para tener energía. Tras el entreno, batido proteico o pollo + arroz en 30 min.' },
  combined: { sportKey: 'combined', emoji: '🔥', tip: 'Combina proteína y carbs en cada comida. Antes de entrenar, prioriza carbs de absorción lenta. Tras la sesión, recupera con proteína y fruta para reponer glucógeno.' },
  walking: { sportKey: 'walking', emoji: '🚶', tip: 'Come ligero antes de caminar: fruta, yogur o un puñado de frutos secos. Hidrátate antes y después. Mantén una dieta equilibrada con proteína y verduras.' },
  hiking: { sportKey: 'hiking', emoji: '🥾', tip: 'Lleva snacks energéticos (frutos secos, barritas, fruta) para rutas largas. Come cada 60-90 min para mantener energía. Hidrátate constantemente, sobre todo en calor o altitud.' },
  treadmill: { sportKey: 'treadmill', emoji: '🏃', tip: 'Hidrátate bien por el ambiente indoor. Come algo ligero 1 h antes (plátano, tostada). Tras correr, recupera con proteína y carbs en 30 min.' },
  elliptical: { sportKey: 'elliptical', emoji: '🤸', tip: 'Hidrátate durante la sesión. Come carbs ligeros antes (fruta, yogur). Tras entrenar, recupera con proteína y verduras.' },
  rowing: { sportKey: 'rowing', emoji: '🚣', tip: 'El remo usa el 85% de los músculos: necesitas proteína alta (2 g/kg). Come carbs antes de remar para tener energía. Tras la sesión, recupera con proteína y carbs en 30 min.' },
  yoga: { sportKey: 'yoga', emoji: '🧘', tip: 'Come ligero 2 h antes de practicar (fruta, yogur, infusiones). Hidrátate antes y después. Prioriza alimentos antiinflamatorios (jengibre, cúrcuma, omega-3) para flexibilidad.' },
  pilates: { sportKey: 'pilates', emoji: '🤸', tip: 'Proteína moderada para recuperación muscular. Come ligero 2 h antes (fruta, yogur). Tras la sesión, recupera con proteína y verduras. Hidrátate bien.' },
  barre: { sportKey: 'barre', emoji: '💃', tip: 'Prioriza proteína para tonificación (1.6-1.8 g/kg). Come carbs ligeros antes (fruta, tostada). Tras la sesión, recupera con yogur y frutos rojos.' },
  stretching: { sportKey: 'stretching', emoji: '🦵', tip: 'Hidrátate antes y después de estirar. Come alimentos antiinflamatorios (pescado azul, frutos rojos, verduras). Magnesio (nueces, espinacas) ayuda a la relajación muscular.' },
  padel: { sportKey: 'padel', emoji: '🎾', tip: 'Come carbs 1-2 h antes de jugar (pasta, arroz, pan). Hidrátate cada cambio de lado. Tras jugar, recupera con proteína y carbs. Evita comidas pesadas antes de jugar.' },
  crossfit: { sportKey: 'crossfit', emoji: '🤼', tip: 'Alto gasto calórico: come proteína alta (2 g/kg) y carbs antes del WOD. Tras el entreno, recupera con batido proteico y plátano en 30 min. Hidrátate con electrolitos.' },
  hyrox: { sportKey: 'hyrox', emoji: '🏃', tip: 'Necesitas carbs antes de competir (pasta, arroz, avena). Lleva geles o barritas para la carrera. Tras el evento, recupera con proteína, carbs y mucha hidratación.' },
  swimming: { sportKey: 'swimming', emoji: '🏊', tip: 'Nadar da mucha hambre: come proteína y carbs en cada comida. Hidrátate aunque no sientas sed (el agua engaña). Tras nadar, recupera con pescado, arroz y verduras.' },
  football: { sportKey: 'football', emoji: '⚽', tip: 'Come carbs 2-3 h antes del partido (pasta, arroz). Hidrátate cada 15-20 min de juego. Tras el partido, recupera con proteína y carbs para reponer glucógeno.' },
  basketball: { sportKey: 'basketball', emoji: '🏀', tip: 'Come carbs ligeros 1-2 h antes de jugar (fruta, tostada, yogur). Hidrátate cada tiempo muerto. Tras jugar, recupera con proteína y plátano.' },
  recovery: { sportKey: 'recovery', emoji: '🧘', tip: 'Prioriza alimentos antiinflamatorios (omega-3, cúrcuma, jengibre, frutos rojos). Proteína moderada para recuperación. Hidrátate y duerme 7-8 h.' },
  rest: { sportKey: 'rest', emoji: '😴', tip: 'Día de descanso: mantén hidratación, come proteína y verduras. Prioriza sueño de calidad y alimentos nutritivos para recuperación.' },
};

export function getSportNutritionTip(sportKey: string): { sportKey: string; emoji: string; tip: string } | null {
  return SPORT_NUTRITION_TIPS[sportKey] || null;
}
