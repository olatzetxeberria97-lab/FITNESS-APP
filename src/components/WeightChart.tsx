import { useMemo } from 'react';
import { Scale, TrendingDown, TrendingUp, Plus, AlertCircle } from 'lucide-react';
import type { WeightLog } from '@/lib/types';
import { useI18n } from '@/lib/i18n';

interface WeightChartProps {
  weightLogs: WeightLog[];
  loadError?: boolean;
  onRegisterWeight?: () => void;
}

export default function WeightChart({ weightLogs, loadError, onRegisterWeight }: WeightChartProps) {
  const { t } = useI18n();

  const weightChartPoints = useMemo(() => {
    if (weightLogs.length === 0) return [];
    const sorted = [...weightLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    const weights = sorted.map((w) => w.weight_kg);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const range = maxW - minW || 1;
    return sorted.map((w, i) => {
      const x = (i / Math.max(sorted.length - 1, 1)) * 100;
      const y = 100 - ((w.weight_kg - minW) / range) * 80 - 10;
      return { x, y, weight: w.weight_kg, date: w.logged_at };
    });
  }, [weightLogs]);

  const weightPath = useMemo(() => {
    if (weightChartPoints.length < 2) return '';
    return weightChartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [weightChartPoints]);

  const weightAreaPath = useMemo(() => {
    if (weightChartPoints.length < 2) return '';
    const first = weightChartPoints[0];
    const last = weightChartPoints[weightChartPoints.length - 1];
    return `${weightPath} L ${last.x} 100 L ${first.x} 100 Z`;
  }, [weightChartPoints, weightPath]);

  const weightTrend = useMemo(() => {
    if (weightLogs.length < 2) return null;
    const sorted = [...weightLogs].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
    return sorted[sorted.length - 1].weight_kg - sorted[0].weight_kg;
  }, [weightLogs]);

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-[var(--neon-green)]" />
          <h3 className="font-bold">{t('cal.weightEvolution')}</h3>
        </div>
        {weightTrend !== null && weightTrend !== 0 && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${weightTrend < 0 ? 'text-[var(--neon-green)]' : 'text-orange-400'}`}>
            {weightTrend < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            {weightTrend > 0 ? '+' : ''}{weightTrend.toFixed(1)} kg
          </div>
        )}
      </div>

      {loadError ? (
        <div className="text-center py-8">
          <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">{t('sum.weightLoadError')}</p>
        </div>
      ) : weightLogs.length === 0 ? (
        <div className="text-center py-12">
          <Scale className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)] text-sm">{t('cal.noWeight')}</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">{t('cal.addFirst')}</p>
          {onRegisterWeight && (
            <button onClick={onRegisterWeight} className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-neon text-black font-bold text-sm transition-all hover:scale-105 active:scale-95 mx-auto">
              <Plus className="w-4 h-4" /> {t('cal.registerWeight')}
            </button>
          )}
        </div>
      ) : weightLogs.length === 1 ? (
        <div className="text-center py-8">
          <p className="text-4xl font-black gradient-neon-text">{weightLogs[0].weight_kg} kg</p>
          <p className="text-[var(--text-secondary)] text-sm mt-2">{t('cal.firstRecord')}</p>
          {onRegisterWeight && (
            <button onClick={onRegisterWeight} className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-bold text-sm transition-all hover:bg-[var(--neon-green)]/20 mx-auto">
              <Plus className="w-4 h-4" /> {t('cal.registerWeight')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="relative h-48 mb-4">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00ff88" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
                </linearGradient>
              </defs>
              {weightAreaPath && <path d={weightAreaPath} fill="url(#weightGradient)" />}
              {weightPath && <path d={weightPath} fill="none" stroke="#00ff88" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
              {weightChartPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="1.5" fill="#00ff88" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between text-xs text-[var(--text-muted)]">
            <span>{weightLogs[0]?.logged_at}</span>
            <span className="text-[var(--neon-green)] font-bold">{weightLogs[weightLogs.length - 1]?.weight_kg} kg</span>
            <span>{weightLogs[weightLogs.length - 1]?.logged_at}</span>
          </div>
        </>
      )}
    </div>
  );
}
