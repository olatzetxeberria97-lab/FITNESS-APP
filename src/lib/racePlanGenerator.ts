import type { PlanDay, PlanBlock } from './types';

export type RaceGoal = '10k' | '15k' | '20k' | 'half_marathon' | 'marathon';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function blk(name: string, detail: string, target: string): PlanBlock {
  return { name, detail, target, blockType: 'main', completed: false };
}

function warmup(min: number): PlanBlock {
  return { name: 'Calentamiento', detail: `${min} min de trote suave + movilidad de tobillos y caderas`, target: `${min} min`, blockType: 'warmup', completed: false };
}

function cooldown(min: number): PlanBlock {
  return { name: 'Enfriamiento', detail: `${min} min de trote muy suave + estiramientos de gemelos e isquiotibiales`, target: `${min} min`, blockType: 'cooldown', completed: false };
}

interface DayTemplate {
  type: 'training' | 'recovery' | 'rest';
  title: string;
  description: string;
  blocks: PlanBlock[];
}

function continuousRun(min: number, desc?: string): DayTemplate {
  return {
    type: 'training',
    title: 'Carrera continua',
    description: desc || `${min} min a ritmo conversacional, Zona 2.`,
    blocks: [warmup(5), blk('Bloque principal', `${min} min a ritmo conversacional, mantén respiración nasal o charla`, `${min} min`), cooldown(5)],
  };
}

function intervalSession(reps: number, dist: string, restDesc: string): DayTemplate {
  return {
    type: 'training',
    title: 'Series',
    description: `${reps} × ${dist} a ritmo rápido con ${restDesc}.`,
    blocks: [warmup(15), blk('Series', `${reps} × ${dist} a ritmo 5K-10K con ${restDesc} entre series`, `${reps} × ${dist}`), cooldown(10)],
  };
}

function tempoRun(warmMin: number, tempoMin: number, coolMin: number): DayTemplate {
  return {
    type: 'training',
    title: 'Tempo run',
    description: `${warmMin} calentamiento + ${tempoMin} a ritmo umbral + ${coolMin} enfriamiento.`,
    blocks: [warmup(warmMin), blk('Tempo', `${tempoMin} min a ritmo umbral (apenas puedes decir frases cortas)`, `${tempoMin} min @ umbral`), cooldown(coolMin)],
  };
}

function longRun(min: number): DayTemplate {
  return {
    type: 'training',
    title: 'Tirada larga',
    description: `${min} min a ritmo cómodo, construye resistencia aeróbica.`,
    blocks: [warmup(5), blk('Bloque principal', `${min} min a ritmo conversacional, sin parar. Hidrátate cada 20 min`, `${min} min @ Zona 2`), cooldown(8)],
  };
}

function fartlek(min: number): DayTemplate {
  return {
    type: 'training',
    title: 'Fartlek',
    description: `${min} min alternando ritmos: 2 min rápidos / 2 min suaves.`,
    blocks: [warmup(10), blk('Fartlek', `${Math.floor(min / 4)} × (2 min rápido + 2 min suave)`, `${min} min`), cooldown(10)],
  };
}

function recoveryDay(): DayTemplate {
  return {
    type: 'recovery',
    title: 'Recuperación activa',
    description: '20-30 min de movilidad, estiramientos y foam roller.',
    blocks: [
      blk('Movilidad', '10 min de rotaciones articulares suaves', '10 min'),
      blk('Estiramientos', '10 min de estiramientos de cadena posterior y cadera', '10 min'),
      blk('Foam roller', '10 min de foam roller en piernas y espalda', '10 min'),
    ],
  };
}

function restDay(): DayTemplate {
  return {
    type: 'rest',
    title: 'Día de descanso',
    description: 'Descanso total. Hidrátate y duerme bien.',
    blocks: [blk('Descanso', 'Descanso total del cuerpo. Hidrátate (2-3 L de agua) y duerme 7-8 h', 'Todo el día')],
  };
}

