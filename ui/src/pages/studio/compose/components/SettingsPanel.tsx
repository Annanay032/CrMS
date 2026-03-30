import { Controller } from 'react-hook-form';
import { Typography, Input, Switch, Divider, Button, Alert } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShareNodes, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import type { ComposeForm } from '../types';
import type { Control, UseFormWatch } from 'react-hook-form';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  control: Control<ComposeForm>;
  watch: UseFormWatch<ComposeForm>;
  multiPlatform: boolean;
  extraPlatforms: string[];
  agentLoading: boolean;
  onAdaptAll: () => void;
  showFirstComment: boolean;
  showSchedule: boolean;
}

export function SettingsPanel({
  control, watch,
  multiPlatform, extraPlatforms,
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

      {/* Multi-platform hint */}
      {multiPlatform && extraPlatforms.length > 0 && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text strong style={{ fontSize: 12 }}>
              <FontAwesomeIcon icon={faShareNodes} style={{ marginRight: 6 }} />
              Multi-platform
            </Text>
            <Button size="small" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />} loading={agentLoading} onClick={onAdaptAll}>AI Adapt All</Button>
          </div>
          <Alert
            type="info"
            showIcon
            message="Each platform has its own editor tab. Switch between them to customize caption, media and hashtags."
            style={{ fontSize: 12 }}
          />
        </>
      )}
    </div>
  );
}
