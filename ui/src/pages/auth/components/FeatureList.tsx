import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faUsers, faBolt } from '@fortawesome/free-solid-svg-icons';
import styles from '../Auth.module.scss';

const FEATURES = [
  { icon: faChartLine, title: 'AI-Powered Analytics', desc: 'Deep insights across Instagram, YouTube, TikTok' },
  { icon: faUsers, title: 'Smart Creator Matching', desc: 'Find the perfect creators for your campaigns' },
  { icon: faBolt, title: '6 AI Agents', desc: 'Automate content, trends, and campaign ops' },
];

export function FeatureList() {
  return (
    <div className={styles.auth__features}>
      {FEATURES.map(({ icon, title, desc }) => (
        <div key={title} className={styles.auth__feature}>
          <div className={styles.auth__feature_icon}>
            <FontAwesomeIcon icon={icon} />
          </div>
          <div>
            <p className={styles.auth__feature_title}>{title}</p>
            <p className={styles.auth__feature_desc}>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
