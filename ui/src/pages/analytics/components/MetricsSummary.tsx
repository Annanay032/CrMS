import { Card, Row, Col, Typography } from 'antd';

const { Title, Text } = Typography;

interface MetricsSummaryProps {
  metrics: Record<string, unknown> | undefined;
  trend: string;
}

export function MetricsSummary({ metrics, trend }: MetricsSummaryProps) {
  const items = [
    { label: 'Posts', value: (metrics?.postsCount as number) ?? '-' },
    { label: 'Avg Engagement', value: metrics?.avgEngagementRate ? `${(metrics.avgEngagementRate as number).toFixed(1)}%` : '-' },
    { label: 'Follower Growth', value: metrics?.followerGrowth !== undefined ? `+${metrics.followerGrowth}` : '-' },
    { label: 'Trend', value: trend ?? '-' },
  ];

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {items.map((m) => (
        <Col key={m.label} xs={24} sm={12} md={6}>
          <Card>
            <Text type="secondary">{m.label}</Text>
            <Title level={3} style={{ margin: 0 }}>{String(m.value)}</Title>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
