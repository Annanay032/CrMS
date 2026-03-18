import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../lib/api';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/users/me', { name });
      setUser({ ...user!, ...data.data });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* */ }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <Card className="mb-6">
        <CardHeader><h3 className="font-semibold">Profile</h3></CardHeader>
        <CardContent className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Email" value={user?.email ?? ''} disabled />
          <Input label="Role" value={user?.role ?? ''} disabled />
          <div className="flex items-center gap-3">
            <Button onClick={saveProfile} loading={loading}>Save Changes</Button>
            {saved && <span className="text-sm text-green-600">Saved!</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold">Connected Accounts</h3></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Instagram', 'YouTube', 'TikTok'].map((platform) => (
              <div key={platform} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <span className="text-sm font-medium">{platform}</span>
                <Button variant="outline" size="sm">Connect</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
