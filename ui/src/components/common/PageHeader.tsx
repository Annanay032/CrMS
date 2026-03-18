import { Typography, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { ReactNode } from 'react';

const { Title } = Typography;

interface PageHeaderProps {
  icon?: IconDefinition;
  iconColor?: string;
  title: string;
  extra?: ReactNode;
}

export function PageHeader({ icon, iconColor = '#1677ff', title, extra }: PageHeaderProps) {
  return (
    <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 24 }}>
      <Space>
        {icon && <FontAwesomeIcon icon={icon} size="lg" style={{ color: iconColor }} />}
        <Title level={2} style={{ margin: 0 }}>{title}</Title>
      </Space>
      {extra}
    </Space>
  );
}
