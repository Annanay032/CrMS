import { Row, Col, Card, Tag, Typography, Spin, Empty } from 'antd';
import {
  faUsers, faChartLine, faCalendarDays, faBullhorn, faRobot, faArrowTrendUp, faComments,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { StatCard, AiInsightCard } from '@/components/common';
import { useGetDashboardStatsQuery } from '@/store/endpoints/dashboard';
import { formatNumber } from '@/utils/format';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'purple',
  DRAFT: 'default',
  PUBLISHED: 'green',
  REVIEW: 'orange',
};

export function CreatorDashboard() {
  const { data, isLoading } = useGetDashboardStatsQuery();
  const stats = data?.data;

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const totalFollowers = (stats?.totalFollowers as number) ?? 0;
  const avgEngagement = (stats?.avgEngagement as number) ?? 0;
  const scheduledPosts = (stats?.scheduledPosts as number) ?? 0;
  const activeCampaigns = (stats?.activeCampaigns as number) ?? 0;
  const growthRate = (stats?.growthRate as number) ?? 0;
  const pendingInteractions = (stats?.pendingInteractions as number) ?? 0;
  const recentPosts = (stats?.recentPosts as Array<Record<string, unknown>>) ?? [];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faUsers} label="Total Followers" value={formatNumber(totalFollowers)} change={growthRate ? `${growthRate > 0 ? '+' : ''}${growthRate}% growth` : undefined} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faChartLine} label="Engagement Rate" value={`${avgEngagement}%`} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faCalendarDays} label="Scheduled Posts" value={String(scheduledPosts)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faBullhorn} label="Active Campaigns" value={String(activeCampaigns)} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12}>
          <StatCard icon={faComments} label="Pending Replies" value={String(pendingInteractions)} />
        </Col>
        <Col xs={24} sm={12}>
          <StatCard icon={faArrowTrendUp} label="Follower Growth" value={growthRate ? `${growthRate > 0 ? '+' : ''}${growthRate}%` : '—'} />
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Posts">
            {recentPosts.length === 0 ? (
              <Empty description="No posts yet. Create your first!" />
            ) : (
              recentPosts.map((post) => (
                <div
                  key={post.id as string}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div>
                    <Text strong>{(post.caption as string)?.slice(0, 40) || 'Untitled'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {post.platform as string} · {post.postType as string}
                    </Text>
                  </div>
                  <Tag color={STATUS_COLOR[post.status as string] ?? 'default'}>
                    {post.status as string}
                  </Tag>
                </div>
              ))
            )}
            <Link to="/calendar" style={{ display: 'block', marginTop: 16, fontSize: 14, fontWeight: 500 }}>
              View full calendar →
            </Link>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <AiInsightCard
              icon={faRobot}
              label="AI Content Ideas"
              content="Generate AI-powered content ideas tailored to your niche and audience"
            />
            <AiInsightCard
              icon={faArrowTrendUp}
              label="Trending Now"
              content="Discover what's trending on your platforms right now"
              bg="#fdf2f8"
              border="#fce7f3"
              labelColor="#db2777"
            />
            <AiInsightCard
              icon={faCalendarDays}
              label="Schedule Optimization"
              content="Find the best times to post based on your audience activity"
              bg="#f0fdf4"
              border="#dcfce7"
              labelColor="#16a34a"
            />
            <Link to="/ai" style={{ display: 'block', marginTop: 16, fontSize: 14, fontWeight: 500 }}>
              Open AI Assistant →
            </Link>
          </Card>
        </Col>
      </Row>
    </>
  );
}
