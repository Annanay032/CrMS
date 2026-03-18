import { useState, useEffect } from 'react';
import type { Campaign } from '../types';
import { getCampaigns, createCampaign } from '../api/client';

const mockCampaigns: Campaign[] = [
  { id: '1', title: 'Summer Collection 2024', description: 'Promote our new summer line', status: 'ACTIVE', budget: 15000, targetNiche: 'Fashion', targetPlatforms: ['Instagram', 'TikTok'], brandProfileId: 'b1', startDate: '2024-06-01', endDate: '2024-08-31' },
  { id: '2', title: 'Tech Product Launch', description: 'Launch our new gadget', status: 'DRAFT', budget: 25000, targetNiche: 'Technology', targetPlatforms: ['YouTube'], brandProfileId: 'b2', startDate: '2024-07-15' },
  { id: '3', title: 'Fitness Challenge', description: 'Monthly fitness challenge', status: 'PAUSED', budget: 8000, targetNiche: 'Fitness', targetPlatforms: ['Instagram', 'YouTube'], brandProfileId: 'b3' },
  { id: '4', title: 'Holiday Special', description: 'End of year sale', status: 'COMPLETED', budget: 30000, targetNiche: 'Lifestyle', targetPlatforms: ['Instagram', 'TikTok', 'YouTube'], brandProfileId: 'b4', startDate: '2023-12-01', endDate: '2023-12-31' },
];

const TABS = ['All', 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;

function statusBadge(status: string) {
  const map: Record<string, string> = { ACTIVE: 'badge-green', DRAFT: 'badge-orange', PAUSED: 'badge-blue', COMPLETED: 'badge-gray' };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

interface FormState { title: string; description: string; budget: string; targetNiche: string; targetPlatforms: string; startDate: string; endDate: string; }
const emptyForm: FormState = { title: '', description: '', budget: '', targetNiche: '', targetPlatforms: '', startDate: '', endDate: '' };

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tab, setTab] = useState<typeof TABS[number]>('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCampaigns()
      .then(data => setCampaigns(Array.isArray(data) ? data : mockCampaigns))
      .catch(() => setCampaigns(mockCampaigns))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'All' ? campaigns : campaigns.filter(c => c.status === tab);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
        targetPlatforms: form.targetPlatforms.split(',').map(s => s.trim()).filter(Boolean),
      };
      const created = await createCampaign(payload);
      setCampaigns(prev => [...prev, created]);
    } catch {
      // fallback: add locally with mock id
      setCampaigns(prev => [...prev, { ...form, id: String(Date.now()), status: 'DRAFT', budget: Number(form.budget) || 0, targetPlatforms: form.targetPlatforms.split(',').map(s => s.trim()).filter(Boolean), brandProfileId: '' }]);
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm(emptyForm);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Manage influencer marketing campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Campaign</button>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t} className={`tab-btn${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t} {t === 'All' ? `(${campaigns.length})` : `(${campaigns.filter(c => c.status === t).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner" /> Loading…</div>
      ) : (
        <div className="campaign-grid">
          {filtered.map(c => (
            <div key={c.id} className="campaign-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className="campaign-card-title">{c.title}</span>
                <span className={statusBadge(c.status)}>{c.status}</span>
              </div>
              {c.description && <p className="campaign-card-desc">{c.description}</p>}
              <div className="campaign-card-meta">
                {c.budget && <span className="badge badge-gray">💰 ${c.budget.toLocaleString()}</span>}
                {c.targetNiche && <span className="badge badge-purple">{c.targetNiche}</span>}
              </div>
              {c.targetPlatforms.length > 0 && (
                <div className="platform-tags">
                  {c.targetPlatforms.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
                </div>
              )}
              {(c.startDate || c.endDate) && (
                <p style={{ fontSize: '12px', color: 'var(--text)' }}>
                  {c.startDate && `Start: ${c.startDate}`}{c.endDate && ` · End: ${c.endDate}`}
                </p>
              )}
              <div className="campaign-card-actions">
                <button className="btn btn-secondary btn-sm">Edit</button>
                <button className="btn btn-secondary btn-sm">View Matches</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: 'var(--text)', padding: '24px 0', gridColumn: '1/-1' }}>No campaigns in this status.</p>
          )}
        </div>
      )}

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Campaign</span>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Budget ($)</label>
                    <input className="form-input" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Niche</label>
                    <input className="form-input" value={form.targetNiche} onChange={e => setForm(f => ({ ...f, targetNiche: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Platforms (comma-separated)</label>
                  <input className="form-input" placeholder="Instagram, YouTube, TikTok" value={form.targetPlatforms} onChange={e => setForm(f => ({ ...f, targetPlatforms: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="form-input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Campaign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
