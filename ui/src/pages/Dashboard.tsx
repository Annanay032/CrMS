import { useState, useEffect } from 'react';
import type { Campaign, AgentTask } from '../types';
import { getCampaigns, getCreators, getContent, getAgentTasks } from '../api/client';

const mockCampaigns: Campaign[] = [
  { id: '1', title: 'Summer Collection', status: 'ACTIVE', budget: 5000, brandProfileId: 'b1', targetPlatforms: ['Instagram'], targetNiche: 'Fashion' },
  { id: '2', title: 'Tech Launch', status: 'DRAFT', budget: 10000, brandProfileId: 'b2', targetPlatforms: ['YouTube'], targetNiche: 'Tech' },
];

const mockTasks: AgentTask[] = [
  { id: '1', agentType: 'CONTENT_GENERATION', status: 'COMPLETED', createdAt: new Date().toISOString(), tokensUsed: 1500 },
  { id: '2', agentType: 'MATCHING', status: 'RUNNING', createdAt: new Date().toISOString() },
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'badge-green', COMPLETED: 'badge-gray',
    DRAFT: 'badge-orange', PAUSED: 'badge-blue',
    RUNNING: 'badge-purple', FAILED: 'badge-red', PENDING: 'badge-orange',
  };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

export default function Dashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [creatorCount, setCreatorCount] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [c, cr, ct, t] = await Promise.all([
          getCampaigns(), getCreators(), getContent(), getAgentTasks(),
        ]);
        setCampaigns(Array.isArray(c) ? c : mockCampaigns);
        setCreatorCount(Array.isArray(cr) ? cr.length : 3);
        setContentCount(Array.isArray(ct) ? ct.length : 4);
        setTasks(Array.isArray(t) ? t : mockTasks);
      } catch {
        setCampaigns(mockCampaigns);
        setCreatorCount(3);
        setContentCount(4);
        setTasks(mockTasks);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="loading-state"><div className="spinner" /> Loading dashboard…</div>;
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-label">Total Creators</div>
          <div className="stat-card-value">{creatorCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📢</div>
          <div className="stat-card-label">Active Campaigns</div>
          <div className="stat-card-value">{activeCampaigns}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">📄</div>
          <div className="stat-card-label">Content Posts</div>
          <div className="stat-card-value">{contentCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">🤖</div>
          <div className="stat-card-label">AI Tasks</div>
          <div className="stat-card-value">{tasks.length}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Campaigns</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Niche</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.slice(0, 5).map(c => (
                  <tr key={c.id}>
                    <td className="td-bold">{c.title}</td>
                    <td><span className={statusBadge(c.status)}>{c.status}</span></td>
                    <td>{c.budget ? `$${c.budget.toLocaleString()}` : '—'}</td>
                    <td>{c.targetNiche ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent AI Tasks</span>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Agent Type</th>
                  <th>Status</th>
                  <th>Tokens</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 5).map(t => (
                  <tr key={t.id}>
                    <td className="td-bold">{t.agentType.replace(/_/g, ' ')}</td>
                    <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                    <td>{t.tokensUsed ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
