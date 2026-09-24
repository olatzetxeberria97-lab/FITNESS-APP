import type { Goal, PlanBlock, PlanDay, BlockType } from './types';

export interface DetailedWorkout {
  sessionGoal: string;
  blocks: PlanBlock[];
  tips: string[];
}

interface ExerciseSpec {
  name: string;
  detail: string;
  target: string;
  duration: string;
}

interface WorkoutBlock {
  blockType: BlockType;
  title: string;
  duration: string;
  exercises: ExerciseSpec[];
}

interface SportWorkoutTemplate {
  sessionGoal: string;
  blocks: WorkoutBlock[];
  tips: string[];
}

function mkBlock(
  blockType: BlockType,
  title: string,
  duration: string,
  exercises: ExerciseSpec[],
): WorkoutBlock {
  return { blockType, title, duration, exercises };
}

function exercisesToBlocks(blocks: WorkoutBlock[]): PlanBlock[] {
  const result: PlanBlock[] = [];
  for (const block of blocks) {
    result.push({
      name: block.title,
      detail: block.duration,
      target: block.blockType,
      blockType: block.blockType,
      completed: false,
    });
    for (const ex of block.exercises) {
      result.push({
        name: ex.name,
        detail: ex.detail,
        target: ex.target,
        blockType: block.blockType,
        completed: false,
      });
    }
  }
  return result;
}

