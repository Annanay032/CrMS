import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faChevronDown, faCheck, faRightLeft, faUser, faPlus } from '@fortawesome/free-solid-svg-icons';
import { AiActivityIndicator } from '@/components/ai';
import { NotificationCenter } from './NotificationCenter';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { switchTeam } from '@/store/auth.slice';
import { api } from '@/store/api';
import { getInitials } from '@/utils/format';
import type { UserTeam } from '@/types';
import styles from './TopBar.module.scss';

export function TopBar() {
  const user = useAppSelector((s) => s.auth.user);
  const activeTeam = useAppSelector((s) => s.auth.activeTeam);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // ⌘K to focus search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSwitch = useCallback((team: UserTeam | null) => {
    dispatch(switchTeam(team));
    // Reset all RTK Query cache to force reload of team-scoped data
    dispatch(api.util.resetApiState());
    setDropdownOpen(false);
  }, [dispatch]);

  const teams = user?.teams ?? [];

  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__search}>
        <FontAwesomeIcon icon={faMagnifyingGlass} className={styles.topbar__search_icon} />
        <input ref={searchRef} type="text" placeholder="Search campaigns, creators, content..." />
        <kbd className={styles.topbar__kbd}>⌘K</kbd>
      </div>

      <div className={styles.topbar__actions}>
        <button className={styles.topbar__quick_create} onClick={() => navigate('/studio')} title="Quick Create">
          <FontAwesomeIcon icon={faPlus} />
        </button>

        <div className={styles.topbar__divider} />

        <AiActivityIndicator />

        <div className={styles.topbar__divider} />

        <NotificationCenter />

        <div className={styles.topbar__divider} />

        {/* ── Account Switcher ── */}
        <div className={styles.topbar__account} ref={dropdownRef}>
          <button
            className={styles.topbar__account_trigger}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className={styles.topbar__avatar}>
              {getInitials(user?.name ?? '?')}
            </div>
            <div className={styles.topbar__account_info}>
              <div className={styles.topbar__name}>{user?.name}</div>
              <div className={styles.topbar__role}>
                {activeTeam ? activeTeam.name : user?.role}
              </div>
            </div>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`${styles.topbar__chevron} ${dropdownOpen ? styles['topbar__chevron--open'] : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className={styles.topbar__dropdown}>
              {/* Personal Account */}
              <div className={styles.topbar__dropdown_section}>
                <div className={styles.topbar__dropdown_label}>Personal Account</div>
                <button
                  className={`${styles.topbar__dropdown_item} ${!activeTeam ? styles['topbar__dropdown_item--active'] : ''}`}
                  onClick={() => handleSwitch(null)}
                >
                  <div className={styles.topbar__dropdown_avatar}>
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div className={styles.topbar__dropdown_text}>
                    <span className={styles.topbar__dropdown_name}>{user?.name}</span>
                    <span className={styles.topbar__dropdown_meta}>{user?.role} · {user?.email}</span>
                  </div>
                  {!activeTeam && (
                    <FontAwesomeIcon icon={faCheck} className={styles.topbar__dropdown_check} />
                  )}
                </button>
              </div>

              {/* Team Accounts */}
              {teams.length > 0 && (
                <div className={styles.topbar__dropdown_section}>
                  <div className={styles.topbar__dropdown_label}>
                    <FontAwesomeIcon icon={faRightLeft} style={{ marginRight: 6, fontSize: 10 }} />
                    Switch Team
                  </div>
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      className={`${styles.topbar__dropdown_item} ${activeTeam?.id === team.id ? styles['topbar__dropdown_item--active'] : ''}`}
                      onClick={() => handleSwitch(team)}
                    >
                      <div className={styles.topbar__dropdown_avatar}>
                        {getInitials(team.name)}
                      </div>
                      <div className={styles.topbar__dropdown_text}>
                        <span className={styles.topbar__dropdown_name}>{team.name}</span>
                        <span className={styles.topbar__dropdown_meta}>
                          {team.teamRole}
                          {team.memberCount ? ` · ${team.memberCount} members` : ''}
                        </span>
                      </div>
                      {activeTeam?.id === team.id && (
                        <FontAwesomeIcon icon={faCheck} className={styles.topbar__dropdown_check} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
