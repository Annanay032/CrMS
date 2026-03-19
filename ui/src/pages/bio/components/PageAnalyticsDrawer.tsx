import { Drawer, Card, Row, Col, Statistic, Typography, List, Tag, Space, Empty, Spin } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faMousePointer, faPercent } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import { useGetPageAnalyticsQuery } from '@/store/endpoints/startpages';
import type { StartPage } from '@/types';

const { Text } = Typography;

interface PageAnalyticsDrawerProps {
  page: StartPage | null;
  onClose: () => void;
}

export function PageAnalyticsDrawer({ page, onClose }: PageAnalyticsDrawerProps) {
  const { data, isLoading } = useGetPageAnalyticsQuery(
    { pageId: page?.id ?? '', days: 30 },
    { skip: !page },
  );

  const analytics = data?.data;

  const chartData = analytics?.daily?.map((d) => ({
    date: dayjs(d.date).format('MMM D'),
    views: d.views,
    clicks: d.clicks,
  })) ?? [];

  return (
    <Drawer title={`Analytics — ${page?.title ?? ''}`} open={!!page} onClose={onClose} width={560}>
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : !analytics ? (
        <Empty description="No analytics data yet" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Summary Cards */}
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Views"
                  value={analytics.totalViews}
                  prefix={<FontAwesomeIcon icon={faEye} style={{ marginRight: 4 }} />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Clicks"
                  value={analytics.totalClicks}
                  prefix={<FontAwesomeIcon icon={faMousePointer} style={{ marginRight: 4 }} />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="CTR"
                  value={analytics.ctr}
                  suffix="%"
                  precision={1}
                  prefix={<FontAwesomeIcon icon={faPercent} style={{ marginRight: 4 }} />}
                />
              </Card>
            </Col>
          </Row>

          {/* Chart */}
          {chartData.length > 0 && (
            <Card size="small" title="Daily Traffic (30 days)">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2} name="Views" />
                  <Line type="monotone" dataKey="clicks" stroke="#22c55e" strokeWidth={2} name="Clicks" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Top Links */}
          {analytics.topLinks.length > 0 && (
            <Card size="small" title="Top Links">
              <List
                dataSource={analytics.topLinks}
                renderItem={(item, idx) => (
                  <List.Item extra={<Tag color="blue">{item.clicks} clicks</Tag>}>
                    <Text>
                      <Text type="secondary" style={{ marginRight: 8 }}>#{idx + 1}</Text>
                      {item.title}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Space>
      )}
    </Drawer>
  );
}
