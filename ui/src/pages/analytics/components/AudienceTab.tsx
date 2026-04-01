import { useState } from 'react';
import { Card, Row, Col, Typography, Select, Empty, Spin, Button } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGetAudienceInsightsQuery } from '@/store/endpoints/dashboard';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faUsers } from '@fortawesome/free-solid-svg-icons';

const { Text, Title, Paragraph } = Typography;

const PLATFORMS = [
  { value: '', label: 'All Platforms' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'TWITTER', label: 'Twitter' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'PINTEREST', label: 'Pinterest' },
];

export function AudienceTab() {
  const [platform, setPlatform] = useState('');
  const { data, isLoading } = useGetAudienceInsightsQuery({ platform: platform || undefined });
  const [runAgent, { isLoading: aiLoading }] = useRunAgentMutation();
  const [aiAudience, setAiAudience] = useState<Record<string, unknown> | null>(null);

  const insights = (data?.data ?? []) as Array<Record<string, unknown>>;

  const fetchAiAnalysis = async () => {
    try {
      const result = await runAgent({ agentType: 'ANALYTICS', input: { action: 'audience_insights', platform: platform || undefined } }).unwrap();
      setAiAudience(result.data as Record<string, unknown>);
    } catch { /* */ }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  // Aggregate demographics from latest insights
  const latestInsight = insights[0];
  const demographics = latestInsight?.demographics as Record<string, Record<string, number>> | undefined;
  const activeHours = latestInsight?.activeHours as Record<string, number> | undefined;
  const topCountries = latestInsight?.topCountries as Record<string, number> | undefined;
  const interests = latestInsight?.interests as string[] | undefined;

  const ageData = demographics?.ageRanges
    ? Object.entries(demographics.ageRanges).map(([range, pct]) => ({ name: range, value: pct }))
    : [];

  const genderData = demographics?.genders
    ? Object.entries(demographics.genders).map(([gender, pct]) => ({ name: gender, value: pct }))
    : [];

  const hoursData = activeHours
    ? Object.entries(activeHours)
        .map(([hour, value]) => ({ hour: `${hour}:00`, value }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
    : [];

  const countryData = topCountries
    ? Object.entries(topCountries)
        .map(([country, pct]) => ({ name: country, value: pct }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : [];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={5} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faUsers} style={{ marginRight: 8, color: '#4f46e5' }} />
          Audience Demographics
        </Title>
        <Select value={platform} onChange={setPlatform} style={{ width: 180 }} options={PLATFORMS} />
      </div>

      {!latestInsight ? (
        <Empty description="No audience data available yet. Data will populate as your platform connections gather insights." style={{ padding: 48 }} />
      ) : (
        <>
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            {/* Age Distribution */}
            <Col xs={24} lg={12}>
              <Card title="Age Distribution">
                {ageData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={ageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${Number(v)}%`} />
                      <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} name="%" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No age data" />
                )}
              </Card>
            </Col>

            {/* Gender Split */}
            <Col xs={24} lg={12}>
              <Card title="Gender Distribution">
                {genderData.length > 0 ? (
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: 24 }}>
                    {genderData.map((g) => (
                      <div key={g.name} style={{ textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, borderRadius: '50%', background: g.name === 'M' ? '#3b82f6' : g.name === 'F' ? '#ec4899' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                          <Text strong style={{ color: '#fff', fontSize: 20 }}>{g.value}%</Text>
                        </div>
                        <Text>{g.name === 'M' ? 'Male' : g.name === 'F' ? 'Female' : g.name}</Text>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty description="No gender data" />
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            {/* Active Hours */}
            <Col xs={24} lg={14}>
              <Card title="Active Hours (Engagement by Hour)">
                {hoursData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={hoursData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[2, 2, 0, 0]} name="Activity" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="No active hours data" />
                )}
              </Card>
            </Col>

            {/* Top Countries */}
            <Col xs={24} lg={10}>
              <Card title="Top Countries">
                {countryData.length > 0 ? (
                  countryData.map((c, i) => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < countryData.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary" style={{ width: 20 }}>{i + 1}.</Text>
                        <Text strong>{c.name}</Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3 }}>
                          <div style={{ width: `${c.value}%`, height: '100%', background: '#4f46e5', borderRadius: 3 }} />
                        </div>
                        <Text style={{ width: 40, textAlign: 'right' }}>{c.value}%</Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty description="No country data" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Interests */}
          {interests && interests.length > 0 && (
            <Card title="Audience Interests" style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {interests.map((interest) => (
                  <div key={interest} style={{ padding: '6px 14px', background: '#eef2ff', borderRadius: 20, fontSize: 13, color: '#4f46e5' }}>
                    {interest}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* AI Audience Analysis */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5', marginRight: 8 }} />
            AI Audience Analysis
          </Title>
          <Button type="primary" onClick={fetchAiAnalysis} loading={aiLoading}>Analyze Audience</Button>
        </div>
        {aiAudience ? (
          <div>
            {aiAudience.summary ? <Paragraph>{String(aiAudience.summary)}</Paragraph> : null}
            {(aiAudience.keySegments as Array<Record<string, unknown>>)?.map((seg, i) => (
              <div key={i} style={{ padding: 12, background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}>
                <Text strong>{String(seg.name)}</Text> — <Text type="secondary">{Number(seg.percentage)}%</Text>
                <br />
                <Text style={{ fontSize: 13 }}>{String(seg.description)}</Text>
              </div>
            ))}
            {(aiAudience.growthOpportunities as string[])?.map((opp, i) => (
              <div key={i} style={{ padding: '6px 0', fontSize: 14, color: '#475569' }}>• {opp}</div>
            ))}
          </div>
        ) : (
          <Paragraph type="secondary">Get AI-powered analysis of your audience demographics, behavior patterns, and growth opportunities.</Paragraph>
        )}
      </Card>
    </>
  );
}
