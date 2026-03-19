import { useState } from 'react';
import { Card, Button, Typography, Tag, Spin, Popconfirm, message, Space, Tooltip } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram, faYoutube, faTiktok, faRedditAlien,
} from '@fortawesome/free-brands-svg-icons';
import {
  faLink, faLinkSlash, faRotate, faPlug, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  useGetConnectedAccountsQuery,
  useLazyInitiateOAuthQuery,
  useDisconnectAccountMutation,
  useRefreshAccountTokenMutation,
} from '@/store/endpoints/accounts';
import type { ConnectedAccount, PlatformAvailability } from '@/store/endpoints/accounts';
import { ManualConnectModal } from './ManualConnectModal';

const { Text } = Typography;

const PLATFORM_META: Record<string, { icon: IconDefinition; color: string; label: string }> = {
  INSTAGRAM: { icon: faInstagram, color: '#E4405F', label: 'Instagram' },
  YOUTUBE: { icon: faYoutube, color: '#FF0000', label: 'YouTube' },
  TIKTOK: { icon: faTiktok, color: '#000000', label: 'TikTok' },
  REDDIT: { icon: faRedditAlien, color: '#FF4500', label: 'Reddit' },
};

export function ConnectedAccounts() {
  const { data, isLoading } = useGetConnectedAccountsQuery();
  const [triggerOAuth] = useLazyInitiateOAuthQuery();
  const [disconnect, { isLoading: disconnecting }] = useDisconnectAccountMutation();
  const [refreshToken, { isLoading: refreshing }] = useRefreshAccountTokenMutation();
  const [manualModalPlatform, setManualModalPlatform] = useState<string | null>(null);

  const accounts = data?.data?.accounts ?? [];
  const platforms = data?.data?.platforms ?? [];

  const getAccount = (provider: string): ConnectedAccount | undefined =>
    accounts.find((a) => a.provider === provider);

  const handleConnect = async (platform: PlatformAvailability) => {
    if (platform.oauthConfigured) {
      try {
        const result = await triggerOAuth(platform.provider).unwrap();
        if (result.data?.url) {
          window.location.href = result.data.url;
        }
      } catch {
        message.error('Failed to initiate connection. Try manual connect.');
        setManualModalPlatform(platform.provider);
      }
    } else {
      setManualModalPlatform(platform.provider);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await disconnect(provider).unwrap();
      message.success(`${PLATFORM_META[provider]?.label ?? provider} disconnected`);
    } catch {
      message.error('Failed to disconnect account');
    }
  };

  const handleRefresh = async (provider: string) => {
    try {
      await refreshToken(provider).unwrap();
      message.success('Token refreshed');
    } catch {
      message.error('Token refresh failed. Try reconnecting.');
    }
  };

  if (isLoading) {
    return (
      <Card title="Connected Accounts">
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      </Card>
    );
  }

  const allPlatforms = platforms.length > 0
    ? platforms
    : (['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'REDDIT'] as const).map((p) => ({
        provider: p,
        oauthConfigured: false,
        manualConnectAvailable: true,
      }));

  return (
    <>
      <Card
        title={
          <Space>
            <FontAwesomeIcon icon={faPlug} style={{ color: '#6366f1' }} />
            Connected Accounts
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {allPlatforms.map((platform) => {
          const meta = PLATFORM_META[platform.provider];
          const account = getAccount(platform.provider);

          return (
            <div
              key={platform.provider}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 16,
                borderRadius: 10,
                background: account ? '#f0fdf4' : '#f8fafc',
                border: account
                  ? account.isExpired ? '1px solid #fecaca' : '1px solid #bbf7d0'
                  : '1px solid #e2e8f0',
                marginBottom: 10,
              }}
            >
              {/* Left side: icon + info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: account ? meta.color : '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FontAwesomeIcon
                    icon={meta.icon}
                    style={{ color: account ? '#fff' : '#94a3b8', fontSize: 20 }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Text strong style={{ fontSize: 15 }}>{meta.label}</Text>
                    {account && (
                      <Tag color="green" style={{ margin: 0 }}>
                        <FontAwesomeIcon icon={faLink} style={{ marginRight: 4 }} />
                        Connected
                      </Tag>
                    )}
                    {account?.isExpired && (
                      <Tag color="red" style={{ margin: 0 }}>
                        <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 4 }} />
                        Expired
                      </Tag>
                    )}
                  </div>
                  {account?.stats?.handle && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {account.stats.handle}
                      {account.stats.followers > 0 && (
                        <> · {account.stats.followers.toLocaleString()} followers · {account.stats.engagementRate}% ER</>
                      )}
                    </Text>
                  )}
                  {account && !account.stats?.handle && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      ID: {account.providerAccountId}
                    </Text>
                  )}
                  {!account && (
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {platform.oauthConfigured ? 'Connect via OAuth' : 'Connect with your handle'}
                    </Text>
                  )}
                </div>
              </div>

              {/* Right side: actions */}
              <Space size={8}>
                {account ? (
                  <>
                    {account.isExpired && (
                      <Tooltip title="Refresh token">
                        <Button
                          size="small"
                          icon={<FontAwesomeIcon icon={faRotate} />}
                          onClick={() => handleRefresh(platform.provider)}
                          loading={refreshing}
                        />
                      </Tooltip>
                    )}
                    <Popconfirm
                      title={`Disconnect ${meta.label}?`}
                      description="This will remove the linked account."
                      onConfirm={() => handleDisconnect(platform.provider)}
                      okText="Disconnect"
                      okButtonProps={{ danger: true }}
                    >
                      <Button
                        size="small"
                        danger
                        icon={<FontAwesomeIcon icon={faLinkSlash} />}
                        loading={disconnecting}
                      >
                        Disconnect
                      </Button>
                    </Popconfirm>
                  </>
                ) : (
                  <Button
                    type="primary"
                    size="small"
                    icon={<FontAwesomeIcon icon={faLink} />}
                    onClick={() => handleConnect(platform)}
                  >
                    Connect
                  </Button>
                )}
              </Space>
            </div>
          );
        })}
      </Card>

      <ManualConnectModal
        platform={manualModalPlatform}
        onClose={() => setManualModalPlatform(null)}
      />
    </>
  );
}
