import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Skeleton, Empty, Select, Space } from 'antd';
import {
  HeartOutlined, MessageOutlined, ShareAltOutlined,
  RiseOutlined, TrophyOutlined, PlayCircleOutlined, FieldTimeOutlined,
  BookOutlined, LinkOutlined, DollarOutlined,
} from '@ant-design/icons';
import { useGetChannelAnalyticsQuery } from '@/store/endpoints/channels';
import type { ChannelAnalyticsData } from '@/store/endpoints/channels';

type TopPost = ChannelAnalyticsData['topPosts'][number];

const { Text } = Typography;

export function ChannelAnalytics() {
  const { platform } = useParams<{ platform: string }>();
  const [days, setDays] = useState(30);
  const { data: res, isLoading } = useGetChannelAnalyticsQuery(
    { platform: platform?.toUpperCase() ?? '', days },
    { skip: !platform },
  );
  const analytics = res?.data;

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (!analytics) return <Empty description="No analytics data" />;

  // Calculate totals from posts
  const totals = analytics.posts.reduce(
    (acc, p) => {
      if (p.analytics) {
        acc.impressions += p.analytics.impressions;
        acc.likes += p.analytics.likes;
        acc.comments += p.analytics.comments;
        acc.shares += p.analytics.shares;
        acc.saves += p.analytics.saves ?? 0;
        acc.clicks += p.analytics.clicks ?? 0;
        acc.videoViews += p.analytics.videoViews ?? 0;
        acc.totalWatchTime += p.analytics.avgWatchTime ?? 0;
        acc.watchTimeCount += (p.analytics.avgWatchTime ?? 0) > 0 ? 1 : 0;
        acc.estimatedRevenue += p.analytics.estimatedRevenue ?? 0;
      }
      return acc;
    },
    { impressions: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, videoViews: 0, totalWatchTime: 0, watchTimeCount: 0, estimatedRevenue: 0 },
  );

  const avgWatchTime = totals.watchTimeCount > 0
    ? Math.round(totals.totalWatchTime / totals.watchTimeCount)
    : 0;

  const engagement = totals.impressions > 0
    ? (((totals.likes + totals.comments + totals.shares) / totals.impressions) * 100).toFixed(2)
    : '0';

  return (
    <div>
      {/* Period selector */}
      <Space style={{ marginBottom: 16 }}>
        <Text strong>Period:</Text>
        <Select
          value={days}
          onChange={setDays}
          options={[
            { value: 7, label: 'Last 7 days' },
            { value: 14, label: 'Last 14 days' },
            { value: 30, label: 'Last 30 days' },
            { value: 90, label: 'Last 90 days' },
          ]}
          style={{ width: 160 }}
        />
      </Space>

      {/* Summary stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4} lg={3}>
          <Card size="small">
            <Statistic title="Views" value={totals.videoViews || totals.impressions} prefix={<PlayCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4} lg={3}>
          <Card size="small">
            <Statistic title="Likes" value={totals.likes} prefix={<HeartOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4} lg={3}>
          <Card size="small">
            <Statistic title="Comments" value={totals.comments} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4} lg={3}>
          <Card size="small">
            <Statistic title="Shares" value={totals.shares} prefix={<ShareAltOutlined />} />
          </Card>
        </Col>
        {totals.saves > 0 && (
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small">
              <Statistic title="Saves" value={totals.saves} prefix={<BookOutlined />} />
            </Card>
          </Col>
        )}
        {totals.clicks > 0 && (
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small">
              <Statistic title="Clicks" value={totals.clicks} prefix={<LinkOutlined />} />
            </Card>
          </Col>
        )}
        {avgWatchTime > 0 && (
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small">
              <Statistic title="Avg Watch Time" value={`${avgWatchTime}s`} prefix={<FieldTimeOutlined />} />
            </Card>
          </Col>
        )}
        {totals.estimatedRevenue > 0 && (
          <Col xs={12} sm={8} md={4} lg={3}>
            <Card size="small">
              <Statistic title="Est. Revenue" value={totals.estimatedRevenue} precision={2} prefix={<DollarOutlined />} />
            </Card>
          </Col>
        )}
        <Col xs={12} sm={8} md={4} lg={3}>
          <Card size="small">
            <Statistic title="Engagement" value={engagement} suffix="%" prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4} lg={3}>
          <Card size="small">
            <Statistic title="Posts" value={analytics.posts.length} />
          </Card>
        </Col>
      </Row>

      {/* Follower Trend */}
      {analytics.followerTrend.length > 0 && (
        <Card title="Follower Growth" size="small" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 24, overflowX: 'auto', padding: '8px 0' }}>
            {analytics.followerTrend.map((point, i) => (
              <div key={i} style={{ textAlign: 'center', minWidth: 70 }}>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{point.followers.toLocaleString()}</div>
                <Text style={{ fontSize: 11, color: point.growthRate > 0 ? '#22c55e' : '#ef4444' }}>
                  {point.growthRate > 0 ? '+' : ''}{point.growthRate.toFixed(2)}%
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Performing Posts */}
      <Card title={<><TrophyOutlined style={{ marginRight: 8 }} />Top Performing Posts</>} size="small">
        <Table<TopPost>
          dataSource={analytics.topPosts}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Caption', dataIndex: 'caption', key: 'caption', ellipsis: true,
              render: (caption, post) => (
                <Link to={`/posts/${post.id}`}>
                  {caption || <Text type="secondary">No caption</Text>}
                </Link>
              ),
            },
            { title: 'Type', dataIndex: 'postType', key: 'postType', width: 80, render: (t: string) => <Tag>{t}</Tag> },
            {
              title: 'Views', key: 'views', width: 90,
              render: (_, r) => (r.analytics?.videoViews || r.analytics?.impressions)?.toLocaleString() ?? '—',
            },
            {
              title: 'Likes', key: 'likes', width: 80,
              render: (_, r) => r.analytics?.likes?.toLocaleString() ?? '—',
            },
            {
              title: 'Comments', key: 'comments', width: 100,
              render: (_, r) => r.analytics?.comments?.toLocaleString() ?? '—',
            },
            {
              title: 'Shares', key: 'shares', width: 80,
              render: (_, r) => r.analytics?.shares?.toLocaleString() ?? '—',
            },
            {
              title: 'Saves', key: 'saves', width: 80,
              render: (_, r) => r.analytics?.saves?.toLocaleString() ?? '—',
            },
            {
              title: 'Published', key: 'publishedAt', width: 100,
              render: (_, r) =>
                r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
            },
          ]}
        />
      </Card>
    </div>
  );
}
