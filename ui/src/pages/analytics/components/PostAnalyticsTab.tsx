import { useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Typography, Input, Empty, Spin, List } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faHeart, faComment, faShare, faBookmark,
  faMousePointer, faIndianRupeeSign, faClock,
} from '@fortawesome/free-solid-svg-icons';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useGetPostAnalyticsQuery } from '@/store/endpoints/dashboard';
import type { PostAnalyticsDetail } from '@/store/endpoints/dashboard';

const { Text, Paragraph } = Typography;

export function PostAnalyticsTab() {
  const [postId, setPostId] = useState('');
  const [searchId, setSearchId] = useState('');
  const { data, isLoading } = useGetPostAnalyticsQuery(searchId, { skip: !searchId });
  const post: PostAnalyticsDetail | undefined = data?.data;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Input.Search
          placeholder="Enter Post ID to view detailed analytics"
          allowClear
          enterButton="Analyze"
          size="large"
          value={postId}
          onChange={(e) => setPostId(e.target.value)}
          onSearch={(val) => { if (val.trim()) setSearchId(val.trim()); }}
          style={{ maxWidth: 500 }}
        />
      </div>

      {!searchId && <Empty description="Search for a post by ID to see its analytics" />}
      {isLoading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}
      {searchId && !isLoading && !post && <Empty description="Post not found" />}

      {post && (
        <>
          {/* Post Info */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Paragraph strong style={{ margin: 0 }}>{post.caption?.slice(0, 120) || 'Untitled Post'}</Paragraph>
                <div style={{ marginTop: 4 }}>
                  <Tag color="blue">{post.platform}</Tag>
                  <Tag>{post.postType}</Tag>
                  <Tag color={post.status === 'PUBLISHED' ? 'green' : 'default'}>{post.status}</Tag>
                </div>
              </div>
              {post.publishedAt && (
                <Text type="secondary">{new Date(post.publishedAt).toLocaleDateString()}</Text>
              )}
            </div>
          </Card>

          {/* Metrics Grid */}
          {post.analytics && (
            <>
              <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic title="Impressions" value={post.analytics.impressions} prefix={<FontAwesomeIcon icon={faEye} />} />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic title="Reach" value={post.analytics.reach} />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic title="Likes" value={post.analytics.likes} prefix={<FontAwesomeIcon icon={faHeart} />} />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic title="Comments" value={post.analytics.comments} prefix={<FontAwesomeIcon icon={faComment} />} />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic title="Shares" value={post.analytics.shares} prefix={<FontAwesomeIcon icon={faShare} />} />
                  </Card>
                </Col>
                <Col xs={12} sm={8} md={6} lg={4}>
                  <Card size="small">
                    <Statistic title="Saves" value={post.analytics.saves} prefix={<FontAwesomeIcon icon={faBookmark} />} />
                  </Card>
                </Col>
                {post.analytics.clicks > 0 && (
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <Card size="small">
                      <Statistic title="Link Clicks" value={post.analytics.clicks} prefix={<FontAwesomeIcon icon={faMousePointer} />} />
                    </Card>
                  </Col>
                )}
                {post.analytics.videoViews > 0 && (
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <Card size="small">
                      <Statistic title="Video Views" value={post.analytics.videoViews} />
                    </Card>
                  </Col>
                )}
                {post.analytics.avgWatchTime > 0 && (
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <Card size="small">
                      <Statistic title="Avg Watch Time" value={`${Math.round(post.analytics.avgWatchTime)}s`} prefix={<FontAwesomeIcon icon={faClock} />} />
                    </Card>
                  </Col>
                )}
                {post.analytics.profileVisits > 0 && (
                  <Col xs={12} sm={8} md={6} lg={4}>
                    <Card size="small">
                      <Statistic title="Profile Visits" value={post.analytics.profileVisits} />
                    </Card>
                  </Col>
                )}
              </Row>

              {/* Engagement Bar Chart */}
              <Card title="Engagement Breakdown" size="small" style={{ marginBottom: 24 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={[
                    { name: 'Likes', value: post.analytics.likes },
                    { name: 'Comments', value: post.analytics.comments },
                    { name: 'Shares', value: post.analytics.shares },
                    { name: 'Saves', value: post.analytics.saves },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Engagement Rate */}
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="Engagement Rate"
                      value={post.analytics.reach > 0
                        ? (((post.analytics.likes + post.analytics.comments + post.analytics.shares) / post.analytics.reach) * 100).toFixed(2)
                        : 0}
                      suffix="%"
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card size="small">
                    <Statistic
                      title="Attributed Revenue"
                      value={post.attributedRevenue}
                      prefix={<FontAwesomeIcon icon={faIndianRupeeSign} />}
                      formatter={(v) => `₹${Number(v).toLocaleString()}`}
                    />
                  </Card>
                </Col>
                {post.analytics.estimatedRevenue != null && post.analytics.estimatedRevenue > 0 && (
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="Estimated Ad Revenue"
                        value={post.analytics.estimatedRevenue}
                        prefix={<FontAwesomeIcon icon={faIndianRupeeSign} />}
                        precision={2}
                      />
                    </Card>
                  </Col>
                )}
              </Row>
            </>
          )}

          {/* Recent Comments */}
          {post.recentComments.length > 0 && (
            <Card title="Recent Comments" size="small">
              <List
                dataSource={post.recentComments}
                renderItem={(c) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<><Text strong>{c.authorName || 'Anonymous'}</Text> <Tag>{c.type}</Tag></>}
                      description={c.content}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Text>
                  </List.Item>
                )}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
