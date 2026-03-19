import { Controller } from 'react-hook-form';
import { Select, Button, Tooltip, Space, Divider, Switch } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles, faCircleCheck, faComment,
  faCalendarDays, faBrain,
} from '@fortawesome/free-solid-svg-icons';
import { PLATFORM_OPTIONS, POST_TYPE_OPTIONS } from '@/pages/content/constants';
import type { ComposeForm } from './types';
import type { Control } from 'react-hook-form';
import styles from './compose.module.scss';

interface Props {
  control: Control<ComposeForm>;
  platform: string;
  activePanel: string;
  multiPlatform: boolean;
  extraPlatforms: string[];
  agentLoading: boolean;
  intelLoading: boolean;
  showFirstComment: boolean;
  showSchedule: boolean;
  onMultiPlatformChange: (v: boolean) => void;
  onExtraPlatformsChange: (v: string[]) => void;
  onFetchIntelligence: () => void;
  onAiOptimize: () => void;
  onValidate: () => void;
  onToggleFirstComment: () => void;
  onToggleSchedule: () => void;
}

export function ComposeToolbar({
  control, platform, activePanel, multiPlatform, extraPlatforms,
  agentLoading, intelLoading, showFirstComment, showSchedule,
  onMultiPlatformChange, onExtraPlatformsChange,
  onFetchIntelligence, onAiOptimize, onValidate,
  onToggleFirstComment, onToggleSchedule,
}: Props) {
  return (
    <div className={styles.toolbar}>
      <Space size={8}>
        <Controller name="platform" control={control} render={({ field }) => (
          <Select {...field} options={PLATFORM_OPTIONS} size="small" style={{ width: 140 }} popupMatchSelectWidth={false} />
        )} />
        <Controller name="postType" control={control} render={({ field }) => (
          <Select {...field} options={POST_TYPE_OPTIONS} size="small" style={{ width: 120 }} />
        )} />
        <Divider type="vertical" />
        <Tooltip title="Multi-platform">
          <Switch checked={multiPlatform} onChange={onMultiPlatformChange} size="small" />
        </Tooltip>
        {multiPlatform && (
          <Select
            mode="multiple"
            value={extraPlatforms}
            onChange={onExtraPlatformsChange}
            options={PLATFORM_OPTIONS.filter((o) => o.value !== platform)}
            placeholder="Also post to..."
            size="small"
            maxTagCount={2}
            style={{ minWidth: 160 }}
            popupMatchSelectWidth={false}
          />
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
