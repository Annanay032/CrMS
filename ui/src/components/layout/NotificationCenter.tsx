import { useState, useRef, useEffect } from 'react';
import { Badge } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faBellSlash,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/store/endpoints/notifications';
import type { Notification, NotificationType } from '@/types';
import styles from './NotificationCenter.module.scss';

function iconForType(type: NotificationType) {
  if (type === 'AGENT_COMPLETED') return { icon: faCheckCircle, cls: styles['icon--success'] };
  if (type === 'AGENT_FAILED') return { icon: faExclamationCircle, cls: styles['icon--error'] };
  return { icon: faInfoCircle, cls: styles['icon--info'] };
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useGetNotificationsQuery({ limit: 20 }, { pollingInterval: 60_000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const items: Notification[] = data?.data?.items ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  // Close when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleItemClick = (n: Notification) => {
    if (!n.read) markRead(n.id);
  };

  return (
    <div className={styles.center} ref={ref}>
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ padding: 8, color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 }}
          aria-label="Notifications"
        >
          <FontAwesomeIcon icon={faBell} />
        </button>
      </Badge>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <span className={styles.header__title}>Notifications</span>
            {unreadCount > 0 && (
              <button className={styles.header__btn} onClick={() => markAllRead()}>
                Mark all read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.empty__icon}>
                  <FontAwesomeIcon icon={faBellSlash} />
                </div>
                No notifications yet
              </div>
            ) : (
              items.map((n) => {
                const { icon, cls } = iconForType(n.type);
                return (
                  <button key={n.id} className={`${styles.item} ${!n.read ? styles['item--unread'] : ''}`} onClick={() => handleItemClick(n)}>
                    <div className={`${styles.icon} ${cls}`}>
                      <FontAwesomeIcon icon={icon} />
                    </div>
                    <div className={styles.body}>
                      <div className={styles.body__title}>{n.title}</div>
                      <div className={styles.body__text}>{n.body}</div>
                      <div className={styles.body__time}>{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <span className={styles.dot} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
