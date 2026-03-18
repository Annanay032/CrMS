import { useState, useEffect } from 'react';
import type { CampaignMatch } from '../types';
import { getMatches, runMatching } from '../api/client';

const mockCampaigns = [
  { id: '1', title: 'Summer Collection 2024', status: 'ACTIVE' },
  { id: '2', title: 'Tech Product Launch', status: 'DRAFT' },
];

interface MatchWithCreator extends CampaignMatch {
  creatorName?: string;
  niche?: string;
}

const mockMatches: MatchWithCreator[] = [
  { id: '1', campaignId: '1', creatorProfileId: 'cp1', matchScore: 92, scoreBreakdown: { niche: 95, engagement: 88, followers: 90, location: 96 }, status: 'APPROVED', creatorName: 'Alex Chen', niche: 'Lifestyle' },
  { id: '2', campaignId: '1', creatorProfileId: 'cp2', matchScore: 78, scoreBreakdown: { niche: 80, engagement: 75, followers: 82, location: 70 }, status: 'PENDING', creatorName: 'Maria Garcia', niche: 'Fashion' },
  { id: '3', campaignId: '1', creatorProfileId: 'cp3', matchScore: 65, scoreBreakdown: { niche: 60, engagement: 70, followers: 65, location: 68 }, status: 'REJECTED', creatorName: 'James Wilson', niche: 'Tech' },
];

function statusBadge(status: string) {
  const map: Record<string, string> = { APPROVED: 'badge-green', PENDING: 'badge-orange', REJECTED: 'badge-red' };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

export default function Matching() {
  const [selectedCampaign, setSelectedCampaign] = useState(mockCampaigns[0].id);
  const [matches, setMatches] = useState<MatchWithCreator[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setLoading(true);
    getMatches(selectedCampaign)
      .then(data => setMatches(Array.isArray(data) ? data : mockMatches.filter(m => m.campaignId === selectedCampaign)))
      .catch(() => setMatches(mockMatches.filter(m => m.campaignId === selectedCampaign)))
      .finally(() => setLoading(false));
  }, [selectedCampaign]);

  async function handleRunMatching() {
    setRunning(true);
    try {
      const result = await runMatching(selectedCampaign);
      if (Array.isArray(result)) setMatches(result);
    } catch {
      // keep current matches
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Brand-Creator Matching</h1>
          <p className="page-subtitle">AI-powered matching between campaigns and creators</p>
        </div>
      </div>

      <div className="card section">
        <div className="selector-row">
          <label className="form-label" style={{ marginBottom: 0 }}>Campaign:</label>
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '240px' }}
            value={selectedCampaign}
            onChange={e => setSelectedCampaign(e.target.value)}
          >
            {mockCampaigns.map(c => (
              <option key={c.id} value={c.id}>{c.title} ({c.status})</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleRunMatching} disabled={running}>
            {running ? <><div className="spinner" style={{ borderTopColor: '#fff' }} /> Running…</> : '▶ Run Matching'}
          </button>
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading matches…</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Creator</th>
                  <th>Niche</th>
                  <th style={{ minWidth: '160px' }}>Match Score</th>
                  <th>Score Breakdown</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(m => (
                  <tr key={m.id}>
                    <td className="td-bold">{m.creatorName ?? m.creatorProfileId}</td>
                    <td>{m.niche ?? '—'}</td>
                    <td>
                      <div className="match-score">
                        <span className="match-score-value">{m.matchScore}%</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${m.matchScore}%` }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      {m.scoreBreakdown ? (
                        <div className="score-breakdown">
                          {Object.entries(m.scoreBreakdown).map(([k, v]) => (
                            <div key={k} className="score-item">
                              <span className="score-item-label">{k}</span>
                              <span className="score-item-value">{v}</span>
                            </div>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td><span className={statusBadge(m.status)}>{m.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm">Approve</button>
                        <button className="btn btn-danger btn-sm">Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {matches.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text)', padding: '32px' }}>No matches yet. Run matching to find creators.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
