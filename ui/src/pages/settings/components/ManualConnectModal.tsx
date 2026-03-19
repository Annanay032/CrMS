import { useState } from 'react';
import { Modal, Form, Input, Typography, message, Select } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInstagram, faYoutube, faTiktok, faRedditAlien, faXTwitter,
  faLinkedinIn, faThreads, faBluesky, faFacebookF, faPinterestP, faMastodon,
} from '@fortawesome/free-brands-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useManualConnectMutation } from '@/store/endpoints/accounts';

const { Text } = Typography;

interface PlatformFieldConfig {
  icon: IconDefinition;
  color: string;
  label: string;
  handlePlaceholder: string;
  handleLabel: string;
  tokenLabel?: string;
  tokenPlaceholder?: string;
  tokenRequired?: boolean;
  extraFields?: { key: string; label: string; placeholder: string; required?: boolean }[];
  helpText: string;
}

const PLATFORM_FIELDS: Record<string, PlatformFieldConfig> = {
  INSTAGRAM: {
    icon: faInstagram, color: '#E4405F', label: 'Instagram',
    handlePlaceholder: '@yourusername', handleLabel: 'Username',
    tokenLabel: 'Access Token', tokenPlaceholder: 'Paste your Instagram Graph API token',
    helpText: 'Enter your Instagram username. For full integration, provide a Graph API access token from Meta Developer Console.',
  },
  YOUTUBE: {
    icon: faYoutube, color: '#FF0000', label: 'YouTube',
    handlePlaceholder: 'YourChannelName', handleLabel: 'Channel Name or ID',
    tokenLabel: 'API Key', tokenPlaceholder: 'Your YouTube Data API key',
    helpText: 'Enter your YouTube channel name or ID. An API key enables analytics sync.',
  },
  TIKTOK: {
    icon: faTiktok, color: '#000000', label: 'TikTok',
    handlePlaceholder: '@yourusername', handleLabel: 'Username',
    tokenLabel: 'Access Token', tokenPlaceholder: 'TikTok API access token',
    helpText: 'Enter your TikTok username to link your account.',
  },
  TWITTER: {
    icon: faXTwitter, color: '#000000', label: 'X (Twitter)',
    handlePlaceholder: '@yourusername', handleLabel: 'Handle',
    tokenLabel: 'Bearer Token', tokenPlaceholder: 'Your Twitter API v2 bearer token',
    helpText: 'Enter your X handle. A bearer token enables automated posting and analytics.',
  },
  LINKEDIN: {
    icon: faLinkedinIn, color: '#0A66C2', label: 'LinkedIn',
    handlePlaceholder: 'your-profile-slug', handleLabel: 'Profile URL Slug',
    tokenLabel: 'Access Token', tokenPlaceholder: 'LinkedIn OAuth access token',
    helpText: 'Enter your LinkedIn profile slug (from linkedin.com/in/your-slug).',
  },
  THREADS: {
    icon: faThreads, color: '#000000', label: 'Threads',
    handlePlaceholder: '@yourusername', handleLabel: 'Username',
    tokenLabel: 'Access Token', tokenPlaceholder: 'Threads API access token',
    helpText: 'Enter your Threads username. This uses the same Meta platform as Instagram.',
  },
  BLUESKY: {
    icon: faBluesky, color: '#0085FF', label: 'Bluesky',
    handlePlaceholder: 'you.bsky.social', handleLabel: 'Handle',
    tokenLabel: 'App Password', tokenPlaceholder: 'Your Bluesky app password',
    tokenRequired: true,
    helpText: 'Bluesky uses the AT Protocol. Create an App Password at Settings > App Passwords in the Bluesky app.',
  },
  FACEBOOK: {
    icon: faFacebookF, color: '#1877F2', label: 'Facebook',
    handlePlaceholder: 'YourPageName', handleLabel: 'Page Name or ID',
    tokenLabel: 'Page Access Token', tokenPlaceholder: 'Long-lived page access token',
    helpText: 'Enter your Facebook Page name or ID. A page access token enables auto-posting.',
  },
  PINTEREST: {
    icon: faPinterestP, color: '#E60023', label: 'Pinterest',
    handlePlaceholder: 'yourusername', handleLabel: 'Username',
    tokenLabel: 'Access Token', tokenPlaceholder: 'Pinterest API access token',
    helpText: 'Enter your Pinterest username to link your business account.',
  },
  MASTODON: {
    icon: faMastodon, color: '#6364FF', label: 'Mastodon',
    handlePlaceholder: '@you@mastodon.social', handleLabel: 'Full Handle',
    tokenLabel: 'Access Token', tokenPlaceholder: 'Your Mastodon access token',
    extraFields: [
      { key: 'instanceUrl', label: 'Instance URL', placeholder: 'https://mastodon.social', required: true },
    ],
    helpText: 'Enter your full Mastodon handle including instance (e.g., @user@mastodon.social). Provide your instance URL for API access.',
  },
  REDDIT: {
    icon: faRedditAlien, color: '#FF4500', label: 'Reddit',
    handlePlaceholder: 'u/yourusername', handleLabel: 'Username',
    tokenLabel: 'API Token', tokenPlaceholder: 'Reddit API token',
    helpText: 'Enter your Reddit username to link your account.',
  },
};

