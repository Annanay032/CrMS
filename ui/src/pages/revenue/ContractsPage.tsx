import { useState } from 'react';
import { Card, Statistic, Table, Tag, Button, Modal, Form, Input, InputNumber, DatePicker, Select, Space, Empty, Spin, Popconfirm, Progress, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileContract, faPlus, faTrash, faPen, faCheck, faClock,
} from '@fortawesome/free-solid-svg-icons';
import dayjs from 'dayjs';
import {
  useListContractsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,
} from '@/store/endpoints/contract';
import type { Contract, ContractDeliverable, PaymentMilestone } from '@/store/endpoints/contract';
import s from './styles/Contracts.module.scss';

const CONTRACT_STATUSES = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;

const statusColors: Record<string, string> = {
  DRAFT: 'default', ACTIVE: 'green', COMPLETED: 'blue', CANCELLED: 'red',
};

function deliverableProgress(deliverables: ContractDeliverable[]) {
  if (!deliverables.length) return 0;
  return Math.round((deliverables.filter((d) => d.completed).length / deliverables.length) * 100);
}

function paidProgress(schedule: PaymentMilestone[]) {
  if (!schedule.length) return { paid: 0, total: 0 };
  const paid = schedule.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const total = schedule.reduce((sum, p) => sum + p.amount, 0);
  return { paid, total };
}

