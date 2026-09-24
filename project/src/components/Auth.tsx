import { useState } from 'react';
import { Activity, Eye, EyeOff, Loader2, Shield, Check, X, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

const CONSENT_ITEMS = [
  { key: 'terms', label: 'Términos y Privacidad', desc: 'Acepto los Términos de servicio y la política de privacidad, incluyendo la sincronización de contactos.' },
  { key: 'age', label: 'Mayoría de edad', desc: 'Confirmo que soy mayor de 18 años (o tengo consentimiento de tutor legal).' },
  { key: 'ip', label: 'Propiedad intelectual', desc: 'Entiendo que conservo los derechos de mis contenidos y concedo a PULSE una licencia para mostrarlos dentro de la app.' },
  { key: 'conduct', label: 'Código de conducta', desc: 'Acepto las normas de la comunidad: respeto, sin spam, sin contenido ofensivo.' },
] as const;

export default function Auth() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [consents, setConsents] = useState<Record<string, boolean>>({
    terms: false,
    age: false,
    ip: false,
    conduct: false,
  });

  const allConsentsAccepted = CONSENT_ITEMS.every((item) => consents[item.key]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && !showConsent) {
      setShowConsent(true);
      return;
    }

    if (mode === 'signup' && !allConsentsAccepted) {
      setError('Debes aceptar todos los consentimientos para continuar.');
      return;
    }

    if (mode === 'signup' && !birthDate) {
      setError('Debes introducir tu fecha de nacimiento.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        if (data.user) {
          const colors = ['#00ff88', '#00e5ff', '#ff6b6b', '#ffd93d', '#a78bfa', '#fb923c'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const name = displayName || email.split('@')[0];

          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            display_name: name,
            avatar_color: color,
            legal_accepted: true,
            birth_date: birthDate || null,
          });
          if (profileError && profileError.code !== '23505') throw profileError;

          await supabase.from('legal_consents').insert({
            user_id: data.user.id,
            terms_accepted: consents.terms,
            privacy_accepted: consents.terms,
            age_confirmed: consents.age,
            ip_rights_accepted: consents.ip,
            conduct_accepted: consents.conduct,
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ha ocurrido un error';
      if (msg.includes('Invalid login')) setError('Email o contraseña incorrectos');
      else if (msg.includes('already registered')) setError('Este email ya está registrado. Inicia sesión.');
      else if (msg.includes('Password should be')) setError('La contraseña debe tener al menos 6 caracteres');
      else setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleConsent(key: string) {
    setConsents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00ff88] opacity-[0.07] blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#00e5ff] opacity-[0.05] blur-[100px]" />

      {/* Legal consent modal */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={() => setShowConsent(false)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--neon-green)]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[var(--neon-green)]" />
                </div>
                <h2 className="text-xl font-bold font-display">Consentimientos legales</h2>
              </div>
              <button onClick={() => setShowConsent(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {CONSENT_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleConsent(item.key)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    consents[item.key]
                      ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/5'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${
                      consents[item.key] ? 'gradient-neon' : 'border-2 border-[var(--border-subtle)]'
                    }`}>
                      {consents[item.key] && <Check className="w-4 h-4 text-black" strokeWidth={3} />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{item.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{item.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowConsent(false); handleSubmit(new Event('submit') as unknown as React.FormEvent); }}
              disabled={!allConsentsAccepted || loading}
              className="w-full gradient-neon text-black font-bold py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Aceptar y crear cuenta
            </button>
            {!allConsentsAccepted && (
              <p className="text-center text-xs text-[var(--text-muted)] mt-3">Debes marcar todas las casillas para continuar</p>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 w-full max-w-md animate-slide-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-neon neon-glow mb-4">
            <Activity className="w-10 h-10 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black font-display tracking-tight">
            <span className="gradient-neon-text">PULSE</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">Entrena. Recupera. Conquista.</p>
        </div>

        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          <div className="flex gap-2 mb-6 p-1 bg-[var(--bg-darkest)] rounded-2xl">
            <button onClick={() => setMode('signup')} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${mode === 'signup' ? 'gradient-neon text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Crear cuenta</button>
            <button onClick={() => setMode('signin')} className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${mode === 'signin' ? 'gradient-neon text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>Iniciar sesión</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Nombre de usuario</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="ej. runner_pro" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] focus:ring-1 focus:ring-[var(--neon-green)] transition-all" />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Fecha de nacimiento</label>
                <div className="relative">
                  <Calendar className="w-5 h-5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-[var(--neon-green)] focus:ring-1 focus:ring-[var(--neon-green)] transition-all" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] focus:ring-1 focus:ring-[var(--neon-green)] transition-all" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 pr-12 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] focus:ring-1 focus:ring-[var(--neon-green)] transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400 animate-fade-in">{error}</div>}

            {mode === 'signup' && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Al continuar verás los consentimientos legales obligatorios
              </p>
            )}

            <button type="submit" disabled={loading} className="w-full gradient-neon text-black font-bold py-3.5 rounded-xl transition-all duration-300 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'signup' ? 'Empezar ahora' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-[var(--text-muted)] text-xs mt-6">Al continuar aceptas entrenar duro y divertirte.</p>
      </div>
    </div>
  );
}
