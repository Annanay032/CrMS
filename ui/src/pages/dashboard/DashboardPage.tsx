import { useAuthStore } from '../../stores/auth.store';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  BarChart3, Calendar, TrendingUp, Users, Megaphone, Bot,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, change }: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="rounded-lg bg-indigo-50 p-3">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {change && <p className="text-xs text-green-600 mt-0.5">{change}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function CreatorDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} label="Total Followers" value="170K" change="+2.3% this week" />
        <StatCard icon={BarChart3} label="Engagement Rate" value="3.86%" change="+0.4%" />
        <StatCard icon={Calendar} label="Scheduled Posts" value="12" />
        <StatCard icon={Megaphone} label="Active Campaigns" value="3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Upcoming Posts</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Morning Workout Routine', platform: 'Instagram', time: 'Today 9:00 AM', status: 'SCHEDULED' },
                { title: 'Nutrition Tips Video', platform: 'YouTube', time: 'Tomorrow 2:00 PM', status: 'REVIEW' },
                { title: 'Quick HIIT Challenge', platform: 'TikTok', time: 'Wed 6:00 PM', status: 'DRAFT' },
              ].map((post) => (
                <div key={post.title} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-slate-500">{post.platform} · {post.time}</p>
                  </div>
                  <Badge variant={post.status === 'SCHEDULED' ? 'success' : post.status === 'REVIEW' ? 'warning' : 'default'}>
                    {post.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Link to="/calendar" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              View full calendar →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">AI Suggestions</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-medium text-indigo-600">Content Idea</span>
                </div>
                <p className="text-sm">Your Reels engagement is up 23% — consider posting more short-form workout clips this week</p>
              </div>
              <div className="p-3 rounded-lg bg-pink-50 border border-pink-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-pink-600" />
                  <span className="text-xs font-medium text-pink-600">Trending</span>
                </div>
                <p className="text-sm">"75 Hard Challenge" is trending on TikTok — fits your fitness niche perfectly</p>
              </div>
            </div>
            <Link to="/ai" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Open AI Assistant →
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BrandDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Megaphone} label="Active Campaigns" value="5" />
        <StatCard icon={Users} label="Matched Creators" value="47" />
        <StatCard icon={BarChart3} label="Avg Match Score" value="0.82" />
        <StatCard icon={TrendingUp} label="Campaign ROI" value="3.2x" />
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Recent Campaigns</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'Summer Fitness Challenge 2026', creators: 12, status: 'ACTIVE' },
              { title: 'New Product Launch', creators: 8, status: 'ACTIVE' },
              { title: 'Brand Awareness Q1', creators: 15, status: 'COMPLETED' },
            ].map((campaign) => (
              <div key={campaign.title} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium">{campaign.title}</p>
                  <p className="text-xs text-slate-500">{campaign.creators} creators matched</p>
                </div>
                <Badge variant={campaign.status === 'ACTIVE' ? 'success' : 'default'}>
                  {campaign.status}
                </Badge>
              </div>
            ))}
          </div>
          <Link to="/campaigns" className="block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all campaigns →
          </Link>
        </CardContent>
      </Card>
    </>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your {user?.role === 'BRAND' ? 'campaigns' : 'content'} today.</p>
      </div>

      {user?.role === 'BRAND' ? <BrandDashboard /> : <CreatorDashboard />}
    </div>
  );
}
