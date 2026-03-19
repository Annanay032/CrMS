import { useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Space, Tabs, Empty, Spin } from 'antd';
import { DollarOutlined, PlusOutlined, FileTextOutlined, RiseOutlined } from '@ant-design/icons';
import {
  useGetRevenueSummaryQuery,
  useGetPostROIQuery,
  useListBrandDealsQuery,
  useListInvoicesQuery,
  useCreateBrandDealMutation,
  useCreateInvoiceMutation,
  useCreateRevenueStreamMutation,
} from '@/store/endpoints/revenue';

const REVENUE_TYPES = ['BRAND_DEAL', 'YOUTUBE_ADSENSE', 'AFFILIATE', 'SPONSORSHIP', 'OTHER'];
const DEAL_STATUSES = ['LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'PAID', 'CANCELLED'];
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const dealStatusColors: Record<string, string> = {
  LEAD: 'default', NEGOTIATING: 'processing', CONFIRMED: 'blue',
  IN_PROGRESS: 'orange', DELIVERED: 'cyan', PAID: 'green', CANCELLED: 'red',
};

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'default', SENT: 'blue', PAID: 'green', OVERDUE: 'red', CANCELLED: 'volcano',
};

export default function RevenuePage() {
  const { data: summary, isLoading: summaryLoading } = useGetRevenueSummaryQuery({});
  const { data: postROI } = useGetPostROIQuery();
  const { data: deals, isLoading: dealsLoading } = useListBrandDealsQuery({ page: 1 });
  const { data: invoices, isLoading: invoicesLoading } = useListInvoicesQuery({ page: 1 });

  const [createDeal] = useCreateBrandDealMutation();
  const [createInvoice] = useCreateInvoiceMutation();
  const [createStream] = useCreateRevenueStreamMutation();

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [dealForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [streamForm] = Form.useForm();

  const s = summary?.data;

  const dealColumns = [
    { title: 'Brand', dataIndex: 'brandName', key: 'brandName' },
    { title: 'Value', dataIndex: 'dealValue', key: 'dealValue', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={dealStatusColors[s]}>{s.replace(/_/g, ' ')}</Tag> },
    { title: 'Deliverables', dataIndex: 'deliverables', key: 'deliverables', render: (d: string[]) => d.join(', ') },
  ];

  const invoiceColumns = [
    { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `₹${v.toLocaleString()}` },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={invoiceStatusColors[s]}>{s}</Tag> },
    { title: 'Due', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => d ? new Date(d).toLocaleDateString() : '—' },
  ];

  const roiColumns = [
    { title: 'Post', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Platform', dataIndex: 'platform', key: 'platform', render: (p: string) => <Tag>{p}</Tag> },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', render: (v: number) => `₹${(v ?? 0).toLocaleString()}` },
    { title: 'Impressions', dataIndex: 'impressions', key: 'impressions', render: (v: number) => v.toLocaleString() },
    { title: 'Engagement', dataIndex: 'engagement', key: 'engagement', render: (v: number) => v.toLocaleString() },
  ];

  if (summaryLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Revenue OS</h1>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setStreamModalOpen(true)}>Add Income</Button>
          <Button icon={<PlusOutlined />} onClick={() => setDealModalOpen(true)}>New Deal</Button>
          <Button icon={<FileTextOutlined />} onClick={() => setInvoiceModalOpen(true)}>New Invoice</Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="Total Earnings" value={s?.totalEarnings ?? 0} prefix={<DollarOutlined />} precision={0} formatter={(v) => `₹${Number(v).toLocaleString()}`} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Active Deal Pipeline" value={s?.activeDealValue ?? 0} prefix={<RiseOutlined />} precision={0} formatter={(v) => `₹${Number(v).toLocaleString()}`} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Pending Invoices" value={s?.pendingInvoiceAmount ?? 0} precision={0} formatter={(v) => `₹${Number(v).toLocaleString()}`} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="Overdue Invoices" value={s?.overdueInvoiceAmount ?? 0} precision={0} valueStyle={{ color: (s?.overdueInvoiceAmount ?? 0) > 0 ? '#ff4d4f' : undefined }} formatter={(v) => `₹${Number(v).toLocaleString()}`} /></Card>
        </Col>
      </Row>

      {/* Revenue By Source */}
      {s?.byType && Object.keys(s.byType).length > 0 && (
        <Card title="Revenue by Source" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            {Object.entries(s.byType).map(([type, amount]) => (
              <Col span={4} key={type}>
                <Statistic title={type.replace(/_/g, ' ')} value={amount} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Tabs items={[
        {
          key: 'deals',
          label: `Brand Deals (${deals?.data?.length ?? 0})`,
          children: (
            <Table
              dataSource={deals?.data ?? []}
              columns={dealColumns}
              rowKey="id"
              loading={dealsLoading}
              pagination={false}
              locale={{ emptyText: <Empty description="No brand deals yet" /> }}
            />
          ),
        },
        {
          key: 'invoices',
          label: `Invoices (${invoices?.data?.length ?? 0})`,
          children: (
            <Table
              dataSource={invoices?.data ?? []}
              columns={invoiceColumns}
              rowKey="id"
              loading={invoicesLoading}
              pagination={false}
              locale={{ emptyText: <Empty description="No invoices yet" /> }}
            />
          ),
        },
        {
          key: 'roi',
          label: 'Post ROI',
          children: (
            <Table
              dataSource={postROI?.data ?? []}
              columns={roiColumns}
              rowKey="postId"
              pagination={false}
              locale={{ emptyText: <Empty description="No ROI data yet" /> }}
            />
          ),
        },
      ]} />

      {/* Add Income Modal */}
      <Modal title="Add Income" open={streamModalOpen} onCancel={() => setStreamModalOpen(false)} onOk={() => streamForm.submit()} okText="Add">
        <Form form={streamForm} layout="vertical" onFinish={async (values) => { await createStream(values); setStreamModalOpen(false); streamForm.resetFields(); }}>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={REVENUE_TYPES.map(t => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>
          <Form.Item name="source" label="Source" rules={[{ required: true }]}>
            <Input placeholder="e.g. YouTube AdSense, Brand X" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="period" label="Period">
            <Input placeholder="e.g. 2026-06" />
          </Form.Item>
        </Form>
      </Modal>

      {/* New Deal Modal */}
      <Modal title="New Brand Deal" open={dealModalOpen} onCancel={() => setDealModalOpen(false)} onOk={() => dealForm.submit()} okText="Create">
        <Form form={dealForm} layout="vertical" onFinish={async (values) => { await createDeal({ ...values, deliverables: values.deliverables?.split(',').map((s: string) => s.trim()) ?? [] }); setDealModalOpen(false); dealForm.resetFields(); }}>
          <Form.Item name="brandName" label="Brand Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="dealValue" label="Deal Value (₹)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deliverables" label="Deliverables (comma-separated)">
            <Input placeholder="1 Reel, 2 Stories" />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={DEAL_STATUSES.map(s => ({ label: s.replace(/_/g, ' '), value: s }))} />
          </Form.Item>
          <Form.Item name="contactEmail" label="Contact Email">
            <Input type="email" />
          </Form.Item>
        </Form>
      </Modal>

      {/* New Invoice Modal */}
      <Modal title="New Invoice" open={invoiceModalOpen} onCancel={() => setInvoiceModalOpen(false)} onOk={() => invoiceForm.submit()} okText="Create">
        <Form form={invoiceForm} layout="vertical" onFinish={async (values) => { await createInvoice(values); setInvoiceModalOpen(false); invoiceForm.resetFields(); }}>
          <Form.Item name="invoiceNumber" label="Invoice Number" rules={[{ required: true }]}>
            <Input placeholder="INV-001" />
          </Form.Item>
          <Form.Item name="amount" label="Amount (₹)" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status">
            <Select options={INVOICE_STATUSES.map(s => ({ label: s, value: s }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
