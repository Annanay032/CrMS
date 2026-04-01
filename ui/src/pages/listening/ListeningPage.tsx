import { useState } from 'react';
import {
  Button, Table, Tag, Modal, Form, Input, Select,
  Empty, Spin, Popconfirm, Switch, Tooltip,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEarListen, faPlus, faTrash,
  faFaceSmile, faFaceFrown, faFaceMeh, faTriangleExclamation,
  faBolt, faUserPlus, faEyeSlash,
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
import { useListSignalsQuery, useUpdateSignalStatusMutation } from '@/store/endpoints/crm';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';
import s from './styles/Listening.module.scss';

const { TextArea } = Input;

const SENTIMENT_COLORS: Record<string, string> = { POSITIVE: 'green', NEGATIVE: 'red', NEUTRAL: 'default', MIXED: 'orange' };
const SENTIMENT_ICONS: Record<string, typeof faFaceSmile> = { POSITIVE: faFaceSmile, NEGATIVE: faFaceFrown, NEUTRAL: faFaceMeh, MIXED: faTriangleExclamation };
const SIGNAL_TYPE_COLORS: Record<string, string> = { LEAD: '#6366f1', RISK: '#ef4444', TREND: '#22c55e', VIRAL_POST: '#f59e0b' };
const INTENT_TABS = ['ALL', 'BUYING', 'COLLAB', 'QUESTION', 'COMPLAINT', 'PRAISE', 'OTHER'] as const;

export function ListeningPage() {
  const navigate = useNavigate();
  const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', keywords: '', platforms: ['INSTAGRAM'] as string[] });
  const [mentionFilters, setMentionFilters] = useState<{ platform?: string; sentiment?: string }>({});
  const [intentFilter, setIntentFilter] = useState<string>('ALL');

  const { data: queriesData, isLoading: queriesLoading } = useGetListeningQueriesQuery({ page: 1 });
  const [createQuery, { isLoading: creating }] = useCreateListeningQueryMutation();
  const [updateQuery] = useUpdateListeningQueryMutation();
  const [deleteQuery] = useDeleteListeningQueryMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();
  const [updateSignalStatus] = useUpdateSignalStatusMutation();

  const queries = queriesData?.data ?? [];
  const selectedQuery = queries.find((q) => q.id === selectedQueryId);

  const { data: mentionsData, isLoading: mentionsLoading } = useGetMentionsQuery(
    { queryId: selectedQueryId!, ...mentionFilters },
    { skip: !selectedQueryId },
  );
  const { data: summaryData } = useGetSentimentSummaryQuery(selectedQueryId!, { skip: !selectedQueryId });
  const { data: timelineData } = useGetSentimentTimelineQuery({ queryId: selectedQueryId! }, { skip: !selectedQueryId });
  const { data: signalsData } = useListSignalsQuery({ limit: 10, status: 'NEW' as const });

  const mentions = mentionsData?.data ?? [];
  const summary = summaryData?.data;
  const signals = signalsData?.data ?? [];
  const timeline = (timelineData?.data ?? []).map((snap) => ({
    date: new Date(snap.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Positive: snap.positiveCount,
    Negative: snap.negativeCount,
    Neutral: snap.neutralCount,
  }));

  const filteredMentions = intentFilter === 'ALL'
    ? mentions
    : mentions.filter((m) => m.intent === intentFilter);

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

  const handleConvertSignal = (signalId: string) => {
    updateSignalStatus({ id: signalId, status: 'ACTIONED' as const });
    navigate('/crm/contacts');
  };

  const mentionColumns = [
    {
      title: 'Sentiment',
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 100,
      render: (val: string) => (
        <Tag color={SENTIMENT_COLORS[val]} icon={SENTIMENT_ICONS[val] ? <FontAwesomeIcon icon={SENTIMENT_ICONS[val]} /> : undefined}>
          {val}
        </Tag>
      ),
    },
    {
      title: 'Intent',
      dataIndex: 'intent',
      key: 'intent',
      width: 100,
      render: (val: string) => val ? <Tag color="purple">{val}</Tag> : <Tag>—</Tag>,
    },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', width: 100, render: (p: string) => <Tag>{p}</Tag> },
    { title: 'Source', dataIndex: 'source', key: 'source', width: 120 },
    { title: 'Content', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: 'Reach', dataIndex: 'reach', key: 'reach', width: 80, render: (r: number) => r?.toLocaleString() ?? '—' },
    {
      title: 'Score',
      dataIndex: 'opportunityScore',
      key: 'score',
      width: 70,
      render: (v: number) => v ? <Tag color="blue">{v}</Tag> : null,
    },
    {
      title: 'Detected',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 100,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faEarListen} className={s.page_title__icon} />
          Social Listening
        </h1>
        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setShowCreate(true)}>
          New Query
        </Button>
      </div>

      <div className={s.layout}>
        {/* Sidebar — Query List */}
        <div className={s.sidebar}>
          <div className={s.sidebar__title}>Listening Queries</div>
          {queriesLoading ? <Spin /> : queries.length === 0 ? (
            <Empty description="No queries yet" />
          ) : queries.map((q) => (
            <div
              key={q.id}
              className={`${s.query_card} ${selectedQueryId === q.id ? s['query_card--active'] : ''}`}
              onClick={() => setSelectedQueryId(q.id)}
            >
              <div className={s.query_card__name}>{q.name}</div>
              <div className={s.query_card__keywords}>{q.keywords.join(', ')}</div>
              <div className={s.query_card__footer}>
                <span className={s.query_card__count}>{q._count?.mentions ?? 0} mentions</span>
                <div className={s.query_card__actions}>
                  <Switch
                    size="small"
                    checked={q.isActive}
                    onChange={(checked) => updateQuery({ id: q.id, data: { isActive: checked } })}
                    onClick={(_checked, e) => e.stopPropagation()}
                  />
                  <Popconfirm title="Delete this query?" onConfirm={() => deleteQuery(q.id)}>
                    <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} onClick={(e) => e.stopPropagation()} />
                  </Popconfirm>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={s.main}>
          {!selectedQueryId ? (
            <div className={s.empty_state}>
              <Empty description="Select a listening query to view mentions and signals" />
            </div>
          ) : (
            <>
              {/* Crisis Alert */}
              {crisisAlert?.isCrisis && (
                <div className={s.crisis_alert}>
                  <div className={s.crisis_alert__header}>
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    Crisis Detected — Severity: {crisisAlert.severity}
                    <Button size="small" type="text" onClick={() => setCrisisAlert(null)} style={{ marginLeft: 'auto' }}>Dismiss</Button>
                  </div>
                  <p className={s.crisis_alert__desc}>{crisisAlert.description}</p>
                  {crisisAlert.recommendedActions?.length > 0 && (
                    <ul className={s.crisis_alert__list}>
                      {crisisAlert.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  )}
                </div>
              )}

              {/* Stats Row */}
              <div className={s.stats_row}>
                <div className={s.stat_card}>
                  <div className={s.stat_card__label}>Total Mentions</div>
                  <div className={s.stat_card__value}>{summary?.totalMentions ?? 0}</div>
                </div>
                <div className={s.stat_card}>
                  <div className={s.stat_card__label}>Last 24h</div>
                  <div className={s.stat_card__value} style={{ color: '#6366f1' }}>{summary?.last24h ?? 0}</div>
                </div>
                <div className={s.stat_card}>
                  <div className={s.stat_card__label}>Positive</div>
                  <div className={s.stat_card__value} style={{ color: '#22c55e' }}>{summary?.sentimentCounts?.POSITIVE ?? 0}</div>
                </div>
                <div className={s.stat_card}>
                  <div className={s.stat_card__label}>Negative</div>
                  <div className={s.stat_card__value} style={{ color: '#ef4444' }}>{summary?.sentimentCounts?.NEGATIVE ?? 0}</div>
                </div>
              </div>

              {/* Signals Section */}
              {signals.length > 0 && (
                <div className={s.signals_section}>
                  <div className={s.signals_title}>
                    <FontAwesomeIcon icon={faBolt} style={{ color: '#f59e0b' }} />
                    Active Signals
                  </div>
                  <div className={s.signals_grid}>
                    {signals.map((sig) => (
                      <div key={sig.id} className={`${s.signal_card} ${s[`signal_card--${sig.type}`]}`}>
                        <div className={s.signal_card__header}>
                          <span className={s.signal_card__type} style={{ color: SIGNAL_TYPE_COLORS[sig.type] }}>{sig.type}</span>
                          {sig.opportunityScore != null && (
                            <span className={s.signal_card__score}>Score: {sig.opportunityScore}</span>
                          )}
                        </div>
                        <div className={s.signal_card__title}>{sig.title}</div>
                        <p className={s.signal_card__desc}>{sig.description}</p>
                        <div className={s.signal_card__actions}>
                          {sig.type === 'LEAD' && (
                            <Button size="small" type="primary" ghost icon={<FontAwesomeIcon icon={faUserPlus} />} onClick={() => handleConvertSignal(sig.id)}>
                              Convert to Contact
                            </Button>
                          )}
                          <Tooltip title="Mark as actioned">
                            <Button size="small" onClick={() => updateSignalStatus({ id: sig.id, status: 'ACTIONED' as const })}>
                              <FontAwesomeIcon icon={faEyeSlash} />
                            </Button>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Chart */}
              {timeline.length > 0 && (
                <div className={s.chart_section}>
                  <div className={s.chart_title}>Sentiment Over Time</div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={timeline}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <ChartTooltip />
                      <Legend />
                      <Area type="monotone" dataKey="Positive" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="Neutral" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="Negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Intent Filter Tabs */}
              <div className={s.intent_bar}>
                {INTENT_TABS.map((t) => (
                  <button
                    key={t}
                    className={`${s.intent_btn} ${intentFilter === t ? s['intent_btn--active'] : ''}`}
                    onClick={() => setIntentFilter(t)}
                  >
                    {t === 'ALL' ? 'All Intents' : t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>

              {/* Mentions Table */}
              <div className={s.mentions_header}>
                <span className={s.mentions_title}>Mentions</span>
                <div className={s.mentions_filters}>
                  <Select allowClear placeholder="Platform" style={{ width: 130 }} options={PLATFORM_OPTIONS}
                    value={mentionFilters.platform} onChange={(v) => setMentionFilters((p) => ({ ...p, platform: v }))} />
                  <Select allowClear placeholder="Sentiment" style={{ width: 130 }}
                    options={['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].map((val) => ({ value: val, label: val }))}
                    value={mentionFilters.sentiment} onChange={(v) => setMentionFilters((p) => ({ ...p, sentiment: v }))} />
                  <Button icon={<FontAwesomeIcon icon={faTriangleExclamation} />} onClick={handleCrisisCheck} loading={agentLoading}>
                    Crisis Check
                  </Button>
                </div>
              </div>
              <Table dataSource={filteredMentions} columns={mentionColumns} rowKey="id" loading={mentionsLoading} size="small" pagination={{ pageSize: 20 }} />
            </>
          )}
        </div>
      </div>

      {/* Create Query Modal */}
      <Modal title="New Listening Query" open={showCreate} onCancel={() => setShowCreate(false)} onOk={handleCreate} confirmLoading={creating}>
        <Form layout="vertical">
          <Form.Item label="Query Name">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Brand Mentions" />
          </Form.Item>
          <Form.Item label="Keywords (comma separated)">
            <TextArea rows={3} value={form.keywords} onChange={(e) => setForm((p) => ({ ...p, keywords: e.target.value }))} placeholder="brand name, product name, @handle" />
          </Form.Item>
          <Form.Item label="Platforms">
            <Select mode="multiple" value={form.platforms} onChange={(v) => setForm((p) => ({ ...p, platforms: v }))} options={PLATFORM_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
