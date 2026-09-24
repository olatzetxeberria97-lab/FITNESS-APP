import type { Goal, PlanDay, PlanBlock, BlockType } from './types';
import { DEFAULT_SPORTS, SPORT_EMOJIS } from './types';
import { applyDetailedWorkoutToDay, upgradePlan } from './workoutGenerator';

export type { PlanDay, PlanBlock };
export { upgradePlan } from './workoutGenerator';

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface TrainingTemplate {
  title: string;
  description: string;
  emoji: string;
  blocks: PlanBlock[];
}

function blk(name: string, detail: string, target: string, blockType: BlockType = 'main'): PlanBlock {
  return { name, detail, target, blockType, completed: false };
}

const TRAINING_TEMPLATES: Record<string, TrainingTemplate[]> = {
  running: [
    {
      title: 'Carrera continua',
      description: '30-40 min a ritmo suave, mantén conversación.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + movilidad de tobillos y caderas', '5 min'),
        blk('Bloque principal', 'Carrera continua a ritmo conversacional (Zona 2)', '30-40 min @ ritmo suave'),
        blk('Enfriamiento', 'Marcha 2 min + estiramientos de gemelos e isquiotibiales', '5 min'),
      ],
    },
    {
      title: 'Series de velocidad',
      description: '6×400 m a ritmo rápido con 90 s de descanso.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + carrera suave 10 min + drills de técnica', '15 min'),
        blk('Series', '6 × 400 m a ritmo 5K con 90 s de descanso entre series', '6 × 400 m'),
        blk('Enfriamiento', 'Carrera muy suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Tirada larga',
      description: '50-60 min a ritmo cómodo, construye resistencia.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + movilidad articular', '5 min'),
        blk('Bloque principal', 'Carrera continua a ritmo conversacional, sin parar', '50-60 min @ Zona 2'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos de cadena posterior', '8 min'),
      ],
    },
    {
      title: 'Fartlek',
      description: '40 min alternando ritmos: 2 min rápidos / 2 min suaves.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 10 min + drills', '10 min'),
        blk('Fartlek', '10 × (2 min rápido + 2 min suave)', '40 min total'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Carrera regenerativa',
      description: '25 min muy suaves para activar piernas.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 3 min', '3 min'),
        blk('Bloque principal', 'Carrera muy suave, respiración nasal, Zona 1', '25 min'),
        blk('Movilidad', 'Estiramientos de cadera y gemelos', '5 min'),
      ],
    },
    {
      title: 'Cuestas',
      description: '8 cuestas de 100 m en subida, bajada suave.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 15 min en llano + drills', '15 min'),
        blk('Cuestas', '8 × 100 m en subida al 85%, bajada caminando', '8 × 100 m'),
        blk('Enfriamiento', 'Carrera suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Tempo run',
      description: '35 min: 10 calentamiento + 15 a ritmo umbral + 10 enfriamiento.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 10 min + drills de técnica', '10 min'),
        blk('Tempo', '15 min a ritmo umbral (apenas puedes hablar frases cortas)', '15 min @ umbral'),
        blk('Enfriamiento', 'Carrera suave 10 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Carrera progresiva',
      description: '40 min aumentando el ritmo cada 10 min.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera muy suave 10 min', '10 min Zona 1'),
        blk('Progresión 1', '10 min a ritmo suave-moderado', '10 min Zona 2'),
        blk('Progresión 2', '10 min a ritmo moderado-firme', '10 min Zona 3'),
        blk('Progresión 3', '10 min a ritmo firme-rápido', '10 min Zona 4'),
      ],
    },
    {
      title: 'Intervalos',
      description: '5×800 m a ritmo 5K con 2 min de descanso.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 15 min + drills', '15 min'),
        blk('Intervalos', '5 × 800 m a ritmo 5K con 2 min de descanso trotando', '5 × 800 m'),
        blk('Enfriamiento', 'Carrera suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Carrera larga suave',
      description: '60-75 min a ritmo conversacional.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + movilidad', '5 min'),
        blk('Bloque principal', 'Carrera continua a ritmo conversacional', '60-75 min @ Zona 2'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos profundos', '10 min'),
      ],
    },
    {
      title: 'Sprints cortos',
      description: '10×200 m al máximo con 2 min de descanso.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 15 min + drills + 4 progresiones de 50 m', '20 min'),
        blk('Sprints', '10 × 200 m al 95% con 2 min de descanso caminando', '10 × 200 m'),
        blk('Enfriamiento', 'Carrera muy suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Carrera fartlek libre',
      description: '45 min jugando con el ritmo a voluntad.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 10 min', '10 min'),
        blk('Fartlek libre', 'Alternar ritmos a voluntad: acelera cuando te sienta bien', '35 min'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
  ],
  walking: [
    {
      title: 'Marcha activa',
      description: '45 min a paso ligero, buena postura.',
      emoji: '🚶',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min + movilidad de tobillos', '5 min'),
        blk('Bloque principal', 'Marcha a paso ligero, brazos activos, postura erguida', '45 min @ paso ligero'),
        blk('Enfriamiento', 'Marcha suave 3 min + estiramientos', '5 min'),
      ],
    },
    {
      title: 'Marcha suave',
      description: '30 min relajados, disfruta del entorno.',
      emoji: '🚶',
      blocks: [
        blk('Bloque principal', 'Marcha a ritmo relajado, respiración profunda', '30 min'),
        blk('Movilidad', 'Estiramientos suaves de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Marcha con desnivel',
      description: 'Ruta con subidas, 50 min a ritmo cómodo.',
      emoji: '🚶',
      blocks: [
        blk('Calentamiento', 'Marcha suave en llano 5 min', '5 min'),
        blk('Subidas', 'Marcha por ruta con desnivel, ajusta el ritmo en pendientes', '40 min'),
        blk('Enfriamiento', 'Marcha suave de bajada + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Marcha rápida',
      description: '40 min a paso deportivo, brazos activos.',
      emoji: '🚶',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min', '5 min'),
        blk('Bloque principal', 'Marcha a paso deportivo, cadencia alta, brazos activos', '40 min @ paso rápido'),
        blk('Enfriamiento', 'Marcha suave 3 min + estiramientos', '5 min'),
      ],
    },
    {
      title: 'Marcha larga',
      description: '60-90 min a ritmo relajado, explora.',
      emoji: '🚶',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min', '5 min'),
        blk('Bloque principal', 'Marcha a ritmo relajado, explora nuevos caminos', '60-90 min'),
        blk('Enfriamiento', 'Estiramientos de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Marcha matutina',
      description: '30 min para activar el cuerpo.',
      emoji: '🚶',
      blocks: [
        blk('Movilidad', 'Rotaciones articulares y estiramientos suaves', '5 min'),
        blk('Bloque principal', 'Marcha a ritmo cómodo para activar el cuerpo', '30 min'),
        blk('Enfriamiento', 'Estiramientos de cadena posterior', '3 min'),
      ],
    },
    {
      title: 'Marcha nocturna',
      description: '45 min relajantes, despeja la mente.',
      emoji: '🚶',
      blocks: [
        blk('Bloque principal', 'Marcha relajada a paso cómodo, despeja la mente', '45 min'),
        blk('Enfriamiento', 'Estiramientos suaves de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Marcha con peso',
      description: '40 min con mochila ligera, tonifica.',
      emoji: '🚶',
      blocks: [
        blk('Calentamiento', 'Marcha sin peso 5 min', '5 min'),
        blk('Bloque principal', 'Marcha con mochila ligera (3-5 kg), paso firme', '40 min'),
        blk('Enfriamiento', 'Marcha sin peso 3 min + estiramientos', '5 min'),
      ],
    },
  ],
  strength: [
    {
      title: 'Tren superior',
      description: 'Press banca, remo, press militar, 4×10.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad articular + 2 series ligeras de press con barra vacía', '5 min'),
        blk('Press banca', '4 × 10 repeticiones a 70% 1RM, descansa 90 s entre series', '4 × 10'),
        blk('Remo con barra', '4 × 10 repeticiones, espalda recta, descansa 90 s', '4 × 10'),
        blk('Press militar', '4 × 10 repeticiones, core firme, descansa 90 s', '4 × 10'),
        blk('Enfriamiento', 'Estiramientos de pecho, hombros y espalda', '5 min'),
      ],
    },
    {
      title: 'Tren inferior',
      description: 'Sentadillas, peso muerto, zancadas, 4×12.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad de cadera + 2 series ligeras de sentadilla sin peso', '5 min'),
        blk('Sentadillas', '4 × 12 repeticiones a 70% 1RM, descansa 90 s', '4 × 12'),
        blk('Peso muerto rumano', '4 × 12 repeticiones, espalda recta, descansa 90 s', '4 × 12'),
        blk('Zancadas', '4 × 12 (6 por pierna), descansa 60 s', '4 × 12'),
        blk('Enfriamiento', 'Estiramientos de cuádriceps, isquiotibiales y glúteos', '5 min'),
      ],
    },
    {
      title: 'Full body',
      description: 'Circuito: flexiones, sentadillas, plank, 3 rondas.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad articular + jumping jacks 2 min', '5 min'),
        blk('Circuito', '3 rondas: 15 flexiones + 20 sentadillas + 45 s plancha + 15 burpees', '3 rondas'),
        blk('Enfriamiento', 'Estiramientos de todo el cuerpo', '5 min'),
      ],
    },
    {
      title: 'Core y estabilidad',
      description: 'Plancha, dead bug, russian twists, 4×15.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad de columna + cat-cow 10 rep', '5 min'),
        blk('Plancha', '4 × 45 s con core firme, descansa 30 s', '4 × 45 s'),
        blk('Dead bug', '4 × 15 repeticiones por lado, controla la respiración', '4 × 15'),
        blk('Russian twists', '4 × 15 repeticiones con peso ligero', '4 × 15'),
        blk('Enfriamiento', 'Estiramientos de espalda y cadera', '5 min'),
      ],
    },
    {
      title: 'Hipertrofia',
      description: 'Peso muerto rumano, press, curl, 4×8-12.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad + 2 series ligeras de cada ejercicio', '5 min'),
        blk('Peso muerto rumano', '4 × 10 repeticiones a 75% 1RM, descansa 90 s', '4 × 10'),
        blk('Press banca', '4 × 10 repeticiones, descansa 90 s', '4 × 10'),
        blk('Curl de bíceps', '4 × 12 repeticiones, descansa 60 s', '4 × 12'),
        blk('Enfriamiento', 'Estiramientos de grupos trabajados', '5 min'),
      ],
    },
    {
      title: 'Fuerza máxima',
      description: 'Sentadilla, press banca, peso muerto, 5×5.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad + 3 series progresivas con barra vacía', '10 min'),
        blk('Sentadilla', '5 × 5 repeticiones a 85% 1RM, descansa 3 min', '5 × 5'),
        blk('Press banca', '5 × 5 repeticiones a 85% 1RM, descansa 3 min', '5 × 5'),
        blk('Peso muerto', '5 × 5 repeticiones a 85% 1RM, descansa 3 min', '5 × 5'),
        blk('Enfriamiento', 'Estiramientos profundos', '5 min'),
      ],
    },
    {
      title: 'Push-Pull',
      description: 'Flexiones, dominadas, press, remo, 4×10.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad de hombros + rotaciones de brazos', '5 min'),
        blk('Flexiones', '4 × 10 repeticiones, descansa 60 s', '4 × 10'),
        blk('Dominadas', '4 × 8 repeticiones (o asistidas), descansa 90 s', '4 × 8'),
        blk('Press con mancuernas', '4 × 10 repeticiones, descansa 60 s', '4 × 10'),
        blk('Remo con mancuernas', '4 × 10 repeticiones, descansa 60 s', '4 × 10'),
        blk('Enfriamiento', 'Estiramientos de pecho, espalda y hombros', '5 min'),
      ],
    },
    {
      title: 'Pierna y glúteo',
      description: 'Hip thrust, sentadilla búlgara, puente, 4×12.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad de cadera + sentadillas sin peso 2 × 15', '5 min'),
        blk('Hip thrust', '4 × 12 repeticiones con barra, descansa 90 s', '4 × 12'),
        blk('Sentadilla búlgara', '4 × 12 (6 por pierna), descansa 90 s', '4 × 12'),
        blk('Puente de glúteo', '4 × 15 repeticiones, descansa 60 s', '4 × 15'),
        blk('Enfriamiento', 'Estiramientos de glúteos y cuádriceps', '5 min'),
      ],
    },
    {
      title: 'Circuito metcon',
      description: '5 ejercicios, 45 s trabajo / 15 s descanso, 4 rondas.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad + jumping jacks 2 min', '5 min'),
        blk('Circuito metcon', '4 rondas: 45 s trabajo / 15 s descanso de: burpees, sentadillas, flexiones, mountain climbers, saltos', '4 rondas × 5 ejercicios'),
        blk('Enfriamiento', 'Carrera suave 3 min + estiramientos', '5 min'),
      ],
    },
    {
      title: 'Hombros y brazos',
      description: 'Press militar, elevaciones, curl, tríceps, 4×12.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Rotaciones de hombros + 2 series ligeras', '5 min'),
        blk('Press militar', '4 × 12 repeticiones con mancuernas, descansa 60 s', '4 × 12'),
        blk('Elevaciones laterales', '4 × 15 repeticiones, descansa 45 s', '4 × 15'),
        blk('Curl de bíceps', '4 × 12 repeticiones, descansa 60 s', '4 × 12'),
        blk('Extensión de tríceps', '4 × 12 repeticiones, descansa 60 s', '4 × 12'),
        blk('Enfriamiento', 'Estiramientos de hombros y brazos', '5 min'),
      ],
    },
    {
      title: 'Espalda y postura',
      description: 'Remo, pulldown, face pull, pájaro, 4×12.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad de columna + cat-cow 10 rep', '5 min'),
        blk('Remo con mancuernas', '4 × 12 repeticiones, descansa 60 s', '4 × 12'),
        blk('Pulldown (o dominadas asistidas)', '4 × 12 repeticiones, descansa 60 s', '4 × 12'),
        blk('Face pull', '4 × 15 repeticiones con banda, descansa 45 s', '4 × 15'),
        blk('Pájaro', '4 × 12 repeticiones por lado, descansa 45 s', '4 × 12'),
        blk('Enfriamiento', 'Estiramientos de espalda y hombros', '5 min'),
      ],
    },
    {
      title: 'Powerbuilding',
      description: 'Sentadilla pesada + accesorios, 5×5 + 3×12.',
      emoji: '💪',
      blocks: [
        blk('Calentamiento', 'Movilidad + 3 series progresivas con barra vacía', '10 min'),
        blk('Sentadilla pesada', '5 × 5 repeticiones a 85% 1RM, descansa 3 min', '5 × 5'),
        blk('Zancadas con mancuernas', '3 × 12 (6 por pierna), descansa 60 s', '3 × 12'),
        blk('Hip thrust', '3 × 12 repeticiones, descansa 60 s', '3 × 12'),
        blk('Enfriamiento', 'Estiramientos profundos de tren inferior', '5 min'),
      ],
    },
  ],
  cycling: [
    {
      title: 'Rodada suave',
      description: '45 min a ritmo cómodo, cadencia alta.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada muy suave 10 min, cadencia 90 rpm', '10 min'),
        blk('Bloque principal', 'Ruta de 20-25 km a ritmo cómodo, mantén cadencia 90-100 rpm', '45 min @ Zona 2'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos de piernas', '10 min'),
      ],
    },
    {
      title: 'Series en llano',
      description: '6×3 min a ritmo fuerte con 3 min de descanso.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 20 min con progresiones', '20 min'),
        blk('Series', '6 × 3 min a ritmo fuerte (Zona 4-5) con 3 min de descanso rodando suave', '6 × 3 min'),
        blk('Enfriamiento', 'Rodada suave 15 min + estiramientos', '20 min'),
      ],
    },
    {
      title: 'Tirada larga',
      description: '90-120 min a ritmo aeróbico, hidrátate bien.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 15 min', '15 min'),
        blk('Bloque principal', 'Ruta de 40-60 km a ritmo aeróbico, hidrátate cada 20 min', '90-120 min @ Zona 2'),
        blk('Enfriamiento', 'Rodada suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Cuestas en bici',
      description: '8 subidas de 2 min, bajada recuperando.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 20 min hacia la zona de cuestas', '20 min'),
        blk('Cuestas', '8 × 2 min en subida a ritmo fuerte, bajada rodando suave', '8 × 2 min'),
        blk('Enfriamiento', 'Rodada suave 15 min a casa + estiramientos', '20 min'),
      ],
    },
    {
      title: 'Tempo en bici',
      description: '45 min: 15 calentamiento + 15 tempo + 15 enfriamiento.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 15 min, cadencia alta', '15 min'),
        blk('Tempo', '15 min a ritmo umbral (Zona 3-4), esfuerzo sostenido', '15 min @ tempo'),
        blk('Enfriamiento', 'Rodada suave 15 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Cadencia alta',
      description: '40 min trabajando cadencia 90-100 rpm.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 10 min', '10 min'),
        blk('Cadencia', '40 min manteniendo cadencia 90-100 rpm en llano', '40 min @ 90-100 rpm'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Ruta con desnivel',
      description: '60 min buscando puertos, gestiona el esfuerzo.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 15 min hacia el puerto', '15 min'),
        blk('Puerto', 'Subida de 3-5 km a ritmo firme, gestiona la intensidad', '30 min @ subida'),
        blk('Bajada y enfriamiento', 'Bajada técnica segura + rodada suave a casa', '15 min'),
      ],
    },
    {
      title: 'Sprints',
      description: '10 sprints de 20 s al máximo, 40 s de descanso.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 20 min + 3 progresiones de 100 m', '25 min'),
        blk('Sprints', '10 × 20 s al máximo con 40 s de descanso rodando suave', '10 × 20 s'),
        blk('Enfriamiento', 'Rodada suave 15 min + estiramientos', '20 min'),
      ],
    },
    {
      title: 'Recuperación activa',
      description: '30 min muy suaves, rodar sin fuerza.',
      emoji: '🚴',
      blocks: [
        blk('Bloque principal', 'Rodada muy suave, Zona 1, sin fuerza en las piernas', '30 min @ Zona 1'),
        blk('Movilidad', 'Estiramientos de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Intervalos cortos',
      description: '12×1 min fuerte / 1 min suave.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 20 min con progresiones', '20 min'),
        blk('Intervalos', '12 × (1 min fuerte + 1 min suave)', '24 min'),
        blk('Enfriamiento', 'Rodada suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'BTT técnica',
      description: '60 min en senderos, trabaja técnica y equilibrio.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave por sendero plano 10 min', '10 min'),
        blk('Técnica', '60 min en senderos: trabaja frenada, curvas y equilibrio', '60 min'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'TT contrarreloj',
      description: '2×10 min a ritmo umbral, descansa 5 min.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', 'Rodada suave 20 min con progresiones', '20 min'),
        blk('Contrarreloj', '2 × 10 min a ritmo umbral (Zona 4) con 5 min de descanso', '2 × 10 min'),
        blk('Enfriamiento', 'Rodada suave 15 min + estiramientos', '20 min'),
      ],
    },
  ],
  combined: [
    {
      title: 'Fuerza + cardio',
      description: '30 min fuerza + 20 min carrera suave.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad articular + jumping jacks 2 min', '5 min'),
        blk('Fuerza', '30 min: 3 series de flexiones, sentadillas, remo y plancha (12-15 rep)', '30 min'),
        blk('Cardio', '20 min carrera suave a ritmo conversacional', '20 min @ Zona 2'),
        blk('Enfriamiento', 'Estiramientos de todo el cuerpo', '5 min'),
      ],
    },
    {
      title: 'Circuito funcional',
      description: '45 min: kettlebell, box jumps, carrera, 4 rondas.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad + carrera suave 5 min', '10 min'),
        blk('Circuito funcional', '4 rondas: 15 kettlebell swings + 10 box jumps + 200 m carrera + 15 flexiones', '4 rondas'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Triatlón indoor',
      description: '20 min bici + 15 min carrera + 10 min fuerza.',
      emoji: '🔥',
      blocks: [
        blk('Bici', '20 min en bici estática a ritmo cómodo, cadencia 90 rpm', '20 min'),
        blk('Carrera', '15 min en cinta o calle a ritmo moderado', '15 min'),
        blk('Fuerza', '10 min: 3 series de 12 flexiones, sentadillas y plancha 45 s', '10 min'),
        blk('Enfriamiento', 'Estiramientos de todo el cuerpo', '5 min'),
      ],
    },
    {
      title: 'Cross training',
      description: 'AMRAP 20 min: flexiones, sentadillas, burpees, remo.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad + carrera suave 5 min', '10 min'),
        blk('AMRAP', '20 min: máximas rondas de 10 flexiones, 15 sentadillas, 10 burpees, 15 remos', '20 min AMRAP'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Fuerza + movilidad',
      description: '35 min fuerza + 15 min movilidad y estiramientos.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad articular 5 min', '5 min'),
        blk('Fuerza', '35 min: 4 series de 10 sentadillas, 10 flexiones, 12 remo, 45 s plancha', '35 min'),
        blk('Movilidad', '15 min de estiramientos profundos de cadena posterior y cadera', '15 min'),
      ],
    },
    {
      title: 'Cardio + core',
      description: '30 min carrera + 15 min core intenso.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Marcha 3 min + carrera suave 5 min', '8 min'),
        blk('Cardio', '30 min carrera a ritmo moderado', '30 min'),
        blk('Core', '15 min: 4 series de 45 s plancha + 15 dead bug + 20 russian twists', '15 min'),
        blk('Enfriamiento', 'Estiramientos de piernas y core', '5 min'),
      ],
    },
    {
      title: 'Hyrox style',
      description: 'Circuito: wall balls, sled push, burpee broad jump.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad + carrera suave 10 min', '15 min'),
        blk('Circuito HYROX', '4 rondas: 20 wall balls + 50 m sled push + 50 m burpee broad jump', '4 rondas'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Bici + fuerza',
      description: '40 min bici + 20 min tren superior.',
      emoji: '🔥',
      blocks: [
        blk('Bici', '40 min en bici a ritmo moderado, cadencia 90 rpm', '40 min'),
        blk('Fuerza', '20 min: 4 series de 10 flexiones, 12 remo, 12 curl, 12 press militar', '20 min'),
        blk('Enfriamiento', 'Estiramientos de tren superior y piernas', '5 min'),
      ],
    },
    {
      title: 'Funcional HIIT',
      description: '8 rondas 20/10: burpees, mountain climbers, squats.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad + jumping jacks 3 min', '5 min'),
        blk('HIIT Tabata', '8 rondas: 20 s burpees / 10 s descanso, luego 8 rondas mountain climbers, luego 8 rondas squats', '12 min Tabata'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Full body metcon',
      description: '30 min circuito con pesas y cardio.',
      emoji: '🔥',
      blocks: [
        blk('Calentamiento', 'Movilidad + carrera suave 5 min', '10 min'),
        blk('Metcon', '5 rondas: 10 thrusters + 15 sentadillas + 200 m carrera + 10 flexiones', '30 min'),
        blk('Enfriamiento', 'Estiramientos de todo el cuerpo', '5 min'),
      ],
    },
    {
      title: 'Resistencia mixta',
      description: '20 min carrera + 20 min bici + 20 min fuerza.',
      emoji: '🔥',
      blocks: [
        blk('Carrera', '20 min a ritmo moderado', '20 min'),
        blk('Bici', '20 min en bici a ritmo cómodo', '20 min'),
        blk('Fuerza', '20 min: 3 series de 12 flexiones, sentadillas, remo y plancha', '20 min'),
        blk('Enfriamiento', 'Estiramientos de todo el cuerpo', '5 min'),
      ],
    },
    {
      title: 'Movilidad + cardio',
      description: '20 min movilidad + 30 min marcha activa.',
      emoji: '🔥',
      blocks: [
        blk('Movilidad', '20 min de movilidad articular y estiramientos dinámicos', '20 min'),
        blk('Cardio', '30 min marcha activa a paso ligero', '30 min'),
        blk('Enfriamiento', 'Estiramientos suaves', '5 min'),
      ],
    },
  ],
  trail_running: [
    {
      title: 'Trail suave',
      description: '40 min en sendero a ritmo cómodo, cuidado con el terreno.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + movilidad de tobillos', '5 min'),
        blk('Trail', '40 min en sendero a ritmo cómodo, atención al terreno', '40 min'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos de tobillos y gemelos', '8 min'),
      ],
    },
    {
      title: 'Trail con desnivel',
      description: '50 min buscando subidas, camina las pendientes pronunciadas.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min en sendero plano', '5 min'),
        blk('Trail con desnivel', '50 min: corre en llano y bajadas, camina en subidas >15%', '50 min'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos de cuádriceps e isquios', '8 min'),
      ],
    },
    {
      title: 'Trail técnico',
      description: '45 min en terreno rocoso, trabaja técnica y equilibrio.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + drills de técnica', '5 min'),
        blk('Trail técnico', '45 min en terreno rocoso, pasos cortos, mirada al frente', '45 min'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos', '8 min'),
      ],
    },
    {
      title: 'Descensos de trail',
      description: '40 min enfocados en bajadas técnicas y agilidad.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + movilidad de rodillas', '5 min'),
        blk('Descensos', '40 min: sube caminando y baja corriendo, técnica de bajada', '40 min'),
        blk('Enfriamiento', 'Estiramientos de cuádriceps y rodillas', '5 min'),
      ],
    },
    {
      title: 'Trail largo',
      description: '60-90 min a ritmo conversacional en montaña.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min', '5 min'),
        blk('Trail largo', '60-90 min a ritmo conversacional, lleva agua y móvil', '60-90 min'),
        blk('Enfriamiento', 'Estiramientos profundos de piernas', '10 min'),
      ],
    },
    {
      title: 'Series en cuestas de trail',
      description: '6×200 m en subida de sendero, bajada caminando.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 5 min + carrera suave 10 min', '15 min'),
        blk('Series', '6 × 200 m en subida de sendero al 85%, bajada caminando', '6 × 200 m'),
        blk('Enfriamiento', 'Carrera suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Trail nocturno',
      description: '40 min con frontal, ritmo suave y segura.',
      emoji: '🏔️',
      blocks: [
        blk('Calentamiento', 'Marcha 3 min con frontal + movilidad', '5 min'),
        blk('Trail nocturno', '40 min a ritmo suave en sendero conocido, lleva frontal', '40 min'),
        blk('Enfriamiento', 'Estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Trail regenerativo',
      description: '30 min muy suaves en sendero plano.',
      emoji: '🏔️',
      blocks: [
        blk('Trail suave', '30 min muy suaves en sendero plano, respiración nasal', '30 min'),
        blk('Movilidad', 'Estiramientos de tobillos y gemelos', '5 min'),
      ],
    },
  ],
  hiking: [
    {
      title: 'Sendero suave',
      description: '60-90 min de caminata por naturaleza, ritmo cómodo.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min + movilidad de tobillos', '5 min'),
        blk('Sendero', '60-90 min de caminata por naturaleza a ritmo cómodo', '60-90 min'),
        blk('Enfriamiento', 'Estiramientos de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Ruta con desnivel',
      description: '90 min con subidas y bajadas, lleva agua.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min', '5 min'),
        blk('Ruta con desnivel', '90 min con subidas y bajadas, ajusta el ritmo en pendientes', '90 min'),
        blk('Enfriamiento', 'Estiramientos de cuádriceps e isquiotibiales', '5 min'),
      ],
    },
    {
      title: 'Marcha de montaña',
      description: '2-3 h de senderismo, calzado de montaña imprescindible.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min + movilidad', '5 min'),
        blk('Marcha de montaña', '2-3 h de senderismo, lleva agua, snacks y calzado de montaña', '2-3 h'),
        blk('Enfriamiento', 'Estiramientos profundos de piernas y espalda', '10 min'),
      ],
    },
    {
      title: 'Sendero matutino',
      description: '60 min a primera hora para activar el cuerpo.',
      emoji: '🥾',
      blocks: [
        blk('Movilidad', 'Rotaciones articulares y estiramientos 5 min', '5 min'),
        blk('Sendero', '60 min a primera hora, ritmo cómodo', '60 min'),
        blk('Enfriamiento', 'Estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Ruta circular',
      description: '90 min en ruta circular, disfruta del paisaje.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min', '5 min'),
        blk('Ruta circular', '90 min en ruta circular, disfruta del paisaje', '90 min'),
        blk('Enfriamiento', 'Estiramientos de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Marcha con mochila',
      description: '60 min con mochila ligera, tonifica piernas y espalda.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha sin peso 5 min', '5 min'),
        blk('Marcha con mochila', '60 min con mochila (3-5 kg), espalda recta, paso firme', '60 min'),
        blk('Enfriamiento', 'Estiramientos de espalda y hombros', '5 min'),
      ],
    },
    {
      title: 'Sendero costero',
      description: '90 min junto al mar, brisa y vistas.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min', '5 min'),
        blk('Sendero costero', '90 min junto al mar, ritmo cómodo, hidrátate', '90 min'),
        blk('Enfriamiento', 'Estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Marcha larga de fin de semana',
      description: '3-4 h de senderismo, lleva snacks y agua.',
      emoji: '🥾',
      blocks: [
        blk('Calentamiento', 'Marcha suave 5 min + movilidad', '5 min'),
        blk('Marcha larga', '3-4 h de senderismo, lleva snacks, agua y protección solar', '3-4 h'),
        blk('Enfriamiento', 'Estiramientos profundos de todo el cuerpo', '10 min'),
      ],
    },
  ],
  mountain_bike: [
    {
      title: 'BTT suave',
      description: '45 min en senderos a ritmo cómodo, disfruta el bosque.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 10 min hacia el sendero', '10 min'),
        blk('BTT suave', '45 min en senderos a ritmo cómodo, disfruta el bosque', '45 min'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Single track',
      description: '60 min en trail estrecho, trabaja técnica y equilibrio.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 10 min', '10 min'),
        blk('Single track', '60 min en trail estrecho, trabaja técnica de frenada y equilibrio', '60 min'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Descensos BTT',
      description: '40 min de bajadas técnicas, protecciones obligatorias.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 10 min hacia la zona de descensos', '10 min'),
        blk('Descensos', '40 min de bajadas técnicas, usa protecciones (casco integral, rodilleras)', '40 min'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Subidas de montaña',
      description: '50 min con puertos, gestiona el esfuerzo en cada subida.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 15 min hacia el puerto', '15 min'),
        blk('Puertos', '50 min con subidas de 3-5 km, gestiona intensidad y respiración', '50 min'),
        blk('Enfriamiento', 'Bajada segura + rodada suave 5 min', '15 min'),
      ],
    },
    {
      title: 'BTT larga',
      description: '90-120 min en montaña, hidrátate bien.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 15 min', '15 min'),
        blk('BTT larga', '90-120 min en montaña, hidrátate cada 20 min', '90-120 min'),
        blk('Enfriamiento', 'Rodada suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Circuitos BTT',
      description: '45 min en circuito cerrado, repite vueltas a ritmo.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 10 min + 1 vuelta de reconocimiento', '15 min'),
        blk('Circuitos', '45 min en circuito cerrado, repite vueltas a ritmo creciente', '45 min'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'BTT técnica nocturna',
      description: '40 min con frontal en senderos conocidos.',
      emoji: '🚵',
      blocks: [
        blk('Calentamiento', 'Rodada suave 10 min con frontal', '10 min'),
        blk('BTT nocturna', '40 min en senderos conocidos, lleva frontal y luz trasera', '40 min'),
        blk('Enfriamiento', 'Rodada suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Recuperación en BTT',
      description: '30 min muy suaves rodando en llano.',
      emoji: '🚵',
      blocks: [
        blk('Rodada regenerativa', '30 min muy suaves en llano, sin fuerza, cadencia alta', '30 min @ Zona 1'),
        blk('Movilidad', 'Estiramientos de piernas y espalda', '5 min'),
      ],
    },
  ],
  indoor_cycling: [
    {
      title: 'Spinning suave',
      description: '30 min a ritmo cómodo, cadencia alta.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '5 min resistencia baja, cadencia 90 rpm', '5 min'),
        blk('Bloque principal', '30 min a ritmo cómodo, resistencia media, cadencia 90-100 rpm', '30 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Series de spinning',
      description: '6×3 min fuerte / 3 min suave en bici estática.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '10 min resistencia baja con progresiones', '10 min'),
        blk('Series', '6 × 3 min resistencia alta (Zona 4) / 3 min resistencia baja', '36 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Simulación de puerto',
      description: '45 min con resistencia alta, como subiendo un puerto.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '10 min resistencia media', '10 min'),
        blk('Puerto', '45 min con resistencia alta, cadencia 70-80 rpm, como subiendo un puerto', '45 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'HIIT en bici estática',
      description: '10×1 min al máximo / 1 min descanso.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '10 min resistencia baja con progresiones', '10 min'),
        blk('HIIT', '10 × 1 min al máximo (Zona 5) / 1 min descanso resistencia baja', '20 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Cadencia y técnica',
      description: '40 min trabajando cadencia 90-100 rpm.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '5 min resistencia baja', '5 min'),
        blk('Cadencia', '40 min manteniendo cadencia 90-100 rpm, resistencia media', '40 min @ 90-100 rpm'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Spinning largo',
      description: '60-75 min a ritmo aeróbico en bici estática.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '10 min resistencia baja', '10 min'),
        blk('Bloque principal', '60-75 min a ritmo aeróbico (Zona 2), resistencia media', '60-75 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Recuperación activa indoor',
      description: '30 min muy suaves en bici estática.',
      emoji: '🚴',
      blocks: [
        blk('Rodada regenerativa', '30 min muy suaves, resistencia baja, cadencia alta', '30 min @ Zona 1'),
        blk('Movilidad', 'Estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Tempo en spinning',
      description: '45 min: 15 calentamiento + 15 tempo + 15 enfriamiento.',
      emoji: '🚴',
      blocks: [
        blk('Calentamiento', '15 min resistencia baja, cadencia 90 rpm', '15 min'),
        blk('Tempo', '15 min a ritmo umbral (Zona 3-4), resistencia media-alta', '15 min @ tempo'),
        blk('Enfriamiento', '15 min resistencia baja + estiramientos', '15 min'),
      ],
    },
  ],
  treadmill: [
    {
      title: 'Cinta suave',
      description: '30 min a ritmo cómodo en cinta de correr.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 3 min + carrera suave 5 min en cinta', '8 min'),
        blk('Bloque principal', '30 min a ritmo cómodo en cinta, inclinación 1%', '30 min'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos', '8 min'),
      ],
    },
    {
      title: 'Series en cinta',
      description: '6×400 m a ritmo rápido con 90 s de descanso.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 15 min en cinta + drills', '15 min'),
        blk('Series', '6 × 400 m a ritmo 5K con 90 s de descanso caminando', '6 × 400 m'),
        blk('Enfriamiento', 'Carrera suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Inclinación en cinta',
      description: '40 min alternando inclinación 0-8%.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 10 min en cinta, inclinación 0%', '10 min'),
        blk('Inclinación', '40 min alternando 2 min al 0% y 2 min al 8%', '40 min'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Tempo run en cinta',
      description: '35 min: 10 calentamiento + 15 tempo + 10 enfriamiento.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', '10 min carrera suave en cinta', '10 min'),
        blk('Tempo', '15 min a ritmo umbral en cinta, inclinación 1%', '15 min @ tempo'),
        blk('Enfriamiento', '10 min carrera suave + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Fartlek en cinta',
      description: '40 min alternando ritmos cada 2 min.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 10 min en cinta', '10 min'),
        blk('Fartlek', '40 min alternando 2 min rápido y 2 min suave', '40 min'),
        blk('Enfriamiento', 'Carrera suave 5 min + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Cinta larga',
      description: '60 min a ritmo conversacional.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Marcha 3 min + carrera suave 5 min', '8 min'),
        blk('Bloque principal', '60 min a ritmo conversacional en cinta, inclinación 1%', '60 min'),
        blk('Enfriamiento', 'Marcha 3 min + estiramientos', '8 min'),
      ],
    },
    {
      title: 'Sprints en cinta',
      description: '10×200 m al máximo con 2 min de descanso.',
      emoji: '🏃',
      blocks: [
        blk('Calentamiento', 'Carrera suave 15 min + 4 progresiones de 50 m', '20 min'),
        blk('Sprints', '10 × 200 m al 95% con 2 min de descanso caminando', '10 × 200 m'),
        blk('Enfriamiento', 'Carrera suave 10 min + estiramientos', '15 min'),
      ],
    },
    {
      title: 'Cinta regenerativa',
      description: '25 min muy suaves para activar piernas.',
      emoji: '🏃',
      blocks: [
        blk('Bloque principal', '25 min muy suaves en cinta, respiración nasal', '25 min @ Zona 1'),
        blk('Movilidad', 'Estiramientos de gemelos e isquiotibiales', '5 min'),
      ],
    },
  ],
  elliptical: [
    {
      title: 'Elíptica suave',
      description: '30 min a ritmo cómodo, resistencia media.',
      emoji: '🤸',
      blocks: [
        blk('Calentamiento', '5 min resistencia baja', '5 min'),
        blk('Bloque principal', '30 min a ritmo cómodo, resistencia media, brazos activos', '30 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Intervalos en elíptica',
      description: '8×2 min fuerte / 2 min suave.',
      emoji: '🤸',
      blocks: [
        blk('Calentamiento', '10 min resistencia baja', '10 min'),
        blk('Intervalos', '8 × 2 min resistencia alta / 2 min resistencia baja', '32 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Elíptica larga',
      description: '45-60 min a ritmo aeróbico.',
      emoji: '🤸',
      blocks: [
        blk('Calentamiento', '5 min resistencia baja', '5 min'),
        blk('Bloque principal', '45-60 min a ritmo aeróbico, resistencia media', '45-60 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Resistencia progresiva',
      description: '40 min aumentando resistencia cada 5 min.',
      emoji: '🤸',
      blocks: [
        blk('Calentamiento', '5 min resistencia baja', '5 min'),
        blk('Progresiva', '40 min aumentando 1 nivel de resistencia cada 5 min', '40 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Elíptica + brazos',
      description: '35 min trabajando el empuje de brazos.',
      emoji: '🤸',
      blocks: [
        blk('Calentamiento', '5 min resistencia baja', '5 min'),
        blk('Brazos', '35 min enfocando el empuje de brazos, resistencia media-alta', '35 min'),
        blk('Enfriamiento', '5 min resistencia baja + estiramientos de brazos', '10 min'),
      ],
    },
    {
      title: 'Recuperación en elíptica',
      description: '25 min muy suaves, resistencia baja.',
      emoji: '🤸',
      blocks: [
        blk('Bloque principal', '25 min muy suaves, resistencia baja, cadencia alta', '25 min @ Zona 1'),
        blk('Movilidad', 'Estiramientos de todo el cuerpo', '5 min'),
      ],
    },
  ],
  rowing: [
    {
      title: 'Remo suave',
      description: '30 min a ritmo cómodo en remo indoor.',
      emoji: '🚣',
      blocks: [
        blk('Calentamiento', '5 min ritmo bajo, drag factor 100', '5 min'),
        blk('Bloque principal', '30 min a ritmo cómodo, 22-24 strokes/min', '30 min'),
        blk('Enfriamiento', '5 min ritmo bajo + estiramientos de espalda', '10 min'),
      ],
    },
    {
      title: 'Series de remo',
      description: '6×500 m a ritmo fuerte con 2 min de descanso.',
      emoji: '🚣',
      blocks: [
        blk('Calentamiento', '10 min ritmo bajo con técnica', '10 min'),
        blk('Series', '6 × 500 m a ritmo fuerte (28-30 strokes/min) con 2 min de descanso', '6 × 500 m'),
        blk('Enfriamiento', '5 min ritmo bajo + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Remo largo',
      description: '45-60 min a ritmo aeróbico constante.',
      emoji: '🚣',
      blocks: [
        blk('Calentamiento', '5 min ritmo bajo', '5 min'),
        blk('Bloque principal', '45-60 min a ritmo aeróbico, 22-24 strokes/min', '45-60 min'),
        blk('Enfriamiento', '5 min ritmo bajo + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Remo HIIT',
      description: '10×1 min al máximo / 1 min descanso.',
      emoji: '🚣',
      blocks: [
        blk('Calentamiento', '10 min ritmo bajo con técnica', '10 min'),
        blk('HIIT', '10 × 1 min al máximo (30+ strokes/min) / 1 min descanso', '20 min'),
        blk('Enfriamiento', '5 min ritmo bajo + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Técnica de remo',
      description: '30 min enfocados en técnica: piernas, core, espalda.',
      emoji: '🚣',
      blocks: [
        blk('Calentamiento', '5 min ritmo muy bajo', '5 min'),
        blk('Técnica', '30 min enfocados en secuencia: piernas-core-espalda-brazos', '30 min'),
        blk('Enfriamiento', '5 min ritmo bajo + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Recuperación en remo',
      description: '25 min muy suaves, ritmo lento.',
      emoji: '🚣',
      blocks: [
        blk('Bloque principal', '25 min muy suaves, 18-20 strokes/min, drag factor bajo', '25 min @ Zona 1'),
        blk('Movilidad', 'Estiramientos de espalda y hombros', '5 min'),
      ],
    },
  ],
  yoga: [
    {
      title: 'Yoga Vinyasa',
      description: '45 min de flujo dinámico, sincroniza respiración y movimiento.',
      emoji: '🧘',
      blocks: [
        blk('Centrado', '5 min de respiración consciente en postura fácil', '5 min'),
        blk('Saludos al sol', '10 min de Sun Salutation A y B, 5 rondas', '10 min'),
        blk('Flujo Vinyasa', '25 min de secuencias dinámicas: guerreros, triángulo, perro boca arriba', '25 min'),
        blk('Savasana', '5 min de relajación final', '5 min'),
      ],
    },
    {
      title: 'Yoga Hatha',
      description: '50 min de posturas mantenidas, trabaja alineación.',
      emoji: '🧘',
      blocks: [
        blk('Centrado', '5 min de respiración y conexión', '5 min'),
        blk('Posturas de pie', '20 min: guerrero I y II, triángulo, postura del árbol, 5 respiraciones cada una', '20 min'),
        blk('Posturas de suelo', '20 min: torsión espinal, flexión adelante, cobra, puente, 8 respiraciones cada una', '20 min'),
        blk('Relajación', '5 min de Savasana', '5 min'),
      ],
    },
    {
      title: 'Yoga restaurador',
      description: '40 min de posturas suaves con soportes, relaja el sistema nervioso.',
      emoji: '🧘',
      blocks: [
        blk('Centrado', '5 min de respiración suave', '5 min'),
        blk('Posturas restauradoras', '30 min: postura del niño, piernas en la pared, torsión supina con cojines', '30 min'),
        blk('Savasana', '5 min de relajación profunda', '5 min'),
      ],
    },
    {
      title: 'Yoga matutino',
      description: '30 min para despertar el cuerpo y activar la energía.',
      emoji: '🧘',
      blocks: [
        blk('Respiración', '5 min de respiración profunda en postura fácil', '5 min'),
        blk('Activación', '10 min de Sun Salutation A, 5 rondas a ritmo suave', '10 min'),
        blk('Posturas energéticas', '10 min: guerrero I, perro boca abajo, gato-vaca, postura del árbol', '10 min'),
        blk('Cierre', '5 min de Savasana', '5 min'),
      ],
    },
    {
      title: 'Yoga nocturno',
      description: '35 min de posturas relajantes para dormir mejor.',
      emoji: '🧘',
      blocks: [
        blk('Centrado', '5 min de respiración profunda', '5 min'),
        blk('Posturas suaves', '25 min: flexión adelante, torsión supina, postura del niño, piernas en la pared', '25 min'),
        blk('Savasana', '5 min de relajación final con respiración consciente', '5 min'),
      ],
    },
    {
      title: 'Yoga de fuerza',
      description: '45 min de posturas exigentes que tonifican todo el cuerpo.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '10 min de Sun Salutation B, 5 rondas', '10 min'),
        blk('Posturas de fuerza', '25 min: guerrero III, plancha, chaturanga, silla, tabla lateral, 5 respiraciones cada una', '25 min'),
        blk('Estiramientos', '5 min de contraposturas: cobra, puente, torsión', '5 min'),
        blk('Savasana', '5 min de relajación', '5 min'),
      ],
    },
    {
      title: 'Yoga de cadera',
      description: '40 min enfocado en apertura de cadera y flexibilidad.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '5 min de gato-vaca y respiración', '5 min'),
        blk('Apertura de cadera', '30 min: paloma, lagarto, mariposa, loto preparatorio, 8 respiraciones cada una', '30 min'),
        blk('Relajación', '5 min de Savasana', '5 min'),
      ],
    },
    {
      title: 'Meditación y respiración',
      description: '30 min de pranayama y meditación guiada.',
      emoji: '🧘',
      blocks: [
        blk('Pranayama', '15 min de respiración alterna, respiración de fuego y ujjayi', '15 min'),
        blk('Meditación', '15 min de meditación guiada con atención en la respiración', '15 min'),
      ],
    },
  ],
  pilates: [
    {
      title: 'Pilates mat',
      description: '45 min en esterilla, trabaja core y alineación.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '5 min de respiración y conexión con el core', '5 min'),
        blk('Serie de Pilates', '35 min: the hundred, roll up, single leg stretch, double leg stretch, saw, 6 rep cada uno', '35 min'),
        blk('Enfriamiento', '5 min de estiramientos de espalda y cadera', '5 min'),
      ],
    },
    {
      title: 'Pilates con máquinas',
      description: '50 min en reformer, resistencia progresiva.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '5 min de footwork en reformer, resistencia baja', '5 min'),
        blk('Reformer', '40 min: footwork, abdominal prep, knee stretch, running, 8 rep cada uno', '40 min'),
        blk('Enfriamiento', '5 min de estiramientos en reformer', '5 min'),
      ],
    },
    {
      title: 'Pilates principiantes',
      description: '40 min de fundamentos: respiración, core, alineación.',
      emoji: '🧘',
      blocks: [
        blk('Fundamentos', '10 min de respiración costal y activación del core', '10 min'),
        blk('Ejercicios básicos', '25 min: the hundred (modificado), pelvic curl, spine twist, 6 rep cada uno', '25 min'),
        blk('Enfriamiento', '5 min de relajación y estiramientos', '5 min'),
      ],
    },
    {
      title: 'Pilates espalda',
      description: '45 min enfocado en fortalecer la espalda y postura.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '5 min de respiración y movilidad de columna', '5 min'),
        blk('Espalda', '35 min: swan prep, swimming, spine stretch, breaststroke, 8 rep cada uno', '35 min'),
        blk('Enfriamiento', '5 min de estiramientos de espalda', '5 min'),
      ],
    },
    {
      title: 'Pilates piernas y glúteos',
      description: '45 min de trabajo de tren inferior.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '5 min de movilidad de cadera', '5 min'),
        blk('Piernas y glúteos', '35 min: leg circles, single leg kick, double leg kick, side kicks, 8 rep cada uno', '35 min'),
        blk('Enfriamiento', '5 min de estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Pilates avanzado',
      description: '50 min de ejercicios complejos y control.',
      emoji: '🧘',
      blocks: [
        blk('Calentamiento', '5 min de the hundred y respiración', '5 min'),
        blk('Avanzado', '40 min: teaser, jackknife, control balance, boomerang, 6 rep cada uno', '40 min'),
        blk('Enfriamiento', '5 min de estiramientos profundos', '5 min'),
      ],
    },
  ],
  barre: [
    {
      title: 'Barre clásico',
      description: '50 min combinando ballet, pilates y yoga.',
      emoji: '🩰',
      blocks: [
        blk('Calentamiento', '10 min de movimientos articulares y respiración', '10 min'),
        blk('Barre', '35 min: pliés, relevés, arabesque, attitudes con pulsaciones, 16 rep cada uno', '35 min'),
        blk('Enfriamiento', '5 min de estiramientos de piernas y espalda', '5 min'),
      ],
    },
    {
      title: 'Barre piernas',
      description: '45 min enfocado en piernas y glúteos con barra.',
      emoji: '🩰',
      blocks: [
        blk('Calentamiento', '5 min de movilidad de cadera', '5 min'),
        blk('Piernas y glúteos', '35 min: pliés en 1ª y 2ª posición, relevés, leg lifts, 16 rep cada uno', '35 min'),
        blk('Enfriamiento', '5 min de estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Barre core',
      description: '40 min de trabajo intenso de core y postura.',
      emoji: '🩰',
      blocks: [
        blk('Calentamiento', '5 min de respiración y activación del core', '5 min'),
        blk('Core', '30 min: plank holds, crunches con barra, oblique twists, 16 rep cada uno', '30 min'),
        blk('Enfriamiento', '5 min de estiramientos de core y espalda', '5 min'),
      ],
    },
    {
      title: 'Barre principiantes',
      description: '45 min de fundamentos y técnica básica.',
      emoji: '🩰',
      blocks: [
        blk('Fundamentos', '10 min de posturas básicas y respiración', '10 min'),
        blk('Técnica básica', '30 min: pliés básicos, relevés lentos, postura de la tabla, 12 rep cada uno', '30 min'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
    {
      title: 'Barre avanzado',
      description: '50 min de secuencias complejas y resistencia.',
      emoji: '🩰',
      blocks: [
        blk('Calentamiento', '5 min de Sun Salutation y movilidad', '5 min'),
        blk('Avanzado', '40 min: secuencias complejas con pulsaciones, grand battement, frappé, 16 rep cada uno', '40 min'),
        blk('Enfriamiento', '5 min de estiramientos profundos', '5 min'),
      ],
    },
    {
      title: 'Barre + estiramientos',
      description: '50 min de barre seguido de estiramientos profundos.',
      emoji: '🩰',
      blocks: [
        blk('Barre', '35 min: pliés, relevés, arabesque, 16 rep cada uno', '35 min'),
        blk('Estiramientos', '15 min de estiramientos profundos de piernas, cadera y espalda', '15 min'),
      ],
    },
  ],
  stretching: [
    {
      title: 'Estiramientos generales',
      description: '30 min de estiramientos de todo el cuerpo.',
      emoji: '🤸',
      blocks: [
        blk('Cuello y hombros', '5 min de estiramientos suaves de cuello y rotaciones de hombros', '5 min'),
        blk('Tren superior', '10 min de estiramientos de pecho, espalda y brazos, 30 s cada uno', '10 min'),
        blk('Tren inferior', '15 min de estiramientos de isquiotibiales, cuádriceps, gemelos y cadera, 30 s cada uno', '15 min'),
      ],
    },
    {
      title: 'Movilidad articular',
      description: '25 min de rotaciones suaves de todas las articulaciones.',
      emoji: '🤸',
      blocks: [
        blk('Movilidad superior', '10 min de rotaciones de cuello, hombros, codos y muñecas', '10 min'),
        blk('Movilidad columna', '5 min de cat-cow y rotaciones de columna', '5 min'),
        blk('Movilidad inferior', '10 min de rotaciones de cadera, rodillas y tobillos', '10 min'),
      ],
    },
    {
      title: 'Estiramientos profundos',
      description: '40 min manteniendo cada estiramiento 60 s.',
      emoji: '🤸',
      blocks: [
        blk('Cadena posterior', '15 min de estiramientos de isquiotibiales, gemelos y espalda baja, 60 s cada uno', '15 min'),
        blk('Cadera y glúteos', '15 min de estiramientos de cadera (paloma, lagarto, mariposa), 60 s cada uno', '15 min'),
        blk('Tren superior', '10 min de estiramientos de pecho, hombros y brazos, 60 s cada uno', '10 min'),
      ],
    },
    {
      title: 'Foam roller y liberación',
      description: '30 min de foam roller en todo el cuerpo.',
      emoji: '🤸',
      blocks: [
        blk('Piernas', '15 min de foam roller en cuádriceps, isquiotibiales, gemelos y IT band, 2 min cada zona', '15 min'),
        blk('Espalda', '10 min de foam roller en dorsal, lumbar y cuello, 2 min cada zona', '10 min'),
        blk('Movilidad', '5 min de estiramientos suaves post-roller', '5 min'),
      ],
    },
    {
      title: 'Movilidad de cadera',
      description: '35 min de apertura de cadera y flexores.',
      emoji: '🤸',
      blocks: [
        blk('Calentamiento', '5 min de gato-vaca y movilidad de columna', '5 min'),
        blk('Apertura de cadera', '25 min: paloma, lagarto, mariposa, loto preparatorio, 60 s cada uno', '25 min'),
        blk('Enfriamiento', '5 min de relajación en postura del niño', '5 min'),
      ],
    },
    {
      title: 'Estiramientos de espalda',
      description: '30 min para liberar tensión de espalda y cuello.',
      emoji: '🤸',
      blocks: [
        blk('Cuello y trapecios', '10 min de estiramientos suaves de cuello y trapecios, 30 s cada uno', '10 min'),
        blk('Columna', '10 min de cat-cow, torsión espinal y cobra, 30 s cada uno', '10 min'),
        blk('Dorsal y lumbar', '10 min de estiramientos de dorsal y lumbar, 30 s cada uno', '10 min'),
      ],
    },
  ],
  padel: [
    {
      title: 'Partido de pádel',
      description: '60-90 min de partido, combina sprints y juego de pala.',
      emoji: '🎾',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + golpes suaves', '10 min'),
        blk('Partido', '60-90 min de partido, combina sprints, cambios de dirección y juego de pala', '60-90 min'),
        blk('Enfriamiento', '5 min de estiramientos de piernas y brazos', '5 min'),
      ],
    },
    {
      title: 'Entrenamiento de pádel',
      description: '60 min de técnica: golpes, voleas y saques.',
      emoji: '🎾',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + golpes suaves', '10 min'),
        blk('Técnica', '60 min: 20 min de golpes de derecha, 20 min de voleas, 20 min de saques', '60 min'),
        blk('Enfriamiento', '5 min de estiramientos de brazos y piernas', '5 min'),
      ],
    },
    {
      title: 'Pádel dobles',
      description: '90 min de partido de dobles, trabaja coordinación.',
      emoji: '🎾',
      blocks: [
        blk('Calentamiento', '10 min de movilidad y golpes', '10 min'),
        blk('Partido de dobles', '90 min de partido de dobles, trabaja coordinación y comunicación', '90 min'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
    {
      title: 'Técnica de pádel',
      description: '45 min de ejercicios de pared y bandeja.',
      emoji: '🎾',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + golpes suaves', '10 min'),
        blk('Técnica', '35 min: 15 min de ejercicios de pared, 10 min de bandeja, 10 min de remate', '35 min'),
        blk('Enfriamiento', '5 min de estiramientos de brazos', '5 min'),
      ],
    },
    {
      title: 'Pádel intenso',
      description: '75 min de partido competitivo, alta intensidad.',
      emoji: '🎾',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + golpes fuertes', '10 min'),
        blk('Partido intenso', '75 min de partido competitivo, alta intensidad', '75 min'),
        blk('Enfriamiento', '5 min de estiramientos de piernas y brazos', '5 min'),
      ],
    },
    {
      title: 'Pádel recreativo',
      description: '60 min de partido relajado con amigos.',
      emoji: '🎾',
      blocks: [
        blk('Calentamiento', '5 min de movilidad', '5 min'),
        blk('Partido', '60 min de partido relajado con amigos', '60 min'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
  ],
  crossfit: [
    {
      title: 'WOD AMRAP',
      description: 'AMRAP 20 min: 10 burpees, 15 air squats, 10 push-ups.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + 500 m row + 10 air squats', '10 min'),
        blk('WOD AMRAP', '20 min AMRAP: 10 burpees, 15 air squats, 10 push-ups. Máximas rondas posibles', '20 min AMRAP'),
        blk('Enfriamiento', '5 min de estiramientos y foam roller', '5 min'),
      ],
    },
    {
      title: 'WOD For Time',
      description: 'For Time: 21-15-9 thrusters y pull-ups.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + thrusters con barra vacía', '10 min'),
        blk('WOD For Time', 'For Time: 21-15-9 thrusters (40/30 kg) y pull-ups. Termina lo antes posible', '21-15-9'),
        blk('Enfriamiento', '5 min de estiramientos de hombros y espalda', '5 min'),
      ],
    },
    {
      title: 'WOD EMOM',
      description: 'EMOM 15 min: min 1 wall balls, min 2 box jumps, min 3 KB swings.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + practice de wall balls y box jumps', '10 min'),
        blk('WOD EMOM', 'EMOM 15 min: min 1 → 15 wall balls, min 2 → 10 box jumps, min 3 → 15 kettlebell swings', '15 min EMOM'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
    {
      title: 'Hero WOD',
      description: 'Murph: 1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '15 min de movilidad + carrera suave 800 m', '15 min'),
        blk('Murph', '1 mile run, 100 pull-ups, 200 push-ups, 300 squats, 1 mile run (con chaleco)', 'For Time'),
        blk('Enfriamiento', '10 min de estiramientos profundos', '10 min'),
      ],
    },
    {
      title: 'Olympic lifting',
      description: 'Técnica de snatch y clean & jerk, 5×3 con barra.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '15 min de movilidad + barra vacía: snatch y clean drills', '15 min'),
        blk('Snatch', '5 × 3 repeticiones con barra, técnica, descansa 2 min', '5 × 3'),
        blk('Clean & Jerk', '5 × 3 repeticiones con barra, técnica, descansa 2 min', '5 × 3'),
        blk('Enfriamiento', '5 min de estiramientos de hombros y cadera', '5 min'),
      ],
    },
    {
      title: 'Gymnastics skills',
      description: '20 min de trabajo de muscle-ups, handstands y rope climbs.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad de hombros y muñecas', '10 min'),
        blk('Gymnastics', '20 min de trabajo de muscle-ups, handstands y rope climbs', '20 min'),
        blk('Enfriamiento', '5 min de estiramientos de hombros', '5 min'),
      ],
    },
    {
      title: 'Metcon intenso',
      description: '12 min AMRAP: 10 deadlifts, 15 burpees, 200 m sprint.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + deadlifts con barra vacía', '10 min'),
        blk('Metcon', '12 min AMRAP: 10 deadlifts (60 kg), 15 burpees, 200 m sprint', '12 min AMRAP'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
    {
      title: 'Chipper WOD',
      description: 'For Time: 50-40-30-20-10 double-unders, sit-ups, push-ups.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + practice de double-unders', '10 min'),
        blk('Chipper', 'For Time: 50-40-30-20-10 double-unders, sit-ups, push-ups', 'For Time'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
    {
      title: 'Strength + Metcon',
      description: '5×5 back squat + AMRAP 8 min de 15 thrusters y 15 burpees.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + sentadillas con barra vacía', '10 min'),
        blk('Fuerza', '5 × 5 back squat a 85% 1RM, descansa 3 min', '5 × 5'),
        blk('Metcon', 'AMRAP 8 min de 15 thrusters y 15 burpees', '8 min AMRAP'),
        blk('Enfriamiento', '5 min de estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Open-style WOD',
      description: '18 min cap: 15 snatches, 15 chest-to-bar, 15 toes-to-bar.',
      emoji: '🤸‍♂️',
      blocks: [
        blk('Calentamiento', '15 min de movilidad + practice de snatch y toes-to-bar', '15 min'),
        blk('WOD', '18 min cap: 15 snatches, 15 chest-to-bar, 15 toes-to-bar', '18 min cap'),
        blk('Enfriamiento', '5 min de estiramientos de hombros y core', '5 min'),
      ],
    },
  ],
  hyrox: [
    {
      title: 'HYROX simulación',
      description: '8 × 1 km carrera + 8 estaciones funcionales.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de carrera suave + movilidad', '10 min'),
        blk('HYROX', '8 × (1 km carrera + estación): sled push, burpee broad jump, rowing, wall balls, farmer carry, sandbag lunge, sled pull, 100 m sprint', '8 × 1 km + 8 estaciones'),
        blk('Enfriamiento', '10 min de carrera suave + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Bloque de fuerza HYROX',
      description: '100 m sled push, 50 m burpee broad jump, 100 m rowing. 4 rondas.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de movilidad + práctica de sled push', '10 min'),
        blk('Circuito de fuerza', '4 rondas: 100 m sled push, 50 m burpee broad jump, 100 m rowing', '4 rondas'),
        blk('Enfriamiento', '5 min de estiramientos de tren superior y core', '5 min'),
      ],
    },
    {
      title: 'Running + Wall Balls',
      description: '1 km carrera + 50 wall balls, repite 4 veces.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de carrera suave + wall balls de práctica', '10 min'),
        blk('Circuito', '4 rondas: 1 km carrera a ritmo 5K + 50 wall balls (20 kg)', '4 × (1 km + 50 wall balls)'),
        blk('Enfriamiento', '5 min de carrera suave + estiramientos', '10 min'),
      ],
    },
    {
      title: 'HYROX endurance',
      description: '2 km carrera continua + 100 lunges + 100 kettlebell swings.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de carrera suave + movilidad', '10 min'),
        blk('Endurance', '2 km carrera continua a ritmo moderado + 100 lunges + 100 kettlebell swings (24 kg)', '2 km + 100 lunges + 100 KB swings'),
        blk('Enfriamiento', '5 min de estiramientos de piernas', '5 min'),
      ],
    },
    {
      title: 'Estaciones mixtas',
      description: 'Sled push 50 m, 50 m farmer carry, 100 m sandbag lunge, 1 km run.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de carrera suave + movilidad', '10 min'),
        blk('Estaciones', 'Sled push 50 m, 50 m farmer carry, 100 m sandbag lunge, 1 km run. 3 rondas', '3 rondas'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
    {
      title: 'HYROX sprint',
      description: '8 × 400 m carrera a ritmo rápido + 8 × 20 push-ups.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de carrera suave + drills', '10 min'),
        blk('Sprint circuit', '8 × 400 m carrera a ritmo rápido + 20 push-ups, descansa 60 s', '8 × (400 m + 20 push-ups)'),
        blk('Enfriamiento', '5 min de carrera suave + estiramientos', '10 min'),
      ],
    },
    {
      title: 'Competición HYROX',
      description: 'Simula una carrera completa de HYROX. Registra tiempo y desglose.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '15 min de carrera suave + movilidad + práctica de estaciones', '15 min'),
        blk('HYROX completo', '8 × (1 km carrera + estación): sled push, burpee broad jump, rowing, wall balls, farmer carry, sandbag lunge, sled pull, 100 m sprint', 'Carrera completa'),
        blk('Enfriamiento', '10 min de carrera suave + estiramientos profundos', '10 min'),
      ],
    },
    {
      title: 'HYROX skill day',
      description: 'Técnica de sled push, burpee broad jump y wall balls. 45 min.',
      emoji: '🏃‍♂️',
      blocks: [
        blk('Calentamiento', '10 min de carrera suave + movilidad', '10 min'),
        blk('Técnica', '45 min de técnica: 15 min sled push, 15 min burpee broad jump, 15 min wall balls', '45 min'),
        blk('Enfriamiento', '5 min de estiramientos', '5 min'),
      ],
    },
  ],
};

const RECOVERY_TEMPLATES: TrainingTemplate[] = [
  {
    title: 'Recuperación activa',
    description: '20-30 min de movilidad, estiramientos y foam roller.',
    emoji: '🧘',
    blocks: [
      blk('Movilidad', '10 min de rotaciones articulares suaves', '10 min'),
      blk('Estiramientos', '10 min de estiramientos de cadena posterior y cadera', '10 min'),
      blk('Foam roller', '10 min de foam roller en piernas y espalda', '10 min'),
    ],
  },
  {
    title: 'Yoga suave',
    description: 'Sesión de 30 min de yoga restaurador.',
    emoji: '🧘',
    blocks: [
      blk('Centrado', '5 min de respiración consciente', '5 min'),
      blk('Posturas restauradoras', '20 min: postura del niño, piernas en la pared, torsión supina', '20 min'),
      blk('Savasana', '5 min de relajación', '5 min'),
    ],
  },
  {
    title: 'Marcha de recuperación',
    description: '30 min a paso muy suave, despeja la mente.',
    emoji: '🚶',
    blocks: [
      blk('Marcha suave', '30 min a paso muy suave, respiración profunda', '30 min'),
      blk('Estiramientos', '5 min de estiramientos de piernas', '5 min'),
    ],
  },
  {
    title: 'Estiramientos profundos',
    description: '25 min de estiramientos de todo el cuerpo.',
    emoji: '🧘',
    blocks: [
      blk('Tren inferior', '15 min de estiramientos de isquiotibiales, cuádriceps, gemelos y cadera, 60 s cada uno', '15 min'),
      blk('Tren superior', '10 min de estiramientos de espalda, hombros y cuello, 30 s cada uno', '10 min'),
    ],
  },
  {
    title: 'Movilidad articular',
    description: '20 min de movilidad de cadera, hombros y columna.',
    emoji: '🧘',
    blocks: [
      blk('Cadera y columna', '10 min de movilidad de cadera (cat-cow, paloma, loto) y columna', '10 min'),
      blk('Hombros y tobillos', '10 min de movilidad de hombros y tobillos', '10 min'),
    ],
  },
  {
    title: 'Rodada regenerativa',
    description: '20 min en bici muy suaves, sin fuerza.',
    emoji: '🚴',
    blocks: [
      blk('Rodada suave', '20 min en bici muy suaves, sin fuerza, cadencia alta', '20 min @ Zona 1'),
      blk('Estiramientos', '5 min de estiramientos de piernas', '5 min'),
    ],
  },
];

const REST_TEMPLATES: TrainingTemplate[] = [
  {
    title: 'Día de descanso',
    description: 'Descanso total. Hidrátate y duerme bien.',
    emoji: '😴',
    blocks: [
      blk('Descanso', 'Descanso total del cuerpo. Hidrátate (2-3 L de agua) y duerme 7-8 h', 'Todo el día'),
    ],
  },
  {
    title: 'Descanso reparador',
    description: 'Pausa completa. Tu cuerpo se fortalece hoy.',
    emoji: '😴',
    blocks: [
      blk('Descanso', 'Pausa completa. Tu cuerpo se fortalece hoy. Si quieres, sal a caminar 15 min', 'Todo el día'),
    ],
  },
];

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateWeeklyPlan(
  goal: Goal,
  sports: string[],
  weekStartDate: Date,
  existingPlan?: PlanDay[],
): PlanDay[] {
  const monday = getMondayOfWeek(weekStartDate);
  const userSports = sports.length > 0 ? sports : ['combined'];

  const trainingDaysCount =
    goal === 'general_health' ? 4 : goal === 'lose_weight' ? 5 : goal === 'define' ? 5 : goal === 'gain_strength' ? 5 : 5;
  const recoveryDaysCount = goal === 'gain_muscle' || goal === 'gain_strength' ? 1 : goal === 'define' ? 1 : 1;
  const restDaysCount = 7 - trainingDaysCount - recoveryDaysCount;

  const dayPlan: ('training' | 'recovery' | 'rest')[] = [];
  for (let i = 0; i < trainingDaysCount; i++) dayPlan.push('training');
  for (let i = 0; i < recoveryDaysCount; i++) dayPlan.push('recovery');
  for (let i = 0; i < restDaysCount; i++) dayPlan.push('rest');

  const weekNumber = Math.floor(monday.getTime() / (1000 * 60 * 60 * 24 * 7));

  for (let i = dayPlan.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(weekNumber + i) * (i + 1));
    [dayPlan[i], dayPlan[j]] = [dayPlan[j], dayPlan[i]];
  }

  if (dayPlan[6] === 'training') {
    const restIdx = dayPlan.indexOf('rest');
    if (restIdx !== -1) {
      [dayPlan[6], dayPlan[restIdx]] = [dayPlan[restIdx], dayPlan[6]];
    }
  }

  let trainingIdx = 0;
  let recoveryIdx = 0;
  let restIdx = 0;

  return dayPlan.map((type, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = formatDate(date);
    const dayName = DAY_NAMES[i];

    if (existingPlan && existingPlan[i] && existingPlan[i].date === dateStr) {
      return existingPlan[i];
    }

    let day: PlanDay;

    if (type === 'training') {
      const sportKey = userSports[trainingIdx % userSports.length];
      const templates = TRAINING_TEMPLATES[sportKey] || TRAINING_TEMPLATES.combined;
      const template = pickRandom(templates, weekNumber + trainingIdx);
      trainingIdx++;
      day = {
        day: dayName,
        date: dateStr,
        sport: sportKey,
        type: 'training',
        title: template.title,
        description: template.description,
        emoji: SPORT_EMOJIS[sportKey] || template.emoji,
        completed: false,
        blocks: template.blocks.map(b => ({ ...b })),
      };
    } else if (type === 'recovery') {
      const template = pickRandom(RECOVERY_TEMPLATES, weekNumber + recoveryIdx);
      recoveryIdx++;
      day = {
        day: dayName,
        date: dateStr,
        sport: 'recovery',
        type: 'recovery',
        title: template.title,
        description: template.description,
        emoji: template.emoji,
        completed: false,
        blocks: template.blocks.map(b => ({ ...b })),
      };
    } else {
      const template = pickRandom(REST_TEMPLATES, weekNumber + restIdx);
      restIdx++;
      day = {
        day: dayName,
        date: dateStr,
        sport: 'rest',
        type: 'rest',
        title: template.title,
        description: template.description,
        emoji: template.emoji,
        completed: false,
        blocks: template.blocks.map(b => ({ ...b })),
      };
    }

    return applyDetailedWorkoutToDay(day, goal, weekNumber + i);
  });
}

export function getMondayString(date: Date): string {
  return formatDate(getMondayOfWeek(date));
}

export function getWeekDates(weekStart: string): Date[] {
  const start = new Date(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function getSportLabel(key: string): string {
  const sport = DEFAULT_SPORTS.find((s) => s.key === key);
  return sport ? sport.label : key;
}

export function getSportEmoji(key: string): string {
  return SPORT_EMOJIS[key] || '🏅';
}

export function fixPlanEmojis(days: PlanDay[]): PlanDay[] {
  return days.map((d) => ({
    ...d,
    emoji: d.type === 'rest' ? '😴' : d.type === 'recovery' ? d.emoji : (SPORT_EMOJIS[d.sport] || d.emoji),
  }));
}

function inferBlockType(name: string): BlockType {
  const lower = name.toLowerCase();
  if (lower.includes('calentamiento') || lower.includes('calent') || lower === 'centrado' || lower.includes('movilidad') && lower.includes('calent')) return 'warmup';
  if (lower.includes('enfriamiento') || lower.includes('enfri') || lower.includes('estiramientos') && !lower.includes('fuerza') || lower === 'savasana' || lower === 'relajación' || lower === 'relajacion' || lower.includes('enfriamiento')) return 'cooldown';
  if (lower === 'descanso' || lower === 'info') return 'info';
  return 'main';
}

const SPORT_TIPS: Record<string, string[]> = {
  running: [
    'Calienta 5-10 min con trote suave antes de aumentar el ritmo',
    'Mantén una cadencia de 170-180 pasos por minuto para mayor eficiencia',
    'Aterriza con el metatarso, no con el talón, para reducir impacto articular',
    'Hidrátate cada 15-20 min si la sesión supera los 30 min',
    'Finaliza con 5 min de trote muy suave y estiramientos de gemelos e isquiotibiales',
  ],
  walking: [
    'Mantén una postura erguida con la mirada al frente, no al suelo',
    'Brazos flexionados a 90°, balanceándolos de forma natural',
    'Pasa a un trote suave si te sientes con energía',
    'Usa calzado cómodo y transpirable para evitar ampollas',
    'Aprovecha para disfrutar del entorno y despejar la mente',
  ],
  strength: [
    'Prioriza la técnica sobre el peso: una ejecución limpia previene lesiones',
    'Calienta con movilidad articular y 2 series ligeras antes de cargar peso',
    'Controla la fase excéntrica (descenso) en 2-3 segundos para mayor hipertrofia',
    'Respira out en el esfuerzo y inhala en la fase de retorno',
    'Finaliza con core y compensación: plancha, bird-dog y estiramientos',
  ],
  cycling: [
    'Ajusta la altura del sillín para que la pierna quede casi extendida en el punto más bajo',
    'Usa cambios cortos en subidas para proteger las rodillas y mantener cadencia',
    'Mantén los codos ligeramente flexionados para absorber baches y vibraciones',
    'Lleva siempre agua y un kit de reparación básica',
    'Respeta las normas de circulación y usa luces si hay poca visibilidad',
  ],
  combined: [
    'Empieza siempre por la parte de fuerza cuando estés fresco',
    'Usa circuitos de 4-5 ejercicios con 30 s de descanso entre ellos',
    'Mantén la intensidad del cardio moderada para no comprometer la fuerza',
    'Hidrátate entre bloques y controla la frecuencia cardiaca',
    'Incluye 10 min de vuelta a la calma con movilidad y respiración',
  ],
  trail_running: [
    'Calienta tobillos y rodillas con movilidad antes de empezar',
    'Camina las subidas muy pronunciadas para ahorrar energía',
    'Mantén zancada corta y frecuencia alta en descensos para proteger rodillas',
    'Lleva agua y algo de comida si la ruta supera 60 min',
    'Usa calzado con agarre específico para trail',
  ],
  hiking: [
    'Calienta 5 min con movilidad de tobillos y cadera',
    'Mantén un ritmo constante, no empieces demasiado rápido',
    'Usa bastones en rutas con mucho desnivel para proteger rodillas',
    'Hidrátate cada 20-30 min, especialmente en calor',
    'Lleva calzado de senderismo con buen agarre y protección',
  ],
  mountain_bike: [
    'Ajusta la presión de neumáticos al terreno: menos presión en senderos sueltos',
    'Baja el sillín ligeramente para descensos técnicos y mejora el centro de gravedad',
    'Mira siempre 5-10 m por delante, no a la rueda delantera',
    'Frena con ambos frenos de forma progresiva, nunca bruscamente',
    'Usa siempre casco y protecciones en manos y rodillas',
  ],
  indoor_cycling: [
    'Ajusta la altura del sillín para que la pierna quede casi extendida en el punto más bajo',
    'Mantén cadencia 80-100 rpm en tramos de resistencia media',
    'Trabaja la respiración rítmica sincronizada con el pedaleo',
    'Hidrátate constantemente, el calor indoor deshidrata más rápido',
    'Enfría 5 min pedaleando sin resistencia antes de bajar',
  ],
  treadmill: [
    'Calienta 5 min a ritmo suave antes de aumentar velocidad',
    'Usa inclinación 1-2% para simular resistencia al aire libre',
    'Mantén postura erguida, no te apoyes en la barra',
    'Hidrátate cada 15-20 min, el ambiente indoor deshidrata',
    'Enfría 5 min caminando suave antes de bajar',
  ],
  elliptical: [
    'Mantén postura erguida, core activo, sin inclinarte hacia delante',
    'Empuja y tira de las manetas para trabajar tren superior',
    'Aumenta resistencia progresivamente para mayor intensidad',
    'Mantén cadencia constante de 120-160 pasos por minuto',
    'Enfría 5 min a resistencia mínima antes de terminar',
  ],
  rowing: [
    'Secuencia: piernas, core, brazos en el empuje; al revés en la vuelta',
    'Mantén la espalda recta, no redondees los hombros',
    'Tira el mango hacia el ombligo, no hacia el pecho',
    'Mantén cadencia 20-30 remadas por minuto en ritmo constante',
    'Calienta 5 min a ritmo muy suave antes de aumentar intensidad',
  ],
  yoga: [
    'Respira profundo y lento por la nariz durante toda la práctica',
    'No fuerces las posturas: ve hasta donde tu cuerpo permita sin dolor',
    'Mantén cada postura 30-60 s respirando de forma constante',
    'Usa bloques o cinturones para adaptar posturas a tu nivel',
    'Finaliza con Savasana 5-10 min para integrar',
  ],
  pilates: [
    'Activa el core en cada ejercicio: ombligo hacia la columna',
    'Respira por las costillas, expandiendo la caja torácica',
    'Prioriza la calidad del movimiento sobre la cantidad',
    'Mantén la columna en posición neutra durante los ejercicios',
    'Trabaja con control total, sin inercia ni movimientos bruscos',
  ],
  barre: [
    'Mantén postura erguida con la columna alargada en cada ejercicio',
    'Trabaja con pulsaciones pequeñas y controladas, sin rebotes',
    'Activa los glúteos en cada movimiento de pierna',
    'Respira de forma constante, no retengas el aire',
    'Usa calcetines con agarre o zapatillas de danza para mayor control',
  ],
  stretching: [
    'Nunca estires con rebotes: mantén cada posición 30-60 s de forma estática',
    'Respira profundo y lento, exhala al profundizar el estiramiento',
    'No llegues al dolor: estira hasta sentir tensión moderada, no aguda',
    'Estira todos los grupos musculares principales en cada sesión',
    'Usa foam roller antes de estirar para liberar tensión miofascial',
  ],
  padel: [
    'Calienta tobillos, rodillas y cadera con movilidad antes de jugar',
    'Mantén la pala por delante del cuerpo en posición de espera',
    'Golpea la bola de bote con la pala por debajo de la cintura',
    'Trabaja el juego de pared: deja que la bola rebote antes de golpear',
    'Hidrátate en cada cambio de lado, aunque sea corto',
  ],
  crossfit: [
    'Calienta siempre con movilidad y práctica de los movimientos del WOD',
    'Prioriza la técnica en cada repetición antes de buscar intensidad',
    'Escala los pesos y movimientos a tu nivel para evitar lesiones',
    'Respira de forma rítmica: no retengas el aire durante el esfuerzo',
    'Finaliza con estiramientos y foam roller para recuperar',
  ],
  hyrox: [
    'Calienta 10-15 min con carrera suave y práctica de las estaciones',
    'Gestiona el ritmo en cada estación: no empieces demasiado fuerte',
    'Hidrátate en cada transición entre carrera y estación funcional',
    'Mantén técnica limpia en sled push y burpee broad jump',
    'Finaliza con 10 min de carrera suave y estiramientos profundos',
  ],
};

function enrichBlocks(blocks: PlanBlock[] | undefined | null): PlanBlock[] {
  if (!blocks || !Array.isArray(blocks)) return [];
  return blocks.map(b => ({
    ...b,
    blockType: b.blockType && b.blockType !== 'main' ? b.blockType : inferBlockType(b.name || ''),
  }));
}

function enrichDay(day: PlanDay): PlanDay {
  return {
    ...day,
    blocks: enrichBlocks(day.blocks),
    sessionGoal: day.sessionGoal || day.description || '',
    tips: day.tips || SPORT_TIPS[day.sport] || SPORT_TIPS.combined,
  };
}

export function enrichPlan(days: PlanDay[] | undefined | null): PlanDay[] {
  if (!days || !Array.isArray(days)) return [];
  return days.map(enrichDay);
}
