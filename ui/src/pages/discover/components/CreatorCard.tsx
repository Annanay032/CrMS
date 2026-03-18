import { Card, Tag, Avatar, Typography } from 'antd';
import { formatNumber } from '@/utils/format';
import type { Creator } from '../types';

const { Text } = Typography;

interface CreatorCardProps {
  creator: Creator;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Avatar style={{ background: '#eef2ff', color: '#4f46e5' }}>{creator.user.name.charAt(0)}</Avatar>
        <div>
          <Text strong>{creator.user.name}</Text>
          {creator.location && <><br /><Text type="secondary" style={{ fontSize: 12 }}>{creator.location}</Text></>}
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
        {creator.niche.map((n) => <Tag key={n}>{n}</Tag>)}
      </div>
      {creator.platformStats.map((s) => (
        <div key={s.platform} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
          <Text strong style={{ fontSize: 12 }}>{s.platform}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatNumber(s.followers)} followers · {s.engagementRate.toFixed(2)}% ER
          </Text>
        </div>
      ))}
    </Card>
  );
}
