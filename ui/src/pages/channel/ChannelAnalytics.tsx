import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Row, Col, Statistic, Table, Tag, Typography, Skeleton, Empty, Select, Space } from 'antd';
import {
  EyeOutlined, HeartOutlined, MessageOutlined, ShareAltOutlined,
  RiseOutlined, TrophyOutlined,
} from '@ant-design/icons';
import { useGetChannelAnalyticsQuery } from '@/store/endpoints/channels';
import type { PostAnalytics } from '@/types';

const { Text, Title } = Typography;

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
      }
      return acc;
    },
    { impressions: 0, likes: 0, comments: 0, shares: 0 },
  );

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
        <Col span={4}>
          <Card size="small">
            <Statistic title="Total Impressions" value={totals.impressions} prefix={<EyeOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Total Likes" value={totals.likes} prefix={<HeartOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Total Comments" value={totals.comments} prefix={<MessageOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Total Shares" value={totals.shares} prefix={<ShareAltOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Engagement Rate" value={engagement} suffix="%" prefix={<RiseOutlined />} />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic title="Posts Published" value={analytics.posts.length} />
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
        <Table
          dataSource={analytics.topPosts}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Caption', dataIndex: 'caption', key: 'caption', ellipsis: true,
              render: (caption: string, post: { id: string }) => (
                <Link to={`/posts/${post.id}`}>
                  {caption || <Text type="secondary">No caption</Text>}
                </Link>
              ),
            },
            { title: 'Type', dataIndex: 'postType', key: 'postType', width: 80, render: (t: string) => <Tag>{t}</Tag> },
            {
              title: 'Impressions', key: 'impressions', width: 110,
              render: (_: unknown, r: { analytics?: PostAnalytics }) => r.analytics?.impressions?.toLocaleString() ?? '—',
            },
            {
              title: 'Likes', key: 'likes', width: 80,
              render: (_: unknown, r: { analytics?: PostAnalytics }) => r.analytics?.likes?.toLocaleString() ?? '—',
            },
            {
              title: 'Comments', key: 'comments', width: 100,
              render: (_: unknown, r: { analytics?: PostAnalytics }) => r.analytics?.comments?.toLocaleString() ?? '—',
            },
            {
              title: 'Shares', key: 'shares', width: 80,
              render: (_: unknown, r: { analytics?: PostAnalytics }) => r.analytics?.shares?.toLocaleString() ?? '—',
            },
            {
              title: 'Published', key: 'publishedAt', width: 100,
              render: (_: unknown, r: { publishedAt?: string }) =>
                r.publishedAt ? new Date(r.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
            },
          ]}
        />
      </Card>
    </div>
  );
}
