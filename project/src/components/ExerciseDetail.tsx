import { X, Lightbulb, Target, Clock, Flame, Heart, Zap, Shuffle, Loader2, Check, Flame as FlameIcon, Snowflake, Dumbbell } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { getSportLabel } from '@/lib/planGenerator';
import { SPORT_EMOJIS, type PlanBlock, type BlockType } from '@/lib/types';

export interface ExerciseDetailInfo {
  sport: string;
  title: string;
  description: string;
  tips: string[];
  recommendedDuration: string;
  intensity: 'Baja' | 'Media' | 'Alta';
  estimatedCalories: string;
}

const EXERCISE_DETAILS: Record<string, ExerciseDetailInfo> = {
  running: {
    sport: 'running',
    title: 'Correr',
    description: 'Intenta correr 5km manteniendo un ritmo constante y controlado. Concéntrate en mantener una respiración rítmica y una postura erguida durante todo el recorrido.',
    tips: [
      'Calienta 5-10 minutos con trote suave antes de aumentar el ritmo',
      'Mantén una cadencia de 170-180 pasos por minuto para mayor eficiencia',
      'Aterriza con el metatarso, no con el talón, para reducir impacto articular',
      'Hidrátate cada 15-20 minutos si la sesión supera los 30 minutos',
      'Finaliza con 5 minutos de trote muy suave y estiramientos de gemelos e isquiotibiales',
    ],
    recommendedDuration: '30-45 min',
    intensity: 'Alta',
    estimatedCalories: '300-450 kcal',
  },
  walking: {
    sport: 'walking',
    title: 'Andar',
    description: 'Realiza una caminata activa de 30-45 minutos a paso ligero. Es ideal para días de recuperación activa o para mantener la constancia sin sobrecargar las articulaciones.',
    tips: [
      'Mantén una postura erguida con la mirada al frente, no al suelo',
      'Brazos flexionados a 90 grados, balanceándolos de forma natural',
      'Pasa de caminar a un trote suave si te sientes con energía',
      'Aprovecha para escuchar un podcast o tu música favorita y disfrutar del entorno',
      'Usa calzado cómodo y transpirable para evitar ampollas',
    ],
    recommendedDuration: '30-45 min',
    intensity: 'Baja',
    estimatedCalories: '120-180 kcal',
  },
  cycling: {
    sport: 'cycling',
    title: 'Bicicleta',
    description: 'Salida en bicicleta de 45-60 minutos combinando llano y terreno variado. Trabaja la cadencia y mantén una velocidad constante en los tramos rectos.',
    tips: [
      'Ajusta la altura del sillín para que la pierna quede casi extendida en el punto más bajo del pedal',
      'Usa cambios cortos en subidas para proteger las rodillas y mantener cadencia',
      'Mantén los codos ligeramente flexionados para absorber baches y vibraciones',
      'Lleva siempre agua y un pequeño kit de reparación básica',
      'Respeta las normas de circulación y usa luces si hay poca visibilidad',
    ],
    recommendedDuration: '45-60 min',
    intensity: 'Media',
    estimatedCalories: '250-400 kcal',
  },
  swimming: {
    sport: 'swimming',
    title: 'Natación',
    description: 'Sesión de natación de 30-45 minutos combinando estilos. Empieza con estilo libre a ritmo suave y alterna brazadas largas con ejercicios de técnica.',
    tips: [
      'Calienta con 200 metros de estilo libre a ritmo muy suave',
      'Trabaja la posición hidrodinámica: cuerpo alineado y cabeza en línea con la columna',
      'Respira cada 3 brazadas para mantener un patrón bilateral equilibrado',
      'La patada debe ser continua y desde la cadera, no desde la rodilla',
      'Finaliza con 100 metros de espalda o braza para soltar la musculatura',
    ],
    recommendedDuration: '30-45 min',
    intensity: 'Media',
    estimatedCalories: '200-350 kcal',
  },
  strength: {
    sport: 'strength',
    title: 'Fuerza / Musculación',
    description: 'Sesión de fuerza de 40-50 minutos. Trabaja grupos musculares principales con 3-4 series por ejercicio y descansos de 60-90 segundos entre series.',
    tips: [
      'Prioriza la técnica sobre el peso: una ejecución limpia previene lesiones',
      'Calienta con movilidad articular y 2 series ligeras antes de cargar peso',
      'Controla la fase excéntrica (descenso) en 2-3 segundos para mayor hipertrofia',
      'Respira out en el esfuerzo y inhala en la fase de retorno',
      'Finaliza con core y compensación: plancha, bird-dog y estiramientos',
    ],
    recommendedDuration: '40-50 min',
    intensity: 'Alta',
    estimatedCalories: '180-300 kcal',
  },
  combined: {
    sport: 'combined',
    title: 'Entrenamiento combinado',
    description: 'Sesión mixta de 40-50 minutos que combina fuerza y cardio. Alterna bloques de ejercicios de musculación con intervalos cardiovasculares para máxima eficiencia.',
    tips: [
      'Empieza siempre por la parte de fuerza cuando estés fresco',
      'Usa circuitos de 4-5 ejercicios con 30 segundos de descanso entre ellos',
      'Mantén la intensidad del cardio moderada para no comprometer la fuerza',
      'Hidrátate entre bloques y controla la frecuencia cardiaca',
      'Incluye 10 minutos de vuelta a la calma con movilidad y respiración',
    ],
    recommendedDuration: '40-50 min',
    intensity: 'Alta',
    estimatedCalories: '250-400 kcal',
  },
  football: {
    sport: 'football',
    title: 'Fútbol',
    description: 'Partido o entrenamiento de fútbol de 60-90 minutos. Combina sprints, cambios de dirección y trabajo de técnica con balón.',
    tips: [
      'Calienta con movilidad de cadera y tobillos antes de empezar',
      'Usa botas adecuadas al terreno (césped, tierra o indoor) para evitar lesiones',
      'Hidrátate en cada pausa del partido, aunque no sientas sed',
      'Trabaja cambios de ritmo: alterna sprint con trote de recuperación',
      'Estira cuádriceps, isquiotibiales y aductores al finalizar',
    ],
    recommendedDuration: '60-90 min',
    intensity: 'Alta',
    estimatedCalories: '400-600 kcal',
  },
  basketball: {
    sport: 'basketball',
    title: 'Baloncesto',
    description: 'Partido o entrenamiento de baloncesto de 60 minutos. Incluye trabajo de técnica individual, tiros y juego en equipo.',
    tips: [
      'Calienta tobillos y rodillas con movilidad específica antes de saltar',
      'Practica el bote con ambas manos para mejorar tu ambidextría',
      'Trabaja la defensa en posición baja con pasos cortos y rápidos',
      'Hidrátate en cada tiempo muerto o descanso del entrenamiento',
      'Finaliza con tiros libres para afianzar la técnica bajo fatiga',
    ],
    recommendedDuration: '60 min',
    intensity: 'Alta',
    estimatedCalories: '350-500 kcal',
  },
  rest: {
    sport: 'rest',
    title: 'Descanso',
    description: 'Día de descanso activo. Tu cuerpo se recupera y se fortalece durante el descanso, no durante el entrenamiento. Aprovecha para caminar suave o hacer estiramientos.',
    tips: [
      'Camina 15-20 minutos a paso ligero para activar la circulación',
      'Realiza estiramientos suaves de todo el cuerpo (10-15 minutos)',
      'Hidrátate bien y prioriza dormir 7-8 horas esta noche',
      'Usa técnicas de respiración o meditación para reducir el estrés',
      'Escucha a tu cuerpo: si hay dolor, descansa completamente',
    ],
    recommendedDuration: '15-20 min activo',
    intensity: 'Baja',
    estimatedCalories: '50-80 kcal',
  },
  recovery: {
    sport: 'recovery',
    title: 'Recuperación',
    description: 'La recuperación es el proceso mediante el cual tu cuerpo repara y fortalece los músculos tras el esfuerzo. Sin recuperación no hay progreso: es durante el descanso cuando tu cuerpo se adapta al entrenamiento y mejora. Hay dos tipos:\n\n• Recuperación activa: movimiento suave y de baja intensidad (movilidad, estiramientos, yoga, caminar) que estimula la circulación y ayuda a eliminar toxinas sin sobrecargar el cuerpo.\n• Recuperación pasiva: descanso absoluto, sueño de calidad y nutrición adecuada. Permite que el sistema nervioso y los tejidos se reparen completamente.\n\nAmbas son igual de importantes: la activa mantiene el flujo sanguíneo y reduce la rigidez, mientras que la pasiva permite la regeneración profunda de los músculos.',
    tips: [
      'Movilidad articular: 10 min de rotaciones suaves de cadera, hombros, columna y tobillos',
      'Estiramientos mantenidos: 30 s por grupo muscular, sin rebotes, respirando profundo',
      'Foam roller: 5-10 min en gemelos, isquiotibiales y espalda para liberar tensión miofascial',
      'Yoga restaurador: posturas suaves mantenidas 1-2 min para relajar el sistema nervioso',
      'Hidratación y nutrición: bebe agua, consume proteína y duerme 7-8 h para una recuperación completa',
    ],
    recommendedDuration: '20-30 min',
    intensity: 'Baja',
    estimatedCalories: '80-120 kcal',
  },
  trail_running: {
    sport: 'trail_running',
    title: 'Trail Running',
    description: 'Carrera en montaña o senderos naturales. Combina resistencia, técnica y fuerza mental. El terreno irregular trabaja estabilizadores y propiocepción más que el asfalto.',
    tips: [
      'Calienta tobillos y rodillas con movilidad antes de empezar',
      'Camina las subidas muy pronunciadas para ahorrar energía',
      'Mantén zancada corta y frecuencia alta en descensos para proteger rodillas',
      'Lleva agua y algo de comida si la ruta supera 60 min',
      'Usa calzado con agarre específico para trail',
    ],
    recommendedDuration: '40-90 min',
    intensity: 'Alta',
    estimatedCalories: '350-600 kcal',
  },
  hiking: {
    sport: 'hiking',
    title: 'Caminata / Senderismo',
    description: 'Marcha por senderos naturales a ritmo cómodo. Excelente ejercicio cardiovascular de bajo impacto que fortalece piernas, glúteos y core mientras disfrutas de la naturaleza.',
    tips: [
      'Calienta 5 min con movilidad de tobillos y cadera',
      'Mantén un ritmo constante, no empieces demasiado rápido',
      'Usa bastones en rutas con mucho desnivel para proteger rodillas',
      'Hidrátate cada 20-30 min, especialmente en calor',
      'Lleva calzado de senderismo con buen agarre y protección',
    ],
    recommendedDuration: '60-180 min',
    intensity: 'Baja',
    estimatedCalories: '200-500 kcal',
  },
  mountain_bike: {
    sport: 'mountain_bike',
    title: 'Mountain Bike (BTT)',
    description: 'Ciclismo en senderos y montaña. Combina resistencia cardiovascular con técnica, equilibrio y agilidad. El terreno irregular exige mayor control del cuerpo y de la bici.',
    tips: [
      'Ajusta la presión de neumáticos al terreno: menos presión en senderos sueltos',
      'Baja el sillín ligeramente para descensos técnicos y mejora el centro de gravedad',
      'Mira siempre 5-10 m por delante, no a la rueda delantera',
      'Frena con ambos frenos de forma progresiva, nunca bruscamente',
      'Usa siempre casco y protecciones en manos y rodillas',
    ],
    recommendedDuration: '45-120 min',
    intensity: 'Alta',
    estimatedCalories: '300-600 kcal',
  },
  indoor_cycling: {
    sport: 'indoor_cycling',
    title: 'Bici estática / Spinning',
    description: 'Ciclismo indoor en bici estática. Permite controlar resistencia, cadencia e intensidad con precisión. Ideal para días de lluvia o entrenamientos estructurados.',
    tips: [
      'Ajusta la altura del sillín para que la pierna quede casi extendida en el punto más bajo',
      'Mantén cadencia 80-100 rpm en tramos de resistencia media',
      'Trabaja la respiración rítmica sincronizada con el pedaleo',
      'Hidrátate constantemente, el calor indoor deshidrata más rápido',
      'Enfría 5 min pedaleando sin resistencia antes de bajar',
    ],
    recommendedDuration: '30-75 min',
    intensity: 'Media',
    estimatedCalories: '250-500 kcal',
  },
  treadmill: {
    sport: 'treadmill',
    title: 'Cinta de correr',
    description: 'Carrera en cinta de correr. Permite controlar ritmo, inclinación y distancia con precisión. Ideal para entrenamientos estructurados o días de clima adverso.',
    tips: [
      'Calienta 5 min a ritmo suave antes de aumentar velocidad',
      'Usa inclinación 1-2% para simular resistencia al aire libre',
      'Mantén postura erguida, no te apoyes en la barra',
      'Hidrátate cada 15-20 min, el ambiente indoor deshidrata',
      'Enfría 5 min caminando suave antes de bajar',
    ],
    recommendedDuration: '30-60 min',
    intensity: 'Media',
    estimatedCalories: '250-450 kcal',
  },
  elliptical: {
    sport: 'elliptical',
    title: 'Elíptica',
    description: 'Ejercicio cardiovascular de bajo impacto en máquina elíptica. Combina trabajo de piernas y brazos sin sobrecargar articulaciones. Ideal para recuperación activa o días sin impacto.',
    tips: [
      'Mantén postura erguida, core activo, sin inclinarte hacia delante',
      'Empuja y tira de las manetas para trabajar tren superior',
      'Aumenta resistencia progresivamente para mayor intensidad',
      'Mantén cadencia constante de 120-160 pasos por minuto',
      'Enfría 5 min a resistencia mínima antes de terminar',
    ],
    recommendedDuration: '30-60 min',
    intensity: 'Media',
    estimatedCalories: '200-400 kcal',
  },
  rowing: {
    sport: 'rowing',
    title: 'Remo indoor',
    description: 'Ejercicio cardiovascular completo en máquina de remo. Trabaja el 85% de los músculos del cuerpo: piernas, core, espalda y brazos. Excelente para fuerza y resistencia combinadas.',
    tips: [
      'Secuencia: piernas, core, brazos en el empuje; al revés en la vuelta',
      'Mantén la espalda recta, no redondees los hombros',
      'Tira el mango hacia el ombligo, no hacia el pecho',
      'Mantén cadencia 20-30 remadas por minuto en ritmo constante',
      'Calienta 5 min a ritmo muy suave antes de aumentar intensidad',
    ],
    recommendedDuration: '20-45 min',
    intensity: 'Media',
    estimatedCalories: '250-450 kcal',
  },
  yoga: {
    sport: 'yoga',
    title: 'Yoga',
    description: 'Práctica de cuerpo-mente que combina posturas (asanas), respiración (pranayama) y meditación. Mejora flexibilidad, fuerza, equilibrio y reduce el estrés.',
    tips: [
      'Respira profundo y lento por la nariz durante toda la práctica',
      'No fuerces las posturas: ve hasta donde tu cuerpo permita sin dolor',
      'Mantén cada postura 30-60 s respirando de forma constante',
      'Usa bloques o cinturones para adaptar posturas a tu nivel',
      'Finaliza con Savasana (postura del cadáver) 5-10 min para integrar',
    ],
    recommendedDuration: '30-60 min',
    intensity: 'Baja',
    estimatedCalories: '120-250 kcal',
  },
  pilates: {
    sport: 'pilates',
    title: 'Pilates',
    description: 'Método de ejercicio que fortalece el core, mejora la alineación postural y la flexibilidad. Combina control, respiración y precisión en cada movimiento.',
    tips: [
      'Activa el core en cada ejercicio: ombligo hacia la columna',
      'Respira por las costillas, expandiendo la caja torácica',
      'Prioriza la calidad del movimiento sobre la cantidad',
      'Mantén la columna en posición neutra durante los ejercicios',
      'Trabaja con control total, sin inercia ni movimientos bruscos',
    ],
    recommendedDuration: '40-50 min',
    intensity: 'Baja',
    estimatedCalories: '150-250 kcal',
  },
  barre: {
    sport: 'barre',
    title: 'Barre',
    description: 'Entrenamiento que combina elementos de ballet, pilates y yoga. Trabaja piernas, glúteos, core y brazos con movimientos pequeños y precisos de alta repetición.',
    tips: [
      'Mantén postura erguida con la columna alargada en cada ejercicio',
      'Trabaja con pulsaciones pequeñas y controladas, sin rebotes',
      'Activa los glúteos en cada movimiento de pierna',
      'Respira de forma constante, no retengas el aire',
      'Usa calcetines con agarre o zapatillas de danza para mayor control',
    ],
    recommendedDuration: '45-50 min',
    intensity: 'Media',
    estimatedCalories: '200-350 kcal',
  },
  stretching: {
    sport: 'stretching',
    title: 'Estiramientos / Movilidad',
    description: 'Sesión enfocada en mejorar flexibilidad, movilidad articular y liberar tensión muscular. Fundamental para la recuperación, prevención de lesiones y bienestar general.',
    tips: [
      'Nunca estires con rebotes: mantén cada posición 30-60 s de forma estática',
      'Respira profundo y lento, exhala al profundizar el estiramiento',
      'No llegues al dolor: estira hasta sentir tensión moderada, no aguda',
      'Estira todos los grupos musculares principales en cada sesión',
      'Usa foam roller antes de estirar para liberar tensión miofascial',
    ],
    recommendedDuration: '25-40 min',
    intensity: 'Baja',
    estimatedCalories: '80-150 kcal',
  },
  padel: {
    sport: 'padel',
    title: 'Pádel',
    description: 'Deporte de raqueta que se juega en parejas en una pista cerrada. Combina sprints cortos, cambios de dirección, coordinación y técnica con la pala. Muy social y accesible.',
    tips: [
      'Calienta tobillos, rodillas y cadera con movilidad antes de jugar',
      'Mantén la pala por delante del cuerpo en posición de espera',
      'Golpea la bola de bote con la pala por debajo de la cintura',
      'Trabaja el juego de pared: deja que la bola rebote antes de golpear',
      'Hidrátate en cada cambio de lado, aunque sea corto',
    ],
    recommendedDuration: '60-90 min',
    intensity: 'Media',
    estimatedCalories: '300-500 kcal',
  },
};

