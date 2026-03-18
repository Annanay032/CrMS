import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,

} from 'recharts';
import { Bot } from 'lucide-react';

export function AnalyticsPage() {
  const [insights, setInsights] = useState<any>(null);
  const [, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('week');

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/agents/analytics/insights', { period });
      setInsights(data.data);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, [period]);

  const metrics = insights?.rawMetrics;
  const chartData = [
    { name: 'Impressions', value: metrics?.totalImpressions ?? 0 },
    { name: 'Reach', value: metrics?.totalReach ?? 0 },
    { name: 'Likes', value: metrics?.totalLikes ?? 0 },
    { name: 'Comments', value: metrics?.totalComments ?? 0 },
    { name: 'Shares', value: metrics?.totalShares ?? 0 },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Posts', value: metrics?.postsCount ?? '-' },
          { label: 'Avg Engagement', value: metrics?.avgEngagementRate ? `${metrics.avgEngagementRate.toFixed(1)}%` : '-' },
          { label: 'Follower Growth', value: metrics?.followerGrowth !== undefined ? `+${metrics.followerGrowth}` : '-' },
          { label: 'Trend', value: insights?.trend ?? '-' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent>
              <p className="text-sm text-slate-500">{m.label}</p>
              <p className="text-2xl font-semibold mt-1">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><h3 className="font-semibold">Engagement Overview</h3></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Platform Breakdown</h3></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(metrics?.platformBreakdown ?? []).map((p: any) => (
                <div key={p.platform} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium">{p.platform}</p>
                    <p className="text-xs text-slate-500">{p.followers?.toLocaleString()} followers</p>
                  </div>
                  <p className="text-sm font-semibold">{p.engagementRate?.toFixed(2)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {insights && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold">AI Insights</h3>
            </div>
          </CardHeader>
          <CardContent>
            {insights.summary && <p className="text-sm text-slate-700 mb-4">{insights.summary}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(insights.insights ?? []).map((insight: string, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-indigo-50 text-sm">{insight}</div>
              ))}
            </div>
            {insights.recommendations?.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {insights.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-slate-600 flex gap-2">
                      <span className="text-indigo-500">→</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
