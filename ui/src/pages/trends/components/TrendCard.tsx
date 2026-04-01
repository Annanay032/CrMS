import { Tag, Button } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faClock, faWandMagicSparkles, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import type { Trend } from '@/types';
import { URGENCY_COLORS, REACH_COLORS } from '../constants';
import s from '../styles/Trends.module.scss';

interface TrendCardProps {
  trend: Trend;
  onScore?: () => void;
  onDraft?: () => void;
}

export function TrendCard({ trend, onScore, onDraft }: TrendCardProps) {
  const urgencyIcon = trend.urgency === 'act-now' ? faBolt : trend.urgency === 'this-week' ? faClock : undefined;

  return (
    <div className={s.trend_card}>
      <div className={s.trend_card__header}>
        <span className={s.trend_card__title}>{trend.title}</span>
        <Tag color={URGENCY_COLORS[trend.urgency] ?? 'blue'} icon={urgencyIcon ? <FontAwesomeIcon icon={urgencyIcon} /> : undefined}>
          {trend.urgency}
        </Tag>
      </div>

      <div className={s.trend_card__tags}>
        <Tag color="blue">{trend.category}</Tag>
        <Tag>{Array.isArray(trend.platform) ? trend.platform.join(', ') : trend.platform}</Tag>
        <Tag color={REACH_COLORS[trend.estimatedReach] ?? 'default'}>{trend.estimatedReach} reach</Tag>
      </div>

      <p className={s.trend_card__description}>{trend.description}</p>

      <div className={s.trend_card__idea}>
        <div className={s.trend_card__idea_label}>Content Idea</div>
        <div className={s.trend_card__idea_text}>{trend.contentIdea}</div>
      </div>

      <div className={s.trend_card__relevance}>
        <span className={s.relevance_label}>Relevance</span>
        <div className={s.relevance_bar}>
          <div className={s.relevance_fill} style={{ width: `${trend.relevanceScore}%` }} />
        </div>
        <span className={s.relevance_value}>{trend.relevanceScore}%</span>
      </div>

      <div className={s.trend_card__actions}>
        <Button size="small" icon={<FontAwesomeIcon icon={faWandMagicSparkles} />} onClick={onScore}>
          Score
        </Button>
        <Button size="small" type="primary" icon={<FontAwesomeIcon icon={faPenToSquare} />} onClick={onDraft}>
          Create Post
        </Button>
      </div>
    </div>
  );
}
