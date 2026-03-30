import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card, Typography, Tag, Space, Row, Col, Statistic, Timeline, Avatar,
  Button, Descriptions, Image, Skeleton, Empty, Divider, Table, Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined, HeartOutlined,
  MessageOutlined, ShareAltOutlined, BookOutlined, LinkOutlined,
  PlayCircleOutlined, UserOutlined, EditOutlined,
} from '@ant-design/icons';
import { useGetPostQuery, useGetCrossplatformGroupQuery } from '@/store/endpoints/content';
import { STATUS_COLORS } from './constants';
import type { PostAnalytics, PostActivityLog, ContentPost } from '@/types';

const { Title, Text, Paragraph } = Typography;

const PLATFORM_ICONS: Record<string, string> = {
  INSTAGRAM: '📷', YOUTUBE: '▶️', TIKTOK: '🎵', TWITTER: '𝕏',
  LINKEDIN: '💼', THREADS: '🧵', BLUESKY: '🦋', FACEBOOK: '👤',
  PINTEREST: '📌', REDDIT: '🔴',
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'green', EDITED: 'blue', STATUS_CHANGED: 'orange',
  SCHEDULED: 'purple', PUBLISHED: 'green', FAILED: 'red',
  MEDIA_ADDED: 'cyan', MEDIA_REMOVED: 'magenta', CAPTION_EDITED: 'blue',
  HASHTAGS_UPDATED: 'geekblue', PLATFORM_ADAPTED: 'volcano',
  CLONED: 'lime', ARCHIVED: 'default', COMMENT_ADDED: 'gold',
};

