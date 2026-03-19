import { useEffect } from 'react';
import { Card, Typography, message, InputNumber, Switch, Divider } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from '@/hooks/store';
import { PageHeader } from '@/components/common';
import { ProfileForm } from './components/ProfileForm';
import { ConnectedAccounts } from './components/ConnectedAccounts';
import { CreatorProfileForm } from './components/CreatorProfileForm';
import { BrandProfileForm } from './components/BrandProfileForm';
import { useGetUserSettingsQuery, useUpdateUserSettingsMutation } from '@/store/endpoints/settings';

const { Text, Title } = Typography;

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

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <PageHeader icon={faGear} title="Settings" />
      <ProfileForm />
      {user?.role === 'CREATOR' && <CreatorProfileForm />}
      {user?.role === 'BRAND' && <BrandProfileForm />}
      <ConnectedAccounts />

      {/* Data Refresh & Notification Settings */}
      <DataRefreshSettings />

      <Card style={{ marginTop: 24 }}>
        <Text type="secondary">
          CrMS v2.0 · Account created {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
        </Text>
      </Card>
    </div>
  );
}

function DataRefreshSettings() {
  const { data: settingsRes } = useGetUserSettingsQuery();
  const [updateSettings] = useUpdateUserSettingsMutation();
  const s = settingsRes?.data;

  return (
    <Card style={{ marginTop: 24 }}>
      <Title level={5} style={{ marginTop: 0 }}>Data Refresh Frequency</Title>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Social Listening</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>How many times per day to poll for mentions</Text>
          </div>
          <InputNumber
            min={1}
            max={24}
            value={s?.listeningFrequency ?? 1}
            onChange={(v) => v && updateSettings({ listeningFrequency: v })}
            addonAfter="/ day"
          />
        </div>
        <Divider style={{ margin: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Competitive Intel</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>How many times per day to refresh competitor data</Text>
          </div>
          <InputNumber
            min={1}
            max={24}
            value={s?.competitiveFrequency ?? 1}
            onChange={(v) => v && updateSettings({ competitiveFrequency: v })}
            addonAfter="/ day"
          />
        </div>
        <Divider style={{ margin: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong>Email Digest</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>Receive a daily summary email</Text>
          </div>
          <Switch
            checked={s?.emailDigest ?? true}
            onChange={(v) => updateSettings({ emailDigest: v })}
          />
        </div>
      </div>
    </Card>
  );
}
