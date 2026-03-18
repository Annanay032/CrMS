import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  title: string;
  description?: string;
  budget?: number;
  targetNiche: string[];
  targetPlatforms: string[];
  status: string;
  _count?: { matches: number };
  brandProfile?: { user: { name: string } };
  createdAt: string;
}

export function CampaignsPage() {
  const { user } = useAuthStore();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const url = user?.role === 'CREATOR' ? '/campaigns/my' : '/campaigns';
    api.get(url).then((res) => {
      const data = res.data.data;
      setCampaigns(Array.isArray(data) ? data : data?.map?.((m: any) => m.campaign) ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const statusVariant = (s: string) => {
    if (s === 'ACTIVE') return 'success';
    if (s === 'COMPLETED') return 'info';
    if (s === 'PAUSED') return 'warning';
    if (s === 'CANCELLED') return 'danger';
    return 'default';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {user?.role === 'CREATOR' ? 'My Campaigns' : 'Campaigns'}
        </h1>
        {user?.role === 'BRAND' && (
          <Button onClick={() => navigate('/campaigns/new')}>
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading...</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-slate-500">No campaigns yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
              <CardContent>
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                </div>
                {c.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{c.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.targetNiche.map((n) => (
                    <Badge key={n} variant="info">{n}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{c.targetPlatforms.join(', ')}</span>
                  {c.budget && <span>${c.budget.toLocaleString()}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
