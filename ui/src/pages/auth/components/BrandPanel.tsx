import type { ReactNode } from 'react';
import styles from '../Auth.module.scss';

interface BrandPanelProps {
  tagline: ReactNode;
  children: ReactNode;
}

export function BrandPanel({ tagline, children }: BrandPanelProps) {
  return (
    <div className={styles.auth__brand}>
      <div className={`${styles.auth__glow} ${styles['auth__glow--1']}`} />
      <div className={`${styles.auth__glow} ${styles['auth__glow--2']}`} />

      <div className={styles.auth__brand_inner}>
        <div className={styles.auth__logo}>
          <div className={styles.auth__logo_mark}>Cr</div>
          <div className={styles.auth__logo_text}>
            <h1>CrMS</h1>
            <span>Creator Management System</span>
          </div>
        </div>

        <div>
          <h2 className={styles.auth__tagline}>{tagline}</h2>
          {children}
        </div>

        <p className={styles.auth__copyright}>&copy; {new Date().getFullYear()} CrMS. All rights reserved.</p>
      </div>
    </div>
  );
}
