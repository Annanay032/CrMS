import { STATS } from '../constants';
import styles from '../Auth.module.scss';

export function StatGrid() {
  return (
    <div className={styles.auth__stats}>
      {STATS.map((s) => (
        <div key={s.label} className={styles.auth__stat}>
          <div className={styles.auth__stat_value}>{s.value}</div>
          <div className={styles.auth__stat_label}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
