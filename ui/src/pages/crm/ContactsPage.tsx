import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button, Table, Tag, Select, Input, Space, Spin, Empty, Modal, Form, Row, Col, Statistic, Card,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAddressBook, faPlus, faTrash, faPen, faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import {
  useListContactsQuery,
  useCreateContactMutation,
  useDeleteContactMutation,
} from '@/store/endpoints/crm';
import { PLATFORM_OPTIONS } from '@/pages/content/constants';
import type { Contact, ContactType, ContactSource } from '@/types';
import s from './styles/Crm.module.scss';

const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: 'BRAND', label: 'Brand' },
  { value: 'FAN', label: 'Fan' },
  { value: 'CREATOR', label: 'Creator' },
  { value: 'AGENCY', label: 'Agency' },
  { value: 'OTHER', label: 'Other' },
];

const CONTACT_SOURCE_OPTIONS: { value: ContactSource; label: string }[] = [
  { value: 'DM', label: 'DM' },
  { value: 'COMMENT', label: 'Comment' },
  { value: 'MENTION', label: 'Mention' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'IMPORT', label: 'Import' },
  { value: 'MANUAL', label: 'Manual' },
];

const TYPE_COLORS: Record<string, string> = {
  BRAND: 'blue', FAN: 'green', CREATOR: 'purple', AGENCY: 'orange', OTHER: 'default',
};

function getScoreClass(score: number) {
  if (score >= 70) return s['score_badge--high'];
  if (score >= 40) return s['score_badge--medium'];
  return s['score_badge--low'];
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ContactsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ type?: ContactType; platform?: string; search?: string }>({});
  const [showCreate, setShowCreate] = useState(false);
  const [form] = Form.useForm();

  const { data, isLoading } = useListContactsQuery({ page, limit: 20, ...filters });
  const [createContact, { isLoading: creating }] = useCreateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const contacts = data?.data ?? [];
  const pagination = data?.pagination as { total?: number } | undefined;

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createContact(values).unwrap();
      form.resetFields();
      setShowCreate(false);
    } catch { /* validation error */ }
  };

  const columns = [
    {
      title: 'Name',
      key: 'name',
      render: (_: unknown, record: Contact) => (
        <div className={s.contact_name_cell}>
          <div className={s.contact_avatar}>
            {record.avatarUrl ? (
              <img src={record.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitials(record.name)
            )}
          </div>
          <div className={s.contact_name_text}>
            <strong>{record.name}</strong>
            {record.handle && <span className={s.contact_handle}>@{record.handle}</span>}
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={TYPE_COLORS[type]}>{type}</Tag>,
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 110,
      render: (p: string) => p ? <Tag>{p}</Tag> : '—',
    },
    {
      title: 'Score',
      dataIndex: 'relationshipScore',
      key: 'relationshipScore',
      width: 80,
      sorter: (a: Contact, b: Contact) => a.relationshipScore - b.relationshipScore,
      render: (score: number) => (
        <span className={`${s.score_badge} ${getScoreClass(score)}`}>{score}</span>
      ),
    },
    {
      title: 'Deals',
      key: 'deals',
      width: 70,
      render: (_: unknown, record: Contact) => record._count?.brandDeals ?? 0,
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (src: string) => <Tag>{src}</Tag>,
    },
    {
      title: 'Last Interaction',
      dataIndex: 'lastInteractionAt',
      key: 'lastInteractionAt',
      width: 130,
      render: (d: string) => d ? new Date(d).toLocaleDateString() : '—',
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Contact) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<FontAwesomeIcon icon={faPen} />}
            onClick={(e) => { e.stopPropagation(); navigate(`/crm/contacts/${record.id}`); }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<FontAwesomeIcon icon={faTrash} />}
            onClick={(e) => { e.stopPropagation(); deleteContact(record.id); }}
          />
        </Space>
      ),
    },
  ];

  const totalContacts = pagination?.total ?? contacts.length;
  const brandCount = contacts.filter((c) => c.type === 'BRAND').length;
  const highScoreCount = contacts.filter((c) => c.relationshipScore >= 70).length;

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faAddressBook} className={s.page_title__icon} />
          Contacts
        </h1>
        <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setShowCreate(true)}>
          Add Contact
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Contacts" value={totalContacts} prefix={<FontAwesomeIcon icon={faAddressBook} />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Brand Contacts" value={brandCount} prefix={<FontAwesomeIcon icon={faEnvelope} />} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="High Value (70+)" value={highScoreCount} valueStyle={{ color: '#22c55e' }} /></Card>
        </Col>
      </Row>

      <div className={s.filters_bar}>
        <div className={s.filters_left}>
          <Input.Search
            placeholder="Search contacts..."
            allowClear
            style={{ width: 240 }}
            onSearch={(val) => setFilters((prev) => ({ ...prev, search: val || undefined }))}
          />
          <Select
            placeholder="Type"
            allowClear
            style={{ width: 120 }}
            options={CONTACT_TYPE_OPTIONS}
            onChange={(val) => setFilters((prev) => ({ ...prev, type: val }))}
          />
          <Select
            placeholder="Platform"
            allowClear
            style={{ width: 140 }}
            options={PLATFORM_OPTIONS}
            onChange={(val) => setFilters((prev) => ({ ...prev, platform: val }))}
          />
        </div>
      </div>

      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : contacts.length === 0 ? (
        <Empty description="No contacts yet. Add your first contact or let Signal Engine auto-discover them." />
      ) : (
        <Table
          dataSource={contacts}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            total: pagination?.total,
            pageSize: 20,
            onChange: setPage,
            showSizeChanger: false,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/crm/contacts/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      )}

      <Modal
        title="Add Contact"
        open={showCreate}
        onOk={handleCreate}
        onCancel={() => { setShowCreate(false); form.resetFields(); }}
        confirmLoading={creating}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input placeholder="Contact name" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="handle" label="Handle">
                <Input placeholder="@username" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email">
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Type" initialValue="BRAND">
                <Select options={CONTACT_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="platform" label="Platform">
                <Select placeholder="Platform" allowClear options={PLATFORM_OPTIONS} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="source" label="Source" initialValue="MANUAL">
            <Select options={CONTACT_SOURCE_OPTIONS} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Optional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