export default function ContractsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data: contractsRes, isLoading } = useListContractsQuery({ page: 1, status: statusFilter });
  const [createContract] = useCreateContractMutation();
  const [updateContract] = useUpdateContractMutation();
  const [deleteContract] = useDeleteContractMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [deliverables, setDeliverables] = useState<ContractDeliverable[]>([]);
  const [payments, setPayments] = useState<PaymentMilestone[]>([]);

  const contracts: Contract[] = contractsRes?.data ?? [];

  const totalValue = contracts.reduce((sum, c) => sum + c.totalValue, 0);
  const activeCount = contracts.filter((c) => c.status === 'ACTIVE').length;
  const allDeliverables = contracts.flatMap((c) => c.deliverables);
  const overallProgress = allDeliverables.length
    ? Math.round((allDeliverables.filter((d) => d.completed).length / allDeliverables.length) * 100)
    : 0;
  const { paid: totalPaid, total: totalScheduled } = contracts.reduce(
    (acc, c) => {
      const p = paidProgress(c.paymentSchedule);
      return { paid: acc.paid + p.paid, total: acc.total + p.total };
    },
    { paid: 0, total: 0 },
  );

  function openCreate() {
    setEditingId(null);
    setDeliverables([]);
    setPayments([]);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(contract: Contract) {
    setEditingId(contract.id);
    setDeliverables(contract.deliverables);
    setPayments(contract.paymentSchedule);
    form.setFieldsValue({
      title: contract.title,
      status: contract.status,
      totalValue: contract.totalValue,
      terms: contract.terms,
      notes: contract.notes,
      startDate: contract.startDate ? dayjs(contract.startDate) : undefined,
      endDate: contract.endDate ? dayjs(contract.endDate) : undefined,
    });
    setModalOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = {
      ...values,
      startDate: values.startDate ? (values.startDate as dayjs.Dayjs).toISOString() : undefined,
      endDate: values.endDate ? (values.endDate as dayjs.Dayjs).toISOString() : undefined,
      deliverables,
      paymentSchedule: payments,
    };

    if (editingId) {
      await updateContract({ id: editingId, ...payload });
    } else {
      await createContract(payload);
    }
    setModalOpen(false);
    form.resetFields();
  }

  // Deliverable helpers
  function addDeliverable() {
    setDeliverables([...deliverables, { title: '', dueDate: '', completed: false }]);
  }
  function updateDeliverable(idx: number, field: keyof ContractDeliverable, value: unknown) {
    const next = [...deliverables];
    next[idx] = { ...next[idx], [field]: value };
    setDeliverables(next);
  }
  function removeDeliverable(idx: number) {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  }

  // Payment helpers
  function addPayment() {
    setPayments([...payments, { amount: 0, dueDate: '', paid: false }]);
  }
  function updatePayment(idx: number, field: keyof PaymentMilestone, value: unknown) {
    const next = [...payments];
    next[idx] = { ...next[idx], [field]: value };
    setPayments(next);
  }
  function removePayment(idx: number) {
    setPayments(payments.filter((_, i) => i !== idx));
  }

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Contract) => (
        <div>
          <strong>{title}</strong>
          {record.brandDeal && (
            <div style={{ fontSize: 12, color: '#888' }}>{record.brandDeal.brandName}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 120,
      render: (v: number) => `₹${v.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (st: string) => <Tag color={statusColors[st]}>{st}</Tag>,
    },
    {
      title: 'Deliverables',
      key: 'deliverables',
      width: 160,
      render: (_: unknown, record: Contract) => {
        const pct = deliverableProgress(record.deliverables);
        return record.deliverables.length ? (
          <Tooltip title={`${record.deliverables.filter(d => d.completed).length}/${record.deliverables.length} done`}>
            <Progress percent={pct} size="small" />
          </Tooltip>
        ) : '—';
      },
    },
    {
      title: 'Payments',
      key: 'payments',
      width: 160,
      render: (_: unknown, record: Contract) => {
        const { paid, total } = paidProgress(record.paymentSchedule);
        if (!total) return '—';
        const pct = Math.round((paid / total) * 100);
        return (
          <Tooltip title={`₹${paid.toLocaleString()} / ₹${total.toLocaleString()}`}>
            <Progress percent={pct} size="small" status={pct === 100 ? 'success' : 'active'} />
          </Tooltip>
        );
      },
    },
    {
      title: 'Period',
      key: 'period',
      width: 180,
      render: (_: unknown, record: Contract) => {
        const start = record.startDate ? dayjs(record.startDate).format('MMM D') : '—';
        const end = record.endDate ? dayjs(record.endDate).format('MMM D, YYYY') : '—';
        return `${start} – ${end}`;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Contract) => (
        <Space>
          <Button type="text" size="small" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this contract?" onConfirm={() => deleteContract(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faFileContract} className={s.page_title__icon} />
          Contracts
        </h1>
        <Space>
          <Select
            allowClear
            placeholder="All statuses"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={CONTRACT_STATUSES.map((st) => ({ label: st, value: st }))}
          />
          <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={openCreate}>
            New Contract
          </Button>
        </Space>
      </div>

      {/* Summary Cards */}
      <div className={s.summary_row}>
        <Card>
          <Statistic title="Total Contract Value" value={totalValue} formatter={(v) => `₹${Number(v).toLocaleString()}`} />
        </Card>
        <Card>
          <Statistic title="Active Contracts" value={activeCount} prefix={<FontAwesomeIcon icon={faFileContract} />} />
        </Card>
        <Card>
          <Statistic
            title="Deliverable Progress"
            value={overallProgress}
            suffix="%"
            prefix={<FontAwesomeIcon icon={faCheck} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Payments Collected"
            value={totalPaid}
            suffix={totalScheduled ? ` / ₹${totalScheduled.toLocaleString()}` : ''}
            prefix={<FontAwesomeIcon icon={faClock} />}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
      </div>

      {/* Table */}
      <Table
        dataSource={contracts}
        columns={columns}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: <Empty description="No contracts yet" /> }}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingId ? 'Edit Contract' : 'New Contract'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={640}
        okText={editingId ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="e.g. Brand X Q3 Campaign" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="totalValue" label="Total Value (₹)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="status" label="Status">
              <Select options={CONTRACT_STATUSES.map((st) => ({ label: st, value: st }))} />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="startDate" label="Start Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" label="End Date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="terms" label="Terms">
            <Input.TextArea rows={3} placeholder="Contract terms and conditions..." />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Internal notes..." />
          </Form.Item>

          {/* Deliverables */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Deliverables</strong>
              <Button size="small" type="dashed" icon={<FontAwesomeIcon icon={faPlus} />} onClick={addDeliverable}>Add</Button>
            </div>
            <div className={s.dynamic_rows}>
              {deliverables.map((d, i) => (
                <div key={i} className={s.dynamic_row}>
                  <Input
                    placeholder="Deliverable title"
                    value={d.title}
                    onChange={(e) => updateDeliverable(i, 'title', e.target.value)}
                    style={{ flex: 2 }}
                  />
                  <DatePicker
                    placeholder="Due date"
                    value={d.dueDate ? dayjs(d.dueDate) : null}
                    onChange={(date) => updateDeliverable(i, 'dueDate', date?.toISOString() ?? '')}
                    style={{ flex: 1 }}
                  />
                  <Button
                    className={s.remove_btn}
                    size="small"
                    danger
                    type="text"
                    icon={<FontAwesomeIcon icon={faTrash} />}
                    onClick={() => removeDeliverable(i)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Schedule */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Payment Schedule</strong>
              <Button size="small" type="dashed" icon={<FontAwesomeIcon icon={faPlus} />} onClick={addPayment}>Add</Button>
            </div>
            <div className={s.dynamic_rows}>
              {payments.map((p, i) => (
                <div key={i} className={s.dynamic_row}>
                  <InputNumber
                    placeholder="Amount"
                    min={0}
                    value={p.amount || undefined}
                    onChange={(val) => updatePayment(i, 'amount', val ?? 0)}
                    style={{ flex: 1 }}
                  />
                  <DatePicker
                    placeholder="Due date"
                    value={p.dueDate ? dayjs(p.dueDate) : null}
                    onChange={(date) => updatePayment(i, 'dueDate', date?.toISOString() ?? '')}
                    style={{ flex: 1 }}
                  />
                  <Button
                    className={s.remove_btn}
                    size="small"
                    danger
                    type="text"
                    icon={<FontAwesomeIcon icon={faTrash} />}
                    onClick={() => removePayment(i)}
                  />
                </div>
              ))}
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
