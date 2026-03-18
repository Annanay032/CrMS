import { Card, Tag, Typography, Progress, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faClock, faWandMagicSparkles, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import type { Trend } from '@/types';
import { URGENCY_COLORS, REACH_COLORS } from '../constants';

const { Text, Paragraph } = Typography;

interface TrendCardProps {
  trend: Trend;
  onScore?: () => void;
  onDraft?: () => void;
}

export function TrendCard({ trend, onScore, onDraft }: TrendCardProps) {
  const urgencyIcon = trend.urgency === 'act-now' ? faBolt : trend.urgency === 'this-week' ? faClock : undefined;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text strong>{trend.title}</Text>
        <Tag color={URGENCY_COLORS[trend.urgency] ?? 'blue'} icon={urgencyIcon ? <FontAwesomeIcon icon={urgencyIcon} /> : undefined}>
          {trend.urgency}
        </Tag>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        <Tag color="blue">{trend.category}</Tag>
        <Tag>{Array.isArray(trend.platform) ? trend.platform.join(', ') : trend.platform}</Tag>
        <Tag color={REACH_COLORS[trend.estimatedReach] ?? 'default'}>{trend.estimatedReach} reach</Tag>
      </div>

      <Text type="secondary" style={{ fontSize: 12 }}>{trend.description}</Text>

      <div style={{ marginTop: 12, padding: 8, borderRadius: 8, background: '#eef2ff' }}>
        <Text style={{ fontSize: 12, fontWeight: 500, color: '#4f46e5' }}>Content Idea</Text>
        <Paragraph style={{ margin: '4px 0 0', fontSize: 13 }}>{trend.contentIdea}</Paragraph>
      </div>

      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Relevance:</Text>
        <Progress percent={trend.relevanceScore} size="small" style={{ flex: 1, margin: 0 }} />
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <Button size="small" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />} onClick={onScore}>
          Score Opportunity
        </Button>
        <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={onDraft}>
          Create Post
        </Button>
      </div>
    </Card>
  );
}
