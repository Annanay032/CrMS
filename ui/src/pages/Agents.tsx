import { useState, useEffect } from 'react';
import type { AgentTask } from '../types';
import { runAgent, getAgentTasks } from '../api/client';

const agentTypes = [
  { type: 'CONTENT_GENERATION', name: 'Content Generation', description: 'Generate social media content using AI based on brand guidelines and target audience.', icon: '✍️' },
  { type: 'SCHEDULING', name: 'Smart Scheduling', description: 'Optimize post scheduling based on audience activity patterns and platform algorithms.', icon: '📅' },
  { type: 'MATCHING', name: 'Creator Matching', description: 'Match creators to campaigns using AI-powered compatibility scoring.', icon: '🎯' },
  { type: 'ANALYTICS', name: 'Analytics & Insights', description: 'Analyze campaign performance and provide actionable insights.', icon: '📊' },
  { type: 'ENGAGEMENT', name: 'Engagement Optimization', description: 'Optimize engagement strategies based on historical performance data.', icon: '💬' },
  { type: 'TREND_DETECTION', name: 'Trend Detection', description: 'Detect emerging trends and topics relevant to your brand.', icon: '📈' },
];

const mockTasks: AgentTask[] = [
  { id: '1', agentType: 'CONTENT_GENERATION', status: 'COMPLETED', createdAt: new Date(Date.now() - 3600000).toISOString(), completedAt: new Date(Date.now() - 3500000).toISOString(), tokensUsed: 2500 },
  { id: '2', agentType: 'MATCHING', status: 'COMPLETED', createdAt: new Date(Date.now() - 7200000).toISOString(), completedAt: new Date(Date.now() - 7100000).toISOString(), tokensUsed: 1800 },
  { id: '3', agentType: 'TREND_DETECTION', status: 'FAILED', createdAt: new Date(Date.now() - 10800000).toISOString(), error: 'API rate limit exceeded' },
  { id: '4', agentType: 'ANALYTICS', status: 'RUNNING', createdAt: new Date(Date.now() - 300000).toISOString() },
];

function statusBadge(status: string) {
  const map: Record<string, string> = { COMPLETED: 'badge-green', RUNNING: 'badge-purple', FAILED: 'badge-red', PENDING: 'badge-orange' };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Agents() {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState('{}');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgentTasks()
      .then(data => setTasks(Array.isArray(data) ? data : mockTasks))
      .catch(() => setTasks(mockTasks))
      .finally(() => setLoading(false));
  }, []);

  async function handleRunAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!activeAgent) return;
    setSubmitting(true);
    let payload: unknown = {};
    try { payload = JSON.parse(jsonInput); } catch { /* invalid JSON, use empty */ }
    try {
      const result = await runAgent({ agentType: activeAgent, ...((payload as object) ?? {}) });
      setTasks(prev => [{ id: String(Date.now()), agentType: activeAgent, status: 'PENDING', createdAt: new Date().toISOString(), ...result }, ...prev]);
    } catch {
      setTasks(prev => [{ id: String(Date.now()), agentType: activeAgent, status: 'PENDING', createdAt: new Date().toISOString() }, ...prev]);
    } finally {
      setSubmitting(false);
      setActiveAgent(null);
      setJsonInput('{}');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Agents</h1>
          <p className="page-subtitle">Automate tasks with AI-powered agents</p>
        </div>
      </div>

      <div className="agent-grid">
        {agentTypes.map(agent => (
          <div key={agent.type} className="agent-card">
            <div className="agent-card-icon">{agent.icon}</div>
            <div className="agent-card-name">{agent.name}</div>
            <div className="agent-card-desc">{agent.description}</div>
            <button className="btn btn-primary btn-sm" onClick={() => { setActiveAgent(agent.type); setJsonInput('{}'); }}>
              ▶ Run Agent
            </button>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Task History</span>
        </div>
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading…</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Agent Type</th>
                  <th>Status</th>
                  <th>Started</th>
                  <th>Tokens Used</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td className="td-bold">{t.agentType.replace(/_/g, ' ')}</td>
                    <td><span className={statusBadge(t.status)}>{t.status}</span></td>
                    <td style={{ fontSize: '12px' }}>{formatRelative(t.createdAt)}</td>
                    <td>{t.tokensUsed ?? '—'}</td>
                    <td style={{ color: '#dc2626', fontSize: '12px' }}>{t.error ?? '—'}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text)', padding: '32px' }}>No tasks yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeAgent && (
        <div className="overlay" onClick={() => setActiveAgent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Run {agentTypes.find(a => a.type === activeAgent)?.name}</span>
              <button className="close-btn" onClick={() => setActiveAgent(null)}>✕</button>
            </div>
            <form onSubmit={handleRunAgent}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Input Payload (JSON)</label>
                  <textarea
                    className="form-textarea"
                    style={{ minHeight: '120px', fontFamily: 'monospace', fontSize: '13px' }}
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveAgent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Running…' : 'Run Agent'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
