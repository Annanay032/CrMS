import { useState } from 'react';
import { Drawer, Button, List, Input, Tag, Empty, Typography, Space, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faPlus, faTrash, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useGetTemplatesQuery, useCreateTemplateMutation, useDeleteTemplateMutation } from '@/store/endpoints/content';
import type { ContentTemplate } from '@/types';

const { Text, Paragraph } = Typography;
const { Search } = Input;

interface TemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  onInsert: (template: ContentTemplate) => void;
  platform?: string;
  currentCaption?: string;
}

/**
 * Drawer for browsing, searching, creating, and inserting content templates.
 */
export function TemplateDrawer({
  open,
  onClose,
  onInsert,
  platform,
  currentCaption,
}: TemplateDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const { data, isLoading } = useGetTemplatesQuery(platform ? { platform } : undefined);
  const [createTemplate, { isLoading: creating }] = useCreateTemplateMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();

  const templates = data?.data ?? [];
  const filtered = searchQuery
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : templates;

  const handleSaveAsCurrent = async () => {
    if (!currentCaption || !newName) return;
    await createTemplate({
      name: newName,
      body: currentCaption,
      platform: platform || undefined,
      category: newCategory || 'general',
    });
    setShowCreate(false);
    setNewName('');
    setNewCategory('');
  };

  const CATEGORY_COLORS: Record<string, string> = {
    tip: 'blue',
    'how-to': 'green',
    'behind-the-scenes': 'purple',
    promotion: 'orange',
    general: 'default',
  };

  return (
    <Drawer
      title={
        <Space>
          <FontAwesomeIcon icon={faLayerGroup} />
          <span>Templates & Snippets</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={400}
      extra={
        <Button
          size="small"
          icon={<FontAwesomeIcon icon={faPlus} />}
          onClick={() => setShowCreate(true)}
          disabled={!currentCaption}
        >
          Save Current
        </Button>
      }
    >
      <Search
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: 16 }}
        allowClear
      />

      {showCreate && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>Save current caption as template</Text>
          <Input
            placeholder="Template name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Input
            placeholder="Category (e.g. tip, how-to, promotion)"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <Space>
            <Button type="primary" size="small" loading={creating} onClick={handleSaveAsCurrent} disabled={!newName}>
              Save
            </Button>
            <Button size="small" onClick={() => setShowCreate(false)}>Cancel</Button>
          </Space>
        </div>
      )}

      {filtered.length === 0 ? (
        <Empty description="No templates found" />
      ) : (
        <List
          loading={isLoading}
          dataSource={filtered}
          renderItem={(template) => (
            <List.Item
              style={{ cursor: 'pointer', padding: '8px 0' }}
              actions={[
                <Tooltip title="Insert into caption" key="insert">
                  <Button
                    type="text"
                    size="small"
                    icon={<FontAwesomeIcon icon={faArrowRight} />}
                    onClick={() => onInsert(template)}
                  />
                </Tooltip>,
                ...(!template.isGlobal
                  ? [
                      <Button
                        key="delete"
                        type="text"
                        danger
                        size="small"
                        icon={<FontAwesomeIcon icon={faTrash} style={{ fontSize: 11 }} />}
                        onClick={() => deleteTemplate(template.id)}
                      />,
                    ]
                  : []),
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{template.name}</Text>
                    <Tag color={CATEGORY_COLORS[template.category] ?? 'default'} style={{ fontSize: 10 }}>
                      {template.category}
                    </Tag>
                    {template.isGlobal && <Tag color="geekblue" style={{ fontSize: 10 }}>System</Tag>}
                  </Space>
                }
                description={
                  <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, margin: 0 }}>
                    {template.body}
                  </Paragraph>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
