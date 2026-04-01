import { useState } from 'react';
import { Card, Row, Col, Typography, Spin, Button, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { useGetContentTypeStatsQuery } from '@/store/endpoints/dashboard';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { CONTENT_TYPE_COLORS } from '../constants';
import type { Period } from '../types';

const { Text, Title, Paragraph } = Typography;

interface ContentPerformanceTabProps {
  period: Period;
  metrics: Record<string, unknown> | undefined;
}

export function ContentPerformanceTab({ period }: ContentPerformanceTabProps) {
  const { data, isLoading } = useGetContentTypeStatsQuery({ period });
  const [runAgent, { isLoading: aiLoading }] = useRunAgentMutation();
  const [aiBreakdown, setAiBreakdown] = useState<Record<string, unknown> | null>(null);

  const stats = data?.data;
  const byType = stats?.byType as Record<string, { count: number; totalReach: number; totalEngagement: number; avgEngRate: number }> | undefined;
  const byPlatform = stats?.byPlatform as Record<string, { count: number; totalReach: number; totalEngagement: number }> | undefined;

  const typeChartData = byType
    ? Object.entries(byType).map(([type, d]) => ({ name: type, posts: d.count, engagement: d.totalEngagement, reach: d.totalReach, engRate: d.avgEngRate }))
    : [];

  const platformChartData = byPlatform
    ? Object.entries(byPlatform).map(([platform, d]) => ({ name: platform, posts: d.count, engagement: d.totalEngagement, reach: d.totalReach }))
    : [];

  const fetchAiBreakdown = async () => {
    try {
      const result = await runAgent({ agentType: 'ANALYTICS', input: { action: 'content_breakdown', period } }).unwrap();
      setAiBreakdown(result.data as Record<string, unknown>);
    } catch { /* */ }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  if (!typeChartData.length) {
    return <Empty description="No published content in this period" style={{ padding: 48 }} />;
  }

  return (
    <>
      {/* Content Type Performance */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Engagement by Content Type">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="engagement" fill="#4f46e5" name="Engagement" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reach" fill="#10b981" name="Reach" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Posts by Content Type">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={typeChartData} dataKey="posts" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                  {typeChartData.map((entry) => (
                    <Cell key={entry.name} fill={CONTENT_TYPE_COLORS[entry.name] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Content Type Stats Table */}
      <Card title="Content Type Details" style={{ marginBottom: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Type', 'Posts', 'Total Reach', 'Total Engagement', 'Avg Eng. Rate'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, color: '#64748b' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {typeChartData.map((row) => (
                <tr key={row.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: CONTENT_TYPE_COLORS[row.name] ?? '#94a3b8' }} />
                      <Text strong>{row.name}</Text>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px' }}><Text>{row.posts}</Text></td>
                  <td style={{ padding: '10px 16px' }}><Text>{row.reach.toLocaleString()}</Text></td>
                  <td style={{ padding: '10px 16px' }}><Text>{row.engagement.toLocaleString()}</Text></td>
                  <td style={{ padding: '10px 16px' }}><Text strong>{row.engRate}%</Text></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Platform Performance */}
      {platformChartData.length > 0 && (
        <Card title="Platform Performance" style={{ marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
              <Tooltip />
              <Bar dataKey="engagement" fill="#6366f1" name="Engagement" radius={[0, 4, 4, 0]} />
              <Bar dataKey="reach" fill="#22d3ee" name="Reach" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* AI Analysis */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5', marginRight: 8 }} />
            AI Content Analysis
          </Title>
          <Button type="primary" onClick={fetchAiBreakdown} loading={aiLoading}>Analyze Content</Button>
        </div>
        {aiBreakdown ? (
          <div>
            {aiBreakdown.bestPerformingType ? <Paragraph><Text strong>Best Performing:</Text> {String(aiBreakdown.bestPerformingType)}</Paragraph> : null}
            {aiBreakdown.worstPerformingType ? <Paragraph><Text strong>Needs Improvement:</Text> {String(aiBreakdown.worstPerformingType)}</Paragraph> : null}
            {(aiBreakdown.insights as string[])?.map((insight, i) => (
              <div key={i} style={{ padding: '8px 12px', background: '#eef2ff', borderRadius: 6, marginBottom: 6, fontSize: 14 }}>{insight}</div>
            ))}
            {(aiBreakdown.recommendations as string[])?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text strong>Recommendations</Text>
                {(aiBreakdown.recommendations as string[]).map((r, i) => (
                  <div key={i} style={{ padding: '6px 0', fontSize: 14, color: '#475569' }}>• {r}</div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <Paragraph type="secondary">Get AI-powered analysis of which content types and platforms perform best.</Paragraph>
        )}
      </Card>
    </>
  );
}
