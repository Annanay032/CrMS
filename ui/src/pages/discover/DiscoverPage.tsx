import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../lib/api';

interface Creator {
  id: string;
  niche: string[];
  location?: string;
  user: { name: string; avatarUrl?: string };
  platformStats: Array<{
    platform: string;
    followers: number;
    engagementRate: number;
    handle?: string;
  }>;
}

export function DiscoverPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('');

  const fetchCreators = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (niche) params.set('niche', niche);
    if (platform) params.set('platform', platform);
    try {
      const { data } = await api.get(`/matching/creators?${params}`);
      setCreators(data.data ?? []);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchCreators(); }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Discover Creators</h1>

      <Card className="mb-6">
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Niche"
                placeholder="fitness, lifestyle..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className="w-40">
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">All</option>
                <option value="INSTAGRAM">Instagram</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="TIKTOK">TikTok</option>
              </select>
            </div>
            <Button onClick={fetchCreators} loading={loading}>Search</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : creators.length === 0 ? (
        <Card><CardContent className="text-center py-12"><p className="text-slate-500">No creators found.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creators.map((c) => (
            <Card key={c.id}>
              <CardContent>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600">
                    {c.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{c.user.name}</p>
                    {c.location && <p className="text-xs text-slate-500">{c.location}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {c.niche.map((n) => <Badge key={n}>{n}</Badge>)}
                </div>

                <div className="space-y-2">
                  {c.platformStats.map((s) => (
                    <div key={s.platform} className="flex items-center justify-between text-xs">
                      <span className="font-medium">{s.platform}</span>
                      <div className="flex gap-3 text-slate-500">
                        <span>{s.followers.toLocaleString()} followers</span>
                        <span>{s.engagementRate.toFixed(2)}% ER</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
