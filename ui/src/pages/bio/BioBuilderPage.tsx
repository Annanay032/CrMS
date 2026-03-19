import { useState } from 'react';
import { Row, Col, Button, Spin, Empty, Form, Card, Space, Typography, Tag, Modal, Input, message, Popconfirm } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faPlus, faTrash, faPen, faEye, faChartLine } from '@fortawesome/free-solid-svg-icons';
import {
  useGetMyPagesQuery,
  useCreatePageMutation,
  useDeletePageMutation,
} from '@/store/endpoints/startpages';
import { PageHeader } from '@/components/common';
import type { StartPage } from '@/types';
import { PageEditorDrawer } from './components/PageEditorDrawer';
import { PageAnalyticsDrawer } from './components/PageAnalyticsDrawer';

const { Text, Paragraph } = Typography;

export function BioBuilderPage() {
  const { data, isLoading } = useGetMyPagesQuery();
  const [createPage, { isLoading: creating }] = useCreatePageMutation();
  const [deletePage] = useDeletePageMutation();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<StartPage | null>(null);
  const [analyticsPage, setAnalyticsPage] = useState<StartPage | null>(null);
  const [form] = Form.useForm();

  const pages: StartPage[] = data?.data ?? [];

  const handleCreate = async (values: { slug: string; title: string }) => {
    try {
      await createPage({ slug: values.slug, title: values.title }).unwrap();
      form.resetFields();
      setCreateOpen(false);
      message.success('Page created');
    } catch {
      message.error('Failed to create page — slug may be taken');
    }
  };

  return (
    <div>
      <PageHeader
        icon={faLink}
        title="Link-in-Bio Pages"
        extra={
          <Button type="primary" icon={<FontAwesomeIcon icon={faPlus} />} onClick={() => setCreateOpen(true)}>
            New Page
          </Button>
        }
      />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>
      ) : pages.length === 0 ? (
        <Empty description="No pages yet. Create your first link-in-bio page!" style={{ padding: 80 }} />
      ) : (
        <Row gutter={[16, 16]}>
          {pages.map((page) => (
            <Col key={page.id} xs={24} sm={12} lg={8}>
              <Card
                hoverable
                actions={[
                  <Button type="link" key="edit" icon={<FontAwesomeIcon icon={faPen} />} onClick={() => setEditing(page)}>
                    Edit
                  </Button>,
                  <Button type="link" key="analytics" icon={<FontAwesomeIcon icon={faChartLine} />} onClick={() => setAnalyticsPage(page)}>
                    Analytics
                  </Button>,
                  <Popconfirm key="delete" title="Delete this page?" onConfirm={() => deletePage(page.id)}>
                    <Button type="link" danger icon={<FontAwesomeIcon icon={faTrash} />}>Delete</Button>
                  </Popconfirm>,
                ]}
              >
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text strong style={{ fontSize: 16 }}>{page.title}</Text>
                    <Tag color={page.published ? 'success' : 'default'}>{page.published ? 'Published' : 'Draft'}</Tag>
                  </Space>
                  <Text type="secondary" copyable={{ text: `/p/${page.slug}` }}>
                    <FontAwesomeIcon icon={faLink} style={{ marginRight: 4 }} />
                    /p/{page.slug}
                  </Text>
                  {page.bio && <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ margin: 0 }}>{page.bio}</Paragraph>}
                  <Space>
                    <Tag>{page.links?.length ?? 0} links</Tag>
                    <Tag>Theme: {page.theme}</Tag>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Modal */}
      <Modal
        title="Create New Page"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Page Title" rules={[{ required: true }]}>
            <Input placeholder="My Link Page" />
          </Form.Item>
          <Form.Item
            name="slug"
            label="URL Slug"
            rules={[
              { required: true },
              { pattern: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, message: 'Lowercase letters, numbers, and hyphens only' },
            ]}
          >
            <Input addonBefore="/p/" placeholder="my-page" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Editor Drawer */}
      <PageEditorDrawer page={editing} onClose={() => setEditing(null)} />

      {/* Analytics Drawer */}
      <PageAnalyticsDrawer page={analyticsPage} onClose={() => setAnalyticsPage(null)} />
    </div>
  );
}
