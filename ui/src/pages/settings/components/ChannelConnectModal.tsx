import { useState } from 'react';
import { Modal, Typography, Button, Space, Tag, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram, faYoutube, faTiktok, faXTwitter,
  faLinkedinIn, faThreads, faBluesky, faFacebookF,
  faPinterestP, faMastodon,
} from '@fortawesome/free-brands-svg-icons';
import { faArrowUpRightFromSquare, faKeyboard, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { PlatformAvailability } from '@/store/endpoints/accounts';

const { Text, Title } = Typography;

export interface ChannelMeta {
  icon: IconDefinition;
  color: string;
  bg: string;
  label: string;
  subtitle: string;
}

export const CHANNEL_META: Record<string, ChannelMeta> = {
  INSTAGRAM: { icon: faInstagram, color: '#E4405F', bg: '#fde8ee', label: 'Instagram', subtitle: 'Business, Creator, or Personal' },
  THREADS: { icon: faThreads, color: '#000000', bg: '#f0f0f0', label: 'Threads', subtitle: 'Connect via Meta' },
  LINKEDIN: { icon: faLinkedinIn, color: '#0A66C2', bg: '#e8f1fb', label: 'LinkedIn', subtitle: 'Page or Profile' },
  FACEBOOK: { icon: faFacebookF, color: '#1877F2', bg: '#e8f0fe', label: 'Facebook', subtitle: 'Page' },
  BLUESKY: { icon: faBluesky, color: '#0085FF', bg: '#e6f2ff', label: 'Bluesky', subtitle: 'Handle & App Password' },
  YOUTUBE: { icon: faYoutube, color: '#FF0000', bg: '#fee8e8', label: 'YouTube', subtitle: 'Channel' },
  TIKTOK: { icon: faTiktok, color: '#000000', bg: '#f0f0f0', label: 'TikTok', subtitle: 'Creator or Business' },
  MASTODON: { icon: faMastodon, color: '#6364FF', bg: '#ededff', label: 'Mastodon', subtitle: 'Any instance' },
  PINTEREST: { icon: faPinterestP, color: '#E60023', bg: '#fde8eb', label: 'Pinterest', subtitle: 'Business account' },
  TWITTER: { icon: faXTwitter, color: '#000000', bg: '#f0f0f0', label: 'X (Twitter)', subtitle: 'Profile' },
};

interface ChannelConnectModalProps {
  open: boolean;
  platforms: PlatformAvailability[];
  connectedProviders: string[];
  onOAuthConnect: (platform: PlatformAvailability) => void;
  onManualConnect: (provider: string) => void;
  onClose: () => void;
}

export function ChannelConnectModal({
  open,
  platforms,
  connectedProviders,
  onOAuthConnect,
  onManualConnect,
  onClose,
}: ChannelConnectModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformAvailability | null>(null);
  const available = platforms.filter((p) => !connectedProviders.includes(p.provider));

  const handleClose = () => {
    setSelectedPlatform(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedPlatform(null);
  };

  // ── Step 2: Connect method choice ──
  if (selectedPlatform) {
    const meta = CHANNEL_META[selectedPlatform.provider];
    const isManualOnly = selectedPlatform.provider === 'BLUESKY';

    return (
      <Modal
        open={open}
        title={
          <Space>
            <Button type="text" size="small" icon={<FontAwesomeIcon icon={faArrowLeft} />} onClick={handleBack} />
            Connect {meta?.label}
          </Space>
        }
        footer={null}
        onCancel={handleClose}
        width={480}
        destroyOnClose
      >
        <div style={{ textAlign: 'center', padding: '12px 0 24px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: meta?.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <FontAwesomeIcon icon={meta?.icon ?? faArrowUpRightFromSquare} style={{ color: meta?.color, fontSize: 28 }} />
          </div>
          <Title level={4} style={{ margin: '0 0 4px' }}>Connect {meta?.label}</Title>
          <Text type="secondary">Choose how you'd like to connect your account</Text>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* OAuth option */}
          {!isManualOnly && (
            <div
              onClick={() => {
                if (selectedPlatform.oauthConfigured) {
                  onOAuthConnect(selectedPlatform);
                } else {
                  message.warning({
                    content: `${meta?.label} OAuth requires API credentials. Configure them in your .env file to enable login redirect. Using manual connect instead.`,
                    duration: 5,
                  });
                  onManualConnect(selectedPlatform.provider);
                }
                setSelectedPlatform(null);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (selectedPlatform.oauthConfigured) {
                    onOAuthConnect(selectedPlatform);
                  } else {
                    message.warning(`${meta?.label} OAuth requires API credentials. Using manual connect.`);
                    onManualConnect(selectedPlatform.provider);
                  }
                  setSelectedPlatform(null);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 16,
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = meta?.color ?? '#6366f1';
                e.currentTarget.style.background = meta?.bg ?? '#f0f4ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: meta?.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} style={{ color: '#fff', fontSize: 16 }} />
              </div>
              <div style={{ flex: 1 }}>
                <Text strong>Login with {meta?.label}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {selectedPlatform.oauthConfigured
                    ? 'Securely connect via official OAuth — recommended'
                    : 'Requires API credentials in .env'}
                </Text>
              </div>
              {selectedPlatform.oauthConfigured ? (
                <Tag color="green" style={{ margin: 0 }}>Ready</Tag>
              ) : (
                <Tag color="orange" style={{ margin: 0 }}>Setup Required</Tag>
              )}
            </div>
          )}

          {/* Manual option */}
          <div
            onClick={() => {
              onManualConnect(selectedPlatform.provider);
              setSelectedPlatform(null);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') { onManualConnect(selectedPlatform.provider); setSelectedPlatform(null); } }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.background = '#f0f4ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = '#fff';
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#f0f4ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FontAwesomeIcon icon={faKeyboard} style={{ color: '#6366f1', fontSize: 16 }} />
            </div>
            <div style={{ flex: 1 }}>
              <Text strong>Connect Manually</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {isManualOnly
                  ? 'Enter your handle and app password'
                  : 'Enter your handle or API key'}
              </Text>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // ── Step 1: Platform grid ──
  return (
    <Modal
      open={open}
      title="Connect a New Channel"
      footer={null}
      onCancel={handleClose}
      width={640}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Select a platform to connect your account.
      </Text>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        {available.map((platform) => {
          const meta = CHANNEL_META[platform.provider];
          if (!meta) return null;

          return (
            <div
              key={platform.provider}
              onClick={() => setSelectedPlatform(platform)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedPlatform(platform); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 12px',
                borderRadius: 12,
                border: '1px solid #e5e7eb',
                background: '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = meta.color;
                e.currentTarget.style.background = meta.bg;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: meta.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, fontSize: 22 }} />
              </div>
              <Text strong style={{ fontSize: 14 }}>{meta.label}</Text>
              <Text type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
                {meta.subtitle}
              </Text>
            </div>
          );
        })}
      </div>

      {available.length === 0 && (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Text type="secondary">All available channels are connected!</Text>
        </div>
      )}
    </Modal>
  );
}
