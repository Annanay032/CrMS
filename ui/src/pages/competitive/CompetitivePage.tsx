import { useState } from 'react';
import {
  Card, Button, Row, Col, Typography, Tag, Modal, Form, Input, Select,
  Statistic, Space, Empty, Spin, Table, Popconfirm, Descriptions, Tooltip,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBinoculars, faPlus, faTrash, faChartColumn, faArrowUp, faArrowDown, faMinus,
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

const { Title, Text } = Typography;

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
      const [platform, handle] = h.includes(':') ? h.split(':').map((s) => s.trim()) : ['INSTAGRAM', h];
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

  const competitorColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
    {
      title: 'Platforms',
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms: string[]) => platforms.map((p) => <Tag key={p}>{p}</Tag>),
    },
    {
      title: 'Handles',
      dataIndex: 'handles',
      key: 'handles',
      render: (handles: Record<string, string>) =>
        Object.entries(handles).map(([p, h]) => (
          <Tag key={p} color="blue">{p}: {h}</Tag>
        )),
    },
    {
      title: 'Snapshots',
      dataIndex: '_count',
      key: 'snapshots',
      width: 100,
      render: (c: { snapshots: number } | undefined) => c?.snapshots ?? 0,
    },
    {
      title: 'Latest',
      dataIndex: 'snapshots',
      key: 'latest',
      render: (snaps: Array<{ followers: number; engagementRate: number }>) => {
        if (!snaps?.length) return <Text type="secondary">No data</Text>;
        const s = snaps[0];
        return (
          <Space>
            <Tooltip title="Followers"><Text>{s.followers.toLocaleString()}</Text></Tooltip>
            <Tooltip title="Engagement Rate"><Tag color="green">{(s.engagementRate * 100).toFixed(1)}%</Tag></Tooltip>
          </Space>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: { id: string }) => (
        <Popconfirm title="Remove competitor?" onConfirm={() => deleteCompetitor(record.id)}>
          <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faBinoculars} style={{ marginRight: 12, color: '#6366f1' }} />
          Competitive Intelligence
        </Title>
        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setShowCreate(true)}>
          Add Competitor
        </Button>
      </Row>

      {/* Competitors Table */}
      <Card title="Tracked Competitors" style={{ marginBottom: 24 }}>
        {isLoading ? (
          <Spin />
        ) : competitors.length === 0 ? (
          <Empty description="No competitors tracked yet. Add your first competitor to start benchmarking." />
        ) : (
          <Table dataSource={competitors} columns={competitorColumns} rowKey="id" size="small" pagination={false} />
        )}
      </Card>

      {/* Benchmark Section */}
      <Card
        title="Benchmark Comparison"
        extra={
          <Space>
            <Select
              value={benchmarkPlatform}
              onChange={setBenchmarkPlatform}
              options={PLATFORM_OPTIONS}
              style={{ width: 150 }}
            />
            <Button
              icon={<FontAwesomeIcon icon={faChartColumn} />}
              onClick={handleGenerateReport}
              loading={agentLoading}
            >
              AI Report
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
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
          <Empty description="No benchmark data available. Add competitor snapshot data to see comparisons." />
        )}
      </Card>

      {/* AI Report */}
      {report && (
        <Card title={report.title as string || 'Competitive Report'} style={{ marginBottom: 24 }}>
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Health Score" span={2}>
              <Statistic
                value={report.overallHealthScore as number ?? 0}
                suffix="/100"
                valueStyle={{ color: (report.overallHealthScore as number ?? 0) >= 70 ? '#22c55e' : '#ef4444' }}
              />
            </Descriptions.Item>
          </Descriptions>

          <Text strong>Executive Summary</Text>
          <p>{report.executiveSummary as string}</p>

          {(report.keyFindings as string[])?.length > 0 && (
            <>
              <Text strong>Key Findings</Text>
              <ul style={{ paddingLeft: 20 }}>
                {(report.keyFindings as string[]).map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </>
          )}

          {(report.strategicRecommendations as string[])?.length > 0 && (
            <>
              <Text strong>Strategic Recommendations</Text>
              <ul style={{ paddingLeft: 20 }}>
                {(report.strategicRecommendations as string[]).map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </>
          )}

          <Row gutter={16} style={{ marginTop: 16 }}>
            {(report.opportunities as string[])?.length > 0 && (
              <Col span={12}>
                <Card size="small" title={<><FontAwesomeIcon icon={faArrowUp} style={{ color: '#22c55e', marginRight: 8 }} />Opportunities</>}>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {(report.opportunities as string[]).map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </Card>
              </Col>
            )}
            {(report.threats as string[])?.length > 0 && (
              <Col span={12}>
                <Card size="small" title={<><FontAwesomeIcon icon={faArrowDown} style={{ color: '#ef4444', marginRight: 8 }} />Threats</>}>
                  <ul style={{ paddingLeft: 20, margin: 0 }}>
                    {(report.threats as string[]).map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                </Card>
              </Col>
            )}
          </Row>
        </Card>
      )}

      {/* Create Competitor Modal */}
      <Modal
        title="Add Competitor"
        open={showCreate}
        onCancel={() => setShowCreate(false)}
        onOk={handleCreate}
        confirmLoading={creating}
      >
        <Form layout="vertical">
          <Form.Item label="Competitor Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Nike Running"
            />
          </Form.Item>
          <Form.Item label="Handles (PLATFORM:@handle, comma separated)">
            <Input
              value={form.handles}
              onChange={(e) => setForm((p) => ({ ...p, handles: e.target.value }))}
              placeholder="INSTAGRAM:@nikerunning, TIKTOK:@nikerunning"
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
          <Form.Item label="Notes (optional)">
            <Input
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Internal notes about this competitor"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
