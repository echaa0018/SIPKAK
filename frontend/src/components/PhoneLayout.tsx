import { NavLink } from 'react-router';
import { BottomNav } from './BottomNav';
import { MapView } from './MapView';
import styles from './PhoneLayout.module.css';
import type { LayoutProps, ReporterView } from './ReporterShell';
import { ReportList } from './ReportList';
import { ReportSheet } from './ReportSheet';

const titles: Record<ReporterView, string | null> = {
  map: null, // the map and list show the SIPKAK name with the Map/List switch instead
  list: null,
  new: 'Report damage',
  mine: 'My reports',
  notifications: 'Notifications',
};

const plural = (n: number) => (n === 1 ? '1 report' : `${n} reports`);

/** Phone layout: a top bar, one screen, and the bottom nav. */
export function PhoneLayout(props: LayoutProps) {
  const { view, reports, loading, loadError, selected, onSelect, onCloseSelected, reload } = props;
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

      {loadError && (
        <p className={styles.error} role="alert">
          Couldn’t load the reports. Check your connection and reload the page.
        </p>
      )}

      <main className={styles.main}>
        {view === 'map' && (
          <>
            <MapView
              reports={reports}
              variant="phone"
              selectedId={selected?.id}
              onSelect={onSelect}
            />
            {selected && (
              <ReportSheet report={selected} onClose={onCloseSelected} onConfirmed={reload} />
            )}
          </>
        )}
        {view === 'list' && (
          <ReportList
            reports={reports}
            loading={loading}
            summary={`${plural(reports.length)} on campus · newest first`}
            onSelect={onSelect}
            variant="phone"
          />
        )}
        {/* Temporary placeholders: the following steps fill in these screens. */}
        {view === 'new' && <p className={styles.placeholder}>Report damage form</p>}
        {view === 'mine' && <p className={styles.placeholder}>Your reports</p>}
        {view === 'notifications' && <p className={styles.placeholder}>Your notifications</p>}
      </main>

      <BottomNav view={view} />
    </div>
  );
}