function progressiveRun(min: number): DayTemplate {
  const seg = Math.floor(min / 3);
  return {
    type: 'training',
    title: 'Carrera progresiva',
    description: `${min} min aumentando el ritmo cada ${seg} min.`,
    blocks: [
      warmup(seg),
      blk('Progresión 1', `${seg} min a ritmo suave-moderado (Zona 2)`, `${seg} min`),
      blk('Progresión 2', `${seg} min a ritmo moderado-firme (Zona 3)`, `${seg} min`),
      blk('Progresión 3', `${seg} min a ritmo firme-rápido (Zona 4)`, `${seg} min`),
    ],
  };
}

function hillReps(reps: number): DayTemplate {
  return {
    type: 'training',
    title: 'Cuestas',
    description: `${reps} cuestas de 100 m en subida, bajada suave.`,
    blocks: [warmup(15), blk('Cuestas', `${reps} × 100 m en subida al 85%, bajada caminando`, `${reps} × 100 m`), cooldown(10)],
  };
}

function longRunWithProgression(min: number): DayTemplate {
  const base = Math.floor(min * 0.7);
  const fast = min - base;
  return {
    type: 'training',
    title: 'Tirada larga con progresión',
    description: `${base} min suaves + ${fast} min a ritmo maratón.`,
    blocks: [
      warmup(5),
      blk('Bloque aeróbico', `${base} min a ritmo conversacional (Zona 2)`, `${base} min`),
      blk('Progresión final', `${fast} min a ritmo objetivo de carrera`, `${fast} min`),
      cooldown(5),
    ],
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

interface WeekTemplate {
  label: string;
  days: DayTemplate[];
}

function buildWeek(types: readonly ('training' | 'recovery' | 'rest')[], templates: DayTemplate[]): DayTemplate[] {
  const result: DayTemplate[] = [];
  let ti = 0;
  for (const type of types) {
    if (type === 'training') {
      result.push(templates[ti % templates.length]);
      ti++;
    } else if (type === 'recovery') {
      result.push(recoveryDay());
    } else {
      result.push(restDay());
    }
  }
  return result;
}

const STANDARD_WEEK = ['training', 'training', 'rest', 'training', 'training', 'rest', 'training'] as const;
const LONG_RUN_WEEK = ['training', 'rest', 'training', 'training', 'rest', 'training', 'training'] as const;
const HIGH_VOLUME_WEEK = ['training', 'training', 'rest', 'training', 'training', 'rest', 'training'] as const;
const TAPER_WEEK = ['training', 'rest', 'training', 'rest', 'training', 'rest', 'training'] as const;

function generateRacePlan(raceGoal: RaceGoal, weekStartDate: Date): PlanDay[] {
  const monday = getMondayOfWeek(weekStartDate);
  const weekNumber = Math.floor(monday.getTime() / (1000 * 60 * 60 * 24 * 7));

  const weeks = buildRaceWeeks(raceGoal);
  const weekIndex = (weekNumber + Math.floor(weekNumber / 7)) % weeks.length;
  const week = weeks[weekIndex];

  return week.days.map((tpl, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = formatDate(date);
    const dayName = DAY_NAMES[i];

    return {
      day: dayName,
      date: dateStr,
      sport: tpl.type === 'training' ? 'running' : tpl.type === 'recovery' ? 'recovery' : 'rest',
      type: tpl.type,
      title: tpl.title,
      description: tpl.description,
      emoji: tpl.type === 'rest' ? '😴' : tpl.type === 'recovery' ? '🧘' : '🏃',
      completed: false,
      blocks: tpl.blocks.map(b => ({ ...b })),
      sessionGoal: tpl.description,
      tips: RUNNING_TIPS,
    };
  });
}

const RUNNING_TIPS = [
  'Calienta 5-10 min con trote suave antes de aumentar el ritmo',
  'Mantén una cadencia de 170-180 pasos por minuto para mayor eficiencia',
  'Aterriza con el metatarso, no con el talón, para reducir impacto articular',
  'Hidrátate cada 15-20 min si la sesión supera los 30 min',
  'Finaliza con 5 min de trote muy suave y estiramientos de gemelos e isquiotibiales',
];

function buildRaceWeeks(raceGoal: RaceGoal): WeekTemplate[] {
  switch (raceGoal) {
    case '10k':
      return build10KPlan();
    case '15k':
      return build15KPlan();
    case '20k':
      return build20KPlan();
    case 'half_marathon':
      return buildHalfMarathonPlan();
    case 'marathon':
      return buildMarathonPlan();
  }
}

function build10KPlan(): WeekTemplate[] {
  return [
    { label: 'Semana 1: Base aeróbica', days: buildWeek(STANDARD_WEEK, [continuousRun(30), intervalSession(6, '400 m', '90 s de descanso'), longRun(40)]) },
    { label: 'Semana 2: Introducción a series', days: buildWeek(STANDARD_WEEK, [continuousRun(35), intervalSession(8, '400 m', '90 s de descanso'), longRun(45)]) },
    { label: 'Semana 3: Tempo', days: buildWeek(STANDARD_WEEK, [continuousRun(35), tempoRun(10, 15, 10), longRun(50)]) },
    { label: 'Semana 4: Fartlek', days: buildWeek(STANDARD_WEEK, [fartlek(30), intervalSession(5, '800 m', '2 min de descanso'), longRun(55)]) },
    { label: 'Semana 5: Volumen', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(40), tempoRun(10, 20, 10), longRun(60)]) },
    { label: 'Semana 6: Series largas', days: buildWeek(STANDARD_WEEK, [progressiveRun(35), intervalSession(6, '1 km', '2 min de descanso'), longRun(65)]) },
    { label: 'Semana 7: Pico', days: buildWeek(STANDARD_WEEK, [fartlek(40), tempoRun(10, 20, 10), longRun(70)]) },
    { label: 'Semana 8: Taper + carrera', days: buildWeek(TAPER_WEEK, [continuousRun(30), intervalSession(4, '400 m', '90 s de descanso'), longRun(30)]) },
  ];
}

