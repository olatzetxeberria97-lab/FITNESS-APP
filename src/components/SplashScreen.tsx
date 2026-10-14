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
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#0a0a0f',
        color: '#ffffff',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        boxSizing: 'border-box',
        padding: '16px',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-15%',
          left: '-15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: '#00ff88',
          opacity: 0.07,
          filter: 'blur(90px)',
          pointerEvents: 'none',
        }}
      />

      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-15%',
          right: '-15%',
          width: '280px',
          height: '280px',
          borderRadius: '50%',
          background: '#00e5ff',
          opacity: 0.05,
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '96px',
            height: '96px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #00ff88, #00e5ff)',
            boxShadow: '0 0 35px rgba(0, 255, 136, 0.2)',
            marginBottom: '24px',
            animation: 'pulse-logo 1.8s ease-in-out infinite',
          }}
        >
          <Activity
            style={{
              width: '48px',
              height: '48px',
              color: '#0a0a0f',
            }}
            strokeWidth={2.5}
          />
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: '48px',
            fontWeight: 900,
            letterSpacing: '-1.5px',
            background: 'linear-gradient(135deg, #00ff88, #00e5ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PULSE
        </h1>

        <p
          style={{
            margin: '8px 0 0',
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
            minHeight: '90px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: '20px',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              fontSize: '42px',
              marginBottom: '6px',
            }}
          >
            {current.emoji}
          </span>

          <span
            style={{
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
            display: 'flex',
            gap: '6px',
            marginTop: '18px',
          }}
        >
          {SPORT_FRAMES.map((sport, index) => (
            <div
              key={sport.label}
              style={{
                height: '6px',
                width: index === frame ? '32px' : '6px',
                borderRadius: '6px',
                backgroundColor: index === frame ? '#00ff88' : '#383844',
                transition: 'width 300ms ease',
              }}
            />
          ))}
        </div>

        <div
          aria-hidden="true"
          style={{
            width: '30px',
            height: '30px',
            marginTop: '30px',
            border: '2px solid #00ff88',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'pulse-spinner 0.8s linear infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes pulse-spinner {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-logo {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.04);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
```