export function getExerciseDetail(sport: string): ExerciseDetailInfo {
  return EXERCISE_DETAILS[sport] || {
    sport,
    title: getSportLabel(sport),
    description: 'Entrenamiento personalizado. Ajusta la intensidad según tu nivel y objetivo.',
    tips: [
      'Calienta siempre antes de empezar la sesión principal',
      'Mantén una buena hidratación durante todo el entrenamiento',
      'Escucha a tu cuerpo y ajusta la intensidad si es necesario',
      'Finaliza con estiramientos y vuelta a la calma',
    ],
    recommendedDuration: '30-60 min',
    intensity: 'Media',
    estimatedCalories: '150-300 kcal',
  };
}

interface ExerciseDetailProps {
  sport: string;
  dayLabel?: string;
  blocks?: PlanBlock[];
  sessionGoal?: string;
  tips?: string[];
  onClose: () => void;
  onChangeExercise?: () => void;
}

export default function ExerciseDetail({ sport, dayLabel, blocks, sessionGoal, tips, onClose, onChangeExercise }: ExerciseDetailProps) {
  const info = getExerciseDetail(sport);
  const { t } = useI18n();
  const [changing, setChanging] = useState(false);
  const [changed, setChanged] = useState(false);
  const [blockStates, setBlockStates] = useState<boolean[]>(blocks ? blocks.map(b => b.completed) : []);

  const displayGoal = sessionGoal || info.description;
  const displayTips = tips && tips.length > 0 ? tips : info.tips;

  const blockTypeMeta: Record<BlockType, { label: string; icon: typeof Flame; color: string; bg: string }> = {
    warmup: { label: 'Calentamiento', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    main: { label: 'Bloque principal', icon: Dumbbell, color: 'text-[var(--neon-green)]', bg: 'bg-[var(--neon-green)]/10 border-[var(--neon-green)]/20' },
    cooldown: { label: 'Vuelta a la calma', icon: Snowflake, color: 'text-[var(--neon-cyan)]', bg: 'bg-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]/20' },
    info: { label: 'Info', icon: Lightbulb, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-darkest)] border-[var(--border-subtle)]' },
  };

  function toggleBlock(idx: number) {
    setBlockStates((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  }

  const completedBlocks = blockStates.filter(Boolean).length;
  const totalBlocks = blockStates.length;
  const blockPct = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
  const intensityColor = info.intensity === 'Alta' ? 'text-red-400 bg-red-500/10' : info.intensity === 'Media' ? 'text-orange-400 bg-orange-500/10' : 'text-[var(--neon-green)] bg-[var(--neon-green)]/10';

  async function handleChangeExercise() {
    if (!onChangeExercise) return;
    setChanging(true);
    await new Promise((r) => setTimeout(r, 600));
    setChanging(false);
    setChanged(true);
    setTimeout(() => {
      onChangeExercise();
    }, 800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="glass-card rounded-t-3xl md:rounded-3xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-neon flex items-center justify-center text-2xl">
              {SPORT_EMOJIS[sport] || '🏅'}
            </div>
            <div>
              <h2 className="text-xl font-black font-display">{info.title}</h2>
              {dayLabel && <p className="text-xs text-[var(--text-muted)]">{dayLabel}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="glass-card rounded-xl p-3 text-center">
            <Clock className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
            <p className="text-xs font-bold">{info.recommendedDuration}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('ex.duration')}</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Flame className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
            <p className="text-xs font-bold">{info.estimatedCalories}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('ex.calories')}</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <Zap className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
            <p className={`text-xs font-bold ${intensityColor.split(' ')[0]}`}>{info.intensity}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('ex.intensity')}</p>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[var(--neon-green)]" />
            <h3 className="font-bold text-sm">{t('ex.sessionGoal')}</h3>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{displayGoal}</p>
        </div>

        {/* Interactive workout blocks */}
        {blocks && blocks.length > 0 && (
          <div className="glass-card rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--neon-green)]" />
                <h3 className="font-bold text-sm">Plan de entrenamiento</h3>
              </div>
              <span className="text-xs font-bold text-[var(--neon-green)]">{completedBlocks}/{totalBlocks}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[var(--bg-darkest)] overflow-hidden mb-3">
              <div className="h-full gradient-neon rounded-full transition-all duration-500" style={{ width: `${blockPct}%` }} />
            </div>
            <div className="space-y-2">
              {(() => {
                const blockTypes: BlockType[] = ['warmup', 'main', 'cooldown', 'info'];
                let globalIdx = 0;
                return blockTypes.map(bt => {
                  const typeBlocks = blocks.map((b, i) => ({ b, i })).filter(({ b }) => (b.blockType || 'main') === bt);
                  if (typeBlocks.length === 0) return null;
                  const meta = blockTypeMeta[bt];
                  const Icon = meta.icon;
                  const headerBlock = typeBlocks.find(({ b }) => b.target === bt);
                  const exerciseBlocks = typeBlocks.filter(({ b }) => b.target !== bt);
                  return (
                    <div key={bt}>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${meta.bg} border mb-1.5`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                        <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                        {headerBlock && (
                          <span className="ml-auto text-[10px] font-semibold text-[var(--text-muted)]">{headerBlock.b.detail}</span>
                        )}
                      </div>
                      {exerciseBlocks.map(({ b, i }) => {
                        const idx = globalIdx++;
                        return (
                          <button
                            key={i}
                            onClick={() => toggleBlock(i)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all mb-1.5 ${blockStates[i] ? 'bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30' : 'bg-[var(--bg-darkest)] border border-[var(--border-subtle)] hover:border-[var(--neon-green)]/30'}`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${blockStates[i] ? 'bg-[var(--neon-green)]' : 'border-2 border-[var(--border-subtle)]'}`}>
                              {blockStates[i] ? <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} /> : <span className="text-[10px] font-bold text-[var(--text-muted)]">{idx + 1}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm leading-tight ${blockStates[i] ? 'text-[var(--neon-green)]' : ''}`}>{b.name}</p>
                              <p className="text-xs text-[var(--text-secondary)] leading-snug mt-0.5">{b.detail}</p>
                              {b.target !== bt && (
                                <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-[var(--neon-green)]/10 text-[var(--neon-green)] text-[10px] font-semibold">
                                  <Clock className="w-2.5 h-2.5" />
                                  {b.target}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-[var(--neon-green)]" />
            <h3 className="font-bold text-sm">{t('ex.tips')}</h3>
          </div>
          <div className="space-y-2.5">
            {displayTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[var(--neon-green)]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold text-[var(--neon-green)]">{i + 1}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change exercise option (inside detail) */}
        {onChangeExercise && !changed && (
          <button
            onClick={handleChangeExercise}
            disabled={changing}
            className="w-full mt-3 py-3 rounded-2xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50"
          >
            {changing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
            {changing ? t('ex.changing') : t('ex.notFeeling') + ' ' + t('ex.changeExercise')}
          </button>
        )}
        {changed && (
          <div className="w-full mt-3 py-3 rounded-2xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] flex items-center justify-center gap-2 text-sm font-semibold animate-scale-in">
            <Check className="w-4 h-4" /> {t('ex.changed')}
          </div>
        )}

        {/* CTA */}
        <button onClick={onClose} className="w-full mt-4 gradient-neon text-black font-bold py-3.5 rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2">
          <Heart className="w-5 h-5" /> {t('ex.understood')}
        </button>
      </div>
    </div>
  );
}