function build15KPlan(): WeekTemplate[] {
  return [
    { label: 'Semana 1: Base', days: buildWeek(STANDARD_WEEK, [continuousRun(35), intervalSession(6, '400 m', '90 s de descanso'), longRun(50)]) },
    { label: 'Semana 2: Tempo', days: buildWeek(STANDARD_WEEK, [continuousRun(40), tempoRun(10, 15, 10), longRun(55)]) },
    { label: 'Semana 3: Fartlek', days: buildWeek(STANDARD_WEEK, [fartlek(35), intervalSession(8, '400 m', '90 s de descanso'), longRun(60)]) },
    { label: 'Semana 4: Series 800', days: buildWeek(STANDARD_WEEK, [continuousRun(40), intervalSession(5, '800 m', '2 min de descanso'), longRun(65)]) },
    { label: 'Semana 5: Tempo largo', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(40), tempoRun(10, 20, 10), longRun(70)]) },
    { label: 'Semana 6: Cuestas', days: buildWeek(STANDARD_WEEK, [fartlek(40), hillReps(8), longRun(75)]) },
    { label: 'Semana 7: Volumen', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(45), intervalSession(6, '1 km', '2 min de descanso'), longRun(80)]) },
    { label: 'Semana 8: Pico', days: buildWeek(STANDARD_WEEK, [tempoRun(10, 25, 10), intervalSession(5, '800 m', '2 min de descanso'), longRun(85)]) },
    { label: 'Semana 9: Taper', days: buildWeek(STANDARD_WEEK, [continuousRun(35), fartlek(30), longRun(60)]) },
    { label: 'Semana 10: Taper + carrera', days: buildWeek(TAPER_WEEK, [continuousRun(30), intervalSession(4, '400 m', '90 s de descanso'), longRun(35)]) },
  ];
}

