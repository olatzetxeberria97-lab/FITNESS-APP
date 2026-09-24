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
import { scheduleDailyReminders, getPermission, notificationsSupported } from '@/lib/notifications';

function AppContent() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('dashboard');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    if (checkout === 'success' || checkout === 'cancelled') {
      setTab('subscription');
      refreshProfile();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [refreshProfile]);

  useEffect(() => {
    if (!session || !profile?.onboarding_complete) return;
    if (profile.notifications_enabled) {
      scheduleDailyReminders();
    }
  }, [session, profile]);

  useEffect(() => {
    if (!session || !profile?.onboarding_complete) return;
    if (!notificationsSupported()) return;
    if (profile.notifications_enabled && getPermission() === 'default') {
      import('@/lib/notifications').then(({ requestPermission }) => requestPermission());
    }
  }, [session, profile]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-dark flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Auth />;
  if (!profile) return (
    <div className="min-h-screen gradient-dark flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[var(--neon-green)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!profile.onboarding_complete) return <Onboarding />;

  return (
    <Layout activeTab={tab} onTabChange={setTab}>
      {tab === 'dashboard' && <Dashboard onNavigate={(t) => setTab(t as Tab)} />}
      {tab === 'summary' && <Summary />}
      {tab === 'calendar' && <CalendarView />}
      {tab === 'record' && <RecordWorkout />}
      {tab === 'community' && <Community />}
      {tab === 'profile' && <Profile />}
      {tab === 'settings' && <Settings onNavigate={(t) => setTab(t as Tab)} />}
      {tab === 'subscription' && <Subscription />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;
