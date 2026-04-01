import { Card, Tag, Button, Typography, Avatar, Checkbox, Select, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane, faPen, faCheck, faCircle, faFlag } from '@fortawesome/free-solid-svg-icons';
import type { Interaction } from '../types';
import { SENTIMENT_COLORS, CASE_STATUS_COLORS, PRIORITY_COLORS, PLATFORM_COLORS } from '../constants';
import { useUpdateCaseMutation, useMarkReadMutation } from '@/store/endpoints/community';

const { Text, Paragraph } = Typography;

interface InteractionCardProps {
  interaction: Interaction;
  selected?: boolean;
  onToggleSelect?: () => void;
  onMarkResponded?: () => void;
}

export function InteractionCard({ interaction, selected, onToggleSelect, onMarkResponded }: InteractionCardProps) {
  const [updateCase] = useUpdateCaseMutation();
  const [markRead] = useMarkReadMutation();

  const handlePriorityChange = (value: string) => {
    updateCase({ id: interaction.id, priority: value });
  };

  const handleStatusChange = (value: string) => {
    updateCase({ id: interaction.id, caseStatus: value });
  };

  const handleClick = () => {
    if (!interaction.isRead) {
      markRead(interaction.id);
    }
  };

  return (
    <Card
      size="small"
      type="inner"
      onClick={handleClick}
      style={{
        borderLeft: interaction.priority === 'HIGH' ? '3px solid #ff4d4f' : interaction.priority === 'MEDIUM' ? '3px solid #faad14' : undefined,
        opacity: interaction.isRead ? 1 : undefined,
        background: interaction.isRead ? undefined : '#fafbff',
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        {onToggleSelect && (
          <Checkbox
            checked={selected}
            onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: 4 }}
          />
        )}
        <div style={{ flex: 1 }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            {!interaction.isRead && (
              <Tooltip title="Unread">
                <FontAwesomeIcon icon={faCircle} style={{ color: '#1677ff', fontSize: 8 }} />
              </Tooltip>
            )}
            <Avatar size="small">{interaction.authorName?.charAt(0) ?? '?'}</Avatar>
            <Text strong>{interaction.authorName ?? 'Unknown'}</Text>
            <Tag color={PLATFORM_COLORS[interaction.platform] ?? 'default'}>{interaction.platform}</Tag>
            <Tag>{interaction.interactionType}</Tag>
            {interaction.sentiment && <Tag color={SENTIMENT_COLORS[interaction.sentiment] ?? 'default'}>{interaction.sentiment}</Tag>}
            {interaction.caseStatus && <Tag color={CASE_STATUS_COLORS[interaction.caseStatus] ?? 'default'}>{interaction.caseStatus.replace('_', ' ')}</Tag>}
            {interaction.priority && <Tag color={PRIORITY_COLORS[interaction.priority] ?? 'default'}><FontAwesomeIcon icon={faFlag} /> {interaction.priority}</Tag>}
            {interaction.assignee && (
              <Tag>Assigned: {interaction.assignee.name}</Tag>
            )}
            <div style={{ flex: 1 }} />
            {interaction.createdAt && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(interaction.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </div>

          {/* Content */}
          {interaction.content && <Paragraph style={{ marginBottom: 8 }}>{interaction.content}</Paragraph>}

          {/* Tags */}
          {interaction.tags?.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              {interaction.tags.map((t) => <Tag key={t} style={{ fontSize: 11 }}>{t}</Tag>)}
            </div>
          )}

          {/* AI suggestion */}
          {interaction.aiSuggestion && (
            <div style={{ padding: 12, borderRadius: 8, background: '#eef2ff', border: '1px solid #e0e7ff', marginBottom: 8 }}>
              <Text style={{ fontSize: 12, fontWeight: 500, color: '#4f46e5' }}>
                <FontAwesomeIcon icon={faRobot} /> AI Suggested Reply
              </Text>
              <Paragraph style={{ margin: '4px 0 8px' }}>{interaction.aiSuggestion}</Paragraph>
              <Button.Group size="small">
                <Button icon={<FontAwesomeIcon icon={faPaperPlane} />}>Send</Button>
                <Button icon={<FontAwesomeIcon icon={faPen} />}>Edit</Button>
              </Button.Group>
            </div>
          )}

          {/* Actions row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              placeholder="Status"
              value={interaction.caseStatus}
              onChange={handleStatusChange}
              style={{ width: 120 }}
              options={[
                { label: 'Open', value: 'OPEN' },
                { label: 'In Progress', value: 'IN_PROGRESS' },
                { label: 'Resolved', value: 'RESOLVED' },
              ]}
            />
            <Select
              size="small"
              placeholder="Priority"
              value={interaction.priority}
              onChange={handlePriorityChange}
              style={{ width: 110 }}
              options={[
                { label: 'High', value: 'HIGH' },
                { label: 'Medium', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
              ]}
            />
            <div style={{ flex: 1 }} />
            {onMarkResponded && !interaction.respondedAt && (
              <Button size="small" type="link" icon={<FontAwesomeIcon icon={faCheck} />} onClick={onMarkResponded}>
                Mark Responded
              </Button>
            )}
            {interaction.respondedAt && (
              <Text type="success" style={{ fontSize: 12 }}>
                <FontAwesomeIcon icon={faCheck} /> Responded
              </Text>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
