import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Table, Tag, Space, Button, Input, Select, Card, Typography, Tooltip } from 'antd';
import {
  SearchOutlined, EyeOutlined, EditOutlined,
  HeartOutlined, MessageOutlined, ShareAltOutlined,
} from '@ant-design/icons';
import { useGetChannelPostsQuery } from '@/store/endpoints/channels';
import { STATUS_COLORS, PLATFORM_POST_TYPES, POST_TYPE_OPTIONS } from '@/pages/content/constants';
import type { ContentPost } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

export function ChannelPosts() {
  const { platform } = useParams<{ platform: string }>();
  const navigate = useNavigate();
  const upper = platform?.toUpperCase() ?? '';
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [postType, setPostType] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useGetChannelPostsQuery({
    platform: upper,
    page,
    limit: 20,
    status,
    postType,
    search: search || undefined,
  }, { skip: !platform });

  const posts = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const typeOptions = PLATFORM_POST_TYPES[upper] ?? POST_TYPE_OPTIONS;

  const columns: ColumnsType<ContentPost> = [
    {
      title: 'Type', dataIndex: 'postType', key: 'postType', width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Caption', dataIndex: 'caption', key: 'caption', ellipsis: true,
      render: (caption: string, post: ContentPost) => (
        <Link to={`/posts/${post.id}?from=channel&platform=${upper}`}>
          {caption ? (caption.length > 80 ? caption.slice(0, 80) + '…' : caption) : <Text type="secondary">No caption</Text>}
        </Link>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: 'Analytics', key: 'analytics', width: 180,
      render: (_: unknown, post: ContentPost) => {
        const a = post.analytics;
        if (!a) return <Text type="secondary">—</Text>;
        return (
          <Space size={8}>
            <Tooltip title="Likes"><HeartOutlined /> {a.likes}</Tooltip>
            <Tooltip title="Comments"><MessageOutlined /> {a.comments}</Tooltip>
            <Tooltip title="Shares"><ShareAltOutlined /> {a.shares}</Tooltip>
          </Space>
        );
      },
    },
    {
      title: 'Date', key: 'date', width: 120,
      render: (_: unknown, post: ContentPost) => {
        const d = post.publishedAt || post.scheduledAt || post.createdAt;
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      },
    },
    {
      title: '', key: 'actions', width: 80,
      render: (_: unknown, post: ContentPost) => (
        <Space>
          <Link to={`/posts/${post.id}?from=channel&platform=${upper}`}><Button type="text" size="small" icon={<EyeOutlined />} /></Link>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/studio/compose?edit=${post.id}`)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Search captions..."
            prefix={<SearchOutlined />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={() => { setSearch(searchInput); setPage(1); }}
            style={{ width: 220 }}
            allowClear
            onClear={() => { setSearch(''); setSearchInput(''); setPage(1); }}
          />
          <Select
            placeholder="Status"
            allowClear
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'FAILED', label: 'Failed' },
            ]}
            style={{ width: 130 }}
          />
          <Select
            placeholder="Post Type"
            allowClear
            value={postType}
            onChange={(v) => { setPostType(v); setPage(1); }}
            options={typeOptions}
            style={{ width: 130 }}
          />
        </Space>
      </Card>

      <Table
        dataSource={posts}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="middle"
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `${t} posts`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
