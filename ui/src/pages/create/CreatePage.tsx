import { useState, useCallback, useMemo } from 'react';
import { Button, Input, Tag, Modal, Form, Select, Empty, Tooltip, Popconfirm } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faLightbulb, faRobot, faTrash, faEdit, faTags, faGripVertical, faPenToSquare, faSlidersH } from '@fortawesome/free-solid-svg-icons';
import {
  useGetIdeasQuery,
  useCreateIdeaMutation,
  useUpdateIdeaMutation,
  useDeleteIdeaMutation,
  useGetTagsQuery,
  useGetStagesQuery,
} from '@/store/endpoints/ideas';
import { useRunAgentMutation } from '@/store/endpoints/agents';
import { useNavigate } from 'react-router-dom';
import type { ContentIdea, IdeaStage } from '@/types';
import { StageManagerDrawer } from './components/StageManagerDrawer';
import s from './styles/Create.module.scss';

const { TextArea } = Input;

export function CreatePage() {
  const { data: ideasResp } = useGetIdeasQuery({ limit: 200 });
  const { data: tagsResp } = useGetTagsQuery();
  const { data: stagesResp } = useGetStagesQuery();
  const [createIdea] = useCreateIdeaMutation();
  const [updateIdea] = useUpdateIdeaMutation();
  const [deleteIdea] = useDeleteIdeaMutation();
  const [runAgent, { isLoading: aiLoading }] = useRunAgentMutation();
  const navigate = useNavigate();

  const ideas = useMemo(() => ideasResp?.data ?? [], [ideasResp?.data]);
  const tags = tagsResp?.data ?? [];
  const stages = stagesResp?.data ?? [];

  const [newIdeaModal, setNewIdeaModal] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [stageDrawer, setStageDrawer] = useState(false);
  const [editIdea, setEditIdea] = useState<ContentIdea | null>(null);
  const [aiTopic, setAiTopic] = useState('');
  const [aiResults, setAiResults] = useState<Array<{ title: string; body: string; suggestedTags?: string[] }>>([]);
  const [filterTag, setFilterTag] = useState<string | undefined>(undefined);

  const [form] = Form.useForm();

  const getIdeasForStage = useCallback(
    (stageId: string) => {
      let filtered = ideas.filter((i) => i.stageId === stageId);
      if (filterTag) {
        filtered = filtered.filter((i) => i.tags.some((t) => t.tag.id === filterTag));
      }
      return filtered;
    },
    [ideas, filterTag],
  );

  // Ideas with no stage (legacy or unassigned)
  const unstaged = ideas.filter((i) => !i.stageId);

  const handleCreateIdea = async (values: { title: string; body?: string; stageId?: string; tagIds?: string[] }) => {
    await createIdea({ ...values, stageId: values.stageId || stages[0]?.id });
    form.resetFields();
    setNewIdeaModal(false);
  };

  const handleMoveIdea = async (idea: ContentIdea, newStageId: string) => {
    await updateIdea({ id: idea.id, data: { stageId: newStageId } });
  };

  const handleAiIdeate = async () => {
    if (!aiTopic.trim()) return;
    try {
      const result = await runAgent({ agentType: 'CONTENT_GENERATION', input: { action: 'ideate', topic: aiTopic, count: 5 } }).unwrap();
      const output = (result.data as Record<string, unknown>)?.output as { ideas?: Array<{ title: string; body: string; suggestedTags?: string[] }> } | undefined;
      setAiResults(output?.ideas ?? []);
    } catch {
      setAiResults([]);
    }
  };

  const handleSaveAiIdea = async (aiIdea: { title: string; body: string }) => {
    await createIdea({ title: aiIdea.title, body: aiIdea.body, source: 'ai', stageId: stages[0]?.id });
  };

  const handleConvertToPost = (idea: ContentIdea) => {
    const caption = idea.body ? `${idea.title}\n\n${idea.body}` : idea.title;
    navigate(`/studio/compose?caption=${encodeURIComponent(caption)}`);
  };

  const handleConvertAiToPost = (aiIdea: { title: string; body: string }) => {
    const caption = aiIdea.body ? `${aiIdea.title}\n\n${aiIdea.body}` : aiIdea.title;
    navigate(`/studio/compose?caption=${encodeURIComponent(caption)}`);
  };

  const handleEditIdea = (idea: ContentIdea) => {
    setEditIdea(idea);
    form.setFieldsValue({
      title: idea.title,
      body: idea.body,
      stageId: idea.stageId,
      tagIds: idea.tags.map((t) => t.tag.id),
    });
    setNewIdeaModal(true);
  };

  const handleUpdateIdea = async (values: { title: string; body?: string; stageId?: string; tagIds?: string[] }) => {
    if (!editIdea) return;
    await updateIdea({ id: editIdea.id, data: values });
    form.resetFields();
    setEditIdea(null);
    setNewIdeaModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <div>
          <h1 className={s.page_title}>Create</h1>
          <p className={s.page_subtitle}>Your content scratchpad — ideas from spark to ready</p>
        </div>
        <div className={s.header_actions}>
          <Button icon={<FontAwesomeIcon icon={faSlidersH} />} onClick={() => setStageDrawer(true)}>
            Manage Stages
          </Button>
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
        <div className={s.tag_bar}>
          <FontAwesomeIcon icon={faTags} className={s.tag_bar__icon} />
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
      <div className={s.kanban_board} style={{ gridTemplateColumns: `repeat(${stages.length || 1}, 1fr)` }}>
        {stages.map((stage) => {
          const colIdeas = getIdeasForStage(stage.id);
          return (
            <div key={stage.id} className={s.kanban_column}>
              <div className={s.kanban_column__header}>
                <div className={s.kanban_column__title_row}>
                  <div className={s.kanban_column__dot} style={{ background: stage.color }} />
                  <span className={s.kanban_column__title}>{stage.name}</span>
                  <Tag>{colIdeas.length}</Tag>
                </div>
              </div>

              <div className={s.kanban_column__items}>
                {colIdeas.length === 0 && (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No ideas yet" className={s.empty_state} />
                )}
                {colIdeas.map((idea) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    stages={stages}
                    onMove={handleMoveIdea}
                    onEdit={handleEditIdea}
                    onDelete={deleteIdea}
                    onConvert={handleConvertToPost}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unstaged ideas (legacy) */}
      {unstaged.length > 0 && (
        <div className={s.kanban_column} style={{ marginTop: 16 }}>
          <div className={s.kanban_column__header}>
            <div className={s.kanban_column__title_row}>
              <div className={s.kanban_column__dot} style={{ background: '#94a3b8' }} />
              <span className={s.kanban_column__title}>Unsorted</span>
              <Tag>{unstaged.length}</Tag>
            </div>
          </div>
          <div className={s.kanban_column__items}>
            {unstaged.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                stages={stages}
                onMove={handleMoveIdea}
                onEdit={handleEditIdea}
                onDelete={deleteIdea}
                onConvert={handleConvertToPost}
              />
            ))}
          </div>
        </div>
      )}

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
          <Form.Item name="stageId" label="Stage" initialValue={stages[0]?.id}>
            <Select options={stages.map((st) => ({ value: st.id, label: st.name }))} />
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
        <div className={s.ai_input_row}>
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
          <div className={s.ai_results}>
            {aiResults.map((idea, i) => (
              <div key={i} className={s.ai_result_card}>
                <div className={s.ai_result_card__row}>
                  <div className={s.ai_result_card__content}>
                    <div className={s.ai_result_card__title}>{idea.title}</div>
                    <p className={s.ai_result_card__body}>{idea.body}</p>
                    {idea.suggestedTags && (
                      <div className={s.ai_result_card__tags}>
                        {idea.suggestedTags.map((tag) => (
                          <Tag key={tag}>{tag}</Tag>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={s.ai_result_card__actions}>
                    <Button size="small" onClick={() => handleSaveAiIdea(idea)}>Save</Button>
                    <Tooltip title="Open in Studio">
                      <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => handleConvertAiToPost(idea)} />
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <StageManagerDrawer open={stageDrawer} onClose={() => setStageDrawer(false)} />
    </div>
  );
}

// ─── Idea Card Component ────────────────────────────────────

function IdeaCard({
  idea,
  stages,
  onMove,
  onEdit,
  onDelete,
  onConvert,
}: {
  idea: ContentIdea;
  stages: IdeaStage[];
  onMove: (idea: ContentIdea, stageId: string) => void;
  onEdit: (idea: ContentIdea) => void;
  onDelete: (id: string) => void;
  onConvert: (idea: ContentIdea) => void;
}) {
  const otherStages = stages.filter((st) => st.id !== idea.stageId);
  const currentStage = stages.find((st) => st.id === idea.stageId);

  return (
    <div
      className={s.idea_card}
      style={{ borderLeft: `3px solid ${currentStage?.color ?? '#6366f1'}` }}
    >
      <div className={s.idea_card__row}>
        <FontAwesomeIcon icon={faGripVertical} className={s.idea_card__grip} />
        <div className={s.idea_card__content}>
          <div className={s.idea_card__title}>{idea.title}</div>
          {idea.body && (
            <p className={s.idea_card__body}>{idea.body}</p>
          )}
          <div className={s.idea_card__tags}>
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

        <div className={s.idea_card__actions}>
          <Tooltip title="Create Post">
            <Button type="text" size="small" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={() => onConvert(idea)} />
          </Tooltip>
          <Tooltip title="Move to...">
            <Select
              size="small"
              variant="borderless"
              placeholder="→"
              style={{ width: 40 }}
              popupMatchSelectWidth={120}
              options={otherStages.map((st) => ({ value: st.id, label: st.name }))}
              onChange={(val) => onMove(idea, val)}
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
    </div>
  );
}
