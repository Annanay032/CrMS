import { Card, Row, Col, Tag, Button, Space, Typography } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDollarSign, faUsers, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import type { Campaign } from '@/types';
import { formatCurrency } from '@/utils/format';
import { STATUS_COLOR } from '../constants';

const { Title, Text, Paragraph } = Typography;

interface CampaignCardProps {
  campaign: Campaign;
  onClick: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{ height: '100%' }}
      actions={[
        <Button type="link" icon={<FontAwesomeIcon icon={faEye} />} key="view">
          View Details
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Tag color={STATUS_COLOR[campaign.status] ?? 'default'}>{campaign.status}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {campaign.targetPlatforms?.join(', ')}
          </Text>
        </Space>

        <Title level={5} style={{ margin: 0 }}>{campaign.title}</Title>

        <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ margin: 0 }}>
          {campaign.description}
        </Paragraph>

        <Row gutter={16} style={{ marginTop: 8 }}>
          <Col span={12}>
            <Space size="small">
              <FontAwesomeIcon icon={faDollarSign} style={{ color: '#52c41a' }} />
              <Text strong>{formatCurrency(campaign.budget ?? 0)}</Text>
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>Budget</Text>
          </Col>
          <Col span={12}>
            <Space size="small">
              <FontAwesomeIcon icon={faUsers} style={{ color: '#1677ff' }} />
              <Text strong>{campaign._count?.matches ?? '—'}</Text>
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>Matches</Text>
          </Col>
        </Row>

        {(campaign.startDate || campaign.endDate) && (
          <Space size="small" style={{ marginTop: 4 }}>
            <FontAwesomeIcon icon={faCalendarDays} style={{ color: '#8c8c8c' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {campaign.startDate ? dayjs(campaign.startDate).format('MMM D') : '—'}
              {' → '}
              {campaign.endDate ? dayjs(campaign.endDate).format('MMM D, YYYY') : '—'}
            </Text>
          </Space>
        )}
      </Space>
    </Card>
  );
}
