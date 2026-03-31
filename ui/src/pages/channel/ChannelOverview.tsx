import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Statistic, Tag, Table, Typography, Skeleton, Space, Empty } from 'antd';
import {
  EyeOutlined, HeartOutlined, MessageOutlined, ShareAltOutlined,
  BookOutlined, PlayCircleOutlined, FileTextOutlined,
  ClockCircleOutlined, EditOutlined,
} from '@ant-design/icons';
import { useGetChannelOverviewQuery } from '@/store/endpoints/channels';
import { STATUS_COLORS } from '@/pages/content/constants';
import type { ContentPost } from '@/types';

const { Text } = Typography;

export function ChannelOverview() {
  const { platform } = useParams<{ platform: string }>();
  const { data: res, isLoading } = useGetChannelOverviewQuery(platform ?? '', { skip: !platform });
  const overview = res?.data;

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;
  if (!overview) return <Empty description="No data available" />;

  const { stats, analytics, recentPosts } = overview;

  return (
    <div>
      {/* Post counts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Posts" value={stats.totalPosts} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Published" value={stats.publishedPosts} valueStyle={{ color: '#22c55e' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Scheduled" value={stats.scheduledPosts} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#8b5cf6' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Drafts" value={stats.draftPosts} prefix={<EditOutlined />} />
          </Card>
        </Col>
      </Row>

      {/* Aggregated analytics */}
      <Card title="Total Performance" size="small" style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={4}><Statistic title="Impressions" value={analytics.impressions} prefix={<EyeOutlined />} /></Col>
          <Col span={4}><Statistic title="Reach" value={analytics.reach} /></Col>
          <Col span={4}><Statistic title="Likes" value={analytics.likes} prefix={<HeartOutlined />} /></Col>
          <Col span={4}><Statistic title="Comments" value={analytics.comments} prefix={<MessageOutlined />} /></Col>
          <Col span={4}><Statistic title="Shares" value={analytics.shares} prefix={<ShareAltOutlined />} /></Col>
          <Col span={4}><Statistic title="Saves" value={analytics.saves} prefix={<BookOutlined />} /></Col>
          {analytics.videoViews > 0 && (
            <Col span={4}><Statistic title="Video Views" value={analytics.videoViews} prefix={<PlayCircleOutlined />} /></Col>
          )}
        </Row>
      </Card>

      {/* Recent posts */}
      <Card title="Recent Posts" size="small">
        <Table
          dataSource={recentPosts}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Caption',
              dataIndex: 'caption',
              key: 'caption',
              ellipsis: true,
              render: (caption: string, post: ContentPost) => (
                <Link to={`/posts/${post.id}?from=channel&platform=${platform?.toUpperCase()}`}>
                  {caption ? (caption.length > 60 ? caption.slice(0, 60) + '…' : caption) : <Text type="secondary">No caption</Text>}
                </Link>
              ),
            },
            { title: 'Type', dataIndex: 'postType', key: 'postType', width: 90, render: (t: string) => <Tag>{t}</Tag> },
            { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (s: string) => <Tag color={STATUS_COLORS[s]}>{s}</Tag> },
            {
              title: 'Likes',
              key: 'likes',
              width: 80,
              render: (_: unknown, r: ContentPost) => r.analytics?.likes ?? '—',
            },
            {
              title: 'Views',
              key: 'views',
              width: 80,
              render: (_: unknown, r: ContentPost) => r.analytics?.impressions ?? '—',
            },
            {
              title: 'Date',
              key: 'date',
              width: 120,
              render: (_: unknown, r: ContentPost) => {
                const d = r.publishedAt || r.scheduledAt || r.createdAt;
                return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              },
            },
          ]}
        />
        {recentPosts.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="posts">View all posts →</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
