import { useState, useEffect } from 'react';
import { getBrands } from '../api/client';

interface BrandUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  brandProfile?: {
    companyName: string;
    industry?: string;
    website?: string;
    budgetRangeLow?: number;
    budgetRangeHigh?: number;
  };
}

const mockBrands: BrandUser[] = [
  { id: '1', name: 'Nike Corp', email: 'nike@example.com', role: 'BRAND', isActive: true, createdAt: new Date().toISOString(), brandProfile: { companyName: 'Nike', industry: 'Sports', budgetRangeLow: 10000, budgetRangeHigh: 100000, website: 'nike.com' } },
  { id: '2', name: 'TechStart Inc', email: 'tech@example.com', role: 'BRAND', isActive: true, createdAt: new Date().toISOString(), brandProfile: { companyName: 'TechStart', industry: 'Technology', budgetRangeLow: 5000, budgetRangeHigh: 50000, website: 'techstart.io' } },
];

function formatBudget(low?: number, high?: number) {
  if (!low && !high) return '—';
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  if (low && high) return `${fmt(low)} – ${fmt(high)}`;
  return fmt(low ?? high ?? 0);
}

export default function Brands() {
  const [brands, setBrands] = useState<BrandUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBrands()
      .then(data => setBrands(Array.isArray(data) ? data : mockBrands))
      .catch(() => setBrands(mockBrands))
      .finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter(b =>
    (b.brandProfile?.companyName ?? b.name).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Brands</h1>
          <p className="page-subtitle">Manage brand partners</p>
        </div>
        <button className="btn btn-primary">+ Add Brand</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="Search brands…"
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
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Budget Range</th>
                  <th>Website</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td className="td-bold">{b.brandProfile?.companyName ?? b.name}</td>
                    <td>{b.brandProfile?.industry ?? '—'}</td>
                    <td>{formatBudget(b.brandProfile?.budgetRangeLow, b.brandProfile?.budgetRangeHigh)}</td>
                    <td>{b.brandProfile?.website ?? '—'}</td>
                    <td>
                      <span className={`badge ${b.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {b.isActive ? 'Active' : 'Inactive'}
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
