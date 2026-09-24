import { useEffect, useState, useCallback } from 'react';
import { Swords, Plus, X, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Challenge, ChallengeParticipant, Profile } from '@/lib/types';

type EnrichedParticipant = ChallengeParticipant & { user: Profile | null };

const CHALLENGE_TYPES = [
  { key: 'weekly_streak', label: 'Racha semanal', emoji: '🔥', desc: 'Entrena X días seguidos' },
  { key: 'distance', label: 'Distancia', emoji: '🏁', desc: 'Recorre X km en total' },
  { key: 'minutes', label: 'Minutos', emoji: '⏱️', desc: 'Acumula X minutos' },
  { key: 'flash', label: 'Reto flash', emoji: '⚡', desc: 'Reto rápido de 24 h' },
];

export default function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<(Challenge & { creator: Profile; participants: (ChallengeParticipant & { user: Profile })[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('weekly_streak');
  const [newTarget, setNewTarget] = useState('5');
  const [newSport, setNewSport] = useState('');
  const [creating, setCreating] = useState(false);


  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get friends
    const { data: friendships } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id);
    const friendIds = (friendships || []).map((f: { friend_id: string }) => f.friend_id);

    // Get challenges (created by me or friends)
    const { data: myChallenges } = await supabase.from('challenges').select('*').eq('creator_id', user.id).order('created_at', { ascending: false });
    let allChallenges = (myChallenges as Challenge[]) || [];

    if (friendIds.length > 0) {
      const { data: friendChallenges } = await supabase.from('challenges').select('*').in('creator_id', friendIds).order('created_at', { ascending: false });
      allChallenges = [...allChallenges, ...((friendChallenges as Challenge[]) || [])];
    }

    // Load participants + creator for each
    const enriched = await Promise.all(allChallenges.map(async (c) => {
      const { data: creator } = await supabase.from('profiles').select('*').eq('id', c.creator_id).maybeSingle();
      const { data: parts } = await supabase.from('challenge_participants').select('*').eq('challenge_id', c.id);
      const partUsers = await Promise.all((parts || []).map(async (p: ChallengeParticipant) => {
        const { data: u } = await supabase.from('profiles').select('*').eq('id', p.user_id).maybeSingle();
        return { ...p, user: u as Profile };
      }));
      return { ...c, creator: creator as Profile, participants: partUsers };
    }));

    setChallenges(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  async function createChallenge() {
    if (!user || !newTitle.trim()) return;
    setCreating(true);
    try {
      const endDate = new Date();
      if (newType === 'flash') endDate.setDate(endDate.getDate() + 1);
      else endDate.setDate(endDate.getDate() + 7);

      const { data, error } = await supabase.from('challenges').insert({
        creator_id: user.id,
        title: newTitle.trim(),
        challenge_type: newType,
        target_value: parseInt(newTarget) || 5,
        sport: newSport || null,
        end_date: endDate.toISOString().split('T')[0],
      }).select().single();

      if (error) throw error;

      // Auto-join creator
      await supabase.from('challenge_participants').insert({
        challenge_id: data.id,
        user_id: user.id,
      });

      setNewTitle(''); setNewTarget('5'); setNewSport(''); setShowCreate(false);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  }

  async function joinChallenge(challengeId: string) {
    if (!user) return;
    await supabase.from('challenge_participants').insert({ challenge_id: challengeId, user_id: user.id });
    await load();
  }

  function isParticipant(c: Challenge & { participants: EnrichedParticipant[] }): boolean {
    return c.participants?.some((p) => p.user_id === user?.id);
  }

  function getRanking(c: Challenge & { participants: EnrichedParticipant[] }) {
    return [...(c.participants || [])].sort((a, b) => b.progress_value - a.progress_value);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black font-display">Retos</h1>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-neon text-black font-bold text-sm transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4" /> Crear reto
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <Swords className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-secondary)]">No hay retos activos.</p>
          <p className="text-[var(--text-muted)] text-sm mt-1">Crea un reto y reta a tus amigos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => {
            const ranking = getRanking(c);
            const joined = isParticipant(c);
            const typeInfo = CHALLENGE_TYPES.find((t) => t.key === c.challenge_type);
            const isMine = c.creator_id === user?.id;
            const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <div key={c.id} className="glass-card rounded-3xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--neon-green)]/10 flex items-center justify-center text-2xl">{typeInfo?.emoji || '🏆'}</div>
                    <div>
                      <h3 className="font-bold font-display">{c.title}</h3>
                      <p className="text-xs text-[var(--text-muted)]">
                        {typeInfo?.label} · Meta: {c.target_value} {c.challenge_type === 'distance' ? 'km' : c.challenge_type === 'minutes' ? 'min' : 'días'}
                        {c.sport && ` · ${c.sport}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-muted)]">Quedan</p>
                    <p className="font-bold text-[var(--neon-green)]">{daysLeft > 0 ? `${daysLeft}d` : 'Terminado'}</p>
                  </div>
                </div>

                {/* Creator badge */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ backgroundColor: c.creator?.avatar_color }}>
                    {c.creator?.display_name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)]">Creado por {c.creator?.display_name}{isMine && ' (tú)'}</span>
                </div>

                {/* Ranking */}
                {ranking.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {ranking.slice(0, 5).map((p, i: number) => (
                      <div key={p.id} className={`flex items-center gap-3 p-2.5 rounded-xl ${p.user_id === user?.id ? 'bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30' : 'bg-[var(--bg-darkest)]'}`}>
                        <span className={`text-sm font-bold ${i === 0 ? 'text-[var(--neon-green)]' : 'text-[var(--text-muted)]'}`}>#{i + 1}</span>
                        {i === 0 && <Crown className="w-4 h-4 text-[var(--neon-green)]" />}
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black" style={{ backgroundColor: p.user?.avatar_color }}>{p.user?.display_name?.charAt(0).toUpperCase()}</div>
                        <span className="text-sm font-medium flex-1">{p.user?.display_name}</span>
                        <span className="text-sm font-bold text-[var(--neon-green)]">{p.progress_value}/{c.target_value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Join button */}
                {!joined && daysLeft > 0 && (
                  <button onClick={() => joinChallenge(c.id)} className="w-full py-2.5 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-semibold text-sm transition-all hover:bg-[var(--neon-green)]/20">
                    Unirse al reto
                  </button>
                )}
                {joined && <p className="text-center text-xs text-[var(--neon-green)] font-semibold">Participando</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="glass-card rounded-3xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold font-display">Crear reto</h3>
              <button onClick={() => setShowCreate(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Título</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="ej. Correr todos los días" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Tipo de reto</label>
                <div className="grid grid-cols-2 gap-2">
                  {CHALLENGE_TYPES.map((t) => (
                    <button key={t.key} onClick={() => setNewType(t.key)} className={`p-3 rounded-xl border-2 text-left transition-all ${newType === t.key ? 'border-[var(--neon-green)] bg-[var(--neon-green)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-darkest)]'}`}>
                      <span className="text-lg block">{t.emoji}</span>
                      <p className="text-xs font-semibold mt-1">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Objetivo</label>
                <input type="number" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-lg font-bold text-center focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">Deporte (opcional)</label>
                <input type="text" value={newSport} onChange={(e) => setNewSport(e.target.value)} placeholder="Todos los deportes" className="w-full bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              </div>

              <button onClick={createChallenge} disabled={creating || !newTitle.trim()} className="w-full gradient-neon text-black font-bold py-3.5 rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />} Crear reto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
