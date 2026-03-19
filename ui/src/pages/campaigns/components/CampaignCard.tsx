import { Card, Row, Col, Tag, Button, Space, Typography, Progress } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDollarSign, faClipboardList, faCalendarDays } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import type { Campaign } from '@/types';
import { formatCurrency } from '@/utils/format';
import { STATUS_COLOR, STAGE_COLOR, STAGE_LABELS } from '../constants';

const { Title, Text, Paragraph } = Typography;

interface CampaignCardProps {
  campaign: Campaign;
  onClick: () => void;
}

export function CampaignCard({ campaign, onClick }: CampaignCardProps) {
  const budgetPct = campaign.budget ? Math.min(100, Math.round(((campaign.spent ?? 0) / campaign.budget) * 100)) : 0;

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
          <Space size={4}>
            <Tag color={STATUS_COLOR[campaign.status] ?? 'default'}>{campaign.status}</Tag>
            {campaign.stage && <Tag color={STAGE_COLOR[campaign.stage] ?? 'default'}>{STAGE_LABELS[campaign.stage] ?? campaign.stage}</Tag>}
          </Space>
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
              <Text strong>{formatCurrency(campaign.spent ?? 0)} / {formatCurrency(campaign.budget ?? 0)}</Text>
            </Space>
            <Progress percent={budgetPct} size="small" showInfo={false} strokeColor={budgetPct > 90 ? '#ff4d4f' : '#52c41a'} />
          </Col>
          <Col span={12}>
            <Space size="small">
              <FontAwesomeIcon icon={faClipboardList} style={{ color: '#1677ff' }} />
              <Text strong>{campaign._count?.deliverables ?? 0} deliverables</Text>
            </Space>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>{campaign._count?.matches ?? 0} matches</Text>
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
