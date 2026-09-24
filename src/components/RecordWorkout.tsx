import { useEffect, useRef, useState, useCallback } from 'react';
import type L from 'leaflet';
import { Play, Square, Check, Loader2, AlertCircle, Clock, Route, Camera, ImagePlus, X, Mountain, Gauge, Flame, Footprints, Eye, Volume2, MapPin, TrendingUp, Activity, Zap, Timer } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SPORTS, SPORT_CATEGORIES, OUTDOOR_SPORTS, SPORT_EMOJIS, PREMIUM_SPORTS } from '@/lib/types';
import { } from '@/lib/planGenerator';
import PaywallModal from '@/components/PaywallModal';
import { Lock } from 'lucide-react';

type Mode = 'gps' | 'manual' | 'record_exercise';

interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  elevation: number;
}

interface WorkoutBlock {
  name: string;
  type: 'warmup' | 'main' | 'core' | 'mobility' | 'cooldown';
  completed: boolean;
}

const WARMUP_ROUTINES: Record<string, { name: string; desc: string }[]> = {
  swimming: [
    { name: 'Movilidad de hombros', desc: '10 rotaciones de hombros hacia delante y atrás' },
    { name: 'Tobillos y gemelos', desc: '10 flexiones-extensiones de tobillo' },
    { name: 'Cadera y lumbar', desc: '5 gato-camello, 5 aperturas de cadera' },
  ],
  running: [
    { name: 'Tobillos y gemelos', desc: '10 rep circulares por cada tobillo' },
    { name: 'Cadera y flexores', desc: '5 lunges dinámicos por pierna' },
    { name: 'Rodillas suaves', desc: '20 elevaciones de rodillas en el sitio' },
  ],
  walking: [
    { name: 'Tobillos', desc: '10 rotaciones por cada tobillo' },
    { name: 'Cadera', desc: '5 aperturas de cadera por lado' },
    { name: 'Brazos y hombros', desc: '10 círculos de brazos hacia delante y atrás' },
  ],
  cycling: [
    { name: 'Cadera y lumbar', desc: '5 gato-camello, 5 sentadillas profundas' },
    { name: 'Rodillas', desc: '10 elevaciones de rodilla al pecho' },
    { name: 'Cuello y hombros', desc: 'Rotaciones suaves de cuello y hombros' },
  ],
  strength: [
    { name: 'Movilidad articular', desc: '3 min: hombros, cadera, muñecas, tobillos' },
    { name: 'Activación de core', desc: '2 min: dead bug, bird dog' },
    { name: 'Lubricación', desc: '10 sentadillas sin peso, 5 flexiones suaves' },
  ],
  combined: [
    { name: 'Movilidad general', desc: '3 min de movilidad dinámica completa' },
    { name: 'Activación', desc: '2 min: jumping jacks, sentadillas sin peso' },
    { name: 'Core', desc: '1 min de plancha frontal' },
  ],
  football: [
    { name: 'Tobillos y gemelos', desc: '10 rotaciones por tobillo' },
    { name: 'Cadera y aductores', desc: '5 aperturas laterales por lado' },
    { name: 'Sprints progresivos', desc: '3 aceleraciones progresivas de 20 m' },
  ],
  basketball: [
    { name: 'Tobillos', desc: '10 rotaciones por tobillo' },
    { name: 'Rodillas y cadera', desc: '10 sentadillas profundas' },
    { name: 'Hombros y brazos', desc: '10 círculos de brazos' },
  ],
  trail_running: [
    { name: 'Tobillos y gemelos', desc: '10 rep circulares por cada tobillo + estiramientos de tendón de Aquiles' },
    { name: 'Cadera y flexores', desc: '5 lunges dinámicos por pierna + aperturas laterales' },
    { name: 'Propiocepción', desc: '10 s apoyo a una pierna con ojos cerrados, cambia de lado' },
  ],
  hiking: [
    { name: 'Tobillos y gemelos', desc: '10 rotaciones por tobillo + estiramientos de gemelo' },
    { name: 'Cadera y flexores', desc: '5 aperturas de cadera por lado + lunges suaves' },
    { name: 'Rodillas', desc: '10 elevaciones de rodilla al pecho + sentadillas suaves' },
  ],
  mountain_bike: [
    { name: 'Cadera y lumbar', desc: '5 gato-camello, 5 sentadillas profundas' },
    { name: 'Rodillas', desc: '10 elevaciones de rodilla al pecho' },
    { name: 'Cuello y hombros', desc: 'Rotaciones suaves de cuello y hombros + muñecas' },
  ],
  indoor_cycling: [
    { name: 'Cadera y lumbar', desc: '5 gato-camello, 5 sentadillas profundas' },
    { name: 'Rodillas', desc: '10 elevaciones de rodilla al pecho' },
    { name: 'Cuello y hombros', desc: 'Rotaciones suaves de cuello y hombros' },
  ],
  treadmill: [
    { name: 'Tobillos y gemelos', desc: '10 rep circulares por cada tobillo' },
    { name: 'Cadera y flexores', desc: '5 lunges dinámicos por pierna' },
    { name: 'Rodillas suaves', desc: '20 elevaciones de rodillas en el sitio' },
  ],
  elliptical: [
    { name: 'Movilidad general', desc: '3 min: tobillos, cadera, hombros, rodillas' },
    { name: 'Activación de core', desc: '1 min: dead bug, bird dog' },
    { name: 'Brazos y hombros', desc: '10 círculos de brazos hacia delante y atrás' },
  ],
  rowing: [
    { name: 'Movilidad de hombros y espalda', desc: '10 rotaciones de hombros + gato-camello' },
    { name: 'Cadera y flexores', desc: '5 sentadillas suaves + aperturas de cadera' },
    { name: 'Core', desc: '1 min de plancha frontal para activar core' },
  ],
  yoga: [
    { name: 'Respiración consciente', desc: '3 min de respiración profunda por la nariz' },
    { name: 'Saludo al sol suave', desc: '3 rondas de Surya Namaskar a ritmo lento' },
    { name: 'Movilidad articular', desc: '2 min: hombros, cadera, columna, tobillos' },
  ],
  pilates: [
    { name: 'Respiración costal', desc: '2 min de respiración expandiendo las costillas' },
    { name: 'Activación de core', desc: '2 min: dead bug, bird dog, centavo' },
    { name: 'Movilidad de columna', desc: '5 gato-camello + rotaciones suaves de columna' },
  ],
  barre: [
    { name: 'Movilidad de cadera', desc: '5 aperturas de cadera por lado + rond de jambe' },
    { name: 'Activación de core', desc: '1 min de plancha frontal' },
    { name: 'Tobillos y pies', desc: '10 relevés (subir de puntas) lentos' },
  ],
  stretching: [
    { name: 'Respiración consciente', desc: '2 min de respiración profunda y lenta' },
    { name: 'Movilidad articular', desc: '3 min de rotaciones suaves de todas las articulaciones' },
    { name: 'Foam roller suave', desc: '3 min de foam roller en grupos musculares grandes' },
  ],
  padel: [
    { name: 'Tobillos y gemelos', desc: '10 rotaciones por tobillo + estiramientos de Aquiles' },
    { name: 'Cadera y aductores', desc: '5 aperturas laterales por lado + lunges' },
    { name: 'Hombros y brazos', desc: '10 círculos de brazos + movilidad de muñecas con la pala' },
  ],
  crossfit: [
    { name: 'Movilidad general', desc: '5 min: hombros, cadera, tobillos, muñecas' },
    { name: 'Activación', desc: '3 rondas: 10 air squats, 10 push-ups, 10 sit-ups' },
    { name: 'Calentamiento específico del WOD', desc: '2-3 rondas del WOD con peso reducido o sin peso' },
  ],
  hyrox: [
    { name: 'Movilidad general', desc: '5 min: hombros, cadera, tobillos, columna' },
    { name: 'Activación de carrera', desc: '5 min de trote suave + 5 aceleraciones progresivas de 30 m' },
    { name: 'Activación de estaciones', desc: '10 squats, 10 push-ups, 10 kettlebell swings con peso ligero' },
  ],
};

