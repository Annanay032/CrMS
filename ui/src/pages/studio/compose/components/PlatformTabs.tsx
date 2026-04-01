import { useState } from 'react';
import { Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faArrowUp, faCheck } from '@fortawesome/free-solid-svg-icons';
import { CHANNEL_META } from '@/pages/settings/constants';
import { PLATFORM_OPTIONS } from '../constants';
import type { PlatformEditorState } from '../types';
import { PlatformEditor } from './PlatformEditor';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;

interface Props {
  primaryPlatform: string;
  postType: string;
  extraPlatforms: string[];
  platformStates: Record<string, PlatformEditorState>;
  onPlatformStateChange: (platform: string, state: PlatformEditorState) => void;
}

export function PlatformTabs({
  primaryPlatform, postType, extraPlatforms,
  platformStates, onPlatformStateChange,
}: Props) {
  const allPlatforms = [primaryPlatform, ...extraPlatforms];
  const [activePlatform, setActivePlatform] = useState(primaryPlatform);

  const current = allPlatforms.includes(activePlatform) ? activePlatform : primaryPlatform;

  return (
    <div className={styles.mps}>
      {/* Header */}
      <div className={styles.mps_header}>
        <Text className={styles.mps_title}>Per-Platform Customization</Text>
        <Text type="secondary" className={styles.mps_subtitle}>
          {extraPlatforms.length} platform{extraPlatforms.length !== 1 ? 's' : ''}
        </Text>
      </div>

      {/* Pill-style tab strip */}
      <div className={styles.mps_strip}>
        {allPlatforms.map((p) => {
          const meta = CHANNEL_META[p];
          const label = meta?.label ?? PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p;
          const isPrimary = p === primaryPlatform;
          const isActive = p === current;
          const hasEdits = !isPrimary && !!platformStates[p]?.caption;

          return (
            <button
              key={p}
              className={`${styles.mps_pill} ${isActive ? styles['mps_pill--active'] : ''}`}
              onClick={() => setActivePlatform(p)}
              style={isActive && meta ? { '--pill-color': meta.color, '--pill-bg': meta.bg } as React.CSSProperties : undefined}
            >
              {meta?.icon && (
                <FontAwesomeIcon
                  icon={meta.icon}
                  className={styles.mps_pill_icon}
                  style={isActive ? { color: meta.color } : undefined}
                />
              )}
              <span className={styles.mps_pill_label}>{label}</span>
              {isPrimary && (
                <FontAwesomeIcon icon={faStar} className={styles.mps_pill_star} />
              )}
              {hasEdits && (
                <span className={styles.mps_pill_dot}>
                  <FontAwesomeIcon icon={faCheck} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content area */}
      <div className={styles.mps_body}>
        {current === primaryPlatform ? (
          <div className={styles.mps_primary}>
            <div className={styles.mps_primary_icon}>
              <FontAwesomeIcon icon={faArrowUp} />
            </div>
            <Text className={styles.mps_primary_text}>
              This is your primary platform — edit in the main composer above
            </Text>
            <Text type="secondary" className={styles.mps_primary_hint}>
              Other platforms will use this content by default unless customized
            </Text>
          </div>
        ) : (
          <PlatformEditor
            platform={current}
            postType={postType}
            state={platformStates[current] ?? { caption: '', hashtags: '', mediaUrls: [], videoFile: null }}
            onChange={(s) => onPlatformStateChange(current, s)}
          />
        )}
      </div>
    </div>
  );
}
