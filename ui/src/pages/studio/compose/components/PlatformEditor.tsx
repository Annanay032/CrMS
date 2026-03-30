import { useState } from 'react';
import { Input, Typography, Segmented, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faImage, faHashtag, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { CHANNEL_META } from '@/pages/settings/components/ChannelConnectModal';
import { MediaZone } from './MediaZone';
import { PLATFORM_LIMITS, PLATFORM_OPTIONS, PLATFORM_POST_TYPES } from '../constants';
import type { PlatformEditorState, VideoFileInfo, ThreadEntry } from '../types';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  platform: string;
  postType: string;
  state: PlatformEditorState;
  onChange: (state: PlatformEditorState) => void;
}

export function PlatformEditor({ platform, postType, state, onChange }: Props) {
  const [tab, setTab] = useState<'write' | 'media'>('write');
  const charLimit = PLATFORM_LIMITS[platform] ?? 2200;
  const charCount = state.caption?.length ?? 0;
  const meta = CHANNEL_META[platform];
  const platformLabel = meta?.label ?? PLATFORM_OPTIONS.find((o) => o.value === platform)?.label ?? platform;
  const postTypeLabel = (PLATFORM_POST_TYPES[platform] ?? []).find((o) => o.value === postType)?.label ?? postType;
  const charStatus = charCount > charLimit ? 'over' : charCount > charLimit * 0.9 ? 'near' : 'ok';

  const setMediaUrls: React.Dispatch<React.SetStateAction<string[]>> = (action) => {
    const next = typeof action === 'function' ? action(state.mediaUrls) : action;
    onChange({ ...state, mediaUrls: next });
  };

  const setVideoFile: React.Dispatch<React.SetStateAction<VideoFileInfo | null>> = (action) => {
    const next = typeof action === 'function' ? action(state.videoFile) : action;
    onChange({ ...state, videoFile: next });
  };

  const [threadEntries, setThreadEntries] = useState<ThreadEntry[]>([{ id: '1', text: '' }]);

  return (
    <div className={styles.pe}>
      {/* Platform identity bar */}
      <div
        className={styles.pe_identity}
        style={meta ? { '--pe-color': meta.color, '--pe-bg': meta.bg } as React.CSSProperties : undefined}
      >
        <div className={styles.pe_identity_left}>
          {meta?.icon && (
            <span className={styles.pe_identity_icon} style={{ color: meta.color }}>
              <FontAwesomeIcon icon={meta.icon} />
            </span>
          )}
          <Text strong className={styles.pe_identity_name}>{platformLabel}</Text>
          <span className={styles.pe_identity_type}>{postTypeLabel}</span>
        </div>
        <div className={styles.pe_identity_right}>
          <Tooltip title={`${platformLabel} allows up to ${charLimit} characters`}>
            <span
              className={`${styles.pe_charcount} ${styles[`pe_charcount--${charStatus}`]}`}
            >
              {charCount} / {charLimit}
            </span>
          </Tooltip>
        </div>
      </div>

      {/* Tab toggle */}
      <div className={styles.pe_tabs}>
        <Segmented
          value={tab}
          onChange={(v) => setTab(v as 'write' | 'media')}
          options={[
            { label: 'Write', value: 'write', icon: <FontAwesomeIcon icon={faPenToSquare} style={{ fontSize: 11 }} /> },
            { label: 'Media', value: 'media', icon: <FontAwesomeIcon icon={faImage} style={{ fontSize: 11 }} /> },
          ]}
          size="small"
          block
        />
      </div>

      {/* Tab content */}
      {tab === 'write' ? (
        <div className={styles.pe_write}>
          <TextArea
            value={state.caption}
            onChange={(e) => onChange({ ...state, caption: e.target.value })}
            autoSize={{ minRows: 5, maxRows: 16 }}
            placeholder={`Write ${platformLabel}-specific content...`}
            bordered={false}
            className={styles.pe_textarea}
          />
          <div className={styles.pe_hashtag_row}>
            <FontAwesomeIcon icon={faHashtag} className={styles.pe_hashtag_icon} />
            <Input
              value={state.hashtags}
              onChange={(e) => onChange({ ...state, hashtags: e.target.value })}
              placeholder="hashtags, comma separated..."
              bordered={false}
              className={styles.pe_hashtag_input}
            />
          </div>
          {!state.caption && (
            <div className={styles.pe_hint}>
              <FontAwesomeIcon icon={faCircleInfo} />
              <Text type="secondary" style={{ fontSize: 11 }}>
                Leave empty to reuse the primary platform's content
              </Text>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.pe_media}>
          <MediaZone
            postType={postType}
            platform={platform}
            charLimit={charLimit}
            mediaUrls={state.mediaUrls}
            onSetMediaUrls={setMediaUrls}
            videoFile={state.videoFile}
            onSetVideoFile={setVideoFile}
            thumbnailUrl={state.thumbnailUrl}
            onSetThumbnailUrl={(url) => onChange({ ...state, thumbnailUrl: url })}
            onSetFormThumbnail={(url) => onChange({ ...state, thumbnailUrl: url })}
            threadEntries={threadEntries}
            onSetThreadEntries={setThreadEntries}
            onCrop={() => {}}
          />
        </div>
      )}
    </div>
  );
}
