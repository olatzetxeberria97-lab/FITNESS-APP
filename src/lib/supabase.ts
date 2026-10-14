import { createClient } from '@supabase/supabase-js';

const supabaseUrl: string =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';

const supabaseAnonKey: string =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? '';

export const supabaseConfigError: string | null =
  !supabaseUrl || !supabaseAnonKey
    ? 'Falta la configuración de Supabase. Verifica las variables de entorno de compilación.'
    : null;

export const supabase = createClient(
  supabaseUrl || 'https://invalid.supabase.co',
  supabaseAnonKey || 'missing-config',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
    },
  },
);
