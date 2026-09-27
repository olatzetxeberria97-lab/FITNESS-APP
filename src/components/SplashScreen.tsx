import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

const SPORT_FRAMES = [
  { emoji: '🏃', label: 'Correr' },
  { emoji: '🏋️', label: 'Pesas' },
  { emoji: '🤸', label: 'Saltar' },
  { emoji: '🧘', label: 'Yoga' },
];

export default function SplashScreen() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPORT_FRAMES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const current = SPORT_FRAMES[frame];

  return (
    <div className="min-h-screen gradient-dark flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#00ff88] opacity-[0.07] blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#00e5ff] opacity-[0.05] blur-[100px] animate-pulse" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-neon neon-glow mb-6 animate-scale-in">
          <Activity className="w-12 h-12 text-black" strokeWidth={2.5} />
        </div>

        <h1 className="text-5xl font-black font-display tracking-tight mb-2">
          <span className="gradient-neon-text">PULSE</span>
        </h1>

        <div className="h-16 flex items-center justify-center mt-4">
          <div
            key={frame}
            className="flex flex-col items-center animate-fade-in"
          >
            <span className="text-5xl mb-1 transition-all duration-300" style={{ transform: `scale(${1 + Math.sin(frame * Math.PI / 2) * 0.1})` }}>
              {current.emoji}
            </span>
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">{current.label}</span>
          </div>
        </div>

        <div className="flex gap-1.5 mt-6">
          {SPORT_FRAMES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === frame ? 'w-8 bg-[var(--neon-green)]' : 'w-1.5 bg-[var(--border-subtle)]'}`}
            />
          ))}
        </div>

        <div className="mt-8 w-8 h-8 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
