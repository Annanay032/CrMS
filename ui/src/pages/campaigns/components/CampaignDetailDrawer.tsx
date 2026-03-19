import { useState } from 'react';
import {
  Drawer, Space, Tag, Row, Col, Typography, Steps, Card, Progress, Table,
  Button, Modal, Form, Input, Select, InputNumber, DatePicker, Popconfirm, Statistic,
  Descriptions, List, message,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen, faChartLine } from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import type { Campaign, CampaignDeliverable } from '@/types';
import { formatCurrency } from '@/utils/format';
import {
  useUpdateCampaignStageMutation,
  useGetDeliverablesQuery,
  useCreateDeliverableMutation,
  useUpdateDeliverableMutation,
  useDeleteDeliverableMutation,
  useGetCampaignReportsQuery,
} from '@/store/endpoints/campaigns';
import {
  STATUS_COLOR, STAGE_LABELS, CAMPAIGN_STAGES,
  DELIVERABLE_STATUS_COLOR, DELIVERABLE_TYPE_OPTIONS,
  DELIVERABLE_STATUS_OPTIONS, PLATFORM_OPTIONS,
} from '../constants';

const { Text, Paragraph, Title } = Typography;

interface CampaignDetailDrawerProps {
  campaign: Campaign | null;
  onClose: () => void;
}

const STAGE_IDX: Record<string, number> = { BRIEF: 0, RECRUITING: 1, IN_PROGRESS: 2, REVIEW: 3, COMPLETED: 4 };

