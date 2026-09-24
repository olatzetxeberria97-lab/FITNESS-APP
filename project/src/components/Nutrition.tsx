import { useMemo, useState, useEffect } from 'react';
import { Flame, Beef, Wheat, Droplet, Info, Apple, Moon, Activity, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { calculateNutrition, getMealSuggestions, getSportNutritionTip } from '@/lib/nutrition';
import { GOAL_LABELS } from '@/lib/types';
import { getSportLabel } from '@/lib/planGenerator';

const SLEEP_OPTIONS = [
  { key: 'good', label: 'Dormí bien', emoji: '😊', icon: Smile, color: 'text-[var(--neon-green)]' },
  { key: 'fair', label: 'Regular', emoji: '😐', icon: Meh, color: 'text-orange-400' },
  { key: 'poor', label: 'Dormí mal', emoji: '😟', icon: Frown, color: 'text-red-400' },
] as const;

const ENERGY_OPTIONS = [
  { key: 'high', label: 'Lleno de energía', emoji: '⚡', icon: Zap, color: 'text-[var(--neon-green)]' },
  { key: 'medium', label: 'Normal', emoji: '🔋', icon: BatteryMedium, color: 'text-orange-400' },
  { key: 'low', label: 'Cansado', emoji: '🪫', icon: BatteryLow, color: 'text-red-400' },
] as const;

const PHYSICAL_STATE_OPTIONS = [
  { key: 'great', label: 'Genial', emoji: '💪', desc: 'Sin molestias, listo para entrenar' },
  { key: 'ok', label: 'Bien', emoji: '👍', desc: 'Alguna tensión leve pero entreno sin problema' },
  { key: 'sore', label: 'Agujetas', emoji: '🦵', desc: 'Tengo agujetas o muscularmente cargado' },
  { key: 'pain', label: 'Molestia', emoji: '⚠️', desc: 'Tengo dolor o molestia que debo cuidar' },
] as const;

export default function Nutrition() {
  const { profile, user } = useAuth();
  const [sleepAnswered, setSleepAnswered] = useState(false);
  const [sleepQuality, setSleepQuality] = useState<string | null>(null);
  const [energyAnswered, setEnergyAnswered] = useState(false);
  const [energyLevel, setEnergyLevel] = useState<string | null>(null);
  const [physicalAnswered, setPhysicalAnswered] = useState(false);
  const [physicalState, setPhysicalState] = useState<string | null>(null);
  const [savingCheckin, setSavingCheckin] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    const storedSleep = localStorage.getItem(`sleep_${today}`);
    if (storedSleep) { setSleepAnswered(true); setSleepQuality(storedSleep); }
    const storedEnergy = localStorage.getItem(`energy_${today}`);
    if (storedEnergy) { setEnergyAnswered(true); setEnergyLevel(storedEnergy); }
    const storedPhysical = localStorage.getItem(`physical_${today}`);
    if (storedPhysical) { setPhysicalAnswered(true); setPhysicalState(storedPhysical); }
  }, [user, today]);

  const nutrition = useMemo(() => {
    if (!profile) return null;
    return calculateNutrition(
      profile.goal,
      profile.current_weight_kg,
      profile.height_cm,
      profile.age,
      profile.sex,
    );
  }, [profile]);

  const meals = useMemo(() => {
    if (!profile) return [];
    return getMealSuggestions(profile.goal, new Date().getDay());
  }, [profile]);

  const sportTip = useMemo(() => {
    if (!profile || profile.sports.length === 0) return null;
    const primarySport = profile.sports[0];
    return getSportNutritionTip(primarySport);
  }, [profile]);

  async function recordCheckin(type: 'sleep' | 'energy' | 'physical', value: string) {
    setSavingCheckin(true);
    if (type === 'sleep') { setSleepQuality(value); setSleepAnswered(true); localStorage.setItem(`sleep_${today}`, value); }
    else if (type === 'energy') { setEnergyLevel(value); setEnergyAnswered(true); localStorage.setItem(`energy_${today}`, value); }
    else { setPhysicalState(value); setPhysicalAnswered(true); localStorage.setItem(`physical_${today}`, value); }
    if (user) {
      const updates: Record<string, string> = {};
      if (type === 'sleep') updates.sleep_quality = value;
      else if (type === 'energy') updates.energy_level = value;
      else updates.physical_state = value;
      await supabase.from('profiles').update(updates).eq('id', user.id);
    }
    setSavingCheckin(false);
  }

  if (!profile) return null;

  const hasData = nutrition !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-black font-display">Nutrición</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1">
          Plan alimentario alineado con tu objetivo: <span className="text-[var(--neon-green)] font-semibold">{GOAL_LABELS[profile.goal]}</span>
        </p>
      </div>

      {/* Daily check-in */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[var(--neon-cyan)]" />
          <h3 className="font-bold">Check-in diario</h3>
        </div>

        {/* Sleep question */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Moon className="w-4 h-4 text-[var(--neon-cyan)]" />
            <p className="text-sm font-semibold">¿Cómo has dormido?</p>
          </div>
          {sleepAnswered ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--neon-green)]/30">
              <span className="text-2xl">{SLEEP_OPTIONS.find((o) => o.key === sleepQuality)?.emoji || '😴'}</span>
              <p className="text-sm font-semibold">{SLEEP_OPTIONS.find((o) => o.key === sleepQuality)?.label || 'Registrado'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {SLEEP_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => recordCheckin('sleep', opt.key)} disabled={savingCheckin}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--neon-green)] transition-all disabled:opacity-50">
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[11px] font-semibold text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Energy question */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-[var(--neon-green)]" />
            <p className="text-sm font-semibold">¿Qué nivel de energía tienes?</p>
          </div>
          {energyAnswered ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--neon-green)]/30">
              <span className="text-2xl">{ENERGY_OPTIONS.find((o) => o.key === energyLevel)?.emoji || '🔋'}</span>
              <p className="text-sm font-semibold">{ENERGY_OPTIONS.find((o) => o.key === energyLevel)?.label || 'Registrado'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {ENERGY_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => recordCheckin('energy', opt.key)} disabled={savingCheckin}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--neon-green)] transition-all disabled:opacity-50">
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-[11px] font-semibold text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Physical state question */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-[var(--neon-green)]" />
            <p className="text-sm font-semibold">¿Cómo está tu cuerpo hoy?</p>
          </div>
          {physicalAnswered ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--neon-green)]/30">
              <span className="text-2xl">{PHYSICAL_STATE_OPTIONS.find((o) => o.key === physicalState)?.emoji || '👍'}</span>
              <div>
                <p className="text-sm font-semibold">{PHYSICAL_STATE_OPTIONS.find((o) => o.key === physicalState)?.label || 'Registrado'}</p>
                <p className="text-xs text-[var(--text-muted)]">{PHYSICAL_STATE_OPTIONS.find((o) => o.key === physicalState)?.desc || ''}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {PHYSICAL_STATE_OPTIONS.map((opt) => (
                <button key={opt.key} onClick={() => recordCheckin('physical', opt.key)} disabled={savingCheckin}
                  className="flex items-center gap-2 p-3 rounded-xl border-2 border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--neon-green)] transition-all disabled:opacity-50 text-left">
                  <span className="text-xl">{opt.emoji}</span>
                  <div>
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)] leading-tight">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {sleepAnswered && energyAnswered && physicalAnswered && (
          <p className="text-xs text-[var(--neon-green)] mt-4 text-center animate-fade-in">
            {physicalState === 'pain' || physicalState === 'sore'
              ? 'Tu cuerpo necesita cuidado hoy. Hemos adaptado tu plan para priorizar recuperación activa y estiramientos.'
              : energyLevel === 'low'
                ? 'Energía baja hoy. Tu plan se ajustará a una intensidad más moderada para no sobrecargarte.'
                : sleepQuality === 'poor'
                  ? 'Mal descanso detectado. Prioriza hidratación y sesiones de menor intensidad hoy.'
                  : '¡Check-in completo! Tu cuerpo está listo para entrenar al máximo.'}
          </p>
        )}
      </div>

      {!hasData && (
        <div className="glass-card rounded-3xl p-8 text-center">
          <Info className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Faltan datos para tu plan nutricional</h3>
          <p className="text-[var(--text-secondary)] text-sm">
            Para calcular tus calorías personalizadas necesitamos tu peso, altura, edad y sexo.
            Puedes actualizarlos desde el calendario (botón "Peso") o editando tu perfil.
          </p>
        </div>
      )}

      {hasData && nutrition && (
        <>
          {/* Calorie target */}
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[80px]" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl gradient-neon flex items-center justify-center">
                  <Flame className="w-6 h-6 text-black" />
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Calorías diarias</p>
                  <h2 className="text-3xl font-black font-display">{nutrition.targetCalories} <span className="text-lg text-[var(--text-secondary)]">kcal</span></h2>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 mb-4">
                <span className="text-xs font-semibold text-[var(--neon-green)]">{nutrition.goalLabel}</span>
              </div>

              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{nutrition.advice}</p>

              {sportTip && (
                <div className="mt-4 p-3 rounded-xl bg-[var(--neon-cyan)]/5 border border-[var(--neon-cyan)]/20 flex items-start gap-3">
                  <span className="text-xl">{sportTip.emoji}</span>
                  <div>
                    <p className="text-xs font-bold text-[var(--neon-cyan)] uppercase tracking-wider">Nutrición para {getSportLabel(sportTip.sportKey)}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{sportTip.tip}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="bg-[var(--bg-darkest)] rounded-2xl p-4 text-center border border-[var(--border-subtle)]">
                  <Beef className="w-5 h-5 text-[var(--neon-green)] mx-auto mb-2" />
                  <p className="text-2xl font-black font-display">{nutrition.proteinG}<span className="text-xs text-[var(--text-muted)]">g</span></p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Proteína</p>
                </div>
                <div className="bg-[var(--bg-darkest)] rounded-2xl p-4 text-center border border-[var(--border-subtle)]">
                  <Wheat className="w-5 h-5 text-[var(--neon-green)] mx-auto mb-2" />
                  <p className="text-2xl font-black font-display">{nutrition.carbsG}<span className="text-xs text-[var(--text-muted)]">g</span></p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Carbohidratos</p>
                </div>
                <div className="bg-[var(--bg-darkest)] rounded-2xl p-4 text-center border border-[var(--border-subtle)]">
                  <Droplet className="w-5 h-5 text-[var(--neon-green)] mx-auto mb-2" />
                  <p className="text-2xl font-black font-display">{nutrition.fatG}<span className="text-xs text-[var(--text-muted)]">g</span></p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Grasas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Metabolic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Metabolismo basal</p>
              <p className="text-xl font-bold">{nutrition.bmr} kcal</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">En reposo</p>
            </div>
            <div className="glass-card rounded-2xl p-4">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Gasto total</p>
              <p className="text-xl font-bold">{nutrition.tdee} kcal</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Con actividad</p>
            </div>
          </div>

          {/* Meal suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Apple className="w-5 h-5 text-[var(--neon-green)]" />
              <h3 className="text-lg font-bold font-display">Comidas de hoy</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {meals.map((meal, i) => (
                <div key={i} className="glass-card glass-card-hover rounded-2xl p-4 transition-all">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{meal.emoji}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{meal.name}</h4>
                        <span className="text-xs font-semibold text-[var(--neon-green)] bg-[var(--neon-green)]/10 px-2 py-0.5 rounded-full">{meal.calories} kcal</span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{meal.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
