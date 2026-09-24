import { useEffect, useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Scale, TrendingDown, TrendingUp, Plus, X, Flame, Beef, Wheat, Droplet, Apple, Check, Info, Shuffle, Trash2, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getSportEmoji, getSportLabel, getMondayString, generateWeeklyPlan, fixPlanEmojis, enrichPlan, upgradePlan, type PlanDay } from '@/lib/planGenerator';
import { calculateNutrition, getMealSuggestions } from '@/lib/nutrition';
import { type Workout, type WeightLog } from '@/lib/types';
import ExerciseDetail from '@/components/ExerciseDetail';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAY_HEADERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export default function CalendarView() {
  const { user, profile, refreshProfile } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weekPlan, setWeekPlan] = useState<PlanDay[]>([]);
  const [swapFrom, setSwapFrom] = useState<number | null>(null);
  const [detailSport, setDetailSport] = useState<string | null>(null);
  const [detailDayIdx, setDetailDayIdx] = useState<number | null>(null);
  const [detailDayLabel, setDetailDayLabel] = useState<string | undefined>(undefined);
  const [spinCount, setSpinCount] = useState(0);
  const [showVagoneta, setShowVagoneta] = useState(false);
  const [spinningIdx, setSpinningIdx] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workout | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false);
  const { t } = useI18n();

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const [wRes, wlRes, planRes] = await Promise.all([
      supabase.from('workouts').select('*').eq('user_id', user.id).gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false }),
      supabase.from('weight_logs').select('*').eq('user_id', user.id).order('logged_at', { ascending: true }),
      supabase.from('weekly_plans').select('*').eq('user_id', user.id).eq('week_start', getMondayString(new Date())).maybeSingle(),
    ]);

    setWorkouts((wRes.data as Workout[]) || []);
    setWeightLogs((wlRes.data as WeightLog[]) || []);
    if (planRes.data) {
      const rawDays = fixPlanEmojis(planRes.data.plan_data as PlanDay[]);
      const needsUpgrade = !rawDays.every(d => d.blocks && d.blocks.length > 0 && d.blocks.some(b => b.target === b.blockType));
      if (needsUpgrade && user) {
        const upgraded = enrichPlan(upgradePlan(rawDays, (await supabase.from('profiles').select('goal').eq('id', user.id).maybeSingle()).data?.goal || 'general_fitness'));
        setWeekPlan(upgraded);
        await supabase.from('weekly_plans').update({ plan_data: upgraded }).eq('id', planRes.data.id);
      } else {
        setWeekPlan(enrichPlan(rawDays));
      }
    }
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    workouts.forEach((w) => { if (!map[w.date]) map[w.date] = []; map[w.date].push(w); });
    return map;
  }, [workouts]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [currentMonth]);

  const today = new Date().toISOString().split('T')[0];

  async function saveWeight() {
    if (!user || !newWeight) return;
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) return;
    await supabase.from('weight_logs').insert({ user_id: user.id, weight_kg: weight, logged_at: today });
    await supabase.from('profiles').update({ current_weight_kg: weight }).eq('id', user.id);
    await refreshProfile();
    setNewWeight('');
    setShowWeightModal(false);
    loadData();
  }

  function prevMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)); }
  function nextMonth() { setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)); }

  const weightChartPoints = useMemo(() => {
    if (weightLogs.length === 0) return [];
    const sorted = [...weightLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    const weights = sorted.map((w) => w.weight_kg);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;
    return sorted.map((w, i) => {
      const x = (i / Math.max(sorted.length - 1, 1)) * 100;
      const y = 100 - ((w.weight_kg - minW) / range) * 80 - 10;
      return { x, y, weight: w.weight_kg, date: w.logged_at };
    });
  }, [weightLogs]);

  const weightPath = useMemo(() => {
    if (weightChartPoints.length < 2) return '';
    return weightChartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [weightChartPoints]);

  const weightAreaPath = useMemo(() => {
    if (weightChartPoints.length < 2) return '';
    const first = weightChartPoints[0];
    const last = weightChartPoints[weightChartPoints.length - 1];
    return `${weightPath} L ${last.x} 100 L ${first.x} 100 Z`;
  }, [weightChartPoints, weightPath]);

  const weightTrend = useMemo(() => {
    if (weightLogs.length < 2) return null;
    const sorted = [...weightLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    return sorted[sorted.length - 1].weight_kg - sorted[0].weight_kg;
  }, [weightLogs]);

  async function swapDays(fromIdx: number, toIdx: number) {
    if (!user || fromIdx === toIdx) return;
    const newPlan = [...weekPlan];
    const temp = newPlan[fromIdx];
    newPlan[fromIdx] = newPlan[toIdx];
    newPlan[toIdx] = temp;
    setWeekPlan(newPlan);
    const weekStart = getMondayString(new Date());
    await supabase.from('weekly_plans').update({ plan_data: newPlan }).eq('user_id', user.id).eq('week_start', weekStart);
    setSwapFrom(null);
  }

  async function spinDay(idx: number) {
    if (!user || !profile) return;
    setSpinningIdx(idx);
    const allSports = profile.sports.length > 0 ? profile.sports : ['combined'];
    const newPlan = generateWeeklyPlan(profile.goal, allSports, new Date());
    const updated = [...weekPlan];
    updated[idx] = { ...newPlan[idx], day: weekPlan[idx].day, date: weekPlan[idx].date, completed: weekPlan[idx].completed };
    setWeekPlan(updated);
    const weekStart = getMondayString(new Date());
    await supabase.from('weekly_plans').update({ plan_data: updated }).eq('user_id', user.id).eq('week_start', weekStart);
    setSpinningIdx(null);
    const newCount = spinCount + 1;
    setSpinCount(newCount);
    if (newCount >= 3) {
      setShowVagoneta(true);
      setSpinCount(0);
      setTimeout(() => setShowVagoneta(false), 4000);
    }
  }

  async function deleteWorkout(workoutId: string) {
    if (!user) return;
    setDeleting(true);
    setDeleteError(false);
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId).eq('user_id', user.id);
    setDeleting(false);
    if (error) { setDeleteError(true); return; }
    setDeleteTarget(null);
    loadData();
  }

  const selectedWorkouts = selectedDate ? workoutsByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black font-display">{t('cal.title')}</h1>
        <button onClick={() => setShowWeightModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-neon text-black font-bold text-sm transition-all hover:scale-105 active:scale-95">
          <Scale className="w-4 h-4" /> {t('cal.weight')}
        </button>
      </div>

      {/* Weight chart */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3"><Scale className="w-5 h-5 text-[var(--neon-green)]" /><h3 className="font-bold">{t('cal.weightEvolution')}</h3></div>
          {weightTrend !== null && weightTrend !== 0 && (
            <div className={`flex items-center gap-1 text-sm font-semibold ${weightTrend < 0 ? 'text-[var(--neon-green)]' : 'text-orange-400'}`}>
              {weightTrend < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)} kg
            </div>
          )}
        </div>
        {weightLogs.length === 0 ? (
          <div className="text-center py-12"><Scale className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" /><p className="text-[var(--text-secondary)] text-sm">{t('cal.noWeight')}</p><p className="text-[var(--text-muted)] text-xs mt-1">{t('cal.addFirst')}</p></div>
        ) : weightLogs.length === 1 ? (
          <div className="text-center py-8"><p className="text-4xl font-black gradient-neon-text">{weightLogs[0].weight_kg} kg</p><p className="text-[var(--text-secondary)] text-sm mt-2">{t('cal.firstRecord')}</p></div>
        ) : (
          <>
            <div className="relative h-48 mb-4">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                <defs><linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" /><stop offset="100%" stopColor="#00ff88" stopOpacity="0" /></linearGradient></defs>
                {weightAreaPath && <path d={weightAreaPath} fill="url(#weightGradient)" />}
                {weightPath && <path d={weightPath} fill="none" stroke="#00ff88" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
                {weightChartPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#00ff88" vectorEffect="non-scaling-stroke" />)}
              </svg>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)]">
              <span>{weightLogs[0]?.logged_at}</span>
              <span className="text-[var(--neon-green)] font-bold">{weightLogs[weightLogs.length - 1]?.weight_kg} kg</span>
              <span>{weightLogs[weightLogs.length - 1]?.logged_at}</span>
            </div>
          </>
        )}
      </div>

      {/* Weekly plan */}
      {weekPlan.length > 0 && (
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shuffle className="w-5 h-5 text-[var(--neon-green)]" />
            <h3 className="font-bold">{t('cal.weeklyPlan')}</h3>
            {swapFrom !== null && <span className="text-xs text-[var(--neon-green)] ml-2">Toca otro día para intercambiar</span>}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekPlan.map((day, i) => (
              <div
                key={i}
                className={`rounded-2xl p-3 text-center border-2 transition-all ${spinningIdx === i ? 'border-[var(--neon-green)] neon-glow scale-105 animate-pulse' : swapFrom === i ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 neon-glow' : swapFrom !== null ? 'border-[var(--border-subtle)] cursor-pointer hover:border-[var(--neon-cyan)]' : 'border-[var(--border-subtle)]'}`}
                onClick={() => { if (swapFrom !== null && swapFrom !== i) swapDays(swapFrom, i); else if (swapFrom === i) setSwapFrom(null); }}
              >
                <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold mb-1">{day.day}</p>
                <p className="text-2xl mb-1">{day.emoji}</p>
                <p className="text-[9px] text-[var(--text-secondary)] truncate mb-2">{day.title}</p>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailSport(day.sport); setDetailDayIdx(i); setDetailDayLabel(day.day); }}
                    className="w-full text-[9px] py-1 rounded-lg bg-[var(--neon-green)]/10 text-[var(--neon-green)] font-semibold hover:bg-[var(--neon-green)]/20 transition-all flex items-center justify-center gap-1"
                  >
                    <Info className="w-3 h-3" /> {t('cal.details')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSwapFrom(swapFrom === i ? null : i); }}
                    className={`w-full text-[9px] py-1 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 ${swapFrom === i ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]' : 'bg-[var(--bg-darkest)] text-[var(--text-muted)] hover:text-[var(--neon-cyan)]'}`}
                  >
                    <ArrowRightLeft className="w-3 h-3" /> {swapFrom === i ? 'Cancelar' : 'Mover'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          {showVagoneta && (
            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 animate-scale-in flex items-center gap-3">
              <span className="text-3xl">😄</span>
              <p className="text-sm font-semibold text-orange-400">{t('cal.vagonetaMsg')}</p>
            </div>
          )}
        </div>
      )}

      {/* Calendar */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-display">{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] hover:border-[var(--neon-green)] transition-all flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextMonth} className="w-9 h-9 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] hover:border-[var(--neon-green)] transition-all flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 mb-2">
          {DAY_HEADERS.map((d, i) => <div key={i} className="text-center text-xs text-[var(--text-muted)] font-semibold py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((date, i) => {
            if (!date) return <div key={i} />;
            const dateStr = date.toISOString().split('T')[0];
            const dayWorkouts = workoutsByDate[dateStr] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            return (
              <button key={i} onClick={() => setSelectedDate(isSelected ? null : dateStr)} className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative ${isToday ? 'bg-[var(--neon-green)]/10 border border-[var(--neon-green)]' : isSelected ? 'bg-[var(--bg-card-hover)] border border-[var(--text-muted)]' : 'bg-[var(--bg-darkest)] border border-transparent hover:border-[var(--border-subtle)]'}`}>
                <span className={`text-xs font-semibold ${isToday ? 'text-[var(--neon-green)]' : 'text-[var(--text-secondary)]'}`}>{date.getDate()}</span>
                {dayWorkouts.length > 0 && <div className="flex gap-0.5 flex-wrap justify-center max-w-[90%]">{dayWorkouts.slice(0, 3).map((w, j) => <span key={j} className="text-xs leading-none">{getSportEmoji(w.sport)}</span>)}</div>}
                {dayWorkouts.length > 3 && <span className="text-[8px] text-[var(--text-muted)]">+{dayWorkouts.length - 3}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date workouts */}
      {selectedDate && (
        <div className="glass-card rounded-3xl p-6 animate-scale-in">
          <h3 className="font-bold mb-3">{new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          {selectedWorkouts.length === 0 ? <p className="text-[var(--text-secondary)] text-sm">{t('cal.noWorkoutsDay')}</p> : (
            <div className="space-y-2">
              {selectedWorkouts.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                  <span className="text-2xl">{getSportEmoji(w.sport)}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{w.custom_name || getSportLabel(w.sport)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{w.type === 'gps' ? '🗺️ GPS' : '✅ Manual'}{w.duration_sec && ` · ${Math.floor(w.duration_sec / 60)} min`}{w.distance_km && ` · ${parseFloat(String(w.distance_km)).toFixed(2)} km`}</p>
                  </div>
                  {w.is_shared && <span className="text-xs text-[var(--neon-green)]">{t('cal.shared')}</span>}
                  <button onClick={() => setDeleteTarget(w)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center flex-shrink-0" title={t('cal.delete')}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent workouts list */}
      <div>
        <h3 className="text-lg font-bold font-display mb-3">{t('cal.recentHistory')}</h3>
        {loading ? <div className="text-center py-8 text-[var(--text-muted)]">{t('cal.loading')}</div> : workouts.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center"><p className="text-[var(--text-secondary)]">{t('cal.noWorkouts')}</p><p className="text-[var(--text-muted)] text-sm mt-1">{t('cal.registerFirst')}</p></div>
        ) : (
          <div className="space-y-2">
            {workouts.slice(0, 3).map((w) => (
              <div key={w.id} className="glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-3 transition-all">
                <span className="text-2xl">{getSportEmoji(w.sport)}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{w.custom_name || getSportLabel(w.sport)}</p>
                  <p className="text-xs text-[var(--text-muted)]">{new Date(w.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}{w.duration_sec && ` · ${Math.floor(w.duration_sec / 60)} min`}{w.distance_km && ` · ${parseFloat(String(w.distance_km)).toFixed(2)} km`}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${w.is_shared ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'bg-[var(--bg-darkest)] text-[var(--text-muted)]'}`}>{w.is_shared ? t('cal.public') : t('cal.private')}</span>
                <button onClick={() => setDeleteTarget(w)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center flex-shrink-0" title={t('cal.delete')}><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {workouts.length > 3 && (
              <button onClick={() => setShowAllWorkouts(true)} className="w-full py-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--neon-green)] font-semibold text-sm hover:border-[var(--neon-green)] transition-all flex items-center justify-center gap-2">
                Ver todos ({workouts.length}) <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>


      {/* All workouts modal */}
      {showAllWorkouts && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in' onClick={() => setShowAllWorkouts(false)}>
          <div className='glass-card rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto animate-scale-in' onClick={(e) => e.stopPropagation()}>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-bold font-display'>Historial completo</h3>
              <button onClick={() => setShowAllWorkouts(false)} className='text-[var(--text-muted)] hover:text-[var(--text-primary)]'><X className='w-5 h-5' /></button>
            </div>
            <div className='space-y-2'>
              {workouts.map((w) => (
                <div key={w.id} className='glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-3 transition-all'>
                  <span className='text-2xl'>{getSportEmoji(w.sport)}</span>
                  <div className='flex-1'>
                    <p className='font-semibold text-sm'>{w.custom_name || getSportLabel(w.sport)}</p>
                    <p className='text-xs text-[var(--text-muted)]'>{new Date(w.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}{w.duration_sec && ' · ' + Math.floor(w.duration_sec / 60) + ' min'}{w.distance_km && ' · ' + parseFloat(String(w.distance_km)).toFixed(2) + ' km'}</p>
                  </div>
                  <span className={'text-xs px-2 py-1 rounded-full ' + (w.is_shared ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'bg-[var(--bg-darkest)] text-[var(--text-muted)]')}>{w.is_shared ? t('cal.public') : t('cal.private')}</span>
                  <button onClick={() => setDeleteTarget(w)} className='w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center flex-shrink-0' title={t('cal.delete')}><Trash2 className='w-4 h-4' /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Nutrition section */}
      <NutritionSection />

      {/* Exercise detail modal */}
      {detailSport && (
        <ExerciseDetail
          sport={detailSport}
          dayLabel={detailDayLabel}
          blocks={detailDayIdx !== null ? weekPlan[detailDayIdx]?.blocks : undefined}
          onClose={() => { setDetailSport(null); setDetailDayIdx(null); }}
          onChangeExercise={detailDayIdx !== null ? () => { spinDay(detailDayIdx); setDetailSport(null); setDetailDayIdx(null); } : undefined}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteTarget(null)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
              <div>
                <h3 className="text-lg font-bold font-display">{t('cal.confirmDelete')}</h3>
                <p className="text-xs text-[var(--text-muted)]">{deleteTarget.custom_name || getSportLabel(deleteTarget.sport)}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-5">{t('cal.confirmDeleteMsg')}</p>
            {deleteError && <p className="text-xs text-red-400 mb-3">{t('cal.delete')} error</p>}
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-sm hover:border-[var(--text-muted)] transition-all">{t('cal.cancel')}</button>
              <button onClick={() => deleteWorkout(deleteTarget.id)} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2">{deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} {t('cal.delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Weight modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowWeightModal(false)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-display">{t('cal.registerWeight')}</h3>
              <button onClick={() => setShowWeightModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-[var(--text-secondary)] text-sm mb-4">Hoy, {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</p>
            <input type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder={t('cal.weightInKg')} autoFocus className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-2xl font-bold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" />
            <button onClick={saveWeight} disabled={!newWeight} className="w-full mt-4 gradient-neon text-black font-bold py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> {t('cal.saveWeight')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function NutritionSection() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [checkedMeals, setCheckedMeals] = useState<Record<number, boolean>>({});

  const nutrition = useMemo(() => {
    if (!profile) return null;
    return calculateNutrition(profile.goal, profile.current_weight_kg, profile.height_cm, profile.age, profile.sex);
  }, [profile]);

  const meals = useMemo(() => {
    if (!profile) return [];
    return getMealSuggestions(profile.goal, new Date().getDay());
  }, [profile]);

  if (!profile) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Apple className="w-5 h-5 text-[var(--neon-green)]" />
        <h3 className="text-lg font-bold font-display">{t('cal.nutrition')}</h3>
        <span className="ml-auto text-xs text-[var(--text-muted)]">{t('goal.' + profile.goal)}</span>
      </div>

      {nutrition ? (
        <div className="space-y-3">
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center"><Flame className="w-5 h-5 text-black" /></div>
              <div>
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('cal.dailyCalories')}</p>
                <p className="text-xl font-black font-display">{nutrition.targetCalories} kcal</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-xl bg-[var(--bg-darkest)]"><Beef className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" /><p className="text-sm font-bold">{nutrition.proteinG}g</p><p className="text-[10px] text-[var(--text-muted)]">{t('cal.protein')}</p></div>
              <div className="text-center p-2 rounded-xl bg-[var(--bg-darkest)]"><Wheat className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" /><p className="text-sm font-bold">{nutrition.carbsG}g</p><p className="text-[10px] text-[var(--text-muted)]">{t('cal.carbs')}</p></div>
              <div className="text-center p-2 rounded-xl bg-[var(--bg-darkest)]"><Droplet className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" /><p className="text-sm font-bold">{nutrition.fatG}g</p><p className="text-[10px] text-[var(--text-muted)]">{t('cal.fat')}</p></div>
            </div>
          </div>
          <div className="space-y-2">
            {meals.map((meal, i) => (
              <button key={i} onClick={() => setCheckedMeals((prev) => ({ ...prev, [i]: !prev[i] }))} className={`w-full glass-card glass-card-hover rounded-2xl p-3 flex items-center gap-3 transition-all text-left ${checkedMeals[i] ? 'border-[var(--neon-green)]/30 bg-[var(--neon-green)]/5' : ''}`}>
                <span className="text-2xl">{meal.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${checkedMeals[i] ? 'line-through text-[var(--text-muted)]' : ''}`}>{meal.name}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{meal.description}</p>
                </div>
                <span className="text-xs font-semibold text-[var(--neon-green)] bg-[var(--neon-green)]/10 px-2 py-0.5 rounded-full">{meal.calories} kcal</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${checkedMeals[i] ? 'border-[var(--neon-green)] bg-[var(--neon-green)]' : 'border-[var(--border-subtle)]'}`}>
                  {checkedMeals[i] && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-[var(--text-secondary)] text-sm">Completa tus datos corporales en el onboarding para ver tu plan nutricional.</p>
        </div>
      )}
    </div>
  );
}
