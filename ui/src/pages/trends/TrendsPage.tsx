import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Typography, Spin, Select, Modal, Tag, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowTrendUp, faWandMagicSparkles, faShareNodes, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { useGetTrendsMutation, useRunAgentMutation } from '@/store/endpoints/agents';
import type { Trend } from '@/types';
import { TrendCard } from './components/TrendCard';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

export function TrendsPage() {
  const navigate = useNavigate();
  const [getTrends, { isLoading }] = useGetTrendsMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [summary, setSummary] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM', 'YOUTUBE', 'TIKTOK']);
  const [correlation, setCorrelation] = useState<Record<string, unknown> | null>(null);
  const [draftModal, setDraftModal] = useState<{ open: boolean; trend: Trend | null; draft: Record<string, unknown> | null }>({ open: false, trend: null, draft: null });
  const [scoreModal, setScoreModal] = useState<{ open: boolean; trend: Trend | null; score: Record<string, unknown> | null }>({ open: false, trend: null, score: null });

  const fetchTrends = async () => {
    try {
      const result = await getTrends({ niche: ['general'], platforms }).unwrap();
      setTrends((result.data?.trends as unknown as Trend[]) ?? []);
      setSummary((result.data?.summary as string) ?? '');
    } catch { /* */ }
  };

  useEffect(() => { fetchTrends(); }, []);

  const handleCorrelate = async () => {
    if (trends.length === 0) return;
    try {
      const result = await runAgent({
        agentType: 'TREND_DETECTION',
        input: {
          action: 'correlate',
          trends: trends.map((t) => ({
            title: t.title,
            platform: t.platform,
            category: t.category,
            relevanceScore: t.relevanceScore,
          })),
        },
      }).unwrap();
      setCorrelation(result.data as Record<string, unknown>);
    } catch { /* */ }
  };

  const handleScoreOpportunity = async (trend: Trend) => {
    setScoreModal({ open: true, trend, score: null });
    try {
      const result = await runAgent({
        agentType: 'TREND_DETECTION',
        input: {
          action: 'score_opportunity',
          trend: { title: trend.title, platform: Array.isArray(trend.platform) ? trend.platform[0] : trend.platform, category: trend.category, description: trend.description },
          creatorNiche: ['general'],
          creatorPlatforms: platforms,
          creatorFollowers: 10000,
        },
      }).unwrap();
      setScoreModal((p) => ({ ...p, score: result.data as Record<string, unknown> }));
    } catch { /* */ }
  };

  const handleAutoDraft = async (trend: Trend) => {
    setDraftModal({ open: true, trend, draft: null });
    try {
      const result = await runAgent({
        agentType: 'TREND_DETECTION',
        input: {
          action: 'auto_draft',
          trend: { title: trend.title, category: trend.category, description: trend.description, contentIdea: trend.contentIdea },
          platform: Array.isArray(trend.platform) ? trend.platform[0] : trend.platform,
          creatorNiche: ['general'],
        },
      }).unwrap();
      setDraftModal((p) => ({ ...p, draft: result.data as Record<string, unknown> }));
    } catch { /* */ }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Trending Now</Title>
        <Space>
          <Select
            mode="multiple"
            value={platforms}
            onChange={setPlatforms}
            options={PLATFORM_OPTIONS}
            style={{ minWidth: 250 }}
            maxTagCount="responsive"
            placeholder="Platforms"
          />
          <Button type="primary" icon={<FontAwesomeIcon icon={faArrowTrendUp} />} onClick={fetchTrends} loading={isLoading}>
            Refresh
          </Button>
          <Button
            icon={<FontAwesomeIcon icon={faShareNodes} />}
            onClick={handleCorrelate}
            loading={agentLoading}
            disabled={trends.length === 0}
          >
            Cross-Platform Analysis
          </Button>
        </Space>
      </div>

      {summary && (
        <Card style={{ marginBottom: 24 }}>
          <Paragraph style={{ margin: 0 }}>{summary}</Paragraph>
        </Card>
      )}

      {/* Cross-platform correlation */}
      {correlation && (
        <Card title="Cross-Platform Correlation" style={{ marginBottom: 24 }}>
          {(correlation.crossPlatformTrends as Array<{ title?: string; platformPresence?: string[] }>)?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Trends Spanning Multiple Platforms</Text>
              <div style={{ marginTop: 8 }}>
                {(correlation.crossPlatformTrends as Array<{ title?: string; platformPresence?: string[] }>).map((t, i) => (
                  <Tag key={i} color="purple" style={{ marginBottom: 4 }}>
                    {t.title} — {t.platformPresence?.join(', ')}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          {(correlation.recommendedFocus as Array<{ trend?: string; reason?: string }> | undefined)?.length ? (
            <div>
              <Text strong>Recommended Focus</Text>
              <ul style={{ paddingLeft: 20, margin: '8px 0 0' }}>
                {(correlation.recommendedFocus as Array<{ trend?: string; reason?: string }>).map((r, i) => (
                  <li key={i}><Text strong>{r.trend}</Text>: {r.reason}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {correlation.correlationInsights && (
            <Paragraph type="secondary" style={{ marginTop: 12 }}>{correlation.correlationInsights as string}</Paragraph>
          )}
        </Card>
      )}

      {isLoading && trends.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>
      ) : (
        <Row gutter={[16, 16]}>
          {trends.map((t, i) => (
            <Col key={i} xs={24} md={12}>
              <TrendCard
                trend={t}
                onScore={() => handleScoreOpportunity(t)}
                onDraft={() => handleAutoDraft(t)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Opportunity Score Modal */}
      <Modal
        title={`Opportunity Score: ${scoreModal.trend?.title ?? ''}`}
        open={scoreModal.open}
        onCancel={() => setScoreModal({ open: false, trend: null, score: null })}
        footer={null}
        width={500}
      >
        {!scoreModal.score ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin size="large" /></div>
        ) : (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small"><Text type="secondary">Overall</Text><div style={{ fontSize: 24, fontWeight: 700, color: '#6366f1' }}>{scoreModal.score.overallScore as number}/100</div></Card>
              </Col>
              <Col span={8}>
                <Card size="small"><Text type="secondary">Relevance</Text><div style={{ fontSize: 24, fontWeight: 700 }}>{scoreModal.score.relevanceScore as number}/100</div></Card>
              </Col>
              <Col span={8}>
                <Card size="small"><Text type="secondary">Timing</Text><div style={{ fontSize: 24, fontWeight: 700 }}>{scoreModal.score.timingScore as number}/100</div></Card>
              </Col>
            </Row>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <Tag color={scoreModal.score.recommendation === 'pursue' ? 'green' : scoreModal.score.recommendation === 'consider' ? 'orange' : 'red'}>
                {(scoreModal.score.recommendation as string)?.toUpperCase()}
              </Tag>
              <Tag>Effort: {scoreModal.score.effortLevel as string}</Tag>
              <Tag>ROI: {scoreModal.score.expectedROI as string}</Tag>
              <Tag>Risk: {scoreModal.score.riskLevel as string}</Tag>
            </div>
            <Paragraph>{scoreModal.score.reasoning as string}</Paragraph>
            {scoreModal.score.suggestedApproach && (
              <Card size="small" style={{ background: '#eef2ff' }}>
                <Text strong style={{ color: '#4f46e5' }}>Suggested Approach</Text>
                <Paragraph style={{ margin: '4px 0 0' }}>{scoreModal.score.suggestedApproach as string}</Paragraph>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* Auto Draft Modal */}
      <Modal
        title={`Draft from Trend: ${draftModal.trend?.title ?? ''}`}
        open={draftModal.open}
        onCancel={() => setDraftModal({ open: false, trend: null, draft: null })}
        footer={
          draftModal.draft ? (
            <Button
              type="primary"
              icon={<FontAwesomeIcon icon={faPenToSquare} />}
              onClick={() => navigate('/content/new')}
            >
              Open in Composer
            </Button>
          ) : null
        }
        width={600}
      >
        {!draftModal.draft ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin size="large" /></div>
        ) : (
          <div>
            {draftModal.draft.hook && (
              <Card size="small" style={{ marginBottom: 12, background: '#fef3c7' }}>
                <Text strong>Hook:</Text> {draftModal.draft.hook as string}
              </Card>
            )}
            <Card size="small" style={{ marginBottom: 12 }}>
              <Text strong>Caption</Text>
              <Paragraph style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{draftModal.draft.caption as string}</Paragraph>
            </Card>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {draftModal.draft.postType && <Tag color="blue">{draftModal.draft.postType as string}</Tag>}
              {(draftModal.draft.hashtags as string[])?.map((h, i) => <Tag key={i}>#{h}</Tag>)}
            </div>
            {draftModal.draft.callToAction && <Paragraph><Text strong>CTA:</Text> {draftModal.draft.callToAction as string}</Paragraph>}
            {draftModal.draft.firstComment && <Paragraph><Text strong>First Comment:</Text> {draftModal.draft.firstComment as string}</Paragraph>}
            {draftModal.draft.mediaDescription && (
              <Card size="small" style={{ background: '#eef2ff' }}>
                <Text strong style={{ color: '#4f46e5' }}>Media Direction</Text>
                <Paragraph style={{ margin: '4px 0 0' }}>{draftModal.draft.mediaDescription as string}</Paragraph>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
