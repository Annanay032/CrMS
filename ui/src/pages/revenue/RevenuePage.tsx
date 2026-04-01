import { useState } from 'react';
import { Card, Statistic, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Space, Tabs, Empty, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faIndianRupeeSign, faPlus, faFileInvoiceDollar, faChartLine, faDownload,
  faFunnelDollar, faSackDollar, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  useGetRevenueSummaryQuery,
  useGetPostROIQuery,
  useListBrandDealsQuery,
  useListInvoicesQuery,
  useCreateBrandDealMutation,
  useCreateInvoiceMutation,
  useCreateRevenueStreamMutation,
  useGetRevenueTrendsQuery,
  useGetInvoiceStatsQuery,
} from '@/store/endpoints/revenue';
import s from './styles/Revenue.module.scss';

const REVENUE_TYPES = ['BRAND_DEAL', 'YOUTUBE_ADSENSE', 'AFFILIATE', 'SPONSORSHIP', 'OTHER'];
const DEAL_STATUSES = ['PROSPECT', 'CONTACTED', 'LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'PAID', 'CANCELLED', 'LOST'];
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const dealStatusColors: Record<string, string> = {
  PROSPECT: 'default', CONTACTED: 'processing', LEAD: 'blue', NEGOTIATING: 'orange',
  CONFIRMED: 'cyan', IN_PROGRESS: 'geekblue', DELIVERED: 'lime', PAID: 'green',
  CANCELLED: 'red', LOST: 'volcano',
};

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'default', SENT: 'blue', PAID: 'green', OVERDUE: 'red', CANCELLED: 'volcano',
};

const PIE_COLORS = ['#6366f1', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

function getInvoiceStatusDot(status: string) {
  if (status === 'PAID') return s['status_dot--paid'];
  if (status === 'OVERDUE') return s['status_dot--overdue'];
  if (['DRAFT', 'SENT'].includes(status)) return s['status_dot--pending'];
  return s['status_dot--draft'];
}

export default function RevenuePage() {
  const { data: summary, isLoading: summaryLoading } = useGetRevenueSummaryQuery({});
  const { data: postROI } = useGetPostROIQuery();
  const { data: deals, isLoading: dealsLoading } = useListBrandDealsQuery({ page: 1 });
  const { data: invoices, isLoading: invoicesLoading } = useListInvoicesQuery({ page: 1 });
  const { data: trendsData } = useGetRevenueTrendsQuery({});
  const { data: invoiceStatsData } = useGetInvoiceStatsQuery();

  const [createDeal] = useCreateBrandDealMutation();
  const [createInvoice] = useCreateInvoiceMutation();
  const [createStream] = useCreateRevenueStreamMutation();

  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [streamModalOpen, setStreamModalOpen] = useState(false);
  const [dealForm] = Form.useForm();
  const [invoiceForm] = Form.useForm();
  const [streamForm] = Form.useForm();

  const sm = summary?.data;
  const trends = trendsData?.data ?? [];
  const invStats = invoiceStatsData?.data;

  // Revenue by type for pie chart
  const pieData = sm?.byType
    ? Object.entries(sm.byType).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
    : [];

  const dealColumns = [
    { title: 'Brand', dataIndex: 'brandName', key: 'brandName' },
    { title: 'Value', dataIndex: 'dealValue', key: 'dealValue', render: (v: number) => `₹${v.toLocaleString()}` },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => <Tag color={dealStatusColors[st]}>{st.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      width: 90,
      render: (p: number) => p ? `${p}%` : '—',
    },
    { title: 'Deliverables', dataIndex: 'deliverables', key: 'deliverables', render: (d: string[]) => d.join(', '), ellipsis: true },
  ];

  const invoiceColumns = [
    { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => `₹${v.toLocaleString()}` },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => (
        <span>
          <span className={`${s.status_dot} ${getInvoiceStatusDot(st)}`} />
          <Tag color={invoiceStatusColors[st]}>{st}</Tag>
        </span>
      ),
    },
    { title: 'Due', dataIndex: 'dueDate', key: 'dueDate', render: (d: string) => d ? new Date(d).toLocaleDateString() : '—' },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: { id: string }) => (
        <Button
          type="text"
          size="small"
          icon={<FontAwesomeIcon icon={faDownload} />}
          onClick={() => {
            const token = localStorage.getItem('accessToken');
            window.open(`/api/revenue/invoices/${record.id}/pdf?token=${token}`, '_blank');
          }}
          title="Download PDF"
        />
      ),
    },
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
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faIndianRupeeSign} className={s.page_title__icon} />
          Revenue OS
        </h1>
        <Space>
          <Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setStreamModalOpen(true)}>Add Income</Button>
          <Button icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setDealModalOpen(true)}>New Deal</Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faFileInvoiceDollar} />} onClick={() => setInvoiceModalOpen(true)}>New Invoice</Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <div className={s.summary_grid}>
        <Card>
          <Statistic
            title="Total Earnings"
            value={sm?.totalEarnings ?? 0}
            prefix={<FontAwesomeIcon icon={faSackDollar} />}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
        <Card>
          <Statistic
            title="Active Pipeline"
            value={sm?.activeDealValue ?? 0}
            prefix={<FontAwesomeIcon icon={faFunnelDollar} />}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
        <Card>
          <Statistic
            title="Pending Invoices"
            value={invStats?.pendingAmount ?? sm?.pendingInvoiceAmount ?? 0}
            prefix={<FontAwesomeIcon icon={faFileInvoiceDollar} />}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
        <Card>
          <Statistic
            title="Overdue"
            value={invStats?.overdueAmount ?? sm?.overdueInvoiceAmount ?? 0}
            prefix={<FontAwesomeIcon icon={faTriangleExclamation} />}
            valueStyle={{ color: (invStats?.overdueAmount ?? 0) > 0 ? '#ef4444' : undefined }}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
      </div>

      {/* Charts Row */}
      <div className={s.dual_chart}>
        <div className={s.chart_card}>
          <div className={s.chart_header}>
            <span className={s.chart_title}>
              <FontAwesomeIcon icon={faChartLine} style={{ marginRight: 8 }} />
              Revenue Trend
            </span>
          </div>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="Add income or close deals to see trends" style={{ padding: '60px 0' }} />
          )}
        </div>

        <div className={s.chart_card}>
          <div className={s.chart_header}>
            <span className={s.chart_title}>Revenue by Source</span>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty description="No revenue data yet" style={{ padding: '60px 0' }} />
          )}
        </div>
      </div>

      {/* Data Tables */}
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
        <Form form={dealForm} layout="vertical" onFinish={async (values) => { await createDeal({ ...values, deliverables: values.deliverables?.split(',').map((str: string) => str.trim()) ?? [] }); setDealModalOpen(false); dealForm.resetFields(); }}>
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
            <Select options={DEAL_STATUSES.map(st => ({ label: st.replace(/_/g, ' '), value: st }))} />
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
            <Select options={INVOICE_STATUSES.map(st => ({ label: st, value: st }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
