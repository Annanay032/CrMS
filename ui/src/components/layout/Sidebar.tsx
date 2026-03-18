import { NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGear, faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { logout } from '@/store/auth.slice';
import { useLogoutApiMutation } from '@/store/endpoints/auth';
import { NAV_LINKS } from '@/constants/navigation';
import { getInitials } from '@/utils/format';
import styles from './Sidebar.module.scss';

export function Sidebar() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [logoutApi] = useLogoutApiMutation();
  const links = NAV_LINKS[user?.role ?? 'CREATOR'] ?? NAV_LINKS.CREATOR;

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
          <span className={styles.sidebar__tag}>PRO</span>
        </div>
      </div>

      <nav className={styles.sidebar__nav}>
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <FontAwesomeIcon icon={icon} fixedWidth />
            {label}
          </NavLink>
        ))}

        <div className={styles.sidebar__divider}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
            }
          >
            <FontAwesomeIcon icon={faGear} fixedWidth />
            Settings
          </NavLink>
        </div>
      </nav>

      <div className={styles.sidebar__footer}>
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