interface ManualConnectModalProps {
  platform: string | null;
  onClose: () => void;
}

export function ManualConnectModal({ platform, onClose }: ManualConnectModalProps) {
  const [connect, { isLoading }] = useManualConnectMutation();
  const [handle, setHandle] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [extraValues, setExtraValues] = useState<Record<string, string>>({});

  if (!platform) return null;
  const meta = PLATFORM_FIELDS[platform];
  if (!meta) return null;

  const handleSubmit = async () => {
    const trimmed = handle.trim();
    if (!trimmed) {
      message.warning(`Please enter your ${meta.handleLabel.toLowerCase()}`);
      return;
    }
    if (meta.tokenRequired && !accessToken.trim()) {
      message.warning(`${meta.tokenLabel} is required for ${meta.label}`);
      return;
    }
    // Validate extra fields
    for (const field of meta.extraFields ?? []) {
      if (field.required && !extraValues[field.key]?.trim()) {
        message.warning(`Please enter ${field.label}`);
        return;
      }
    }
    try {
      await connect({
        platform,
        handle: trimmed,
        accessToken: accessToken.trim() || undefined,
        ...Object.fromEntries(
          Object.entries(extraValues).filter(([, v]) => v.trim())
        ),
      }).unwrap();
      message.success(`${meta.label} account connected!`);
      resetForm();
      onClose();
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      message.error(error?.data?.error ?? 'Failed to connect account');
    }
  };

  const resetForm = () => {
    setHandle('');
    setAccessToken('');
    setExtraValues({});
  };

  return (
    <Modal
      open
      title={
        <span>
          <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, marginRight: 10 }} />
          Connect {meta.label} Manually
        </span>
      }
      okText="Connect Account"
      onOk={handleSubmit}
      onCancel={() => { resetForm(); onClose(); }}
      confirmLoading={isLoading}
      destroyOnClose
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {meta.helpText}
      </Text>
      <Form layout="vertical">
        {meta.extraFields?.map((field) => (
          <Form.Item key={field.key} label={field.label} required={field.required}>
            <Input
              value={extraValues[field.key] ?? ''}
              onChange={(e) => setExtraValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
              placeholder={field.placeholder}
            />
          </Form.Item>
        ))}

        <Form.Item label={meta.handleLabel} required>
          <Input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder={meta.handlePlaceholder}
            prefix={
              <FontAwesomeIcon icon={meta.icon} style={{ color: meta.color, opacity: 0.6 }} />
            }
          />
        </Form.Item>

        {meta.tokenLabel && (
          <Form.Item
            label={`${meta.tokenLabel}${meta.tokenRequired ? '' : ' (optional)'}`}
            required={meta.tokenRequired}
            extra={!meta.tokenRequired ? 'Provide an API token for automated publishing and analytics sync.' : undefined}
          >
            <Input.Password
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder={meta.tokenPlaceholder}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
