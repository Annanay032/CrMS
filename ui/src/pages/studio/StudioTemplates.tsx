import { useState } from 'react';
import { Card, Button, Input, Typography, Row, Col, Tag, Empty, Spin, Space, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faTrash, faCopy, faSearch, faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { useGetTemplatesQuery, useCreateTemplateMutation, useDeleteTemplateMutation } from '@/store/endpoints/content';
import styles from './StudioTemplates.module.scss';

const { Text, Title } = Typography;
const { TextArea } = Input;

export function StudioTemplates() {
  const { data, isLoading } = useGetTemplatesQuery(undefined);
  const [createTemplate, { isLoading: creating }] = useCreateTemplateMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newPlatform, setNewPlatform] = useState('');

  const templates = (data?.data ?? []) as Array<{
    id: string;
    title: string;
    body: string;
    platform?: string;
    category?: string;
    createdAt: string;
  }>;

  const filtered = templates.filter((t) => {
    const q = search.toLowerCase();
    return (t.title ?? '').toLowerCase().includes(q) ||
           (t.body ?? '').toLowerCase().includes(q);
  });

  const handleCreate = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    try {
      await createTemplate({ title: newTitle, body: newBody, platform: newPlatform || undefined }).unwrap();
      setNewTitle('');
      setNewBody('');
      setNewPlatform('');
      setShowCreate(false);
      message.success('Template created!');
    } catch {
      message.error('Failed to create template');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id).unwrap();
      message.success('Template deleted');
    } catch {
      message.error('Failed to delete');
    }
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    message.success('Copied to clipboard!');
  };

  return (
    <div className={styles.templates}>
      <div className={styles.templates__header}>
        <Space>
          <FontAwesomeIcon icon={faLayerGroup} style={{ color: '#6366f1' }} />
          <Title level={4} style={{ margin: 0 }}>Templates</Title>
        </Space>
        <Space>
          <Input
            prefix={<FontAwesomeIcon icon={faSearch} style={{ color: '#94a3b8' }} />}
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<FontAwesomeIcon icon={faPlus} />}
            onClick={() => setShowCreate(!showCreate)}
          >
            New Template
          </Button>
        </Space>
      </div>

      {showCreate && (
        <Card size="small" style={{ margin: '0 24px 16px' }}>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Input
              placeholder="Template title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <TextArea
              placeholder="Template body — use {platform}, {date}, {topic} as placeholders..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={4}
            />
            <Space>
              <Button type="primary" onClick={handleCreate} loading={creating} disabled={!newTitle.trim() || !newBody.trim()}>
                Save Template
              </Button>
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
            </Space>
          </Space>
        </Card>
      )}

      <div className={styles.templates__grid}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin />
          </div>
        ) : filtered.length === 0 ? (
          <Empty description="No templates yet" />
        ) : (
          <Row gutter={[16, 16]} style={{ padding: '0 24px' }}>
            {filtered.map((t) => (
              <Col xs={24} sm={12} lg={8} key={t.id}>
                <Card
                  size="small"
                  hoverable
                  title={<Text strong>{t.title}</Text>}
                  extra={
                    <Space size={4}>
                      <Button
                        type="text"
                        size="small"
                        icon={<FontAwesomeIcon icon={faCopy} />}
                        onClick={() => handleCopy(t.body)}
                      />
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<FontAwesomeIcon icon={faTrash} />}
                        onClick={() => handleDelete(t.id)}
                      />
                    </Space>
                  }
                >
                  <Text type="secondary" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>
                    {t.body.length > 150 ? `${t.body.slice(0, 150)}...` : t.body}
                  </Text>
                  {t.platform && (
                    <div style={{ marginTop: 8 }}>
                      <Tag color="blue">{t.platform}</Tag>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}
