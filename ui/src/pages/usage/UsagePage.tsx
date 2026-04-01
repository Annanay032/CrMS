import { useMemo } from 'react';
import { Tag } from 'antd';
import {
  DashboardOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useGetUsageSummaryQuery, useGetUsageHistoryQuery } from '@/store/endpoints/usage';
import type { UsageTier } from '@/types';
import s from './styles/Usage.module.scss';

const TIER_COLORS: Record<UsageTier, string> = { FREE: 'blue', PRO: 'gold', ENTERPRISE: 'purple' };

function formatAgent(name: string) {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function UsagePage() {
  const { data: summaryRes } = useGetUsageSummaryQuery();
  const { data: historyRes } = useGetUsageHistoryQuery({ days: 30 });
  const summary = summaryRes?.data;
  const history = useMemo(() => historyRes?.data ?? [], [historyRes?.data]);
  const pct = summary ? Math.round((summary.usedToday / summary.dailyLimit) * 100) : 0;

  const totalCalls = useMemo(
    () => summary?.breakdown?.reduce((sum, b) => sum + b.calls, 0) ?? 0,
    [summary],
  );

  const total30dCost = useMemo(
    () => history.reduce((sum, d) => sum + (d.cost ?? 0), 0),
    [history],
  );

  return (
    <div>
      {/* Header */}
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <DashboardOutlined className={s.page_title__icon} />
          AI Usage & Budget
        </h1>
        <Tag color={TIER_COLORS[summary?.tier ?? 'FREE']}>{summary?.tier ?? 'FREE'}</Tag>
      </div>

      {/* Stats cards */}
      <div className={s.stats_row}>
        <div className={s.stat_card}>
          <div className={s.stat_card__value}>{summary?.usedToday?.toLocaleString() ?? 0}</div>
          <div className={s.stat_card__label}>Tokens Used Today</div>
        </div>
        <div className={s.stat_card}>
          <div className={s.stat_card__value}>{summary?.remaining?.toLocaleString() ?? 0}</div>
          <div className={s.stat_card__label}>Tokens Remaining</div>
        </div>
        <div className={s.stat_card}>
          <div className={s.stat_card__value}>{totalCalls}</div>
          <div className={s.stat_card__label}>Agent Calls Today</div>
        </div>
        <div className={s.stat_card}>
          <div className={s.stat_card__value}>${(summary?.costToday ?? 0).toFixed(4)}</div>
          <div className={s.stat_card__label}>Est. Cost Today</div>
          <div className={s.stat_card__sub}>30d: ${total30dCost.toFixed(2)}</div>
        </div>
      </div>

      {/* Budget bar */}
      <div className={s.budget_section}>
        <div className={s.budget_header}>
          <span className={s.budget_title}>
            <ThunderboltOutlined />
            Daily Budget
          </span>
          <span>{pct}%</span>
        </div>
        <div className={s.budget_bar}>
          <div
            className={`${s.budget_bar__fill} ${pct >= 90 ? s['budget_bar__fill--danger'] : pct >= 70 ? s['budget_bar__fill--warn'] : ''}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={s.budget_meta}>
          <span>{summary?.usedToday?.toLocaleString() ?? 0} / {summary?.dailyLimit?.toLocaleString() ?? 0} tokens</span>
          <span>Resets daily</span>
        </div>
      </div>

      {/* Agent breakdown */}
      <div className={s.breakdown_section}>
        <div className={s.section_title}>
          <ApiOutlined /> Agent Breakdown (Today)
        </div>
        {summary?.breakdown && summary.breakdown.length > 0 ? (
          <div className={s.breakdown_grid}>
            {summary.breakdown.map((b) => (
              <div key={b.agentType} className={s.agent_card}>
                <div className={s.agent_card__name}>{formatAgent(b.agentType)}</div>
                <div className={s.agent_card__stats}>
                  <div className={s.agent_card__stat}><span>{b.tokensUsed.toLocaleString()}</span> tokens</div>
                  <div className={s.agent_card__stat}><span>{b.calls}</span> calls</div>
                  <div className={s.agent_card__stat}><span>${b.cost?.toFixed(4) ?? '0'}</span></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={s.empty_state}>No agent calls today</div>
        )}
      </div>

      {/* 30-day history chart */}
      <div className={s.chart_section}>
        <div className={s.chart_header}>
          <span className={s.section_title}>
            <DollarOutlined /> 30-Day History
          </span>
        </div>
        {history.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={history}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v: string) => v.slice(5)} />
              <YAxis yAxisId="tokens" orientation="left" />
              <YAxis yAxisId="cost" orientation="right" tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
              <Tooltip
                formatter={(value, name) =>
                  name === 'cost' ? [`$${Number(value).toFixed(4)}`, 'Cost'] : [Number(value).toLocaleString(), name === 'tokens' ? 'Tokens' : 'Calls']
                }
              />
              <Bar yAxisId="tokens" dataKey="tokens" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              <Line yAxisId="cost" type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className={s.empty_state}>No usage history yet</div>
        )}
      </div>
    </div>
  );
}
