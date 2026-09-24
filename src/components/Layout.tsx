import { Home, Calendar, Plus, Users, Settings as SettingsIcon, User, BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';
import type { Tab } from '@/lib/i18n';

export type { Tab };

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children: ReactNode;
}

const LEFT_TABS: { key: Tab; labelKey: string; icon: typeof Home }[] = [
  { key: 'dashboard', labelKey: 'nav.home', icon: Home },
  { key: 'summary', labelKey: 'nav.summary', icon: BarChart3 },
  { key: 'calendar', labelKey: 'nav.calendar', icon: Calendar },
];

const RIGHT_TABS: { key: Tab; labelKey: string; icon: typeof Home }[] = [
  { key: 'community', labelKey: 'nav.community', icon: Users },
  { key: 'profile', labelKey: 'nav.profile', icon: User },
  { key: 'settings', labelKey: 'nav.settings', icon: SettingsIcon },
];

const ALL_TABS = [...LEFT_TABS, { key: 'record' as Tab, labelKey: 'nav.record', icon: Plus }, ...RIGHT_TABS];

export default function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen gradient-dark">
      {/* Desktop top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-[var(--bg-darkest)]/80 border-b border-[var(--border-subtle)] hidden md:block">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-neon flex items-center justify-center">
              <span className="text-black font-black text-lg">P</span>
            </div>
            <span className="font-display font-black text-xl gradient-neon-text">PULSE</span>
          </div>
          <nav className="flex gap-1 flex-wrap">
            {ALL_TABS.map((tab) => {
              const Icon = tab.icon;
              const isRecord = tab.key === 'record';
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'gradient-neon text-black'
                      : isRecord
                        ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)] border border-[var(--neon-green)]/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-28 md:pb-8">
        {children}
      </main>

      {/* Mobile bottom nav — 3 left, center Plus, 3 right */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
        <div className="backdrop-blur-xl bg-[var(--bg-darkest)]/90 border-t border-[var(--border-subtle)] px-1 py-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around">
            {LEFT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 transition-colors ${isActive ? 'text-[var(--neon-green)]' : 'text-[var(--text-muted)]'}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-semibold">{t(tab.labelKey)}</span>
                </button>
              );
            })}

            {/* Center Plus button */}
            <button onClick={() => onTabChange('record')} className="relative -mt-6">
              <div className="w-14 h-14 rounded-full gradient-neon neon-glow flex items-center justify-center">
                <Plus className="w-7 h-7 text-black" strokeWidth={2.5} />
              </div>
            </button>

            {RIGHT_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onTabChange(tab.key)}
                  className={`flex flex-col items-center gap-1 px-2 py-2 transition-colors ${isActive ? 'text-[var(--neon-green)]' : 'text-[var(--text-muted)]'}`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[9px] font-semibold">{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
