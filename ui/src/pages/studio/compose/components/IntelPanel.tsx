import { Typography, Tag, Progress, Spin } from 'antd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faChartSimple, faClock, faHashtag, faLightbulb, faUsers } from '@fortawesome/free-solid-svg-icons';
import type { IntelData } from '../types';
import styles from '../styles/compose.module.scss';

const { Text } = Typography;

interface Props {
  intel: IntelData | null;
  loading: boolean;
  onHashtagClick: (tag: string) => void;
}

export function IntelPanel({ intel, loading, onHashtagClick }: Props) {
  if (loading) {
    return (
      <div className={styles.intel}>
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin tip="Analyzing..." />
        </div>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className={styles.intel}>
        <div className={styles.intel_empty}>
          <FontAwesomeIcon icon={faBrain} style={{ fontSize: 32, color: '#6366f1', marginBottom: 12 }} />
          <Text type="secondary">Write a caption and select a platform, then click the brain icon to get intelligence.</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.intel}>
      <div className={styles.intel_body}>
        <div className={styles.intel_card}>
          <Text strong style={{ fontSize: 13 }}>
            <FontAwesomeIcon icon={faChartSimple} style={{ marginRight: 6, color: '#6366f1' }} />
            Content Score
          </Text>
          <div className={styles.intel_score}>
            <Progress type="circle" percent={intel.contentScore ?? 0} size={64} strokeColor="#6366f1" />
          </div>
        </div>

        <div className={styles.intel_card}>
          <Text strong style={{ fontSize: 13 }}>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: 6, color: '#f59e0b' }} />
            Best Times to Post
          </Text>
          <div className={styles.intel_tags}>
            {(intel.bestTimes ?? []).map((t, i) => <Tag key={i} color="gold">{t}</Tag>)}
          </div>
        </div>

        <div className={styles.intel_card}>
          <Text strong style={{ fontSize: 13 }}>
            <FontAwesomeIcon icon={faHashtag} style={{ marginRight: 6, color: '#10b981' }} />
            Suggested Hashtags
          </Text>
          <div className={styles.intel_tags}>
            {(intel.hashtags ?? []).map((h, i) => (
              <Tag key={i} color="green" style={{ cursor: 'pointer' }} onClick={() => onHashtagClick(h)}>{h}</Tag>
            ))}
          </div>
        </div>

        <div className={styles.intel_card}>
          <Text strong style={{ fontSize: 13 }}>
            <FontAwesomeIcon icon={faLightbulb} style={{ marginRight: 6, color: '#f97316' }} />
            Tips
          </Text>
          <ul className={styles.intel_tips}>
            {(intel.tips ?? []).map((tip, i) => (
              <li key={i}><Text style={{ fontSize: 12 }}>{tip}</Text></li>
            ))}
          </ul>
        </div>

        {intel.audienceInsight && (
          <div className={styles.intel_card}>
            <Text strong style={{ fontSize: 13 }}>
              <FontAwesomeIcon icon={faUsers} style={{ marginRight: 6, color: '#8b5cf6' }} />
              Audience Insight
            </Text>
            <Text style={{ fontSize: 12 }}>{intel.audienceInsight}</Text>
          </div>
        )}
      </div>
    </div>
  );
}
