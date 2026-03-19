import { Controller } from 'react-hook-form';
import { Typography, Input, Switch, Divider, Tabs, Badge, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';
import type { ComposeForm } from './types';
import type { Control, UseFormWatch } from 'react-hook-form';
import styles from './compose.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  control: Control<ComposeForm>;
  watch: UseFormWatch<ComposeForm>;
  // Multi-platform
  multiPlatform: boolean;
  extraPlatforms: string[];
  platformOverrides: Record<string, { caption?: string; hashtags?: string[] }>;
  onSetPlatformOverrides: React.Dispatch<React.SetStateAction<Record<string, { caption?: string; hashtags?: string[] }>>>;
  agentLoading: boolean;
  onAdaptAll: () => void;
  // Schedule
  showFirstComment: boolean;
  showSchedule: boolean;
}

export function SettingsPanel({
  control, watch,
  multiPlatform, extraPlatforms, platformOverrides, onSetPlatformOverrides,
  agentLoading, onAdaptAll,
  showFirstComment, showSchedule,
}: Props) {
  return (
    <div className={styles.settings}>
      {/* Recurring */}
      <div className={styles.settings_item}>
        <Text type="secondary" style={{ fontSize: 12 }}>Recurring Post</Text>
        <Controller name="isRecurring" control={control} render={({ field }) => (
          <Switch checked={field.value} onChange={field.onChange} size="small" />
        )} />
      </div>
      {watch('isRecurring') && (
        <div className={styles.settings_item}>
          <Text type="secondary" style={{ fontSize: 12 }}>Recurrence Rule</Text>
          <Controller name="recurrenceRule" control={control} render={({ field }) => (
            <Input {...field} placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR" size="small" />
          )} />
        </div>
      )}

      {/* First comment */}
      {showFirstComment && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>First Comment</Text>
          <Controller name="firstComment" control={control} render={({ field }) => (
            <TextArea {...field} rows={2} placeholder="Optional first comment..." />
          )} />
        </>
      )}

      {/* Schedule */}
      {showSchedule && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>Schedule</Text>
          <Controller name="scheduledAt" control={control} render={({ field }) => (
            <Input {...field} type="datetime-local" />
          )} />
        </>
      )}

      {/* Multi-platform overrides */}
      {multiPlatform && extraPlatforms.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong style={{ fontSize: 12 }}>
              <FontAwesomeIcon icon={faShareNodes} style={{ marginRight: 6 }} />
              Platform Overrides
            </Text>
            <Button size="small" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />} loading={agentLoading} onClick={onAdaptAll}>AI Adapt All</Button>
          </div>
          <Tabs
            size="small"
            items={extraPlatforms.map((p) => ({
              key: p,
              label: (
                <Badge dot={!!platformOverrides[p]?.caption} offset={[6, 0]}>
                  {PLATFORM_OPTIONS.find((o) => o.value === p)?.label ?? p}
                </Badge>
              ),
              children: (
                <div>
                  <TextArea rows={3} value={platformOverrides[p]?.caption ?? ''}
                    onChange={(e) => onSetPlatformOverrides((prev) => ({ ...prev, [p]: { ...prev[p], caption: e.target.value } }))}
                    placeholder="Leave empty to use primary caption" style={{ marginBottom: 8 }}
                  />
                  <Input value={platformOverrides[p]?.hashtags?.join(', ') ?? ''}
                    onChange={(e) => onSetPlatformOverrides((prev) => ({ ...prev, [p]: { ...prev[p], hashtags: e.target.value.split(',').map((h) => h.trim()).filter(Boolean) } }))}
                    placeholder="Hashtags override (comma separated)" size="small"
                  />
                </div>
              ),
            }))}
          />
        </>
      )}
    </div>
  );
}
