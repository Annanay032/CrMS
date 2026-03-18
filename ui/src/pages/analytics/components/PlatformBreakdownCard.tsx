import { Card, Typography } from 'antd';

const { Text } = Typography;

interface PlatformBreakdownCardProps {
  breakdown: Array<Record<string, unknown>>;
}

export function PlatformBreakdownCard({ breakdown }: PlatformBreakdownCardProps) {
  return (
    <Card title="Platform Breakdown">
      {breakdown.map((p) => (
        <div
          key={p.platform as string}
          style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 8, background: '#f8fafc', marginBottom: 8 }}
        >
          <div>
            <Text strong>{p.platform as string}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {(p.followers as number)?.toLocaleString()} followers
            </Text>
          </div>
          <Text strong>{(p.engagementRate as number)?.toFixed(2)}%</Text>
        </div>
      ))}
    </Card>
  );
}
