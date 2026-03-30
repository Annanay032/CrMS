import { Outlet, NavLink, useParams, Navigate } from 'react-router-dom';
import { Typography, Space, Tag, Spin } from 'antd';
import {
  DashboardOutlined, UnorderedListOutlined, BarChartOutlined,
} from '@ant-design/icons';
import { useGetConnectedAccountsQuery } from '@/store/endpoints/accounts';

const { Title } = Typography;

const PLATFORM_META: Record<string, { label: string; icon: string; color: string }> = {
  INSTAGRAM: { label: 'Instagram', icon: '📷', color: '#E4405F' },
  YOUTUBE: { label: 'YouTube', icon: '▶️', color: '#FF0000' },
  TIKTOK: { label: 'TikTok', icon: '🎵', color: '#000000' },
  TWITTER: { label: 'X (Twitter)', icon: '𝕏', color: '#1DA1F2' },
  LINKEDIN: { label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  THREADS: { label: 'Threads', icon: '🧵', color: '#000000' },
  BLUESKY: { label: 'Bluesky', icon: '🦋', color: '#0085FF' },
  FACEBOOK: { label: 'Facebook', icon: '👤', color: '#1877F2' },
  PINTEREST: { label: 'Pinterest', icon: '📌', color: '#BD081C' },
  REDDIT: { label: 'Reddit', icon: '🔴', color: '#FF4500' },
};

const navItems = [
  { to: '', label: 'Overview', icon: <DashboardOutlined />, end: true },
  { to: 'posts', label: 'Posts', icon: <UnorderedListOutlined /> },
  { to: 'analytics', label: 'Analytics', icon: <BarChartOutlined /> },
];

export function ChannelLayout() {
  const { platform } = useParams<{ platform: string }>();
  const { data: acctData, isLoading } = useGetConnectedAccountsQuery();
  const upper = platform?.toUpperCase() ?? '';
  const meta = PLATFORM_META[upper];

  if (isLoading) return <div style={{ padding: 48, textAlign: 'center' }}><Spin size="large" /></div>;

  // Verify the channel is actually connected
  const connected = acctData?.data?.accounts?.some((a) => a.provider === upper);
  if (!connected) return <Navigate to="/settings" replace />;

  return (
    <div style={{ padding: '16px 24px' }}>
      {/* Channel Header */}
      <Space style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 28 }}>{meta?.icon ?? '📡'}</span>
        <Title level={3} style={{ margin: 0 }}>{meta?.label ?? upper}</Title>
        <Tag color="green">Connected</Tag>
      </Space>

      {/* Channel Sub-nav */}
      <nav style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#4f46e5' : '#64748b',
              background: isActive ? '#eef2ff' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s',
            })}
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
