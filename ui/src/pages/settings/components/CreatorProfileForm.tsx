import { useState } from 'react';
import { Card, Form, Input, Select, Button, message, Tag } from 'antd';
import { useAppSelector } from '@/hooks/store';
import { useSetupCreatorProfileMutation } from '@/store/endpoints/auth';

const NICHE_OPTIONS = [
  'fitness', 'lifestyle', 'beauty', 'fashion', 'food', 'travel', 'tech',
  'gaming', 'music', 'education', 'wellness', 'finance', 'comedy', 'art',
].map((n) => ({ label: n.charAt(0).toUpperCase() + n.slice(1), value: n }));

const LANG_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Spanish', value: 'es' },
  { label: 'French', value: 'fr' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Japanese', value: 'ja' },
];

export function CreatorProfileForm() {
  const user = useAppSelector((s) => s.auth.user);
  const profile = user?.creatorProfile;
  const [setupProfile, { isLoading }] = useSetupCreatorProfileMutation();

  const [bio, setBio] = useState(profile?.bio ?? '');
  const [niche, setNiche] = useState<string[]>(profile?.niche ?? []);
  const [location, setLocation] = useState(profile?.location ?? '');
  const [languages, setLanguages] = useState<string[]>(profile?.languages ?? ['en']);

  const save = async () => {
    if (niche.length === 0) {
      message.warning('Select at least one niche');
      return;
    }
    try {
      await setupProfile({ bio, niche, location, languages }).unwrap();
      message.success('Creator profile saved');
    } catch {
      message.error('Failed to save creator profile');
    }
  };

  return (
    <Card title="Creator Profile" style={{ marginBottom: 24 }}>
      <Form layout="vertical">
        <Form.Item label="Bio">
          <Input.TextArea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell brands about yourself..." maxLength={500} showCount />
        </Form.Item>
        <Form.Item label="Niche" required>
          <Select mode="multiple" value={niche} onChange={setNiche} options={NICHE_OPTIONS} placeholder="Select your niches" />
        </Form.Item>
        <Form.Item label="Location">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Los Angeles, CA" />
        </Form.Item>
        <Form.Item label="Languages">
          <Select mode="multiple" value={languages} onChange={setLanguages} options={LANG_OPTIONS} />
        </Form.Item>

        {profile?.platformStats && profile.platformStats.length > 0 && (
          <Form.Item label="Connected Platforms">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {profile.platformStats.map((ps) => (
                <Tag key={ps.platform} color="blue">
                  {ps.platform} · {ps.followers.toLocaleString()} followers · {ps.engagementRate}% ER
                </Tag>
              ))}
            </div>
          </Form.Item>
        )}

        <Button type="primary" onClick={save} loading={isLoading}>Save Creator Profile</Button>
      </Form>
    </Card>
  );
}
