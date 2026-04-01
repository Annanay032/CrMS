import { useState } from 'react';
import { Card, Statistic, Spin, Empty, Select, Tag, Button, Space } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSatelliteDish, faBolt, faShieldHalved, faArrowTrendUp, faFire,
  faCheck, faBan,
} from '@fortawesome/free-solid-svg-icons';
import {
  useListSignalsQuery,
  useGetSignalSummaryQuery,
  useUpdateSignalStatusMutation,
} from '@/store/endpoints/crm';
import type { Signal, SignalType, SignalStatus } from '@/types';
import s from './styles/Crm.module.scss';

const TYPE_ICONS: Record<string, typeof faBolt> = {
  LEAD: faBolt,
  RISK: faShieldHalved,
  TREND: faArrowTrendUp,
  VIRAL_POST: faFire,
};

const TYPE_LABELS: Record<string, string> = {
  LEAD: 'Lead', RISK: 'Risk', TREND: 'Trend', VIRAL_POST: 'Viral Post',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'blue', ACTIONED: 'green', IGNORED: 'default',
};

function signalCardModifier(type: string) {
  switch (type) {
    case 'LEAD': return s['signal_card--lead'];
    case 'RISK': return s['signal_card--risk'];
    case 'TREND': return s['signal_card--trend'];
    case 'VIRAL_POST': return s['signal_card--viral'];
    default: return '';
  }
}

export function SignalsDashboard() {
  const [filters, setFilters] = useState<{ type?: SignalType; status?: SignalStatus }>({});
  const [page, setPage] = useState(1);

  const { data: signalsData, isLoading } = useListSignalsQuery({ page, limit: 20, ...filters });
  const { data: summaryData } = useGetSignalSummaryQuery();
  const [updateStatus] = useUpdateSignalStatusMutation();

  const signals = signalsData?.data ?? [];
  const summary = summaryData?.data;

  const handleAction = async (signal: Signal, newStatus: SignalStatus) => {
    await updateStatus({ id: signal.id, status: newStatus }).unwrap();
  };

  return (
    <div>
      <div className={s.page_header}>
        <h1 className={s.page_title}>
          <FontAwesomeIcon icon={faSatelliteDish} className={s.page_title__icon} />
          Signal Engine
        </h1>
      </div>

      {/* Summary Cards */}
      <div className={s.signals_summary}>
        <Card>
          <Statistic
            title="Leads"
            value={summary?.byType?.LEAD ?? 0}
            prefix={<FontAwesomeIcon icon={faBolt} style={{ color: '#22c55e' }} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Risks"
            value={summary?.byType?.RISK ?? 0}
            prefix={<FontAwesomeIcon icon={faShieldHalved} style={{ color: '#ef4444' }} />}
          />
        </Card>
        <Card>
          <Statistic
            title="Trends"
            value={summary?.byType?.TREND ?? 0}
            prefix={<FontAwesomeIcon icon={faArrowTrendUp} style={{ color: '#6366f1' }} />}
          />
        </Card>
        <Card>
          <Statistic
            title="High Value (70+)"
            value={summary?.highValueCount ?? 0}
            prefix={<FontAwesomeIcon icon={faFire} style={{ color: '#f59e0b' }} />}
            valueStyle={{ color: '#f59e0b' }}
          />
        </Card>
      </div>

      {/* Filters */}
      <div className={s.filters_bar}>
        <div className={s.filters_left}>
          <Select
            placeholder="Signal Type"
            allowClear
            style={{ width: 140 }}
            options={[
              { value: 'LEAD', label: 'Lead' },
              { value: 'RISK', label: 'Risk' },
              { value: 'TREND', label: 'Trend' },
              { value: 'VIRAL_POST', label: 'Viral Post' },
            ]}
            onChange={(val) => { setFilters((prev) => ({ ...prev, type: val })); setPage(1); }}
          />
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 130 }}
            options={[
              { value: 'NEW', label: 'New' },
              { value: 'ACTIONED', label: 'Actioned' },
              { value: 'IGNORED', label: 'Ignored' },
            ]}
            onChange={(val) => { setFilters((prev) => ({ ...prev, status: val })); setPage(1); }}
          />
        </div>
      </div>

      {/* Signal List */}
      {isLoading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : signals.length === 0 ? (
        <Empty description="No signals detected yet. Signals are auto-generated from your Social Listening data." />
      ) : (
        <div className={s.signal_list}>
          {signals.map((signal) => (
            <div key={signal.id} className={`${s.signal_card} ${signalCardModifier(signal.type)}`}>
              <div className={s.signal_card__header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FontAwesomeIcon icon={TYPE_ICONS[signal.type] ?? faBolt} />
                  <span className={s.signal_card__title}>{signal.title}</span>
                </div>
                <span className={s.signal_card__score}>{signal.opportunityScore}</span>
              </div>
              {signal.description && (
                <div className={s.signal_card__description}>{signal.description}</div>
              )}
              <div className={s.signal_card__footer}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag>{TYPE_LABELS[signal.type]}</Tag>
                  <Tag color={STATUS_COLORS[signal.status]}>{signal.status}</Tag>
                  <span>{new Date(signal.createdAt).toLocaleDateString()}</span>
                </div>
                {signal.status === 'NEW' && (
                  <Space size="small">
                    <Button
                      size="small"
                      type="primary"
                      icon={<FontAwesomeIcon icon={faCheck} />}
                      onClick={() => handleAction(signal, 'ACTIONED')}
                    >
                      Action
                    </Button>
                    <Button
                      size="small"
                      icon={<FontAwesomeIcon icon={faBan} />}
                      onClick={() => handleAction(signal, 'IGNORED')}
                    >
                      Ignore
                    </Button>
                  </Space>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
