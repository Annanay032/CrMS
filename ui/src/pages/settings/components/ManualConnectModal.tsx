import { useState } from 'react';
import { Modal, Form, Input, Typography, message } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faYoutube, faTiktok, faRedditAlien } from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useManualConnectMutation } from '@/store/endpoints/accounts';

const { Text } = Typography;

const PLATFORM_META: Record<string, { icon: IconDefinition; color: string; label: string; handlePlaceholder: string }> = {
  INSTAGRAM: { icon: faInstagram, color: '#E4405F', label: 'Instagram', handlePlaceholder: '@yourusername' },
  YOUTUBE: { icon: faYoutube, color: '#FF0000', label: 'YouTube', handlePlaceholder: 'YourChannelName' },
  TIKTOK: { icon: faTiktok, color: '#000000', label: 'TikTok', handlePlaceholder: '@yourusername' },
  REDDIT: { icon: faRedditAlien, color: '#FF4500', label: 'Reddit', handlePlaceholder: 'u/yourusername' },
};

interface ManualConnectModalProps {
  platform: string | null;
  onClose: () => void;
}

export function ManualConnectModal({ platform, onClose }: ManualConnectModalProps) {
  const [connect, { isLoading }] = useManualConnectMutation();
  const [handle, setHandle] = useState('');
  const [accessToken, setAccessToken] = useState('');

  if (!platform) return null;
  const meta = PLATFORM_META[platform];
  if (!meta) return null;

  const handleSubmit = async () => {
    const trimmed = handle.trim();
    if (!trimmed) {
      message.warning('Please enter your handle');
      return;
    }
    try {
      await connect({ platform, handle: trimmed, accessToken: accessToken.trim() || undefined }).unwrap();
      message.success(`${meta.label} account connected!`);
      setHandle('');
      setAccessToken('');
      onClose();
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      message.error(error?.data?.error ?? 'Failed to connect account');
    }
  };

  return (
    <Modal
      open
      title={
        <span>
          <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, marginRight: 10 }} />
          Connect {meta.label}
        </span>
      }
      okText="Connect Account"
      onOk={handleSubmit}
      onCancel={() => { setHandle(''); setAccessToken(''); onClose(); }}
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Enter your {meta.label} handle to link your account. If you have an API access token, you can add it for full platform integration.
      </Text>
      <Form layout="vertical">
        <Form.Item label="Handle / Username" required>
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={meta.handlePlaceholder}
            prefix={
              <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, opacity: 0.6 }} />
            }
          />
        </Form.Item>
        <Form.Item
          label="Access Token (optional)"
          extra="Provide an API token for automated publishing and analytics sync."
        >
          <Input.Password
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Paste your platform API token"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
