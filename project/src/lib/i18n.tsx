import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { DICTS, type Dict } from './translations';

export type Lang = 'es' | 'eu' | 'en' | 'de' | 'zh';

export type Tab = 'dashboard' | 'summary' | 'calendar' | 'record' | 'community' | 'profile' | 'settings' | 'subscription';

const VALID_LANGS: Lang[] = ['es', 'eu', 'en', 'de', 'zh'];

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('app_language') as Lang | null;
    if (stored && VALID_LANGS.includes(stored)) return stored;
    const browser = navigator.language.slice(0, 2).toLowerCase();
    if (VALID_LANGS.includes(browser as Lang)) return browser as Lang;
    return 'es';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem('app_language', l);
  }, []);

  const t = useCallback((key: string) => {
    return DICTS[lang][key] ?? DICTS.es[key] ?? key;
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { Dict };
