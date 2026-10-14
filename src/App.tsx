import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { I18nProvider, type Tab } from '@/lib/i18n';
import Auth from '@/components/Auth';
import Onboarding from '@/components/Onboarding';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';
import Summary from '@/components/Summary';
import CalendarView from '@/components/CalendarView';
import RecordWorkout from '@/components/RecordWorkout';
import Community from '@/components/Community';
import Profile from '@/components/Profile';
import Settings from '@/components/Settings';
import Subscription from '@/components/Subscription';
import {
  scheduleDailyReminders,
  getPermission,
  notificationsSupported,
} from '@/lib/notifications';
import SplashScreen from '@/components/SplashScreen';
import ErrorBoundary from '@/components/ErrorBoundary';

function StartupError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
      <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>PULSE</h1>

      <p style={{ maxWidth: '360px', lineHeight: 1.6 }}>
        No hemos podido iniciar la aplicación correctamente.
      </p>

      <p
        role="alert"
        style={{
          maxWidth: '360px',
          color: '#b8b8c5',
          fontSize: '14px',
          lineHeight: 1.6,
        }}
      >
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        style={{
          marginTop: '20px',
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

function AppContent() {
  const {
    session,
    profile,
    loading,
    refreshProfile,
    initializationError,
    retryInitialization,
  } = useAuth();

  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');

    if (checkout === 'success' || checkout === 'cancelled') {
      setTab('subscription');
      void refreshProfile();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshProfile]);

  useEffect(() => {
    if (!session || !profile?.onboarding_complete) return;

    if (profile.notifications_enabled) {
      void scheduleDailyReminders();
    }
  }, [session, profile]);

  useEffect(() => {
    if (!session || !profile?.onboarding_complete) return;
    if (!notificationsSupported()) return;

    if (profile.notifications_enabled && getPermission() === 'default') {
      void import('@/lib/notifications').then(({ requestPermission }) =>
        requestPermission(),
      );
    }
  }, [session, profile]);

  if (loading) {
    return <SplashScreen />;
  }

  if (initializationError) {
    return (
      <StartupError
        message={initializationError.message}
        onRetry={() => {
          void retryInitialization();
        }}
      />
    );
  }

  if (!session) return <Auth />;
  if (!profile) return <Auth />;
  if (!profile.onboarding_complete) return <Onboarding />;

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {tab === 'dashboard' && (
        <Dashboard onNavigate={(t) => setTab(t as Tab)} />
      )}
      {tab === 'summary' && <Summary />}
      {tab === 'calendar' && <CalendarView />}
      {tab === 'record' && <RecordWorkout />}
      {tab === 'community' && <Community />}
      {tab === 'profile' && <Profile />}
      {tab === 'settings' && (
        <Settings onNavigate={(t) => setTab(t as Tab)} />
      )}
      {tab === 'subscription' && <Subscription />}
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <AppContent />
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
