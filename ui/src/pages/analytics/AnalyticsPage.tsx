import { useState } from 'react';
import { Button, Row, Col, Spin, Card, Typography } from 'antd';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { useGetAnalyticsDashboardQuery } from '@/store/endpoints/dashboard';
import { useGetAnalyticsInsightsMutation } from '@/store/endpoints/agents';
import { PageHeader } from '@/components/common';
import type { Period } from './types';
import { PERIODS } from './constants';
import { MetricsSummary } from './components/MetricsSummary';
import { EngagementOverview } from './components/EngagementOverview';
import { PlatformBreakdownCard } from './components/PlatformBreakdownCard';
import { AiInsightsPanel } from './components/AiInsightsPanel';

const { Text } = Typography;

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('week');
  const { data, isLoading } = useGetAnalyticsDashboardQuery({ period });
  const [getInsights, { isLoading: aiLoading }] = useGetAnalyticsInsightsMutation();
  const [aiInsights, setAiInsights] = useState<Record<string, unknown> | null>(null);

  const metrics = data?.data;

  const fetchAiInsights = async () => {
    try {
      const result = await getInsights({ period }).unwrap();
      setAiInsights(result.data);
    } catch { /* */ }
  };

  const snapshots = (metrics?.snapshots as Array<Record<string, unknown>>) ?? [];
  const topPosts = (metrics?.topPosts as Array<Record<string, unknown>>) ?? [];

  return (
    <div>
      <PageHeader
        icon={faChartLine}
        title="Analytics"
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button.Group>
              {PERIODS.map((p) => (
                <Button key={p} type={period === p ? 'primary' : 'default'} onClick={() => setPeriod(p)}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </Button.Group>
            <Button onClick={fetchAiInsights} loading={aiLoading}>AI Insights</Button>
          </div>
        }
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <>
          <MetricsSummary metrics={metrics as Record<string, unknown>} trend={aiInsights?.trend as string ?? (metrics?.avgEngagementRate ? 'stable' : '-')} />

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={12}>
              <EngagementOverview metrics={metrics as Record<string, unknown>} />
            </Col>
            <Col xs={24} lg={12}>
              <PlatformBreakdownCard breakdown={(metrics?.platformBreakdown as Array<Record<string, unknown>>) ?? []} />
            </Col>
          </Row>

          {snapshots.length > 0 && (
            <Card title="Growth Timeline" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}>
                {snapshots.map((s) => (
                  <div
                    key={s.date as string}
                    style={{
                      minWidth: 100,
                      padding: 12,
                      background: '#f8fafc',
                      borderRadius: 8,
                      textAlign: 'center',
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>{s.date as string}</Text>
                    <br />
                    <Text strong>{((s.totalFollowers as number) ?? 0).toLocaleString()}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11, color: (s.growthRate as number) > 0 ? '#16a34a' : '#64748b' }}>
                      {(s.growthRate as number) > 0 ? '+' : ''}{((s.growthRate as number) ?? 0).toFixed(2)}%
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {topPosts.length > 0 && (
            <Card title="Top Performing Posts" style={{ marginBottom: 24 }}>
              {topPosts.map((p) => {
                const analytics = p.analytics as Record<string, number> | undefined;
                return (
                  <div key={p.id as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <Text strong>{(p.caption as string) || 'Untitled'}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{p.platform as string}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Text>{(analytics?.likes ?? 0).toLocaleString()} likes</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{(analytics?.comments ?? 0).toLocaleString()} comments</Text>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {aiInsights && <AiInsightsPanel insights={aiInsights} />}
        </>
      )}
    </div>
  );
}
