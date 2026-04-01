import { Card, Statistic, Spin, Empty, Tag } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFunnelDollar, faHandshake, faSackDollar, faScaleBalanced,
} from '@fortawesome/free-solid-svg-icons';
import { useGetPipelineQuery } from '@/store/endpoints/crm';
import type { CrmBrandDeal } from '@/types';
import s from './styles/Crm.module.scss';

const STAGE_ORDER = ['PROSPECT', 'CONTACTED', 'LEAD', 'NEGOTIATING', 'CONFIRMED', 'IN_PROGRESS', 'DELIVERED', 'PAID', 'CANCELLED', 'LOST'];

const STAGE_LABELS: Record<string, string> = {
  PROSPECT: 'Prospect', CONTACTED: 'Contacted', LEAD: 'Lead', NEGOTIATING: 'Negotiating',
  CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress', DELIVERED: 'Delivered', PAID: 'Paid',
  CANCELLED: 'Cancelled', LOST: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  PROSPECT: 'default', CONTACTED: 'processing', LEAD: 'blue', NEGOTIATING: 'orange',
  CONFIRMED: 'cyan', IN_PROGRESS: 'geekblue', DELIVERED: 'lime', PAID: 'green',
  CANCELLED: 'red', LOST: 'volcano',
};

export function PipelinePage() {
  const { data, isLoading } = useGetPipelineQuery();

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;

  const pipeline = data?.data?.pipeline ?? {};
  const summary = data?.data?.summary ?? { totalDeals: 0, totalValue: 0, weightedPipeline: 0, wonValue: 0 };

  const activeStages = STAGE_ORDER.filter((stage) => (pipeline[stage]?.length ?? 0) > 0 || ['PROSPECT', 'CONTACTED', 'NEGOTIATING', 'CONFIRMED', 'PAID'].includes(stage));

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faFunnelDollar} className={s.page_title__icon} />
          Deal Pipeline
        </h1>
      </div>

      <div className={s.pipeline_summary}>
        <Card>
          <Statistic
            title="Total Deals"
            value={summary.totalDeals}
            prefix={<FontAwesomeIcon icon={faHandshake} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Pipeline Value"
            value={summary.totalValue}
            prefix="₹"
            formatter={(v) => Number(v).toLocaleString()}
          />
        </Card>
        <Card>
          <Statistic
            title="Weighted Pipeline"
            value={summary.weightedPipeline}
            prefix={<FontAwesomeIcon icon={faScaleBalanced} />}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
        <Card>
          <Statistic
            title="Won Value"
            value={summary.wonValue}
            prefix={<FontAwesomeIcon icon={faSackDollar} />}
            valueStyle={{ color: '#22c55e' }}
            formatter={(v) => `₹${Number(v).toLocaleString()}`}
          />
        </Card>
      </div>

      {summary.totalDeals === 0 ? (
        <Empty description="No deals in the pipeline yet. Deals from Signal Engine will appear here automatically." />
      ) : (
        <div className={s.pipeline_board}>
          {activeStages.map((stage) => {
            const deals: CrmBrandDeal[] = pipeline[stage] ?? [];
            const stageValue = deals.reduce((sum, d) => sum + d.dealValue, 0);
            return (
              <div key={stage} className={s.pipeline_column}>
                <div className={s.pipeline_column_header}>
                  <div>
                    <span className={s.pipeline_column_title}>{STAGE_LABELS[stage] ?? stage}</span>
                    <Tag color={STAGE_COLORS[stage]} style={{ marginLeft: 8 }}>
                      ₹{stageValue.toLocaleString()}
                    </Tag>
                  </div>
                  <span className={s.pipeline_column_count}>{deals.length}</span>
                </div>
                <div className={s.pipeline_cards}>
                  {deals.map((deal) => (
                    <div key={deal.id} className={s.deal_card}>
                      <div className={s.deal_card__brand}>{deal.brandName}</div>
                      <div className={s.deal_card__value}>₹{deal.dealValue.toLocaleString()}</div>
                      <div className={s.deal_card__meta}>
                        {deal.deliverables?.slice(0, 2).map((d) => (
                          <Tag key={d} style={{ fontSize: 11 }}>{d}</Tag>
                        ))}
                      </div>
                      {deal.probability > 0 && (
                        <div className={s.deal_card__probability}>
                          {deal.probability}% probability
                          {deal.expectedValue ? ` · ₹${deal.expectedValue.toLocaleString()} expected` : ''}
                        </div>
                      )}
                    </div>
                  ))}
                  {deals.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '16px 8px', color: '#94a3b8', fontSize: 13 }}>
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
