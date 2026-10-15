```tsx
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
    const interval = window.setInterval(() => {
      setFrame((previousFrame) => (previousFrame + 1) % SPORT_FRAMES.length);
    }, 600);

    return () => window.clearInterval(interval);
  }, []);

  const current = SPORT_FRAMES[frame];

  return (
    <main
      role="status"
      aria-label="Cargando PULSE"
      style={{
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0f',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '90px',
          height: '90px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #00ff88, #00e5ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <Activity
          size={46}
          color="#0a0a0f"
          strokeWidth={2.5}
        />
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: '48px',
          fontWeight: 900,
          letterSpacing: '-1.5px',
          color: '#00ff88',
        }}
      >
        PULSE
      </h1>

      <p
        style={{
          marginTop: '8px',
          color: '#a0a0ad',
          fontSize: '12px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        Entrena a tu ritmo
      </p>

      <div
        style={{
          minHeight: '100px',
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            fontSize: '42px',
            display: 'inline-block',
          }}
        >
          {current.emoji}
        </span>

        <span
          style={{
            marginTop: '8px',
            color: '#a0a0ad',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {current.label}
        </span>
      </div>

      <div
        aria-hidden="true"
        style={{
          width: '32px',
          height: '32px',
          marginTop: '24px',
          border: '3px solid #00ff88',
          borderTopColor: 'transparent',
          borderRadius: '50%',
        }}
      />
    </main>
  );
}
```
