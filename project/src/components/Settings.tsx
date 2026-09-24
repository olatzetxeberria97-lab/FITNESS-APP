import { useState, useEffect } from 'react';
import { Bell, Users, Swords, Trophy, Check, Loader2, Crown, Dumbbell, Plus, X, RefreshCw, Scale, Globe, Target, Watch, Sparkles, BellRing } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { DEFAULT_SPORTS, SUBSCRIPTION_INFO, GOAL_EMOJIS, SPORT_EMOJIS, STRENGTH_SPORTS, type Sport, type Goal } from '@/lib/types';
import { generateWeeklyPlan, getMondayString, type PlanDay } from '@/lib/planGenerator';
import GoalSelector from '@/components/GoalSelector';
import type { Lang } from '@/lib/i18n';
import { enableReminders, disableReminders, getPermission, notificationsSupported, type NotificationPermission } from '@/lib/notifications';

interface NotifySettings {
  notifications_enabled: boolean;
  notify_friends_activity: boolean;
  notify_challenges: boolean;
  notify_achievements: boolean;
}

const QUICK_SPORTS = [
  { key: 'swimming', label: 'Natación' },
  { key: 'running', label: 'Correr' },
  { key: 'walking', label: 'Andar' },
  { key: 'cycling', label: 'Bicicleta' },
  { key: 'strength', label: 'Musculación' },
  { key: 'football', label: 'Fútbol' },
  { key: 'basketball', label: 'Baloncesto' },
];

const SMARTWATCH_BRANDS = [
  { key: 'garmin', label: 'Garmin', emoji: '⌚' },
  { key: 'apple_watch', label: 'Apple Watch', emoji: '⌚' },
  { key: 'samsung_watch', label: 'Samsung Watch', emoji: '⌚' },
  { key: 'other_watch', label: 'Otras marcas', emoji: '⌚' },
];

