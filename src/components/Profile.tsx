import { useState, useRef, useCallback } from 'react';
import { Camera, Check, Loader2, User, Mail, Target, Calendar, Edit3, X, Save, Cake, LogOut, Scale, Footprints, Dumbbell, Home, Building2, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { GOAL_EMOJIS, DEFAULT_SPORTS, RACE_GOALS, STRENGTH_EQUIPMENT, type Sport, type Goal } from '@/lib/types';
import GoalSelector from '@/components/GoalSelector';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg'];

type EditField = 'height' | 'weight' | 'targetWeight' | 'birthDate' | 'sex' | 'runningLevel' | 'runningWeeklyKm' | 'raceGoal' | 'strengthLocation' | 'strengthEquipment' | 'goal' | null;

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { t } = useI18n();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingField, setEditingField] = useState<EditField>(null);
  const [fieldSaving, setFieldSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [fieldSaved, setFieldSaved] = useState(false);

  // Editable values
  const [heightInput, setHeightInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [targetWeightInput, setTargetWeightInput] = useState('');
  const [birthDateInput, setBirthDateInput] = useState('');
  const [sexInput, setSexInput] = useState<'male' | 'female' | ''>('');
  const [runningLevelInput, setRunningLevelInput] = useState<'beginner' | 'intermediate' | 'advanced' | ''>('');
  const [runningWeeklyKmInput, setRunningWeeklyKmInput] = useState('');
  const [raceGoalInput, setRaceGoalInput] = useState<string | null>(null);
  const [strengthLocationInput, setStrengthLocationInput] = useState<'gym' | 'home' | ''>('');
  const [strengthEquipmentInput, setStrengthEquipmentInput] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState<Goal | null>(null);

  const startEditName = useCallback(() => {
    setNameInput(profile?.display_name || '');
    setEditingName(true);
  }, [profile]);

  async function saveName() {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ display_name: nameInput.trim() }).eq('id', user.id);
    setSavingName(false);
    if (error) { setFieldError(error.message); return; }
    await refreshProfile();
    setEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setPhotoError(null);

    if (!ALLOWED_MIME.includes(file.type)) {
      setPhotoError('Solo se permiten archivos JPG o PNG.');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setPhotoError('El archivo supera el límite de 2 MB.');
      return;
    }

    uploadAvatar(file);
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${user.id}/avatar.${ext}`;

      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      const { error: profErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (profErr) throw profErr;
      await refreshProfile();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  }

  function startEditField(field: EditField) {
    if (!profile) return;
    setEditingField(field);
    setFieldError(null);
    setFieldSaved(false);
    if (field === 'height') setHeightInput(profile.height_cm ? String(profile.height_cm) : '');
    if (field === 'weight') setWeightInput(profile.current_weight_kg ? String(profile.current_weight_kg) : '');
    if (field === 'targetWeight') setTargetWeightInput(profile.target_weight_kg ? String(profile.target_weight_kg) : '');
    if (field === 'birthDate') setBirthDateInput(profile.birth_date || '');
    if (field === 'sex') setSexInput(profile.sex || '');
    if (field === 'runningLevel') setRunningLevelInput(profile.running_level || '');
    if (field === 'runningWeeklyKm') setRunningWeeklyKmInput(profile.running_weekly_km ? String(profile.running_weekly_km) : '');
    if (field === 'raceGoal') setRaceGoalInput(profile.race_goal || null);
    if (field === 'strengthLocation') setStrengthLocationInput(profile.strength_location || '');
    if (field === 'strengthEquipment') setStrengthEquipmentInput(profile.strength_equipment || []);
    if (field === 'goal') setGoalInput(profile.goal || null);
  }

  function toggleEquipment(key: string) {
    setStrengthEquipmentInput((prev) => prev.includes(key) ? prev.filter((e) => e !== key) : [...prev, key]);
  }

  async function saveField() {
    if (!user || !editingField) return;
    setFieldSaving(true);
    setFieldError(null);

    const updates: Record<string, unknown> = {};
    let valid = true;
    let errorMsg: string | null = null;

    switch (editingField) {
      case 'height': {
        const h = parseFloat(heightInput);
        if (isNaN(h) || h < 50 || h > 250) { valid = false; errorMsg = t('prof.invalidHeight'); break; }
        updates.height_cm = Math.round(h);
        break;
      }
      case 'weight': {
        const w = parseFloat(weightInput);
        if (isNaN(w) || w < 20 || w > 300) { valid = false; errorMsg = t('prof.invalidWeight'); break; }
        updates.current_weight_kg = w;
        break;
      }
      case 'targetWeight': {
        const w = parseFloat(targetWeightInput);
        if (isNaN(w) || w < 20 || w > 300) { valid = false; errorMsg = t('prof.invalidWeight'); break; }
        updates.target_weight_kg = w;
        break;
      }
      case 'birthDate': {
        if (!birthDateInput) { valid = false; errorMsg = t('prof.invalidDate'); break; }
        const birth = new Date(birthDateInput);
        const now = new Date();
        if (birth > now || birth.getFullYear() < 1900) { valid = false; errorMsg = t('prof.invalidDate'); break; }
        updates.birth_date = birthDateInput;
        let calculatedAge = now.getFullYear() - birth.getFullYear();
        const m = now.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) calculatedAge--;
        updates.age = calculatedAge;
        break;
      }
      case 'sex': {
        if (!sexInput) { valid = false; errorMsg = t('prof.invalidSex'); break; }
        updates.sex = sexInput;
        break;
      }
      case 'runningLevel': {
        if (!runningLevelInput) { valid = false; break; }
        updates.running_level = runningLevelInput;
        break;
      }
      case 'runningWeeklyKm': {
        const km = parseFloat(runningWeeklyKmInput);
        if (isNaN(km) || km < 0 || km > 500) { valid = false; errorMsg = t('prof.invalidKm'); break; }
        updates.running_weekly_km = km;
        break;
      }
      case 'raceGoal': {
        updates.race_goal = raceGoalInput;
        break;
      }
      case 'strengthLocation': {
        if (!strengthLocationInput) { valid = false; break; }
        updates.strength_location = strengthLocationInput;
        if (strengthLocationInput === 'gym') {
          updates.strength_equipment = [];
        } else {
          updates.strength_equipment = strengthEquipmentInput;
        }
        break;
      }
      case 'strengthEquipment': {
        updates.strength_equipment = strengthEquipmentInput;
        break;
      }
      case 'goal': {
        if (!goalInput) { valid = false; break; }
        updates.goal = goalInput;
        break;
      }
    }

    if (!valid) {
      setFieldSaving(false);
      setFieldError(errorMsg || t('prof.invalidValue'));
      return;
    }

    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    setFieldSaving(false);

    if (error) {
      setFieldError(error.message);
      return;
    }

    await refreshProfile();
    setFieldSaved(true);
    setEditingField(null);
    setTimeout(() => setFieldSaved(false), 2000);
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const computedAge = (() => {
    if (profile.birth_date) {
      const birth = new Date(profile.birth_date);
      const today = new Date();
      let a = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
      return a;
    }
    return profile.age;
  })();

  const isBirthday = (() => {
    if (!profile.birth_date) return false;
    const birth = new Date(profile.birth_date);
    const today = new Date();
    return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
  })();

  const birthDateFormatted = profile.birth_date
    ? new Date(profile.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    : null;

  const hasRunning = (profile.sports || []).includes('running') || (profile.sports || []).includes('walking') || (profile.sports || []).includes('trail_running');
  const hasStrength = (profile.sports || []).some((s) => ['strength', 'crossfit', 'hyrox'].includes(s));

  function EditButton({ field }: { field: EditField }) {
    return (
      <button
        onClick={() => editingField === field ? setEditingField(null) : startEditField(field)}
        className="text-[var(--text-muted)] hover:text-[var(--neon-green)] transition-colors flex-shrink-0"
      >
        {editingField === field ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-black font-display">{t('prof.title')}</h1>

      {/* Birthday greeting */}
      {isBirthday && (
        <div className="glass-card rounded-3xl p-6 bg-gradient-to-r from-[var(--neon-green)]/10 to-[var(--neon-cyan)]/10 border border-[var(--neon-green)]/30 animate-scale-in">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--neon-green)]/15 flex items-center justify-center">
              <Cake className="w-7 h-7 text-[var(--neon-green)]" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display gradient-neon-text">{t('prof.happyBirthday')}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{t('prof.birthdayMsg')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Avatar + name card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[60px]" />
        <div className="relative flex flex-col items-center text-center">
          <div className="relative mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-28 h-28 rounded-full object-cover border-4 border-[var(--neon-green)]/30 neon-glow" />
            ) : (
              <div className="w-28 h-28 rounded-full flex items-center justify-center border-4 border-[var(--neon-green)]/30" style={{ backgroundColor: profile.avatar_color || '#00ff88' }}>
                <span className="text-4xl font-black text-black">{profile.display_name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 w-9 h-9 rounded-full gradient-neon flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
            >
              {uploadingPhoto ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Camera className="w-4 h-4 text-black" />}
            </button>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handlePhotoSelect} className="sr-only" />
          </div>

          {editingName ? (
            <div className="w-full max-w-xs space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  autoFocus
                  maxLength={30}
                  className="flex-1 bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-center font-bold focus:outline-none focus:border-[var(--neon-green)] transition-all"
                />
                <button onClick={saveName} disabled={savingName || !nameInput.trim()} className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center disabled:opacity-50">
                  {savingName ? <Loader2 className="w-4 h-4 text-black animate-spin" /> : <Save className="w-4 h-4 text-black" />}
                </button>
                <button onClick={() => setEditingName(false)} className="w-10 h-10 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] flex items-center justify-center">
                  <X className="w-4 h-4 text-[var(--text-muted)]" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black font-display">{profile.display_name}</h2>
              <button onClick={startEditName} className="text-[var(--text-muted)] hover:text-[var(--neon-green)] transition-colors">
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          )}
          {nameSaved && <p className="text-xs text-[var(--neon-green)] mt-1 flex items-center gap-1 animate-fade-in"><Check className="w-3 h-3" /> {t('prof.nameUpdated')}</p>}
          {photoError && <p className="text-xs text-red-400 mt-2">{photoError}</p>}
          <p className="text-sm text-[var(--text-muted)] mt-1">{user?.email}</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-[var(--neon-green)]" /> {t('prof.personalInfo')}</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)]">
            <Mail className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)]">{t('set.email')}</p>
              <p className="text-sm font-semibold truncate">{user?.email}</p>
            </div>
          </div>

          {/* Goal - editable */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)]">
            <Target className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)]">{t('prof.goal')}</p>
              {editingField === 'goal' ? (
                <div className="mt-2 space-y-3">
                  <GoalSelector selected={goalInput} onSelect={setGoalInput} />
                  <div className="flex gap-2">
                    <button onClick={saveField} disabled={fieldSaving || !goalInput} className="flex-1 py-2.5 rounded-xl gradient-neon text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                      {fieldSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('common.save')}
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-4 py-2.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-sm">
                      {t('common.cancel')}
                    </button>
                  </div>
                  {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{GOAL_EMOJIS[profile.goal]} {t('goal.' + profile.goal)}</p>
                  <EditButton field="goal" />
                </div>
              )}
            </div>
          </div>

          {/* Birth date - editable */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)]">
            <Calendar className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)]">{t('prof.birthDate')}</p>
              {editingField === 'birthDate' ? (
                <div className="mt-2 space-y-3">
                  <input type="date" value={birthDateInput} onChange={(e) => setBirthDateInput(e.target.value)} max={new Date().toISOString().split('T')[0]} min="1900-01-01" autoFocus className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                  <div className="flex gap-2">
                    <button onClick={saveField} disabled={fieldSaving || !birthDateInput} className="flex-1 py-2.5 rounded-xl gradient-neon text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                      {fieldSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('common.save')}
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-4 py-2.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-sm">
                      {t('common.cancel')}
                    </button>
                  </div>
                  {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold capitalize">{birthDateFormatted || '—'}</p>
                  <EditButton field="birthDate" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)]">
            <Calendar className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)]">{t('prof.memberSince')}</p>
              <p className="text-sm font-semibold capitalize">{memberSince}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body stats */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4">{t('prof.bodyStats')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Weight */}
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            {editingField === 'weight' ? (
              <div className="space-y-2">
                <input type="number" step="0.1" value={weightInput} onChange={(e) => setWeightInput(e.target.value)} autoFocus placeholder="kg" className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-lg font-bold text-center focus:outline-none focus:border-[var(--neon-green)]" />
                <div className="flex gap-1">
                  <button onClick={saveField} disabled={fieldSaving} className="flex-1 py-1.5 rounded-lg gradient-neon text-black text-xs font-bold disabled:opacity-50"><Save className="w-3 h-3 mx-auto" /></button>
                  <button onClick={() => setEditingField(null)} className="px-2 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"><X className="w-3 h-3 mx-auto" /></button>
                </div>
                {fieldError && <p className="text-[10px] text-red-400">{fieldError}</p>}
              </div>
            ) : (
              <div className="relative">
                <p className="text-2xl font-black font-display">{profile.current_weight_kg ? `${profile.current_weight_kg}` : '—'}</p>
                <p className="text-xs text-[var(--text-muted)]">{t('prof.weight')}</p>
                <button onClick={() => startEditField('weight')} className="absolute top-0 right-0 text-[var(--text-muted)] hover:text-[var(--neon-green)] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Target weight */}
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            {editingField === 'targetWeight' ? (
              <div className="space-y-2">
                <input type="number" step="0.1" value={targetWeightInput} onChange={(e) => setTargetWeightInput(e.target.value)} autoFocus placeholder="kg" className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-lg font-bold text-center focus:outline-none focus:border-[var(--neon-green)]" />
                <div className="flex gap-1">
                  <button onClick={saveField} disabled={fieldSaving} className="flex-1 py-1.5 rounded-lg gradient-neon text-black text-xs font-bold disabled:opacity-50"><Save className="w-3 h-3 mx-auto" /></button>
                  <button onClick={() => setEditingField(null)} className="px-2 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"><X className="w-3 h-3 mx-auto" /></button>
                </div>
                {fieldError && <p className="text-[10px] text-red-400">{fieldError}</p>}
              </div>
            ) : (
              <div className="relative">
                <p className="text-2xl font-black font-display">{profile.target_weight_kg ? `${profile.target_weight_kg}` : '—'}</p>
                <p className="text-xs text-[var(--text-muted)]">{t('prof.targetWeight')}</p>
                <button onClick={() => startEditField('targetWeight')} className="absolute top-0 right-0 text-[var(--text-muted)] hover:text-[var(--neon-green)] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Height */}
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            {editingField === 'height' ? (
              <div className="space-y-2">
                <input type="number" value={heightInput} onChange={(e) => setHeightInput(e.target.value)} autoFocus placeholder="cm" className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-2 py-1.5 text-lg font-bold text-center focus:outline-none focus:border-[var(--neon-green)]" />
                <div className="flex gap-1">
                  <button onClick={saveField} disabled={fieldSaving} className="flex-1 py-1.5 rounded-lg gradient-neon text-black text-xs font-bold disabled:opacity-50"><Save className="w-3 h-3 mx-auto" /></button>
                  <button onClick={() => setEditingField(null)} className="px-2 py-1.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs"><X className="w-3 h-3 mx-auto" /></button>
                </div>
                {fieldError && <p className="text-[10px] text-red-400">{fieldError}</p>}
              </div>
            ) : (
              <div className="relative">
                <p className="text-2xl font-black font-display">{profile.height_cm ? `${profile.height_cm}` : '—'}</p>
                <p className="text-xs text-[var(--text-muted)]">{t('prof.height')}</p>
                <button onClick={() => startEditField('height')} className="absolute top-0 right-0 text-[var(--text-muted)] hover:text-[var(--neon-green)] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </div>

          {/* Age */}
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            <p className="text-2xl font-black font-display">{computedAge != null ? `${computedAge}` : '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('prof.age')}</p>
          </div>
        </div>

        {/* Sex - editable */}
        <div className="mt-3">
          {editingField === 'sex' ? (
            <div className="p-3 rounded-xl bg-[var(--bg-darkest)] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {(['male', 'female'] as const).map((s) => (
                  <button key={s} onClick={() => setSexInput(s)} className={`py-3 rounded-xl border-2 transition-all font-semibold ${sexInput === s ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] text-[var(--text-secondary)]'}`}>{s === 'male' ? t('prof.male') : t('prof.female')}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={saveField} disabled={fieldSaving || !sexInput} className="flex-1 py-2.5 rounded-xl gradient-neon text-black font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {fieldSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('common.save')}
                </button>
                <button onClick={() => setEditingField(null)} className="px-4 py-2.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-sm">{t('common.cancel')}</button>
              </div>
              {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-darkest)]">
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('prof.sex')}</p>
                <p className="text-sm font-semibold capitalize">{profile.sex === 'male' ? t('prof.male') : profile.sex === 'female' ? t('prof.female') : '—'}</p>
              </div>
              <EditButton field="sex" />
            </div>
          )}
        </div>

        {/* Weight edit note */}
        <p className="text-xs text-[var(--text-muted)] mt-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          {t('prof.weightEditNote')}
        </p>
      </div>

      {/* Sports */}
      <div className="glass-card rounded-3xl p-6">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-[var(--neon-green)]" /> {t('prof.sports')}</h3>
        <div className="flex flex-wrap gap-2">
          {(profile.sports || []).map((sport) => {
            const ds = DEFAULT_SPORTS.find((s: Sport) => s.key === sport);
            return (
              <span key={sport} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-sm">
                <span>{ds?.emoji || '🏅'}</span>
                {ds?.label || sport}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">{t('prof.editSportsInSettings')}</p>
      </div>

      {/* Running data */}
      {hasRunning && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Footprints className="w-5 h-5 text-[var(--neon-green)]" /> {t('prof.runningData')}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-darkest)]">
              <div>
                <p className="text-xs text-[var(--text-muted)]">{t('prof.runningLevel')}</p>
                {editingField === 'runningLevel' ? (
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {([['beginner', t('prof.levelBeginner')], ['intermediate', t('prof.levelIntermediate')], ['advanced', t('prof.levelAdvanced')]] as const).map(([key, label]) => (
                        <button key={key} onClick={() => setRunningLevelInput(key)} className={`py-2 rounded-lg border-2 text-xs font-semibold transition-all ${runningLevelInput === key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>{label}</button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveField} disabled={fieldSaving || !runningLevelInput} className="flex-1 py-2 rounded-lg gradient-neon text-black font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1">
                        {fieldSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {t('common.save')}
                      </button>
                      <button onClick={() => setEditingField(null)} className="px-3 py-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-xs">{t('common.cancel')}</button>
                    </div>
                    {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{profile.running_level ? (profile.running_level === 'beginner' ? t('prof.levelBeginner') : profile.running_level === 'intermediate' ? t('prof.levelIntermediate') : t('prof.levelAdvanced')) : '—'}</p>
                    <EditButton field="runningLevel" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-darkest)]">
              <div className="flex-1">
                <p className="text-xs text-[var(--text-muted)]">{t('prof.weeklyKm')}</p>
                {editingField === 'runningWeeklyKm' ? (
                  <div className="mt-2 space-y-2">
                    <input type="number" step="0.5" value={runningWeeklyKmInput} onChange={(e) => setRunningWeeklyKmInput(e.target.value)} autoFocus placeholder="km" className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[var(--neon-green)]" />
                    <div className="flex gap-2">
                      <button onClick={saveField} disabled={fieldSaving} className="flex-1 py-2 rounded-lg gradient-neon text-black font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1">
                        {fieldSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {t('common.save')}
                      </button>
                      <button onClick={() => setEditingField(null)} className="px-3 py-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-xs">{t('common.cancel')}</button>
                    </div>
                    {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{profile.running_weekly_km ? `${profile.running_weekly_km} km` : '—'}</p>
                    <EditButton field="runningWeeklyKm" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-darkest)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('prof.raceGoal')}</p>
              {editingField === 'raceGoal' ? (
                <div className="mt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {RACE_GOALS.map((rg) => (
                      <button key={rg.key} onClick={() => setRaceGoalInput(rg.key)} className={`p-2 rounded-lg border-2 text-center transition-all ${raceGoalInput === rg.key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                        <p className="text-sm font-bold">{rg.label}</p>
                      </button>
                    ))}
                    <button onClick={() => setRaceGoalInput(null)} className={`p-2 rounded-lg border-2 text-center transition-all ${raceGoalInput === null ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                      <p className="text-sm font-bold">{t('prof.noRace')}</p>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveField} disabled={fieldSaving} className="flex-1 py-2 rounded-lg gradient-neon text-black font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1">
                      {fieldSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {t('common.save')}
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3 py-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-xs">{t('common.cancel')}</button>
                  </div>
                  {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{profile.race_goal ? RACE_GOALS.find((r) => r.key === profile.race_goal)?.label || profile.race_goal : t('prof.noRace')}</p>
                  <EditButton field="raceGoal" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strength data */}
      {hasStrength && (
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Dumbbell className="w-5 h-5 text-[var(--neon-green)]" /> {t('prof.strengthData')}</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[var(--bg-darkest)]">
              <p className="text-xs text-[var(--text-muted)] mb-1">{t('prof.trainingLocation')}</p>
              {editingField === 'strengthLocation' ? (
                <div className="mt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setStrengthLocationInput('gym')} className={`p-3 rounded-xl border-2 text-center transition-all ${strengthLocationInput === 'gym' ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                      <Building2 className="w-6 h-6 mx-auto mb-1 text-[var(--neon-green)]" />
                      <span className="text-xs font-semibold">{t('mat.gym')}</span>
                    </button>
                    <button onClick={() => setStrengthLocationInput('home')} className={`p-3 rounded-xl border-2 text-center transition-all ${strengthLocationInput === 'home' ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                      <Home className="w-6 h-6 mx-auto mb-1 text-[var(--neon-green)]" />
                      <span className="text-xs font-semibold">{t('mat.home')}</span>
                    </button>
                  </div>
                  {strengthLocationInput === 'home' && (
                    <div className="grid grid-cols-2 gap-2">
                      {STRENGTH_EQUIPMENT.map((eq) => (
                        <button key={eq.key} onClick={() => toggleEquipment(eq.key)} className={`p-2 rounded-lg border-2 text-left text-xs transition-all flex items-center gap-1 ${strengthEquipmentInput.includes(eq.key) ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                          {strengthEquipmentInput.includes(eq.key) && <Check className="w-3 h-3" />}
                          {eq.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={saveField} disabled={fieldSaving || !strengthLocationInput} className="flex-1 py-2 rounded-lg gradient-neon text-black font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-1">
                      {fieldSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} {t('common.save')}
                    </button>
                    <button onClick={() => setEditingField(null)} className="px-3 py-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-xs">{t('common.cancel')}</button>
                  </div>
                  {fieldError && <p className="text-xs text-red-400">{fieldError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{profile.strength_location === 'gym' ? t('mat.gym') : profile.strength_location === 'home' ? t('mat.home') : '—'}</p>
                  <EditButton field="strengthLocation" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save confirmation */}
      {fieldSaved && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[var(--neon-green)] text-black font-bold text-sm animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4" /> {t('prof.saved')}
        </div>
      )}

      {/* Logout */}
      <button
        onClick={() => signOut()}
        className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-sm transition-all hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center gap-2"
      >
        <LogOut className="w-5 h-5" />
        Cerrar sesión
      </button>
    </div>
  );
}
