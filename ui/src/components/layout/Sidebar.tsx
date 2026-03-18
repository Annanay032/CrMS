import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard, Calendar, PenSquare, BarChart3, Users,
  Megaphone, MessageSquare, TrendingUp, Settings, Bot, Search, Shield,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const creatorLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/calendar', icon: Calendar, label: 'Content Calendar' },
  { to: '/content/new', icon: PenSquare, label: 'Create Post' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/campaigns/my', icon: Megaphone, label: 'My Campaigns' },
  { to: '/community', icon: MessageSquare, label: 'Community' },
  { to: '/trends', icon: TrendingUp, label: 'Trends' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const brandLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/discover', icon: Search, label: 'Discover Creators' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/ai', icon: Bot, label: 'AI Assistant' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const agencyLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/creators', icon: Users, label: 'My Creators' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/agents', icon: Bot, label: 'Agent Logs' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/system', icon: Shield, label: 'System' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const linksByRole: Record<string, typeof creatorLinks> = {
  CREATOR: creatorLinks,
  BRAND: brandLinks,
  AGENCY: agencyLinks,
  ADMIN: adminLinks,
};

export function Sidebar() {
  const { user } = useAuthStore();
  const links = linksByRole[user?.role ?? 'CREATOR'] ?? creatorLinks;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-slate-100">
        <span className="text-xl font-bold text-indigo-600">CrMS</span>
        <span className="ml-1 text-xs text-slate-400 mt-1">Creator Management</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
            {user?.name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
