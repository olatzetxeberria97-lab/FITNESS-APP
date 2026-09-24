import { useEffect, useState, useCallback } from 'react';
import { Droplets, Flame, Check, ChevronRight, Calendar, TrendingDown, TrendingUp, Heart, Footprints, Activity, RefreshCw, Loader2, Info, Video, Award, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import {
  generateWeeklyPlan,
  getMondayString,
  getSportLabel,
  fixPlanEmojis,
  enrichPlan,
  upgradePlan,
  type PlanDay,
} from '@/lib/planGenerator';
import { GOAL_EMOJIS } from '@/lib/types';
import ExerciseDetail from '@/components/ExerciseDetail';
import { storeTodayPlan, scheduleDailyReminders } from '@/lib/notifications';

const OMS_DAILY_MIN_GOAL = 45;
const DAILY_STEPS_GOAL = 10000;
const DAILY_CAL_GOAL = 500;
const RING_SEGMENTS = 45;

export default function Dashboard({ onNavigate }: { onNavigate: (tab: 'record' | 'calendar' | 'nutrition' | 'summary' | 'achievements' | 'challenges' | 'subscription') => void }) {
  const { profile, user, isPremium } = useAuth();
  const { t } = useI18n();
  const [plan, setPlan] = useState<PlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hydration, setHydration] = useState(0);
  const [todayWorkoutDone, setTodayWorkoutDone] = useState(false);
  const [weekStats, setWeekStats] = useState({ completed: 0, total: 0 });
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySteps, setTodaySteps] = useState(0);
  const [todayCalories, setTodayCalories] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [regenDone, setRegenDone] = useState(false);
  const [detailSport, setDetailSport] = useState<string | null>(null);
  const [detailDayLabel, setDetailDayLabel] = useState<string | undefined>(undefined);
  const [detailDay, setDetailDay] = useState<PlanDay | null>(null);
  const [weekMinutes, setWeekMinutes] = useState(0);
  const [weekExerciseDays, setWeekExerciseDays] = useState(0);
  const [weekStepDays, setWeekStepDays] = useState(0);
  const [restCount, setRestCount] = useState(0);
  const [restSaving, setRestSaving] = useState(false);
  const [restMessage, setRestMessage] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const loadPlan = useCallback(async () => {
    if (!user || !profile) return;
    setLoading(true);

    const weekStart = getMondayString(new Date());

    const { data: existing } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle();

    let planDays: PlanDay[];

    if (existing) {
      const rawDays = fixPlanEmojis(existing.plan_data as PlanDay[]);
      const needsUpgrade = !rawDays.every(d => d.blocks && d.blocks.length > 0 && d.blocks.some(b => b.target === b.blockType));
      if (needsUpgrade) {
        planDays = enrichPlan(upgradePlan(rawDays, profile.goal));
        await supabase.from('weekly_plans').update({ plan_data: planDays }).eq('id', existing.id);
      } else {
        planDays = enrichPlan(rawDays);
      }
    } else {
      planDays = enrichPlan(generateWeeklyPlan(profile.goal, profile.sports, new Date()));
      await supabase.from('weekly_plans').insert({
        user_id: user.id,
        week_start: weekStart,
        plan_data: planDays,
      });
    }

    const { data: todayWorkouts } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    const tMinutes = (todayWorkouts || []).reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
    const tSteps = (todayWorkouts || []).reduce((sum, w) => sum + (w.steps_est || 0), 0);
    const tCal = (todayWorkouts || []).reduce((sum, w) => sum + (w.calories_est || 0), 0);
    setTodayMinutes(tMinutes);
    setTodaySteps(tSteps);
    setTodayCalories(tCal);

    if (todayWorkouts && todayWorkouts.length > 0) {
      const updated = planDays.map((d, i) => (i === todayIndex ? { ...d, completed: true } : d));
      setPlan(updated);
      setTodayWorkoutDone(true);
    } else {
      setPlan(planDays);
      setTodayWorkoutDone(false);
    }

    storeTodayPlan(planDays);
    if (profile?.notifications_enabled) scheduleDailyReminders();

    const trainingDays = planDays.filter((d) => d.type === 'training');
    const completedDays = planDays.filter((d) => d.type === 'training' && d.completed).length;
    setWeekStats({ completed: completedDays, total: trainingDays.length });



    // Count days with 45+ min exercise and days with 10k+ steps
    const { data: weekWorkoutsFull } = await supabase.from("workouts").select("date,duration_sec,steps_est").eq("user_id", user.id).gte("date", weekStart);
    const byDate: Record<string, { min: number; steps: number }> = {};
    (weekWorkoutsFull || []).forEach((w) => {
      if (!byDate[w.date]) byDate[w.date] = { min: 0, steps: 0 };
      byDate[w.date].min += Math.floor((w.duration_sec || 0) / 60);
      byDate[w.date].steps += (w.steps_est || 0);
    });
    const exDays = Object.values(byDate).filter((d) => d.min >= 45).length;
    const stepDays = Object.values(byDate).filter((d) => d.steps >= 10000).length;
    setWeekExerciseDays(exDays);
    setWeekStepDays(stepDays);
    const totalMin = (weekWorkoutsFull || []).reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
    setWeekMinutes(totalMin);

    setLoading(false);
  }, [user, profile, today, todayIndex]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    function onWorkoutSaved() { loadPlan(); }
    window.addEventListener('workout-saved', onWorkoutSaved);
    return () => window.removeEventListener('workout-saved', onWorkoutSaved);
  }, [loadPlan]);

  useEffect(() => {
    const key = `hydration_${today}`;
    const stored = localStorage.getItem(key);
    setHydration(stored ? parseInt(stored) : 0);
  }, [today]);

  function addWater() {
    const newCount = hydration + 1;
    setHydration(newCount);
    localStorage.setItem(`hydration_${today}`, String(newCount));
  }

  function removeWater() {
    if (hydration === 0) return;
    const newCount = hydration - 1;
    setHydration(newCount);
    localStorage.setItem(`hydration_${today}`, String(newCount));
  }

  async function regenerateWeek() {
    if (!user || !profile) return;
    setRegenerating(true);
    const weekStart = getMondayString(new Date());
    const newPlan = generateWeeklyPlan(profile.goal, profile.sports, new Date());
    const { data: existing } = await supabase.from('weekly_plans').select('id').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
    if (existing) {
      await supabase.from('weekly_plans').update({ plan_data: newPlan }).eq('id', existing.id);
    } else {
      await supabase.from('weekly_plans').insert({ user_id: user.id, week_start: weekStart, plan_data: newPlan });
    }
    setPlan(newPlan);
    setRegenerating(false);
    setRegenDone(true);
    setTimeout(() => setRegenDone(false), 3000);
  }

  async function spinToday() {
    if (!user || !profile) return;
    const weekStart = getMondayString(new Date());
    const freshPlan = generateWeeklyPlan(profile.goal, profile.sports, new Date(), plan);
    const updated = [...freshPlan];
    setPlan(updated);
    setDetailDay(updated[todayIndex]);
    const { data: existing } = await supabase.from('weekly_plans').select('id').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
    if (existing) {
      await supabase.from('weekly_plans').update({ plan_data: updated }).eq('id', existing.id);
    }
  }

  async function markDayComplete() {
    if (!user || !profile) return;
    const todayPlan = plan[todayIndex];
    if (!todayPlan || todayPlan.type !== 'training') return;

    await supabase.from('workouts').insert({
      user_id: user.id,
      sport: todayPlan.sport,
      type: 'manual',
      date: today,
      notes: todayPlan.title,
      is_shared: false,
    });

    const updated = plan.map((d, i) => (i === todayIndex ? { ...d, completed: true } : d));
    setPlan(updated);
    setTodayWorkoutDone(true);

    const weekStart = getMondayString(new Date());
    await supabase
      .from('weekly_plans')
      .update({ plan_data: updated })
      .eq('user_id', user.id)
      .eq('week_start', weekStart);

    const completedDays = updated.filter((d) => d.type === 'training' && d.completed).length;
    const trainingDays = updated.filter((d) => d.type === 'training').length;
    setWeekStats({ completed: completedDays, total: trainingDays });
    window.dispatchEvent(new Event('workout-saved'));
  }

  async function markRestDay() {
    if (!user || !profile) return;
    setRestSaving(true);

    const weekStart = getMondayString(new Date());
    const restKey = `restCount_${weekStart}`;
    const stored = parseInt(localStorage.getItem(restKey) || '0');
    const newCount = stored + 1;
    localStorage.setItem(restKey, String(newCount));
    setRestCount(newCount);

    if (newCount <= 2) {
      setRestMessage('Está bien descansar, disfruta de tu día libre');
    } else {
      setRestMessage('¡Hombre, no se puede descansar todos los días, jeje!');
    }

    const updated = plan.map((d, i) => (i === todayIndex ? { ...d, completed: true } : d));
    setPlan(updated);
    await supabase.from('weekly_plans').update({ plan_data: updated }).eq('user_id', user.id).eq('week_start', weekStart);

    setRestSaving(false);
    window.dispatchEvent(new Event('workout-saved'));
  }

  useEffect(() => {
    const weekStart = getMondayString(new Date());
    const restKey = `restCount_${weekStart}`;
    setRestCount(parseInt(localStorage.getItem(restKey) || '0'));
  }, [today]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayPlan = plan[todayIndex];
  const hydrationGoal = 8;

  // Activity ring values
  const minPct = Math.min((todayMinutes / OMS_DAILY_MIN_GOAL) * 100, 100);
  const stepsPct = Math.min((todaySteps / DAILY_STEPS_GOAL) * 100, 100);
  const calPct = Math.min((todayCalories / DAILY_CAL_GOAL) * 100, 100);
  const filledSegments = Math.round((minPct / 100) * RING_SEGMENTS);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Greeting */}
      <div>
        <p className="text-[var(--text-secondary)] text-sm">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="text-3xl font-black font-display mt-1">
          {t('dash.hello')}, <span className="gradient-neon-text">{profile.display_name}</span>!
        </h1>
      </div>

      {/* Activity Rings */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[80px]" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          {/* Central ring with 45 segments */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              {/* Background track */}
              <circle cx="100" cy="100" r="80" fill="none" stroke="var(--bg-darkest)" strokeWidth="14" />
              {/* 45 segments */}
              {Array.from({ length: RING_SEGMENTS }).map((_, i) => {
                const angle = (i / RING_SEGMENTS) * 360;
                const rad = (angle * Math.PI) / 180;
                const x1 = 100 + 72 * Math.cos(rad);
                const y1 = 100 + 72 * Math.sin(rad);
                const x2 = 100 + 88 * Math.cos(rad);
                const y2 = 100 + 88 * Math.sin(rad);
                const isFilled = i < filledSegments;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isFilled ? 'url(#ringGradient)' : 'var(--border-subtle)'}
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{ transition: 'stroke 0.5s ease' }}
                  />
                );
              })}
              <defs>
                <linearGradient id="ringGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00ff88" />
                  <stop offset="100%" stopColor="#00e5ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-4xl font-black font-display tabular-nums">{todayMinutes}</p>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">/ {OMS_DAILY_MIN_GOAL} min</p>
            </div>
          </div>

          {/* Side meters */}
          <div className="flex-1 w-full space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-[var(--neon-cyan)]" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{t('dash.steps')}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{todaySteps.toLocaleString()} <span className="text-[var(--text-muted)] text-xs">/ {DAILY_STEPS_GOAL.toLocaleString()}</span></span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--bg-darkest)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stepsPct}%`, background: 'linear-gradient(90deg, #00e5ff, #00ff88)' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[var(--neon-green)]" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{t('dash.calories')}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{todayCalories} <span className="text-[var(--text-muted)] text-xs">/ {DAILY_CAL_GOAL}</span></span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--bg-darkest)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${calPct}%`, background: 'linear-gradient(90deg, #ff6b6b, #ffd93d)' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[var(--neon-green)]" />
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{t('dash.omsMinutes')}</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{todayMinutes} <span className="text-[var(--text-muted)] text-xs">/ {OMS_DAILY_MIN_GOAL}</span></span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[var(--bg-darkest)] overflow-hidden">
                <div className="h-full gradient-neon rounded-full transition-all duration-700" style={{ width: `${minPct}%` }} />
              </div>
            </div>
            {minPct >= 100 && stepsPct >= 100 && calPct >= 100 && (
              <p className="text-center text-[var(--neon-green)] text-sm font-semibold animate-fade-in">{t('dash.omsGoal')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly goal with dynamic counters */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Award className="w-5 h-5 text-[var(--neon-green)]" /><h3 className="font-bold">Objetivo semanal</h3></div>
          <span className="text-2xl font-black gradient-neon-text">{weekMinutes}<span className="text-sm text-[var(--text-secondary)]">/300 min</span></span>
        </div>
        <div className="relative w-full h-6 rounded-full bg-[var(--bg-darkest)] overflow-hidden mb-4">
          <div className="h-full gradient-neon rounded-full transition-all duration-700" style={{ width: `${Math.min((weekMinutes / 300) * 100, 100)}%` }} />
          {[100, 200, 300].map((m) => (
            <div key={m} className="absolute top-0 bottom-0 w-0.5 bg-[var(--text-muted)]/30" style={{ left: `${(m / 300) * 100}%` }}>
              <span className="absolute -top-0 -translate-y-full text-[9px] text-[var(--text-muted)]">{m}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[var(--text-muted)] mb-4">
          <span>0</span><span>100 min</span><span>200 min</span><span>300 min (OMS)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl p-4 bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--text-secondary)]">Días de ejercicio (45 min)</span></div>
            <p className="text-2xl font-black font-display">{weekExerciseDays}<span className="text-sm text-[var(--text-muted)]">/5 días</span></p>
            <div className="w-full h-2 rounded-full bg-[var(--bg-card)] mt-2 overflow-hidden">
              <div className="h-full gradient-neon rounded-full transition-all duration-500" style={{ width: `${Math.min((weekExerciseDays / 5) * 100, 100)}%` }} />
            </div>
          </div>
          <div className="rounded-2xl p-4 bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-2"><Footprints className="w-4 h-4 text-[var(--neon-cyan)]" /><span className="text-xs font-semibold text-[var(--text-secondary)]">Días de 10k pasos</span></div>
            <p className="text-2xl font-black font-display">{weekStepDays}<span className="text-sm text-[var(--text-muted)]">/5 días</span></p>
            <div className="w-full h-2 rounded-full bg-[var(--bg-card)] mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((weekStepDays / 5) * 100, 100)}%`, background: 'linear-gradient(90deg, #00e5ff, #00ff88)' }} />
            </div>
          </div>
        </div>
        {weekExerciseDays >= 5 && weekStepDays >= 5 ? (
          <p className="text-center text-[var(--neon-green)] text-sm font-semibold mt-4 animate-fade-in">{t('sum.omsWeekly')}</p>
        ) : (weekExerciseDays > 0 || weekStepDays > 0) && todayIndex >= 5 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm mt-4 animate-fade-in">Aunque no hayas completado todos los ejercicios, el trabajo hecho es más que saludable, está muy bien y se da por bueno.</p>
        ) : null}
      </div>

      {/* Goal badge */}
      <div className="glass-card rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{GOAL_EMOJIS[profile.goal]}</span>
          <div>
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('dash.yourGoal')}</p>
            <p className="font-bold">{t('goal.' + profile.goal)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('dash.thisWeek')}</p>
          <p className="font-bold text-[var(--neon-green)]">{weekStats.completed}/{weekStats.total} {t('dash.days')}</p>
        </div>
      </div>

      {/* Today's plan */}
      {todayPlan && (
        <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[60px]" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[var(--neon-green)] uppercase tracking-wider font-semibold">{t('dash.today')}</p>
                <h2 className="text-2xl font-black font-display mt-1">{todayPlan.title}</h2>
              </div>
              <span className="text-5xl">{todayPlan.emoji}</span>
            </div>
            <p className="text-[var(--text-secondary)] mb-5">{todayPlan.description}</p>
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => { setDetailSport(todayPlan.sport); setDetailDayLabel(t('dash.today')); setDetailDay(todayPlan); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-semibold text-sm transition-all hover:bg-[var(--neon-green)]/20">
                <Info className="w-4 h-4" /> {t('dash.viewDetails')}
              </button>
              <button onClick={() => onNavigate('record')} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-neon text-black font-semibold text-sm transition-all hover:opacity-90">
                <Video className="w-4 h-4" /> {t('dash.recordActivity')}
              </button>
            </div>
            {todayPlan.type === 'training' && (
              <div className="flex items-center gap-3">
                {todayWorkoutDone ? (
                  <div className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-bold">
                    <Check className="w-5 h-5" /> {t('dash.doneToday')}
                  </div>
                ) : (
                  <>
                    <button onClick={markDayComplete} className="flex-1 gradient-neon text-black font-bold py-3.5 rounded-xl transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" /> {t('dash.markDone')}
                    </button>
                    <button onClick={() => onNavigate('record')} className="px-4 py-3.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all flex items-center gap-2 text-sm font-semibold">
                      <Flame className="w-5 h-5" /> {t('dash.gps')}
                    </button>
                  </>
                )}
              </div>
            )}
            {todayPlan.type === 'recovery' && (
              <div className="space-y-3">
                <div className="glass-card rounded-2xl p-4 bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-[var(--neon-cyan)] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-[var(--neon-cyan)] mb-1">¿Qué es la recuperación?</p>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        La recuperación es cuando tu cuerpo repara y fortalece los músculos tras el esfuerzo. Hay dos tipos:
                      </p>
                      <div className="mt-2 space-y-1.5">
                        <p className="text-xs text-[var(--text-secondary)]"><span className="font-semibold text-[var(--neon-cyan)]">Recuperación activa:</span> movimiento suave (movilidad, estiramientos, yoga, caminar) que estimula la circulación sin sobrecargar.</p>
                        <p className="text-xs text-[var(--text-secondary)]"><span className="font-semibold text-[var(--neon-cyan)]">Recuperación pasiva:</span> descanso absoluto, sueño de calidad y nutrición. Permite la regeneración profunda de los tejidos.</p>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-2">Sin recuperación no hay progreso: es durante el descanso cuando tu cuerpo se adapta y mejora.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 py-3.5 rounded-xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] font-semibold justify-center">
                  <Heart className="w-5 h-5" /> {t('dash.recoveryDay')}
                </div>
                <button onClick={() => { setDetailSport('recovery'); setDetailDayLabel(t('dash.today')); setDetailDay(todayPlan); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] font-semibold text-sm transition-all hover:bg-[var(--neon-cyan)]/20">
                  <Info className="w-4 h-4" /> {t('dash.viewDetails')}
                </button>
              </div>
            )}
            {todayPlan.type === 'rest' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 py-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold justify-center">
                  😴 {t('dash.restDay')}
                </div>
                <button onClick={markRestDay} disabled={restSaving} className="w-full py-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                  {restSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Tomar como día de descanso
                </button>
                {restMessage && (
                  <p className="text-sm text-center font-semibold animate-fade-in" style={{ color: restCount >= 3 ? 'var(--neon-cyan)' : 'var(--neon-green)' }}>
                    {restMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hydration tracker */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--neon-cyan)]/10 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-[var(--neon-cyan)]" />
            </div>
            <div>
              <h3 className="font-bold">{t('dash.hydration')}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{hydration} {t('dash.glasses')} {hydrationGoal}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={removeWater} className="w-9 h-9 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-red-400 transition-colors text-lg font-bold">−</button>
            <button onClick={addWater} className="w-9 h-9 rounded-lg bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/20 transition-colors text-lg font-bold">+</button>
          </div>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: hydrationGoal }).map((_, i) => (
            <div key={i} className={`flex-1 h-12 rounded-lg border transition-all duration-300 flex items-center justify-center ${i < hydration ? 'bg-gradient-to-t from-[var(--neon-cyan)]/30 to-[var(--neon-cyan)]/10 border-[var(--neon-cyan)]' : 'bg-[var(--bg-darkest)] border-[var(--border-subtle)]'}`}>
              <Droplets className={`w-5 h-5 transition-colors ${i < hydration ? 'text-[var(--neon-cyan)]' : 'text-[var(--text-muted)]'}`} />
            </div>
          ))}
        </div>
        {hydration >= hydrationGoal && <p className="text-center text-[var(--neon-cyan)] text-sm font-semibold mt-3 animate-fade-in">{t('dash.hydrationGoal')}</p>}
      </div>

      {/* Week overview — redesigned horizontal card carousel */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[var(--neon-green)]" />
            {t('dash.weekPlan')}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[var(--neon-green)] tabular-nums">{weekStats.completed}/{weekStats.total}</span>
            <button onClick={() => onNavigate('calendar')} className="text-sm text-[var(--neon-green)] hover:underline flex items-center gap-1">
              {t('dash.viewCalendar')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal scrollable day cards */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {plan.map((day, i) => {
            const isToday = i === todayIndex;
            const isDone = day.completed;
            const isTraining = day.type === 'training';
            const isRecovery = day.type === 'recovery';
            const isRest = day.type === 'rest';

            const accentColor = isTraining
              ? 'var(--neon-green)'
              : isRecovery
                ? 'var(--neon-cyan)'
                : 'var(--text-muted)';

            return (
              <button
                key={i}
                onClick={() => { setDetailSport(day.sport); setDetailDayLabel(day.day); setDetailDay(day); }}
                className={`flex-shrink-0 w-32 snap-start rounded-3xl p-4 border-2 transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] text-left relative overflow-hidden ${
                  isToday
                    ? 'border-[var(--neon-green)] neon-glow bg-[var(--neon-green)]/5'
                    : isDone
                      ? 'border-[var(--neon-green)]/30 bg-[var(--bg-card)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--text-muted)]'
                }`}
              >
                {/* Accent bar at top */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                  style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                />

                {/* Day name + date */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isToday ? 'text-[var(--neon-green)]' : 'text-[var(--text-muted)]'}`}>
                    {day.day}
                  </span>
                  {isToday && (
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-[var(--neon-green)]/20 text-[var(--neon-green)]">
                      Hoy
                    </span>
                  )}
                </div>

                {/* Large sport emoji */}
                <div className="flex items-center justify-center mb-3">
                  <span className="text-4xl transition-transform group-hover:scale-110">{day.emoji}</span>
                </div>

                {/* Sport label */}
                <p className="text-xs font-bold mb-1 truncate" style={{ color: isRest ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {isRest ? 'Descanso' : isRecovery ? 'Recuperación' : getSportLabel(day.sport)}
                </p>

                {/* Session title */}
                <p className="text-[10px] text-[var(--text-secondary)] leading-tight line-clamp-2 mb-2.5 min-h-[28px]">
                  {day.title}
                </p>

                {/* Status indicator */}
                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-[var(--neon-green)] flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-black" strokeWidth={3} />
                      </div>
                      <span className="text-[10px] font-semibold text-[var(--neon-green)]">Hecho</span>
                    </>
                  ) : isRest ? (
                    <span className="text-[10px] text-[var(--text-muted)]">Día libre</span>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border-subtle)] flex-shrink-0" />
                      <span className="text-[10px] text-[var(--text-muted)]">Pendiente</span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Regenerate button */}
        <button onClick={regenerateWeek} disabled={regenerating} className="w-full mt-3 py-2.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--neon-green)] hover:border-[var(--neon-green)] transition-all text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {regenerating ? t('dash.generating') : t('dash.regenerate')}
        </button>
        {regenDone && <p className="text-xs text-[var(--neon-green)] mt-2 text-center animate-fade-in">{t('dash.regenDone')}</p>}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => onNavigate('calendar')} className="glass-card glass-card-hover rounded-2xl p-4 text-left transition-all">
          <Calendar className="w-5 h-5 text-[var(--neon-green)] mb-2" />
          <p className="text-2xl font-black font-display">{weekStats.completed}</p>
          <p className="text-xs text-[var(--text-secondary)]">{t('dash.workouts')}</p>
        </button>
        <button onClick={() => onNavigate('calendar')} className="glass-card glass-card-hover rounded-2xl p-4 text-left transition-all">
          {profile.goal === 'lose_weight' || profile.goal === 'define' ? <TrendingDown className="w-5 h-5 text-[var(--neon-green)] mb-2" /> : profile.goal === 'gain_muscle' || profile.goal === 'gain_strength' ? <TrendingUp className="w-5 h-5 text-[var(--neon-green)] mb-2" /> : <Heart className="w-5 h-5 text-[var(--neon-green)] mb-2" />}
          <p className="text-2xl font-black font-display">{profile.current_weight_kg ? `${profile.current_weight_kg}kg` : '—'}</p>
          <p className="text-xs text-[var(--text-secondary)]">{t('dash.weight')}</p>
        </button>
        <button onClick={() => onNavigate('summary')} className="glass-card glass-card-hover rounded-2xl p-4 text-left transition-all">
          <Flame className="w-5 h-5 text-[var(--neon-green)] mb-2" />
          <p className="text-2xl font-black font-display">{weekStats.total > 0 ? Math.round((weekStats.completed / weekStats.total) * 100) : 0}%</p>
          <p className="text-xs text-[var(--text-secondary)]">{t('dash.progress')}</p>
        </button>
      </div>

      {/* Premium upsell banner */}
      {!isPremium && (
        <button onClick={() => onNavigate('subscription')} className="glass-card rounded-2xl p-4 text-left transition-all hover:border-[var(--neon-green)]/50 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[60px] pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Plan deportivo + alimenticio</p>
              <p className="text-xs text-[var(--text-muted)]">2 meses gratis de lanzamiento · Luego 4,99 €/mes</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--neon-green)] transition-colors" />
          </div>
        </button>
      )}

      {/* Exercise detail modal */}
      {detailSport && (
        <ExerciseDetail sport={detailSport} dayLabel={detailDayLabel} blocks={detailDay?.blocks} sessionGoal={detailDay?.sessionGoal} tips={detailDay?.tips} onClose={() => { setDetailSport(null); setDetailDay(null); }} onChangeExercise={detailDay ? () => { spinToday(); setDetailSport(null); setDetailDay(null); } : undefined} />
      )}
    </div>
  );
}
