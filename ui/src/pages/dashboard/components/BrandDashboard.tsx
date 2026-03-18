import { Row, Col, Card, Tag, Typography, Spin, Empty } from 'antd';
import {
  faBullhorn, faUsers, faChartLine, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { StatCard } from '@/components/common';
import { useGetDashboardStatsQuery } from '@/store/endpoints/dashboard';
import { formatCurrency } from '@/utils/format';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default',
  ACTIVE: 'green',
  PAUSED: 'orange',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

export function BrandDashboard() {
  const { data, isLoading } = useGetDashboardStatsQuery();
  const stats = data?.data;

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const activeCampaigns = (stats?.activeCampaigns as number) ?? 0;
  const totalMatches = (stats?.totalMatches as number) ?? 0;
  const avgMatchScore = (stats?.avgMatchScore as number) ?? 0;
  const acceptedMatches = (stats?.acceptedMatches as number) ?? 0;
  const recentCampaigns = (stats?.recentCampaigns as Array<Record<string, unknown>>) ?? [];

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faBullhorn} label="Active Campaigns" value={String(activeCampaigns)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faUsers} label="Matched Creators" value={String(totalMatches)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faChartLine} label="Avg Match Score" value={String(avgMatchScore)} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard icon={faCheck} label="Accepted Matches" value={String(acceptedMatches)} />
        </Col>
      </Row>

      <Card title="Recent Campaigns">
        {recentCampaigns.length === 0 ? (
          <Empty description="No campaigns yet. Create your first!" />
        ) : (
          recentCampaigns.map((c) => (
            <div
              key={c.id as string}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <div>
                <Text strong>{c.title as string}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {((c._count as Record<string, number>)?.matches ?? 0)} creators matched
                  {c.budget ? ` · ${formatCurrency(c.budget as number)}` : ''}
                </Text>
              </div>
              <Tag color={STATUS_COLOR[c.status as string] ?? 'default'}>
                {c.status as string}
              </Tag>
            </div>
          ))
        )}
        <Link to="/campaigns" style={{ display: 'block', marginTop: 16, fontSize: 14, fontWeight: 500 }}>
          View all campaigns →
        </Link>
      </Card>
    </>
  );
}