function AnalyticsSection({ analytics }: { analytics: PostAnalytics }) {
  return (
    <Card title="Performance Analytics" size="small">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Statistic title="Impressions" value={analytics.impressions} prefix={<EyeOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Reach" value={analytics.reach} prefix={<UserOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Likes" value={analytics.likes} prefix={<HeartOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Comments" value={analytics.comments} prefix={<MessageOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Shares" value={analytics.shares} prefix={<ShareAltOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Saves" value={analytics.saves} prefix={<BookOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Clicks" value={analytics.clicks} prefix={<LinkOutlined />} />
        </Col>
        <Col span={6}>
          <Statistic title="Video Views" value={analytics.videoViews} prefix={<PlayCircleOutlined />} />
        </Col>
        {analytics.avgWatchTime > 0 && (
          <Col span={6}>
            <Statistic title="Avg Watch Time" value={analytics.avgWatchTime} suffix="s" />
          </Col>
        )}
        {analytics.profileVisits > 0 && (
          <Col span={6}>
            <Statistic title="Profile Visits" value={analytics.profileVisits} />
          </Col>
        )}
        {analytics.estimatedRevenue != null && (
          <Col span={6}>
            <Statistic title="Est. Revenue" value={analytics.estimatedRevenue} prefix="$" precision={2} />
          </Col>
        )}
      </Row>
      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
        Last fetched: {new Date(analytics.fetchedAt).toLocaleString()}
      </Text>
    </Card>
  );
}

function ActivityTimeline({ logs }: { logs: PostActivityLog[] }) {
  if (!logs.length) return <Empty description="No activity yet" />;

  return (
    <Card title="Activity History" size="small">
      <Timeline
        items={logs.map((log) => ({
          color: ACTION_COLORS[log.action] || 'gray',
          children: (
            <div>
              <Space size={4}>
                <Tag color={ACTION_COLORS[log.action] || 'default'}>{log.action.replace(/_/g, ' ')}</Tag>
                {log.user && (
                  <Text type="secondary">
                    <Avatar size={16} src={log.user.avatarUrl} icon={<UserOutlined />} style={{ marginRight: 4 }} />
                    {log.user.name}
                  </Text>
                )}
              </Space>
              {log.details && <div><Text type="secondary" style={{ fontSize: 12 }}>{log.details}</Text></div>}
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {new Date(log.createdAt).toLocaleString()}
                </Text>
              </div>
            </div>
          ),
        }))}
      />
    </Card>
  );
}

function CrossPlatformTable({ posts }: { posts: ContentPost[] }) {
  const columns = [
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (p: string) => <span>{PLATFORM_ICONS[p] || ''} {p}</span>,
    },
    { title: 'Type', dataIndex: 'postType', key: 'postType', render: (t: string) => <Tag>{t}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
    },
    {
      title: 'Impressions',
      key: 'impressions',
      render: (_: unknown, r: ContentPost) => r.analytics?.impressions ?? '—',
    },
    {
      title: 'Likes',
      key: 'likes',
      render: (_: unknown, r: ContentPost) => r.analytics?.likes ?? '—',
    },
    {
      title: 'Shares',
      key: 'shares',
      render: (_: unknown, r: ContentPost) => r.analytics?.shares ?? '—',
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, r: ContentPost) => (
        <Link to={`/posts/${r.id}`}>
          <Button size="small" type="link">View</Button>
        </Link>
      ),
    },
  ];

  return (
    <Card title="Cross-Platform Publishing" size="small">
      <Table dataSource={posts} columns={columns} rowKey="id" pagination={false} size="small" />
    </Card>
  );
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: postRes, isLoading } = useGetPostQuery(id!, { skip: !id });
  const post = postRes?.data;

  const { data: groupRes } = useGetCrossplatformGroupQuery(post?.bulkGroupId ?? '', {
    skip: !post?.bulkGroupId,
  });
  const groupPosts = groupRes?.data?.filter((p) => p.id !== post?.id) ?? [];

  if (isLoading) return <Skeleton active paragraph={{ rows: 12 }} />;
  if (!post) return <Empty description="Post not found" />;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back</Button>
        <Title level={4} style={{ margin: 0 }}>
          {PLATFORM_ICONS[post.platform] || ''} {post.platform} {post.postType}
        </Title>
        <Tag color={STATUS_COLORS[post.status]}>{post.status}</Tag>
        {post.bulkGroupId && (
          <Tooltip title="Part of a multi-platform publish">
            <Tag color="purple">Multi-Platform</Tag>
          </Tooltip>
        )}
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          onClick={() => navigate(`/studio/compose?edit=${post.id}`)}
        >
          Edit
        </Button>
      </Space>

      <Row gutter={[24, 24]}>
        {/* Left column: Post content */}
        <Col xs={24} lg={14}>
          <Card size="small">
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="Platform">
                {PLATFORM_ICONS[post.platform]} {post.platform}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag>{post.postType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(post.createdAt).toLocaleString()}
              </Descriptions.Item>
              {post.scheduledAt && (
                <Descriptions.Item label="Scheduled">
                  {new Date(post.scheduledAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {post.publishedAt && (
                <Descriptions.Item label="Published">
                  {new Date(post.publishedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {post.lastError && (
                <Descriptions.Item label="Last Error" span={2}>
                  <Text type="danger">{post.lastError}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Caption */}
          <Card title="Caption" size="small" style={{ marginTop: 16 }}>
            <Paragraph>{post.caption || <Text type="secondary">No caption</Text>}</Paragraph>
            {post.hashtags.length > 0 && (
              <Space wrap>
                {post.hashtags.map((h) => <Tag key={h} color="blue">#{h}</Tag>)}
              </Space>
            )}
            {post.firstComment && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Text type="secondary">First Comment:</Text>
                <Paragraph>{post.firstComment}</Paragraph>
              </>
            )}
          </Card>

          {/* Media */}
          {post.mediaUrls && post.mediaUrls.length > 0 && (
            <Card title="Media" size="small" style={{ marginTop: 16 }}>
              <Image.PreviewGroup>
                <Space wrap>
                  {post.mediaUrls.map((url, i) => (
                    <Image key={i} src={url} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 8 }} />
                  ))}
                </Space>
              </Image.PreviewGroup>
            </Card>
          )}

          {/* Analytics */}
          {post.analytics && (
            <div style={{ marginTop: 16 }}>
              <AnalyticsSection analytics={post.analytics} />
            </div>
          )}

          {/* Cross-platform */}
          {groupPosts.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <CrossPlatformTable posts={groupPosts} />
            </div>
          )}
        </Col>

        {/* Right column: Activity timeline */}
        <Col xs={24} lg={10}>
          <ActivityTimeline logs={post.activityLogs ?? []} />
        </Col>
      </Row>
    </div>
  );
}
