import { useEffect } from 'react';
import { Card, Typography, message, InputNumber, Switch, Divider, Select, Input, Tag, Tabs } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGear, faUser, faPlug, faPaperPlane, faBell, faWandMagicSparkles,
  faShieldHalved, faCrown,
} from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from '@/hooks/store';
import { PageHeader } from '@/components/common';
import { ProfileForm } from './components/ProfileForm';
import { ConnectedAccounts } from './components/ConnectedAccounts';
import { CreatorProfileForm } from './components/CreatorProfileForm';
import { BrandProfileForm } from './components/BrandProfileForm';
import { PlanCard } from './components/PlanCard';
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation } from '@/store/endpoints/settings';

const { Text, Title } = Typography;

const TIMEZONE_OPTIONS = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
].map((tz) => ({ label: tz.replace(/_/g, ' '), value: tz }));

const AI_TONE_OPTIONS = [
  { label: 'Friendly', value: 'friendly' },
  { label: 'Professional', value: 'professional' },
  { label: 'Casual', value: 'casual' },
  { label: 'Witty', value: 'witty' },
  { label: 'Inspirational', value: 'inspirational' },
  { label: 'Educational', value: 'educational' },
];

const AI_LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'German', value: 'de' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Korean', value: 'ko' },
];

export function SettingsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    const connected = params.get('connected');
    const error = params.get('error');
    if (connected) {
      message.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} connected successfully!`);
      setParams({}, { replace: true });
    } else if (error) {
      const platform = params.get('platform') ?? '';
      message.error(`Connection failed${platform ? ` for ${platform}` : ''}. Please try again.`);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span><FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />Profile</span>
      ),
      children: (
        <>
          <ProfileForm />
          {user?.role === 'CREATOR' && <CreatorProfileForm />}
          {user?.role === 'BRAND' && <BrandProfileForm />}
        </>
      ),
    },
    {
      key: 'channels',
      label: (
        <span><FontAwesomeIcon icon={faPlug} style={{ marginRight: 8 }} />Channels</span>
      ),
      children: <ConnectedAccounts />,
    },
    {
      key: 'publishing',
      label: (
        <span><FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 8 }} />Publishing</span>
      ),
      children: <PublishingDefaults />,
    },
    {
      key: 'notifications',
      label: (
        <span><FontAwesomeIcon icon={faBell} style={{ marginRight: 8 }} />Notifications</span>
      ),
      children: <NotificationSettings />,
    },
    {
      key: 'ai',
      label: (
        <span><FontAwesomeIcon icon={faWandMagicSparkles} style={{ marginRight: 8 }} />AI</span>
      ),
      children: <AIPreferences />,
    },
    {
      key: 'privacy',
      label: (
        <span><FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: 8 }} />Privacy & Data</span>
      ),
      children: (
        <>
          <DataRefreshSettings />
          <PrivacySettings />
        </>
      ),
    },
    {
      key: 'plan',
      label: (
        <span><FontAwesomeIcon icon={faCrown} style={{ marginRight: 8 }} />Plan</span>
      ),
      children: <PlanCard />,
    },
  ];

  // If redirected from an OAuth callback, default to the Channels tab; if ?tab=plan, open Plan
  const defaultTab = params.get('tab') ?? (params.get('connected') || params.get('error') ? 'channels' : 'profile');

  return (
    <div>
      <PageHeader icon={faGear} title="Settings" />
      <Tabs
        defaultActiveKey={defaultTab}
        items={tabItems}
        tabPosition="left"
        style={{ minHeight: 600 }}
        tabBarStyle={{ width: 180, flexShrink: 0 }}
      />

      <div style={{ marginTop: 16, padding: '8px 0', textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          CrMS v2.0 · Account created {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
        </Text>
      </div>
    </div>
  );
}

/* ── Reusable row layout ─────────────────────────────────── */
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <div style={{ flex: 1 }}>
        <Text strong>{label}</Text>
        {description && <><br /><Text type="secondary" style={{ fontSize: 12 }}>{description}</Text></>}
      </div>
      <div style={{ marginLeft: 24, flexShrink: 0, minWidth: 220 }}>{children}</div>
    </div>
  );
}

/* ── Publishing Defaults ─────────────────────────────────── */
function PublishingDefaults() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const s = settingsRes?.data;

  return (
    <Card>
      <Title level={5} style={{ marginTop: 0 }}>Publishing Defaults</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingRow label="Default Platform" description="Pre-selected platform when creating posts">
          <Select
            style={{ width: '100%' }}
            value={s?.defaultPlatform ?? undefined}
            allowClear
            placeholder="None"
            onChange={(v) => updateSettings({ defaultPlatform: v ?? null })}
            options={[
              { label: 'Instagram', value: 'INSTAGRAM' },
              { label: 'YouTube', value: 'YOUTUBE' },
              { label: 'TikTok', value: 'TIKTOK' },
            ]}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Default Post Type" description="Pre-selected format for new content">
          <Select
            style={{ width: '100%' }}
            value={s?.defaultPostType ?? undefined}
            allowClear
            placeholder="None"
            onChange={(v) => updateSettings({ defaultPostType: v ?? null })}
            options={[
              { label: 'Reel / Short', value: 'REEL' },
              { label: 'Post / Image', value: 'POST' },
              { label: 'Story', value: 'STORY' },
              { label: 'Carousel', value: 'CAROUSEL' },
              { label: 'Video', value: 'VIDEO' },
            ]}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Timezone" description="Used for scheduling & analytics">
          <Select
            style={{ width: '100%' }}
            value={s?.timezone ?? 'UTC'}
            showSearch
            onChange={(v) => updateSettings({ timezone: v })}
            options={TIMEZONE_OPTIONS}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Default Hashtags" description="Automatically appended to posts">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            value={s?.defaultHashtags ?? []}
            placeholder="Add hashtags"
            onChange={(v) => updateSettings({ defaultHashtags: v })}
            tokenSeparators={[',', ' ']}
            tagRender={({ label, closable, onClose }) => (
              <Tag closable={closable} onClose={onClose} style={{ margin: 2 }}>#{label}</Tag>
            )}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Auto-Schedule" description="AI picks the best time to publish">
          <Switch
            checked={s?.autoSchedule ?? false}
            onChange={(v) => updateSettings({ autoSchedule: v })}
          />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ── Notification Settings ───────────────────────────────── */
function NotificationSettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const s = settingsRes?.data;

  return (
    <Card>
      <Title level={5} style={{ marginTop: 0 }}>Notifications</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingRow label="Email Digest" description="Receive a daily summary email">
          <Switch checked={s?.emailDigest ?? true} onChange={(v) => updateSettings({ emailDigest: v })} />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Push Notifications" description="Browser & mobile push alerts">
          <Switch checked={s?.pushNotifications ?? true} onChange={(v) => updateSettings({ pushNotifications: v })} />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="New Followers" description="Notify when you gain new followers">
          <Switch checked={s?.notifyNewFollower ?? true} onChange={(v) => updateSettings({ notifyNewFollower: v })} />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Mentions & Tags" description="Notify when you're mentioned or tagged">
          <Switch checked={s?.notifyMention ?? true} onChange={(v) => updateSettings({ notifyMention: v })} />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Campaign Updates" description="Notify on campaign status changes">
          <Switch checked={s?.notifyCampaignUpdate ?? true} onChange={(v) => updateSettings({ notifyCampaignUpdate: v })} />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Comment Replies" description="Notify when someone replies to your comment">
          <Switch checked={s?.notifyCommentReply ?? true} onChange={(v) => updateSettings({ notifyCommentReply: v })} />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ── AI Preferences ──────────────────────────────────────── */
function AIPreferences() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const s = settingsRes?.data;

  return (
    <Card>
      <Title level={5} style={{ marginTop: 0 }}>AI Preferences</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingRow label="Default AI Tone" description="Sets the voice for generated content & replies">
          <Select
            style={{ width: '100%' }}
            value={s?.aiTone ?? 'friendly'}
            onChange={(v) => updateSettings({ aiTone: v })}
            options={AI_TONE_OPTIONS}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="AI Language" description="Preferred language for AI-generated text">
          <Select
            style={{ width: '100%' }}
            value={s?.aiLanguage ?? 'en'}
            onChange={(v) => updateSettings({ aiLanguage: v })}
            options={AI_LANGUAGE_OPTIONS}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Auto-Suggest" description="AI proactively suggests content ideas & replies">
          <Switch checked={s?.aiAutoSuggest ?? true} onChange={(v) => updateSettings({ aiAutoSuggest: v })} />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ── Data Refresh ────────────────────────────────────────── */
function DataRefreshSettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const s = settingsRes?.data;

  return (
    <Card>
      <Title level={5} style={{ marginTop: 0 }}>Data Refresh Frequency</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingRow label="Social Listening" description="How many times per day to poll for mentions">
          <InputNumber
            min={1} max={24}
            value={s?.listeningFrequency ?? 1}
            onChange={(v) => v && updateSettings({ listeningFrequency: v })}
            addonAfter="/ day"
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Competitive Intel" description="How many times per day to refresh competitor data">
          <InputNumber
            min={1} max={24}
            value={s?.competitiveFrequency ?? 1}
            onChange={(v) => v && updateSettings({ competitiveFrequency: v })}
            addonAfter="/ day"
          />
        </SettingRow>
      </div>
    </Card>
  );
}

/* ── Privacy & Security ──────────────────────────────────── */
function PrivacySettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const s = settingsRes?.data;

  return (
    <Card style={{ marginTop: 16 }}>
      <Title level={5} style={{ marginTop: 0 }}>Privacy & Visibility</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SettingRow label="Profile Visibility" description="Who can see your CrMS profile">
          <Select
            style={{ width: '100%' }}
            value={s?.profileVisibility ?? 'public'}
            onChange={(v) => updateSettings({ profileVisibility: v })}
            options={[
              { label: 'Public', value: 'public' },
              { label: 'Connections Only', value: 'connections-only' },
              { label: 'Private', value: 'private' },
            ]}
          />
        </SettingRow>
        <Divider style={{ margin: 0 }} />
        <SettingRow label="Show Analytics" description="Display performance stats on your public profile">
          <Switch checked={s?.showAnalytics ?? true} onChange={(v) => updateSettings({ showAnalytics: v })} />
        </SettingRow>
      </div>
    </Card>
  );
}