function build20KPlan(): WeekTemplate[] {
  return [
    { label: 'Semana 1: Base', days: buildWeek(STANDARD_WEEK, [continuousRun(40), intervalSession(6, '400 m', '90 s de descanso'), longRun(60)]) },
    { label: 'Semana 2: Tempo', days: buildWeek(STANDARD_WEEK, [continuousRun(45), tempoRun(10, 20, 10), longRun(70)]) },
    { label: 'Semana 3: Fartlek', days: buildWeek(STANDARD_WEEK, [fartlek(40), intervalSession(6, '800 m', '2 min de descanso'), longRun(75)]) },
    { label: 'Semana 4: Series 1K', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(40), intervalSession(5, '1 km', '2 min de descanso'), longRun(80)]) },
    { label: 'Semana 5: Tempo largo', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(45), tempoRun(15, 20, 10), longRun(85)]) },
    { label: 'Semana 6: Cuestas', days: buildWeek(STANDARD_WEEK, [fartlek(45), hillReps(10), longRun(90)]) },
    { label: 'Semana 7: Volumen alto', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(50), intervalSession(6, '1 km', '2 min de descanso'), longRun(95)]) },
    { label: 'Semana 8: Pico', days: buildWeek(STANDARD_WEEK, [tempoRun(10, 25, 10), intervalSession(5, '1 km', '2 min de descanso'), longRun(100)]) },
    { label: 'Semana 9: Descarga', days: buildWeek(STANDARD_WEEK, [continuousRun(40), fartlek(35), longRun(75)]) },
    { label: 'Semana 10: Volumen final', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(45), tempoRun(10, 20, 10), longRun(105)]) },
    { label: 'Semana 11: Taper', days: buildWeek(STANDARD_WEEK, [continuousRun(35), intervalSession(4, '800 m', '2 min de descanso'), longRun(60)]) },
    { label: 'Semana 12: Taper + carrera', days: buildWeek(TAPER_WEEK, [continuousRun(30), intervalSession(4, '400 m', '90 s de descanso'), longRun(40)]) },
  ];
}

function buildHalfMarathonPlan(): WeekTemplate[] {
  return [
    { label: 'Semana 1: Base', days: buildWeek(STANDARD_WEEK, [continuousRun(40), intervalSession(6, '400 m', '90 s de descanso'), longRun(70)]) },
    { label: 'Semana 2: Tempo', days: buildWeek(STANDARD_WEEK, [continuousRun(45), tempoRun(10, 20, 10), longRun(80)]) },
    { label: 'Semana 3: Fartlek', days: buildWeek(STANDARD_WEEK, [fartlek(40), intervalSession(6, '800 m', '2 min de descanso'), longRun(85)]) },
    { label: 'Semana 4: Series 1K', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(45), intervalSession(5, '1 km', '2 min de descanso'), longRun(90)]) },
    { label: 'Semana 5: Tempo largo', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(45), tempoRun(15, 25, 10), longRun(95)]) },
    { label: 'Semana 6: Cuestas', days: buildWeek(STANDARD_WEEK, [fartlek(45), hillReps(10), longRun(100)]) },
    { label: 'Semana 7: Volumen', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(50), intervalSession(6, '1 km', '2 min de descanso'), longRun(110)]) },
    { label: 'Semana 8: Pico', days: buildWeek(STANDARD_WEEK, [tempoRun(10, 25, 10), intervalSession(5, '1 km', '2 min de descanso'), longRun(120)]) },
    { label: 'Semana 9: Descarga', days: buildWeek(STANDARD_WEEK, [continuousRun(40), fartlek(35), longRun(80)]) },
    { label: 'Semana 10: Volumen final', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(45), tempoRun(10, 25, 10), longRun(125)]) },
    { label: 'Semana 11: Taper 1', days: buildWeek(STANDARD_WEEK, [continuousRun(35), intervalSession(4, '800 m', '2 min de descanso'), longRun(70)]) },
    { label: 'Semana 12: Taper 2', days: buildWeek(STANDARD_WEEK, [continuousRun(30), fartlek(25), longRun(50)]) },
    { label: 'Semana 13: Taper 3', days: buildWeek(TAPER_WEEK, [continuousRun(25), intervalSession(4, '400 m', '90 s de descanso'), longRun(40)]) },
    { label: 'Semana 14: Carrera', days: buildWeek(TAPER_WEEK, [continuousRun(20), restDay(), longRun(21)]) },
  ];
}

