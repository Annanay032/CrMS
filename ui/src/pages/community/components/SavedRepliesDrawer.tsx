import { useState } from 'react';
import { Drawer, Button, Input, List, Tag, Typography, Space, Popconfirm, Form } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen } from '@fortawesome/free-solid-svg-icons';
import {
  useGetSavedRepliesQuery,
  useCreateSavedReplyMutation,
  useUpdateSavedReplyMutation,
  useDeleteSavedReplyMutation,
} from '@/store/endpoints/community';

const { Text, Paragraph } = Typography;

interface SavedRepliesDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SavedRepliesDrawer({ open, onClose }: SavedRepliesDrawerProps) {
  const { data, isLoading } = useGetSavedRepliesQuery();
  const [createReply, { isLoading: creating }] = useCreateSavedReplyMutation();
  const [updateReply] = useUpdateSavedReplyMutation();
  const [deleteReply] = useDeleteSavedReplyMutation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const replies = data?.data ?? [];

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const tags = values.tags ? values.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
    if (editingId) {
      await updateReply({ id: editingId, title: values.title, body: values.body, tags, shortcut: values.shortcut });
    } else {
      await createReply({ title: values.title, body: values.body, tags, shortcut: values.shortcut });
    }
    form.resetFields();
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (reply: { id: string; title: string; body: string; tags: string[]; shortcut?: string }) => {
    setEditingId(reply.id);
    form.setFieldsValue({ title: reply.title, body: reply.body, tags: reply.tags.join(', '), shortcut: reply.shortcut ?? '' });
    setShowForm(true);
  };

  return (
    <Drawer
      title="Saved Replies"
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Button type="primary" size="small" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => { setEditingId(null); form.resetFields(); setShowForm(true); }}>
          New
        </Button>
      }
    >
      {showForm && (
        <div style={{ marginBottom: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>
          <Form form={form} layout="vertical" size="small">
            <Form.Item name="title" label="Title" rules={[{ required: true }]}>
              <Input placeholder="e.g. Thank you reply" />
            </Form.Item>
            <Form.Item name="body" label="Reply body" rules={[{ required: true }]}>
              <Input.TextArea rows={3} placeholder="Thank you so much for your kind words! ❤️" />
            </Form.Item>
            <Form.Item name="tags" label="Tags (comma-separated)">
              <Input placeholder="thanks, positive" />
            </Form.Item>
            <Form.Item name="shortcut" label="Shortcut">
              <Input placeholder="/thanks" />
            </Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmit} loading={creating}>{editingId ? 'Update' : 'Create'}</Button>
              <Button onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
            </Space>
          </Form>
        </div>
      )}

      <List
        loading={isLoading}
        dataSource={replies}
        renderItem={(reply) => (
          <List.Item
            actions={[
              <Button size="small" type="text" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => handleEdit(reply)} />,
              <Popconfirm title="Delete this saved reply?" onConfirm={() => deleteReply(reply.id)}>
                <Button size="small" type="text" danger icon={<FontAwesomeIcon icon={faTrash} />} />
              </Popconfirm>,
            ]}
          >
            <List.Item.Meta
              title={
                <Space>
                  <Text strong>{reply.title}</Text>
                  {reply.shortcut && <Tag>{reply.shortcut}</Tag>}
                  <Text type="secondary" style={{ fontSize: 11 }}>used {reply.usageCount}x</Text>
                </Space>
              }
              description={
                <>
                  <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 4 }}>{reply.body}</Paragraph>
                  {reply.tags.map((t) => <Tag key={t} style={{ fontSize: 11 }}>{t}</Tag>)}
                </>
              }
            />
          </List.Item>
        )}
      />
    </Drawer>
  );
}
