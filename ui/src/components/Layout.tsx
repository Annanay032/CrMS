import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Megaphone, FileText, Target, Bot } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/creators', icon: Users, label: 'Creators' },
  { to: '/brands', icon: Building2, label: 'Brands' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/content', icon: FileText, label: 'Content' },
  { to: '/matching', icon: Target, label: 'Matching' },
  { to: '/agents', icon: Bot, label: 'AI Agents' },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">CrMS</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-avatar">A</div>
          <span className="user-name">Admin</span>
        </div>
      </aside>
      <main className="main-content">
        {children}
        <Outlet />
      </main>
    </div>
  );
}
