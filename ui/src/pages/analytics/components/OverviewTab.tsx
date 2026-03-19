import { Button, Row, Col, Card, Typography, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faArrowUp, faArrowDown, faMinus } from '@fortawesome/free-solid-svg-icons';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MetricsSummary } from './MetricsSummary';
import { EngagementOverview } from './EngagementOverview';
import { PlatformBreakdownCard } from './PlatformBreakdownCard';
import { AiInsightsPanel } from './AiInsightsPanel';

const { Text, Title, Paragraph } = Typography;

interface OverviewTabProps {
  metrics: Record<string, unknown> | undefined;
  aiInsights: Record<string, unknown> | null;
  onFetchInsights: () => void;
  aiLoading: boolean;
}

export function OverviewTab({ metrics, aiInsights, onFetchInsights, aiLoading }: OverviewTabProps) {
  const snapshots = (metrics?.snapshots as Array<Record<string, unknown>>) ?? [];
  const topPosts = (metrics?.topPosts as Array<Record<string, unknown>>) ?? [];
  const trend = aiInsights?.trend as string ?? (metrics?.avgEngagementRate ? 'stable' : '-');

  const trendIcon = trend === 'up' ? faArrowUp : trend === 'down' ? faArrowDown : faMinus;
  const trendColor = trend === 'up' ? '#16a34a' : trend === 'down' ? '#dc2626' : '#64748b';

  return (
    <>
      <MetricsSummary metrics={metrics as Record<string, unknown>} trend={trend} />

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <EngagementOverview metrics={metrics as Record<string, unknown>} />
        </Col>
        <Col xs={24} lg={12}>
          <PlatformBreakdownCard breakdown={(metrics?.platformBreakdown as Array<Record<string, unknown>>) ?? []} />
        </Col>
      </Row>

      {/* Growth Timeline Chart */}
      {snapshots.length > 1 && (
        <Card title="Growth Timeline" style={{ marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={snapshots}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="totalFollowers" stroke="#4f46e5" strokeWidth={2} dot={false} name="Followers" />
              <Line type="monotone" dataKey="totalEngagement" stroke="#10b981" strokeWidth={2} dot={false} name="Engagement" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Top Performing Posts */}
      {topPosts.length > 0 && (
        <Card
          title="Top Performing Posts"
          style={{ marginBottom: 24 }}
          extra={
            <Tag color={trendColor}>
              <FontAwesomeIcon icon={trendIcon} style={{ marginRight: 4 }} />
              {trend.charAt(0).toUpperCase() + trend.slice(1)}
            </Tag>
          }
        >
          {topPosts.map((p) => {
            const analytics = p.analytics as Record<string, number> | undefined;
            return (
              <div key={p.id as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ flex: 1 }}>
                  <Text strong>{(p.caption as string) || 'Untitled'}</Text>
                  <br />
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Tag color="blue">{p.platform as string}</Tag>
                    {p.postType && <Tag>{p.postType as string}</Tag>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, textAlign: 'right' }}>
                  <div>
                    <Text strong>{(analytics?.likes ?? 0).toLocaleString()}</Text>
                    <br /><Text type="secondary" style={{ fontSize: 11 }}>likes</Text>
                  </div>
                  <div>
                    <Text strong>{(analytics?.comments ?? 0).toLocaleString()}</Text>
                    <br /><Text type="secondary" style={{ fontSize: 11 }}>comments</Text>
                  </div>
                  <div>
                    <Text strong>{(analytics?.shares ?? 0).toLocaleString()}</Text>
                    <br /><Text type="secondary" style={{ fontSize: 11 }}>shares</Text>
                  </div>
                  <div>
                    <Text strong>{(analytics?.reach ?? 0).toLocaleString()}</Text>
                    <br /><Text type="secondary" style={{ fontSize: 11 }}>reach</Text>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {/* AI Insights */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5', marginRight: 8 }} />
            AI-Powered Insights
          </Title>
          <Button type="primary" onClick={onFetchInsights} loading={aiLoading}>
            {aiInsights ? 'Refresh Insights' : 'Generate Insights'}
          </Button>
        </div>
        {!aiInsights && !aiLoading && (
          <Paragraph type="secondary">Click "Generate Insights" to get AI-powered analysis of your performance data, including recommendations and trend predictions.</Paragraph>
        )}
        {aiInsights && <AiInsightsPanel insights={aiInsights} />}
      </Card>
    </>
  );
}
