import { Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

const { Text, Paragraph } = Typography;

interface AiInsightCardProps {
  icon: IconDefinition;
  label: string;
  content: string;
  bg?: string;
  border?: string;
  labelColor?: string;
}

export function AiInsightCard({
  icon,
  label,
  content,
  bg = '#eef2ff',
  border = '#e0e7ff',
  labelColor = '#4f46e5',
}: AiInsightCardProps) {
  return (
    <div style={{ padding: 12, borderRadius: 8, background: bg, border: `1px solid ${border}`, marginBottom: 12 }}>
      <Text style={{ fontSize: 12, fontWeight: 500, color: labelColor }}>
        <FontAwesomeIcon icon={icon} /> {label}
      </Text>
      <Paragraph style={{ margin: '4px 0 0' }}>{content}</Paragraph>
    </div>
  );
}
