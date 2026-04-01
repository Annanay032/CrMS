import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faXmark,
  faChevronRight,
  faClockRotateLeft,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import {
  toggleAssistant,
  closeAssistant,
} from '@/store/ai.slice';
import { UnifiedChat } from './UnifiedChat';
import styles from './FloatingAiAssistant.module.scss';

type Tab = 'chat' | 'activity';

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function FloatingAiAssistant() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAssistantOpen, activeTasks, activityLog } = useAppSelector((s) => s.ai);
  const isAiBusy = activeTasks.length > 0;

  const [tab, setTab] = useState<Tab>('chat');

  const handleExpandChat = () => {
    dispatch(closeAssistant());
    navigate('/ai');
  };

  // Hide FAB on the dedicated /ai page
  if (location.pathname === '/ai') return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`${styles.fab} ${isAssistantOpen ? styles['fab--active'] : ''}`}
        onClick={() => dispatch(toggleAssistant())}
        aria-label={isAssistantOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        <FontAwesomeIcon icon={isAssistantOpen ? faXmark : faRobot} />
        {isAiBusy && !isAssistantOpen && <span className={styles.fab__pulse} />}
      </button>

      {/* Panel */}
      {isAssistantOpen && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.header__icon}>
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div className={styles.header__text}>
              <div className={styles.header__title}>CrMS AI</div>
              <div className={styles.header__status}>
                <span className={`${styles.header__statusDot} ${isAiBusy ? styles['header__statusDot--busy'] : ''}`} />
                {isAiBusy ? `Working on ${activeTasks[0]?.label}...` : 'Ready to help'}
              </div>
            </div>
            <button className={styles.header__close} onClick={handleExpandChat} title="Open full chat">
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
            <button className={styles.header__close} onClick={() => dispatch(closeAssistant())} title="Close">
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button className={`${styles.tab} ${tab === 'chat' ? styles['tab--active'] : ''}`} onClick={() => setTab('chat')}>
              Chat
            </button>
            <button className={`${styles.tab} ${tab === 'activity' ? styles['tab--active'] : ''}`} onClick={() => setTab('activity')}>
              Activity {activityLog.length > 0 && `(${activityLog.length})`}
            </button>
          </div>

          {/* Chat Tab — powered by UnifiedChat */}
          {tab === 'chat' && (
            <UnifiedChat mode="floating" />
          )}

          {/* Activity Log Tab */}
          {tab === 'activity' && (
            <div className={styles.log}>
              {activityLog.length === 0 ? (
                <div className={styles.logEmpty}>
                  <div className={styles.logEmpty__icon}>
                    <FontAwesomeIcon icon={faClockRotateLeft} />
                  </div>
                  <div>No AI activity yet</div>
                  <div className={styles.logEmpty__sub}>Your AI assistant activity will appear here</div>
                </div>
              ) : (
                activityLog.map((entry) => (
                  <div key={entry.id} className={styles.logItem}>
                    <span className={`${styles.logItem__dot} ${styles[`logItem__dot--${entry.status}`]}`} />
                    <span className={styles.logItem__label}>
                      <FontAwesomeIcon icon={faBolt} className={styles.logItem__bolt} />
                      {entry.label}
                    </span>
                    <span className={styles.logItem__time}>{timeAgo(entry.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
