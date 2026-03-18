import type { ReactNode } from 'react';
import styles from '../Auth.module.scss';

interface BrandPanelProps {
  tagline: ReactNode;
  children: ReactNode;
}

export function BrandPanel({ tagline, children }: BrandPanelProps) {
  return (
    <div className={styles.auth__brand}>
      <div className={styles.auth__brand_inner}>
        <div>
          <h1 className={styles.auth__brand_title}>CrMS</h1>
          <p className={styles.auth__brand_sub}>Creator Management System</p>
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
