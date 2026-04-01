import {
  faGauge,
  faCalendarDays,
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
  faEarListen,
  faBinoculars,
  faUserGroup,
  faLink,
  faPhotoFilm,
  faBolt,
  faIndianRupeeSign,
  faSeedling,
  faFilm,
  faList,
  faAddressBook,
  faFunnelDollar,
  faSatelliteDish,
  faFileContract,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { UserRole, UsageTier, TeamRole } from '@/types';

export interface NavItem {
  to: string;
  icon: IconDefinition;
  label: string;
  /** Minimum tier required — shown as badge on lower tiers (soft wall, not blocked) */
  minTier?: UsageTier;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

// ─── Creator ────────────────────────────────────────────────

const creatorGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [
      { to: '/dashboard', icon: faGauge, label: 'Dashboard' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/studio', icon: faFilm, label: 'Studio' },
      { to: '/content', icon: faList, label: 'Library' },
      { to: '/create', icon: faLightbulb, label: 'Ideas' },
      { to: '/calendar', icon: faCalendarDays, label: 'Calendar' },
      { to: '/media', icon: faPhotoFilm, label: 'Media Library' },
    ],
  },
  {
    label: 'Monetization',
    items: [
      { to: '/revenue', icon: faIndianRupeeSign, label: 'Revenue', minTier: 'PRO' },
      { to: '/contracts', icon: faFileContract, label: 'Contracts', minTier: 'PRO' },
      { to: '/crm/contacts', icon: faAddressBook, label: 'CRM', minTier: 'PRO' },
      { to: '/crm/pipeline', icon: faFunnelDollar, label: 'Pipeline', minTier: 'PRO' },
      { to: '/crm/signals', icon: faSatelliteDish, label: 'Signals', minTier: 'PRO' },
      { to: '/campaigns/my', icon: faBullhorn, label: 'My Campaigns' },
      { to: '/bio', icon: faLink, label: 'Link-in-Bio', minTier: 'PRO' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/analytics', icon: faChartLine, label: 'Analytics' },
      { to: '/trends', icon: faArrowTrendUp, label: 'Trends', minTier: 'PRO' },
      { to: '/listening', icon: faEarListen, label: 'Listening', minTier: 'PRO' },
      { to: '/competitive', icon: faBinoculars, label: 'Competitive', minTier: 'ENTERPRISE' },
    ],
  },
  {
    label: 'AI & Growth',
    items: [
      { to: '/ai', icon: faRobot, label: 'AI Assistant' },
      { to: '/growth', icon: faSeedling, label: 'Growth Copilot', minTier: 'PRO' },
      { to: '/usage', icon: faBolt, label: 'AI Usage' },
    ],
  },
  {
    label: 'Communication',
    items: [
      { to: '/community', icon: faComments, label: 'Inbox' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/settings/team', icon: faUserGroup, label: 'Team Settings' },
      { to: '/teams', icon: faUsers, label: 'Teams' },
      { to: '/settings', icon: faGear, label: 'Settings' },
    ],
  },
];

// ─── Brand ──────────────────────────────────────────────────

const brandGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [{ to: '/dashboard', icon: faGauge, label: 'Dashboard' }],
  },
  {
    label: 'Campaigns',
    items: [
      { to: '/campaigns', icon: faBullhorn, label: 'Campaigns' },
      { to: '/discover', icon: faMagnifyingGlass, label: 'Discover Creators' },
    ],
  },
  {
    label: 'Intelligence',
    items: [{ to: '/analytics', icon: faChartLine, label: 'Analytics' }],
  },
  {
    label: 'Tools',
    items: [
      { to: '/media', icon: faPhotoFilm, label: 'Media Library' },
      { to: '/ai', icon: faRobot, label: 'AI Assistant' },
      { to: '/usage', icon: faBolt, label: 'AI Usage' },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', icon: faGear, label: 'Settings' }],
  },
];

// ─── Agency ─────────────────────────────────────────────────

const agencyGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [{ to: '/dashboard', icon: faGauge, label: 'Dashboard' }],
  },
  {
    label: 'Management',
    items: [
      { to: '/creators', icon: faUsers, label: 'My Creators' },
      { to: '/campaigns', icon: faBullhorn, label: 'Campaigns' },
    ],
  },
  {
    label: 'Intelligence',
    items: [{ to: '/analytics', icon: faChartLine, label: 'Analytics' }],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', icon: faGear, label: 'Settings' }],
  },
];

// ─── Admin ──────────────────────────────────────────────────

const adminGroups: NavGroup[] = [
  {
    label: 'Home',
    items: [{ to: '/dashboard', icon: faGauge, label: 'Dashboard' }],
  },
  {
    label: 'Administration',
    items: [
      { to: '/admin/users', icon: faUsers, label: 'Users' },
      { to: '/admin/agents', icon: faRobot, label: 'Agent Logs' },
      { to: '/admin/system', icon: faShieldHalved, label: 'System' },
    ],
  },
  {
    label: 'Intelligence',
    items: [{ to: '/analytics', icon: faChartLine, label: 'Analytics' }],
  },
  {
    label: 'Account',
    items: [{ to: '/settings', icon: faGear, label: 'Settings' }],
  },
];

// ─── Exports ────────────────────────────────────────────────

export const NAV_GROUPS: Record<UserRole, NavGroup[]> = {
  CREATOR: creatorGroups,
  BRAND: brandGroups,
  AGENCY: agencyGroups,
  ADMIN: adminGroups,
};

/** @deprecated Use NAV_GROUPS for grouped navigation */
export const NAV_LINKS: Record<UserRole, NavItem[]> = {
  CREATOR: creatorGroups.flatMap((g) => g.items),
  BRAND: brandGroups.flatMap((g) => g.items),
  AGENCY: agencyGroups.flatMap((g) => g.items),
  ADMIN: adminGroups.flatMap((g) => g.items),
};

// ─── Team Role → Allowed Nav Sections ───────────────────────
// When a user is in a team context, their TeamRole determines
// which nav group labels are visible.
export const TEAM_ROLE_ACCESS: Record<TeamRole, string[]> = {
  OWNER: ['Home', 'Content', 'Monetization', 'Intelligence', 'AI & Growth', 'Communication', 'Channels', 'Account', 'Administration', 'Campaigns', 'Management', 'Tools'],
  ADMIN: ['Home', 'Content', 'Monetization', 'Intelligence', 'AI & Growth', 'Communication', 'Channels', 'Account', 'Administration', 'Campaigns', 'Management', 'Tools'],
  EDITOR: ['Home', 'Content', 'Intelligence', 'Communication', 'Channels', 'AI & Growth'],
  CONTRIBUTOR: ['Home', 'Content', 'Communication'],
  VIEWER: ['Home', 'Intelligence'],
};

/**
 * Filter nav groups based on the active team role.
 * Returns all groups if no team context (personal account).
 */
export function filterNavByTeamRole(groups: NavGroup[], teamRole: TeamRole | null): NavGroup[] {
  if (!teamRole) return groups; // Personal account - show everything
  const allowed = TEAM_ROLE_ACCESS[teamRole] ?? [];
  return groups.filter((g) => allowed.includes(g.label));
}
