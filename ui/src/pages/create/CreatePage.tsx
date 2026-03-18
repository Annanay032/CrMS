import { useState, useCallback } from 'react';
import { Card, Button, Typography, Input, Tag, Modal, Form, Select, Empty, Tooltip, Popconfirm } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faLightbulb, faRobot, faTrash, faEdit, faTags, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import {
  useGetIdeasQuery,
  useCreateIdeaMutation,
  useUpdateIdeaMutation,
  useDeleteIdeaMutation,
  useGetTagsQuery,
  useCreateTagMutation,
} from '@/store/endpoints/ideas';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import type { ContentIdea, IdeaStatus } from '@/types';
import { IDEA_COLUMNS, TAG_COLORS } from './constants';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export function CreatePage() {
  const { data: ideasResp, isLoading } = useGetIdeasQuery({ limit: 200 });
  const { data: tagsResp } = useGetTagsQuery();
  const [createIdea] = useCreateIdeaMutation();
  const [updateIdea] = useUpdateIdeaMutation();
  const [deleteIdea] = useDeleteIdeaMutation();
  const [createTag] = useCreateTagMutation();
  const [runAgent, { isLoading: aiLoading }] = useRunAgentMutation();

  const ideas = ideasResp?.data ?? [];
  const tags = tagsResp?.data ?? [];

  const [newIdeaModal, setNewIdeaModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [editIdea, setEditIdea] = useState<ContentIdea | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiResults, setAiResults] = useState<Array<{ title: string; body: string; suggestedTags?: string[] }>>([]);
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined);

  const [form] = Form.useForm();

  const getIdeasForColumn = useCallback(
    (status: string) => {
      let filtered = ideas.filter((i) => i.status === status);
      if (filterTag) {
        filtered = filtered.filter((i) => i.tags.some((t) => t.tag.id === filterTag));
      }
      return filtered;
    },
    [ideas, filterTag],
  );

  const handleCreateIdea = async (values: { title: string; body?: string; status?: IdeaStatus; tagIds?: string[] }) => {
    await createIdea({ ...values, status: values.status || 'SPARK' });
    form.resetFields();
    setNewIdeaModal(false);
  };

  const handleMoveIdea = async (idea: ContentIdea, newStatus: IdeaStatus) => {
    await updateIdea({ id: idea.id, data: { status: newStatus } });
  };

  const handleAiIdeate = async () => {
    if (!aiTopic.trim()) return;
    try {
      const result = await runAgent({ agentType: 'CONTENT_GENERATION', input: { action: 'ideate', topic: aiTopic, count: 5 } }).unwrap();
      const output = result.data?.output as { ideas?: Array<{ title: string; body: string; suggestedTags?: string[] }> };
      setAiResults(output?.ideas ?? []);
    } catch {
      setAiResults([]);
    }
  };

  const handleSaveAiIdea = async (aiIdea: { title: string; body: string }) => {
    await createIdea({ title: aiIdea.title, body: aiIdea.body, source: 'ai', status: 'SPARK' });
  };

  const handleEditIdea = (idea: ContentIdea) => {
    setEditIdea(idea);
    form.setFieldsValue({
      title: idea.title,
      body: idea.body,
      status: idea.status,
      tagIds: idea.tags.map((t) => t.tag.id),
    });
    setNewIdeaModal(true);
  };

  const handleUpdateIdea = async (values: { title: string; body?: string; status?: IdeaStatus; tagIds?: string[] }) => {
    if (!editIdea) return;
    await updateIdea({ id: editIdea.id, data: values });
    form.resetFields();
    setEditIdea(null);
    setNewIdeaModal(false);
  };

  const handleCreateQuickTag = async (name: string) => {
    const color = TAG_COLORS[tags.length % TAG_COLORS.length];
    await createTag({ name, color });
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Create</Title>
          <Text type="secondary">Your content scratchpad — ideas from spark to ready</Text>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<FontAwesomeIcon icon={faRobot} />} onClick={() => setAiModal(true)}>
            AI Ideate
          </Button>
          <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => { setEditIdea(null); form.resetFields(); setNewIdeaModal(true); }}>
            New Idea
          </Button>
        </div>
      </div>

      {/* Tag filter bar */}
      {tags.length > 0 && (
        <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <FontAwesomeIcon icon={faTags} style={{ color: '#64748b' }} />
          <Tag
            style={{ cursor: 'pointer' }}
            color={!filterTag ? 'blue' : undefined}
            onClick={() => setFilterTag(undefined)}
          >
            All
          </Tag>
          {tags.map((tag) => (
            <Tag
              key={tag.id}
              style={{ cursor: 'pointer' }}
              color={filterTag === tag.id ? tag.color : undefined}
              onClick={() => setFilterTag(filterTag === tag.id ? undefined : tag.id)}
            >
              {tag.name}
            </Tag>
          ))}
        </div>
      )}

      {/* Kanban board */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${IDEA_COLUMNS.length}, 1fr)`, gap: 16, minHeight: 400 }}>
        {IDEA_COLUMNS.map((col) => {
          const colIdeas = getIdeasForColumn(col.id);
          return (
            <div key={col.id} style={{ background: '#f8fafc', borderRadius: 12, padding: 12, minHeight: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                  <Text strong>{col.title}</Text>
                  <Tag>{colIdeas.length}</Tag>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colIdeas.length === 0 && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No ideas yet" style={{ margin: '20px 0' }} />
                )}
                {colIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    columns={IDEA_COLUMNS}
                    onMove={handleMoveIdea}
                    onEdit={handleEditIdea}
                    onDelete={deleteIdea}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New/Edit Idea Modal */}
      <Modal
        title={editIdea ? 'Edit Idea' : 'New Idea'}
        open={newIdeaModal}
        onCancel={() => { setNewIdeaModal(false); setEditIdea(null); form.resetFields(); }}
        footer={null}
        width={560}
      >
        <Form form={form} layout="vertical" onFinish={editIdea ? handleUpdateIdea : handleCreateIdea}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="What's the idea?" />
          </Form.Item>
          <Form.Item name="body" label="Details">
            <TextArea rows={4} placeholder="Flesh out the idea..." />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="SPARK">
            <Select options={IDEA_COLUMNS.map((c) => ({ value: c.id, label: c.title }))} />
          </Form.Item>
          <Form.Item name="tagIds" label="Tags">
            <Select
              mode="multiple"
              placeholder="Select or type to create tags"
              options={tags.map((t) => ({ value: t.id, label: t.name }))}
              onSearch={(val) => {
                if (val && !tags.find((t) => t.name.toLowerCase() === val.toLowerCase())) {
                  // will show as typed option
                }
              }}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editIdea ? 'Update Idea' : 'Create Idea'}
          </Button>
        </Form>
      </Modal>

      {/* AI Ideation Modal */}
      <Modal
        title={<><FontAwesomeIcon icon={faLightbulb} style={{ color: '#f59e0b', marginRight: 8 }} />AI Ideation</>}
        open={aiModal}
        onCancel={() => { setAiModal(false); setAiResults([]); setAiTopic(''); }}
        footer={null}
        width={640}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <Input
            placeholder="Enter a topic to brainstorm ideas about..."
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            onPressEnter={handleAiIdeate}
          />
          <Button type="primary" onClick={handleAiIdeate} loading={aiLoading}>
            Generate
          </Button>
        </div>

        {aiResults.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {aiResults.map((idea, i) => (
              <Card key={i} size="small" hoverable>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <Text strong>{idea.title}</Text>
                    <Paragraph type="secondary" style={{ margin: '4px 0 0', fontSize: 13 }}>
                      {idea.body}
                    </Paragraph>
                    {idea.suggestedTags && (
                      <div style={{ marginTop: 4 }}>
                        {idea.suggestedTags.map((tag) => (
                          <Tag key={tag} size="small">{tag}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="small" type="primary" onClick={() => handleSaveAiIdea(idea)}>
                    Save
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── Idea Card Component ────────────────────────────────────

function IdeaCard({
  idea,
  columns,
  onMove,
  onEdit,
  onDelete,
}: {
  idea: ContentIdea;
  columns: typeof IDEA_COLUMNS;
  onMove: (idea: ContentIdea, status: IdeaStatus) => void;
  onEdit: (idea: ContentIdea) => void;
  onDelete: (id: string) => void;
}) {
  const otherColumns = columns.filter((c) => c.id !== idea.status);

  return (
    <Card
      size="small"
      hoverable
      style={{ borderLeft: `3px solid ${columns.find((c) => c.id === idea.status)?.color ?? '#6366f1'}` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <FontAwesomeIcon icon={faGripVertical} style={{ color: '#cbd5e1', marginTop: 4, cursor: 'grab' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text strong style={{ display: 'block', marginBottom: 2 }}>{idea.title}</Text>
          {idea.body && (
            <Text type="secondary" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {idea.body}
            </Text>
          )}
          <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {idea.tags?.map((t) => (
              <Tag key={t.tag.id} color={t.tag.color} style={{ fontSize: 11, lineHeight: '18px', margin: 0 }}>
                {t.tag.name}
              </Tag>
            ))}
            {idea.source === 'ai' && (
              <Tag color="purple" style={{ fontSize: 11, lineHeight: '18px', margin: 0 }}>AI</Tag>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {/* Move actions */}
          <Tooltip title="Move to...">
            <Select
              size="small"
              variant="borderless"
              placeholder="→"
              style={{ width: 40 }}
              popupMatchSelectWidth={120}
              options={otherColumns.map((c) => ({ value: c.id, label: c.title }))}
              onChange={(val) => onMove(idea, val as IdeaStatus)}
              value={null as unknown as string}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<FontAwesomeIcon icon={faEdit} />} onClick={() => onEdit(idea)} />
          </Tooltip>
          <Popconfirm title="Delete this idea?" onConfirm={() => onDelete(idea.id)} okText="Delete" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<FontAwesomeIcon icon={faTrash} />} />
          </Popconfirm>
        </div>
      </div>
    </Card>
  );
}
