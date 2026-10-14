```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error al iniciar PULSE:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '24px',
            textAlign: 'center',
            background: '#0a0a0f',
            color: '#ffffff',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1>PULSE</h1>

          <p>
            Ha ocurrido un error al abrir la aplicación.
          </p>

          <p>
            Puedes intentar cargarla de nuevo.
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              border: 0,
              borderRadius: '10px',
              background: '#ffffff',
              color: '#0a0a0f',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Volver a intentarlo
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
```
