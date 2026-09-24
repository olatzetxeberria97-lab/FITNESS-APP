import type { PlanDay } from './planGenerator';

const MORNING_HOUR = 12;
const AFTERNOON_HOUR = 18;
const STORAGE_KEY = 'pulse_notifications_scheduled';

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPermission(): NotificationPermission {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission as NotificationPermission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'unsupported';
  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

function getTodayPlanTitle(): { title: string; emoji: string } {
  try {
    const stored = localStorage.getItem('pulse_today_plan');
    if (stored) {
      const plan = JSON.parse(stored) as PlanDay;
      return { title: plan.title, emoji: plan.emoji };
    }
  } catch { /* ignore */ }
  return { title: 'tu sesión de hoy', emoji: '🔥' };
}

export function storeTodayPlan(plan: PlanDay[]): void {
  const today = new Date().toISOString().split('T')[0];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  const todayPlan = plan[todayIndex];
  if (todayPlan) {
    localStorage.setItem('pulse_today_plan', JSON.stringify(todayPlan));
    localStorage.setItem('pulse_today_plan_date', today);
  }
}

function getMotivationalMessage(planTitle: string, isAfternoon: boolean): string {
  const morningMessages = [
    `¡Es hora de entrenar! Hoy te toca: ${planTitle}. ¡A por ello!`,
    `¡Buenos días! Tu cuerpo te espera. Sesión de hoy: ${planTitle}.`,
    `¡Levántate y muévete! Hoy toca ${planTitle}. No dejes para mañana lo que puedes entrenar hoy.`,
    `¡Tu sesión de hoy te espera! ${planTitle}. Cada minuto cuenta.`,
  ];
  const afternoonMessages = [
    `¡No olvides tu entrenamiento! Hoy te toca ${planTitle}. Aún estás a tiempo.`,
    `¡La tarde es perfecta para moverse! Sesión pendiente: ${planTitle}.`,
    `¡No dejes pasar el día sin entrenar! Tu sesión: ${planTitle}.`,
    `¡Último aviso! Tu cuerpo necesita ${planTitle}. ¡Vamos!`,
  ];
  const pool = isAfternoon ? afternoonMessages : morningMessages;
  return pool[Math.floor(Math.random() * pool.length)];
}

function shouldNotify(): boolean {
  return notificationsSupported() && Notification.permission === 'granted';
}

function getLastScheduledDate(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function markScheduledToday(): void {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(STORAGE_KEY, today);
}

export function scheduleDailyReminders(): void {
  if (!shouldNotify()) return;

  const today = new Date().toISOString().split('T')[0];
  const lastScheduled = getLastScheduledDate();
  if (lastScheduled === today) return;

  markScheduledToday();

  const { title: planTitle } = getTodayPlanTitle();
  const now = new Date();

  scheduleForTime(now, MORNING_HOUR, 0, () => {
    if (shouldNotify()) {
      const msg = getMotivationalMessage(planTitle, false);
      new Notification('PULSE — Recordatorio de entrenamiento', {
        body: msg,
        icon: '/favicon.ico',
        tag: 'pulse-morning',
        data: { tab: 'dashboard' },
      });
    }
  });

  scheduleForTime(now, AFTERNOON_HOUR, 0, () => {
    if (shouldNotify()) {
      const msg = getMotivationalMessage(planTitle, true);
      new Notification('PULSE — ¡No olvides entrenar!', {
        body: msg,
        icon: '/favicon.ico',
        tag: 'pulse-afternoon',
        data: { tab: 'record' },
      });
    }
  });
}

function scheduleForTime(now: Date, hour: number, minute: number, callback: () => void): void {
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);

  if (target.getTime() <= now.getTime()) return;

  const delay = target.getTime() - now.getTime();
  setTimeout(callback, delay);
}

export function sendTestNotification(): void {
  if (!shouldNotify()) return;
  const { title: planTitle } = getTodayPlanTitle();
  new Notification('PULSE — Notificaciones activadas', {
    body: `¡Listo! Te recordaremos tu entrenamiento diario. Hoy te toca: ${planTitle}.`,
    icon: '/favicon.ico',
    tag: 'pulse-test',
  });
}

export async function enableReminders(): Promise<NotificationPermission> {
  const perm = await requestPermission();
  if (perm === 'granted') {
    localStorage.removeItem(STORAGE_KEY);
    scheduleDailyReminders();
    sendTestNotification();
  }
  return perm;
}

export function disableReminders(): void {
  localStorage.removeItem(STORAGE_KEY);
}
