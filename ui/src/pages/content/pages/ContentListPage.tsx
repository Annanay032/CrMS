import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Table, Tag, Space, Button, Input, Select, Tooltip, Checkbox, message,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, EditOutlined,
  HeartOutlined, MessageOutlined, ShareAltOutlined,
  AppstoreOutlined, UnorderedListOutlined, DeleteOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { useListPostsQuery, useBulkUpdatePostsMutation } from '@/store/endpoints/content';
import { STATUS_COLORS, PLATFORM_OPTIONS, POST_TYPE_OPTIONS } from '../constants';
import type { ContentPost } from '@/types';
import type { ColumnsType } from 'antd/es/table';
import s from '../styles/ContentList.module.scss';

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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [bulkUpdate] = useBulkUpdatePostsMutation();

  const { data, isLoading } = useListPostsQuery({
    page,
    limit: viewMode === 'grid' ? 24 : 20,
    platform,
    status,
    postType,
    search: search || undefined,
  });

  const posts = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(posts.map((p) => p.id));
  }, [posts]);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const handleBulkAction = async (action: 'delete' | 'status', newStatus?: string) => {
    if (!selectedIds.length) return;
    try {
      await bulkUpdate({ postIds: selectedIds, action, status: newStatus }).unwrap();
      message.success(`${selectedIds.length} posts updated`);
      setSelectedIds([]);
    } catch {
      message.error('Bulk action failed');
    }
  };

  const columns: ColumnsType<ContentPost> = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 110,
      render: (p: string) => (
        <Space size={4}>
          <span>{PLATFORM_ICONS[p] || ''}</span>
          <span>{p}</span>
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
          {caption ? (caption.length > 80 ? caption.slice(0, 80) + '…' : caption) : <span style={{ color: '#94a3b8' }}>No caption</span>}
        </Link>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (st: string) => <Tag color={STATUS_COLORS[st]}>{st}</Tag>,
    },
    {
      title: 'Hashtags',
      dataIndex: 'hashtags',
      key: 'hashtags',
      width: 160,
      render: (tags: string[]) => (
        <Space size={2} wrap>
          {tags.slice(0, 3).map((h) => <Tag key={h} color="blue" style={{ fontSize: 11 }}>#{h}</Tag>)}
          {tags.length > 3 && <span style={{ fontSize: 11, color: '#94a3b8' }}>+{tags.length - 3}</span>}
        </Space>
      ),
    },
    {
      title: 'Analytics',
      key: 'analytics',
      width: 160,
      render: (_: unknown, post: ContentPost) => {
        const a = post.analytics;
        if (!a) return <span style={{ color: '#94a3b8' }}>—</span>;
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
          : <span style={{ color: '#94a3b8' }}>—</span>,
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
    <div>
      <div className={s.page_header}>
        <div>
          <h1 className={s.page_title}>Content Library</h1>
          <p className={s.page_subtitle}>{total} posts total</p>
        </div>
        <div className={s.header_actions}>
          <div className={s.view_toggle}>
            <button
              className={`${s.view_toggle__btn} ${viewMode === 'list' ? s['view_toggle__btn--active'] : ''}`}
              onClick={() => setViewMode('list')}
            >
              <UnorderedListOutlined /> List
            </button>
            <button
              className={`${s.view_toggle__btn} ${viewMode === 'grid' ? s['view_toggle__btn--active'] : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <AppstoreOutlined /> Grid
            </button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/studio/compose')}>
            Create Post
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={s.filter_bar}>
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
      </div>

      {/* Bulk action bar */}
      {selectedIds.length > 0 && (
        <div className={s.bulk_bar}>
          <span className={s.bulk_bar__info}>
            {selectedIds.length} selected
            <Button type="link" size="small" onClick={selectAll}>Select all</Button>
            <Button type="link" size="small" onClick={clearSelection}>Clear</Button>
          </span>
          <div className={s.bulk_bar__actions}>
            <Button size="small" onClick={() => handleBulkAction('status', 'DRAFT')}>Move to Draft</Button>
            <Button size="small" onClick={() => handleBulkAction('status', 'SCHEDULED')}>Schedule</Button>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleBulkAction('delete')}>
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className={s.content_grid}>
          {posts.map((post) => (
            <div
              key={post.id}
              className={`${s.grid_card} ${selectedIds.includes(post.id) ? s['grid_card--selected'] : ''}`}
            >
              <div className={s.grid_card__select}>
                <Checkbox
                  checked={selectedIds.includes(post.id)}
                  onChange={() => toggleSelect(post.id)}
                />
              </div>
              <div className={s.grid_card__media} onClick={() => navigate(`/posts/${post.id}`)}>
                {(post.mediaUrls?.length ?? 0) > 0 ? (
                  <img src={post.mediaUrls![0]} alt="" />
                ) : (
                  <div className={s.grid_card__placeholder}>
                    <FileImageOutlined />
                  </div>
                )}
                <span className={s.grid_card__platform_badge}>
                  {PLATFORM_ICONS[post.platform] || post.platform.slice(0, 2)}
                </span>
              </div>
              <div className={s.grid_card__body}>
                <p className={s.grid_card__caption}>
                  {post.caption || 'No caption'}
                </p>
                <div className={s.grid_card__meta}>
                  <Tag color={STATUS_COLORS[post.status]}>{post.status}</Tag>
                  <Tag>{post.postType}</Tag>
                </div>
              </div>
              {post.analytics && (
                <div className={s.grid_card__stats}>
                  <span className={s.grid_card__stat}><HeartOutlined /> {post.analytics.likes}</span>
                  <span className={s.grid_card__stat}><MessageOutlined /> {post.analytics.comments}</span>
                  <span className={s.grid_card__stat}><ShareAltOutlined /> {post.analytics.shares}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Table
          dataSource={posts}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="middle"
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as string[]),
          }}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
            showTotal: (t) => `${t} posts`,
            showSizeChanger: false,
          }}
        />
      )}
    </div>
  );
}
