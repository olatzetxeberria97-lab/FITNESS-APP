import { useEffect, useState, useCallback } from 'react';
import { Activity, Clock, Footprints, Mountain, Flame, TrendingUp, Award, Watch, CloudRain, Home, Moon, Bed, Trophy, Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { getMondayString } from '@/lib/planGenerator';
import { ACHIEVEMENT_DEFINITIONS, type Workout } from '@/lib/types';

const OMS_WEEKLY_MIN_GOAL = 300;
const OMS_DAILY_MIN_GOAL = 30;
const OMS_STRENGTH_DAYS = 2;

export default function Summary() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [weekWorkouts, setWeekWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [sleepQuality, setSleepQuality] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ temp: number; condition: string; bad: boolean } | null>(null);
  const [showSleepSuggestion, setShowSleepSuggestion] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [pastWeeks, setPastWeeks] = useState<{weekStart: string; minutes: number; workouts: number; goalMet: boolean}[]>([]);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const weekStart = getMondayString(new Date());
    const { data } = await supabase.from('workouts').select('*').eq('user_id', user.id).gte('date', weekStart).order('date', { ascending: false });
    setWeekWorkouts(data || []);

    if (profile?.sleep_quality === 'poor' || profile?.sleep_quality === 'fair') {
      setShowSleepSuggestion(true);
    }

    // Try weather via geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const resp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current=temperature_2m,weather_code`);
            if (resp.ok) {
              const w = await resp.json();
              const code = w.current.weather_code;
              const temp = Math.round(w.current.temperature_2m);
              const bad = code >= 51 || code >= 61 || temp < 5;
              setWeather({ temp, condition: getWeatherDesc(code), bad });
            }
          } catch { /* weather optional */ }
        },
        () => {},
        { timeout: 5000 },
      );
    }

    // Load past weeks history
    const pastWeeksData: {weekStart: string; minutes: number; workouts: number; goalMet: boolean}[] = [];
    for (let i = 1; i <= 4; i++) {
      const pastStart = new Date();
      const day = pastStart.getDay();
      const diff = pastStart.getDate() - day + (day === 0 ? -6 : 1) - i * 7;
      pastStart.setDate(diff);
      const pastStartStr = pastStart.toISOString().split("T")[0];
      const pastEnd = new Date(pastStart);
      pastEnd.setDate(pastStart.getDate() + 6);
      const pastEndStr = pastEnd.toISOString().split("T")[0];
      const { data: pw } = await supabase.from("workouts").select("duration_sec").eq("user_id", user.id).gte("date", pastStartStr).lte("date", pastEndStr);
      const mins = (pw || []).reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
      pastWeeksData.push({ weekStart: pastStartStr, minutes: mins, workouts: (pw || []).length, goalMet: mins >= 300 });
    }
    setPastWeeks(pastWeeksData);

    setLoading(false);

    const { data: ach } = await supabase.from('achievements').select('achievement_key').eq('user_id', user.id);
    setUnlockedAchievements((ach || []).map((a: { achievement_key: string }) => a.achievement_key));
  }, [user, profile]);

  useEffect(() => { loadData(); }, [loadData]);

  function getWeatherDesc(code: number): string {
    if (code === 0) return 'Despejado';
    if (code <= 3) return 'Parcialmente nublado';
    if (code <= 48) return 'Niebla';
    if (code <= 57) return 'Llovizna';
    if (code <= 67) return 'Lluvia';
    if (code <= 77) return 'Nieve';
    if (code <= 82) return 'Lluvia intensa';
    if (code <= 86) return 'Aguanieve';
    if (code >= 95) return 'Tormenta';
    return 'Variable';
  }

  const weekMinutes = weekWorkouts.reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
  const todayMinutes = weekWorkouts.filter((w) => w.date === today).reduce((sum, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0);
  const totalKm = weekWorkouts.reduce((sum, w) => sum + (w.distance_km ? parseFloat(String(w.distance_km)) : 0), 0);
  const totalSteps = weekWorkouts.reduce((sum, w) => sum + (w.steps_est || 0), 0);
  const totalCalories = weekWorkouts.reduce((sum, w) => sum + (w.calories_est || 0), 0);
  const totalElevation = weekWorkouts.reduce((sum, w) => sum + (w.elevation_gain_m || 0), 0);
  const strengthDays = weekWorkouts.filter((w) => w.sport === 'strength').length;
  const workoutCount = weekWorkouts.length;

  const todayPct = Math.min((todayMinutes / OMS_DAILY_MIN_GOAL) * 100, 100);

  function getMilestoneMessage(): string | null {
    if (weekMinutes >= OMS_WEEKLY_MIN_GOAL) return '¡Has alcanzado los 300 minutos semanales recomendados por la OMS! Eres una máquina.';
    if (weekMinutes >= 200) return '¡200 minutos superados! Estás a un paso del objetivo OMS.';
    if (weekMinutes >= 100) return '¡100 minutos completados! Vas por buen camino.';
    return null;
  }

  async function setSleep(quality: 'good' | 'fair' | 'poor') {
    if (!user) return;
    setSleepQuality(quality);
    await supabase.from('profiles').update({ sleep_quality: quality }).eq('id', user.id);
    await refreshProfile();
    if (quality === 'poor' || quality === 'fair') setShowSleepSuggestion(true);
    else setShowSleepSuggestion(false);
  }

  async function markSoftRest() {
    if (!user) return;
    await supabase.from('workouts').insert({
      user_id: user.id,
      sport: 'rest',
      type: 'manual',
      date: today,
      is_shared: false,
      is_soft_rest: true,
      custom_name: 'Descanso suave',
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const milestone = getMilestoneMessage();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className='flex items-center gap-3'>
        <h1 className='text-3xl font-black font-display'>{t('sum.title')}</h1>
        <span className='text-xs font-semibold px-3 py-1 rounded-full bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/30'>Semana actual</span>
      </div>

      {/* Milestone celebration */}
      {milestone && (
        <div className="glass-card rounded-3xl p-6 bg-gradient-to-r from-[var(--neon-green)]/10 to-[var(--neon-cyan)]/10 border-[var(--neon-green)]/30 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-neon flex items-center justify-center"><Award className="w-6 h-6 text-black" /></div>
            <div><p className="font-bold text-[var(--neon-green)]">{t('sum.congrats')}</p><p className="text-sm text-[var(--text-secondary)]">{milestone}</p></div>
          </div>
        </div>
      )}

      {/* Weather */}
      {weather && (
        <div className={`glass-card rounded-2xl p-4 ${weather.bad ? 'border-orange-500/30 bg-orange-500/5' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-darkest)] flex items-center justify-center">
              {weather.bad ? <CloudRain className="w-5 h-5 text-orange-400" /> : <span className="text-2xl">{weather.temp > 20 ? '☀️' : weather.temp > 10 ? '⛅' : '🌤️'}</span>}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{weather.condition} · {weather.temp}°C</p>
              {weather.bad ? <p className="text-xs text-orange-400 mt-1">{t('sum.badWeather')}</p> : <p className="text-xs text-[var(--text-muted)] mt-1">{t('sum.goodWeather')}</p>}
            </div>
            {weather.bad && (
              <button onClick={() => {}} className="px-3 py-2 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] text-xs font-semibold flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> {t('sum.indoor')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sleep check-in */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <Moon className="w-5 h-5 text-[var(--neon-green)]" />
          <div><p className="font-semibold text-sm">{t('sum.sleepQuestion')}</p><p className="text-xs text-[var(--text-muted)]">{t('sum.sleepAdjust')}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([['good', t('sum.sleepGood'), '😴'], ['fair', t('sum.sleepFair'), '😐'], ['poor', t('sum.sleepPoor'), '😵']] as const).map(([key, label, emoji]) => (
            <button key={key} onClick={() => setSleep(key)} className={`py-3 rounded-xl border-2 transition-all text-center ${sleepQuality === key || profile?.sleep_quality === key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
              <span className="text-2xl block mb-1">{emoji}</span>
              <span className="text-xs font-semibold">{label}</span>
            </button>
          ))}
        </div>
        {showSleepSuggestion && (profile?.sleep_quality === 'poor' || profile?.sleep_quality === 'fair') && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 animate-fade-in">
              <p className="text-sm text-[var(--neon-cyan)] flex items-start gap-2">
              <Bed className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {t('sum.sleepSuggestion')}
            </p>
          </div>
        )}
      </div>

      {/* Today vs weekly */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('sum.today')}</p>
          <p className="text-3xl font-black font-display">{todayMinutes} <span className="text-sm text-[var(--text-secondary)]">min</span></p>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-darkest)] mt-2 overflow-hidden">
            <div className="h-full gradient-neon rounded-full" style={{ width: `${todayPct}%` }} />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">{t('sum.dailyGoal')}: {OMS_DAILY_MIN_GOAL} min</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{t('sum.strengthDays')}</p>
          <p className="text-3xl font-black font-display">{strengthDays} <span className="text-sm text-[var(--text-secondary)]">/{OMS_STRENGTH_DAYS}</span></p>
          <div className="w-full h-1.5 rounded-full bg-[var(--bg-darkest)] mt-2 overflow-hidden">
            <div className="h-full gradient-neon rounded-full" style={{ width: `${Math.min((strengthDays / OMS_STRENGTH_DAYS) * 100, 100)}%` }} />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">{t('sum.recommended')}: {OMS_STRENGTH_DAYS} {t('dash.days')}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4"><Clock className="w-5 h-5 text-[var(--neon-green)] mb-2" /><p className="text-2xl font-black font-display">{weekMinutes}</p><p className="text-xs text-[var(--text-secondary)]">{t('sum.totalMinutes')}</p></div>
        <div className="glass-card rounded-2xl p-4"><Footprints className="w-5 h-5 text-[var(--neon-green)] mb-2" /><p className="text-2xl font-black font-display">{totalSteps.toLocaleString()}</p><p className="text-xs text-[var(--text-secondary)]">{t('dash.steps')}</p></div>
        <div className="glass-card rounded-2xl p-4"><TrendingUp className="w-5 h-5 text-[var(--neon-green)] mb-2" /><p className="text-2xl font-black font-display">{totalKm.toFixed(1)}</p><p className="text-xs text-[var(--text-secondary)]">{t('sum.km')}</p></div>
        <div className="glass-card rounded-2xl p-4"><Mountain className="w-5 h-5 text-[var(--neon-green)] mb-2" /><p className="text-2xl font-black font-display">{totalElevation}</p><p className="text-xs text-[var(--text-secondary)]">{t('sum.elevation')}</p></div>
        <div className="glass-card rounded-2xl p-4"><Flame className="w-5 h-5 text-[var(--neon-green)] mb-2" /><p className="text-2xl font-black font-display">{totalCalories}</p><p className="text-xs text-[var(--text-secondary)]">{t('dash.calories')}</p></div>
        <div className="glass-card rounded-2xl p-4"><Activity className="w-5 h-5 text-[var(--neon-green)] mb-2" /><p className="text-2xl font-black font-display">{workoutCount}</p><p className="text-xs text-[var(--text-secondary)]">{t('sum.workouts')}</p></div>
      </div>

      {/* Smartwatch sync */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--neon-green)]/10 flex items-center justify-center"><Watch className="w-5 h-5 text-[var(--neon-green)]" /></div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{t('sum.smartwatch')}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('sum.connectWatch')}</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--neon-green)] transition-all text-sm font-semibold">{t('sum.connect')}</button>
        </div>
      </div>

      {/* Soft rest */}
      <button onClick={markSoftRest} className="w-full glass-card glass-card-hover rounded-2xl p-4 flex items-center gap-3 transition-all">
        <Bed className="w-5 h-5 text-[var(--neon-cyan)]" />
        <div className="text-left">
          <p className="font-semibold text-sm">{t('sum.softRest')}</p>
          <p className="text-xs text-[var(--text-muted)]">{t('sum.softRestDesc')}</p>
        </div>
      </button>

      {/* Past weeks history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-[var(--neon-green)]" />
          <h3 className="text-lg font-bold font-display">Semanas anteriores</h3>
        </div>
        <div className="space-y-2">
          {pastWeeks.length === 0 ? (
            <div className="glass-card rounded-2xl p-4 text-center"><p className="text-[var(--text-secondary)] text-sm">Aún no hay semanas anteriores registradas.</p></div>
          ) : pastWeeks.map((pw, i) => {
            const weekDate = new Date(pw.weekStart);
            const weekEnd = new Date(weekDate);
            weekEnd.setDate(weekDate.getDate() + 6);
            const dateStr = `${weekDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
            return (
              <div key={i} className={`glass-card rounded-2xl p-4 flex items-center gap-3 ${pw.goalMet ? 'border-[var(--neon-green)]/30' : 'border-[var(--border-subtle)]'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pw.goalMet ? 'bg-[var(--neon-green)]/10' : 'bg-[var(--bg-darkest)]'}`}>
                  {pw.goalMet ? <Trophy className="w-5 h-5 text-[var(--neon-green)]" /> : <span className="text-xl">{pw.workouts > 0 ? '💪' : '😴'}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{dateStr}</p>
                  <p className="text-xs text-[var(--text-muted)]">{pw.minutes} min · {pw.workouts} entrenamientos</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${pw.goalMet ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : pw.workouts > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-[var(--bg-darkest)] text-[var(--text-muted)]'}`}>
                  {pw.goalMet ? 'Superada' : pw.workouts > 0 ? 'Parcial' : 'Sin actividad'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-[var(--neon-green)]" />
          <h3 className="text-lg font-bold font-display">{t('sum.achievements')}</h3>
          <span className="ml-auto text-sm font-bold text-[var(--neon-green)]">{unlockedAchievements.length}/{ACHIEVEMENT_DEFINITIONS.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ACHIEVEMENT_DEFINITIONS.map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.key);
            return (
              <div key={ach.key} className={`glass-card rounded-2xl p-4 transition-all ${isUnlocked ? 'border-[var(--neon-green)]/30' : 'opacity-50'}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isUnlocked ? '' : 'grayscale'}`} style={{ backgroundColor: isUnlocked ? 'var(--neon-green)' : 'var(--bg-darkest)' }}>
                    {isUnlocked ? ach.emoji : <Lock className="w-4 h-4 text-[var(--text-muted)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{ach.label}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ach.description}</p>
                    {isUnlocked && <p className="text-[10px] text-[var(--neon-green)] mt-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> {t('sum.unlocked')}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
