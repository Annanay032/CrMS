import { Typography } from 'antd';
import { useAppSelector } from '@/hooks/store';
import { CreatorDashboard } from './components/CreatorDashboard';
import { BrandDashboard } from './components/BrandDashboard';

const { Title, Text } = Typography;

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Welcome back, {user?.name?.split(' ')[0]}</Title>
        <Text type="secondary">
          Here&apos;s what&apos;s happening with your {user?.role === 'BRAND' ? 'campaigns' : 'content'} today.
        </Text>
      </div>
      {user?.role === 'BRAND' ? <BrandDashboard /> : <CreatorDashboard />}
    </div>
  );
}
