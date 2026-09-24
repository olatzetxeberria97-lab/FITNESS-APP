import { Check } from 'lucide-react';
import { GOAL_EMOJIS, GOAL_LABELS, GOAL_DESCRIPTIONS, GOAL_ORDER, type Goal } from '@/lib/types';

interface GoalSelectorProps {
  selected: Goal | null;
  onSelect: (goal: Goal) => void;
}

export default function GoalSelector({ selected, onSelect }: GoalSelectorProps) {
  return (
    <div className="space-y-3">
      {GOAL_ORDER.map((g) => (
        <button
          key={g}
          onClick={() => onSelect(g)}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${selected === g ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10 neon-glow' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)] hover:border-[var(--text-muted)]'}`}
        >
          <span className="text-4xl">{GOAL_EMOJIS[g]}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold">{GOAL_LABELS[g]}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{GOAL_DESCRIPTIONS[g]}</p>
          </div>
          {selected === g && <Check className="w-6 h-6 text-[var(--neon-green)]" />}
        </button>
      ))}
    </div>
  );
}