const TEMPLATES: Record<string, SportWorkoutTemplate[]> = {
  running: [
    {
      sessionGoal: 'Mejorar la resistencia cardiovascular manteniendo un ritmo constante y controlado, con técnica eficiente y prevención de lesiones.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '10 min', [
          { name: 'Trote suave', detail: '5 min a ritmo conversacional (RPE 3/10) para activar el sistema cardiovascular', target: '5 min', duration: '5 min' },
          { name: 'Movilidad articular', detail: 'Rotaciones de tobillos, cadera, hombros y rodillas — 10 rep por articulación, movimiento fluido sin rebotes', target: '2 min', duration: '2 min' },
          { name: 'Series de técnica', detail: '4 x 20 m de skipping, talones al glúteo y zancada larga para activar cadena posterior', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Rodaje base', '20 min', [
          { name: 'Carrera continua', detail: '15 min a ritmo cómodo (RPE 4-5/10), respiración rítmica 3:3 (3 pasos inhala, 3 pasos exhala)', target: '15 min', duration: '15 min' },
          { name: 'Técnica de carrera', detail: '5 min enfocando cadencia 170-180 ppm, aterrizaje con metatarso y postura erguida', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Series de ritmo', '12 min', [
          { name: 'Serie 1', detail: '3 min a ritmo moderado (RPE 6/10) + 1 min trote recuperación', target: '4 min', duration: '4 min' },
          { name: 'Serie 2', detail: '3 min a ritmo moderado (RPE 6/10) + 1 min trote recuperación', target: '4 min', duration: '4 min' },
          { name: 'Serie 3', detail: '3 min a ritmo moderado (RPE 6/10) + 1 min trote recuperación', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote muy suave', detail: '3 min de trote a paso mínimo para reducir frecuencia cardiaca progresivamente', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en pared, talón en el suelo, sin rebotes', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera desde la cintura', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, agarra el tobillo y acerca el talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cadera', detail: '30 s por lado, postura de paloma baja para abrir rotadores de cadera', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala para activar sistema parasimpático', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Mantén una cadencia de 170-180 pasos por minuto para mayor eficiencia y menor impacto articular',
        'Aterriza con el metatarso, no con el talón, para reducir el impacto en rodillas y cadera',
        'Hidrátate cada 15-20 min si la sesión supera los 30 min, incluso sin sensación de sed',
        'Controla la respiración: ritmo 3:3 (inhala 3 pasos, exhala 3 pasos) en zona cómoda',
        'Finaliza siempre con estiramientos de gemelos, isquiotibiales y cuádriceps para prevenir lesiones',
      ],
    },
  ],
  strength: [
    {
      sessionGoal: 'Estimular la hipertrofia y fuerza de los grupos musculares principales con técnica limpia, control de la fase excéntrica y progresión de carga.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '10 min', [
          { name: 'Movilidad articular', detail: 'Rotaciones de hombros, cadera, tobillos y muñecas — 10 rep por articulación, movimiento controlado', target: '3 min', duration: '3 min' },
          { name: 'Series ligeras', detail: '2 x 10 sentadillas sin peso + 2 x 10 flexiones de rodilla para activar tren inferior y core', target: '4 min', duration: '4 min' },
          { name: 'Activación de core', detail: '2 x 30 s de plancha frontal + 2 x 20 s de bird-dog por lado para estabilizar columna', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Tren inferior (Sentadilla)', '18 min', [
          { name: 'Sentadilla con barra', detail: '4 series x 8 rep, descanso 90 s entre series. Controla el descenso en 3 s, sube en 1 s. RPE 7-8/10', target: '4 x 8 rep · 90 s descanso', duration: '12 min' },
          { name: 'Peso muerto rumano', detail: '3 series x 10 rep, descanso 75 s. Espalda recta, empuja cadera atrás, estira isquios al bajar', target: '3 x 10 rep · 75 s descanso', duration: '6 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Tren superior (Press)', '15 min', [
          { name: 'Press de banca', detail: '4 series x 8 rep, descanso 90 s. Escápulas retraídas, pies firmes en el suelo, controla el descenso', target: '4 x 8 rep · 90 s descanso', duration: '10 min' },
          { name: 'Remo con mancuerna', detail: '3 series x 10 rep por lado, descanso 60 s. Espalda recta, tira el codo hacia la cadera', target: '3 x 10 rep · 60 s descanso', duration: '5 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '7 min', [
          { name: 'Plancha frontal', detail: '2 x 45 s con 30 s de descanso para estabilizar core tras el esfuerzo', target: '2 x 45 s', duration: '2 min' },
          { name: 'Estiramiento pecho', detail: '30 s por lado en marco de puerta, brazo a 90°, rota torso hacia el lado contrario', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento dorsal', detail: '30 s en postura del niño (child pose), brazos extendidos al frente, glúteos sobre talones', target: '30 s', duration: '30 s' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, agarra el tobillo y acerca el talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, una pierna extendida, flexión desde la cintura', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración diafragmática: 4 s inhala, 6 s exhala para recuperar', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Prioriza la técnica sobre el peso: una ejecución limpia previene lesiones y maximiza la activación muscular',
        'Controla la fase excéntrica (descenso) en 2-3 segundos para mayor hipertrofia y control neuromuscular',
        'Respira: exhala en el esfuerzo (fase concéntrica) e inhala en la fase de retorno (excéntrica)',
        'Descansa lo necesario entre series: 60-90 s para hipertrofia, 2-3 min para fuerza máxima',
        'Finaliza con core y compensación: plancha, bird-dog y estiramientos para equilibrar la musculatura',
      ],
    },
  ],
  cycling: [
    {
      sessionGoal: 'Desarrollar resistencia cardiovascular en bicicleta con técnica de pedaleo eficiente, control de cadencia y gestión de la intensidad en llano y terreno variado.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '10 min', [
          { name: 'Rodaje suave', detail: '5 min en llano a cadencia 80-90 rpm, resistencia baja, postura erguida para activar circulación', target: '5 min', duration: '5 min' },
          { name: 'Movilidad sobre la bici', detail: '2 min: alterna pedalear de pie y sentado, 30 s por posición para activar diferentes grupos', target: '2 min', duration: '2 min' },
          { name: 'Series de cadencia', detail: '3 x 30 s a cadencia alta (100-110 rpm) + 30 s recuperación a 80 rpm', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Trabajo de cadencia', '20 min', [
          { name: 'Tramo de resistencia media', detail: '10 min a cadencia 85-95 rpm, resistencia moderada (RPE 5/10), respiración rítmica', target: '10 min', duration: '10 min' },
          { name: 'Tramo de fuerza sentado', detail: '5 min a cadencia 70-75 rpm, resistencia alta (RPE 7/10), empuja los pedales con control', target: '5 min', duration: '5 min' },
          { name: 'Recuperación activa', detail: '5 min a cadencia 90 rpm, resistencia baja para bajar frecuencia cardiaca', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Simulacro de subidas', '12 min', [
          { name: 'Subida 1', detail: '3 min de pie a cadencia 70 rpm, resistencia alta, core activo, peso distribuido', target: '3 min', duration: '3 min' },
          { name: 'Recuperación', detail: '1 min sentado a cadencia 90 rpm, resistencia baja', target: '1 min', duration: '1 min' },
          { name: 'Subida 2', detail: '3 min sentado a cadencia 75 rpm, resistencia alta, glúteos activos', target: '3 min', duration: '3 min' },
          { name: 'Recuperación', detail: '1 min a cadencia 90 rpm, resistencia baja', target: '1 min', duration: '1 min' },
          { name: 'Subida 3', detail: '3 min alternando 30 s de pie y 30 s sentado, resistencia alta', target: '3 min', duration: '3 min' },
          { name: 'Recuperación', detail: '1 min a cadencia 90 rpm, resistencia baja', target: '1 min', duration: '1 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Pedaleo sin resistencia', detail: '4 min a cadencia 90-100 rpm, resistencia mínima para reducir progresivamente la frecuencia cardiaca', target: '4 min', duration: '4 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie junto a la bici, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida sobre el sillín, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento espalda', detail: '30 s en postura del niño o flexión frontal con piernas flexionadas', target: '30 s', duration: '30 s' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en la bici, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala para recuperar', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Ajusta la altura del sillín para que la pierna quede casi extendida en el punto más bajo del pedal',
        'Mantén los codos ligeramente flexionados para absorber baches y vibraciones del terreno',
        'Usa cambios cortos en subidas para proteger las rodillas y mantener cadencia constante',
        'Lleva siempre agua y un kit de reparación básica: cámaras, parches y multiplicador',
        'Respeta las normas de circulación y usa luces si hay poca visibilidad',
      ],
    },
  ],
  walking: [
    {
      sessionGoal: 'Mantener la actividad física de bajo impacto, activar la circulación y disfrutar de un paseo saludable a paso ligero.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '5 min', [
          { name: 'Caminata suave', detail: '3 min a paso cómodo para activar circulación y lubricar articulaciones', target: '3 min', duration: '3 min' },
          { name: 'Movilidad articular', detail: '2 min de rotaciones de tobillos, cadera y hombros mientras caminas', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Caminata activa', '25 min', [
          { name: 'Paso ligero', detail: '20 min a ritmo sostenido (RPE 4/10), postura erguida, mirada al frente, brazos a 90°', target: '20 min', duration: '20 min' },
          { name: 'Tramo de intensidad', detail: '5 min aumentando el ritmo (RPE 5-6/10), zancada más larga, respiración más profunda', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '5 min', [
          { name: 'Caminata muy suave', detail: '2 min a paso lento para reducir la frecuencia cardiaca', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en una pared, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cadera', detail: '30 s por lado, rotación de cadera con pierna flexionada a 90°', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Mantén una postura erguida con la mirada al frente, no al suelo, para proteger el cuello y la espalda',
        'Brazos flexionados a 90°, balanceándolos de forma natural para impulsar el paso',
        'Usa calzado cómodo y transpirable para evitar ampollas y rozaduras',
        'Hidrátate antes y después, aunque la intensidad sea baja',
        'Aprovecha para escuchar un podcast o tu música favorita y disfrutar del entorno',
      ],
    },
  ],
  combined: [
    {
      sessionGoal: 'Combinar fuerza y cardio en una sesión eficiente para maximizar el gasto calórico, trabajar todos los grupos musculares y mejorar la condición general.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '8 min', [
          { name: 'Trote suave', detail: '3 min a ritmo conversacional para activar el sistema cardiovascular', target: '3 min', duration: '3 min' },
          { name: 'Movilidad articular', detail: '2 min de rotaciones de tobillos, cadera, hombros y rodillas', target: '2 min', duration: '2 min' },
          { name: 'Activación', detail: '3 x 10 sentadillas sin peso + 3 x 10 jumping jacks para activar tren inferior y cardio', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Circuito de fuerza', '15 min', [
          { name: 'Sentadillas', detail: '3 series x 12 rep, 30 s descanso. Controla el descenso, sube con potencia', target: '3 x 12 rep · 30 s descanso', duration: '4 min' },
          { name: 'Flexiones', detail: '3 series x 10 rep, 30 s descanso. Cuerpo recto, codos a 45°, baja controlado', target: '3 x 10 rep · 30 s descanso', duration: '4 min' },
          { name: 'Zancadas', detail: '3 series x 10 rep (5 por pierna), 30 s descanso. Rodilla a 90°, torso erguido', target: '3 x 10 rep · 30 s descanso', duration: '4 min' },
          { name: 'Plancha', detail: '3 x 45 s, 30 s descanso. Core activo, glúteos apretados, cuerpo alineado', target: '3 x 45 s · 30 s descanso', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Intervalos de cardio', '12 min', [
          { name: 'Sprint 1', detail: '1 min a intensidad alta (RPE 8/10) + 1 min recuperación caminando', target: '2 min', duration: '2 min' },
          { name: 'Sprint 2', detail: '1 min a intensidad alta (RPE 8/10) + 1 min recuperación caminando', target: '2 min', duration: '2 min' },
          { name: 'Sprint 3', detail: '1 min a intensidad alta (RPE 8/10) + 1 min recuperación caminando', target: '2 min', duration: '2 min' },
          { name: 'Burpees', detail: '2 series x 10 rep, 45 s descanso entre series. Descenso controlado, salto explosivo', target: '2 x 10 rep · 45 s descanso', duration: '3 min' },
          { name: 'Mountain climbers', detail: '2 series x 30 s, 30 s descanso. Core activo, rodillas al pecho', target: '2 x 30 s · 30 s descanso', duration: '3 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote muy suave', detail: '3 min a paso mínimo para reducir la frecuencia cardiaca progresivamente', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, pierna extendida, flexión desde la cintura', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento pecho', detail: '30 s en marco de puerta, brazo a 90°, rota torso', target: '30 s', duration: '30 s' },
          { name: 'Estiramiento dorsal', detail: '30 s en postura del niño, brazos extendidos, glúteos sobre talones', target: '30 s', duration: '30 s' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala para activar recuperación', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Empieza siempre por la parte de fuerza cuando estés fresco, antes del cardio',
        'Usa circuitos de 4-5 ejercicios con 30 s de descanso entre ellos para mantener intensidad',
        'Mantén la intensidad del cardio moderada para no comprometer la técnica de fuerza',
        'Hidrátate entre bloques y controla la frecuencia cardiaca con un reloj o app',
        'Incluye 10 min de vuelta a la calma con movilidad y respiración para una recuperación completa',
      ],
    },
  ],
  trail_running: [
    {
      sessionGoal: 'Desarrollar resistencia y técnica en terreno irregular, fortalecer estabilizadores y propiocepción, y adaptar la biomecánica a la montaña.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '12 min', [
          { name: 'Trote suave en llano', detail: '5 min a ritmo conversacional para activar el sistema cardiovascular', target: '5 min', duration: '5 min' },
          { name: 'Movilidad específica', detail: '3 min de rotaciones de tobillos, cadera y rodillas — clave en trail para prevenir torceduras', target: '3 min', duration: '3 min' },
          { name: 'Series de técnica', detail: '4 x 20 m de skipping, zancada larga y talones al glúteo en superficie plana', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Adaptación al terreno', '25 min', [
          { name: 'Trail suave', detail: '10 min a ritmo cómodo (RPE 4-5/10), foco en técnica de pisada y lectura del terreno', target: '10 min', duration: '10 min' },
          { name: 'Subidas caminando', detail: '5 min en subida pronunciada, zancada corta, inclinación del torso hacia delante, manos en muslos', target: '5 min', duration: '5 min' },
          { name: 'Descensos técnicos', detail: '5 min en descenso, zancada corta y frecuencia alta, mira 5 m por delante, frena con pasos cortos', target: '5 min', duration: '5 min' },
          { name: 'Recuperación', detail: '5 min de trote suave en llano para recuperar', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Series de fuerza-velocidad', '10 min', [
          { name: 'Serie 1', detail: '2 min a ritmo fuerte en subida (RPE 7/10) + 1 min trote suave', target: '3 min', duration: '3 min' },
          { name: 'Serie 2', detail: '2 min a ritmo fuerte en subida (RPE 7/10) + 1 min trote suave', target: '3 min', duration: '3 min' },
          { name: 'Serie 3', detail: '2 min a ritmo fuerte en subida (RPE 7/10) + 2 min trote recuperación', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote muy suave', detail: '3 min en llano a paso mínimo para reducir frecuencia cardiaca', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en árbol o roca, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, agarra el tobillo y acerca el talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento tobillos', detail: '30 s por tobillo, rotaciones suaves para liberar tensión tras terreno irregular', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta tobillos y rodillas con movilidad específica antes de empezar — es lo que más sufre en trail',
        'Camina las subidas muy pronunciadas para ahorrar energía y proteger las rodillas',
        'Mantén zancada corta y frecuencia alta en descensos para proteger rodillas y mejorar estabilidad',
        'Lleva agua y algo de comida (geles o fruta) si la ruta supera 60 min',
        'Usa calzado con agarre específico para trail y revisa el terreno antes de cada descenso',
      ],
    },
  ],
  hiking: [
    {
      sessionGoal: 'Disfrutar de una marcha sostenida por senderos naturales, fortalecer piernas y glúteos, y mantener un ejercicio cardiovascular de bajo impacto.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '5 min', [
          { name: 'Caminata suave', detail: '3 min a paso cómodo para activar circulación y lubricar articulaciones', target: '3 min', duration: '3 min' },
          { name: 'Movilidad articular', detail: '2 min de rotaciones de tobillos, cadera y hombros mientras caminas', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Marcha sostenida', '40 min', [
          { name: 'Ritmo constante', detail: '20 min a paso ligero (RPE 4/10), postura erguida, mirada al frente, brazos balanceándose', target: '20 min', duration: '20 min' },
          { name: 'Tramo con desnivel', detail: '15 min en subidas y bajadas, usa bastones si hay mucho desnivel para proteger rodillas', target: '15 min', duration: '15 min' },
          { name: 'Pausa activa', detail: '5 min de caminata suave para hidratarse y recuperar respiración', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Tramo de intensidad', '10 min', [
          { name: 'Paso rápido', detail: '5 min aumentando el ritmo (RPE 5-6/10), zancada más larga, respiración más profunda', target: '5 min', duration: '5 min' },
          { name: 'Recuperación', detail: '5 min a paso cómodo para bajar la frecuencia cardiaca', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '5 min', [
          { name: 'Caminata muy suave', detail: '2 min a paso lento para reducir la frecuencia cardiaca', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en una roca o árbol, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cadera', detail: '30 s por lado, postura de paloma baja para abrir rotadores', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Mantén un ritmo constante, no empieces demasiado rápido para no agotarte en la primera subida',
        'Usa bastones en rutas con mucho desnivel para proteger rodillas y mejorar eficiencia',
        'Hidrátate cada 20-30 min, especialmente en calor o en altitud',
        'Lleva calzado de senderismo con buen agarre y protección para evitar torceduras',
        'Disfruta del entorno y la naturaleza — el senderismo también es mental',
      ],
    },
  ],
  mountain_bike: [
    {
      sessionGoal: 'Combinar resistencia cardiovascular con técnica, equilibrio y agilidad en senderos y montaña, mejorando el control de la bici en terreno irregular.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '10 min', [
          { name: 'Rodaje suave en pista', detail: '5 min en superficie plana a cadencia 80-90 rpm para activar circulación', target: '5 min', duration: '5 min' },
          { name: 'Movilidad sobre la bici', detail: '2 min: alterna pedalear de pie y sentado, 30 s por posición', target: '2 min', duration: '2 min' },
          { name: 'Series de cadencia', detail: '3 x 30 s a cadencia alta (100-110 rpm) + 30 s recuperación', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Sendero técnico', '25 min', [
          { name: 'Tramo de singletrack', detail: '15 min en sendero técnico, foco en línea de trazada, mirada 5-10 m por delante', target: '15 min', duration: '15 min' },
          { name: 'Subidas', detail: '5 min en subida, cadencia 70-75 rpm, peso distribuido, core activo', target: '5 min', duration: '5 min' },
          { name: 'Descensos', detail: '5 min en descenso, sillín bajado, centro de gravedad bajo, frena con ambos frenos', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Intervalos de potencia', '10 min', [
          { name: 'Sprint 1', detail: '1 min a potencia máxima en llano + 1 min recuperación pedaleando suave', target: '2 min', duration: '2 min' },
          { name: 'Sprint 2', detail: '1 min a potencia máxima en llano + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 3', detail: '1 min a potencia máxima en subida + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 4', detail: '1 min a potencia máxima en subida + 2 min recuperación', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Pedaleo sin resistencia', detail: '4 min a cadencia 90-100 rpm, resistencia mínima para reducir frecuencia cardiaca', target: '4 min', duration: '4 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie junto a la bici, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida sobre el sillín, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento espalda', detail: '30 s en flexión frontal con piernas flexionadas, brazos colgando', target: '30 s', duration: '30 s' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en la bici, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Ajusta la presión de neumáticos al terreno: menos presión en senderos sueltos para más agarre',
        'Baja el sillín ligeramente para descensos técnicos y mejora el centro de gravedad',
        'Mira siempre 5-10 m por delante, no a la rueda delantera, para anticipar el terreno',
        'Frena con ambos frenos de forma progresiva, nunca bruscamente, para evitar derrapes',
        'Usa siempre casco y protecciones en manos y rodillas — la seguridad es lo primero',
      ],
    },
  ],
  indoor_cycling: [
    {
      sessionGoal: 'Controlar resistencia, cadencia e intensidad con precisión en bici estática para un entrenamiento estructurado y medible.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '8 min', [
          { name: 'Rodaje suave', detail: '5 min a cadencia 80-90 rpm, resistencia baja para activar circulación', target: '5 min', duration: '5 min' },
          { name: 'Series de cadencia', detail: '3 x 30 s a cadencia 100-110 rpm + 30 s recuperación a 80 rpm', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Trabajo de resistencia', '20 min', [
          { name: 'Tramo de resistencia media', detail: '10 min a cadencia 85-95 rpm, resistencia moderada (RPE 5/10), respiración rítmica', target: '10 min', duration: '10 min' },
          { name: 'Tramo de fuerza', detail: '5 min a cadencia 70-75 rpm, resistencia alta (RPE 7/10), empuja con control', target: '5 min', duration: '5 min' },
          { name: 'Recuperación activa', detail: '5 min a cadencia 90 rpm, resistencia baja para bajar frecuencia cardiaca', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Intervalos HIIT', '10 min', [
          { name: 'Sprint 1', detail: '1 min a cadencia 100+ rpm, resistencia alta (RPE 8/10) + 1 min recuperación a 80 rpm', target: '2 min', duration: '2 min' },
          { name: 'Sprint 2', detail: '1 min a cadencia 100+ rpm, resistencia alta (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 3', detail: '1 min a cadencia 100+ rpm, resistencia alta (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 4', detail: '1 min a cadencia 100+ rpm, resistencia alta (RPE 8/10) + 2 min recuperación', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '7 min', [
          { name: 'Pedaleo sin resistencia', detail: '4 min a cadencia 90-100 rpm, resistencia mínima para reducir frecuencia cardiaca', target: '4 min', duration: '4 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie junto a la bici, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento espalda', detail: '30 s en postura del niño, brazos extendidos, glúteos sobre talones', target: '30 s', duration: '30 s' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Ajusta la altura del sillín para que la pierna quede casi extendida en el punto más bajo del pedal',
        'Mantén cadencia 80-100 rpm en tramos de resistencia media para proteger las rodillas',
        'Trabaja la respiración rítmica sincronizada con el pedaleo para mayor eficiencia',
        'Hidrátate constantemente, el calor indoor deshidrata más rápido que al aire libre',
        'Enfría 5 min pedaleando sin resistencia antes de bajar de la bici',
      ],
    },
  ],
  treadmill: [
    {
      sessionGoal: 'Controlar ritmo, inclinación y distancia con precisión en cinta de correr para un entrenamiento estructurado y medible.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '8 min', [
          { name: 'Caminata suave', detail: '3 min a 5 km/h, inclinación 0% para activar circulación', target: '3 min', duration: '3 min' },
          { name: 'Trote suave', detail: '3 min a 7-8 km/h, inclinación 1% para simular resistencia al aire libre', target: '3 min', duration: '3 min' },
          { name: 'Series de técnica', detail: '4 x 20 m de skipping y talones al glúteo a 6 km/h', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Carrera continua', '20 min', [
          { name: 'Ritmo cómodo', detail: '15 min a 9-10 km/h (RPE 4-5/10), inclinación 1%, respiración 3:3', target: '15 min', duration: '15 min' },
          { name: 'Tramo de ritmo', detail: '5 min a 10-11 km/h (RPE 6/10), mantén postura erguida, no te apoyes en la barra', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Series con inclinación', '10 min', [
          { name: 'Serie 1', detail: '2 min a 9 km/h, inclinación 4% + 1 min recuperación a 6 km/h, inclinación 1%', target: '3 min', duration: '3 min' },
          { name: 'Serie 2', detail: '2 min a 9 km/h, inclinación 5% + 1 min recuperación a 6 km/h, inclinación 1%', target: '3 min', duration: '3 min' },
          { name: 'Serie 3', detail: '2 min a 9 km/h, inclinación 6% + 2 min recuperación a 6 km/h, inclinación 1%', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '7 min', [
          { name: 'Caminata suave', detail: '3 min a 5 km/h, inclinación 0% para reducir frecuencia cardiaca', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en la cinta, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta 5 min a ritmo suave antes de aumentar la velocidad para preparar el sistema cardiovascular',
        'Usa inclinación 1-2% para simular la resistencia al aire libre y proteger las rodillas',
        'Mantén postura erguida, no te apoyes en la barra de la cinta para no comprometer la técnica',
        'Hidrátate cada 15-20 min, el ambiente indoor deshidrata más rápido que al aire libre',
        'Enfría 5 min caminando suave antes de bajar de la cinta para evitar mareos',
      ],
    },
  ],
  elliptical: [
    {
      sessionGoal: 'Trabajar el sistema cardiovascular de bajo impacto combinando piernas y brazos, ideal para recuperación activa o días sin impacto articular.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '5 min', [
          { name: 'Rodaje suave', detail: '5 min a resistencia mínima, cadencia 100-120 ppm, postura erguida para activar circulación', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Resistencia progresiva', '20 min', [
          { name: 'Tramo de resistencia media', detail: '10 min a cadencia 120-140 ppm, resistencia moderada (RPE 5/10), empuja y tira de las manetas', target: '10 min', duration: '10 min' },
          { name: 'Tramo de resistencia alta', detail: '5 min a cadencia 120 ppm, resistencia alta (RPE 7/10), core activo, sin inclinarte', target: '5 min', duration: '5 min' },
          { name: 'Recuperación activa', detail: '5 min a resistencia mínima, cadencia 130 ppm para bajar frecuencia cardiaca', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Intervalos', '10 min', [
          { name: 'Sprint 1', detail: '1 min a resistencia alta, cadencia 150 ppm (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 2', detail: '1 min a resistencia alta, cadencia 150 ppm (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 3', detail: '1 min a resistencia alta, cadencia 150 ppm (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 4', detail: '1 min a resistencia alta, cadencia 150 ppm (RPE 8/10) + 2 min recuperación', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '5 min', [
          { name: 'Enfriamiento', detail: '3 min a resistencia mínima, cadencia 120 ppm para reducir frecuencia cardiaca', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, pierna extendida, flexión de cadera', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Mantén postura erguida, core activo, sin inclinarte hacia delante para proteger la espalda',
        'Empuja y tira de las manetas para trabajar el tren superior, no solo las piernas',
        'Aumenta resistencia progresivamente para mayor intensidad sin compromender la técnica',
        'Mantén cadencia constante de 120-160 pasos por minuto para un ritmo eficiente',
        'Enfría 5 min a resistencia mínima antes de terminar para una recuperación progresiva',
      ],
    },
  ],
  rowing: [
    {
      sessionGoal: 'Trabajar el 85% de los músculos del cuerpo en remo indoor: piernas, core, espalda y brazos, combinando fuerza y resistencia cardiovascular.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '8 min', [
          { name: 'Remo suave', detail: '5 min a ritmo muy suave (20 remadas/min), resistencia baja para activar circulación', target: '5 min', duration: '5 min' },
          { name: 'Series de técnica', detail: '3 x 10 remadas enfocando secuencia: piernas-core-brazos en el empuje, al revés en la vuelta', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Resistencia sostenida', '20 min', [
          { name: 'Tramo de resistencia media', detail: '12 min a 22-24 remadas/min, resistencia moderada (RPE 5/10), espalda recta', target: '12 min', duration: '12 min' },
          { name: 'Tramo de fuerza', detail: '4 min a 20 remadas/min, resistencia alta (RPE 7/10), empuja fuerte con las piernas', target: '4 min', duration: '4 min' },
          { name: 'Recuperación activa', detail: '4 min a 24 remadas/min, resistencia baja para bajar frecuencia cardiaca', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Intervalos', '10 min', [
          { name: 'Sprint 1', detail: '1 min a 28-30 remadas/min, resistencia alta (RPE 8/10) + 1 min recuperación a 20 remadas/min', target: '2 min', duration: '2 min' },
          { name: 'Sprint 2', detail: '1 min a 28-30 remadas/min, resistencia alta (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 3', detail: '1 min a 28-30 remadas/min, resistencia alta (RPE 8/10) + 1 min recuperación', target: '2 min', duration: '2 min' },
          { name: 'Sprint 4', detail: '1 min a 28-30 remadas/min, resistencia alta (RPE 8/10) + 2 min recuperación', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '7 min', [
          { name: 'Remo muy suave', detail: '4 min a 20 remadas/min, resistencia mínima para reducir frecuencia cardiaca', target: '4 min', duration: '4 min' },
          { name: 'Estiramiento espalda', detail: '30 s en postura del niño, brazos extendidos, glúteos sobre talones', target: '30 s', duration: '30 s' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, pierna extendida, flexión desde la cintura', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento hombros', detail: '30 s por lado, cruza el brazo sobre el pecho y tira del codo', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Secuencia: piernas, core, brazos en el empuje; al revés en la vuelta — este es el secreto del remo eficiente',
        'Mantén la espalda recta, no redondees los hombros para proteger la columna',
        'Tira el mango hacia el ombligo, no hacia el pecho, para una trayectoria correcta',
        'Mantén cadencia 20-30 remadas por minuto en ritmo constante para eficiencia',
        'Calienta 5 min a ritmo muy suave antes de aumentar la intensidad para preparar la espalda',
      ],
    },
  ],
  yoga: [
    {
      sessionGoal: 'Combinar posturas (asanas), respiración (pranayama) y meditación para mejorar flexibilidad, fuerza, equilibrio y reducir el estrés.',
      blocks: [
        mkBlock('warmup', 'Calentamiento — Conexión con la respiración', '8 min', [
          { name: 'Respiración profunda', detail: '3 min sentado en postura fácil, respiración Ujjayi: inhala 4 s por la nariz, exhala 6 s con sonido oceánico', target: '3 min', duration: '3 min' },
          { name: 'Saludo al sol A (Surya Namaskar A)', detail: '5 rondas completas, fluye con la respiración: inhala en posturas ascendentes, exhala en descendentes', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Posturas de pie y equilibrio', '20 min', [
          { name: 'Guerrero I (Virabhadrasana I)', detail: '30 s por lado, pie delantero a 90°, pie trasero a 45°, brazos extendidos al cielo, rodilla delantera a 90°', target: '1 min', duration: '1 min' },
          { name: 'Guerrero II (Virabhadrasana II)', detail: '30 s por lado, brazos paralelos al suelo, mirada hacia la mano delantera', target: '1 min', duration: '1 min' },
          { name: 'Postura del triángulo (Trikonasana)', detail: '30 s por lado, piernas separadas, torso lateral, mano delantera al tobillo, brazo superior al cielo', target: '1 min', duration: '1 min' },
          { name: 'Árbol (Vrksasana)', detail: '30 s por lado, pie en el muslo o tobillo (nunca rodilla), manos en el pecho o al cielo, mirada fija', target: '1 min', duration: '1 min' },
          { name: 'Perro boca abajo (Adho Mukha Svanasana)', detail: '1 min, manos a la anchura de hombros, cadera al cielo, talones hacia el suelo, espalda alargada', target: '1 min', duration: '1 min' },
          { name: 'Cobra (Bhujangasana)', detail: '3 x 30 s, manos bajo hombros, codo pegados al cuerpo, pecho se eleva, hombros lejos de las orejas', target: '2 min', duration: '2 min' },
          { name: 'Transición fluida', detail: '5 min de flujo entre perro boca abajo, cobra y postura del niño, sincronizado con la respiración', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Posturas en el suelo y torsiones', '12 min', [
          { name: 'Postura del niño (Balasana)', detail: '1 min, rodillas separadas, brazos extendidos al frente, frente al suelo, respiración profunda', target: '1 min', duration: '1 min' },
          { name: 'Torsión espinal supina', detail: '1 min por lado, espalda en el suelo, rodillas a un lado, brazos extendidos, mirada al lado contrario', target: '2 min', duration: '2 min' },
          { name: 'Pigeon (Eka Pada Rajakapotasana)', detail: '1 min por lado, pierna delantera flexionada, pierna trasera extendida, torso hacia delante, respiración profunda', target: '2 min', duration: '2 min' },
          { name: 'Mariposa (Baddha Konasana)', detail: '1 min, plantas de los pies juntas, rodillas abiertas, espalda recta, inclinación suave hacia delante', target: '1 min', duration: '1 min' },
          { name: 'Postura del puente (Setu Bandhasana)', detail: '3 x 30 s, pies a la anchura de cadera, eleva cadera al cielo, core activo, mentón al pecho', target: '2 min', duration: '2 min' },
          { name: 'Flexión frontal sentado (Paschimottanasana)', detail: '2 min, piernas extendidas, flexión desde la cintura, manos a los pies, espalda alargada', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma — Savasana', '10 min', [
          { name: 'Savasana (postura del cadáver)', detail: '7 min tumbado boca arriba, brazos a los lados, palmas al cielo, respiración natural, cuerpo completamente relajado', target: '7 min', duration: '7 min' },
          { name: 'Respiración final', detail: '3 min de respiración profunda y consciente: 4 s inhala, 6 s exhala para integrar la práctica', target: '3 min', duration: '3 min' },
        ]),
      ],
      tips: [
        'Respira profundo y lento por la nariz durante toda la práctica, usando la respiración Ujjayi para mantener el calor interno',
        'No fuerces las posturas: ve hasta donde tu cuerpo permita sin dolor, usa bloques o cinturones para adaptar',
        'Mantén cada postura 30-60 s respirando de forma constante para profundizar',
        'Usa bloques o cinturones para adaptar posturas a tu nivel y evitar lesiones',
        'Finaliza siempre con Savasana 5-10 min para integrar los beneficios de la práctica',
      ],
    },
  ],
  pilates: [
    {
      sessionGoal: 'Fortalecer el core, mejorar la alineación postural y la flexibilidad combinando control, respiración y precisión en cada movimiento.',
      blocks: [
        mkBlock('warmup', 'Calentamiento — Activación del core y respiración', '8 min', [
          { name: 'Respiración costal', detail: '3 min tumbado boca arriba, manos en costillas, inhala expandiendo costillas, exhala contrayendo core', target: '3 min', duration: '3 min' },
          { name: 'Pelvic tilt', detail: '2 x 10 rep, tumba la lumbar al suelo activando core y glúteos, respira en cada movimiento', target: '2 min', duration: '2 min' },
          { name: 'Bird-dog', detail: '2 x 10 rep por lado, a cuatro patas, extiende brazo y pierna contraria, core estable, sin rotación', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Core y estabilidad', '20 min', [
          { name: 'Hundred', detail: '3 series x 30 s, tumbado boca arriba, piernas a 45°, bombeo de brazos, respiración 5:5 (inhala 5, exhala 5)', target: '3 min', duration: '3 min' },
          { name: 'Roll-up', detail: '3 series x 8 rep, sube vértebra a vértebra desde la nuca, controla el descenso, core activo', target: '4 min', duration: '4 min' },
          { name: 'Single leg stretch', detail: '3 series x 10 rep por lado, rodilla al pecho, pierna contraria extendida, alterna con control', target: '4 min', duration: '4 min' },
          { name: 'Double leg stretch', detail: '3 series x 8 rep, brazos y piernas extendidos, recoge rodillas al pecho, core estable', target: '3 min', duration: '3 min' },
          { name: 'Plancha frontal', detail: '3 x 45 s, cuerpo alineado, core activo, glúteos apretados, respiración constante', target: '3 min', duration: '3 min' },
          { name: 'Side plank', detail: '2 x 30 s por lado, antebrazo en el suelo, cadera elevada, core lateral activo', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Movilidad y fuerza', '12 min', [
          { name: 'Swan dive', detail: '3 series x 8 rep, tumbado boca abajo, eleva pecho y piernas alternativamente, espalda arqueada con control', target: '4 min', duration: '4 min' },
          { name: 'Shoulder bridge', detail: '3 series x 10 rep, tumbado boca arriba, eleva cadera vértebra a vértebra, desciende con control', target: '4 min', duration: '4 min' },
          { name: 'Spine twist', detail: '3 series x 8 rep por lado, sentado, columna alargada, rota torso manteniendo cadera estable', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '5 min', [
          { name: 'Postura del niño', detail: '1 min, rodillas separadas, brazos extendidos, frente al suelo, respiración profunda', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento gato-vaca', detail: '5 rep a cuatro patas, arquea y redondea la columna sincronizado con la respiración', target: '1 min', duration: '1 min' },
          { name: 'Torsión espinal', detail: '1 min por lado, tumbado boca arriba, rodillas a un lado, brazos extendidos', target: '2 min', duration: '2 min' },
          { name: 'Respiración final', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala para integrar', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Activa el core en cada ejercicio: ombligo hacia la columna, sin contraer en exceso',
        'Respira por las costillas, expandiendo la caja torácica en lugar del abdomen',
        'Prioriza la calidad del movimiento sobre la cantidad: control total, sin inercia',
        'Mantén la columna en posición neutra durante los ejercicios para proteger la espalda',
        'Trabaja con control total, sin inercia ni movimientos bruscos, para máxima activación',
      ],
    },
  ],
  barre: [
    {
      sessionGoal: 'Combinar elementos de ballet, pilates y yoga para trabajar piernas, glúteos, core y brazos con movimientos pequeños y precisos de alta repetición.',
      blocks: [
        mkBlock('warmup', 'Calentamiento dinámico', '8 min', [
          { name: 'Respiración y postura', detail: '3 min de pie, columna alargada, hombros abajo, respiración costal para activar core', target: '3 min', duration: '3 min' },
          { name: 'Movilidad articular', detail: '2 min de rotaciones suaves de cadera, hombros y tobillos', target: '2 min', duration: '2 min' },
          { name: 'Plié en primera', detail: '2 x 10 rep, rodillas abiertas, espalda recta, baja con control, sube apretando glúteos', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Piernas y glúteos', '20 min', [
          { name: 'Relevé', detail: '3 series x 15 rep, sube a la punta de los pies, core activo, baja con control', target: '3 min', duration: '3 min' },
          { name: 'Pulse en cuclillas', detail: '3 series x 20 pulsaciones, en cuclillas con rodillas a 90°, movimientos pequeños', target: '4 min', duration: '4 min' },
          { name: 'Lateral leg raises', detail: '3 series x 15 rep por lado, pierna extendida al lado, movimientos controlados, core estable', target: '4 min', duration: '4 min' },
          { name: 'Glute kicks', detail: '3 series x 15 rep por lado, a cuatro patas, patea pierna hacia atrás y arriba, glúteo activo', target: '4 min', duration: '4 min' },
          { name: 'Lunge isométrico', detail: '2 x 45 s por lado, en zancada baja, rodilla delantera a 90°, core activo', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Core y brazos', '12 min', [
          { name: 'Arm circles', detail: '3 series x 15 rep, brazos extendidos a los lados, círculos pequeños hacia delante y atrás', target: '3 min', duration: '3 min' },
          { name: 'Plancha con toque de hombro', detail: '3 series x 10 rep, en plancha, toca hombro alternando, core estable', target: '3 min', duration: '3 min' },
          { name: 'Crunch oblicuo', detail: '3 series x 12 rep por lado, tumbado, lleva codo a rodilla contraria, torsión controlada', target: '3 min', duration: '3 min' },
          { name: 'Plancha lateral', detail: '2 x 30 s por lado, antebrazo en el suelo, cadera elevada, core lateral activo', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '5 min', [
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo, rodilla apuntando al suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento pierna al frente', detail: '30 s por lado, pierna extendida sobre una superficie, flexión de cadera', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cadera en mariposa', detail: '1 min, sentado, plantas juntas, rodillas abiertas, espalda recta', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento espalda', detail: '1 min en postura del niño, brazos extendidos, glúteos sobre talones', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de pie, respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Mantén postura erguida con la columna alargada en cada ejercicio, como en ballet',
        'Trabaja con pulsaciones pequeñas y controladas, sin rebotes, para máxima activación',
        'Activa los glúteos en cada movimiento de pierna para proteger la espalda baja',
        'Respira de forma constante, no retengas el aire durante las pulsaciones',
        'Usa calcetines con agarre o zapatillas de danza para mayor control en los deslizamientos',
      ],
    },
  ],
  stretching: [
    {
      sessionGoal: 'Mejorar flexibilidad, movilidad articular y liberar tensión muscular para la recuperación, prevención de lesiones y bienestar general.',
      blocks: [
        mkBlock('warmup', 'Activación y movilidad articular', '5 min', [
          { name: 'Rotaciones articulares', detail: '3 min de rotaciones suaves de cuello, hombros, cadera, rodillas y tobillos — 10 rep por articulación', target: '3 min', duration: '3 min' },
          { name: 'Cat-cow', detail: '2 min a cuatro patas, arquea y redondea la columna sincronizado con la respiración', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Tren inferior', '15 min', [
          { name: 'Estiramiento isquiotibiales', detail: '45 s por pierna, sentado, pierna extendida, flexión desde la cintura, sin rebotes', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento cuádriceps', detail: '45 s por pierna, de pie, talón al glúteo, rodilla apuntando al suelo', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento gemelos', detail: '45 s por pierna, apoya manos en la pared, talón en el suelo, sin rebotes', target: '2 min', duration: '2 min' },
          { name: 'Postura de paloma', detail: '1 min por lado, pierna delantera flexionada, pierna trasera extendida, torso hacia delante', target: '2 min', duration: '2 min' },
          { name: 'Mariposa (Baddha Konasana)', detail: '1 min, plantas juntas, rodillas abiertas, espalda recta, inclinación suave', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento aductores', detail: '45 s, piernas muy separadas, flexión frontal con espalda recta', target: '1 min', duration: '1 min' },
          { name: 'Foam roller isquios', detail: '2 min, pasa el roller por isquiotibiales, detente en puntos de tensión 20 s', target: '2 min', duration: '2 min' },
          { name: 'Foam roller cuádriceps', detail: '2 min, pasa el roller por cuádriceps, detente en puntos de tensión 20 s', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Tren superior y columna', '10 min', [
          { name: 'Estiramiento pecho en puerta', detail: '45 s por lado, brazo a 90° en marco de puerta, rota torso', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento dorsal cruzado', detail: '45 s por lado, cruza brazo sobre el pecho, tira del codo', target: '2 min', duration: '2 min' },
          { name: 'Torsión espinal sentado', detail: '45 s por lado, pierna cruzada, rota torso manteniendo cadera estable', target: '2 min', duration: '2 min' },
          { name: 'Postura del niño', detail: '1 min, rodillas separadas, brazos extendidos, frente al suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cuello', detail: '30 s por lado, inclina la cabeza al hombro, mano tira suavemente', target: '2 min', duration: '2 min' },
          { name: 'Foam roller espalda', detail: '1 min, pasa el roller por la espalda alta, detente entre omóplatos', target: '1 min', duration: '1 min' },
        ]),
        mkBlock('cooldown', 'Integración y respiración', '5 min', [
          { name: 'Savasana', detail: '3 min tumbado boca arriba, brazos a los lados, palmas al cielo, respiración natural, cuerpo relajado', target: '3 min', duration: '3 min' },
          { name: 'Respiración profunda', detail: '2 min: 4 s inhala por la nariz, 6 s exhala por la boca para activar sistema parasimpático', target: '2 min', duration: '2 min' },
        ]),
      ],
      tips: [
        'Nunca estires con rebotes: mantén cada posición 30-60 s de forma estática para mayor eficacia',
        'Respira profundo y lento, exhala al profundizar el estiramiento para relajar el músculo',
        'No llegues al dolor: estira hasta sentir tensión moderada, no aguda, para evitar reflejos musculares',
        'Estira todos los grupos musculares principales en cada sesión para equilibrio',
        'Usa foam roller antes de estirar para liberar tensión miofascial y mejorar el rango de movimiento',
      ],
    },
  ],
  padel: [
    {
      sessionGoal: 'Preparar el cuerpo para el pádel con calentamiento específico, trabajo de técnica y movilidad, y vuelta a la calma para prevenir lesiones.',
      blocks: [
        mkBlock('warmup', 'Calentamiento específico de pádel', '10 min', [
          { name: 'Trote suave', detail: '3 min alrededor de la pista para activar el sistema cardiovascular', target: '3 min', duration: '3 min' },
          { name: 'Movilidad de tobillos y cadera', detail: '3 min de rotaciones de tobillos, cadera y rodillas — clave para cambios de dirección', target: '3 min', duration: '3 min' },
          { name: 'Series de técnica con pala', detail: '4 min: 20 golpes de derecha, 20 de revés, 20 bandejas, enfocando técnica sin intensidad', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Juego de técnica', '30 min', [
          { name: 'Calentamiento con bola', detail: '10 min de peloteo con pareja, derecha y revés, foco en técnica y posición', target: '10 min', duration: '10 min' },
          { name: 'Trabajo de pared', detail: '10 min: deja que la bola rebote, trabaja el juego de pared y la lectura del rebote', target: '10 min', duration: '10 min' },
          { name: 'Juego real', detail: '10 min de juego real con pareja, enfocando movimiento de pies y posición de espera', target: '10 min', duration: '10 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Juego de competición', '20 min', [
          { name: 'Partido', detail: '20 min de juego real, trabaja cambios de ritmo, voleas y remates', target: '20 min', duration: '20 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote suave', detail: '2 min alrededor de la pista para reducir frecuencia cardiaca', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en la valla, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento hombros', detail: '30 s por lado, cruza brazo sobre el pecho, tira del codo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento antebrazos', detail: '30 s por lado, extiende el brazo, tira de los dedos hacia atrás', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cadera', detail: '30 s por lado, postura de paloma baja para abrir rotadores', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta tobillos, rodillas y cadera con movilidad antes de jugar — los cambios de dirección son intensos',
        'Mantén la pala por delante del cuerpo en posición de espera, con las dos manos en el agarre',
        'Golpea la bola de bote con la pala por debajo de la cintura para mayor control',
        'Trabaja el juego de pared: deja que la bola rebote antes de golpear para leer la trayectoria',
        'Hidrátate en cada cambio de lado, aunque el partido sea corto, para mantener el rendimiento',
      ],
    },
  ],
  crossfit: [
    {
      sessionGoal: 'Realizar un WOD (Workout of the Day) combinando movimientos funcionales a alta intensidad, con técnica limpia y gestión del esfuerzo.',
      blocks: [
        mkBlock('warmup', 'Calentamiento específico de CrossFit', '12 min', [
          { name: 'Rowing o trote', detail: '3 min a ritmo suave para activar el sistema cardiovascular', target: '3 min', duration: '3 min' },
          { name: 'Movilidad dinámica', detail: '3 min de rotaciones de hombros, cadera, tobillos y muñecas', target: '3 min', duration: '3 min' },
          { name: 'Práctica de movimientos del WOD', detail: '6 min: 2 series ligeras de cada movimiento del WOD con poca carga para practicar técnica', target: '6 min', duration: '6 min' },
        ]),
        mkBlock('main', 'Bloque 1 — WOD AMRAP 15 min', '15 min', [
          { name: 'AMRAP 15 min', detail: 'Tantas rondas como sea posible en 15 min: 10 sentadillas, 10 flexiones, 10 burpees, 10 sit-ups. Escala los movimientos a tu nivel', target: '15 min', duration: '15 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Fuerza accesoria', '10 min', [
          { name: 'Strict pull-ups', detail: '4 series x 5 rep, 90 s descanso. Si no puedes, usa banda de resistencia', target: '5 min', duration: '5 min' },
          { name: 'GHD sit-ups', detail: '3 series x 12 rep, 60 s descanso. Controla el descenso, activa core', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote suave', detail: '3 min a paso mínimo para reducir frecuencia cardiaca', target: '3 min', duration: '3 min' },
          { name: 'Foam roller espalda', detail: '2 min, pasa el roller por la espalda alta, detente en puntos de tensión', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento hombros', detail: '30 s por lado, cruza brazo sobre el pecho, tira del codo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, pierna extendida', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta siempre con movilidad y práctica de los movimientos del WOD antes de empezar',
        'Prioriza la técnica en cada repetición antes de buscar intensidad: la técnica limpia previene lesiones',
        'Escala los pesos y movimientos a tu nivel: es mejor hacer menos con buena técnica que más con mala',
        'Respira de forma rítmica: no retengas el aire durante el esfuerzo, exhala en la fase concéntrica',
        'Finaliza con estiramientos y foam roller para recuperar y reducir agujetas',
      ],
    },
  ],
  hyrox: [
    {
      sessionGoal: 'Simular una estación de HYROX combinando carrera y ejercicios funcionales con gestión del ritmo y técnica limpia en cada estación.',
      blocks: [
        mkBlock('warmup', 'Calentamiento específico de HYROX', '15 min', [
          { name: 'Carrera suave', detail: '5 min a ritmo conversacional para activar el sistema cardiovascular', target: '5 min', duration: '5 min' },
          { name: 'Movilidad dinámica', detail: '5 min de rotaciones de hombros, cadera, tobillos y rodillas', target: '5 min', duration: '5 min' },
          { name: 'Práctica de estaciones', detail: '5 min: 1 serie ligera de cada ejercicio funcional (sled push, burpee broad jump, wall balls)', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Estación 1: Sled Push + Carrera', '15 min', [
          { name: 'Sled Push', detail: '4 x 20 m con peso moderado, 60 s descanso. Empuja con piernas, no con los brazos, core activo', target: '5 min', duration: '5 min' },
          { name: 'Carrera 1 km', detail: '5 min a ritmo moderado (RPE 6/10) tras el sled push, mantén respiración rítmica', target: '5 min', duration: '5 min' },
          { name: 'Recuperación', detail: '5 min de trote suave para hidratarse y preparar la siguiente estación', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Estación 2: Burpee Broad Jump + Carrera', '12 min', [
          { name: 'Burpee Broad Jump', detail: '3 series x 10 rep, 60 s descanso. Salto horizontal largo, aterrizaje con dos pies, controla el descenso', target: '5 min', duration: '5 min' },
          { name: 'Carrera 1 km', detail: '5 min a ritmo moderado (RPE 6/10), mantén técnica de carrera', target: '5 min', duration: '5 min' },
          { name: 'Recuperación', detail: '2 min de trote suave para hidratarse', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '10 min', [
          { name: 'Carrera muy suave', detail: '4 min a paso mínimo para reducir frecuencia cardiaca progresivamente', target: '4 min', duration: '4 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, pierna extendida', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento hombros', detail: '30 s por lado, cruza brazo sobre el pecho, tira del codo', target: '1 min', duration: '1 min' },
          { name: 'Foam roller piernas', detail: '2 min, pasa el roller por cuádriceps e isquios, detente en puntos de tensión', target: '2 min', duration: '2 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta 10-15 min con carrera suave y práctica de las estaciones para preparar el cuerpo',
        'Gestiona el ritmo en cada estación: no empieces demasiado fuerte, HYROX es de resistencia',
        'Hidrátate en cada transición entre carrera y estación funcional, aunque sea breve',
        'Mantén técnica limpia en sled push (empuja con piernas) y burpee broad jump (aterriza con dos pies)',
        'Finaliza con 10 min de carrera suave y estiramientos profundos para una recuperación completa',
      ],
    },
  ],
  swimming: [
    {
      sessionGoal: 'Combinar estilos de natación con técnica eficiente, trabajo de respiración bilateral y resistencia cardiovascular en el medio acuático.',
      blocks: [
        mkBlock('warmup', 'Calentamiento acuático', '10 min', [
          { name: 'Estilo libre suave', detail: '200 m a ritmo muy suave para activar la musculatura y adaptar el cuerpo al agua', target: '5 min', duration: '5 min' },
          { name: 'Técnica de respiración', detail: '4 x 50 m con tabla, respira cada 3 brazadas para trabajar bilateral', target: '3 min', duration: '3 min' },
          { name: 'Patada', detail: '4 x 25 m con tabla, patada continua desde la cadera, no desde la rodilla', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Resistencia', '20 min', [
          { name: 'Estilo libre continuo', detail: '400 m a ritmo moderado (RPE 5/10), respiración cada 3 brazadas, cuerpo alineado', target: '10 min', duration: '10 min' },
          { name: 'Series de técnica', detail: '4 x 100 m, 20 s descanso: foco en posición hidrodinámica y brazada larga', target: '6 min', duration: '6 min' },
          { name: 'Recuperación', detail: '100 m de espalda suave para soltar la musculatura', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Velocidad', '10 min', [
          { name: 'Serie 1', detail: '50 m a ritmo fuerte (RPE 7/10) + 30 s descanso', target: '2 min', duration: '2 min' },
          { name: 'Serie 2', detail: '50 m a ritmo fuerte (RPE 7/10) + 30 s descanso', target: '2 min', duration: '2 min' },
          { name: 'Serie 3', detail: '50 m a ritmo fuerte (RPE 7/10) + 30 s descanso', target: '2 min', duration: '2 min' },
          { name: 'Serie 4', detail: '50 m a ritmo fuerte (RPE 7/10) + 30 s descanso', target: '2 min', duration: '2 min' },
          { name: 'Enfriamiento', detail: '100 m de braza suave para soltar', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '5 min', [
          { name: 'Estilo libre muy suave', detail: '100 m a ritmo mínimo para reducir frecuencia cardiaca en el agua', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento hombros', detail: '30 s por lado fuera del agua, cruza brazo sobre el pecho', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento dorsal', detail: '30 s en postura del niño fuera del agua', target: '30 s', duration: '30 s' },
        ]),
      ],
      tips: [
        'Calienta con 200 m de estilo libre a ritmo muy suave para adaptar el cuerpo al agua',
        'Trabaja la posición hidrodinámica: cuerpo alineado y cabeza en línea con la columna',
        'Respira cada 3 brazadas para mantener un patrón bilateral equilibrado y simétrico',
        'La patada debe ser continua y desde la cadera, no desde la rodilla, para mayor eficiencia',
        'Finaliza con 100 m de espalda o braza para soltar la musculatura y recuperar',
      ],
    },
  ],
  football: [
    {
      sessionGoal: 'Preparar el cuerpo para el fútbol con calentamiento específico, trabajo de técnica con balón y vuelta a la calma para prevenir lesiones.',
      blocks: [
        mkBlock('warmup', 'Calentamiento específico de fútbol', '12 min', [
          { name: 'Trote suave', detail: '3 min alrededor del campo para activar el sistema cardiovascular', target: '3 min', duration: '3 min' },
          { name: 'Movilidad de cadera y tobillos', detail: '3 min de rotaciones de cadera, tobillos y rodillas — clave para cambios de dirección', target: '3 min', duration: '3 min' },
          { name: 'Series de técnica', detail: '4 x 20 m de skipping, talones al glúteo y zancada larga para activar cadena posterior', target: '3 min', duration: '3 min' },
          { name: 'Toques de balón', detail: '3 min de conducción y toques suaves con ambas piernas para activar técnica', target: '3 min', duration: '3 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Técnica con balón', '25 min', [
          { name: 'Conducción', detail: '10 min de conducción entre conos, alterna piernas, foco en control y cambio de ritmo', target: '10 min', duration: '10 min' },
          { name: 'Pase y control', detail: '10 min por parejas, pases cortos y largos, control orientado con ambas piernas', target: '10 min', duration: '10 min' },
          { name: 'Regate', detail: '5 min de regate entre obstáculos, cambia de dirección explosivo', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Juego real', '20 min', [
          { name: 'Partido', detail: '20 min de juego real, trabaja cambios de ritmo, sprint con trote de recuperación y trabajo en equipo', target: '20 min', duration: '20 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote suave', detail: '2 min alrededor del campo para reducir frecuencia cardiaca', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, pierna extendida', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento aductores', detail: '30 s en postura de mariposa, plantas juntas, rodillas abiertas', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento gemelos', detail: '30 s por pierna, apoya manos en el suelo, talón en el suelo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento cadera', detail: '30 s por lado, postura de paloma baja', target: '1 min', duration: '1 min' },
          { name: 'Respiración', detail: '1 min de respiración profunda: 4 s inhala, 6 s exhala', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta con movilidad de cadera y tobillos antes de empezar — los cambios de dirección son intensos',
        'Usa botas adecuadas al terreno (césped, tierra o indoor) para evitar lesiones y mejorar agarre',
        'Hidrátate en cada pausa del partido, aunque no sientas sed, para mantener el rendimiento',
        'Trabaja cambios de ritmo: alterna sprint con trote de recuperación para simular el partido',
        'Estira cuádriceps, isquiotibiales y aductores al finalizar para prevenir lesiones',
      ],
    },
  ],
  basketball: [
    {
      sessionGoal: 'Preparar el cuerpo para el baloncesto con calentamiento específico, trabajo de técnica individual y vuelta a la calma para prevenir lesiones.',
      blocks: [
        mkBlock('warmup', 'Calentamiento específico de baloncesto', '10 min', [
          { name: 'Trote suave', detail: '3 min alrededor de la pista para activar el sistema cardiovascular', target: '3 min', duration: '3 min' },
          { name: 'Movilidad de tobillos y rodillas', detail: '3 min de rotaciones de tobillos, rodillas y cadera — clave para saltos y cambios', target: '3 min', duration: '3 min' },
          { name: 'Series de técnica', detail: '4 min de skipping, talones al glúteo y saltos laterales para activar piernas', target: '4 min', duration: '4 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Técnica individual', '25 min', [
          { name: 'Bote con ambas manos', detail: '10 min de bote con mano débil y fuerte, alterna ritmos y alturas de bote', target: '10 min', duration: '10 min' },
          { name: 'Tiros', detail: '10 min de tiros desde diferentes posiciones, foco en técnica de tiro y seguimiento', target: '10 min', duration: '10 min' },
          { name: 'Defensa', detail: '5 min de trabajo de defensa en posición baja, pasos cortos y rápidos, core activo', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Juego real', '15 min', [
          { name: 'Partido', detail: '15 min de juego real, trabaja cambios de ritmo, tiros bajo fatiga y juego en equipo', target: '15 min', duration: '15 min' },
        ]),
        mkBlock('cooldown', 'Vuelta a la calma y estiramientos', '8 min', [
          { name: 'Trote suave', detail: '2 min alrededor de la pista para reducir frecuencia cardiaca', target: '2 min', duration: '2 min' },
          { name: 'Tiros libres', detail: '3 min de tiros libres para afianzar la técnica bajo fatiga', target: '3 min', duration: '3 min' },
          { name: 'Estiramiento cuádriceps', detail: '30 s por pierna, de pie, talón al glúteo', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento isquiotibiales', detail: '30 s por pierna, sentado, pierna extendida', target: '1 min', duration: '1 min' },
          { name: 'Estiramiento hombros', detail: '30 s por lado, cruza brazo sobre el pecho', target: '1 min', duration: '1 min' },
        ]),
      ],
      tips: [
        'Calienta tobillos y rodillas con movilidad específica antes de saltar para prevenir lesiones',
        'Practica el bote con ambas manos para mejorar tu ambidextría y ser menos predecible',
        'Trabaja la defensa en posición baja con pasos cortos y rápidos, core activo',
        'Hidrátate en cada tiempo muerto o descanso del entrenamiento para mantener el rendimiento',
        'Finaliza con tiros libres para afianzar la técnica bajo fatiga, como en el partido',
      ],
    },
  ],
  recovery: [
    {
      sessionGoal: 'Facilitar la recuperación activa con movimiento suave y de baja intensidad para estimular la circulación, reducir la rigidez y promover la regeneración muscular.',
      blocks: [
        mkBlock('warmup', 'Activación suave', '5 min', [
          { name: 'Caminata muy suave', detail: '3 min a paso cómodo para activar circulación sin sobrecargar', target: '3 min', duration: '3 min' },
          { name: 'Respiración profunda', detail: '2 min: 4 s inhala por la nariz, 6 s exhala por la boca para activar sistema parasimpático', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 1 — Movilidad articular', '10 min', [
          { name: 'Rotaciones de cadera', detail: '2 min de rotaciones suaves de cadera en ambas direcciones, 10 rep por lado', target: '2 min', duration: '2 min' },
          { name: 'Rotaciones de hombros', detail: '2 min de rotaciones suaves de hombros hacia delante y atrás, 10 rep por dirección', target: '2 min', duration: '2 min' },
          { name: 'Rotaciones de columna', detail: '2 min de torsiones suaves sentado, 10 rep por lado, movimiento fluido', target: '2 min', duration: '2 min' },
          { name: 'Rotaciones de tobillos y muñecas', detail: '2 min de rotaciones suaves, 10 rep por articulación y dirección', target: '2 min', duration: '2 min' },
          { name: 'Cat-cow', detail: '2 min a cuatro patas, arquea y redondea la columna con la respiración', target: '2 min', duration: '2 min' },
        ]),
        mkBlock('main', 'Bloque 2 — Estiramientos mantenidos y foam roller', '10 min', [
          { name: 'Estiramiento isquiotibiales', detail: '45 s por pierna, sentado, pierna extendida, sin rebotes, respirando profundo', target: '2 min', duration: '2 min' },
          { name: 'Estiramiento cuádriceps', detail: '45 s por pierna, de pie, talón al glúteo, sin arquear la espalda', target: '2 min', duration: '2 min' },
          { name: 'Postura del niño', detail: '1 min, rodillas separadas, brazos extendidos, frente al suelo, respiración profunda', target: '1 min', duration: '1 min' },
          { name: 'Foam roller espalda', detail: '2 min, pasa el roller por la espalda alta, detente entre omóplatos 20 s', target: '2 min', duration: '2 min' },
          { name: 'Foam roller piernas', detail: '2 min, pasa el roller por cuádriceps e isquios, detente en puntos de tensión', target: '2 min', duration: '2 min' },
          { name: 'Savasana', detail: '1 min tumbado boca arriba, respiración natural, cuerpo relajado', target: '1 min', duration: '1 min' },
        ]),
        mkBlock('cooldown', 'Integración y respiración', '5 min', [
          { name: 'Respiración profunda', detail: '3 min: 4 s inhala por la nariz, 6 s exhala por la boca para activar recuperación', target: '3 min', duration: '3 min' },
          { name: 'Relajación consciente', detail: '2 min tumbado, recorre el cuerpo mentalmente y relaja cada zona', target: '2 min', duration: '2 min' },
        ]),
      ],
      tips: [
        'Movilidad articular: 10 min de rotaciones suaves de cadera, hombros, columna y tobillos',
        'Estiramientos mantenidos: 30 s por grupo muscular, sin rebotes, respirando profundo',
        'Foam roller: 5-10 min en gemelos, isquiotibiales y espalda para liberar tensión miofascial',
        'Yoga restaurador: posturas suaves mantenidas 1-2 min para relajar el sistema nervioso',
        'Hidratación y nutrición: bebe agua, consume proteína y duerme 7-8 h para una recuperación completa',
      ],
    },
  ],
  rest: [
    {
      sessionGoal: 'Día de descanso activo. El cuerpo se recupera y se fortalece durante el descanso, no durante el entrenamiento. Aprovecha para caminar suave o hacer estiramientos.',
      blocks: [
        mkBlock('warmup', 'Activación suave opcional', '5 min', [
          { name: 'Caminata ligera', detail: '5 min a paso cómodo para activar la circulación sin sobrecargar', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('main', 'Descanso activo', '10 min', [
          { name: 'Estiramientos suaves', detail: '5 min de estiramientos de todo el cuerpo, 30 s por grupo muscular, sin rebotes', target: '5 min', duration: '5 min' },
          { name: 'Respiración o meditación', detail: '5 min de respiración profunda: 4 s inhala, 6 s exhala para reducir el estrés', target: '5 min', duration: '5 min' },
        ]),
        mkBlock('cooldown', 'Relajación', '5 min', [
          { name: 'Savasana o descanso', detail: '5 min tumbado boca arriba, respiración natural, cuerpo completamente relajado', target: '5 min', duration: '5 min' },
        ]),
      ],
      tips: [
        'Camina 15-20 minutos a paso ligero para activar la circulación sin sobrecargar',
        'Realiza estiramientos suaves de todo el cuerpo (10-15 minutos) para mantener la movilidad',
        'Hidrátate bien y prioriza dormir 7-8 horas esta noche para una recuperación completa',
        'Usa técnicas de respiración o meditación para reducir el estrés y activar el sistema parasimpático',
        'Escucha a tu cuerpo: si hay dolor, descansa completamente — la recuperación es entrenamiento',
      ],
    },
  ],
};

function pickTemplate(sport: string, seed: number): SportWorkoutTemplate {
  const templates = TEMPLATES[sport] || TEMPLATES.combined;
  return templates[seed % templates.length];
}

export function generateDetailedWorkout(
  sport: string,
  goal: Goal,
  seed: number,
): DetailedWorkout {
  const template = pickTemplate(sport, seed);
  return {
    sessionGoal: template.sessionGoal,
    blocks: exercisesToBlocks(template.blocks),
    tips: template.tips,
  };
}

function isDetailedDay(day: PlanDay): boolean {
  if (!day.blocks || day.blocks.length === 0) return false;
  return day.blocks.some(b => b.target === b.blockType);
}

export function upgradePlan(days: PlanDay[], goal: Goal): PlanDay[] {
  if (!days || !Array.isArray(days)) return [];
  if (days.every(isDetailedDay)) return days;
  return days.map((day, i) => {
    if (isDetailedDay(day)) return day;
    const seed = i + 1;
    const completed = day.completed;
    const upgraded = applyDetailedWorkoutToDay(day, goal, seed);
    return { ...upgraded, completed };
  });
}

export function applyDetailedWorkoutToDay(
  day: PlanDay,
  goal: Goal,
  seed: number,
): PlanDay {
  if (day.type === 'rest' || day.type === 'recovery') {
    const workout = generateDetailedWorkout(day.type, goal, seed);
    return {
      ...day,
      sessionGoal: workout.sessionGoal,
      blocks: workout.blocks,
      tips: workout.tips,
    };
  }
  const workout = generateDetailedWorkout(day.sport, goal, seed);
  return {
    ...day,
    sessionGoal: workout.sessionGoal,
    blocks: workout.blocks,
    tips: workout.tips,
  };
}
