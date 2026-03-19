import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPenToSquare, faWandMagicSparkles, faImages,
  faLayerGroup, faArrowLeft, faExpand, faCompress,
  faScissors, faMagnifyingGlassChart,
} from '@fortawesome/free-solid-svg-icons';
import { Button, Tooltip } from 'antd';
import styles from './Studio.module.scss';

const STUDIO_NAV = [
  { to: '/studio/compose', icon: faPenToSquare, label: 'Compose' },
  { to: '/studio/media-lab', icon: faImages, label: 'Media Lab' },
  { to: '/studio/video-lab', icon: faScissors, label: 'Video Lab' },
  { to: '/studio/video-analysis', icon: faMagnifyingGlassChart, label: 'Video Analysis' },
  { to: '/studio/templates', icon: faLayerGroup, label: 'Templates' },
  { to: '/studio/ai', icon: faWandMagicSparkles, label: 'AI Copilot' },
];

export function StudioLayout() {
  const navigate = useNavigate();
  const [isZen, setIsZen] = useState(false);

  return (
    <div className={`${styles.studio} ${isZen ? styles['studio--zen'] : ''}`}>
      {/* Studio top bar */}
      <header className={styles.studio__header}>
        <div className={styles.studio__header_left}>
          <Tooltip title="Back to Dashboard">
            <Button
              type="text"
              size="small"
              icon={<FontAwesomeIcon icon={faArrowLeft} />}
              onClick={() => navigate('/dashboard')}
              className={styles.studio__back}
            />
          </Tooltip>
          <span className={styles.studio__title}>Studio</span>
        </div>

        <nav className={styles.studio__nav}>
          {STUDIO_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.studio__nav_item} ${isActive ? styles['studio__nav_item--active'] : ''}`
              }
            >
              <FontAwesomeIcon icon={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.studio__header_right}>
          <Tooltip title={isZen ? 'Exit Zen Mode' : 'Zen Mode'}>
            <Button
              type="text"
              size="small"
              icon={<FontAwesomeIcon icon={isZen ? faCompress : faExpand} />}
              onClick={() => setIsZen(!isZen)}
            />
          </Tooltip>
        </div>
      </header>

      {/* Studio content area */}
      <div className={styles.studio__body}>
        <Outlet />
      </div>
    </div>
  );
}
