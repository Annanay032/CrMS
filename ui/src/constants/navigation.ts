import {
  faGauge,
  faCalendarDays,
  faPenToSquare,
  faChartLine,
  faBullhorn,
  faComments,
  faArrowTrendUp,
  faRobot,
  faGear,
  faMagnifyingGlass,
  faUsers,
  faShieldHalved,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { UserRole } from '@/types';

export interface NavItem {
  to: string;
  icon: IconDefinition;
  label: string;
}

const creatorLinks: NavItem[] = [
  { to: '/dashboard', icon: faGauge, label: 'Dashboard' },
  { to: '/create', icon: faLightbulb, label: 'Create' },
  { to: '/calendar', icon: faCalendarDays, label: 'Content Calendar' },
  { to: '/content/new', icon: faPenToSquare, label: 'Create Post' },
  { to: '/analytics', icon: faChartLine, label: 'Analytics' },
  { to: '/campaigns/my', icon: faBullhorn, label: 'My Campaigns' },
  { to: '/community', icon: faComments, label: 'Community' },
  { to: '/trends', icon: faArrowTrendUp, label: 'Trends' },
  { to: '/ai', icon: faRobot, label: 'AI Assistant' },
];

const brandLinks: NavItem[] = [
  { to: '/dashboard', icon: faGauge, label: 'Dashboard' },
  { to: '/campaigns', icon: faBullhorn, label: 'Campaigns' },
  { to: '/discover', icon: faMagnifyingGlass, label: 'Discover Creators' },
  { to: '/analytics', icon: faChartLine, label: 'Analytics' },
  { to: '/ai', icon: faRobot, label: 'AI Assistant' },
];

const agencyLinks: NavItem[] = [
  { to: '/dashboard', icon: faGauge, label: 'Dashboard' },
  { to: '/creators', icon: faUsers, label: 'My Creators' },
  { to: '/campaigns', icon: faBullhorn, label: 'Campaigns' },
  { to: '/analytics', icon: faChartLine, label: 'Analytics' },
];

const adminLinks: NavItem[] = [
  { to: '/dashboard', icon: faGauge, label: 'Dashboard' },
  { to: '/admin/users', icon: faUsers, label: 'Users' },
  { to: '/admin/agents', icon: faRobot, label: 'Agent Logs' },
  { to: '/analytics', icon: faChartLine, label: 'Analytics' },
  { to: '/admin/system', icon: faShieldHalved, label: 'System' },
];

export const NAV_LINKS: Record<UserRole, NavItem[]> = {
  CREATOR: creatorLinks,
  BRAND: brandLinks,
  AGENCY: agencyLinks,
  ADMIN: adminLinks,
};
