import { useState } from 'react';
import { Crown, Check, X, Loader2, Sparkles, RotateCcw, Lock, CreditCard, Wallet, Landmark, Apple } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { PREMIUM_FEATURES, PREMIUM_PLANS, isPremiumTier } from '@/lib/types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  contextLabel?: string;
}

export default function PaywallModal({ open, onClose, contextLabel }: PaywallModalProps) {
  const { user, refreshProfile } = useAuth();
  const [processing, setProcessing] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'restoring' | 'success' | 'error'>('idle');

  if (!open) return null;

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
          onClose();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto" onClick={onClose}>
      <div
        className="glass-card rounded-3xl w-full max-w-lg my-8 animate-scale-in relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[var(--bg-darkest)]/80 flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Header with glow */}
        <div className="relative px-6 pt-8 pb-4 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-[var(--neon-green)] opacity-[0.08] blur-[80px] pointer-events-none" />
          <div className="relative">
            <div className="inline-flex w-16 h-16 rounded-2xl gradient-neon neon-glow items-center justify-center mb-4">
              <Crown className="w-8 h-8 text-black" />
            </div>
            {contextLabel ? (
              <p className="text-xs text-[var(--neon-green)] font-semibold uppercase tracking-wider mb-1">{contextLabel}</p>
            ) : null}
            <h2 className="text-2xl font-black font-display">Desbloquea Premium</h2>
            <p className="text-[var(--text-secondary)] text-sm mt-2">Accede a todas las funciones y lleva tu entrenamiento al siguiente nivel.</p>
          </div>
        </div>

        {/* Features grid */}
        <div className="px-6 pb-2">
          <div className="grid grid-cols-2 gap-2.5">
            {PREMIUM_FEATURES.map((feat) => (
              <div key={feat.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--bg-darkest)]/60">
                <span className="text-lg flex-shrink-0">{feat.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">{feat.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="px-6 pt-4 space-y-3">
          {PREMIUM_PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => activatePremium(plan.id)}
              disabled={processing !== null}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${
                plan.id === 'premium_yearly'
                  ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/5 hover:bg-[var(--neon-green)]/10'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--neon-green)]/50'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm">{plan.label}</span>
                  {plan.badge && (
                    <span className="px-2 py-0.5 rounded-full gradient-neon text-black text-[10px] font-bold">{plan.badge}</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black font-display">{plan.price}</span>
                  <span className="text-xs text-[var(--text-secondary)]">{plan.period}</span>
                </div>
                {plan.savings && <p className="text-[10px] text-[var(--neon-green)] mt-0.5">{plan.savings}</p>}
              </div>
              <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center flex-shrink-0">
                {processing === plan.id ? (
                  <Loader2 className="w-5 h-5 text-black animate-spin" />
                ) : (
                  <Check className="w-5 h-5 text-black" strokeWidth={3} />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Payment methods */}
        <div className="px-6 pt-3">
          <div className="glass-card rounded-xl p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <CreditCard className="w-4 h-4 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-[10px] font-semibold">Tarjeta</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <Apple className="w-4 h-4 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-[10px] font-semibold">Apple Pay</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <Wallet className="w-4 h-4 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-[10px] font-semibold">PayPal</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)]">
                <Landmark className="w-4 h-4 text-[var(--neon-green)] flex-shrink-0" />
                <span className="text-[10px] font-semibold">Bizum</span>
              </div>
            </div>
            <p className="text-[9px] text-[var(--text-muted)] text-center mt-2">Pago seguro por Stripe</p>
          </div>
        </div>

        {/* Restore purchases */}
        <div className="px-6 pt-3 pb-3">
          <button
            onClick={restorePurchases}
            disabled={restoreStatus === 'restoring'}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            {restoreStatus === 'restoring' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {restoreStatus === 'restoring' ? 'Restaurando...' : restoreStatus === 'success' ? '¡Restaurado!' : restoreStatus === 'error' ? 'No se encontraron compras' : 'Restaurar compras'}
          </button>
          {restoreStatus === 'error' && (
            <p className="text-[10px] text-center text-[var(--text-muted)] mt-1">No tienes una suscripción Premium activa asociada a esta cuenta.</p>
          )}
        </div>

        {/* Terms */}
        <div className="px-6 pb-6">
          <p className="text-[10px] text-[var(--text-muted)] text-center leading-relaxed">
            La suscripción se renueva automáticamente. Puedes cancelarla en cualquier momento desde los ajustes de tu cuenta. Al continuar, aceptas los términos y la política de privacidad.
          </p>
        </div>
      </div>
    </div>
  );
}

export function PremiumLockBadge({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-[var(--neon-green)] hover:bg-black/80 transition-colors"
    >
      <Lock className="w-3.5 h-3.5" />
    </button>
  );
}

export function PremiumGate({ isPremium, onUnlock, children }: { isPremium: boolean; onUnlock: () => void; children: React.ReactNode }) {
  if (isPremium) return <>{children}</>;
  return (
    <div className="relative" onClick={onUnlock}>
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 cursor-pointer">
        <div className="w-12 h-12 rounded-2xl gradient-neon flex items-center justify-center neon-glow">
          <Crown className="w-6 h-6 text-black" />
        </div>
        <p className="text-sm font-bold text-[var(--neon-green)] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Desbloquear con Premium
        </p>
      </div>
    </div>
  );
}
