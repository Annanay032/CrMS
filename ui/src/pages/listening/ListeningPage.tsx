import { useState } from 'react';
import {
  Card, Button, Row, Col, Typography, Table, Tag, Modal, Form, Input, Select,
  Statistic, Space, Empty, Spin, Alert, Badge, Popconfirm, Switch,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEarListen, faPlus, faTrash, faPen, faChartArea,
  faFaceSmile, faFaceFrown, faFaceMeh, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetListeningQueriesQuery,
  useCreateListeningQueryMutation,
  useUpdateListeningQueryMutation,
  useDeleteListeningQueryMutation,
  useGetMentionsQuery,
  useGetSentimentSummaryQuery,
  useGetSentimentTimelineQuery,
} from '@/store/endpoints/listening';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SENTIMENT_COLORS: Record<string, string> = {
  POSITIVE: '#22c55e',
  NEGATIVE: '#ef4444',
  NEUTRAL: '#94a3b8',
  MIXED: '#f59e0b',
};

const SENTIMENT_ICONS: Record<string, typeof faFaceSmile> = {
  POSITIVE: faFaceSmile,
  NEGATIVE: faFaceFrown,
  NEUTRAL: faFaceMeh,
  MIXED: faTriangleExclamation,
};

export function ListeningPage() {
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', keywords: '', platforms: ['INSTAGRAM'] as string[] });
  const [mentionFilters, setMentionFilters] = useState<{ platform?: string; sentiment?: string }>({});

  const { data: queriesData, isLoading: queriesLoading } = useGetListeningQueriesQuery({ page: 1 });
  const [createQuery, { isLoading: creating }] = useCreateListeningQueryMutation();
  const [updateQuery] = useUpdateListeningQueryMutation();
  const [deleteQuery] = useDeleteListeningQueryMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();

  const queries = queriesData?.data ?? [];
  const selectedQuery = queries.find((q) => q.id === selectedQueryId);

  const { data: mentionsData, isLoading: mentionsLoading } = useGetMentionsQuery(
    { queryId: selectedQueryId!, ...mentionFilters },
    { skip: !selectedQueryId },
  );
  const { data: summaryData } = useGetSentimentSummaryQuery(selectedQueryId!, { skip: !selectedQueryId });
  const { data: timelineData } = useGetSentimentTimelineQuery({ queryId: selectedQueryId! }, { skip: !selectedQueryId });

  const mentions = mentionsData?.data ?? [];
  const summary = summaryData?.data;
  const timeline = (timelineData?.data ?? []).map((s) => ({
    date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Positive: s.positiveCount,
    Negative: s.negativeCount,
    Neutral: s.neutralCount,
  }));

  const [crisisAlert, setCrisisAlert] = useState<{ isCrisis: boolean; severity: string; description: string; recommendedActions: string[] } | null>(null);

  const handleCreate = async () => {
    if (!form.name || !form.keywords) return;
    await createQuery({
      name: form.name,
      keywords: form.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      platforms: form.platforms,
    }).unwrap();
    setForm({ name: '', keywords: '', platforms: ['INSTAGRAM'] });
    setShowCreate(false);
  };

  const handleCrisisCheck = async () => {
    if (!selectedQueryId || !summary) return;
    try {
      const result = await runAgent({
        agentType: 'LISTENING',
        input: {
          action: 'detect_crisis',
          mentions: mentions.slice(0, 20).map((m) => ({ content: m.content, sentiment: m.sentiment, platform: m.platform })),
          normalVolume: Math.max(1, summary.totalMentions / 30),
          currentVolume: summary.last24h,
          keywords: selectedQuery?.keywords ?? [],
        },
      }).unwrap();
      setCrisisAlert(result.data as typeof crisisAlert);
    } catch { /* swallow */ }
  };

  const mentionColumns = [
    {
      title: 'Sentiment',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 100,
      render: (s: string) => (
        <Tag color={SENTIMENT_COLORS[s]} icon={SENTIMENT_ICONS[s] ? <FontAwesomeIcon icon={SENTIMENT_ICONS[s]} /> : undefined}>
          {s}
        </Tag>
      ),
    },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', width: 100, render: (p: string) => <Tag>{p}</Tag> },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 120 },
    { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: 'Reach', dataIndex: 'reach', key: 'reach', width: 80, render: (r: number) => r.toLocaleString() },
    {
      title: 'Detected',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faEarListen} style={{ marginRight: 12, color: '#6366f1' }} />
          Social Listening
        </Title>
        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setShowCreate(true)}>
          New Query
        </Button>
      </Row>

      <Row gutter={24}>
        {/* Query List */}
        <Col xs={24} lg={6}>
          <Card title="Listening Queries" size="small">
            {queriesLoading ? (
              <Spin />
            ) : queries.length === 0 ? (
              <Empty description="No queries yet" />
            ) : (
              queries.map((q) => (
                <Card
                  key={q.id}
                  size="small"
                  hoverable
                  style={{
                    marginBottom: 8,
                    borderColor: selectedQueryId === q.id ? '#6366f1' : undefined,
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedQueryId(q.id)}
                >
                  <Row justify="space-between" align="middle">
                    <div>
                      <Text strong>{q.name}</Text>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {q.keywords.slice(0, 3).join(', ')}
                        {q.keywords.length > 3 && ` +${q.keywords.length - 3}`}
                      </div>
                      <Badge count={q._count?.mentions ?? 0} style={{ backgroundColor: '#6366f1', marginTop: 4 }} overflowCount={9999} />
                    </div>
                    <Space size="small">
                      <Switch
                        size="small"
                        checked={q.isActive}
                        onChange={(checked) => updateQuery({ id: q.id, data: { isActive: checked } })}
                      />
                      <Popconfirm title="Delete this query?" onConfirm={() => deleteQuery(q.id)}>
                        <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                      </Popconfirm>
                    </Space>
                  </Row>
                </Card>
              ))
            )}
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} lg={18}>
          {!selectedQueryId ? (
            <Card>
              <Empty description="Select a listening query to view mentions and sentiment" />
            </Card>
          ) : (
            <>
              {/* Crisis Alert */}
              {crisisAlert && crisisAlert.isCrisis && (
                <Alert
                  type="error"
                  showIcon
                  closable
                  onClose={() => setCrisisAlert(null)}
                  style={{ marginBottom: 16 }}
                  message={`Crisis Detected — Severity: ${crisisAlert.severity}`}
                  description={
                    <div>
                      <Paragraph>{crisisAlert.description}</Paragraph>
                      <Text strong>Recommended Actions:</Text>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
                        {crisisAlert.recommendedActions?.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  }
                />
              )}

              {/* Summary Stats */}
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="Total Mentions" value={summary?.totalMentions ?? 0} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic title="Last 24h" value={summary?.last24h ?? 0} valueStyle={{ color: '#6366f1' }} />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Positive"
                      value={summary?.sentimentCounts?.POSITIVE ?? 0}
                      valueStyle={{ color: '#22c55e' }}
                      prefix={<FontAwesomeIcon icon={faFaceSmile} />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card size="small">
                    <Statistic
                      title="Negative"
                      value={summary?.sentimentCounts?.NEGATIVE ?? 0}
                      valueStyle={{ color: '#ef4444' }}
                      prefix={<FontAwesomeIcon icon={faFaceFrown} />}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Sentiment Timeline */}
              {timeline.length > 0 && (
                <Card title="Sentiment Over Time" size="small" style={{ marginBottom: 16 }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* Mentions Table */}
              <Card
                title="Mentions"
                size="small"
                extra={
                  <Space>
                    <Select
                      allowClear
                      placeholder="Platform"
                      style={{ width: 130 }}
                      options={PLATFORM_OPTIONS}
                      value={mentionFilters.platform}
                      onChange={(v) => setMentionFilters((p) => ({ ...p, platform: v }))}
                    />
                    <Select
                      allowClear
                      placeholder="Sentiment"
                      style={{ width: 130 }}
                      options={['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].map((s) => ({ value: s, label: s }))}
                      value={mentionFilters.sentiment}
                      onChange={(v) => setMentionFilters((p) => ({ ...p, sentiment: v }))}
                    />
                    <Button
                      icon={<FontAwesomeIcon icon={faTriangleExclamation} />}
                      onClick={handleCrisisCheck}
                      loading={agentLoading}
                    >
                      Crisis Check
                    </Button>
                  </Space>
                }
              >
                <Table
                  dataSource={mentions}
                  columns={mentionColumns}
                  rowKey="id"
                  loading={mentionsLoading}
                  size="small"
                  pagination={{ pageSize: 20 }}
                />
              </Card>
            </>
          )}
        </Col>
      </Row>

      {/* Create Query Modal */}
      <Modal
        title="New Listening Query"
        open={showCreate}
        onCancel={() => setShowCreate(false)}
        onOk={handleCreate}
        confirmLoading={creating}
      >
        <Form layout="vertical">
          <Form.Item label="Query Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Brand Mentions"
            />
          </Form.Item>
          <Form.Item label="Keywords (comma separated)">
            <TextArea
              rows={3}
              value={form.keywords}
              onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))}
              placeholder="brand name, product name, @handle"
            />
          </Form.Item>
          <Form.Item label="Platforms">
            <Select
              mode="multiple"
              value={form.platforms}
              onChange={(v) => setForm((p) => ({ ...p, platforms: v }))}
              options={PLATFORM_OPTIONS}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
