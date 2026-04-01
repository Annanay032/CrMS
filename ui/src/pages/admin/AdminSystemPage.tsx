import { Card, Typography, Row, Col, Statistic, Tag, List, Avatar, Spin, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShieldHalved, faUsers, faUserCheck, faUserXmark,
  faPeopleGroup, faNewspaper, faRobot, faPalette, faBuilding,
  faBriefcase, faUserShield,
} from '@fortawesome/free-solid-svg-icons';
import { useGetSystemStatsQuery } from '@/store/endpoints/admin';
import { getInitials } from '@/utils/format';

const { Title, Text } = Typography;

const ROLE_ICONS: Record<string, typeof faPalette> = {
  CREATOR: faPalette,
  BRAND: faBuilding,
  AGENCY: faBriefcase,
  ADMIN: faUserShield,
};

const ROLE_COLORS: Record<string, string> = {
  CREATOR: '#6366f1',
  BRAND: '#22c55e',
  AGENCY: '#a855f7',
  ADMIN: '#ef4444',
};

export function AdminSystemPage() {
  const { data, isLoading } = useGetSystemStatsQuery();
  const stats = data?.data;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 12, color: '#6366f1' }} />
          System Overview
        </Title>
        <Text type="secondary">Platform health, statistics, and recent activity</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title={<><FontAwesomeIcon icon={faUsers} style={{ marginRight: 6, color: '#6366f1' }} />Total Users</>}
              value={stats.totalUsers}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title={<><FontAwesomeIcon icon={faUserCheck} style={{ marginRight: 6, color: '#22c55e' }} />Active</>}
              value={stats.activeUsers}
              valueStyle={{ color: '#22c55e' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title={<><FontAwesomeIcon icon={faUserXmark} style={{ marginRight: 6, color: '#ef4444' }} />Inactive</>}
              value={stats.inactiveUsers}
              valueStyle={{ color: stats.inactiveUsers > 0 ? '#ef4444' : undefined }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title={<><FontAwesomeIcon icon={faPeopleGroup} style={{ marginRight: 6, color: '#a855f7' }} />Teams</>}
              value={stats.totalTeams}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title={<><FontAwesomeIcon icon={faNewspaper} style={{ marginRight: 6, color: '#f59e0b' }} />Posts</>}
              value={stats.totalPosts}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} lg={4}>
          <Card size="small">
            <Statistic
              title={<><FontAwesomeIcon icon={faRobot} style={{ marginRight: 6, color: '#0ea5e9' }} />Agent Tasks</>}
              value={stats.totalAgentTasks}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Users by Role" size="small">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {Object.entries(stats.roles).map(([role, count]) => (
                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 140 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${ROLE_COLORS[role] ?? '#64748b'}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FontAwesomeIcon icon={ROLE_ICONS[role] ?? faUsers} style={{ color: ROLE_COLORS[role] ?? '#64748b' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 18, lineHeight: 1 }}>{count}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>{role}</Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Signups" size="small">
            <List
              dataSource={stats.recentUsers}
              renderItem={(user) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ background: ROLE_COLORS[user.role] ?? '#6366f1' }}>{getInitials(user.name)}</Avatar>}
                    title={user.name}
                    description={
                      <Space size={4}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{user.email}</Text>
                        <Tag color={ROLE_COLORS[user.role] ?? 'default'} style={{ fontSize: 10 }}>{user.role}</Tag>
                      </Space>
                    }
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{new Date(user.createdAt).toLocaleDateString()}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="System Info" size="small" style={{ marginTop: 24 }}>
        <Row gutter={[16, 8]}>
          <Col span={8}><Text type="secondary">Platform</Text><br /><Text strong>CrMS v1.0</Text></Col>
          <Col span={8}><Text type="secondary">Environment</Text><br /><Tag color="blue">Development</Tag></Col>
          <Col span={8}><Text type="secondary">API Status</Text><br /><Tag color="green">Operational</Tag></Col>
        </Row>
      </Card>
    </div>
  );
}
