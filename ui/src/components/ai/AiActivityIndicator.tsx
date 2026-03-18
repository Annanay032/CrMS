import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'antd';
import { useAppSelector, useAppDispatch } from '@/hooks/store';
import { openAssistant } from '@/store/ai.slice';
import styles from './AiActivityIndicator.module.scss';

export function AiActivityIndicator() {
  const dispatch = useAppDispatch();
  const { activeTasks, activityLog } = useAppSelector((s) => s.ai);
  const isActive = activeTasks.length > 0;
  const lastEntry = activityLog[0];

  const tooltipText = isActive
    ? `AI is working: ${activeTasks[0]?.label}`
    : lastEntry
      ? `Last: ${lastEntry.label} (${lastEntry.status})`
      : 'AI Assistant';

  return (
    <Tooltip title={tooltipText} placement="bottom">
      <button
        className={`${styles.indicator} ${isActive ? styles['indicator--active'] : ''}`}
        onClick={() => dispatch(openAssistant())}
        aria-label="AI Activity"
      >
        <FontAwesomeIcon icon={faRobot} />
        {isActive && <span className={styles.indicator__pulse} />}
        {isActive && <span className={styles.indicator__label}>AI</span>}
      </button>
    </Tooltip>
  );
}
