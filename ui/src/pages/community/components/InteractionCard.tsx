import { Card, Tag, Button, Typography, Avatar } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faPaperPlane, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { Interaction } from '../types';
import { SENTIMENT_COLORS } from '../constants';

const { Text, Paragraph } = Typography;

interface InteractionCardProps {
  interaction: Interaction;
  onMarkResponded?: () => void;
}

export function InteractionCard({ interaction, onMarkResponded }: InteractionCardProps) {
  return (
    <Card size="small" type="inner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Avatar size="small">{interaction.authorName?.charAt(0) ?? '?'}</Avatar>
        <Text strong>{interaction.authorName ?? 'Unknown'}</Text>
        <Tag>{interaction.platform}</Tag>
        <Tag>{interaction.interactionType}</Tag>
        {interaction.sentiment && <Tag color={SENTIMENT_COLORS[interaction.sentiment] ?? 'default'}>{interaction.sentiment}</Tag>}
      </div>
      {interaction.content && <Paragraph>{interaction.content}</Paragraph>}
      {interaction.aiSuggestion && (
        <div style={{ padding: 12, borderRadius: 8, background: '#eef2ff', border: '1px solid #e0e7ff', marginTop: 8 }}>
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
      {onMarkResponded && (
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button size="small" type="link" icon={<FontAwesomeIcon icon={faCheck} />} onClick={onMarkResponded}>
            Mark Responded
          </Button>
        </div>
      )}
    </Card>
  );
}
