import { Card, Typography } from 'antd';

const { Text } = Typography;

interface EngagementOverviewProps {
  metrics: Record<string, unknown> | undefined;
}

const ENGAGEMENT_KEYS = [
  { name: 'Impressions', key: 'totalImpressions' },
  { name: 'Reach', key: 'totalReach' },
  { name: 'Likes', key: 'totalLikes' },
  { name: 'Comments', key: 'totalComments' },
  { name: 'Shares', key: 'totalShares' },
];

export function EngagementOverview({ metrics }: EngagementOverviewProps) {
  return (
    <Card title="Engagement Overview">
      {ENGAGEMENT_KEYS.map((item) => (
        <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
          <Text>{item.name}</Text>
          <Text strong>{((metrics?.[item.key] as number) ?? 0).toLocaleString()}</Text>
        </div>
      ))}
    </Card>
  );
}
