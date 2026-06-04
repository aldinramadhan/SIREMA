import { useState, useEffect } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { GraduationCap, Loader2 } from 'lucide-react';
import { MainApp } from './components/MainApp';
import { LoginPage } from './components/LoginPage';
import * as api from './utils/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const router = (user: AuthUser, onLogout: () => void, onRegisterUser: (p: { email: string; password: string; name: string }) => Promise<void>) =>
  createBrowserRouter([
    {
      path: '*',
      element: <MainApp user={user} onLogout={onLogout} onRegisterUser={onRegisterUser} />,
    },
  ]);

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    api.getSession().then((u) => {
      setUser(u);
      setChecking(false);
    });
    // Listen for auth state changes (e.g. token expiry)
    const { data: { subscription } } = api.supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const u = await api.signIn(email, password);
    setUser(u);
  };

  const handleLogout = async () => {
    await api.signOut();
    setUser(null);
  };

  const handleRegisterUser = async (payload: { email: string; password: string; name: string }) => {
    await api.registerUser(payload);
  };

  // Checking existing session
  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a2340] to-[#0f1628] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Not logged in → show login screen
  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Logged in → show main app
  return (
    <RouterProvider
      router={router(user, handleLogout, handleRegisterUser)}
    />
  );
}
