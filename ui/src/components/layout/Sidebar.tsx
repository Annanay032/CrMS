import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard, Calendar, PenSquare, BarChart3, Users,
  Megaphone, MessageSquare, TrendingUp, Settings, Bot, Search, Shield, LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

const creatorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Content Calendar' },
  { to: '/content/new', icon: PenSquare, label: 'Create Post' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/campaigns/my', icon: Megaphone, label: 'My Campaigns' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
];

const brandLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/discover', icon: Search, label: 'Discover Creators' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
];

const agencyLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/creators', icon: Users, label: 'My Creators' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/agents', icon: Bot, label: 'Agent Logs' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/system', icon: Shield, label: 'System' },
];

const linksByRole: Record<string, typeof creatorLinks> = {
  CREATOR: creatorLinks,
  BRAND: brandLinks,
  AGENCY: agencyLinks,
  ADMIN: adminLinks,
};

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const links = linksByRole[user?.role ?? 'CREATOR'] ?? creatorLinks;

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <span className="text-white text-sm font-bold">C</span>
        </div>
        <div>
          <span className="text-white font-bold text-lg tracking-tight">CrMS</span>
          <span className="text-slate-500 text-[10px] ml-1.5 font-medium">PRO</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200',
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </NavLink>
        ))}

        {/* Settings separated */}
        <div className="!mt-4 pt-4 border-t border-white/[0.06]">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200',
              )
            }
          >
            <Settings className="h-[18px] w-[18px] shrink-0" />
            Settings
          </NavLink>
        </div>
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-white/[0.04]">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-white/[0.06] transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
