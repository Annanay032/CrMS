import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button, Tag, Spin, Empty, Descriptions, Table, Space, Input, Tabs, Card, Statistic,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faTag, faPen, faSave, faTimes, faHandshake,
} from '@fortawesome/free-solid-svg-icons';
import {
  useGetContactQuery,
  useUpdateContactMutation,
  useUpdateContactTagsMutation,
} from '@/store/endpoints/crm';
import type { CrmBrandDeal } from '@/types';
import s from './styles/Crm.module.scss';

const DEAL_STATUS_COLORS: Record<string, string> = {
  PROSPECT: 'default', CONTACTED: 'processing', LEAD: 'blue', NEGOTIATING: 'orange',
  CONFIRMED: 'cyan', IN_PROGRESS: 'geekblue', DELIVERED: 'lime', PAID: 'green',
  CANCELLED: 'red', LOST: 'volcano',
};

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getScoreClass(score: number) {
  if (score >= 70) return s['score_badge--high'];
  if (score >= 40) return s['score_badge--medium'];
  return s['score_badge--low'];
}

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetContactQuery(id!);
  const [updateContact, { isLoading: updating }] = useUpdateContactMutation();
  const [updateTags] = useUpdateContactTagsMutation();

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [tagInput, setTagInput] = useState('');

  const contact = data?.data;

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!contact) return <Empty description="Contact not found" />;

  const handleSaveNotes = async () => {
    await updateContact({ id: contact.id, notes: notesValue }).unwrap();
    setEditingNotes(false);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const newTags = [...(contact.tags || []), tagInput.trim()];
    await updateTags({ id: contact.id, tags: newTags }).unwrap();
    setTagInput('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = (contact.tags || []).filter((t) => t !== tagToRemove);
    await updateTags({ id: contact.id, tags: newTags }).unwrap();
  };

  const dealColumns = [
    { title: 'Brand', dataIndex: 'brandName', key: 'brandName' },
    {
      title: 'Value',
      dataIndex: 'dealValue',
      key: 'dealValue',
      render: (v: number) => `₹${v.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (st: string) => <Tag color={DEAL_STATUS_COLORS[st]}>{st.replace(/_/g, ' ')}</Tag>,
    },
    {
      title: 'Probability',
      dataIndex: 'probability',
      key: 'probability',
      width: 100,
      render: (p: number) => `${p ?? 0}%`,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
  ];

  const totalDealValue = (contact.brandDeals ?? []).reduce((acc: number, d: CrmBrandDeal) => acc + d.dealValue, 0);
  const wonDeals = (contact.brandDeals ?? []).filter((d: CrmBrandDeal) => d.status === 'PAID' || d.status === 'DELIVERED');

  return (
    <div>
      <div className={s.page_header}>
        <Button type="text" icon={<FontAwesomeIcon icon={faArrowLeft} />} onClick={() => navigate('/crm/contacts')}>
          Back to Contacts
        </Button>
      </div>

      <div className={s.detail_layout}>
        {/* Left: Profile Card */}
        <div>
          <div className={s.profile_card}>
            <div className={s.profile_avatar}>
              {contact.avatarUrl ? (
                <img src={contact.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                getInitials(contact.name)
              )}
            </div>
            <div className={s.profile_name}>{contact.name}</div>
            {contact.handle && <div className={s.profile_handle}>@{contact.handle} · {contact.platform}</div>}
            <Tag color={contact.type === 'BRAND' ? 'blue' : contact.type === 'CREATOR' ? 'purple' : 'default'}>
              {contact.type}
            </Tag>
            <div style={{ marginTop: 12 }}>
              <span className={`${s.score_badge} ${getScoreClass(contact.relationshipScore)}`}>
                Score: {contact.relationshipScore}
              </span>
            </div>

            <div className={s.profile_meta}>
              {contact.email && (
                <div className={s.profile_meta_item}>
                  <span className={s.profile_meta_label}>Email</span>
                  <span className={s.profile_meta_value}>{contact.email}</span>
                </div>
              )}
              <div className={s.profile_meta_item}>
                <span className={s.profile_meta_label}>Source</span>
                <span className={s.profile_meta_value}>{contact.source}</span>
              </div>
              <div className={s.profile_meta_item}>
                <span className={s.profile_meta_label}>Added</span>
                <span className={s.profile_meta_value}>{new Date(contact.createdAt).toLocaleDateString()}</span>
              </div>
              {contact.lastInteractionAt && (
                <div className={s.profile_meta_item}>
                  <span className={s.profile_meta_label}>Last Interaction</span>
                  <span className={s.profile_meta_value}>{new Date(contact.lastInteractionAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className={s.notes_area}>
              <div style={{ marginBottom: 8, fontWeight: 600 }}>
                <FontAwesomeIcon icon={faTag} style={{ marginRight: 6 }} /> Tags
              </div>
              <Space size={[4, 8]} wrap>
                {(contact.tags || []).map((tag) => (
                  <Tag key={tag} closable onClose={() => handleRemoveTag(tag)}>{tag}</Tag>
                ))}
              </Space>
              <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                <Input
                  size="small"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onPressEnter={handleAddTag}
                />
                <Button size="small" onClick={handleAddTag}>Add</Button>
              </Space.Compact>
            </div>

            {/* Notes */}
            <div className={s.notes_area}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600 }}>Notes</span>
                {editingNotes ? (
                  <Space size="small">
                    <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faSave} />} loading={updating} onClick={handleSaveNotes} />
                    <Button size="small" icon={<FontAwesomeIcon icon={faTimes} />} onClick={() => setEditingNotes(false)} />
                  </Space>
                ) : (
                  <Button size="small" type="text" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => { setNotesValue(contact.notes || ''); setEditingNotes(true); }} />
                )}
              </div>
              {editingNotes ? (
                <Input.TextArea rows={4} value={notesValue} onChange={(e) => setNotesValue(e.target.value)} />
              ) : (
                <p style={{ fontSize: 13, color: '#64748b', whiteSpace: 'pre-wrap' }}>
                  {contact.notes || 'No notes yet.'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Activity */}
        <div>
          <Tabs
            defaultActiveKey="deals"
            items={[
              {
                key: 'deals',
                label: (
                  <span>
                    <FontAwesomeIcon icon={faHandshake} style={{ marginRight: 6 }} />
                    Deals ({contact.brandDeals?.length ?? 0})
                  </span>
                ),
                children: (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
                      <Card size="small">
                        <Statistic title="Total Deals" value={contact.brandDeals?.length ?? 0} />
                      </Card>
                      <Card size="small">
                        <Statistic title="Total Value" value={totalDealValue} prefix="₹" />
                      </Card>
                      <Card size="small">
                        <Statistic title="Won/Delivered" value={wonDeals.length} valueStyle={{ color: '#22c55e' }} />
                      </Card>
                    </div>
                    {(contact.brandDeals?.length ?? 0) > 0 ? (
                      <Table
                        dataSource={contact.brandDeals}
                        columns={dealColumns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty description="No deals linked to this contact" />
                    )}
                  </div>
                ),
              },
              {
                key: 'overview',
                label: 'Details',
                children: (
                  <Descriptions bordered column={2} size="small">
                    <Descriptions.Item label="Name">{contact.name}</Descriptions.Item>
                    <Descriptions.Item label="Handle">{contact.handle || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{contact.email || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Platform">{contact.platform || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Type">{contact.type}</Descriptions.Item>
                    <Descriptions.Item label="Source">{contact.source}</Descriptions.Item>
                    <Descriptions.Item label="Relationship Score">{contact.relationshipScore}</Descriptions.Item>
                    <Descriptions.Item label="Created">{new Date(contact.createdAt).toLocaleDateString()}</Descriptions.Item>
                  </Descriptions>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
