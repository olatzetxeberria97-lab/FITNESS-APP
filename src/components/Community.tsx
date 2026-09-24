import { useEffect, useState, useCallback } from 'react';
import { Users, Search, UserPlus, Check, X, Clock, MapPin, Route, Lock, Globe, Loader2, Trash2, UserCheck, Heart, MessageCircle, Send, Flame, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { getSportEmoji, getSportLabel } from '@/lib/planGenerator';
import type { Profile, Workout, FriendRequest, WorkoutLike, WorkoutComment } from '@/lib/types';

interface FriendProfile extends Profile {
  friendship_id?: string;
}

interface FeedItem extends Workout {
  profile: Pick<Profile, 'id' | 'display_name' | 'avatar_color'>;
  likes: WorkoutLike[];
  comments: (WorkoutComment & { profile: Pick<Profile, 'display_name' | 'avatar_color'> })[];
  liked_by_me?: boolean;
}

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Perder peso',
  gain_muscle: 'Ganar músculo',
  general_health: 'Salud general',
  define: 'Definir',
  gain_strength: 'Ganar fuerza',
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)} d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function formatDuration(sec: number | null): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPace(sec: number, km: number): string {
  if (!sec || !km || km === 0) return '';
  const paceSec = sec / km;
  const m = Math.floor(paceSec / 60);
  const s = Math.round(paceSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function Community() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<'feed' | 'friends' | 'add'>('feed');
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [requests, setRequests] = useState<(FriendRequest & { sender: Profile })[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentBody, setCommentBody] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const loadFriends = useCallback(async () => {
    if (!user) return;
    const { data: friendships } = await supabase.from('friendships').select('id, friend_id').eq('user_id', user.id);
    const friendIds = (friendships || []).map((f: { friend_id: string }) => f.friend_id);
    if (friendIds.length === 0) { setFriends([]); return; }
    const { data: friendProfiles } = await supabase.from('profiles').select('*').in('id', friendIds);
    setFriends((friendProfiles as Profile[]).map((p) => ({ ...p, friendship_id: friendships?.find((f: { friend_id: string }) => f.friend_id === p.id)?.id })));
  }, [user]);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    const { data: reqs } = await supabase.from('friend_requests').select('*, sender:profiles!friend_requests_sender_id_fkey(*)').eq('receiver_id', user.id).eq('status', 'pending');
    setRequests((reqs as (FriendRequest & { sender: Profile })[]) || []);
  }, [user]);

  const loadFeed = useCallback(async () => {
    if (!user) return;
    const { data: friendships } = await supabase.from('friendships').select('friend_id').eq('user_id', user.id);
    const friendIds = (friendships || []).map((f: { friend_id: string }) => f.friend_id);
    const ids = [user.id, ...friendIds];
    const { data: workouts } = await supabase.from('workouts').select('*, profile:profiles!workouts_user_id_fkey(id, display_name, avatar_color)').in('user_id', ids).eq('is_shared', true).order('created_at', { ascending: false }).limit(30);
    const workoutData = (workouts as (Workout & { profile: Pick<Profile, 'id' | 'display_name' | 'avatar_color'> })[]) || [];

    const enriched = await Promise.all(workoutData.map(async (w) => {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from('workout_likes').select('*, profile:profiles!workout_likes_user_id_fkey(display_name, avatar_color)').eq('workout_id', w.id),
        supabase.from('workout_comments').select('*, profile:profiles!workout_comments_user_id_fkey(display_name, avatar_color)').eq('workout_id', w.id).order('created_at', { ascending: true }),
      ]);
      const likes = (likesRes.data as WorkoutLike[]) || [];
      const comments = (commentsRes.data as (WorkoutComment & { profile: Pick<Profile, 'display_name' | 'avatar_color'> })[]) || [];
      return { ...w, likes, comments, liked_by_me: likes.some((l) => l.user_id === user.id) };
    }));

    setFeed(enriched);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    Promise.all([loadFriends(), loadRequests(), loadFeed()]).finally(() => setLoading(false));
  }, [user, loadFriends, loadRequests, loadFeed]);

  async function searchUsers() {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const { data } = await supabase.from('profiles').select('*').ilike('display_name', `%${searchQuery.trim()}%`).neq('id', user.id).limit(10);
    setSearchResults((data as Profile[]) || []);
    setSearching(false);
  }

  async function sendRequest(receiverId: string) {
    if (!user) return;
    setActionLoading(receiverId);
    await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: receiverId });
    setSearchResults((prev) => prev.filter((p) => p.id !== receiverId));
    setActionLoading(null);
  }

  async function acceptRequest(reqId: string, senderId: string) {
    if (!user) return;
    setActionLoading(reqId);
    await supabase.from('friendships').insert([{ user_id: user.id, friend_id: senderId }, { user_id: senderId, friend_id: user.id }]);
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', reqId);
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    await loadFriends();
    await loadFeed();
    setActionLoading(null);
  }

  async function declineRequest(reqId: string) {
    setActionLoading(reqId);
    await supabase.from('friend_requests').update({ status: 'declined' }).eq('id', reqId);
    setRequests((prev) => prev.filter((r) => r.id !== reqId));
    setActionLoading(null);
  }

  async function removeFriend(friendshipId: string, friendId: string) {
    if (!user) return;
    setActionLoading(friendId);
    await supabase.from('friendships').delete().eq('id', friendshipId);
    await supabase.from('friendships').delete().eq('user_id', friendId).eq('friend_id', user.id);
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
    await loadFeed();
    setActionLoading(null);
  }

  async function toggleWorkoutPrivacy(workoutId: string, currentShared: boolean) {
    await supabase.from('workouts').update({ is_shared: !currentShared }).eq('id', workoutId);
    setFeed((prev) => prev.map((w) => (w.id === workoutId ? { ...w, is_shared: !currentShared } : w)));
  }

  async function toggleLike(workoutId: string, liked: boolean) {
    if (!user) return;
    if (liked) {
      await supabase.from('workout_likes').delete().eq('workout_id', workoutId).eq('user_id', user.id);
    } else {
      await supabase.from('workout_likes').insert({ workout_id: workoutId, user_id: user.id });
    }
    await loadFeed();
  }

  async function submitComment(workoutId: string) {
    if (!user) return;
    const body = commentBody[workoutId]?.trim();
    if (!body) return;
    await supabase.from('workout_comments').insert({ workout_id: workoutId, user_id: user.id, body });
    setCommentBody((prev) => ({ ...prev, [workoutId]: '' }));
    await loadFeed();
  }

  async function deleteComment(commentId: string) {
    await supabase.from('workout_comments').delete().eq('id', commentId);
    await loadFeed();
  }

  function toggleComments(workoutId: string) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) next.delete(workoutId);
      else next.add(workoutId);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-black font-display">Comunidad</h1>

      <div className="flex gap-2 p-1 bg-[var(--bg-darkest)] rounded-2xl">
        <button onClick={() => setTab('feed')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'feed' ? 'gradient-neon text-black' : 'text-[var(--text-secondary)]'}`}>Feed</button>
        <button onClick={() => setTab('friends')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${tab === 'friends' ? 'gradient-neon text-black' : 'text-[var(--text-secondary)]'}`}>
          Amigos
          {requests.length > 0 && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{requests.length}</span>}
        </button>
        <button onClick={() => setTab('add')} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === 'add' ? 'gradient-neon text-black' : 'text-[var(--text-secondary)]'}`}>Añadir</button>
      </div>

      {/* Feed - Strava style */}
      {tab === 'feed' && (
        <div className="space-y-4">
          {feed.length === 0 ? (
            <div className="glass-card rounded-3xl p-8 text-center">
              <Users className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)]">El feed está vacío.</p>
              <p className="text-[var(--text-muted)] text-sm mt-1">Añade amigos y comparte tus entrenamientos para verlos aquí.</p>
            </div>
          ) : (
            feed.map((item) => {
              const isOwn = item.user_id === user?.id;
              const showComments = expandedComments.has(item.id);
              const duration = item.duration_sec || 0;
              const distance = item.distance_km ? parseFloat(String(item.distance_km)) : 0;
              const hasMetrics = duration > 0 || distance > 0;
              const pace = duration > 0 && distance > 0 ? formatPace(duration, distance) : '';
              return (
                <div key={item.id} className="glass-card rounded-3xl overflow-hidden animate-fade-in">
                  {/* Header: avatar + name + time + privacy */}
                  <div className="flex items-center gap-3 px-4 pt-4">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-black text-sm flex-shrink-0 ring-2 ring-[var(--border-subtle)]" style={{ backgroundColor: item.profile.avatar_color }}>
                      {item.profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.profile.display_name}</p>
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                        <span>{formatRelativeTime(item.created_at)}</span>
                        {item.type === 'gps' && <span className="flex items-center gap-0.5 text-[var(--neon-green)]"><MapPin className="w-3 h-3" /> GPS</span>}
                      </p>
                    </div>
                    {isOwn && (
                      <button onClick={() => toggleWorkoutPrivacy(item.id, item.is_shared)} className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 transition-colors ${item.is_shared ? 'bg-[var(--neon-green)]/10 text-[var(--neon-green)]' : 'bg-[var(--bg-darkest)] text-[var(--text-muted)]'}`}>
                        {item.is_shared ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {item.is_shared ? 'Público' : 'Privado'}
                      </button>
                    )}
                  </div>

                  {/* Activity title */}
                  <div className="px-4 pt-3 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getSportEmoji(item.sport)}</span>
                      <div>
                        <p className="font-bold text-base leading-tight">{item.custom_name || getSportLabel(item.sport)}</p>
                        {item.notes && <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.notes}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Photo */}
                  {item.photo_url && (
                    <div className="px-4 pb-3">
                      <img src={item.photo_url} alt="entreno" className="w-full max-h-72 object-cover rounded-2xl" />
                    </div>
                  )}

                  {/* Stats grid - Strava style */}
                  {hasMetrics && (
                    <div className="px-4 pb-3">
                      <div className="grid grid-cols-3 gap-2 bg-[var(--bg-darkest)] rounded-2xl p-3 border border-[var(--border-subtle)]">
                        {duration > 0 && (
                          <div className="text-center">
                            <Clock className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                            <p className="text-base font-black font-display">{formatDuration(duration)}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Tiempo</p>
                          </div>
                        )}
                        {distance > 0 && (
                          <div className="text-center">
                            <Route className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                            <p className="text-base font-black font-display">{distance.toFixed(2)}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">km</p>
                          </div>
                        )}
                        {pace && (
                          <div className="text-center">
                            <Zap className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                            <p className="text-base font-black font-display">{pace}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">/km</p>
                          </div>
                        )}
                        {item.elevation_gain_m != null && item.elevation_gain_m > 0 && (
                          <div className="text-center">
                            <TrendingUp className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                            <p className="text-base font-black font-display">{item.elevation_gain_m}m</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Desnivel</p>
                          </div>
                        )}
                        {item.calories_est != null && item.calories_est > 0 && (
                          <div className="text-center">
                            <Flame className="w-4 h-4 text-[var(--neon-green)] mx-auto mb-1" />
                            <p className="text-base font-black font-display">{item.calories_est}</p>
                            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">kcal</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center gap-4 px-4 pb-3 border-t border-[var(--border-subtle)] pt-3">
                    <button onClick={() => toggleLike(item.id, !!item.liked_by_me)} className={`flex items-center gap-1.5 text-sm transition-colors ${item.liked_by_me ? 'text-red-400' : 'text-[var(--text-muted)] hover:text-red-400'}`}>
                      <Heart className={`w-4 h-4 ${item.liked_by_me ? 'fill-current' : ''}`} />
                      <span className="font-semibold">{item.likes.length}</span>
                    </button>
                    <button onClick={() => toggleComments(item.id)} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--neon-green)] transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-semibold">{item.comments.length}</span>
                    </button>
                  </div>

                  {/* Comments */}
                  {showComments && (
                    <div className="px-4 pb-4 space-y-2 animate-fade-in border-t border-[var(--border-subtle)] pt-3">
                      {item.comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-black text-[10px] flex-shrink-0" style={{ backgroundColor: c.profile.avatar_color }}>
                            {c.profile.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 bg-[var(--bg-darkest)] rounded-2xl px-3 py-2">
                            <p className="text-xs"><span className="font-bold">{c.profile.display_name}</span> <span className="text-[var(--text-secondary)]">{c.body}</span></p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatRelativeTime(c.created_at)}</p>
                          </div>
                          {c.user_id === user?.id && (
                            <button onClick={() => deleteComment(c.id)} className="text-[var(--text-muted)] hover:text-red-400 mt-1"><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input type="text" value={commentBody[item.id] || ''} onChange={(e) => setCommentBody((prev) => ({ ...prev, [item.id]: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && submitComment(item.id)} placeholder="Escribe un comentario..." className="flex-1 bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
                        <button onClick={() => submitComment(item.id)} disabled={!commentBody[item.id]?.trim()} className="px-3 py-2 rounded-xl gradient-neon text-black disabled:opacity-30 transition-all"><Send className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Friends */}
      {tab === 'friends' && (
        <div className="space-y-4">
          {requests.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Solicitudes pendientes</h3>
              <div className="space-y-2">
                {requests.map((req) => (
                  <div key={req.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm flex-shrink-0" style={{ backgroundColor: req.sender.avatar_color }}>{req.sender.display_name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{req.sender.display_name}</p><p className="text-xs text-[var(--text-muted)]">Quiere ser tu amigo</p></div>
                    <button onClick={() => acceptRequest(req.id, req.sender_id)} disabled={actionLoading === req.id} className="w-9 h-9 rounded-lg gradient-neon text-black flex items-center justify-center transition-all hover:scale-105 disabled:opacity-50">{actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}</button>
                    <button onClick={() => declineRequest(req.id)} disabled={actionLoading === req.id} className="w-9 h-9 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-50"><X className="w-5 h-5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Tus amigos ({friends.length})</h3>
            {friends.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-[var(--text-secondary)] text-sm">Aún no tienes amigos.</p>
                <button onClick={() => setTab('add')} className="text-[var(--neon-green)] text-sm font-semibold mt-2">Añadir amigos →</button>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm flex-shrink-0" style={{ backgroundColor: friend.avatar_color }}>{friend.display_name.charAt(0).toUpperCase()}</div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{friend.display_name}</p><p className="text-xs text-[var(--text-muted)]">{GOAL_LABELS[friend.goal]}</p></div>
                    <button onClick={() => friend.friendship_id && removeFriend(friend.friendship_id, friend.id)} disabled={actionLoading === friend.id} className="w-9 h-9 rounded-lg bg-[var(--bg-darkest)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-400 flex items-center justify-center transition-all disabled:opacity-50">{actionLoading === friend.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add friends */}
      {tab === 'add' && (
        <div className="space-y-4">
          <div className="glass-card rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4"><UserPlus className="w-5 h-5 text-[var(--neon-green)]" /><h3 className="font-bold">Buscar por nombre de usuario</h3></div>
            <div className="flex gap-2">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchUsers()} placeholder="Escribe un nombre de usuario..." className="flex-1 bg-[var(--bg-darkest)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--neon-green)] transition-all" />
              <button onClick={searchUsers} disabled={searching || !searchQuery.trim()} className="px-4 py-3 rounded-xl gradient-neon text-black font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2">{searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}</button>
            </div>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <div key={result.id} className="glass-card rounded-2xl p-4 flex items-center gap-3 animate-fade-in">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black text-sm flex-shrink-0" style={{ backgroundColor: result.avatar_color }}>{result.display_name.charAt(0).toUpperCase()}</div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{result.display_name}</p><p className="text-xs text-[var(--text-muted)]">{GOAL_LABELS[result.goal]}</p></div>
                  <button onClick={() => sendRequest(result.id)} disabled={actionLoading === result.id} className="px-4 py-2 rounded-xl bg-[var(--neon-green)]/10 border border-[var(--neon-green)]/30 text-[var(--neon-green)] font-semibold text-sm transition-all hover:bg-[var(--neon-green)]/20 flex items-center gap-2 disabled:opacity-50">{actionLoading === result.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Enviar</button>
                </div>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && !searching && (
            <div className="glass-card rounded-2xl p-6 text-center"><p className="text-[var(--text-secondary)] text-sm">No se encontraron usuarios con ese nombre.</p></div>
          )}
          <div className="glass-card rounded-3xl p-6 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Tu nombre de usuario</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-darkest)] border border-[var(--neon-green)]/30"><UserCheck className="w-4 h-4 text-[var(--neon-green)]" /><span className="font-bold text-[var(--neon-green)]">{profile?.display_name}</span></div>
            <p className="text-xs text-[var(--text-muted)] mt-3">Comparte tu nombre para que tus amigos te encuentren.</p>
          </div>
        </div>
      )}
    </div>
  );
}
