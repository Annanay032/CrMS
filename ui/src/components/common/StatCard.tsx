import { Card, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const { Title, Text } = Typography;

interface StatCardProps {
  icon: IconDefinition;
  label: string;
  value: string | number;
  change?: string;
  iconBg?: string;
  iconColor?: string;
}

export function StatCard({
  icon,
  label,
  value,
  change,
  iconBg = '#eef2ff',
  iconColor = '#4f46e5',
}: StatCardProps) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FontAwesomeIcon icon={icon} style={{ fontSize: 20, color: iconColor }} />
        </div>
        <div>
          <Text type="secondary">{label}</Text>
          <Title level={3} style={{ margin: 0 }}>{value}</Title>
          {change && (
            <Text style={{ color: '#16a34a', fontSize: 12 }}>{change}</Text>
          )}
        </div>
      </div>
    </Card>
  );
}
