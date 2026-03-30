import { useState, useCallback, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightFromBracket, faChevronDown, faTv } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { logout } from '@/store/auth.slice';
import { useLogoutApiMutation } from '@/store/endpoints/auth';
import { useGetConnectedAccountsQuery } from '@/store/endpoints/accounts';
import { NAV_GROUPS, filterNavByTeamRole } from '@/constants/navigation';
import type { NavGroup } from '@/constants/navigation';
import { tierMeetsMinimum, TIER_CONFIG } from '@/constants/features';
import { getInitials } from '@/utils/format';
import type { UsageTier } from '@/types';
import styles from './Sidebar.module.scss';

const STORAGE_KEY = 'crms:nav-collapsed';

function loadCollapsed(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function SidebarGroup({ group, userTier }: { group: NavGroup; userTier: UsageTier }) {
  const isSingle = group.items.length === 1;
  const [collapsed, setCollapsed] = useState(() => loadCollapsed()[group.label] ?? false);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      const state = loadCollapsed();
      state[group.label] = next;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return next;
    });
  }, [group.label]);

  // Single-item groups render directly without a header
  if (isSingle) {
    const item = group.items[0];
    const needsUpgrade = item.minTier && !tierMeetsMinimum(userTier, item.minTier);
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `sidebar-link ${isActive ? 'sidebar-link--active' : ''} ${needsUpgrade ? 'sidebar-link--gated' : ''}`
        }
      >
        <FontAwesomeIcon icon={item.icon} fixedWidth />
        {item.label}
        {needsUpgrade && (
          <span className="sidebar-link__badge" style={{ background: TIER_CONFIG[item.minTier!].color }}>
            {item.minTier === 'ENTERPRISE' ? 'ENT' : item.minTier}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div className={styles.sidebar__group}>
      <button className={styles.sidebar__groupLabel} onClick={toggle}>
        <span>{group.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`${styles.sidebar__chevron} ${collapsed ? styles['sidebar__chevron--collapsed'] : ''}`}
        />
      </button>
      <div className={`${styles.sidebar__groupItems} ${collapsed ? styles['sidebar__groupItems--collapsed'] : ''}`}>
        {group.items.map((item) => {
          const needsUpgrade = item.minTier && !tierMeetsMinimum(userTier, item.minTier);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link--active' : ''} ${needsUpgrade ? 'sidebar-link--gated' : ''}`
              }
            >
              <FontAwesomeIcon icon={item.icon} fixedWidth />
              {item.label}
              {needsUpgrade && (
                <span className="sidebar-link__badge" style={{ background: TIER_CONFIG[item.minTier!].color }}>
                  {item.minTier === 'ENTERPRISE' ? 'ENT' : item.minTier}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const activeTeam = useAppSelector((s) => s.auth.activeTeam);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutApiMutation();
  const { data: accountsRes } = useGetConnectedAccountsQuery();
  const groups = NAV_GROUPS[user?.role ?? 'CREATOR'] ?? NAV_GROUPS.CREATOR;
  const userTier: UsageTier = (user?.tier as UsageTier) ?? 'FREE';

  // Build dynamic "Channels" group from connected accounts
  const allGroups = useMemo(() => {
    const connected = accountsRes?.data?.accounts?.filter((a) => a.connected) ?? [];
    if (connected.length === 0) return groups;
    const channelGroup: NavGroup = {
      label: 'Channels',
      items: connected.map((a) => ({
        to: `/channel/${a.provider.toLowerCase()}`,
        icon: faTv,
        label: a.provider.charAt(0) + a.provider.slice(1).toLowerCase(),
      })),
    };
    // Insert after Intelligence group (or at end)
    const idx = groups.findIndex((g) => g.label === 'Intelligence');
    const copy = [...groups];
    copy.splice(idx >= 0 ? idx + 1 : copy.length - 1, 0, channelGroup);
    return copy;
  }, [groups, accountsRes]);

  // Apply team role-based access filtering
  const filteredGroups = useMemo(() => {
    const teamRole = activeTeam?.teamRole ?? null;
    return filterNavByTeamRole(allGroups, teamRole);
  }, [allGroups, activeTeam]);

  const handleLogout = async () => {
    try { await logoutApi().unwrap(); } catch { /* ignore */ }
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebar__logo}>
        <div className={styles.sidebar__icon}>C</div>
        <div>
          <span className={styles.sidebar__brand}>CrMS</span>
          <span className={styles.sidebar__tag} style={{ color: TIER_CONFIG[userTier].color }}>
            {TIER_CONFIG[userTier].label.toUpperCase()}
          </span>
        </div>
      </div>

      <nav className={styles.sidebar__nav}>
        {filteredGroups.map((group) => (
          <SidebarGroup key={group.label} group={group} userTier={userTier} />
        ))}
      </nav>

      <div className={styles.sidebar__footer}>
        {activeTeam && (
          <div className={styles.sidebar__team_badge}>
            <span className={styles.sidebar__team_dot} />
            {activeTeam.name}
            <span className={styles.sidebar__team_role}>{activeTeam.teamRole}</span>
          </div>
        )}
        <div className={styles.sidebar__user}>
          <div className={styles.sidebar__avatar}>
            {getInitials(user?.name ?? '?')}
          </div>
          <div className={styles.sidebar__info}>
            <div className={styles.sidebar__name}>{user?.name}</div>
            <div className={styles.sidebar__role}>{user?.role}</div>
          </div>
          <button className={styles.sidebar__logout} onClick={handleLogout} title="Logout">
            <FontAwesomeIcon icon={faArrowRightFromBracket} />
          </button>
        </div>
      </div>
    </aside>
  );
}
