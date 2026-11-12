import { Link } from 'react-router';
import styles from './DesktopLayout.module.css';
import { PlusIcon } from './icons';
import type { ReporterView } from './ReporterShell';

const tabs = [
  { to: '/', label: 'All reports', view: 'all' },
  { to: '/mine', label: 'My reports', view: 'mine' },
  { to: '/notifications', label: 'Notifications', view: 'notifications' },
] as const;

/** Desktop layout: a header, then three panes (list tabs, map, details) split by thin lines. */
export function DesktopLayout({ view }: { view: ReporterView }) {
  // The left pane shows My reports or Notifications on those URLs, and all reports otherwise
  // (on /list and /report/new too).
  const leftTab = view === 'mine' || view === 'notifications' ? view : 'all';

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <p className={styles.brand}>
          <strong>SIPKAK</strong> <span>Campus damage reports · ITB Ganesha</span>
        </p>
        <Link to="/report/new" className={styles.reportButton}>
          <PlusIcon size={20} />
          Report damage
        </Link>
      </header>

      <div className={styles.panes}>
        <aside className={styles.left} aria-label="Reports">
          <nav className={styles.tabs} aria-label="Lists">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                className={styles.tab}
                aria-current={tab.view === leftTab ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          {/* Temporary placeholders: the following steps fill in each pane. */}
          <p className={styles.placeholder}>
            {leftTab === 'all' && 'All reports'}
            {leftTab === 'mine' && 'Your reports'}
            {leftTab === 'notifications' && 'Your notifications'}
          </p>
        </aside>

        <section className={styles.center} aria-label="Map">
          <p className={styles.placeholder}>Campus map</p>
        </section>

        <aside className={styles.right} aria-label="Details">
          <p className={styles.placeholder}>
            {view === 'new' ? 'Report damage form' : 'Select a report on the map or in the list.'}
          </p>
        </aside>
      </div>
    </div>
  );
}
