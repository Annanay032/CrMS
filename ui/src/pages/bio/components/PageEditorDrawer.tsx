import { useState, useEffect } from 'react';
import {
  Drawer, Tabs, Form, Input, Select, Switch, Button, Space, Typography,
  List, Popconfirm, Tag, Modal, message,
} from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPen, faGripVertical, faEye, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import type { StartPage, StartPageLink } from '@/types';
import {
  useUpdatePageMutation,
  useAddLinkMutation,
  useUpdateLinkMutation,
  useDeleteLinkMutation,
} from '@/store/endpoints/startpages';
import { PagePreview } from './PagePreview';

const { Text } = Typography;

const THEME_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'bold', label: 'Bold' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'dark', label: 'Dark' },
];

interface PageEditorDrawerProps {
  page: StartPage | null;
  onClose: () => void;
}

export function PageEditorDrawer({ page, onClose }: PageEditorDrawerProps) {
  const [form] = Form.useForm();
  const [linkForm] = Form.useForm();
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<StartPageLink | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [updatePage, { isLoading: saving }] = useUpdatePageMutation();
  const [addLink, { isLoading: addingLink }] = useAddLinkMutation();
  const [updateLink] = useUpdateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();

  useEffect(() => {
    if (page) {
      form.setFieldsValue({
        title: page.title,
        slug: page.slug,
        bio: page.bio ?? '',
        theme: page.theme,
        published: page.published,
        seoTitle: page.seoTitle ?? '',
        seoDescription: page.seoDescription ?? '',
      });
    }
  }, [page, form]);

  const links = page?.links ?? [];

  const handleSave = async (values: Record<string, unknown>) => {
    if (!page) return;
    try {
      await updatePage({ id: page.id, data: values }).unwrap();
      message.success('Page saved');
    } catch {
      message.error('Failed to save');
    }
  };

  const handleLinkSubmit = async (values: Record<string, unknown>) => {
    if (!page) return;
    try {
      if (editingLink) {
        await updateLink({ pageId: page.id, linkId: editingLink.id, data: values }).unwrap();
      } else {
        await addLink({ pageId: page.id, data: values }).unwrap();
      }
      linkForm.resetFields();
      setLinkModalOpen(false);
      setEditingLink(null);
      message.success(editingLink ? 'Link updated' : 'Link added');
    } catch {
      message.error('Failed to save link');
    }
  };

  const openEditLink = (link: StartPageLink) => {
    setEditingLink(link);
    linkForm.setFieldsValue({
      title: link.title,
      url: link.url,
      icon: link.icon ?? '',
      isActive: link.isActive,
    });
    setLinkModalOpen(true);
  };

  const handleMoveLink = async (link: StartPageLink, direction: 'up' | 'down') => {
    if (!page) return;
    const newOrder = direction === 'up' ? link.sortOrder - 1 : link.sortOrder + 1;
    await updateLink({ pageId: page.id, linkId: link.id, data: { sortOrder: newOrder } });
  };

  return (
    <>
      <Drawer
        title={page?.title ?? 'Edit Page'}
        open={!!page}
        onClose={onClose}
        width={640}
        extra={
          <Space>
            <Button icon={<FontAwesomeIcon icon={faEye} />} onClick={() => setPreviewOpen(true)}>Preview</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>Save</Button>
          </Space>
        }
      >
        {page && (
          <Tabs
            items={[
              {
                key: 'design',
                label: 'Design',
                children: (
                  <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="slug" label="URL Slug" rules={[{ required: true }]}>
                      <Input addonBefore="/p/" />
                    </Form.Item>
                    <Form.Item name="bio" label="Bio">
                      <Input.TextArea rows={3} maxLength={500} showCount />
                    </Form.Item>
                    <Form.Item name="theme" label="Theme">
                      <Select options={THEME_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="published" label="Published" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'links',
                label: `Links (${links.length})`,
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button
                      type="dashed"
                      block
                      icon={<FontAwesomeIcon icon={faPlus} />}
                      onClick={() => { setEditingLink(null); linkForm.resetFields(); setLinkModalOpen(true); }}
                    >
                      Add Link
                    </Button>
                    <List
                      dataSource={links}
                      renderItem={(link: StartPageLink, index: number) => (
                        <List.Item
                          actions={[
                            <Button
                              key="up"
                              size="small"
                              type="text"
                              disabled={index === 0}
                              icon={<FontAwesomeIcon icon={faArrowUp} />}
                              onClick={() => handleMoveLink(link, 'up')}
                            />,
                            <Button
                              key="down"
                              size="small"
                              type="text"
                              disabled={index === links.length - 1}
                              icon={<FontAwesomeIcon icon={faArrowDown} />}
                              onClick={() => handleMoveLink(link, 'down')}
                            />,
                            <Button key="edit" size="small" type="text" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => openEditLink(link)} />,
                            <Popconfirm key="delete" title="Delete link?" onConfirm={() => deleteLink({ pageId: page.id, linkId: link.id })}>
                              <Button size="small" type="text" danger icon={<FontAwesomeIcon icon={faTrash} />} />
                            </Popconfirm>,
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<FontAwesomeIcon icon={faGripVertical} style={{ color: '#bfbfbf', marginTop: 4 }} />}
                            title={
                              <Space>
                                {link.title}
                                {!link.isActive && <Tag color="default">Hidden</Tag>}
                              </Space>
                            }
                            description={
                              <Space direction="vertical" size={0}>
                                <Text type="secondary" style={{ fontSize: 12 }}>{link.url}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>{link.clicks} clicks</Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </Space>
                ),
              },
              {
                key: 'seo',
                label: 'SEO',
                children: (
                  <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="seoTitle" label="SEO Title">
                      <Input maxLength={120} showCount />
                    </Form.Item>
                    <Form.Item name="seoDescription" label="SEO Description">
                      <Input.TextArea rows={2} maxLength={300} showCount />
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      {/* Add/Edit Link Modal */}
      <Modal
        title={editingLink ? 'Edit Link' : 'Add Link'}
        open={linkModalOpen}
        onCancel={() => { setLinkModalOpen(false); setEditingLink(null); linkForm.resetFields(); }}
        onOk={() => linkForm.submit()}
        confirmLoading={addingLink}
      >
        <Form form={linkForm} layout="vertical" onFinish={handleLinkSubmit} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="My Website" />
          </Form.Item>
          <Form.Item name="url" label="URL" rules={[{ required: true }, { type: 'url', message: 'Enter a valid URL' }]}>
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item name="icon" label="Icon (emoji or text)">
            <Input placeholder="🔗" maxLength={64} />
          </Form.Item>
          {editingLink && (
            <Form.Item name="isActive" label="Visible" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* Preview */}
      <Modal
        title="Page Preview"
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={420}
        style={{ top: 20 }}
      >
        {page && <PagePreview page={page} />}
      </Modal>
    </>
  );
}
