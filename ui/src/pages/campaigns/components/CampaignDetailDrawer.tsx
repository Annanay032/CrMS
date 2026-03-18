import { Drawer, Space, Tag, Row, Col, Typography } from 'antd';
import dayjs from 'dayjs';
import type { Campaign } from '@/types';
import { formatCurrency } from '@/utils/format';
import { STATUS_COLOR } from '../constants';

const { Text, Paragraph } = Typography;

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  onClose: () => void;
}

export function CampaignDetailDrawer({ campaign, onClose }: CampaignDetailDrawerProps) {
  return (
    <Drawer title={campaign?.title} open={!!campaign} onClose={onClose} width={480}>
      {campaign && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Tag color={STATUS_COLOR[campaign.status] ?? 'default'} style={{ fontSize: 14 }}>
            {campaign.status}
          </Tag>
          <Paragraph>{campaign.description}</Paragraph>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Budget</Text>
              <br />
              <Text strong>{formatCurrency(campaign.budget ?? 0)}</Text>
            </Col>
            <Col span={12}>
              <Text type="secondary">Matches</Text>
              <br />
              <Text strong>{campaign._count?.matches ?? '—'}</Text>
            </Col>
          </Row>
          <div>
            <Text type="secondary">Platforms</Text>
            <br />
            <Space wrap style={{ marginTop: 4 }}>
              {campaign.targetPlatforms?.map((p) => <Tag key={p}>{p}</Tag>)}
            </Space>
          </div>
          {(campaign.startDate || campaign.endDate) && (
            <div>
              <Text type="secondary">Duration</Text>
              <br />
              <Text>
                {campaign.startDate ? dayjs(campaign.startDate).format('MMM D, YYYY') : '—'}
                {' → '}
                {campaign.endDate ? dayjs(campaign.endDate).format('MMM D, YYYY') : '—'}
              </Text>
            </div>
          )}
        </Space>
      )}
    </Drawer>
  );
}
