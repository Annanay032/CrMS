import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Table, Tag, Space, Button, Input, Select, Card, Typography, Tooltip,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  HeartOutlined, MessageOutlined, ShareAltOutlined,
} from '@ant-design/icons';
import { useListPostsQuery } from '@/store/endpoints/content';
import { STATUS_COLORS, PLATFORM_OPTIONS, POST_TYPE_OPTIONS } from './constants';
import type { ContentPost } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: '📷', YOUTUBE: '▶️', TIKTOK: '🎵', TWITTER: '𝕏',
  LINKEDIN: '💼', THREADS: '🧵', BLUESKY: '🦋', FACEBOOK: '👤',
  PINTEREST: '📌', REDDIT: '🔴',
};

export function ContentListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [postType, setPostType] = useState<string | undefined>();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useListPostsQuery({
    page,
    limit: 20,
    platform,
    status,
    postType,
    search: search || undefined,
  });

  const posts = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const columns: ColumnsType<ContentPost> = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 110,
      render: (p: string) => (
        <Space size={4}>
          <span>{PLATFORM_ICONS[p] || ''}</span>
          <Text>{p}</Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'postType',
      key: 'postType',
      width: 90,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    {
      title: 'Caption',
      dataIndex: 'caption',
      key: 'caption',
      ellipsis: true,
      render: (caption: string, post: ContentPost) => (
        <Link to={`/posts/${post.id}`}>
          <Text style={{ color: 'inherit' }}>
            {caption ? (caption.length > 80 ? caption.slice(0, 80) + '…' : caption) : <Text type="secondary">No caption</Text>}
          </Text>
        </Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: 'Hashtags',
      dataIndex: 'hashtags',
      key: 'hashtags',
      width: 160,
      render: (tags: string[]) => (
        <Space size={2} wrap>
          {tags.slice(0, 3).map((h) => <Tag key={h} color="blue" style={{ fontSize: 11 }}>#{h}</Tag>)}
          {tags.length > 3 && <Text type="secondary" style={{ fontSize: 11 }}>+{tags.length - 3}</Text>}
        </Space>
      ),
    },
    {
      title: 'Analytics',
      key: 'analytics',
      width: 160,
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
      title: 'Multi-Platform',
      key: 'bulkGroupId',
      width: 100,
      render: (_: unknown, post: ContentPost) =>
        post.bulkGroupId ? <Tag color="purple">Group</Tag> : null,
    },
    {
      title: 'Scheduled',
      key: 'scheduledAt',
      width: 140,
      render: (_: unknown, post: ContentPost) =>
        post.scheduledAt
          ? new Date(post.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : <Text type="secondary">—</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_: unknown, post: ContentPost) => (
        <Space>
          <Link to={`/posts/${post.id}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Link>
          <Button
            type="text" size="small" icon={<EditOutlined />}
            onClick={() => navigate(`/studio/compose?edit=${post.id}`)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={4} style={{ margin: 0 }}>Content Library</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/studio/compose')}>
          Create Post
        </Button>
      </Space>

      {/* Filters */}
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
            placeholder="Platform"
            allowClear
            value={platform}
            onChange={(v) => { setPlatform(v); setPage(1); }}
            options={PLATFORM_OPTIONS}
            style={{ width: 140 }}
          />
          <Select
            placeholder="Status"
            allowClear
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[
              { value: 'DRAFT', label: 'Draft' },
              { value: 'REVIEW', label: 'Review' },
              { value: 'APPROVED', label: 'Approved' },
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
            options={POST_TYPE_OPTIONS}
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
