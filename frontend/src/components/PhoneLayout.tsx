import { NavLink } from 'react-router';
import { BottomNav } from './BottomNav';
import styles from './PhoneLayout.module.css';
import type { ReporterView } from './ReporterShell';

const titles: Record<ReporterView, string | null> = {
  map: null, // the map and list show the SIPKAK name with the Map/List switch instead
  list: null,
  new: 'Report damage',
  mine: 'My reports',
  notifications: 'Notifications',
};

/** Phone layout: a top bar, one screen, and the bottom nav. */
export function PhoneLayout({ view }: { view: ReporterView }) {
  const title = titles[view];

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        {title ? (
          <h1 className={styles.title}>{title}</h1>
        ) : (
          <>
            <p className={styles.brand}>
              <strong>SIPKAK</strong> <span>ITB Ganesha</span>
            </p>
            <nav className={styles.switch} aria-label="Show reports as">
              <NavLink to="/" end className={styles.switchItem}>
                Map
              </NavLink>
              <NavLink to="/list" className={styles.switchItem}>
                List
              </NavLink>
            </nav>
          </>
        )}
      </header>

      {/* Temporary placeholders: the following steps fill in each screen. */}
      <main className={styles.main}>
        {view === 'map' && <p className={styles.placeholder}>Campus map</p>}
        {view === 'list' && <p className={styles.placeholder}>All reports</p>}
        {view === 'new' && <p className={styles.placeholder}>Report damage form</p>}
        {view === 'mine' && <p className={styles.placeholder}>Your reports</p>}
        {view === 'notifications' && <p className={styles.placeholder}>Your notifications</p>}
      </main>

      <BottomNav view={view} />
    </div>
  );
}
