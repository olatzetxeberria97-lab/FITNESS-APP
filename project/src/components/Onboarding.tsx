import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Plus, X, Loader2, Target, Dumbbell, Scale, Footprints, Home, Building2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { DEFAULT_SPORTS, STRENGTH_EQUIPMENT, RACE_GOALS, type Goal, type Sport } from '@/lib/types';
import { GOAL_LABELS } from '@/lib/types';
import GoalSelector from '@/components/GoalSelector';

const AVATAR_COLORS = ['#00ff88', '#00e5ff', '#ff6b6b', '#ffd93d', '#a78bfa', '#fb923c', '#34d399', '#f472b6'];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [customSports, setCustomSports] = useState<string[]>([]);
  const [customSportInput, setCustomSportInput] = useState('');
  const [weight, setWeight] = useState('');
  const [targetWeight, setWeightTarget] = useState('');
  const [height, setHeight] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | ''>('');

  // Sport-specific
  const [runningLevel, setRunningLevel] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [runningWeeklyKm, setRunningWeeklyKm] = useState('');
  const [strengthLocation, setStrengthLocation] = useState<'gym' | 'home' | ''>('');
  const [strengthEquipment, setStrengthEquipment] = useState<string[]>([]);
  const [raceGoal, setRaceGoal] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRunning = selectedSports.includes('running') || selectedSports.includes('walking');
  const hasStrength = selectedSports.includes('strength');
  const hasTeamSport = selectedSports.includes('football') || selectedSports.includes('basketball');
  const hasRacePrep = selectedSports.includes('running');

  const totalSteps = 5 + (hasRunning ? 1 : 0) + (hasStrength ? 1 : 0) + (hasRacePrep ? 1 : 0);

  function toggleSport(key: string) {
    setSelectedSports((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  function addCustomSport() {
    const trimmed = customSportInput.trim();
    if (trimmed && !customSports.includes(trimmed)) {
      setCustomSports([...customSports, trimmed]);
      setSelectedSports([...selectedSports, trimmed]);
      setCustomSportInput('');
    }
  }

  function removeCustomSport(sport: string) {
    setCustomSports(customSports.filter((s) => s !== sport));
    setSelectedSports(selectedSports.filter((s) => s !== sport));
  }

  function toggleEquipment(key: string) {
    setStrengthEquipment((prev) => (prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]));
  }

  function canProceed(): boolean {
    if (step === 0) return goal !== null;
    if (step === 1) return selectedSports.length > 0;
    if (step === 2) {
      if (goal === 'general_health') return true;
      return weight !== '' && parseFloat(weight) > 0;
    }
    if (step === 3) {
      if (goal === 'general_health') return true;
      return height !== '' && birthDate !== '' && sex !== '';
    }
    // Sport-specific steps
    if (hasRunning && step === 4) return runningLevel !== '' && runningWeeklyKm !== '';
    const raceStepIdx = hasRunning ? 5 : 4;
    if (hasRacePrep && step === raceStepIdx) return true;
    const strengthStepIdx = raceStepIdx + (hasRacePrep ? 1 : 0);
    if (hasStrength && step === strengthStepIdx) return strengthLocation !== '';
    return true;
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const updates: Record<string, unknown> = {
        goal,
        sports: [...selectedSports],
        onboarding_complete: true,
        avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      };
      if (weight) updates.current_weight_kg = parseFloat(weight);
      if (targetWeight) updates.target_weight_kg = parseFloat(targetWeight);
      if (height) updates.height_cm = parseFloat(height);
      if (birthDate) {
        updates.birth_date = birthDate;
        const birth = new Date(birthDate);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) calculatedAge--;
        updates.age = calculatedAge;
      }
      if (sex) updates.sex = sex;
      if (runningLevel) updates.running_level = runningLevel;
      if (runningWeeklyKm) updates.running_weekly_km = parseFloat(runningWeeklyKm);
      if (strengthLocation) updates.strength_location = strengthLocation;
      if (strengthEquipment.length > 0) updates.strength_equipment = strengthEquipment;
      if (raceGoal) updates.race_goal = raceGoal;

      const { error: updateError } = await supabase.from('profiles').update(updates).eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  function next() {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleFinish();
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  const isWeightStep = step === 2 && goal !== 'general_health';
  const isBodyStatsStep = step === 3 && goal !== 'general_health';
  const isRunningStep = hasRunning && step === 4;
  const isStrengthStep = hasStrength && step === (4 + (hasRunning ? 1 : 0) + (hasRacePrep ? 1 : 0));
  const isRaceStep = hasRacePrep && step === (hasRunning ? 5 : 4);
  const reviewStepIdx = 4 + (hasRunning ? 1 : 0) + (hasRacePrep ? 1 : 0) + (hasStrength ? 1 : 0);
  const isReviewStep = step === reviewStepIdx;

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#00ff88] opacity-[0.06] blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-[#00e5ff] opacity-[0.05] blur-[100px]" />

      <div className="relative z-10 w-full max-w-2xl animate-slide-up">
        <div className="flex gap-2 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'gradient-neon' : 'bg-[var(--border-subtle)]'}`} />
          ))}
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          {step === 0 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Target className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Paso 1</span></div>
              <h2 className="text-3xl font-black font-display mb-2">¿Cuál es tu objetivo?</h2>
              <p className="text-[var(--text-secondary)] mb-6">Elige tu meta principal. Podrás cambiarla más tarde.</p>
              <GoalSelector selected={goal} onSelect={setGoal} />
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Dumbbell className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Paso 2</span></div>
              <h2 className="text-3xl font-black font-display mb-2">¿Qué deportes practicas?</h2>
              <p className="text-[var(--text-secondary)] mb-6">Selecciona todos los que quieras. Puedes añadir los tuyos.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {DEFAULT_SPORTS.map((sport: Sport) => (
                  <button key={sport.key} onClick={() => toggleSport(sport.key)} className={`p-4 rounded-2xl border-2 transition-all text-left ${selectedSports.includes(sport.key) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--text-muted)]'}`}>
                    <span className="text-3xl block mb-2">{sport.emoji}</span>
                    <span className="text-sm font-semibold">{sport.label}</span>
                  </button>
                ))}
              </div>
              {customSports.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {customSports.map((sport) => (
                    <span key={sport} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-sm">{sport}<button onClick={() => removeCustomSport(sport)} className="text-[var(--text-muted)] hover:text-red-400"><X className="w-3.5 h-3.5" /></button></span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={customSportInput} onChange={(e) => setCustomSportInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSport())} placeholder="Añadir deporte personalizado..." className="flex-1 bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                <button onClick={addCustomSport} className="px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--neon-green)] transition-all"><Plus className="w-5 h-5 text-[var(--neon-green)]" /></button>
              </div>
              {hasTeamSport && <p className="text-xs text-[var(--text-muted)] mt-3">Los deportes de equipo se registran por tiempo (ej. 30 min de partido).</p>}
            </div>
          )}

          {isWeightStep && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Scale className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Paso 3</span></div>
              <h2 className="text-3xl font-black font-display mb-2">Tu peso actual</h2>
              <p className="text-[var(--text-secondary)] mb-6">Para personalizar tu plan y seguir tu progreso.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Peso actual (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="ej. 75.5" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-2xl font-bold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Peso objetivo (kg) <span className="text-[var(--text-muted)] normal-case">(opcional)</span></label>
                  <input type="number" step="0.1" value={targetWeight} onChange={(e) => setWeightTarget(e.target.value)} placeholder="ej. 70" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-4 text-2xl font-bold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                </div>
              </div>
            </div>
          )}

          {isBodyStatsStep && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Scale className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Paso 4</span></div>
              <h2 className="text-3xl font-black font-display mb-2">Tus datos corporales</h2>
              <p className="text-[var(--text-secondary)] mb-6">Para calcular tus calorías y plan ideal.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Altura (cm)</label><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-lg font-semibold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" /></div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Fecha de nacimiento</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-3 py-3 text-lg font-semibold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Sexo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['male', 'female'] as const).map((s) => (
                      <button key={s} onClick={() => setSex(s)} className={`py-3 rounded-xl border-2 transition-all font-semibold ${sex === s ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-[var(--text-secondary)]'}`}>{s === 'male' ? 'Hombre' : 'Mujer'}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isRunningStep && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Footprints className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Correr / Andar</span></div>
              <h2 className="text-3xl font-black font-display mb-2">Tu nivel de carrera</h2>
              <p className="text-[var(--text-secondary)] mb-6">Para adaptar el plan y las rutinas de calentamiento.</p>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {([['beginner', 'Principiante', 'Empezando o retomando'], ['intermediate', 'Intermedio', 'Corro con regularidad'], ['advanced', 'Avanzado', 'Preparo carreras']] as const).map(([key, label, desc]) => (
                    <button key={key} onClick={() => setRunningLevel(key)} className={`p-4 rounded-2xl border-2 text-center transition-all ${runningLevel === key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                      <p className="font-bold text-sm">{label}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{desc}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Kilómetros semanales habituales</label>
                  <input type="number" step="0.5" value={runningWeeklyKm} onChange={(e) => setRunningWeeklyKm(e.target.value)} placeholder="ej. 15" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-lg font-semibold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                </div>
                <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
                  <span className="text-2xl">🔊</span>
                  <p className="text-xs text-[var(--text-secondary)]">Al iniciar una actividad de correr o andar, la app activará audio-guía de hitos ("1 km, ¡vamos!", "2 km, ¡vas genial!").</p>
                </div>
              </div>
            </div>
          )}

          {isRaceStep && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Footprints className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Preparación de carreras</span></div>
              <h2 className="text-3xl font-black font-display mb-2">¿Preparas alguna carrera?</h2>
              <p className="text-[var(--text-secondary)] mb-6">Elige un objetivo de carrera y generaremos un plan específico.</p>
              <div className="grid grid-cols-2 gap-3">
                {RACE_GOALS.map((rg) => (
                  <button key={rg.key} onClick={() => setRaceGoal(rg.key)} className={`p-4 rounded-2xl border-2 text-center transition-all ${raceGoal === rg.key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                    <p className="text-2xl font-black gradient-neon-text mb-1">{rg.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{rg.desc}</p>
                  </button>
                ))}
                <button onClick={() => setRaceGoal(null)} className={`p-4 rounded-2xl border-2 text-center transition-all ${raceGoal === null ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                  <p className="text-lg font-bold mb-1">Sin carrera</p>
                  <p className="text-xs text-[var(--text-muted)]">Solo correr por salud</p>
                </button>
              </div>
            </div>
          )}

          {isStrengthStep && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-2"><Dumbbell className="w-6 h-6 text-[var(--neon-green)]" /><span className="text-xs font-semibold text-[var(--neon-green)] uppercase tracking-wider">Musculación</span></div>
              <h2 className="text-3xl font-black font-display mb-2">¿Dónde entrenas?</h2>
              <p className="text-[var(--text-secondary)] mb-6">Adaptaremos los ejercicios a tu equipamiento.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button onClick={() => setStrengthLocation('gym')} className={`p-5 rounded-2xl border-2 text-center transition-all ${strengthLocation === 'gym' ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                  <Building2 className="w-8 h-8 mx-auto mb-2 text-[var(--neon-green)]" />
                  <p className="font-bold">Gimnasio equipado</p>
                </button>
                <button onClick={() => setStrengthLocation('home')} className={`p-5 rounded-2xl border-2 text-center transition-all ${strengthLocation === 'home' ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                  <Home className="w-8 h-8 mx-auto mb-2 text-[var(--neon-green)]" />
                  <p className="font-bold">En casa</p>
                </button>
              </div>
              {strengthLocation === 'home' && (
                <div className="animate-fade-in">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">Material disponible</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STRENGTH_EQUIPMENT.map((eq) => (
                      <button key={eq.key} onClick={() => toggleEquipment(eq.key)} className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${strengthEquipment.includes(eq.key) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-[var(--text-secondary)]'}`}>
                        <div className="flex items-center gap-2">
                          {strengthEquipment.includes(eq.key) && <Check className="w-4 h-4" />}
                          {eq.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isReviewStep && (
            <div className="animate-fade-in text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-neon neon-glow mb-6 animate-pulse-neon">
                <Check className="w-10 h-10 text-black" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black font-display mb-3">¡Todo listo!</h2>
              <p className="text-[var(--text-secondary)] mb-6">Vamos a generar tu plan de entrenamiento personalizado y empezar a moverse.</p>
              <div className="grid grid-cols-2 gap-3 text-left mb-6">
                <div className="glass-card rounded-2xl p-4"><p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Objetivo</p><p className="font-bold">{goal && GOAL_LABELS[goal]}</p></div>
                <div className="glass-card rounded-2xl p-4"><p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">Deportes</p><p className="font-bold">{selectedSports.length} seleccionados</p></div>
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 mb-4">{error}</div>}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 && !saving && (
              <button onClick={back} className="px-5 py-3.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-2"><ArrowLeft className="w-5 h-5" />Atrás</button>
            )}
            <button onClick={next} disabled={!canProceed() || saving} className="flex-1 gradient-neon text-black font-bold py-3.5 rounded-xl transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : isReviewStep ? '¡Empezar a entrenar!' : <>Continuar<ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
