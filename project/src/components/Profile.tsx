import { useState, useRef, useCallback } from 'react';
import { Camera, Check, Loader2, User, Mail, Target, Calendar, Edit3, X, Save, Cake } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { GOAL_EMOJIS, type Sport } from '@/lib/types';
import { DEFAULT_SPORTS } from '@/lib/types';

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/jpg'];

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditName = useCallback(() => {
    setNameInput(profile?.display_name || '');
    setEditingName(true);
  }, [profile]);

  async function saveName() {
    if (!user || !nameInput.trim()) return;
    setSavingName(true);
    await supabase.from('profiles').update({ display_name: nameInput.trim() }).eq('id', user.id);
    await refreshProfile();
    setSavingName(false);
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

      // Delete old avatar if exists
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

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      await refreshProfile();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Compute age from birth_date (falls back to stored age if no birth_date)
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

  // Check if today is the user's birthday
  const isBirthday = (() => {
    if (!profile.birth_date) return false;
    const birth = new Date(profile.birth_date);
    const today = new Date();
    return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
  })();

  const birthDateFormatted = profile.birth_date
    ? new Date(profile.birth_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    : null;

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
          {/* Avatar */}
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

          {/* Name */}
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
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)]">
            <Target className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)]">{t('prof.goal')}</p>
              <p className="text-sm font-semibold">{GOAL_EMOJIS[profile.goal]} {t('goal.' + profile.goal)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-darkest)]">
            <Calendar className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-[var(--text-muted)]">{t('prof.birthDate')}</p>
              <p className="text-sm font-semibold capitalize">{birthDateFormatted || '—'}</p>
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
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            <p className="text-2xl font-black font-display">{profile.current_weight_kg ? `${profile.current_weight_kg}` : '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('prof.weight')}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            <p className="text-2xl font-black font-display">{profile.height_cm ? `${profile.height_cm}` : '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('prof.height')}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            <p className="text-2xl font-black font-display">{computedAge != null ? `${computedAge}` : '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('prof.age')}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-[var(--bg-darkest)]">
            <p className="text-2xl font-black font-display capitalize">{profile.sex === 'male' ? t('prof.male') : profile.sex === 'female' ? t('prof.female') : '—'}</p>
            <p className="text-xs text-[var(--text-muted)]">{t('prof.sex')}</p>
          </div>
        </div>
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
      </div>
    </div>
  );
}
