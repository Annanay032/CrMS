import { Badge } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from '@/hooks/store';
import { getInitials } from '@/utils/format';
import styles from './TopBar.module.scss';

export function TopBar() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__search}>
        <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: '#94a3b8', fontSize: 14 }} />
        <input type="text" placeholder="Search campaigns, creators, content..." />
      </div>

      <div className={styles.topbar__actions}>
        <Badge dot offset={[-2, 2]}>
          <button style={{ padding: 8, color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 }}>
            <FontAwesomeIcon icon={faBell} />
          </button>
        </Badge>

        <div className={styles.topbar__divider} />

        <div className={styles.topbar__user}>
          <div className={styles.topbar__avatar}>
            {getInitials(user?.name ?? '?')}
          </div>
          <div>
            <div className={styles.topbar__name}>{user?.name}</div>
            <div className={styles.topbar__role}>{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
