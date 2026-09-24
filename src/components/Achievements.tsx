import { useEffect, useState, useCallback } from 'react';
import { Trophy, Lock, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { ACHIEVEMENT_DEFINITIONS, ENDLESS_ACHIEVEMENTS, type EndlessAchievementTier, type Workout } from '@/lib/types';
import { getMondayString } from '@/lib/planGenerator';

const WORDS = [
  { name: 'Mundo 1: Inicios', emoji: '🌱', color: '#00ff88', desc: 'Tus primeros pasos en PULSE' },
  { name: 'Mundo 2: Constancia', emoji: '⚡', color: '#00e5ff', desc: 'La rutina se convierte en hábito' },
  { name: 'Mundo 3: Leyenda', emoji: '👑', color: '#ffd93d', desc: 'Te has convertido en una leyenda del fitness' },
];

export default function Achievements() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [activeWeeks, setActiveWeeks] = useState(0);

  const loadAchievements = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('achievements').select('achievement_key').eq('user_id', user.id);
    setUnlocked((data || []).map((a: { achievement_key: string }) => a.achievement_key));

    const { count } = await supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    setTotalWorkouts(count || 0);

    const { data: allWorkouts } = await supabase.from('workouts').select('duration_sec,distance_km,date').eq('user_id', user.id);
    const workouts = (allWorkouts || []) as Pick<Workout, 'duration_sec' | 'distance_km' | 'date'>[];
    setTotalMinutes(workouts.reduce((sum: number, w) => sum + Math.floor((w.duration_sec || 0) / 60), 0));
    setTotalKm(workouts.reduce((sum: number, w) => sum + (w.distance_km ? parseFloat(String(w.distance_km)) : 0), 0));

    const weekMap = new Map<string, boolean>();
    workouts.forEach((w) => {
      if (w.date) {
        const d = new Date(w.date);
        const monday = getMondayString(d);
        weekMap.set(monday, true);
      }
    });
    setActiveWeeks(weekMap.size);

    setLoading(false);
  }, [user]);

  useEffect(() => { loadAchievements(); }, [loadAchievements]);

  function checkEndlessUnlocked(category: string, tier: EndlessAchievementTier): boolean {
    if (category === 'Entrenamientos totales') return totalWorkouts >= tier.threshold;
    if (category === 'Semanas consecutivas activo') return activeWeeks >= tier.threshold;
    if (category === 'Kilómetros totales') return totalKm >= tier.threshold;
    if (category === 'Minutos totales') return totalMinutes >= tier.threshold;
    return false;
  }

  function getProgress(category: string, tier: EndlessAchievementTier): { current: number; pct: number } {
    let current = 0;
    if (category === 'Entrenamientos totales') current = totalWorkouts;
    else if (category === 'Semanas consecutivas activo') current = activeWeeks;
    else if (category === 'Kilómetros totales') current = Math.round(totalKm);
    else if (category === 'Minutos totales') current = totalMinutes;
    const pct = Math.min((current / tier.threshold) * 100, 100);
    return { current, pct };
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" /></div>;
  }

  const unlockedCount = unlocked.length;
  const totalCount = ACHIEVEMENT_DEFINITIONS.length;
  const level = Math.floor(unlockedCount / 5) + 1;
  const xpInLevel = unlockedCount % 5;
  const xpForLevel = 5;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black font-display">Logros</h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30">
          <Trophy className="w-4 h-4 text-[var(--neon-green)]" />
          <span className="text-sm font-bold text-[var(--neon-green)]">{unlockedCount}/{totalCount}</span>
        </div>
      </div>

      {/* Level progress */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[60px]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl gradient-neon flex items-center justify-center">
              <span className="text-2xl font-black text-black">{level}</span>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Nivel actual</p>
              <h2 className="text-2xl font-black font-display">Nivel {level}</h2>
            </div>
          </div>
          <div className="w-full h-3 rounded-full bg-[var(--bg-darkest)] overflow-hidden">
            <div className="h-full gradient-neon rounded-full transition-all duration-700" style={{ width: `${(xpInLevel / xpForLevel) * 100}%` }} />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">{xpInLevel}/{xpForLevel} logros para el siguiente nivel</p>
        </div>
      </div>

      {/* Standard achievements */}
      {WORDS.map((world, wi) => {
        const worldAchievements = ACHIEVEMENT_DEFINITIONS.filter((a) => a.world === world.name);
        const worldUnlocked = worldAchievements.filter((a) => unlocked.includes(a.key)).length;
        const worldComplete = worldUnlocked === worldAchievements.length;

        return (
          <div key={wi} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${world.color}20`, border: `1px solid ${world.color}40` }}>
                <span className="text-xl">{world.emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold font-display">{world.name}</h3>
                <p className="text-xs text-[var(--text-muted)]">{world.desc}</p>
              </div>
              <span className="text-sm font-bold" style={{ color: world.color }}>{worldUnlocked}/{worldAchievements.length}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {worldAchievements.map((ach) => {
                const isUnlocked = unlocked.includes(ach.key);
                return (
                  <div key={ach.key} className={`glass-card rounded-2xl p-4 transition-all ${isUnlocked ? 'border-[var(--neon-green)]/30' : 'opacity-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${isUnlocked ? '' : 'grayscale'}`} style={{ backgroundColor: isUnlocked ? `${world.color}15` : 'var(--bg-darkest)' }}>
                        {isUnlocked ? ach.emoji : <Lock className="w-5 h-5 text-[var(--text-muted)]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{ach.label}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ach.description}</p>
                        {isUnlocked && <p className="text-[10px] text-[var(--neon-green)] mt-1 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Desbloqueado</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {worldComplete && (
              <div className="glass-card rounded-2xl p-3 text-center animate-fade-in" style={{ borderColor: `${world.color}40` }}>
                <p className="text-sm font-bold" style={{ color: world.color }}>¡Mundo completado! {world.emoji}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Endless / progressive achievements */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <div className="w-10 h-10 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 flex items-center justify-center">
            <InfinityIcon className="w-5 h-5 text-[var(--neon-green)]" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display">Logros interminables</h3>
            <p className="text-xs text-[var(--text-muted)]">Sin límite: sigue acumulando y desbloqueando niveles infinitos</p>
          </div>
        </div>

        {ENDLESS_ACHIEVEMENTS.map((cat) => {
          const unlockedTiers = cat.tiers.filter((tier) => checkEndlessUnlocked(cat.category, tier));
          const nextTier = cat.tiers.find((tier) => !checkEndlessUnlocked(cat.category, tier));

          return (
            <div key={cat.category} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.categoryEmoji}</span>
                <h4 className="font-bold text-sm">{cat.category}</h4>
                <span className="ml-auto text-xs font-bold text-[var(--neon-green)]">{unlockedTiers.length}/{cat.tiers.length}</span>
              </div>

              {nextTier && (
                <div className="glass-card rounded-2xl p-4 border-[var(--neon-green)]/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{nextTier.emoji}</span>
                      <span className="font-semibold text-sm">{nextTier.label}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{getProgress(cat.category, nextTier).current}/{nextTier.threshold}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-darkest)] overflow-hidden">
                    <div className="h-full gradient-neon rounded-full transition-all duration-700" style={{ width: `${getProgress(cat.category, nextTier).pct}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{nextTier.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {cat.tiers.map((tier) => {
                  const isUnlocked = checkEndlessUnlocked(cat.category, tier);
                  const progress = getProgress(cat.category, tier);
                  return (
                    <div key={tier.key} className={`glass-card rounded-xl p-3 transition-all ${isUnlocked ? 'border-[var(--neon-green)]/30' : 'opacity-60'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${isUnlocked ? '' : 'grayscale'}`} style={{ backgroundColor: isUnlocked ? 'var(--neon-green)' : 'var(--bg-darkest)' }}>
                          {isUnlocked ? tier.emoji : <Lock className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate">{tier.label}</p>
                        </div>
                      </div>
                      {isUnlocked ? (
                        <p className="text-[10px] text-[var(--neon-green)] flex items-center gap-1"><Sparkles className="w-3 h-3" /> Desbloqueado</p>
                      ) : (
                        <div>
                          <div className="w-full h-1 rounded-full bg-[var(--bg-darkest)] overflow-hidden mb-0.5">
                            <div className="h-full gradient-neon rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
                          </div>
                          <p className="text-[9px] text-[var(--text-muted)]">{progress.current}/{tier.threshold}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
