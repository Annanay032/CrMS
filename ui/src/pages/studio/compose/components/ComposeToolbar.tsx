import { Controller } from 'react-hook-form';
import { Select, Button, Tooltip, Space, Divider, Switch, Tag, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faCircleCheck, faComment,
  faCalendarDays, faBrain, faCopy, faPencil,
} from '@fortawesome/free-solid-svg-icons';
import {
  PLATFORM_OPTIONS, PLATFORM_POST_TYPES, POST_TYPE_OPTIONS,
  getCompatiblePlatforms, POST_TYPE_COMPATIBLE_PLATFORMS,
} from '../constants';
import type { ComposeForm, MediaStrategy } from '../types';
import type { Control } from 'react-hook-form';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;

interface Props {
  control: Control<ComposeForm>;
  platform: string;
  postType: string;
  activePanel: string;
  multiPlatform: boolean;
  extraPlatforms: string[];
  mediaStrategy: MediaStrategy;
  agentLoading: boolean;
  intelLoading: boolean;
  showFirstComment: boolean;
  showSchedule: boolean;
  onMultiPlatformChange: (v: boolean) => void;
  onExtraPlatformsChange: (v: string[]) => void;
  onMediaStrategyChange: (v: MediaStrategy) => void;
  onFetchIntelligence: () => void;
  onAiOptimize: () => void;
  onValidate: () => void;
  onToggleFirstComment: () => void;
  onToggleSchedule: () => void;
}

export function ComposeToolbar({
  control, platform, postType, activePanel, multiPlatform, extraPlatforms,
  mediaStrategy,
  agentLoading, intelLoading, showFirstComment, showSchedule,
  onMultiPlatformChange, onExtraPlatformsChange, onMediaStrategyChange,
  onFetchIntelligence, onAiOptimize, onValidate,
  onToggleFirstComment, onToggleSchedule,
}: Props) {
  const postTypeOptions = PLATFORM_POST_TYPES[platform] || POST_TYPE_OPTIONS;
  const compatibleOptions = getCompatiblePlatforms(postType, platform);
  const incompatibleSelected = extraPlatforms.filter(
    (p) => !(POST_TYPE_COMPATIBLE_PLATFORMS[postType] ?? []).includes(p),
  );

  return (
    <div className={styles.toolbar}>
      <Space size={8} wrap>
        <Controller name="platform" control={control} render={({ field }) => (
          <Select {...field} options={PLATFORM_OPTIONS} size="small" style={{ width: 140 }} popupMatchSelectWidth={false} />
        )} />
        <Controller name="postType" control={control} render={({ field }) => (
          <Select {...field} options={postTypeOptions} size="small" style={{ width: 120 }} />
        )} />
        <Divider type="vertical" />
        <Tooltip title="Multi-platform">
          <Switch checked={multiPlatform} onChange={onMultiPlatformChange} size="small" />
        </Tooltip>
        {multiPlatform && (
          <>
            <Select
              mode="multiple"
              value={extraPlatforms}
              onChange={onExtraPlatformsChange}
              options={compatibleOptions}
              placeholder="Also post to..."
              size="small"
              maxTagCount={2}
              style={{ minWidth: 180 }}
              popupMatchSelectWidth={false}
              notFoundContent={
                <Text type="secondary" style={{ fontSize: 12, padding: 8, display: 'block' }}>
                  No other platforms support "{postTypeOptions.find((o) => o.value === postType)?.label ?? postType}"
                </Text>
              }
              tagRender={({ label, value, closable, onClose }) => (
                <Tag
                  color={incompatibleSelected.includes(value as string) ? 'red' : 'blue'}
                  closable={closable}
                  onClose={onClose}
                  style={{ marginRight: 3 }}
                >
                  {label}
                </Tag>
              )}
            />
            {extraPlatforms.length > 0 && (
              <div className={styles.media_strategy}>
                <Tooltip title="Reuse same media edits across all platforms">
                  <Button
                    size="small"
                    type={mediaStrategy === 'reuse' ? 'primary' : 'default'}
                    icon={<FontAwesomeIcon icon={faCopy} />}
                    onClick={() => onMediaStrategyChange('reuse')}
                  >
                    Same media
                  </Button>
                </Tooltip>
                <Tooltip title="Each platform gets its own editor for caption, media & hashtags">
                  <Button
                    size="small"
                    type={mediaStrategy === 'customize' ? 'primary' : 'default'}
                    icon={<FontAwesomeIcon icon={faPencil} />}
                    onClick={() => onMediaStrategyChange('customize')}
                  >
                    Per-platform
                  </Button>
                </Tooltip>
              </div>
            )}
          </>
        )}
      </Space>
      <Space size={8}>
        <Tooltip title="Intelligence">
          <Button
            size="small"
            type={activePanel === 'intel' ? 'primary' : 'default'}
            ghost={activePanel === 'intel'}
            icon={<FontAwesomeIcon icon={faBrain} />}
            loading={intelLoading}
            onClick={onFetchIntelligence}
          />
        </Tooltip>
        <Tooltip title="AI Optimize">
          <Button size="small" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />} loading={agentLoading} onClick={onAiOptimize} />
        </Tooltip>
        <Tooltip title="Validate">
          <Button size="small" icon={<FontAwesomeIcon icon={faCircleCheck} />} loading={agentLoading} onClick={onValidate} />
        </Tooltip>
        <Divider type="vertical" />
        <Tooltip title="First Comment">
          <Button size="small" type={showFirstComment ? 'primary' : 'default'} ghost={showFirstComment} icon={<FontAwesomeIcon icon={faComment} />} onClick={onToggleFirstComment} />
        </Tooltip>
        <Tooltip title="Schedule">
          <Button size="small" type={showSchedule ? 'primary' : 'default'} ghost={showSchedule} icon={<FontAwesomeIcon icon={faCalendarDays} />} onClick={onToggleSchedule} />
        </Tooltip>
      </Space>
    </div>
  );
}
