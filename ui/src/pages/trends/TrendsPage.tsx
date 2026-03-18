import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import { TrendingUp, Zap, Clock } from 'lucide-react';

interface Trend {
  title: string;
  platform: string | string[];
  category: string;
  description: string;
  relevanceScore: number;
  urgency: string;
  contentIdea: string;
  estimatedReach: string;
}

export function TrendsPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/agents/trends', {
        niche: ['general'],
        platforms: ['INSTAGRAM', 'YOUTUBE', 'TIKTOK'],
      });
      setTrends(data.data?.trends ?? []);
      setSummary(data.data?.summary ?? '');
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchTrends(); }, []);

  const urgencyVariant = (u: string) => {
    if (u === 'act-now') return 'danger';
    if (u === 'this-week') return 'warning';
    return 'info';
  };

  const reachVariant = (r: string) => {
    if (r === 'viral') return 'danger';
    if (r === 'high') return 'success';
    if (r === 'medium') return 'warning';
    return 'default';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Trending Now</h1>
        <Button onClick={fetchTrends} loading={loading}>
          <TrendingUp className="h-4 w-4 mr-2" /> Refresh Trends
        </Button>
      </div>

      {summary && (
        <Card className="mb-6">
          <CardContent>
            <p className="text-sm text-slate-700">{summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trends.map((t, i) => (
          <Card key={i}>
            <CardContent>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm">{t.title}</h3>
                <div className="flex gap-1">
                  <Badge variant={urgencyVariant(t.urgency)}>
                    {t.urgency === 'act-now' && <Zap className="h-3 w-3 mr-0.5" />}
                    {t.urgency === 'this-week' && <Clock className="h-3 w-3 mr-0.5" />}
                    {t.urgency}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                <Badge variant="info">{t.category}</Badge>
                <Badge>{Array.isArray(t.platform) ? t.platform.join(', ') : t.platform}</Badge>
                <Badge variant={reachVariant(t.estimatedReach)}>{t.estimatedReach} reach</Badge>
              </div>

              <p className="text-xs text-slate-500 mb-3">{t.description}</p>

              <div className="p-2 rounded-lg bg-indigo-50">
                <p className="text-xs font-medium text-indigo-600 mb-0.5">Content Idea</p>
                <p className="text-sm">{t.contentIdea}</p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Relevance:</span>
                  <div className="w-20 h-1.5 bg-slate-200 rounded-full">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${t.relevanceScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium">{t.relevanceScore}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
