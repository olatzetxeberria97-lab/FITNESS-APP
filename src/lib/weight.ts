import { supabase } from './supabase';

export interface SaveWeightResult {
  ok: boolean;
  error?: string;
  duplicate?: boolean;
}

export async function saveWeightLog(
  userId: string,
  weightKg: number,
  refreshProfile: () => Promise<void>,
): Promise<SaveWeightResult> {
  if (isNaN(weightKg) || weightKg <= 0 || weightKg > 500) {
    return { ok: false, error: 'weight_invalid' };
  }

  const today = new Date().toISOString().split('T')[0];

  const { data: existing, error: selectErr } = await supabase
    .from('weight_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('logged_at', today)
    .maybeSingle();

  if (selectErr) {
    return { ok: false, error: selectErr.message };
  }

  if (existing) {
    const { error: updErr } = await supabase
      .from('weight_logs')
      .update({ weight_kg: weightKg })
      .eq('id', existing.id);

    if (updErr) return { ok: false, error: updErr.message };

    const { error: profErr } = await supabase
      .from('profiles')
      .update({ current_weight_kg: weightKg })
      .eq('id', userId);

    if (profErr) return { ok: false, error: profErr.message };

    await refreshProfile();
    return { ok: true, duplicate: true };
  }

  const { error: insErr } = await supabase
    .from('weight_logs')
    .insert({ user_id: userId, weight_kg: weightKg, logged_at: today });

  if (insErr) return { ok: false, error: insErr.message };

  const { error: profErr } = await supabase
    .from('profiles')
    .update({ current_weight_kg: weightKg })
    .eq('id', userId);

  if (profErr) return { ok: false, error: profErr.message };

  await refreshProfile();
  return { ok: true, duplicate: false };
}
