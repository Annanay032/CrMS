import { useState } from 'react';
import { Card, Button, Tag, Typography, Empty, Spin, Modal, Input, Select, DatePicker, Checkbox, Row, Col, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faPlus, faPlay, faTrash, faDownload, faRobot } from '@fortawesome/free-solid-svg-icons';
import { useGetReportsQuery, useCreateReportMutation, useDeleteReportMutation, useGenerateReportMutation, useGetReportQuery } from '@/store/endpoints/dashboard';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { REPORT_METRICS } from '../constants';

const { Text, Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  GENERATING: 'processing',
  READY: 'success',
  FAILED: 'error',
  SCHEDULED: 'purple',
};

const FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'CSV', label: 'CSV' },
  { value: 'JSON', label: 'JSON' },
];

export function ReportsTab() {
  const { data, isLoading } = useGetReportsQuery({ page: 1, limit: 20 });
  const [createReport, { isLoading: creating }] = useCreateReportMutation();
  const [deleteReport] = useDeleteReportMutation();
  const [generateReport, { isLoading: generating }] = useGenerateReportMutation();
  const [runAgent, { isLoading: forecastLoading }] = useRunAgentMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [viewingReportId, setViewingReportId] = useState<string | null>(null);
  const [forecast, setForecast] = useState<Record<string, unknown> | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['impressions', 'engagement', 'followerGrowth']);
  const [format, setFormat] = useState('PDF');

  const reports = (data?.data ?? []) as Array<Record<string, unknown>>;

  const handleCreate = async () => {
    if (!title || !dateRange) return;
    await createReport({
      title,
      description,
      dateRangeStart: dateRange[0],
      dateRangeEnd: dateRange[1],
      metrics: selectedMetrics,
      format,
    }).unwrap();
    setShowCreate(false);
    setTitle('');
    setDescription('');
    setDateRange(null);
    setSelectedMetrics(['impressions', 'engagement', 'followerGrowth']);
  };

  const handleGenerate = async (id: string) => {
    await generateReport(id).unwrap();
  };

  const handleDelete = async (id: string) => {
    await deleteReport(id).unwrap();
  };

  const fetchForecast = async () => {
    try {
      const result = await runAgent({ agentType: 'ANALYTICS', input: { action: 'forecast_growth' } }).unwrap();
      setForecast(result.data as Record<string, unknown>);
    } catch { /* */ }
  };

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  return (
    <>
      {/* Growth Forecast Card */}
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            <FontAwesomeIcon icon={faRobot} style={{ color: '#4f46e5', marginRight: 8 }} />
            Growth Forecast
          </Title>
          <Button type="primary" onClick={fetchForecast} loading={forecastLoading}>
            {forecast ? 'Refresh Forecast' : 'Generate Forecast'}
          </Button>
        </div>
        {forecast ? (
          <Row gutter={[16, 16]}>
            <Col xs={12} md={6}>
              <div style={{ textAlign: 'center', padding: 12, background: '#fff', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Current Followers</Text>
                <Title level={4} style={{ margin: 0 }}>{((forecast.currentFollowers as number) ?? 0).toLocaleString()}</Title>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ textAlign: 'center', padding: 12, background: '#fff', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>30-Day Projection</Text>
                <Title level={4} style={{ margin: 0, color: '#16a34a' }}>{((forecast.projectedFollowers30d as number) ?? 0).toLocaleString()}</Title>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ textAlign: 'center', padding: 12, background: '#fff', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>90-Day Projection</Text>
                <Title level={4} style={{ margin: 0, color: '#4f46e5' }}>{((forecast.projectedFollowers90d as number) ?? 0).toLocaleString()}</Title>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div style={{ textAlign: 'center', padding: 12, background: '#fff', borderRadius: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Growth Trend</Text>
                <Title level={4} style={{ margin: 0 }}>{(forecast.growthTrend as string) ?? '—'}</Title>
              </div>
            </Col>
            {(forecast.factors as string[])?.length > 0 && (
              <Col xs={24}>
                <div style={{ padding: 12, background: '#fff', borderRadius: 8 }}>
                  <Text strong>Growth Factors</Text>
                  {(forecast.factors as string[]).map((f, i) => (
                    <div key={i} style={{ padding: '4px 0', fontSize: 13, color: '#475569' }}>• {f}</div>
                  ))}
                </div>
              </Col>
            )}
          </Row>
        ) : (
          <Paragraph type="secondary">Generate an AI-powered growth forecast based on your historical data and engagement patterns.</Paragraph>
        )}
      </Card>

      {/* Reports List */}
      <Card
        title={<><FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 8 }} />Custom Reports</>}
        extra={<Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setShowCreate(true)}>New Report</Button>}
        style={{ marginBottom: 24 }}
      >
        {reports.length === 0 ? (
          <Empty description="No reports yet. Create your first report to get started." />
        ) : (
          reports.map((report) => (
            <div key={report.id as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Text strong>{report.title as string}</Text>
                  <Tag color={STATUS_COLORS[report.status as string] ?? 'default'}>{report.status as string}</Tag>
                  <Tag>{report.format as string}</Tag>
                </div>
                {report.description && <Text type="secondary" style={{ fontSize: 12 }}>{report.description as string}</Text>}
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {new Date(report.dateRangeStart as string).toLocaleDateString()} — {new Date(report.dateRangeEnd as string).toLocaleDateString()}
                  {report.lastGeneratedAt && ` · Generated ${new Date(report.lastGeneratedAt as string).toLocaleString()}`}
                </Text>
              </div>
              <Space>
                {(report.status === 'DRAFT' || report.status === 'READY' || report.status === 'FAILED') && (
                  <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faPlay} />} loading={generating} onClick={() => handleGenerate(report.id as string)}>
                    {report.status === 'READY' ? 'Regenerate' : 'Generate'}
                  </Button>
                )}
                {report.status === 'READY' && (
                  <Button size="small" icon={<FontAwesomeIcon icon={faDownload} />} onClick={() => setViewingReportId(report.id as string)}>
                    View
                  </Button>
                )}
                <Button size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} onClick={() => handleDelete(report.id as string)} />
              </Space>
            </div>
          ))
        )}
      </Card>

      {/* Create Report Modal */}
      <Modal title="Create Report" open={showCreate} onCancel={() => setShowCreate(false)} onOk={handleCreate} confirmLoading={creating} okText="Create">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Text strong>Title</Text>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monthly Performance Report" />
          </div>
          <div>
            <Text strong>Description</Text>
            <Input.TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} />
          </div>
          <div>
            <Text strong>Date Range</Text>
            <br />
            <RangePicker style={{ width: '100%' }} onChange={(_, dateStrings) => setDateRange(dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] : null)} />
          </div>
          <div>
            <Text strong>Metrics to Include</Text>
            <br />
            <Checkbox.Group value={selectedMetrics} onChange={(vals) => setSelectedMetrics(vals as string[])}>
              <Row>
                {REPORT_METRICS.map((m) => (
                  <Col key={m.value} span={12}>
                    <Checkbox value={m.value}>{m.label}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </div>
          <div>
            <Text strong>Format</Text>
            <Select value={format} onChange={setFormat} style={{ width: '100%' }} options={FORMAT_OPTIONS} />
          </div>
        </div>
      </Modal>

      {/* View Report Modal */}
      {viewingReportId && <ReportViewer reportId={viewingReportId} onClose={() => setViewingReportId(null)} />}
    </>
  );
}

/* ── Report Viewer ──────────────────────────────────────── */

function ReportViewer({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const { data, isLoading } = useGetReportQuery(reportId);
  const report = data?.data as Record<string, unknown> | undefined;
  const generated = report?.generatedData as Record<string, unknown> | undefined;

  return (
    <Modal title={report?.title as string ?? 'Report'} open onCancel={onClose} footer={null} width={720}>
      {isLoading ? (
        <Spin />
      ) : !generated ? (
        <Empty description="No generated data" />
      ) : (
        <div>
          {generated.executiveSummary && (
            <Card size="small" title="Executive Summary" style={{ marginBottom: 12 }}>
              <Paragraph>{generated.executiveSummary as string}</Paragraph>
            </Card>
          )}

          {(generated.highlights as string[])?.length > 0 && (
            <Card size="small" title="Highlights" style={{ marginBottom: 12 }}>
              {(generated.highlights as string[]).map((h, i) => (
                <div key={i} style={{ padding: '4px 0', fontSize: 13 }}>✓ {h}</div>
              ))}
            </Card>
          )}

          {generated.engagementSummary && (
            <Card size="small" title="Engagement Summary" style={{ marginBottom: 12 }}>
              {Object.entries(generated.engagementSummary as Record<string, number>).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <Text type="secondary">{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
                  <Text strong>{typeof val === 'number' ? val.toLocaleString() : String(val)}</Text>
                </div>
              ))}
            </Card>
          )}

          {(generated.areasForImprovement as string[])?.length > 0 && (
            <Card size="small" title="Areas for Improvement" style={{ marginBottom: 12 }}>
              {(generated.areasForImprovement as string[]).map((a, i) => (
                <div key={i} style={{ padding: '4px 0', fontSize: 13, color: '#dc2626' }}>• {a}</div>
              ))}
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
}