const COOLDOWN_ROUTINES = [
  { name: 'Estiramientos de piernas', desc: 'Isquios, cuádriceps, gemelos: 30 s cada uno' },
  { name: 'Movilidad de cadera', desc: 'Aperturas suaves, 1 min total' },
  { name: 'Respiración guiada', desc: '3 min: inhala 4 s, retiene 4 s, exhala 6 s' },
];

const TECHNIQUE_GUIDES: Record<string, { title: string; tips: string[] }> = {
  swimming: {
    title: 'Técnica de natación',
    tips: ['Posición hidrodinámica del cuerpo', 'Brazada larga y relajada', 'Respiración lateral cada 3 brazadas', 'Patada continua desde la cadera', 'Giro de cadera coordinado con brazada'],
  },
  strength: {
    title: 'Técnica de sentadilla',
    tips: ['Pies al ancho de hombros', 'Rodillas siguen la línea de los pies', 'Baja como si te sentaras', 'Espalda recta, pecho arriba', 'Sube empujando con los talones'],
  },
  running: {
    title: 'Técnica de carrera',
    tips: ['Postura erguida, leve inclinación hacia delante', 'Aterriza con el mediopié', 'Cadencia alta (170-180 ppm)', 'Brazos a 90°, movimiento hacia delante', 'Relajación de hombros y cuello'],
  },
  cycling: {
    title: 'Técnica de pedaleo',
    tips: ['Silla a la altura correcta', 'Pedaleo redondo, no solo empujar', 'Cadencia 80-100 rpm', 'Manos relajadas en el manillar', 'Core activo para estabilidad'],
  },
  walking: {
    title: 'Técnica de marcha',
    tips: ['Postura erguida, mirada al frente', 'Paso natural, no forzar zancada', 'Brazos balanceándose de forma natural', 'Aterriza con el talón, despliega el pie', 'Hombros relajados'],
  },
  trail_running: {
    title: 'Técnica de trail running',
    tips: ['Zancada corta y frecuencia alta en descensos', 'Camina las subidas muy pronunciadas para ahorrar energía', 'Mira 3-5 m por delante para anticipar el terreno', 'Brazos abiertos para equilibrar en terreno técnico', 'Aterriza con el mediopié, no con el talón'],
  },
  hiking: {
    title: 'Técnica de senderismo',
    tips: ['Ritmo constante, no empieces demasiado rápido', 'En subidas: inclinación hacia delante, pasos cortos', 'En bajadas: rodillas ligeramente flexionadas, no frenes de golpe', 'Usa bastones para proteger rodillas en descensos largos', 'Hidrátate cada 20-30 min, especialmente en calor'],
  },
  mountain_bike: {
    title: 'Técnica de BTT',
    tips: ['Baja el sillín en descensos para mejorar el centro de gravedad', 'Mira 5-10 m por delante, no a la rueda', 'Frena con ambos frenos de forma progresiva', 'En curvas sueltas: inclina la bici más que el cuerpo', 'Pedaleo redondo en subidas, distribuye el peso'],
  },
  indoor_cycling: {
    title: 'Técnica de spinning',
    tips: ['Sillín a la altura correcta: pierna casi extendida abajo', 'Cadencia 80-100 rpm en resistencia media', 'Core activo, no bascular la cadera', 'Manos relajadas en el manillar, codos ligeramente flexionados', 'Respiración rítmica sincronizada con el pedaleo'],
  },
  treadmill: {
    title: 'Técnica en cinta de correr',
    tips: ['Postura erguida, no te apoyes en la barra', 'Inclinación 1-2% para simular resistencia al aire libre', 'Mantén cadencia alta (170-180 ppm)', 'Mirada al frente, no a los pies', 'Hidrátate cada 15-20 min'],
  },
  elliptical: {
    title: 'Técnica en elíptica',
    tips: ['Postura erguida, core activo, sin inclinarte hacia delante', 'Empuja y tira de las manetas para trabajar tren superior', 'Cadencia constante 120-160 pasos por minuto', 'Distribuye el peso entre piernas y brazos', 'No bloquees las rodillas'],
  },
  rowing: {
    title: 'Técnica de remo indoor',
    tips: ['Secuencia: piernas, core, brazos en el empuje', 'Al revés en la vuelta: brazos, core, piernas', 'Espalda recta, no redondees los hombros', 'Tira el mango hacia el ombligo, no hacia el pecho', 'Cadencia 20-30 remadas por minuto'],
  },
  yoga: {
    title: 'Técnica de yoga',
    tips: ['Respira profundo y lento por la nariz durante toda la práctica', 'No fuerces las posturas: ve hasta donde tu cuerpo permita', 'Mantén cada asana 30-60 s respirando de forma constante', 'Usa bloques o cinturones para adaptar posturas a tu nivel', 'Finaliza con Savasana 5-10 min para integrar'],
  },
  pilates: {
    title: 'Técnica de pilates',
    tips: ['Activa el core en cada ejercicio: ombligo hacia la columna', 'Respira por las costillas, expandiendo la caja torácica', 'Prioriza la calidad del movimiento sobre la cantidad', 'Mantén la columna en posición neutra', 'Trabaja con control total, sin inercia ni movimientos bruscosos'],
  },
  barre: {
    title: 'Técnica de barre',
    tips: ['Postura erguida con la columna alargada en cada ejercicio', 'Trabaja con pulsaciones pequeñas y controladas, sin rebotes', 'Activa los glúteos en cada movimiento de pierna', 'Respira de forma constante, no retengas el aire', 'Usa calcetines con agarre para mayor control'],
  },
  stretching: {
    title: 'Técnica de estiramientos',
    tips: ['Nunca estires con rebotes: mantén cada posición 30-60 s estático', 'Respira profundo y lento, exhala al profundizar', 'No llegues al dolor: estira hasta sentir tensión moderada', 'Estira todos los grupos musculares principales', 'Usa foam roller antes de estirar para liberar tensión miofascial'],
  },
  padel: {
    title: 'Técnica de pádel',
    tips: ['Mantén la pala por delante del cuerpo en posición de espera', 'Golpea la bola de bote con la pala por debajo de la cintura', 'Trabaja el juego de pared: deja que la bola rebote antes de golpear', 'Posición de espera: piernas flexionadas, peso sobre las puntas', 'Hidrátate en cada cambio de lado'],
  },
  crossfit: {
    title: 'Técnica de CrossFit',
    tips: ['Prioriza la técnica sobre la velocidad: rx antes que intensity', 'Mantén el core activo en todos los movimientos', 'Respira de forma rítmica: no retengas el aire en esfuerzos máximos', 'Escala los pesos y movimientos a tu nivel', 'Calienta siempre el movimiento específico del WOD antes de empezar'],
  },
  hyrox: {
    title: 'Técnica de HYROX',
    tips: ['Gestiona el ritmo en carrera: no salgas demasiado rápido', 'En sled push: cuerpo bajo, empuja con las piernas, no con la espalda', 'Burpee broad jump: salto largo y eficiente, minimiza tiempo de contacto', 'Wall balls: usa las piernas para impulsar, no solo los brazos', 'Transiciones rápidas entre estaciones: cada segundo cuenta'],
  },
};

const POST_WORKOUT_NUTRITION = [
  { emoji: '🥤', text: 'Batido de proteínas (30 g) en los próximos 30 min' },
  { emoji: '🍌', text: 'Plátano + yogur griego para recuperar glucógeno' },
  { emoji: '💧', text: 'Bebe 500 ml de agua por cada hora de ejercicio' },
  { emoji: '🥗', text: 'Comida completa en las 2 h siguientes: proteína + carbohidratos + verduras' },
];

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg'];

