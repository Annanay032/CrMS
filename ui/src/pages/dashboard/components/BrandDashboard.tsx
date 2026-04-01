import { Tag, Spin, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn, faUsers, faChartLine, faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useGetDashboardStatsQuery } from '@/store/endpoints/dashboard';
import { formatCurrency } from '@/utils/format';
import s from '../styles/Dashboard.module.scss';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default',
  ACTIVE: 'green',
  PAUSED: 'orange',
  COMPLETED: 'blue',
  CANCELLED: 'red',
};

export function BrandDashboard() {
  const { data, isLoading } = useGetDashboardStatsQuery();
  const stats = data?.data;

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const activeCampaigns = (stats?.activeCampaigns as number) ?? 0;
  const totalMatches = (stats?.totalMatches as number) ?? 0;
  const avgMatchScore = (stats?.avgMatchScore as number) ?? 0;
  const acceptedMatches = (stats?.acceptedMatches as number) ?? 0;
  const totalBudget = (stats?.totalBudget as number) ?? 0;
  const totalSpent = (stats?.totalSpent as number) ?? 0;
  const budgetUtilization = (stats?.budgetUtilization as number) ?? 0;
  const statusBreakdown = (stats?.statusBreakdown as Record<string, number>) ?? {};
  const recentCampaigns = (stats?.recentCampaigns as Array<Record<string, unknown>>) ?? [];

  return (
    <>
      <div className={s.stat_grid}>
        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--campaigns']}`}>
            <FontAwesomeIcon icon={faBullhorn} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Active Campaigns</div>
            <div className={s.stat_card__value}>{activeCampaigns}</div>
          </div>
        </div>

        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--matches']}`}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Matched Creators</div>
            <div className={s.stat_card__value}>{totalMatches}</div>
            <div className={`${s.stat_card__change} ${s['stat_card__change--up']}`}>{acceptedMatches} accepted</div>
          </div>
        </div>

        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--engagement']}`}>
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Avg Match Score</div>
            <div className={s.stat_card__value}>{avgMatchScore}</div>
          </div>
        </div>

        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--revenue']}`}>
            <FontAwesomeIcon icon={faWallet} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Budget Utilization</div>
            <div className={s.stat_card__value}>{budgetUtilization}%</div>
            <div className={s.budget_bar}>
              <div
                className={`${s.budget_bar__fill} ${budgetUtilization > 90 ? s['budget_bar__fill--danger'] : budgetUtilization > 70 ? s['budget_bar__fill--warning'] : ''}`}
                style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={s.dual_panel}>
        {/* Recent Campaigns */}
        <div className={s.section_card}>
          <div className={s.section_title}>
            Recent Campaigns
            <Link to="/campaigns" className={s.view_all_link}>View all →</Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <Empty description="No campaigns yet. Create your first!" />
          ) : (
            recentCampaigns.map((c) => (
              <div key={c.id as string} className={s.post_item}>
                <div className={s.post_item__info}>
                  <div className={s.post_item__caption}>{c.title as string}</div>
                  <div className={s.post_item__meta}>
                    {((c._count as Record<string, number>)?.matches ?? 0)} creators
                    {c.budget ? ` · ${formatCurrency(c.budget as number)}` : ''}
                  </div>
                </div>
                <Tag color={STATUS_COLOR[c.status as string] ?? 'default'}>{c.status as string}</Tag>
              </div>
            ))
          )}
        </div>

        {/* Campaign Breakdown + Budget Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className={s.section_card}>
            <div className={s.section_title}>Campaign Status</div>
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className={s.post_item}>
                <Tag color={STATUS_COLOR[status] ?? 'default'}>{status}</Tag>
                <strong>{count}</strong>
              </div>
            ))}
            {Object.keys(statusBreakdown).length === 0 && (
              <Empty description="No campaigns" />
            )}
          </div>

          <div className={s.section_card}>
            <div className={s.section_title}>Budget Summary</div>
            <div className={s.post_item}>
              <span className={s.post_item__meta}>Total Budget</span>
              <strong>{formatCurrency(totalBudget)}</strong>
            </div>
            <div className={s.post_item}>
              <span className={s.post_item__meta}>Total Spent</span>
              <strong>{formatCurrency(totalSpent)}</strong>
            </div>
            <div className={s.post_item}>
              <span className={s.post_item__meta}>Remaining</span>
              <strong>{formatCurrency(totalBudget - totalSpent)}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
