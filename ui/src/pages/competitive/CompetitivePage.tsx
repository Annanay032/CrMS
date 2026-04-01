import { useState } from 'react';
import {
  Button, Tag, Modal, Form, Input, Select,
  Empty, Spin, Popconfirm,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBinoculars, faPlus, faTrash, faChartColumn, faArrowUp, faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetCompetitorsQuery,
  useCreateCompetitorMutation,
  useDeleteCompetitorMutation,
  useGetBenchmarkDataQuery,
} from '@/store/endpoints/competitive';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend } from 'recharts';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';
import s from './styles/Competitive.module.scss';

export function CompetitivePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [benchmarkPlatform, setBenchmarkPlatform] = useState('INSTAGRAM');
  const [form, setForm] = useState({ name: '', handles: '', platforms: ['INSTAGRAM'] as string[], notes: '' });
  const [report, setReport] = useState<Record<string, unknown> | null>(null);

  const { data: competitorsData, isLoading } = useGetCompetitorsQuery({ page: 1 });
  const [createCompetitor, { isLoading: creating }] = useCreateCompetitorMutation();
  const [deleteCompetitor] = useDeleteCompetitorMutation();
  const [runAgent, { isLoading: agentLoading }] = useRunAgentMutation();
  const { data: benchmarkData } = useGetBenchmarkDataQuery({ platform: benchmarkPlatform });

  const competitors = competitorsData?.data ?? [];
  const benchmarks = benchmarkData?.data ?? [];

  const handleCreate = async () => {
    if (!form.name) return;
    const handlesObj: Record<string, string> = {};
    form.handles.split(',').map((h) => h.trim()).filter(Boolean).forEach((h) => {
      const [platform, handle] = h.includes(':') ? h.split(':').map((v) => v.trim()) : ['INSTAGRAM', h];
      handlesObj[platform] = handle;
    });
    await createCompetitor({
      name: form.name,
      handles: handlesObj,
      platforms: form.platforms,
      notes: form.notes || undefined,
    }).unwrap();
    setForm({ name: '', handles: '', platforms: ['INSTAGRAM'], notes: '' });
    setShowCreate(false);
  };

  const handleGenerateReport = async () => {
    try {
      const result = await runAgent({
        agentType: 'COMPETITIVE',
        input: {
          action: 'generate_report',
          yourProfile: { name: 'You', platforms: [benchmarkPlatform], stats: {} },
          competitors: benchmarks.map((b) => ({
            name: b.name,
            stats: b.latestSnapshot ?? {},
          })),
          period: 'last 30 days',
        },
      }).unwrap();
      setReport(result.data as Record<string, unknown>);
    } catch { /* swallow */ }
  };

  const benchmarkChartData = benchmarks
    .filter((b) => b.latestSnapshot)
    .map((b) => ({
      name: b.name,
      Followers: b.latestSnapshot!.followers,
      Engagement: +(b.latestSnapshot!.engagementRate * 100).toFixed(1),
      'Posts/Week': b.latestSnapshot!.postFrequency,
    }));

  // Generate gap analysis items from report
  const gapItems: Array<{ title: string; desc: string }> = [];
  if (report?.keyFindings) {
    (report.keyFindings as string[]).forEach((f) => {
      gapItems.push({ title: 'Finding', desc: f });
    });
  }

  const healthScore = (report?.overallHealthScore as number) ?? 0;

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faBinoculars} className={s.page_title__icon} />
          Competitive Intelligence
        </h1>
        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setShowCreate(true)}>
          Add Competitor
        </Button>
      </div>

      {/* Competitors Grid */}
      <div className={s.section}>
        <div className={s.section_header}>
          <span className={s.section_title}>Tracked Competitors</span>
        </div>
        {isLoading ? <Spin /> : competitors.length === 0 ? (
          <div className={s.empty_state}>
            <Empty description="No competitors tracked yet. Add your first competitor to start benchmarking." />
          </div>
        ) : (
          <div className={s.competitors_grid}>
            {competitors.map((c) => {
              const snap = c.snapshots?.[0];
              return (
                <div key={c.id} className={s.competitor_card}>
                  <div className={s.competitor_card__header}>
                    <span className={s.competitor_card__name}>{c.name}</span>
                    <Popconfirm title="Remove competitor?" onConfirm={() => deleteCompetitor(c.id)}>
                      <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                    </Popconfirm>
                  </div>
                  <div className={s.competitor_card__platforms}>
                    {c.platforms.map((p: string) => <Tag key={p}>{p}</Tag>)}
                  </div>
                  {snap && (
                    <div className={s.competitor_card__stats}>
                      <div className={s.competitor_stat}>
                        <div className={s.competitor_stat__value}>{snap.followers?.toLocaleString() ?? '—'}</div>
                        <div className={s.competitor_stat__label}>Followers</div>
                      </div>
                      <div className={s.competitor_stat}>
                        <div className={s.competitor_stat__value}>{((snap.engagementRate ?? 0) * 100).toFixed(1)}%</div>
                        <div className={s.competitor_stat__label}>Engagement</div>
                      </div>
                      <div className={s.competitor_stat}>
                        <div className={s.competitor_stat__value}>{snap.postFrequency ?? '—'}</div>
                        <div className={s.competitor_stat__label}>Posts/Wk</div>
                      </div>
                    </div>
                  )}
                  <div className={s.competitor_card__handles}>
                    {Object.entries(c.handles as Record<string, string>).map(([p, h]) => (
                      <Tag key={p} color="blue">{p}: {h}</Tag>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Benchmark Chart */}
      <div className={s.section}>
        <div className={s.benchmark_card}>
          <div className={s.benchmark_header}>
            <span className={s.benchmark_title}>Benchmark Comparison</span>
            <div className={s.benchmark_controls}>
              <Select value={benchmarkPlatform} onChange={setBenchmarkPlatform} options={PLATFORM_OPTIONS} style={{ width: 150 }} />
              <Button icon={<FontAwesomeIcon icon={faChartColumn} />} onClick={handleGenerateReport} loading={agentLoading}>
                AI Report
              </Button>
            </div>
          </div>
          {benchmarkChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={benchmarkChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="Followers" fill="#6366f1" />
                <Bar dataKey="Engagement" fill="#22c55e" />
                <Bar dataKey="Posts/Week" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No benchmark data. Add competitor snapshots to see comparisons." />
          )}
        </div>
      </div>

      {/* AI Report */}
      {report && (
        <div className={s.section}>
          <div className={s.report_card}>
            <div className={s.report_title}>{(report.title as string) || 'Competitive Report'}</div>

            <div className={`${s.report_health} ${healthScore >= 70 ? s['report_health--good'] : s['report_health--bad']}`}>
              {healthScore}
            </div>

            {report.executiveSummary ? (
              <p className={s.report_summary}>{String(report.executiveSummary)}</p>
            ) : null}

            <div className={s.report_columns}>
              {(report.opportunities as string[])?.length > 0 && (
                <div className={s.report_block}>
                  <div className={s.report_block__title}>
                    <FontAwesomeIcon icon={faArrowUp} style={{ color: '#22c55e' }} /> Opportunities
                  </div>
                  <ul className={s.report_block__list}>
                    {(report.opportunities as string[]).map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              )}
              {(report.threats as string[])?.length > 0 && (
                <div className={s.report_block}>
                  <div className={s.report_block__title}>
                    <FontAwesomeIcon icon={faArrowDown} style={{ color: '#ef4444' }} /> Threats
                  </div>
                  <ul className={s.report_block__list}>
                    {(report.threats as string[]).map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {(report.strategicRecommendations as string[])?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className={s.report_block}>
                  <div className={s.report_block__title}>Strategic Recommendations</div>
                  <ul className={s.report_block__list}>
                    {(report.strategicRecommendations as string[]).map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gap Analysis */}
      {gapItems.length > 0 && (
        <div className={s.gap_section}>
          <div className={s.section_header}>
            <span className={s.section_title}>Gap Analysis</span>
          </div>
          <div className={s.gap_grid}>
            {gapItems.map((g, i) => (
              <div key={i} className={s.gap_card}>
                <div className={s.gap_card__title}>{g.title}</div>
                <p className={s.gap_card__desc}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Competitor Modal */}
      <Modal title="Add Competitor" open={showCreate} onCancel={() => setShowCreate(false)} onOk={handleCreate} confirmLoading={creating}>
        <Form layout="vertical">
          <Form.Item label="Competitor Name">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g. Nike Running" />
          </Form.Item>
          <Form.Item label="Handles (PLATFORM:@handle, comma separated)">
            <Input value={form.handles} onChange={(e) => setForm((p) => ({ ...p, handles: e.target.value }))} placeholder="INSTAGRAM:@nikerunning, TIKTOK:@nikerunning" />
          </Form.Item>
          <Form.Item label="Platforms">
            <Select mode="multiple" value={form.platforms} onChange={(v) => setForm((p) => ({ ...p, platforms: v }))} options={PLATFORM_OPTIONS} />
          </Form.Item>
          <Form.Item label="Notes (optional)">
            <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Internal notes about this competitor" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