export function CampaignDetailDrawer({ campaign, onClose }: CampaignDetailDrawerProps) {
  const [deliverableModal, setDeliverableModal] = useState(false);
  const [editingDeliverable, setEditingDeliverable] = useState<CampaignDeliverable | null>(null);
  const [form] = Form.useForm();

  const { data: deliverableData } = useGetDeliverablesQuery(campaign?.id ?? '', { skip: !campaign });
  const { data: reportData } = useGetCampaignReportsQuery(campaign?.id ?? '', { skip: !campaign });
  const [updateStage] = useUpdateCampaignStageMutation();
  const [createDeliverable, { isLoading: creating }] = useCreateDeliverableMutation();
  const [updateDeliverable] = useUpdateDeliverableMutation();
  const [deleteDeliverable] = useDeleteDeliverableMutation();

  const deliverables: CampaignDeliverable[] = deliverableData?.data ?? [];
  const reports = reportData?.data ?? [];

  const handleStageChange = (stage: string) => {
    if (campaign) updateStage({ id: campaign.id, stage });
  };

  const handleDeliverableSubmit = async (values: Record<string, unknown>) => {
    if (!campaign) return;
    const payload = {
      ...values,
      dueDate: values.dueDate ? (values.dueDate as dayjs.Dayjs).toISOString() : undefined,
    };
    if (editingDeliverable) {
      await updateDeliverable({ campaignId: campaign.id, deliverableId: editingDeliverable.id, data: payload });
    } else {
      await createDeliverable({ campaignId: campaign.id, data: payload });
    }
    form.resetFields();
    setDeliverableModal(false);
    setEditingDeliverable(null);
    message.success(editingDeliverable ? 'Deliverable updated' : 'Deliverable created');
  };

  const openEditDeliverable = (d: CampaignDeliverable) => {
    setEditingDeliverable(d);
    form.setFieldsValue({
      ...d,
      dueDate: d.dueDate ? dayjs(d.dueDate) : undefined,
    });
    setDeliverableModal(true);
  };

  const budgetPct = campaign?.budget ? Math.min(100, Math.round(((campaign.spent ?? 0) / campaign.budget) * 100)) : 0;

  return (
    <Drawer
      title={campaign?.title}
      open={!!campaign}
      onClose={onClose}
      width={720}
      extra={campaign?.stage && (
        <Tag color={STATUS_COLOR[campaign.status] ?? 'default'}>{campaign.status}</Tag>
      )}
    >
      {campaign && (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* ─── Stage Pipeline ──────────────────── */}
          <Card size="small" title="Campaign Stage">
            <Steps
              current={STAGE_IDX[campaign.stage ?? 'BRIEF'] ?? 0}
              size="small"
              onChange={(idx) => handleStageChange(CAMPAIGN_STAGES[idx])}
              items={CAMPAIGN_STAGES.map((s) => ({ title: STAGE_LABELS[s] }))}
            />
          </Card>

          {/* ─── Budget & Stats ──────────────────── */}
          <Row gutter={16}>
            <Col span={8}>
              <Card size="small">
                <Statistic
                  title="Budget"
                  value={campaign.budget ?? 0}
                  prefix="$"
                  precision={0}
                />
                <Progress percent={budgetPct} size="small" strokeColor={budgetPct > 90 ? '#ff4d4f' : '#52c41a'} />
                <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(campaign.spent ?? 0)} spent</Text>
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Matches" value={campaign._count?.matches ?? 0} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small">
                <Statistic title="Deliverables" value={deliverables.length} />
              </Card>
            </Col>
          </Row>

          {/* ─── Description & Details ───────────── */}
          <Descriptions column={2} size="small" bordered>
            <Descriptions.Item label="Platforms" span={2}>
              <Space wrap>{campaign.targetPlatforms?.map((p) => <Tag key={p}>{p}</Tag>)}</Space>
            </Descriptions.Item>
            <Descriptions.Item label="Start">{campaign.startDate ? dayjs(campaign.startDate).format('MMM D, YYYY') : '—'}</Descriptions.Item>
            <Descriptions.Item label="End">{campaign.endDate ? dayjs(campaign.endDate).format('MMM D, YYYY') : '—'}</Descriptions.Item>
          </Descriptions>
          {campaign.description && <Paragraph>{campaign.description}</Paragraph>}

          {/* ─── KPIs ────────────────────────────── */}
          {campaign.kpis && campaign.kpis.length > 0 && (
            <Card size="small" title="KPIs">
              <Row gutter={[16, 8]}>
                {campaign.kpis.map((kpi, i) => (
                  <Col span={12} key={i}>
                    <Text>{kpi.metric}</Text>
                    <Progress
                      percent={kpi.target ? Math.min(100, Math.round((kpi.current / kpi.target) * 100)) : 0}
                      size="small"
                      format={() => `${kpi.current}/${kpi.target}`}
                    />
                  </Col>
                ))}
              </Row>
            </Card>
          )}

          {/* ─── Deliverables ────────────────────── */}
          <Card
            size="small"
            title={`Deliverables (${deliverables.length})`}
            extra={
              <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => { setEditingDeliverable(null); form.resetFields(); setDeliverableModal(true); }}>
                Add
              </Button>
            }
          >
            <Table
              dataSource={deliverables}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: 'Title', dataIndex: 'title', width: 160 },
                { title: 'Type', dataIndex: 'type', width: 80, render: (v: string) => <Tag>{v}</Tag> },
                {
                  title: 'Status', dataIndex: 'status', width: 120,
                  render: (v: string) => <Tag color={DELIVERABLE_STATUS_COLOR[v] ?? 'default'}>{v.replace(/_/g, ' ')}</Tag>,
                },
                { title: 'Due', dataIndex: 'dueDate', width: 100, render: (v: string) => v ? dayjs(v).format('MMM D') : '—' },
                { title: 'Payment', dataIndex: 'payment', width: 80, render: (v: number) => v ? formatCurrency(v) : '—' },
                {
                  title: '', width: 80,
                  render: (_: unknown, record: CampaignDeliverable) => (
                    <Space size="small">
                      <Button size="small" type="text" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => openEditDeliverable(record)} />
                      <Popconfirm title="Delete deliverable?" onConfirm={() => deleteDeliverable({ campaignId: campaign.id, deliverableId: record.id })}>
                        <Button size="small" type="text" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          {/* ─── Reports ─────────────────────────── */}
          {reports.length > 0 && (
            <Card size="small" title={<><FontAwesomeIcon icon={faChartLine} style={{ marginRight: 8 }} />Reports</>}>
              <List
                dataSource={reports}
                renderItem={(r) => (
                  <List.Item extra={r.roi !== undefined && <Tag color="green">ROI: {r.roi.toFixed(1)}%</Tag>}>
                    <List.Item.Meta
                      title={r.title}
                      description={r.summary ? r.summary.slice(0, 120) + '…' : dayjs(r.generatedAt).format('MMM D, YYYY')}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Space>
      )}

      {/* ─── Deliverable Modal ─────────────────── */}
      <Modal
        title={editingDeliverable ? 'Edit Deliverable' : 'Add Deliverable'}
        open={deliverableModal}
        onCancel={() => { setDeliverableModal(false); setEditingDeliverable(null); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical" onFinish={handleDeliverableSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select options={DELIVERABLE_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="platform" label="Platform" rules={[{ required: true }]}>
                <Select options={PLATFORM_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          {editingDeliverable && (
            <Form.Item name="status" label="Status">
              <Select options={DELIVERABLE_STATUS_OPTIONS} />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="payment" label="Payment ($)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="Due Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>
          {editingDeliverable && (
            <>
              <Form.Item name="contentUrl" label="Content URL">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="feedback" label="Feedback">
                <Input.TextArea rows={2} />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Drawer>
  );
}