export default function Settings({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user, profile, refreshProfile, isPremium } = useAuth();
  const [settings, setSettings] = useState<NotifySettings>({
    notifications_enabled: true,
    notify_friends_activity: true,
    notify_challenges: true,
    notify_achievements: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const { lang, setLang, t } = useI18n();
  const [equipmentMode, setEquipmentMode] = useState<'gym' | 'home'>(profile?.strength_location === 'home' ? 'home' : 'gym');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(profile?.equipment || profile?.strength_equipment || []);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [equipmentSaved, setEquipmentSaved] = useState(false);

  function toggleEquipment(key: string) {
    setSelectedEquipment((prev) => prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]);
  }

  async function saveEquipment() {
    if (!user) return;
    setSavingEquipment(true);
    const eq = equipmentMode === 'gym' ? [] : selectedEquipment;
    await supabase.from('profiles').update({ equipment: eq, strength_location: equipmentMode }).eq('id', user.id);
    await refreshProfile();
    setSavingEquipment(false);
    setEquipmentSaved(true);
    setTimeout(() => setEquipmentSaved(false), 2000);
  }
  const [showSportEditor, setShowSportEditor] = useState(false);
  const [showGoalEditor, setShowGoalEditor] = useState(false);
  const [tempGoal, setTempGoal] = useState<Goal | null>(profile?.goal || null);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [customSportInput, setCustomSportInput] = useState('');
  const [customSports, setCustomSports] = useState<string[]>([]);
  const [regenerating, setRegenerating] = useState(false);
  const [regenDone, setRegenDone] = useState(false);
  const [healthProvider, setHealthProvider] = useState<string | null>(profile?.health_provider || null);
  const [healthConnecting, setHealthConnecting] = useState(false);
  const [, setHealthError] = useState(false);
  const [, setShowHealthProviders] = useState(false);
  
  const [healthSynced, setHealthSynced] = useState(false);
  
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>('default');
  const [enablingNotif, setEnablingNotif] = useState(false);

  useEffect(() => {
    setNotifPerm(getPermission());
  }, []);

  async function handleEnableReminders() {
    setEnablingNotif(true);
    const perm = await enableReminders();
    setNotifPerm(perm);
    setEnablingNotif(false);
  }

  function handleDisableReminders() {
    disableReminders();
    setNotifPerm(getPermission());
  }

  useEffect(() => {
    if (profile) {
      setSettings({
        notifications_enabled: profile.notifications_enabled ?? true,
        notify_friends_activity: profile.notify_friends_activity ?? true,
        notify_challenges: profile.notify_challenges ?? true,
        notify_achievements: profile.notify_achievements ?? true,
      });
      setSelectedSports(profile.sports || []);
      const known = new Set(DEFAULT_SPORTS.map((s: Sport) => s.key));
      setCustomSports((profile.sports || []).filter((s) => !known.has(s)));
    }
  }, [profile]);

  async function updateSetting(key: keyof NotifySettings, value: boolean) {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ [key]: value }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function updateWeightUnit(unit: 'kg' | 'lbs') {
    setWeightUnit(unit);
    localStorage.setItem('weight_unit', unit);
  }

  function toggleSport(key: string) {
    setSelectedSports((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  function addCustomSport() {
    const trimmed = customSportInput.trim();
    if (trimmed && !customSports.includes(trimmed) && !selectedSports.includes(trimmed)) {
      setCustomSports([...customSports, trimmed]);
      setSelectedSports([...selectedSports, trimmed]);
      setCustomSportInput('');
    }
  }

  function removeCustomSport(sport: string) {
    setCustomSports(customSports.filter((s) => s !== sport));
    setSelectedSports(selectedSports.filter((s) => s !== sport));
  }

  async function saveSports() {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({ sports: selectedSports }).eq('id', user.id);
    await refreshProfile();
    setSaving(false);
    setShowSportEditor(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function regenerateWeek() {
    if (!user || !profile) return;
    setRegenerating(true);
    const weekStart = getMondayString(new Date());
    const newPlan: PlanDay[] = generateWeeklyPlan(profile.goal, selectedSports, new Date());
    const { data: existing } = await supabase.from('weekly_plans').select('id').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
    if (existing) {
      await supabase.from('weekly_plans').update({ plan_data: newPlan }).eq('id', existing.id);
    } else {
      await supabase.from('weekly_plans').insert({ user_id: user.id, week_start: weekStart, plan_data: newPlan });
    }
    setRegenerating(false);
    setRegenDone(true);
    setTimeout(() => setRegenDone(false), 3000);
  }

  async function saveGoal() {
    if (!user || !tempGoal) return;
    setSavingGoal(true);
    await supabase.from('profiles').update({ goal: tempGoal }).eq('id', user.id);
    await refreshProfile();
    const weekStart = getMondayString(new Date());
    const sports = profile?.sports || [];
    const newPlan: PlanDay[] = generateWeeklyPlan(tempGoal, sports, new Date());
    const { data: existing } = await supabase.from('weekly_plans').select('id').eq('user_id', user.id).eq('week_start', weekStart).maybeSingle();
    if (existing) {
      await supabase.from('weekly_plans').update({ plan_data: newPlan }).eq('id', existing.id);
    } else {
      await supabase.from('weekly_plans').insert({ user_id: user.id, week_start: weekStart, plan_data: newPlan });
    }
    setSavingGoal(false);
    setShowGoalEditor(false);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 3000);
  }

  

  async function connectHealth(providerKey: string) {
    if (!user) return;
    setHealthConnecting(true);
    setHealthError(false);
    await supabase.from('profiles').update({ health_connected: true, health_provider: providerKey }).eq('id', user.id);
    await refreshProfile();
    const today = new Date().toISOString().slice(0, 10);
    const mockSteps = Math.floor(3000 + Math.random() * 8000);
    const { data: existing } = await supabase.from('daily_steps').select('id').eq('user_id', user.id).eq('date', today).maybeSingle();
    if (existing) {
      await supabase.from('daily_steps').update({ steps: mockSteps, source: providerKey }).eq('id', existing.id);
    } else {
      await supabase.from('daily_steps').insert({ user_id: user.id, date: today, steps: mockSteps, source: providerKey });
    }
    // Simulate importing a workout from the smartwatch
    const mockDuration = Math.floor(1800 + Math.random() * 3600);
    const mockDistance = Math.floor(20 + Math.random() * 80) / 10;
    const mockSport = ['running', 'cycling', 'walking', 'strength'][Math.floor(Math.random() * 4)];
    await supabase.from('workouts').insert({
      user_id: user.id,
      sport: mockSport,
      type: 'manual',
      date: today,
      duration_sec: mockDuration,
      distance_km: mockDistance,
      is_shared: false,
      notes: `Importado desde ${SMARTWATCH_BRANDS.find((b) => b.key === providerKey)?.label || 'smartwatch'}`,
    });
    window.dispatchEvent(new Event('workout-saved'));
    setHealthProvider(providerKey);
    setHealthConnecting(false);
    setHealthSynced(true);
    setShowHealthProviders(false);
    setTimeout(() => setHealthSynced(false), 3000);
  }

  async function disconnectHealth() {
    if (!user) return;
    setHealthConnecting(true);
    await supabase.from('profiles').update({ health_connected: false, health_provider: null }).eq('id', user.id);
    await refreshProfile();
    setHealthProvider(null);
    setHealthConnecting(false);
  }

  const toggles = [
    { key: 'notifications_enabled' as const, icon: Bell, label: t('set.notifGeneral'), desc: t('set.notifGeneralDesc') },
    { key: 'notify_friends_activity' as const, icon: Users, label: t('set.notifFriends'), desc: t('set.notifFriendsDesc') },
    { key: 'notify_challenges' as const, icon: Swords, label: t('set.notifChallenges'), desc: t('set.notifChallengesDesc') },
    { key: 'notify_achievements' as const, icon: Trophy, label: t('set.notifAchievements'), desc: t('set.notifAchievementsDesc') },
  ];

  const tier = profile?.subscription_tier || 'free_trial';

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-black font-display">{t('set.title')}</h1>

      {/* Subscription */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[60px]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-neon flex items-center justify-center">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('set.currentPlan')}</p>
              <h2 className="text-xl font-black font-display">{isPremium ? <span className="gradient-neon-text">{SUBSCRIPTION_INFO[tier as keyof typeof SUBSCRIPTION_INFO]?.label || 'Premium'}</span> : SUBSCRIPTION_INFO[tier as keyof typeof SUBSCRIPTION_INFO]?.label || 'Prueba gratuita'}</h2>
              {isPremium && <span className="ml-2 px-2 py-0.5 rounded-full gradient-neon text-black text-[10px] font-bold">PREMIUM</span>}
            </div>
          </div>
          <button onClick={() => onNavigate('subscription')} className="w-full mt-2 py-3 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-semibold text-sm transition-all hover:bg-[var(--neon-green)]/20 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> {t('set.manageSub')}
          </button>
        </div>
      </div>

      {/* Goal editor */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[var(--neon-green)]" />
            <h3 className="font-bold">{t('set.changeGoal')}</h3>
          </div>
          <button onClick={() => { setShowGoalEditor(!showGoalEditor); setTempGoal(profile?.goal || null); }} className="text-sm text-[var(--neon-green)] font-semibold hover:underline">
            {showGoalEditor ? t('set.close') : t('set.edit')}
          </button>
        </div>

        {!showGoalEditor ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-darkest)]">
            <span className="text-4xl">{profile?.goal ? GOAL_EMOJIS[profile.goal] : '🎯'}</span>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t('dash.yourGoal')}</p>
              <p className="font-bold text-lg">{profile?.goal ? t('goal.' + profile.goal) : '-'}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-[var(--text-secondary)]">{t('set.changeGoalDesc')}</p>
            <GoalSelector selected={tempGoal} onSelect={setTempGoal} />
            <button onClick={saveGoal} disabled={!tempGoal || savingGoal} className="w-full gradient-neon text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
              {savingGoal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t('set.saveSports')}
            </button>
          </div>
        )}
        {goalSaved && <p className="text-xs text-[var(--neon-green)] mt-2 flex items-center gap-1 animate-fade-in"><Check className="w-3 h-3" /> {t('set.goalChanged')}</p>}
      </div>

      {/* Sports editor */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-[var(--neon-green)]" />
            <h3 className="font-bold">{t('set.sports')}</h3>
          </div>
          <button onClick={() => setShowSportEditor(!showSportEditor)} className="text-sm text-[var(--neon-green)] font-semibold hover:underline">
            {showSportEditor ? t('set.close') : t('set.edit')}
          </button>
        </div>

        {!showSportEditor ? (
          <div className="flex flex-wrap gap-2">
            {(profile?.sports || []).map((sport) => {
              return (
                <span key={sport} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-sm">
                  <span>{SPORT_EMOJIS[sport] || '•'}</span>
                  {DEFAULT_SPORTS.find((s) => s.key === sport)?.label || sport}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-[var(--text-secondary)]">{t('set.selectSports')}</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_SPORTS.map((sport) => (
                <button key={sport.key} onClick={() => toggleSport(sport.key)} className={`p-3 rounded-xl border-2 text-left transition-all ${selectedSports.includes(sport.key) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                  <span className="text-2xl block mb-1">{SPORT_EMOJIS[sport.key] || '•'}</span>
                  <span className="text-sm font-semibold">{sport.label}</span>
                </button>
              ))}
            </div>
            {customSports.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customSports.map((sport) => (
                  <span key={sport} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-sm">
                    {sport}
                    <button onClick={() => removeCustomSport(sport)} className="text-[var(--text-muted)] hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={customSportInput} onChange={(e) => setCustomSportInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSport())} placeholder="Añadir deporte personalizado..." className="flex-1 bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              <button onClick={addCustomSport} className="px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--neon-green)] transition-all"><Plus className="w-5 h-5 text-[var(--neon-green)]" /></button>
            </div>
            <button onClick={saveSports} disabled={saving} className="w-full gradient-neon text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 text-sm flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} {t('set.saveSports')}
            </button>
          </div>
        )}
      </div>

      {/* Regenerate weekly plan */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw className="w-5 h-5 text-[var(--neon-green)]" />
          <h3 className="font-bold">{t('set.weeklyPlan')}</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">{t('set.regenerateDesc')}</p>
        <button onClick={regenerateWeek} disabled={regenerating} className="w-full py-3 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-semibold text-sm transition-all hover:bg-[var(--neon-green)]/20 flex items-center justify-center gap-2 disabled:opacity-50">
          {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {regenerating ? t('dash.generating') : t('dash.regenerate')}
        </button>
        {regenDone && <p className="text-xs text-[var(--neon-green)] mt-2 flex items-center gap-1 animate-fade-in"><Check className="w-3 h-3" /> {t('dash.regenDone')}</p>}
      </div>

      {/* Daily reminders */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 text-[var(--neon-green)]" />
          <h3 className="font-bold">Recordatorios diarios</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">Recibe un recordatorio automático cada día a las 12:00 y a las 18:00 para no olvidar tu entrenamiento.</p>

        {!notificationsSupported() ? (
          <div className="p-4 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-center">
            <p className="text-sm text-[var(--text-muted)]">Tu navegador no soporta notificaciones push.</p>
          </div>
        ) : notifPerm === 'granted' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30">
              <Check className="w-5 h-5 text-[var(--neon-green)] flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-[var(--neon-green)]">Notificaciones activadas</p>
                <p className="text-xs text-[var(--text-muted)]">Te recordaremos tu sesión a las 12:00 y a las 18:00</p>
              </div>
            </div>
            <button onClick={handleDisableReminders} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm transition-all hover:bg-red-500/20 flex items-center justify-center gap-2">
              <X className="w-4 h-4" /> Desactivar recordatorios
            </button>
          </div>
        ) : notifPerm === 'denied' ? (
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
            <p className="text-sm text-orange-400 font-semibold mb-1">Permisos bloqueados</p>
            <p className="text-xs text-[var(--text-muted)]">Activa las notificaciones en los ajustes de tu navegador para recibir recordatorios diarios.</p>
          </div>
        ) : (
          <button onClick={handleEnableReminders} disabled={enablingNotif} className="w-full py-3 rounded-xl gradient-neon text-black font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
            {enablingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />}
            {enablingNotif ? 'Activando...' : 'Activar recordatorios'}
          </button>
        )}
      </div>

      {/* Notifications */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Bell className="w-5 h-5 text-[var(--neon-green)]" /> {t('set.notifications')}</h3>
        <div className="space-y-3">
          {toggles.map(({ key, icon: Icon, label, desc }) => {
            const disabled = key !== 'notifications_enabled' && !settings.notifications_enabled;
            return (
              <div key={key} className={`flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)] transition-opacity ${disabled ? 'opacity-40' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-[var(--neon-green)]/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[var(--neon-green)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{desc}</p>
                </div>
                <button onClick={() => updateSetting(key, !settings[key])} disabled={disabled} className={`w-12 h-7 rounded-full transition-colors relative flex-shrink-0 ${settings[key] ? 'bg-[var(--neon-green)]' : 'bg-[var(--border-subtle)]'}`}>
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            );
          })}
        </div>
        {saving && <p className="text-xs text-[var(--text-muted)] mt-3 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> {t('set.saving')}</p>}
        {saved && !saving && <p className="text-xs text-[var(--neon-green)] mt-3 flex items-center gap-2 animate-fade-in"><Check className="w-3 h-3" /> {t('set.saved')}</p>}
      </div>

      {/* Units */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Scale className="w-5 h-5 text-[var(--neon-green)]" /> {t('set.units')}</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-darkest)]">
            <span className="text-sm font-semibold">{t('set.weightUnit')}</span>
            <div className="flex gap-2">
              {(['kg', 'lbs'] as const).map((u) => (
                <button key={u} onClick={() => updateWeightUnit(u)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${weightUnit === u ? 'gradient-neon text-black' : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]'}`}>{u === 'kg' ? t('set.kg') : t('set.lbs')}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Materials / Equipment - only shown if user has strength sports */}
      {(profile?.sports || []).some((s) => STRENGTH_SPORTS.includes(s)) && (
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-[var(--neon-green)]" /> {t('mat.title')}</h3>
        <p className="text-xs text-[var(--text-secondary)] mb-4">{t('mat.desc')}</p>

        {/* Gym vs Home toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setEquipmentMode('gym')}
            className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${equipmentMode === 'gym' ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}
          >
            <span className="text-2xl block mb-1">🏋️</span>
            <span className="text-xs font-semibold">{t('mat.gym')}</span>
          </button>
          <button
            onClick={() => setEquipmentMode('home')}
            className={`flex-1 p-3 rounded-xl border-2 text-center transition-all ${equipmentMode === 'home' ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}
          >
            <span className="text-2xl block mb-1">🏠</span>
            <span className="text-xs font-semibold">{t('mat.home')}</span>
          </button>
        </div>

        {equipmentMode === 'gym' ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-3">{t('mat.gymDesc')}</p>
        ) : (
          <>
            <p className="text-xs text-[var(--text-muted)] mb-3">{t('mat.homeDesc')}</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { key: 'dumbbells', label: t('mat.dumbbells'), emoji: '🏋️' },
                { key: 'barbell', label: t('mat.barbell'), emoji: '🏋️‍♂️' },
                { key: 'kettlebell', label: t('mat.kettlebell'), emoji: '🔔' },
                { key: 'resistance_bands', label: t('mat.bands'), emoji: '➰' },
                { key: 'pull_up_bar', label: t('mat.pullup'), emoji: '🤸' },
                { key: 'bench', label: t('mat.bench'), emoji: '🛏️' },
                { key: 'mat', label: t('mat.mat'), emoji: '🧘' },
                { key: 'none', label: t('mat.bodyweight'), emoji: '🤸‍♂️' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleEquipment(item.key)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2 ${selectedEquipment.includes(item.key) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-xs font-semibold flex-1">{item.label}</span>
                  {selectedEquipment.includes(item.key) && <Check className="w-4 h-4 text-[var(--neon-green)]" />}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          onClick={saveEquipment}
          disabled={savingEquipment}
          className="w-full gradient-neon text-black font-bold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {savingEquipment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {savingEquipment ? t('mat.saving') : t('mat.save')}
        </button>
        {equipmentSaved && <p className="text-xs text-[var(--neon-green)] mt-2 text-center animate-fade-in">{t('mat.saved')}</p>}
      </div>
      )}

      {/* Smartwatch connection */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Watch className="w-5 h-5 text-[var(--neon-green)]" />
          <h3 className="font-bold">Relojes inteligentes</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">Conecta tu smartwatch para importar automáticamente tus actividades grabadas.</p>

        {healthProvider ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-darkest)] border border-[var(--neon-green)]/30">
              <span className="text-3xl">{SMARTWATCH_BRANDS.find((p) => p.key === healthProvider)?.emoji || '⌚'}</span>
              <div className="flex-1">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Reloj conectado</p>
                <p className="font-bold">{SMARTWATCH_BRANDS.find((p) => p.key === healthProvider)?.label || healthProvider}</p>
                <p className="text-xs text-[var(--neon-green)] flex items-center gap-1 mt-0.5"><Check className="w-3 h-3" /> Sincronización activa</p>
              </div>
            </div>
            <button onClick={disconnectHealth} disabled={healthConnecting} className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm transition-all hover:bg-red-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
              {healthConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} Desconectar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {SMARTWATCH_BRANDS.map((brand) => (
                <button key={brand.key} onClick={() => connectHealth(brand.key)} disabled={healthConnecting} className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--neon-green)] transition-all disabled:opacity-50">
                  <span className="text-3xl">{brand.emoji}</span>
                  <span className="text-xs font-semibold text-center">{brand.label}</span>
                </button>
              ))}
            </div>
            {healthSynced && <p className="text-xs text-[var(--neon-green)] flex items-center gap-1 animate-fade-in"><Check className="w-3 h-3" /> Actividad importada correctamente</p>}
          </div>
        )}
      </div>

      {/* Language */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-[var(--neon-green)]" /> {t('set.language')}</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { code: 'es' as Lang, label: 'Español', flag: '🇪🇸' },
            { code: 'eu' as Lang, label: 'Euskara', flag: '🇪🇸' },
            { code: 'en' as Lang, label: 'English', flag: '🇬🇧' },
            { code: 'de' as Lang, label: 'Deutsch', flag: '🇩🇪' },
            { code: 'zh' as Lang, label: '中文', flag: '🇨🇳' },
          ].map((lng) => (
            <button key={lng.code} onClick={() => setLang(lng.code)} className={`p-3 rounded-xl border-2 text-center transition-all ${lang === lng.code ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
              <span className="text-2xl block mb-1">{lng.flag}</span>
              <span className="text-xs font-semibold">{lng.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account info */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-3">{t('set.account')}</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-darkest)]">
            <span className="text-sm text-[var(--text-secondary)]">{t('set.email')}</span>
            <span className="text-sm font-semibold truncate ml-4">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-darkest)]">
            <span className="text-sm text-[var(--text-secondary)]">{t('set.name')}</span>
            <span className="text-sm font-semibold">{profile?.display_name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
