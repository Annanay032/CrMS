import { Tag, Spin, Empty } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUsers, faChartLine, faCalendarDays, faBullhorn,
  faComments, faIndianRupeeSign, faFunnelDollar,
  faSatelliteDish,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, ResponsiveContainer,
} from 'recharts';
import { useGetDashboardStatsQuery } from '@/store/endpoints/dashboard';
import { formatNumber } from '@/utils/format';
import s from '../styles/Dashboard.module.scss';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'purple',
  DRAFT: 'default',
  PUBLISHED: 'green',
  REVIEW: 'orange',
};

const SIGNAL_TYPE_CLASS: Record<string, string> = {
  LEAD: s['signal_card--lead'],
  RISK: s['signal_card--risk'],
  TREND: s['signal_card--trend'],
  VIRAL_POST: s['signal_card--viral'],
};

export function CreatorDashboard() {
  const { data, isLoading } = useGetDashboardStatsQuery();
  const stats = data?.data;

  if (isLoading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin size="large" /></div>;

  const totalFollowers = (stats?.totalFollowers as number) ?? 0;
  const avgEngagement = (stats?.avgEngagement as number) ?? 0;
  const scheduledPosts = (stats?.scheduledPosts as number) ?? 0;
  const activeCampaigns = (stats?.activeCampaigns as number) ?? 0;
  const growthRate = (stats?.growthRate as number) ?? 0;
  const pendingInteractions = (stats?.pendingInteractions as number) ?? 0;
  const totalRevenue = (stats?.totalRevenue as number) ?? 0;
  const activePipelineValue = (stats?.activePipelineValue as number) ?? 0;
  const recentPosts = (stats?.recentPosts as Array<Record<string, unknown>>) ?? [];
  const newSignals = (stats?.newSignals as Array<Record<string, unknown>>) ?? [];
  const upcomingPosts = (stats?.upcomingPosts as Array<Record<string, unknown>>) ?? [];
  const snapshots = (stats?.snapshots as Array<Record<string, unknown>>) ?? [];

  // Sparkline data from snapshots
  const sparkData = snapshots.map((s) => ({
    followers: s.totalFollowers as number,
    engagement: s.totalEngagement as number,
  }));

  return (
    <>
      {/* KPI Cards */}
      <div className={s.stat_grid}>
        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--followers']}`}>
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Followers</div>
            <div className={s.stat_card__value}>
              <span className={s.sparkline_row}>
                {formatNumber(totalFollowers)}
                {sparkData.length > 2 && (
                  <ResponsiveContainer width={60} height={24}>
                    <AreaChart data={sparkData}>
                      <Area type="monotone" dataKey="followers" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={1.5} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </span>
            </div>
            {growthRate !== 0 && (
              <div className={`${s.stat_card__change} ${growthRate > 0 ? s['stat_card__change--up'] : s['stat_card__change--down']}`}>
                {growthRate > 0 ? '+' : ''}{growthRate}% this period
              </div>
            )}
          </div>
        </div>

        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--engagement']}`}>
            <FontAwesomeIcon icon={faChartLine} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Engagement Rate</div>
            <div className={s.stat_card__value}>{avgEngagement}%</div>
          </div>
        </div>

        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--revenue']}`}>
            <FontAwesomeIcon icon={faIndianRupeeSign} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Total Revenue</div>
            <div className={s.stat_card__value}>₹{totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--pipeline']}`}>
            <FontAwesomeIcon icon={faFunnelDollar} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Active Pipeline</div>
            <div className={s.stat_card__value}>₹{activePipelineValue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Secondary stats row */}
      <div className={s.stat_grid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
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
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--followers']}`}>
            <FontAwesomeIcon icon={faCalendarDays} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Scheduled Posts</div>
            <div className={s.stat_card__value}>{scheduledPosts}</div>
          </div>
        </div>
        <div className={s.stat_card}>
          <div className={`${s.stat_card__icon} ${s['stat_card__icon--engagement']}`}>
            <FontAwesomeIcon icon={faComments} />
          </div>
          <div className={s.stat_card__content}>
            <div className={s.stat_card__label}>Pending Replies</div>
            <div className={s.stat_card__value}>{pendingInteractions}</div>
          </div>
        </div>
      </div>

      {/* Main content: Recent Posts + Signals + Upcoming */}
      <div className={s.triple_panel}>
        <div className={s.section_card}>
          <div className={s.section_title}>
            Recent Posts
            <Link to="/content" className={s.view_all_link}>View all →</Link>
          </div>
          {recentPosts.length === 0 ? (
            <Empty description="No posts yet. Create your first!" />
          ) : (
            recentPosts.map((post) => (
              <div key={post.id as string} className={s.post_item}>
                <div className={s.post_item__info}>
                  <div className={s.post_item__caption}>{(post.caption as string)?.slice(0, 50) || 'Untitled'}</div>
                  <div className={s.post_item__meta}>{post.platform as string} · {post.postType as string}</div>
                </div>
                <Tag color={STATUS_COLOR[post.status as string] ?? 'default'}>{post.status as string}</Tag>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* AI Signals */}
          <div className={s.section_card}>
            <div className={s.section_title}>
              <span><FontAwesomeIcon icon={faSatelliteDish} style={{ marginRight: 8, color: '#6366f1' }} />Signals</span>
              <Link to="/crm/signals" className={s.view_all_link}>View all →</Link>
            </div>
            {newSignals.length === 0 ? (
              <Empty description="No new signals" />
            ) : (
              newSignals.slice(0, 3).map((sig) => (
                <Link to="/crm/signals" key={sig.id as string} className={`${s.signal_card} ${SIGNAL_TYPE_CLASS[sig.type as string] ?? ''}`}>
                  <div className={s.signal_card__title}>{sig.title as string}</div>
                  <div className={s.signal_card__description}>{sig.description as string}</div>
                </Link>
              ))
            )}
          </div>

          {/* Upcoming Posts */}
          <div className={s.section_card}>
            <div className={s.section_title}>
              <span><FontAwesomeIcon icon={faCalendarDays} style={{ marginRight: 8, color: '#8b5cf6' }} />Upcoming</span>
              <Link to="/calendar" className={s.view_all_link}>Calendar →</Link>
            </div>
            {upcomingPosts.length === 0 ? (
              <Empty description="No upcoming posts" />
            ) : (
              upcomingPosts.map((post) => (
                <div key={post.id as string} className={s.upcoming_item}>
                  <span className={s.upcoming_item__time}>
                    {new Date(post.scheduledAt as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className={s.upcoming_item__caption}>{(post.caption as string)?.slice(0, 40) || 'Untitled'}</span>
                  <Tag>{post.platform as string}</Tag>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
