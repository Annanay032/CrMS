import { useState } from 'react';
import { Button, Typography, Tag, Spin, Popconfirm, message, Space, Tooltip, Empty, Table, Switch } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLink, faRotate, faPlug, faTriangleExclamation, faPlus, faPause, faTrash } from '@fortawesome/free-solid-svg-icons';
import {
  useGetConnectedAccountsQuery,
  useLazyInitiateOAuthQuery,
  useDisconnectAccountMutation,
  useRefreshAccountTokenMutation,
  useTogglePauseAccountMutation,
} from '@/store/endpoints/accounts';
import type { ConnectedAccount, PlatformAvailability } from '@/store/endpoints/accounts';
import { ChannelConnectModal, CHANNEL_META } from './ChannelConnectModal';
import { InstagramConnectChoice } from './InstagramConnectChoice';
import { ManualConnectModal } from './ManualConnectModal';

const { Text } = Typography;

export function ConnectedAccounts() {
  const { data, isLoading } = useGetConnectedAccountsQuery();
  const [triggerOAuth] = useLazyInitiateOAuthQuery();
  const [disconnect, { isLoading: disconnecting }] = useDisconnectAccountMutation();
  const [refreshToken, { isLoading: refreshing }] = useRefreshAccountTokenMutation();
  const [togglePause, { isLoading: toggling }] = useTogglePauseAccountMutation();

  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [igChoiceOpen, setIgChoiceOpen] = useState(false);
  const [manualModalPlatform, setManualModalPlatform] = useState<string | null>(null);
  const [pendingPlatform, setPendingPlatform] = useState<PlatformAvailability | null>(null);

  const accounts = data?.data?.accounts ?? [];
  const platforms = data?.data?.platforms ?? [];

  const connectedProviders = accounts.map((a) => a.provider);

  const handleSelectPlatform = (platform: PlatformAvailability) => {
    setChannelModalOpen(false);

    if (platform.provider === 'INSTAGRAM') {
      if (platform.oauthConfigured) {
        // OAuth available — show Professional vs Personal choice
        setPendingPlatform(platform);
        setIgChoiceOpen(true);
      } else {
        // No OAuth — go straight to manual connect
        setManualModalPlatform('INSTAGRAM');
      }
      return;
    }

    initiateOAuth(platform.provider);
  };

  const handleManualConnect = (provider: string) => {
    setChannelModalOpen(false);
    setManualModalPlatform(provider);
  };

  const handleInstagramChoice = (type: 'professional' | 'personal') => {
    setIgChoiceOpen(false);
    if (!pendingPlatform) return;

    if (type === 'personal') {
      setManualModalPlatform('INSTAGRAM');
    } else {
      if (pendingPlatform.oauthConfigured) {
        initiateOAuth('INSTAGRAM');
      } else {
        setManualModalPlatform('INSTAGRAM');
      }
    }
    setPendingPlatform(null);
  };

  const initiateOAuth = async (provider: string) => {
    try {
      const result = await triggerOAuth(provider).unwrap();
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch {
      message.error('Failed to initiate connection. Try manual connect.');
      setManualModalPlatform(provider);
    }
  };

  const handleDisconnect = async (provider: string) => {
    try {
      await disconnect(provider).unwrap();
      const meta = CHANNEL_META[provider];
      message.success(`${meta?.label ?? provider} disconnected`);
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

  const handleTogglePause = async (provider: string) => {
    try {
      const result = await togglePause(provider).unwrap();
      const meta = CHANNEL_META[provider];
      message.success(`${meta?.label ?? provider} ${result.data?.paused ? 'paused' : 'resumed'}`);
    } catch {
      message.error('Failed to update channel status');
    }
  };

  if (isLoading) {
    return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;
  }

  const allPlatforms: PlatformAvailability[] = platforms.length > 0
    ? platforms
    : (['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'LINKEDIN', 'THREADS', 'BLUESKY', 'FACEBOOK', 'PINTEREST', 'MASTODON'] as const).map((p) => ({
        provider: p,
        oauthConfigured: false,
        manualConnectAvailable: true,
      }));

  const columns = [
    {
      title: 'Channel',
      dataIndex: 'provider',
      key: 'channel',
      render: (_: string, record: ConnectedAccount) => {
        const meta = CHANNEL_META[record.provider];
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: record.paused ? '#e2e8f0' : meta?.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: record.paused ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              <FontAwesomeIcon icon={meta?.icon ?? faPlug} style={{ color: '#fff', fontSize: 18 }} />
            </div>
            <div>
              <Text strong style={{ opacity: record.paused ? 0.5 : 1 }}>{meta?.label ?? record.provider}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.stats?.handle ?? `ID: ${record.providerAccountId}`}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_: unknown, record: ConnectedAccount) => {
        if (record.paused) {
          return <Tag color="default"><FontAwesomeIcon icon={faPause} style={{ marginRight: 4 }} />Paused</Tag>;
        }
        if (record.isExpired) {
          return <Tag color="red"><FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 4 }} />Expired</Tag>;
        }
        return <Tag color="green"><FontAwesomeIcon icon={faLink} style={{ marginRight: 4 }} />Active</Tag>;
      },
    },
    {
      title: 'Followers',
      key: 'followers',
      width: 110,
      render: (_: unknown, record: ConnectedAccount) =>
        record.stats?.followers
          ? <Text>{record.stats.followers.toLocaleString()}</Text>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Eng. Rate',
      key: 'er',
      width: 100,
      render: (_: unknown, record: ConnectedAccount) =>
        record.stats?.engagementRate
          ? <Text>{record.stats.engagementRate}%</Text>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Active',
      key: 'pause',
      width: 80,
      render: (_: unknown, record: ConnectedAccount) => (
        <Tooltip title={record.paused ? 'Resume channel' : 'Pause channel'}>
          <Switch
            size="small"
            checked={!record.paused}
            loading={toggling}
            onChange={() => handleTogglePause(record.provider)}
          />
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ConnectedAccount) => (
        <Space size={4}>
          {record.isExpired && (
            <Tooltip title="Refresh token">
              <Button
                size="small"
                type="text"
                icon={<FontAwesomeIcon icon={faRotate} />}
                onClick={() => handleRefresh(record.provider)}
                loading={refreshing}
              />
            </Tooltip>
          )}
          <Popconfirm
            title={`Delete ${CHANNEL_META[record.provider]?.label ?? record.provider}?`}
            description="This will permanently remove this channel and its data."
            onConfirm={() => handleDisconnect(record.provider)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete channel">
              <Button
                size="small"
                type="text"
                danger
                icon={<FontAwesomeIcon icon={faTrash} />}
                loading={disconnecting}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Text strong style={{ fontSize: 16 }}>Connected Channels</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 13 }}>
            {accounts.length} channel{accounts.length !== 1 ? 's' : ''} connected
          </Text>
        </div>
        <Button
          type="primary"
          icon={<FontAwesomeIcon icon={faPlus} style={{ marginRight: 6 }} />}
          onClick={() => setChannelModalOpen(true)}
        >
          Connect Channel
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Empty
          description="No channels connected yet"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: 48 }}
        >
          <Button type="primary" onClick={() => setChannelModalOpen(true)}>
            Connect Your First Channel
          </Button>
        </Empty>
      ) : (
        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="middle"
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      )}

      <ChannelConnectModal
        open={channelModalOpen}
        platforms={allPlatforms}
        connectedProviders={connectedProviders}
        onOAuthConnect={handleSelectPlatform}
        onManualConnect={handleManualConnect}
        onClose={() => setChannelModalOpen(false)}
      />

      <InstagramConnectChoice
        open={igChoiceOpen}
        onChoose={handleInstagramChoice}
        onBack={() => { setIgChoiceOpen(false); setChannelModalOpen(true); }}
      />

      <ManualConnectModal
        platform={manualModalPlatform}
        onClose={() => setManualModalPlatform(null)}
      />
    </>
  );
}