export default function RecordWorkout() {
  const { user, profile, isPremium } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);
  const { t } = useI18n();
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [recording, setRecording] = useState(false);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [elevationGain, setElevationGain] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sharePublic, setSharePublic] = useState(false);
  const [customName, setCustomName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<WorkoutBlock[]>([]);
  const [showWarmup, setShowWarmup] = useState(false);
  const [showTechnique, setShowTechnique] = useState(false);
  const [showCooldown, setShowCooldown] = useState(false);
  const [audioGuide, setAudioGuide] = useState(false);
  const [lastKmAnnounced, setLastKmAnnounced] = useState(0);
  const [manualDuration, setManualDuration] = useState('30');
  const [manualDistance, setManualDistance] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [gpsPermission, setGpsPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [editDuration, setEditDuration] = useState(false);
  const [editDistance, setEditDistance] = useState(false);
  const [summaryDuration, setSummaryDuration] = useState(0);
  const [summaryDistance, setSummaryDistance] = useState(0);
  const [simMode, setSimMode] = useState(false);
  const [wodType, setWodType] = useState('');
  const [wodScore, setWodScore] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const summaryMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const summaryMapInstance = useRef<L.Map | null>(null);
  const routeLayer = useRef<L.Polyline | null>(null);
  const summaryRouteLayer = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);
  const watchId = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastValidPoint = useRef<RoutePoint | null>(null);
  const totalDistanceRef = useRef(0);
  const lastKmAnnouncedRef = useRef(0);
  const audioGuideRef = useRef(audioGuide);
  useEffect(() => { audioGuideRef.current = audioGuide; }, [audioGuide]);

  const today = new Date().toISOString().split('T')[0];

  async function loadLeaflet(): Promise<typeof L> {
    return (await import('leaflet')).default;
  }

  useEffect(() => {
    if (mode !== 'gps' || !mapRef.current) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;
      mapInstance.current = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView([40.4168, -3.7038], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance.current);
      routeLayer.current = L.polyline([], { color: '#00ff88', weight: 4, opacity: 0.8 }).addTo(mapInstance.current);
      markerRef.current = L.circleMarker([40.4168, -3.7038], { radius: 6, fillColor: '#00ff88', color: '#0a0e0d', weight: 2, fillOpacity: 1 }).addTo(mapInstance.current);
      // Auto-detect user location when permission already granted
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled || !mapInstance.current) return;
            mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 16);
            markerRef.current?.setLatLng([pos.coords.latitude, pos.coords.longitude]);
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
        );
      }
    });
    return () => {
      cancelled = true;
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; routeLayer.current = null; markerRef.current = null; }
    };
  }, [mode]);

  useEffect(() => {
    if (!showSummary || !summaryMapRef.current || route.length < 2) return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !summaryMapRef.current || summaryMapInstance.current) return;
      const bounds = route.map((p) => [p.lat, p.lng] as [number, number]);
      summaryMapInstance.current = L.map(summaryMapRef.current, { zoomControl: false, attributionControl: false }).fitBounds(bounds, { padding: [20, 20] });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(summaryMapInstance.current);
      summaryRouteLayer.current = L.polyline(bounds, { color: '#00ff88', weight: 4, opacity: 0.8 }).addTo(summaryMapInstance.current);
      const start = route[0];
      const end = route[route.length - 1];
      L.circleMarker([start.lat, start.lng], { radius: 6, fillColor: '#00ff88', color: '#0a0e0d', weight: 2, fillOpacity: 1 }).addTo(summaryMapInstance.current);
      L.circleMarker([end.lat, end.lng], { radius: 6, fillColor: '#ff6b6b', color: '#0a0e0d', weight: 2, fillOpacity: 1 }).addTo(summaryMapInstance.current);
    });
    return () => {
      cancelled = true;
      if (summaryMapInstance.current) { summaryMapInstance.current.remove(); summaryMapInstance.current = null; summaryRouteLayer.current = null; }
    };
  }, [showSummary, route]);

  useEffect(() => {
    if (mode !== 'gps') return;
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((result) => {
        setGpsPermission(result.state as 'granted' | 'denied' | 'prompt');
        result.onchange = () => setGpsPermission(result.state as 'granted' | 'denied' | 'prompt');
      }).catch(() => setGpsPermission('unknown'));
    }
  }, [mode]);

  function calcDistance(a: RoutePoint, b: RoutePoint): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function speak(text: string) {
    if (!audioGuide || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  }

  const startRecording = useCallback(async () => {
    setError(null);
    setRoute([]);
    setDuration(0);
    setDistance(0);
    setElevationGain(0);
    setSuccess(false);
    setLastKmAnnounced(0);
    setGpsAccuracy(null);
    lastValidPoint.current = null;
    totalDistanceRef.current = 0;
    lastKmAnnouncedRef.current = 0;

    if (!navigator.geolocation) {
      setError('Tu dispositivo no soporta geolocalización. Puedes usar el modo manual o de simulación.');
      setSimMode(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const point: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now(), elevation: pos.coords.altitude || 0 };
        setRoute([point]);
        lastValidPoint.current = point;
        setGpsAccuracy(pos.coords.accuracy || null);
        if (mapInstance.current) { mapInstance.current.setView([point.lat, point.lng], 16); markerRef.current?.setLatLng([point.lat, point.lng]); }
      },
      (err) => {
 const msgs: Record<number, string> = {
          1: 'Permiso de ubicación denegado. Activa el acceso a tu ubicación en los ajustes del navegador o del sistema para usar el GPS. Puedes usar el modo manual mientras tanto.',
          2: 'Posición no disponible. Comprueba que el GPS o la conexión de red estén activados. Puedes usar el modo manual o simulación.',
          3: 'Tiempo de espera agotado buscando tu ubicación. Inténtalo de nuevo en un lugar despejado, o usa el modo manual.',
        };
        setError(msgs[err.code] || `No se pudo obtener tu ubicación: ${err.message}`);
        setSimMode(true);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const accuracy = pos.coords.accuracy || 100;
        setGpsAccuracy(accuracy);
        if (accuracy > 100) return;

        const point: RoutePoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now(), elevation: pos.coords.altitude || 0 };

        if (lastValidPoint.current) {
          const last = lastValidPoint.current;
          const d = calcDistance(last, point);
          if (d < 0.001) return;
          if (d > 0.5) return;
        }

        lastValidPoint.current = point;
        setRoute((prev) => {
          const newRoute = [...prev, point];
          if (newRoute.length > 1) {
            const last = newRoute[newRoute.length - 2];
            const d = calcDistance(last, point);
            totalDistanceRef.current += d;
            setDistance(totalDistanceRef.current);
            const kmCompleted = Math.floor(totalDistanceRef.current);
            if (audioGuideRef.current && kmCompleted > lastKmAnnouncedRef.current && kmCompleted > 0) {
              lastKmAnnouncedRef.current = kmCompleted;
              setLastKmAnnounced(kmCompleted);
              speak(`${kmCompleted} kilómetro completado. ¡Vas genial, sigue así!`);
            }
            if (point.elevation > last.elevation) {
              setElevationGain((prev) => prev + Math.round(point.elevation - last.elevation));
            }
          }
          if (mapInstance.current && routeLayer.current) {
            const latlngs: [number, number][] = newRoute.map((p) => [p.lat, p.lng]);
            routeLayer.current.setLatLngs(latlngs);
            markerRef.current?.setLatLng([point.lat, point.lng]);
            mapInstance.current.panTo([point.lat, point.lng], { animate: true });
          }
          return newRoute;
        });
      },
      (err) => {
        if (err.code === 1) setError('Permiso de ubicación denegado. Activa el GPS en los ajustes del dispositivo.');
        else if (err.code === 2) setError('Señal GPS no disponible. Verifica que estás al aire libre o usa el modo manual.');
        else setError(`Error de GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 30000 },
    );

    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    setRecording(true);
  }, []);

  function stopRecording() {
    if (watchId.current !== null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setRecording(false);
    setSummaryDuration(duration);
    setSummaryDistance(distance);
    setShowSummary(true);
    if (audioGuide && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setPhotoError('Solo se permiten archivos JPG o PNG.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'jpg' && ext !== 'jpeg' && ext !== 'png') {
      setPhotoError('La extensión del archivo debe ser .jpg o .png');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError('El archivo supera el límite de 5 MB.');
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function generateBlocks(sport: string): WorkoutBlock[] {
    const warmup = WARMUP_ROUTINES[sport] || WARMUP_ROUTINES.combined;
    const blockList: WorkoutBlock[] = [
      ...warmup.map((w) => ({ name: w.name, type: 'warmup' as const, completed: false })),
      { name: 'Bloque principal', type: 'main' as const, completed: false },
      { name: 'Core y compensación', type: 'core' as const, completed: false },
      ...COOLDOWN_ROUTINES.map((c) => ({ name: c.name, type: 'cooldown' as const, completed: false })),
    ];
    return blockList;
  }

  function toggleBlock(index: number) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, completed: !b.completed } : b)));
  }

  function getBlockProgress(): { completed: number; total: number; pct: number } {
    const total = blocks.length;
    const completed = blocks.filter((b) => b.completed).length;
    return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }

  async function uploadPhoto(workoutId: string): Promise<string | null> {
    if (!photoFile || !user) return null;
    const ext = photoFile.name.split('.').pop()?.toLowerCase();
    const fileName = `${user.id}/${workoutId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('workout-photos').upload(fileName, photoFile, { contentType: photoFile.type });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from('workout-photos').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function checkAndUnlockAchievements(workoutCount: number, weekMinutes: number, totalKm: number, isGps: boolean) {
    if (!user) return;
    const newAchievements: string[] = [];
    if (workoutCount >= 1) newAchievements.push('first_workout');
    if (workoutCount >= 5) newAchievements.push('5_workouts');
    if (workoutCount >= 10) newAchievements.push('10_workouts');
    if (workoutCount >= 25) newAchievements.push('25_workouts');
    if (workoutCount >= 50) newAchievements.push('50_workouts');
    if (weekMinutes >= 100) newAchievements.push('100_minutes');
    if (weekMinutes >= 200) newAchievements.push('200_minutes');
    if (weekMinutes >= 300) newAchievements.push('300_minutes');
    if (isGps) newAchievements.push('first_gps');
    if (totalKm >= 10) newAchievements.push('10km_total');
    if (totalKm >= 50) newAchievements.push('50km_total');

    for (const key of newAchievements) {
      await supabase.from('achievements').upsert({ user_id: user.id, achievement_key: key });
    }
  }

  async function saveGpsWorkout() {
    if (!user || (route.length < 2 && !simMode)) return;
    setSaving(true);
    setError(null);
    try {
      const coordinates = route.length > 1 ? route.map((p) => [p.lng, p.lat]) : [];
      const geojson = coordinates.length > 0 ? { type: 'LineString', coordinates } : null;
      const finalDuration = summaryDuration || duration;
      const finalDistance = summaryDistance || distance;
      const avgSpeed = finalDuration > 0 ? (finalDistance / (finalDuration / 3600)) : 0;
      const calories = Math.round(finalDistance * 60 + finalDuration * 0.15);
      const steps = Math.round(finalDistance * 1300);

      const blockProgress = getBlockProgress();

      const { data: workoutData, error: insertError } = await supabase.from('workouts').insert({
        user_id: user.id,
        sport: selectedSport || 'running',
        type: 'gps',
        date: today,
        duration_sec: finalDuration,
        distance_km: parseFloat(finalDistance.toFixed(3)),
        route_geojson: geojson,        is_shared: sharePublic,
        custom_name: customName || null,
        blocks_total: blockProgress.total,
        blocks_completed: blockProgress.completed,
        elevation_gain_m: elevationGain,
        avg_speed_kmh: parseFloat(avgSpeed.toFixed(1)),
        calories_est: calories,
        steps_est: steps,
      }).select().single();

      if (insertError) throw insertError;

      if (photoFile && workoutData) {
        const photoUrl = await uploadPhoto(workoutData.id);
        if (photoUrl) {
          await supabase.from('workouts').update({ photo_url: photoUrl }).eq('id', workoutData.id);
        }
      }

      if (blocks.length > 0 && workoutData) {
        const blockInserts = blocks.map((b, i) => ({ workout_id: workoutData.id, block_name: b.name, block_type: b.type, completed: b.completed, sort_order: i }));
        await supabase.from('workout_blocks').insert(blockInserts);
      }

      const { count: totalWorkouts } = await supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { data: weekWorkouts } = await supabase.from('workouts').select('duration_sec,distance_km').eq('user_id', user.id).gte('date', getMondayString());
      const weekMinutes = (weekWorkouts || []).reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
      const totalKm = (weekWorkouts || []).reduce((sum, w) => sum + (w.distance_km ? parseFloat(String(w.distance_km)) : 0), 0);
      await checkAndUnlockAchievements(totalWorkouts || 0, weekMinutes, totalKm, true);

      setSuccess(true);
      setRecording(false);
      setShowSummary(false);
      setRoute([]);
      setDuration(0);
      setDistance(0);
      setSummaryDuration(0);
      setSummaryDistance(0);
      setSharePublic(false);
      setCustomName('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setBlocks([]);
      setSimMode(false);
      window.dispatchEvent(new Event('workout-saved'));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function saveManualWorkout(sport: string) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const durationMin = parseInt(manualDuration) || 30;
      const durationSec = durationMin * 60;
      const blockProgress = getBlockProgress();
      const distKm = manualDistance ? parseFloat(manualDistance) : null;
      const calories = distKm ? Math.round(distKm * 60 + durationMin * 0.15) : Math.round(durationMin * 7);
      const steps = distKm ? Math.round(distKm * 1300) : null;

      const { data: workoutData, error: insertError } = await supabase.from('workouts').insert({
        user_id: user.id,
        sport,
        type: 'manual',
        date: today,
        duration_sec: durationSec,
        distance_km: distKm,
        is_shared: sharePublic,
        custom_name: customName || null,
        blocks_total: blockProgress.total,
        blocks_completed: blockProgress.completed,
        calories_est: calories,
        steps_est: steps,
        notes: (sport === 'crossfit' && wodType) ? `WOD: ${wodType}${wodScore ? ' — Resultado: ' + wodScore : ''}` : (sport === 'hyrox' && wodScore) ? `Tiempo HYROX: ${wodScore}${wodType ? ' — Bloques: ' + wodType : ''}` : null,
      }).select().single();

      if (insertError) throw insertError;

      if (photoFile && workoutData) {
        const photoUrl = await uploadPhoto(workoutData.id);
        if (photoUrl) await supabase.from('workouts').update({ photo_url: photoUrl }).eq('id', workoutData.id);
      }

      if (blocks.length > 0 && workoutData) {
        const blockInserts = blocks.map((b, i) => ({ workout_id: workoutData.id, block_name: b.name, block_type: b.type, completed: b.completed, sort_order: i }));
        await supabase.from('workout_blocks').insert(blockInserts);
      }

      const { count: totalWorkouts } = await supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { data: weekWorkouts } = await supabase.from('workouts').select('duration_sec,distance_km').eq('user_id', user.id).gte('date', getMondayString());
      const weekMinutes = (weekWorkouts || []).reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
      const totalKm = (weekWorkouts || []).reduce((sum, w) => sum + (w.distance_km ? parseFloat(String(w.distance_km)) : 0), 0);
      await checkAndUnlockAchievements(totalWorkouts || 0, weekMinutes, totalKm, false);

      setSuccess(true);
      setSharePublic(false);
      setCustomName('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setBlocks([]);
      setManualDistance('');
      setWodType('');
      setWodScore('');
      window.dispatchEvent(new Event('workout-saved'));
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function getMondayString(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  function formatTime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  const blockProgress = getBlockProgress();
  const warmupRoutines = selectedSport ? (WARMUP_ROUTINES[selectedSport] || WARMUP_ROUTINES.combined) : [];
  const techniqueGuide = selectedSport ? TECHNIQUE_GUIDES[selectedSport] : null;

  if (!mode) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-black font-display">Registrar entrenamiento</h1>
        {success && (
          <div className="glass-card rounded-2xl p-4 bg-[var(--neon-green)]/10 border-[var(--neon-green)]/30 flex items-center gap-3 animate-scale-in">
            <Check className="w-5 h-5 text-[var(--neon-green)]" />
            <p className="font-semibold text-[var(--neon-green)]">¡Entrenamiento guardado!</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setMode('record_exercise')} className="glass-card glass-card-hover rounded-3xl p-8 text-left transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-[var(--neon-green)]/10 flex items-center justify-center mb-4 group-hover:neon-glow transition-all">
              <Play className="w-7 h-7 text-[var(--neon-green)]" />
            </div>
            <h3 className="text-xl font-bold font-display mb-1">Grabar ejercicio</h3>
            <p className="text-[var(--text-secondary)] text-sm">Selecciona el deporte que proponía la app y graba tu entrenamiento en directo.</p>
          </button>
          <button onClick={() => setMode('manual')} className="glass-card glass-card-hover rounded-3xl p-8 text-left transition-all group">
            <div className="w-14 h-14 rounded-2xl bg-[var(--neon-cyan)]/10 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-[var(--neon-cyan)]" />
            </div>
            <h3 className="text-xl font-bold font-display mb-1">Manual rápido</h3>
            <p className="text-[var(--text-secondary)] text-sm">Confirma de golpe que has hecho el ejercicio que proponía la app sin grabarlo.</p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'gps') {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black font-display">GPS / Mapa</h1>
          <button onClick={() => { stopRecording(); setMode(null); }} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancelar</button>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {DEFAULT_SPORTS.filter((s) => OUTDOOR_SPORTS.includes(s.key)).map((sport) => (
            <button key={sport.key} onClick={() => { setSelectedSport(sport.key); setBlocks(generateBlocks(sport.key)); }} className={`flex-shrink-0 px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-sm font-semibold ${selectedSport === sport.key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)]'}`}>
              <span className="text-lg">{sport.emoji}</span>{sport.label}
            </button>
          ))}
        </div>

        {/* Audio guide toggle */}
        <label className="flex items-center gap-3 glass-card rounded-2xl p-3 cursor-pointer">
          <div className={`w-10 h-5.5 rounded-full transition-colors relative ${audioGuide ? 'bg-[var(--neon-green)]' : 'bg-[var(--border-subtle)]'}`} style={{ height: '22px' }}>
            <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-transform ${audioGuide ? 'translate-x-5' : 'translate-x-0.5'}`} style={{ width: '18px', height: '18px' }} />
          </div>
          <input type="checkbox" checked={audioGuide} onChange={(e) => setAudioGuide(e.target.checked)} className="sr-only" />
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-[var(--neon-green)]" />
            <div>
              <p className="font-semibold text-sm">Audio-guía de hitos</p>
              <p className="text-xs text-[var(--text-muted)]">Anuncios de voz cada kilómetro</p>
            </div>
          </div>
        </label>

        {/* GPS permission status */}
        {gpsPermission === 'denied' && (
          <div className="glass-card rounded-2xl p-4 bg-orange-500/10 border border-orange-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-orange-400 font-semibold">Permiso de ubicación denegado</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Activa el acceso a tu ubicación en los ajustes del navegador o del sistema para grabar rutas con GPS. Mientras tanto, puedes usar el modo manual o de simulación.</p>
              <button onClick={() => setSimMode(true)} className="mt-2 text-xs text-[var(--neon-green)] font-semibold hover:underline">Activar modo simulación</button>
            </div>
          </div>
        )}

        {/* GPS accuracy indicator */}
        {recording && gpsAccuracy !== null && (
          <div className={`glass-card rounded-xl p-2.5 flex items-center gap-2 text-xs ${gpsAccuracy <= 15 ? 'text-[var(--neon-green)]' : gpsAccuracy <= 30 ? 'text-yellow-400' : 'text-orange-400'}`}>
            <div className={`w-2 h-2 rounded-full ${gpsAccuracy <= 15 ? 'bg-[var(--neon-green)]' : gpsAccuracy <= 30 ? 'bg-yellow-400' : 'bg-orange-400'} animate-pulse`} />
            <span className="font-semibold">Precisión GPS: ±{Math.round(gpsAccuracy)}m</span>
            {gpsAccuracy > 30 && <span className="text-[var(--text-muted)]">— Señal débil, busca un lugar despejado</span>}
          </div>
        )}

        {/* Simulation mode banner */}
        {simMode && !recording && (
          <div className="glass-card rounded-2xl p-4 bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--neon-cyan)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-[var(--neon-cyan)] font-semibold">Modo simulación activado</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">No hay señal GPS disponible. Puedes introducir los datos manualmente: distancia, duración y el deporte. Se guardará como entrenamiento GPS con los datos que introduzcas.</p>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Distancia estimada (km)</label>
                <input type="number" step="0.01" value={manualDistance} onChange={(e) => { setManualDistance(e.target.value); setSummaryDistance(parseFloat(e.target.value) || 0); }} placeholder="ej. 5.2" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">Duración estimada (minutos)</label>
                <input type="number" value={manualDuration} onChange={(e) => { setManualDuration(e.target.value); setSummaryDuration((parseInt(e.target.value) || 0) * 60); }} className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              </div>
            </div>
          </div>
        )}

        <div ref={mapRef} className={`w-full rounded-3xl overflow-hidden border border-[var(--border-subtle)] neon-border ${simMode ? 'h-48 opacity-50' : 'h-80'}`} />

        {error && !simMode && (
          <div className="glass-card rounded-2xl p-4 bg-red-500/10 border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={() => setSimMode(true)} className="mt-2 text-xs text-[var(--neon-green)] font-semibold hover:underline">Usar modo simulación / manual</button>
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1"><Clock className="w-3.5 h-3.5 text-[var(--neon-green)]" /><span className="text-[10px] text-[var(--text-muted)] uppercase">Tiempo</span></div>
            <p className="text-xl font-black font-display tabular-nums">{formatTime(duration)}</p>
          </div>
          <div className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1"><Route className="w-3.5 h-3.5 text-[var(--neon-green)]" /><span className="text-[10px] text-[var(--text-muted)] uppercase">Distancia</span></div>
            <p className="text-xl font-black font-display tabular-nums">{distance.toFixed(2)} <span className="text-xs text-[var(--text-secondary)]">km</span></p>
          </div>
          <div className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1"><Mountain className="w-3.5 h-3.5 text-[var(--neon-green)]" /><span className="text-[10px] text-[var(--text-muted)] uppercase">Desnivel</span></div>
            <p className="text-xl font-black font-display tabular-nums">{elevationGain} <span className="text-xs text-[var(--text-secondary)]">m</span></p>
          </div>
          <div className="glass-card rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1"><Gauge className="w-3.5 h-3.5 text-[var(--neon-green)]" /><span className="text-[10px] text-[var(--text-muted)] uppercase">Vel. media</span></div>
            <p className="text-xl font-black font-display tabular-nums">{duration > 0 ? (distance / (duration / 3600)).toFixed(1) : '0'} <span className="text-xs text-[var(--text-secondary)]">km/h</span></p>
          </div>
        </div>

        {/* Custom name */}
        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nombre personalizado (opcional)" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />

        {/* Warmup */}
        {warmupRoutines.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <button onClick={() => setShowWarmup(!showWarmup)} className="w-full flex items-center justify-between">
              <span className="font-semibold text-sm flex items-center gap-2"><Footprints className="w-4 h-4 text-[var(--neon-green)]" /> Calentamiento previo</span>
              <span className="text-xs text-[var(--text-muted)]">{showWarmup ? 'Ocultar' : 'Ver'}</span>
            </button>
            {showWarmup && (
              <div className="mt-3 space-y-2 animate-fade-in">
                {warmupRoutines.map((w, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-darkest)]">
                    <span className="text-sm">{w.name}: <span className="text-[var(--text-secondary)]">{w.desc}</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Technique guide */}
        {techniqueGuide && (
          <div className="glass-card rounded-2xl p-4">
            <button onClick={() => setShowTechnique(!showTechnique)} className="w-full flex items-center justify-between">
              <span className="font-semibold text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-[var(--neon-green)]" /> {techniqueGuide.title}</span>
              <span className="text-xs text-[var(--text-muted)]">{showTechnique ? 'Ocultar' : 'Ver'}</span>
            </button>
            {showTechnique && (
              <div className="mt-3 animate-fade-in">
                <div className="flex items-center justify-center h-24 rounded-xl bg-[var(--bg-darkest)] mb-3">
                  <div className="text-center">
                    <div className="text-4xl mb-1">🧍</div>
                    <p className="text-xs text-[var(--text-muted)]">Figura esquemática de técnica</p>
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {techniqueGuide.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2"><Check className="w-3.5 h-3.5 text-[var(--neon-green)] flex-shrink-0 mt-0.5" />{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Blocks */}
        {blocks.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">Bloques del entrenamiento</span>
              <span className="text-xs font-bold text-[var(--neon-green)]">{blockProgress.completed}/{blockProgress.total} ({blockProgress.pct}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-darkest)] mb-3 overflow-hidden">
              <div className="h-full gradient-neon rounded-full transition-all duration-500" style={{ width: `${blockProgress.pct}%` }} />
            </div>
            <div className="space-y-1.5">
              {blocks.map((block, i) => (
                <button key={i} onClick={() => toggleBlock(i)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${block.completed ? 'bg-[var(--neon-green)]/10' : 'bg-[var(--bg-darkest)]'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${block.completed ? 'gradient-neon' : 'border-2 border-[var(--border-subtle)]'}`}>
                    {block.completed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{block.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{block.type}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo upload */}
        <div className="glass-card rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[var(--neon-green)]" /> Foto del entrenamiento</p>
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--border-subtle)] cursor-pointer hover:border-[var(--neon-green)] transition-all">
              <ImagePlus className="w-8 h-8 text-[var(--text-muted)] mb-2" />
              <span className="text-xs text-[var(--text-muted)]">JPG o PNG, máx. 5 MB</span>
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handlePhotoSelect} className="sr-only" />
            </label>
          )}
          {photoError && <p className="text-xs text-red-400 mt-2">{photoError}</p>}
        </div>

        {/* Cooldown */}
        <div className="glass-card rounded-2xl p-4">
          <button onClick={() => setShowCooldown(!showCooldown)} className="w-full flex items-center justify-between">
            <span className="font-semibold text-sm">Vuelta a la calma / Movilidad</span>
            <span className="text-xs text-[var(--text-muted)]">{showCooldown ? 'Ocultar' : 'Ver'}</span>
          </button>
          {showCooldown && (
            <div className="mt-3 space-y-2 animate-fade-in">
              {COOLDOWN_ROUTINES.map((c, i) => (
                <div key={i} className="p-2 rounded-lg bg-[var(--bg-darkest)]">
                  <p className="text-sm">{c.name}: <span className="text-[var(--text-secondary)]">{c.desc}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post-workout nutrition */}
        <div className="glass-card rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Flame className="w-4 h-4 text-[var(--neon-green)]" /> Nutrición post-entreno</p>
          <div className="space-y-1.5">
            {POST_WORKOUT_NUTRITION.map((n, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span className="text-lg">{n.emoji}</span>{n.text}</div>
            ))}
          </div>
        </div>

        {/* Privacy toggle */}
        <label className="flex items-center gap-3 glass-card rounded-2xl p-4 cursor-pointer">
          <div className={`w-11 h-6 rounded-full transition-colors relative ${sharePublic ? 'bg-[var(--neon-green)]' : 'bg-[var(--border-subtle)]'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sharePublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <input type="checkbox" checked={sharePublic} onChange={(e) => setSharePublic(e.target.checked)} className="sr-only" />
          <div><p className="font-semibold text-sm">Compartir con la comunidad</p><p className="text-xs text-[var(--text-muted)]">Tu ruta será visible en el feed de tus amigos</p></div>
        </label>

        {/* Sport-specific route summary */}
        {showSummary && !recording && (route.length > 1 || simMode) && (
          <div className="glass-card rounded-3xl p-6 animate-scale-in space-y-5">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--neon-green)]" />
              <h3 className="text-lg font-bold font-display">{t('gps.routeSummary')}</h3>
              <span className="ml-auto text-2xl">{SPORT_EMOJIS[selectedSport] || '🏃'}</span>
            </div>

            {/* Mini map showing the route */}
            {route.length > 1 && <div ref={summaryMapRef} className="w-full h-48 rounded-2xl overflow-hidden border border-[var(--border-subtle)]" />}

            {/* General metrics with editable duration & distance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
                <Route className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                {editDistance ? (
                  <input type="number" step="0.01" autoFocus value={summaryDistance.toFixed(2)} onChange={(e) => setSummaryDistance(parseFloat(e.target.value) || 0)} onBlur={() => setEditDistance(false)} onKeyDown={(e) => e.key === 'Enter' && setEditDistance(false)} className="w-16 bg-transparent text-center text-lg font-black font-display tabular-nums border-b border-[var(--neon-green)] focus:outline-none" />
                ) : (
                  <button onClick={() => setEditDistance(true)} className="text-lg font-black font-display tabular-nums hover:text-[var(--neon-green)] transition-colors">{summaryDistance.toFixed(2)}</button>
                )}
                <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.distance')} (km) {editDistance ? '✏️' : '↩'}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
                <Clock className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                {editDuration ? (
                  <input type="text" autoFocus value={formatTime(summaryDuration)} onChange={(e) => { const parts = e.target.value.split(':').map(Number); const secs = parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts.length === 2 ? parts[0]*60+parts[1] : parts[0] || 0; setSummaryDuration(secs); }} onBlur={() => setEditDuration(false)} onKeyDown={(e) => e.key === 'Enter' && setEditDuration(false)} className="w-20 bg-transparent text-center text-lg font-black font-display tabular-nums border-b border-[var(--neon-green)] focus:outline-none" />
                ) : (
                  <button onClick={() => setEditDuration(true)} className="text-lg font-black font-display tabular-nums hover:text-[var(--neon-green)] transition-colors">{formatTime(summaryDuration)}</button>
                )}
                <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.duration')} {editDuration ? '✏️' : '↩'}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
                <Flame className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                <p className="text-lg font-black font-display tabular-nums">{Math.round(summaryDistance * 60 + summaryDuration * 0.15)}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.calories')}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
                <Mountain className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                <p className="text-lg font-black font-display tabular-nums">{elevationGain}</p>
                <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.elevation')} (m)</p>
              </div>
            </div>

            {/* Cycling-specific metrics */}
            {(selectedSport === 'cycling' || selectedSport === 'mountain_bike') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--neon-cyan)]" /><h4 className="text-sm font-bold uppercase tracking-wider text-[var(--neon-cyan)]">{t('gps.cyclingMetrics')}</h4></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20">
                    <Gauge className="w-4 h-4 text-[var(--neon-cyan)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDuration > 0 ? (summaryDistance / (summaryDuration / 3600)).toFixed(1) : '0'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.avgSpeed')} (km/h)</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20">
                    <Zap className="w-4 h-4 text-[var(--neon-cyan)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDuration > 0 && summaryDistance > 0 ? Math.max(0, (summaryDistance / (summaryDuration / 3600)) * 1.5).toFixed(0) : '0'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.maxSpeed')} (km/h)</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20">
                    <Activity className="w-4 h-4 text-[var(--neon-cyan)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDuration > 0 && summaryDistance > 0 ? Math.round((summaryDuration / summaryDistance) * 60 / 2) : '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.cadence')} (rpm)</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20">
                    <Flame className="w-4 h-4 text-[var(--neon-cyan)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDuration > 0 && summaryDistance > 0 ? Math.round((summaryDistance * 12 * 9.8 / Math.max(summaryDuration / 3600, 0.01))) : '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.power')} (W)</p>
                  </div>
                </div>
              </div>
            )}

            {/* Running / Walking / Trail / Hiking specific metrics */}
            {(selectedSport === 'running' || selectedSport === 'walking' || selectedSport === 'trail_running' || selectedSport === 'hiking') && (
              <div className="space-y-3">
                <div className="flex items-center gap-2"><Footprints className="w-4 h-4 text-[var(--neon-green)]" /><h4 className="text-sm font-bold uppercase tracking-wider text-[var(--neon-green)]">{t('gps.runningMetrics')}</h4></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-green)]/5 border border-[var(--neon-green)]/20">
                    <Timer className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDuration > 0 && summaryDistance > 0 ? `${Math.floor(summaryDuration / summaryDistance / 60)}:${String(Math.floor((summaryDuration / summaryDistance) % 60)).padStart(2, '0')}` : '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.pace')} ({t('gps.pacePerKm')})</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-green)]/5 border border-[var(--neon-green)]/20">
                    <Footprints className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{Math.round(summaryDistance * (selectedSport === 'running' || selectedSport === 'trail_running' ? 160 : 130))}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.steps')}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-green)]/5 border border-[var(--neon-green)]/20">
                    <Activity className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDuration > 0 ? Math.round((Math.round(summaryDistance * (selectedSport === 'running' || selectedSport === 'trail_running' ? 160 : 130)) / (summaryDuration / 60)) || 0) : '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.stepCadence')} (spm)</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-[var(--neon-green)]/5 border border-[var(--neon-green)]/20">
                    <Clock className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                    <p className="text-lg font-black font-display tabular-nums">{summaryDistance > 0 ? formatTime(Math.round(summaryDuration / summaryDistance)) : '—'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase">{t('gps.lapTime')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowSummary(false); setRoute([]); setDuration(0); setDistance(0); setSummaryDuration(0); setSummaryDistance(0); setElevationGain(0); setSimMode(false); setMode(null); }} className="flex-1 py-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-sm hover:border-[var(--text-muted)] transition-all">{t('cal.cancel')}</button>
              <button onClick={saveGpsWorkout} disabled={saving || (route.length < 2 && !simMode)} className="flex-1 gradient-neon text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t('common.save')}</button>
            </div>
          </div>
        )}

        {!recording && route.length === 0 && !showSummary && !simMode && (
          <button onClick={startRecording} className="w-full gradient-neon text-black font-bold py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-lg">
            <Play className="w-6 h-6" fill="currentColor" /> Iniciar grabación
          </button>
        )}
        {simMode && !recording && !showSummary && (
          <button onClick={() => { setSummaryDistance(parseFloat(manualDistance) || 0); setSummaryDuration((parseInt(manualDuration) || 30) * 60); setShowSummary(true); }} disabled={!selectedSport} className="w-full gradient-neon text-black font-bold py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
            <Check className="w-6 h-6" /> Ver resumen y guardar
          </button>
        )}
        {recording && (
          <button onClick={stopRecording} className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-lg animate-pulse-neon">
            <Square className="w-6 h-6" fill="currentColor" /> Detener
          </button>
        )}
        {!recording && route.length > 1 && !showSummary && (
          <button onClick={saveGpsWorkout} disabled={saving} className="w-full gradient-neon text-black font-bold py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />} Guardar entrenamiento
          </button>
        )}
        {success && (
          <div className="glass-card rounded-2xl p-4 bg-[var(--neon-green)]/10 border-[var(--neon-green)]/30 flex items-center gap-3 animate-scale-in">
            <Check className="w-5 h-5 text-[var(--neon-green)]" />
            <p className="font-semibold text-[var(--neon-green)]">¡Ruta guardada! Visita el calendario para verla.</p>
          </div>
        )}
      </div>
    );
  }

  // Record exercise mode
  if (mode === 'record_exercise') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black font-display">Grabar ejercicio</h1>
          <button onClick={() => setMode(null)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancelar</button>
        </div>
        {success && (
          <div className="glass-card rounded-2xl p-4 bg-[var(--neon-green)]/10 border-[var(--neon-green)]/30 flex items-center gap-3 animate-scale-in">
            <Check className="w-5 h-5 text-[var(--neon-green)]" /><p className="font-semibold text-[var(--neon-green)]">¡Ejercicio registrado!</p>
          </div>
        )}
        {error && (
          <div className="glass-card rounded-2xl p-4 bg-red-500/10 border-red-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <p className="text-[var(--text-secondary)]">Selecciona el deporte que quieres registrar:</p>
        <div className="grid grid-cols-2 gap-3">
          {DEFAULT_SPORTS.map((sport) => {
            const isOutdoor = OUTDOOR_SPORTS.includes(sport.key);
            return (
              <button key={sport.key} onClick={() => {
                setSelectedSport(sport.key);
                setBlocks(generateBlocks(sport.key));
                if (isOutdoor) {
                  setMode('gps');
                }
              }} className={`glass-card rounded-3xl p-6 text-center transition-all group ${selectedSport === sport.key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/5' : ''}`}>
                <span className="text-5xl block mb-3 group-hover:scale-110 transition-transform">{sport.emoji}</span>
                <p className="font-bold text-sm">{sport.label}</p>
                {isOutdoor && <span className="text-[10px] text-[var(--neon-green)] font-semibold uppercase tracking-wider mt-1 block">GPS</span>}
              </button>
            );
          })}
        </div>
        <div className="glass-card rounded-2xl p-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Duración (minutos) — obligatorio</label>
          <div className="flex gap-2 flex-wrap">
            {[15, 30, 45, 60, 90].map((min) => (
              <button key={min} onClick={() => setManualDuration(String(min))} className={`px-4 py-2 rounded-xl border transition-all text-sm font-semibold ${manualDuration === String(min) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-[var(--text-secondary)]'}`}>{min} min</button>
            ))}
            <input type="number" value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} className="w-20 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-center text-sm focus:outline-none focus:border-[var(--neon-green)]" />
          </div>
        </div>
        {selectedSport && OUTDOOR_SPORTS.includes(selectedSport) && (
          <div className="glass-card rounded-2xl p-4">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Distancia (km) — obligatorio</label>
            <input type="number" step="0.01" value={manualDistance} onChange={(e) => setManualDistance(e.target.value)} placeholder="ej. 5.2" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
          </div>
        )}
        <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nombre personalizado (opcional)" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
        {blocks.length > 0 && selectedSport && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">Bloques del entrenamiento</span>
              <span className="text-xs font-bold text-[var(--neon-green)]">{blockProgress.completed}/{blockProgress.total} ({blockProgress.pct}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--bg-darkest)] mb-3 overflow-hidden">
              <div className="h-full gradient-neon rounded-full transition-all duration-500" style={{ width: `${blockProgress.pct}%` }} />
            </div>
            <div className="space-y-1.5">
              {blocks.map((block, i) => (
                <button key={i} onClick={() => toggleBlock(i)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${block.completed ? 'bg-[var(--neon-green)]/10' : 'bg-[var(--bg-darkest)]'}`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${block.completed ? 'gradient-neon' : 'border-2 border-[var(--border-subtle)]'}`}>
                    {block.completed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                  </div>
                  <div className="flex-1"><p className="text-sm font-medium">{block.name}</p><p className="text-[10px] text-[var(--text-muted)] uppercase">{block.type}</p></div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="glass-card rounded-2xl p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[var(--neon-green)]" /> Foto del entrenamiento</p>
          {photoPreview ? (
            <div className="relative">
              <img src={photoPreview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
              <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--border-subtle)] cursor-pointer hover:border-[var(--neon-green)] transition-all">
              <ImagePlus className="w-8 h-8 text-[var(--text-muted)] mb-2" />
              <span className="text-xs text-[var(--text-muted)]">JPG o PNG, máx. 5 MB</span>
              <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handlePhotoSelect} className="sr-only" />
            </label>
          )}
          {photoError && <p className="text-xs text-red-400 mt-2">{photoError}</p>}
        </div>
        <button onClick={() => { if (!manualDuration || parseInt(manualDuration) <= 0) { setError('La duración es obligatoria. Introduce cuántos minutos has entrenado.'); return; } if (selectedSport && OUTDOOR_SPORTS.includes(selectedSport) && (!manualDistance || parseFloat(manualDistance) <= 0)) { setError('La distancia es obligatoria para deportes al aire libre. Introduce cuántos kilómetros has recorrido.'); return; } setError(null); if (selectedSport) saveManualWorkout(selectedSport); }} disabled={saving || !selectedSport} className="w-full gradient-neon text-black font-bold py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />} Guardar ({manualDuration} min)
        </button>
        <label className="flex items-center gap-3 glass-card rounded-2xl p-4 cursor-pointer">
          <div className={`w-11 h-6 rounded-full transition-colors relative ${sharePublic ? 'bg-[var(--neon-green)]' : 'bg-[var(--border-subtle)]'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sharePublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </div>
          <input type="checkbox" checked={sharePublic} onChange={(e) => setSharePublic(e.target.checked)} className="sr-only" />
          <div><p className="font-semibold text-sm">Compartir con la comunidad</p><p className="text-xs text-[var(--text-muted)]">Visible en el feed de tus amigos</p></div>
        </label>
      </div>
    );
  }

  // Manual mode
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black font-display">Manual rápido</h1>
        <button onClick={() => setMode(null)} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Cancelar</button>
      </div>
      {success && (
        <div className="glass-card rounded-2xl p-4 bg-[var(--neon-green)]/10 border-[var(--neon-green)]/30 flex items-center gap-3 animate-scale-in">
          <Check className="w-5 h-5 text-[var(--neon-green)]" /><p className="font-semibold text-[var(--neon-green)]">¡Entrenamiento registrado!</p>
        </div>
      )}
      {error && (
        <div className="glass-card rounded-2xl p-4 bg-red-500/10 border-red-500/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /><p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <p className="text-[var(--text-secondary)]">Elige el deporte y la duración:</p>

      {/* Sport selection by category */}
      <div className="space-y-4">
        {SPORT_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">{cat.title}</p>
            <div className="grid grid-cols-2 gap-3">
              {cat.sports.map((sportKey) => {
                const sport = DEFAULT_SPORTS.find((s) => s.key === sportKey);
                if (!sport) return null;
                return (
                  <button key={sport.key} onClick={() => { if (!isPremium && PREMIUM_SPORTS.includes(sport.key)) { setShowPaywall(true); return; } setSelectedSport(sport.key); setBlocks(generateBlocks(sport.key)); }} className={`glass-card rounded-3xl p-5 text-center transition-all group relative ${selectedSport === sport.key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/5' : ''} ${!isPremium && PREMIUM_SPORTS.includes(sport.key) ? 'opacity-60' : ''}`}>
                    <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{sport.emoji}</span>
                    <p className="font-bold text-xs">{sport.label}</p>
                    {!isPremium && PREMIUM_SPORTS.includes(sport.key) && <span className="absolute top-2 right-2"><Lock className="w-3.5 h-3.5 text-[var(--neon-green)]" /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {profile?.sports?.filter((s) => !DEFAULT_SPORTS.some((ds) => ds.key === s)).map((sport) => (
          <button key={sport} onClick={() => { setSelectedSport(sport); setBlocks(generateBlocks(sport)); }} className={`glass-card rounded-3xl p-5 text-center transition-all group ${selectedSport === sport ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/5' : ''}`}>
            <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">🏅</span>
            <p className="font-bold text-xs">{sport}</p>
          </button>
        ))}
      </div>

      {/* Duration selector */}
      <div className="glass-card rounded-2xl p-4">
        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Duración (minutos) — obligatorio</label>
        <div className="flex gap-2 flex-wrap">
          {[15, 30, 45, 60, 90].map((min) => (
            <button key={min} onClick={() => setManualDuration(String(min))} className={`px-4 py-2 rounded-xl border transition-all text-sm font-semibold ${manualDuration === String(min) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-[var(--text-secondary)]'}`}>{min} min</button>
          ))}
          <input type="number" value={manualDuration} onChange={(e) => setManualDuration(e.target.value)} className="w-20 px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-center text-sm focus:outline-none focus:border-[var(--neon-green)]" />
        </div>
      </div>

      {/* CrossFit WOD type & score */}
      {selectedSport === 'crossfit' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Tipo de WOD</label>
            <div className="flex gap-2 flex-wrap">
              {['AMRAP', 'EMOM', 'For Time', 'Max Lift', 'Chipper'].map((wodTypeOption) => (
                <button key={wodTypeOption} onClick={() => setWodType(wodTypeOption)} className={`px-3 py-2 rounded-xl border transition-all text-sm font-semibold ${wodType === wodTypeOption ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-[var(--text-secondary)]'}`}>{wodTypeOption}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Resultado / Puntuación</label>
            <input type="text" value={wodScore} onChange={(e) => setWodScore(e.target.value)} placeholder="ej. 15 rondas + 10 rep / 8:32 / 120 kg" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
          </div>
        </div>
      )}

      {/* HYROX time & blocks breakdown */}
      {selectedSport === 'hyrox' && (
        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Tiempo total (mm:ss)</label>
            <input type="text" value={wodScore} onChange={(e) => setWodScore(e.target.value)} placeholder="ej. 1:15:30" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Desglose de bloques (opcional)</label>
            <input type="text" value={wodType} onChange={(e) => setWodType(e.target.value)} placeholder="ej. Run 8×4:30, Sled 2:00, Wall balls 3:00..." className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
          </div>
        </div>
      )}

      {selectedSport && OUTDOOR_SPORTS.includes(selectedSport) && (
        <div className="glass-card rounded-2xl p-4">
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Distancia (km) — obligatorio</label>
          <input type="number" step="0.01" value={manualDistance} onChange={(e) => setManualDistance(e.target.value)} placeholder="ej. 5.2" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
        </div>
      )}

      <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nombre personalizado (opcional)" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />

      {/* Blocks */}
      {blocks.length > 0 && selectedSport && (
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Bloques del entrenamiento</span>
            <span className="text-xs font-bold text-[var(--neon-green)]">{blockProgress.completed}/{blockProgress.total} ({blockProgress.pct}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--bg-darkest)] mb-3 overflow-hidden">
            <div className="h-full gradient-neon rounded-full transition-all duration-500" style={{ width: `${blockProgress.pct}%` }} />
          </div>
          <div className="space-y-1.5">
            {blocks.map((block, i) => (
              <button key={i} onClick={() => toggleBlock(i)} className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${block.completed ? 'bg-[var(--neon-green)]/10' : 'bg-[var(--bg-darkest)]'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${block.completed ? 'gradient-neon' : 'border-2 border-[var(--border-subtle)]'}`}>
                  {block.completed && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                </div>
                <div className="flex-1"><p className="text-sm font-medium">{block.name}</p><p className="text-[10px] text-[var(--text-muted)] uppercase">{block.type}</p></div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Photo upload */}
      <div className="glass-card rounded-2xl p-4">
        <p className="font-semibold text-sm mb-3 flex items-center gap-2"><Camera className="w-4 h-4 text-[var(--neon-green)]" /> Foto del entrenamiento</p>
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="preview" className="w-full h-40 object-cover rounded-xl" />
            <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/60 flex items-center justify-center text-white"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-[var(--border-subtle)] cursor-pointer hover:border-[var(--neon-green)] transition-all">
            <ImagePlus className="w-8 h-8 text-[var(--text-muted)] mb-2" />
            <span className="text-xs text-[var(--text-muted)]">JPG o PNG, máx. 5 MB</span>
            <input type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handlePhotoSelect} className="sr-only" />
          </label>
        )}
        {photoError && <p className="text-xs text-red-400 mt-2">{photoError}</p>}
      </div>

      {/* Save button */}
      <button onClick={() => { if (!manualDuration || parseInt(manualDuration) <= 0) { setError('La duración es obligatoria. Introduce cuántos minutos has entrenado.'); return; } if (selectedSport && OUTDOOR_SPORTS.includes(selectedSport) && (!manualDistance || parseFloat(manualDistance) <= 0)) { setError('La distancia es obligatoria para deportes al aire libre. Introduce cuántos kilómetros has recorrido.'); return; } setError(null); if (selectedSport) saveManualWorkout(selectedSport); }} disabled={saving || !selectedSport} className="w-full gradient-neon text-black font-bold py-4 rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg">
        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />} Guardar ({manualDuration} min)
      </button>

      {/* Privacy toggle */}
      <label className="flex items-center gap-3 glass-card rounded-2xl p-4 cursor-pointer">
        <div className={`w-11 h-6 rounded-full transition-colors relative ${sharePublic ? 'bg-[var(--neon-green)]' : 'bg-[var(--border-subtle)]'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${sharePublic ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
        <input type="checkbox" checked={sharePublic} onChange={(e) => setSharePublic(e.target.checked)} className="sr-only" />
        <div><p className="font-semibold text-sm">Compartir con la comunidad</p><p className="text-xs text-[var(--text-muted)]">Visible en el feed de tus amigos</p></div>
      </label>
      <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} contextLabel="Deporte Premium" />
    </div>
  );
}
