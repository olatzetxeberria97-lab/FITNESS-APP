import { useEffect, useState } from 'react';
import { Crown, Check, Loader2, RotateCcw, Lock, X, CreditCard, Wallet, Landmark, Apple } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { SUBSCRIPTION_INFO, PREMIUM_FEATURES, PREMIUM_PLANS, isPremiumTier, type SubscriptionTier } from '@/lib/types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export default function Subscription() {
  const { user, profile, refreshProfile, isPremium } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>('idle');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const tier = (profile?.subscription_tier || 'free_trial') as SubscriptionTier;
  const trialStart = profile?.trial_started_at ? new Date(profile.trial_started_at) : new Date();
  const trialDays = SUBSCRIPTION_INFO[tier]?.durationDays || 60;
  const daysElapsed = Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(trialDays - daysElapsed, 0);
  const trialExpired = daysLeft <= 0 && tier === 'free_trial';
  const premiumExpires = profile?.premium_expires_at ? new Date(profile.premium_expires_at) : null;
  const daysToExpiry = premiumExpires ? Math.ceil((premiumExpires.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  useEffect(() => {
    if (trialExpired && !isPremium) {
      // Auto-show paywall on trial expiry
    }
  }, [trialExpired, isPremium]);

  async function activatePremium(planId: 'premium_monthly' | 'premium_yearly') {
    if (!user) return;
    setProcessing(planId);
    try {
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(`${EDGE_FUNCTION_URL}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
        },
        body: JSON.stringify({ planId }),
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned', data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  }


  async function cancelPremium() {
    if (!user) return;
    setProcessing('cancel');
    try {
      const { data: session } = await supabase.auth.getSession();
      const resp = await fetch(`${EDGE_FUNCTION_URL}/customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session?.access_token}`,
        },
      });
      const data = await resp.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        await supabase.from('profiles').update({
          subscription_tier: 'free_trial',
          is_premium: false,
          premium_expires_at: null,
          premium_product_id: null,
        }).eq('id', user.id);
        await refreshProfile();
      }
      setShowCancelConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  }

  async function restorePurchases() {
    if (!user) return;
    setRestoreStatus('restoring');
    try {
      const { data } = await supabase
        .from('profiles')
        .select('subscription_tier, premium_expires_at, is_premium')
        .eq('id', user.id)
        .maybeSingle();

      if (data && (data.is_premium || isPremiumTier(data.subscription_tier))) {
        const expires = data.premium_expires_at ? new Date(data.premium_expires_at) : null;
        if (!expires || expires > new Date()) {
          await refreshProfile();
          setRestoreStatus('success');
          setTimeout(() => setRestoreStatus('idle'), 3000);
          return;
        }
      }
      setRestoreStatus('error');
      setTimeout(() => setRestoreStatus('idle'), 3000);
    } catch {
      setRestoreStatus('error');
      setTimeout(() => setRestoreStatus('idle'), 3000);
    }
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-black font-display">Suscripción</h1>

      {/* Current plan card */}
      <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[var(--neon-green)] opacity-[0.05] blur-[80px]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isPremium ? 'gradient-neon neon-glow' : 'bg-[var(--bg-darkest)]'}`}>
              <Crown className={`w-6 h-6 ${isPremium ? 'text-black' : 'text-[var(--text-muted)]'}`} />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Plan actual</p>
              <h2 className="text-2xl font-black font-display">
                {isPremium ? (
                  <span className="gradient-neon-text">{SUBSCRIPTION_INFO[tier]?.label || 'Premium'}</span>
                ) : (
                  SUBSCRIPTION_INFO[tier]?.label || 'Prueba gratuita'
                )}
              </h2>
            </div>
          </div>

          {tier === 'free_trial' && (
            <>
              <div className="w-full h-3 rounded-full bg-[var(--bg-darkest)] overflow-hidden mb-2">
                <div className="h-full gradient-neon rounded-full transition-all duration-700" style={{ width: `${(daysLeft / trialDays) * 100}%` }} />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{daysLeft} días restantes gratis</span>
                <span className="text-[var(--text-muted)]">2 meses de lanzamiento gratis</span>
              </div>
              {trialExpired && (
                <p className="text-sm text-orange-400 font-semibold mt-3">Tu periodo de lanzamiento gratuito ha terminado. Suscríbete por 4,99 €/mes para seguir disfrutando del plan deportivo y alimenticio.</p>
              )}
            </>
          )}

          {isPremium && premiumExpires && (
            <div className="flex items-center gap-2 mt-2">
              <Check className="w-4 h-4 text-[var(--neon-green)]" />
              <p className="text-sm text-[var(--neon-green)] font-semibold">
                Activo hasta el {premiumExpires.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                {daysToExpiry <= 7 && ` (${daysToExpiry} días restantes)`}
              </p>
            </div>
          )}

          {tier === 'beta' && <p className="text-sm text-[var(--neon-green)]">Tarifa reducida permanente de 3,99 €/mes</p>}
          {tier === 'standard' && <p className="text-sm text-[var(--neon-green)]">Suscripción estándar activa · 4,99 €/mes</p>}
        </div>
      </div>

      {/* Premium plans */}
      {!isPremium && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-flex w-14 h-14 rounded-2xl gradient-neon neon-glow items-center justify-center mb-3">
              <Crown className="w-7 h-7 text-black" />
            </div>
            <h3 className="text-xl font-black font-display">Plan deportivo + alimenticio</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Tu plan de entrenamiento y nutrición por solo 4,99 €/mes</p>
            <p className="text-xs text-[var(--neon-green)] mt-1 font-semibold">2 primeros meses gratis de lanzamiento</p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {PREMIUM_FEATURES.map((feat) => (
              <div key={feat.title} className="flex items-start gap-2.5 p-3 rounded-xl glass-card">
                <span className="text-lg flex-shrink-0">{feat.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">{feat.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Plan cards */}
          <div className="space-y-3">
            {PREMIUM_PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => activatePremium(plan.id)}
                disabled={processing !== null}
                className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${
                  plan.id === 'premium_yearly'
                    ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/5 hover:bg-[var(--neon-green)]/10 neon-glow'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--neon-green)]/50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold">{plan.label}</span>
                    {plan.badge && (
                      <span className="px-2 py-0.5 rounded-full gradient-neon text-black text-[10px] font-bold">{plan.badge}</span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black font-display">{plan.price}</span>
                    <span className="text-sm text-[var(--text-secondary)]">{plan.period}</span>
                  </div>
                  {plan.savings && <p className="text-xs text-[var(--neon-green)] mt-0.5">{plan.savings}</p>}
                </div>
                <div className="w-12 h-12 rounded-xl gradient-neon flex items-center justify-center flex-shrink-0">
                  {processing === plan.id ? (
                    <Loader2 className="w-6 h-6 text-black animate-spin" />
                  ) : (
                    <Check className="w-6 h-6 text-black" strokeWidth={3} />
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Payment methods */}
          <div className="glass-card rounded-2xl p-4">
            <p className="text-xs text-[var(--text-muted)] mb-3 text-center font-semibold uppercase tracking-wider">Métodos de pago disponibles</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <CreditCard className="w-5 h-5 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-xs font-semibold">Tarjeta de crédito</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <Apple className="w-5 h-5 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-xs font-semibold">Apple Pay</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <Wallet className="w-5 h-5 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-xs font-semibold">PayPal</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <Landmark className="w-5 h-5 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-xs font-semibold">Bizum / Transferencia</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] text-center mt-3">Pago seguro procesado por Stripe · CIFrado SSL de 256 bits</p>
          </div>

          {/* Restore purchases */}
          <button
            onClick={restorePurchases}
            disabled={restoreStatus === 'restoring'}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            {restoreStatus === 'restoring' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : restoreStatus === 'success' ? (
              <Check className="w-4 h-4 text-[var(--neon-green)]" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {restoreStatus === 'restoring' ? 'Restaurando...' : restoreStatus === 'success' ? '¡Compras restauradas!' : restoreStatus === 'error' ? 'No se encontraron compras' : 'Restaurar compras'}
          </button>
          {restoreStatus === 'error' && (
            <p className="text-[10px] text-center text-[var(--text-muted)]">No tienes una suscripción Premium activa asociada a esta cuenta.</p>
          )}

          <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed px-4">
            La suscripción se renueva automáticamente. Puedes cancelarla en cualquier momento desde los ajustes de tu cuenta. Al continuar, aceptas los términos y la política de privacidad.
          </p>
        </div>
      )}

      {/* Cancel premium */}
      {isPremium && (
        <div className="glass-card rounded-2xl p-4">
          {showCancelConfirm ? (
            <div className="space-y-3 animate-fade-in">
              <p className="text-sm text-[var(--text-secondary)] text-center">¿Seguro que quieres cancelar tu suscripción Premium? Perderás acceso a todas las funciones exclusivas.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-sm transition-all hover:text-[var(--text-primary)]">
                  No, mantener Premium
                </button>
                <button onClick={cancelPremium} disabled={processing === 'cancel'} className="flex-1 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm transition-all hover:bg-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {processing === 'cancel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                  Sí, cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5 text-[var(--neon-green)]" />
                <div>
                  <p className="font-semibold text-sm">Gestionar suscripción</p>
                  <p className="text-xs text-[var(--text-muted)]">Puedes cancelar tu suscripción en cualquier momento</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCancelConfirm(true)} className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm transition-all hover:bg-red-500/20">
                  Cancelar suscripción
                </button>
                <button onClick={restorePurchases} disabled={restoreStatus === 'restoring'} className="flex-1 py-2.5 rounded-xl bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-secondary)] font-semibold text-sm transition-all hover:text-[var(--text-primary)] disabled:opacity-50 flex items-center justify-center gap-2">
                  {restoreStatus === 'restoring' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Restaurar compras
                </button>
              </div>
              {restoreStatus === 'success' && <p className="text-xs text-[var(--neon-green)] mt-2 text-center">¡Compras restauradas correctamente!</p>}
              {restoreStatus === 'error' && <p className="text-xs text-red-400 mt-2 text-center">No se encontraron compras activas.</p>}
            </>
          )}
        </div>
      )}

    </div>
  );
}
