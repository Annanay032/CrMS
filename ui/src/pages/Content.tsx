import { useState, useEffect } from 'react';
import type { ContentPost } from '../types';
import { getContent, createContent } from '../api/client';

const mockContent: ContentPost[] = [
  { id: '1', platform: 'Instagram', postType: 'IMAGE', caption: 'Check out our amazing summer collection! Perfect for beach days and outdoor adventures.', hashtags: ['summer', 'fashion'], status: 'SCHEDULED', scheduledAt: '2024-06-15T10:00:00Z', creatorProfileId: 'cp1' },
  { id: '2', platform: 'YouTube', postType: 'VIDEO', caption: 'Tech Review: Is this the best gadget of 2024?', hashtags: ['tech', 'review'], status: 'PUBLISHED', publishedAt: '2024-06-10T14:00:00Z', creatorProfileId: 'cp2' },
  { id: '3', platform: 'TikTok', postType: 'VIDEO', caption: 'Morning workout routine that changed my life!', hashtags: ['fitness', 'wellness'], status: 'DRAFT', creatorProfileId: 'cp1' },
  { id: '4', platform: 'Instagram', postType: 'STORY', caption: 'Behind the scenes of our photoshoot!', hashtags: ['bts', 'fashion'], status: 'FAILED', scheduledAt: '2024-06-12T09:00:00Z', creatorProfileId: 'cp3' },
];

const PLATFORMS = ['All', 'Instagram', 'YouTube', 'TikTok'];

function statusBadge(status: string) {
  const map: Record<string, string> = { SCHEDULED: 'badge-blue', PUBLISHED: 'badge-green', DRAFT: 'badge-orange', FAILED: 'badge-red' };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

interface FormState { platform: string; postType: string; caption: string; hashtags: string; scheduledAt: string; }
const emptyForm: FormState = { platform: 'Instagram', postType: 'IMAGE', caption: '', hashtags: '', scheduledAt: '' };

export default function Content() {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [tab, setTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getContent()
      .then(data => setPosts(Array.isArray(data) ? data : mockContent))
      .catch(() => setPosts(mockContent))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tab === 'All' ? posts : posts.filter(p => p.platform === tab);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, hashtags: form.hashtags.split(',').map(s => s.trim()).filter(Boolean) };
      const created = await createContent(payload);
      setPosts(prev => [...prev, created]);
    } catch {
      setPosts(prev => [...prev, { ...form, id: String(Date.now()), hashtags: form.hashtags.split(',').map(s => s.trim()).filter(Boolean), status: 'DRAFT', creatorProfileId: '' }]);
    } finally {
      setSaving(false);
      setShowForm(false);
      setForm(emptyForm);
    }
  }

  function formatDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Content Calendar</h1>
          <p className="page-subtitle">Schedule and manage social media content</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Post</button>
      </div>

      <div className="tabs">
        {PLATFORMS.map(p => (
          <button key={p} className={`tab-btn${tab === p ? ' active' : ''}`} onClick={() => setTab(p)}>{p}</button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading…</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Caption</th>
                  <th>Hashtags</th>
                  <th>Status</th>
                  <th>Scheduled / Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td className="td-bold">{p.platform}</td>
                    <td>{p.postType}</td>
                    <td style={{ maxWidth: '240px' }}>
                      <span title={p.caption}>{p.caption ? `${p.caption.slice(0, 60)}${p.caption.length > 60 ? '…' : ''}` : '—'}</span>
                    </td>
                    <td>{p.hashtags.slice(0, 3).map(h => `#${h}`).join(' ')}</td>
                    <td><span className={statusBadge(p.status)}>{p.status}</span></td>
                    <td style={{ fontSize: '12px' }}>{formatDate(p.scheduledAt ?? p.publishedAt)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm">Edit</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text)', padding: '32px' }}>No posts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Post</span>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Platform</label>
                    <select className="form-select" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                      {['Instagram', 'YouTube', 'TikTok', 'Twitter'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Post Type</label>
                    <select className="form-select" value={form.postType} onChange={e => setForm(f => ({ ...f, postType: e.target.value }))}>
                      {['IMAGE', 'VIDEO', 'STORY', 'REEL'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Caption</label>
                  <textarea className="form-textarea" required value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Hashtags (comma-separated)</label>
                  <input className="form-input" placeholder="fashion, summer, lifestyle" value={form.hashtags} onChange={e => setForm(f => ({ ...f, hashtags: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Scheduled At</label>
                  <input className="form-input" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Create Post'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