function buildMarathonPlan(): WeekTemplate[] {
  return [
    { label: 'Semana 1: Base', days: buildWeek(LONG_RUN_WEEK, [continuousRun(45), intervalSession(6, '400 m', '90 s de descanso'), longRun(90)]) },
    { label: 'Semana 2: Tempo', days: buildWeek(LONG_RUN_WEEK, [continuousRun(50), tempoRun(10, 20, 10), longRun(100)]) },
    { label: 'Semana 3: Fartlek', days: buildWeek(LONG_RUN_WEEK, [fartlek(45), intervalSession(6, '800 m', '2 min de descanso'), longRun(110)]) },
    { label: 'Semana 4: Series 1K', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(50), intervalSession(5, '1 km', '2 min de descanso'), longRun(120)]) },
    { label: 'Semana 5: Tempo largo', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(50), tempoRun(15, 25, 10), longRun(130)]) },
    { label: 'Semana 6: Cuestas', days: buildWeek(LONG_RUN_WEEK, [fartlek(45), hillReps(10), longRun(140)]) },
    { label: 'Semana 7: Volumen', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(55), intervalSession(6, '1 km', '2 min de descanso'), longRun(150)]) },
    { label: 'Semana 8: Pico 1', days: buildWeek(HIGH_VOLUME_WEEK, [tempoRun(10, 30, 10), intervalSession(5, '1 km', '2 min de descanso'), longRun(160)]) },
    { label: 'Semana 9: Pico 2', days: buildWeek(HIGH_VOLUME_WEEK, [progressiveRun(50), tempoRun(15, 25, 10), longRun(170)]) },
    { label: 'Semana 10: Descarga', days: buildWeek(LONG_RUN_WEEK, [continuousRun(45), fartlek(40), longRun(120)]) },
    { label: 'Semana 11: Volumen', days: buildWeek(HIGH_VOLUME_WEEK, [continuousRun(55), intervalSession(6, '1 km', '2 min de descanso'), longRun(175)]) },
    { label: 'Semana 12: Pico 3', days: buildWeek(HIGH_VOLUME_WEEK, [tempoRun(10, 30, 10), intervalSession(5, '1 km', '2 min de descanso'), longRun(180)]) },
    { label: 'Semana 13: Progresión', days: buildWeek(LONG_RUN_WEEK, [progressiveRun(55), longRunWithProgression(150), longRun(160)]) },
    { label: 'Semana 14: Descarga', days: buildWeek(LONG_RUN_WEEK, [continuousRun(45), fartlek(35), longRun(130)]) },
    { label: 'Semana 15: Taper 1', days: buildWeek(STANDARD_WEEK, [continuousRun(40), intervalSession(4, '800 m', '2 min de descanso'), longRun(100)]) },
    { label: 'Semana 16: Taper 2', days: buildWeek(STANDARD_WEEK, [continuousRun(35), tempoRun(10, 15, 10), longRun(70)]) },
    { label: 'Semana 17: Taper 3', days: buildWeek(TAPER_WEEK, [continuousRun(25), fartlek(20), longRun(50)]) },
    { label: 'Semana 18: Carrera', days: buildWeek(TAPER_WEEK, [continuousRun(20), restDay(), longRun(42)]) },
  ];
}

export function isRaceGoal(goal: string | null | undefined): goal is RaceGoal {
  return goal === '10k' || goal === '15k' || goal === '20k' || goal === 'half_marathon' || goal === 'marathon';
}

export { generateRacePlan };
