import { useEffect, useState } from 'react';
import { message, InputNumber, Switch, Select, Tag, Table, Empty } from 'antd';
import { useSearchParams } from 'react-router-dom';
import {
  UserOutlined,
  ApiOutlined,
  SendOutlined,
  BellOutlined,
  ExperimentOutlined,
  LockOutlined,
  CrownOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAppSelector } from '@/hooks/store';
import { ProfileForm } from './components/ProfileForm';
import { ConnectedAccounts } from './components/ConnectedAccounts';
import { CreatorProfileForm } from './components/CreatorProfileForm';
import { BrandProfileForm } from './components/BrandProfileForm';
import { PlanCard } from './components/PlanCard';
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation } from '@/store/endpoints/settings';
import { useGetPaymentHistoryQuery } from '@/store/endpoints/subscription';
import type { PaymentTransaction } from '@/store/endpoints/subscription';
import s from './styles/Settings.module.scss';

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
  const user = useAppSelector((st) => st.auth.user);
  const [params, setParams] = useSearchParams();
  const defaultTab = params.get('tab') ?? (params.get('connected') || params.get('error') ? 'channels' : 'profile');
  const [activeTab, setActiveTab] = useState(defaultTab);

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

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <UserOutlined /> },
    { key: 'channels', label: 'Channels', icon: <ApiOutlined /> },
    { key: 'publishing', label: 'Publishing', icon: <SendOutlined /> },
    { key: 'notifications', label: 'Notifications', icon: <BellOutlined /> },
    { key: 'ai', label: 'AI', icon: <ExperimentOutlined /> },
    { key: 'privacy', label: 'Privacy & Data', icon: <LockOutlined /> },
    { key: 'plan', label: 'Plan', icon: <CrownOutlined /> },
    { key: 'payments', label: 'Payments', icon: <CreditCardOutlined /> },
  ];

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <SettingOutlined className={s.page_title__icon} />
          Settings
        </h1>
      </div>

      <div className={s.settings_layout}>
        <nav className={s.settings_nav}>
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`${s.nav_item} ${activeTab === t.key ? s['nav_item--active'] : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className={s.settings_content}>
          {activeTab === 'profile' && (
            <>
              <ProfileForm />
              {user?.role === 'CREATOR' && <CreatorProfileForm />}
              {user?.role === 'BRAND' && <BrandProfileForm />}
            </>
          )}
          {activeTab === 'channels' && <ConnectedAccounts />}
          {activeTab === 'publishing' && <PublishingDefaults />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'ai' && <AIPreferences />}
          {activeTab === 'privacy' && (
            <>
              <DataRefreshSettings />
              <PrivacySettings />
            </>
          )}
          {activeTab === 'plan' && <PlanCard />}
          {activeTab === 'payments' && <PaymentHistoryTab />}
        </div>
      </div>

      <div className={s.footer}>
        CrMS v2.0 · Account created {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
      </div>
    </div>
  );
}

/* ── Reusable row layout ─────────────────────────────────── */
function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className={s.setting_row}>
      <div className={s.setting_row__label}>
        <div className={s.setting_row__name}>{label}</div>
        {description && <div className={s.setting_row__desc}>{description}</div>}
      </div>
      <div className={s.setting_row__control}>{children}</div>
    </div>
  );
}

/* ── Publishing Defaults ─────────────────────────────────── */
function PublishingDefaults() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const st = settingsRes?.data;

  return (
    <div className={s.section_card}>
      <h3 className={s.section_title}>Publishing Defaults</h3>
      <div className={s.setting_rows}>
        <SettingRow label="Default Platform" description="Pre-selected platform when creating posts">
          <Select
            style={{ width: '100%' }}
            value={st?.defaultPlatform ?? undefined}
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
        <SettingRow label="Default Post Type" description="Pre-selected format for new content">
          <Select
            style={{ width: '100%' }}
            value={st?.defaultPostType ?? undefined}
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
        <SettingRow label="Timezone" description="Used for scheduling & analytics">
          <Select
            style={{ width: '100%' }}
            value={st?.timezone ?? 'UTC'}
            showSearch
            onChange={(v) => updateSettings({ timezone: v })}
            options={TIMEZONE_OPTIONS}
          />
        </SettingRow>
        <SettingRow label="Default Hashtags" description="Automatically appended to posts">
          <Select
            mode="tags"
            style={{ width: '100%' }}
            value={st?.defaultHashtags ?? []}
            placeholder="Add hashtags"
            onChange={(v) => updateSettings({ defaultHashtags: v })}
            tokenSeparators={[',', ' ']}
            tagRender={({ label, closable, onClose }) => (
              <Tag closable={closable} onClose={onClose} style={{ margin: 2 }}>#{label}</Tag>
            )}
          />
        </SettingRow>
        <SettingRow label="Auto-Schedule" description="AI picks the best time to publish">
          <Switch
            checked={st?.autoSchedule ?? false}
            onChange={(v) => updateSettings({ autoSchedule: v })}
          />
        </SettingRow>
      </div>
    </div>
  );
}

/* ── Notification Settings ───────────────────────────────── */
function NotificationSettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const st = settingsRes?.data;

  return (
    <div className={s.section_card}>
      <h3 className={s.section_title}>Notifications</h3>
      <div className={s.setting_rows}>
        <SettingRow label="Email Digest" description="Receive a daily summary email">
          <Switch checked={st?.emailDigest ?? true} onChange={(v) => updateSettings({ emailDigest: v })} />
        </SettingRow>
        <SettingRow label="Push Notifications" description="Browser & mobile push alerts">
          <Switch checked={st?.pushNotifications ?? true} onChange={(v) => updateSettings({ pushNotifications: v })} />
        </SettingRow>
        <SettingRow label="New Followers" description="Notify when you gain new followers">
          <Switch checked={st?.notifyNewFollower ?? true} onChange={(v) => updateSettings({ notifyNewFollower: v })} />
        </SettingRow>
        <SettingRow label="Mentions & Tags" description="Notify when you're mentioned or tagged">
          <Switch checked={st?.notifyMention ?? true} onChange={(v) => updateSettings({ notifyMention: v })} />
        </SettingRow>
        <SettingRow label="Campaign Updates" description="Notify on campaign status changes">
          <Switch checked={st?.notifyCampaignUpdate ?? true} onChange={(v) => updateSettings({ notifyCampaignUpdate: v })} />
        </SettingRow>
        <SettingRow label="Comment Replies" description="Notify when someone replies to your comment">
          <Switch checked={st?.notifyCommentReply ?? true} onChange={(v) => updateSettings({ notifyCommentReply: v })} />
        </SettingRow>
      </div>
    </div>
  );
}

/* ── AI Preferences ──────────────────────────────────────── */
function AIPreferences() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const st = settingsRes?.data;

  return (
    <div className={s.section_card}>
      <h3 className={s.section_title}>AI Preferences</h3>
      <div className={s.setting_rows}>
        <SettingRow label="Default AI Tone" description="Sets the voice for generated content & replies">
          <Select
            style={{ width: '100%' }}
            value={st?.aiTone ?? 'friendly'}
            onChange={(v) => updateSettings({ aiTone: v })}
            options={AI_TONE_OPTIONS}
          />
        </SettingRow>
        <SettingRow label="AI Language" description="Preferred language for AI-generated text">
          <Select
            style={{ width: '100%' }}
            value={st?.aiLanguage ?? 'en'}
            onChange={(v) => updateSettings({ aiLanguage: v })}
            options={AI_LANGUAGE_OPTIONS}
          />
        </SettingRow>
        <SettingRow label="Auto-Suggest" description="AI proactively suggests content ideas & replies">
          <Switch checked={st?.aiAutoSuggest ?? true} onChange={(v) => updateSettings({ aiAutoSuggest: v })} />
        </SettingRow>
      </div>
    </div>
  );
}

/* ── Data Refresh ────────────────────────────────────────── */
function DataRefreshSettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const st = settingsRes?.data;

  return (
    <div className={s.section_card}>
      <h3 className={s.section_title}>Data Refresh Frequency</h3>
      <div className={s.setting_rows}>
        <SettingRow label="Social Listening" description="How many times per day to poll for mentions">
          <InputNumber
            min={1} max={24}
            value={st?.listeningFrequency ?? 1}
            onChange={(v) => v && updateSettings({ listeningFrequency: v })}
            addonAfter="/ day"
          />
        </SettingRow>
        <SettingRow label="Competitive Intel" description="How many times per day to refresh competitor data">
          <InputNumber
            min={1} max={24}
            value={st?.competitiveFrequency ?? 1}
            onChange={(v) => v && updateSettings({ competitiveFrequency: v })}
            addonAfter="/ day"
          />
        </SettingRow>
      </div>
    </div>
  );
}

/* ── Privacy & Security ──────────────────────────────────── */
function PrivacySettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const st = settingsRes?.data;

  return (
    <div className={s.section_card}>
      <h3 className={s.section_title}>Privacy & Visibility</h3>
      <div className={s.setting_rows}>
        <SettingRow label="Profile Visibility" description="Who can see your CrMS profile">
          <Select
            style={{ width: '100%' }}
            value={st?.profileVisibility ?? 'public'}
            onChange={(v) => updateSettings({ profileVisibility: v })}
            options={[
              { label: 'Public', value: 'public' },
              { label: 'Connections Only', value: 'connections-only' },
              { label: 'Private', value: 'private' },
            ]}
          />
        </SettingRow>
        <SettingRow label="Show Analytics" description="Display performance stats on your public profile">
          <Switch checked={st?.showAnalytics ?? true} onChange={(v) => updateSettings({ showAnalytics: v })} />
        </SettingRow>
      </div>
    </div>
  );
}

/* ── Payment History ─────────────────────────────────────── */
function PaymentHistoryTab() {
  const { data: historyRes, isLoading } = useGetPaymentHistoryQuery();
  const payments: PaymentTransaction[] = historyRes?.data ?? [];

  const statusColors: Record<string, string> = {
    succeeded: 'green', paid: 'green', failed: 'red', pending: 'orange', refunded: 'volcano',
  };

  return (
    <div className={s.section_card}>
      <h3 className={s.section_title}>Payment History</h3>
      <Table
        loading={isLoading}
        dataSource={payments}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: <Empty description="No payments yet" /> }}
        columns={[
          {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 140,
            render: (d: string) => new Date(d).toLocaleDateString(),
          },
          {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 120,
            render: (v: number, record: PaymentTransaction) => {
              const symbol = record.currency === 'INR' ? '₹' : '$';
              return `${symbol}${v.toLocaleString()}`;
            },
          },
          {
            title: 'Provider',
            dataIndex: 'provider',
            key: 'provider',
            width: 100,
            render: (p: string) => <Tag>{p}</Tag>,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => <Tag color={statusColors[status] ?? 'default'}>{status}</Tag>,
          },
          {
            title: 'Invoice',
            dataIndex: 'invoiceUrl',
            key: 'invoiceUrl',
            width: 80,
            render: (url: string | null) =>
              url ? (
                <a href={url} target="_blank" rel="noopener noreferrer">View</a>
              ) : '—',
          },
        ]}
      />
    </div>
  );
}
