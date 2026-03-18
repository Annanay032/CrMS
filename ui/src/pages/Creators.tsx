import { useState, useEffect } from 'react';
import { getCreators } from '../api/client';

interface CreatorUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  creatorProfile?: {
    niche?: string;
    availabilityStatus: 'AVAILABLE' | 'BUSY' | 'NOT_AVAILABLE';
    location?: string;
  };
}

const mockCreators: CreatorUser[] = [
  { id: '1', name: 'Alex Chen', email: 'alex@example.com', role: 'CREATOR', isActive: true, createdAt: new Date().toISOString(), creatorProfile: { niche: 'Lifestyle', availabilityStatus: 'AVAILABLE', location: 'New York' } },
  { id: '2', name: 'Maria Garcia', email: 'maria@example.com', role: 'CREATOR', isActive: true, createdAt: new Date().toISOString(), creatorProfile: { niche: 'Fashion', availabilityStatus: 'BUSY', location: 'LA' } },
  { id: '3', name: 'James Wilson', email: 'james@example.com', role: 'CREATOR', isActive: false, createdAt: new Date().toISOString(), creatorProfile: { niche: 'Tech', availabilityStatus: 'NOT_AVAILABLE', location: 'SF' } },
];

function availBadge(status: string) {
  const map: Record<string, string> = { AVAILABLE: 'badge-green', BUSY: 'badge-orange', NOT_AVAILABLE: 'badge-red' };
  return `badge ${map[status] ?? 'badge-gray'}`;
}

export default function Creators() {
  const [creators, setCreators] = useState<CreatorUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreators()
      .then(data => setCreators(Array.isArray(data) ? data : mockCreators))
      .catch(() => setCreators(mockCreators))
      .finally(() => setLoading(false));
  }, []);

  const filtered = creators.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Creators</h1>
          <p className="page-subtitle">Manage your creator network</p>
        </div>
        <button className="btn btn-primary">+ Add Creator</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="Search creators…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="loading-state"><div className="spinner" /> Loading…</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Niche</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td className="td-bold">{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.creatorProfile?.niche ?? '—'}</td>
                    <td>{c.creatorProfile?.location ?? '—'}</td>
                    <td>
                      {c.creatorProfile && (
                        <span className={availBadge(c.creatorProfile.availabilityStatus)}>
                          {c.creatorProfile.availabilityStatus.replace(/_/g, ' ')}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
