import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useEffect } from 'react';
import api from '../../lib/api';

export function AppLayout() {
  const { isAuthenticated, setUser, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !user) {
      api.get('/auth/me').then((res) => setUser(res.data.data)).catch(() => {});
    }
  }, [isAuthenticated, user, setUser]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
