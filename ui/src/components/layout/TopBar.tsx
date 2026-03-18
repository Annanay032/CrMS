import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import api from '../../lib/api';

export function TopBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
          <Bell className="h-5 w-5" />
        </button>
        <div className="h-6 w-px bg-slate-200" />
        <span className="text-sm text-slate-600">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
