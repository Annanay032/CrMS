import { useEffect } from 'react';
import { Card, Typography, message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { useAppSelector } from '@/hooks/store';
import { PageHeader } from '@/components/common';
import { ProfileForm } from './components/ProfileForm';
import { ConnectedAccounts } from './components/ConnectedAccounts';
import { CreatorProfileForm } from './components/CreatorProfileForm';
import { BrandProfileForm } from './components/BrandProfileForm';

const { Text } = Typography;

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

      <Card style={{ marginTop: 24 }}>
        <Text type="secondary">
          CrMS v1.0 · Account created {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
        </Text>
      </Card>
    </div>
  );
}
