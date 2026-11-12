import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import type { Report } from '../api/reports';
import { campusCenter } from '../lib/campusMap';
import type { LatLng } from '../lib/geo';
import { BottomNav } from './BottomNav';
import { MapView } from './MapView';
import { NewReportForm } from './NewReportForm';
import styles from './PhoneLayout.module.css';
import type { LayoutProps, ReporterView } from './ReporterShell';
import { ReportList } from './ReportList';
import { ReportSentDialog } from './ReportSentDialog';
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
  // The form's pin starts in the middle of campus; drag the map or use your location to move it.
  const [pin, setPin] = useState<LatLng | null>({ lat: campusCenter[0], lng: campusCenter[1] });
  // The report you just sent, while the "Report sent" pop-up is open.
  const [sent, setSent] = useState<Report | null>(null);
  const navigate = useNavigate();

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
        {view === 'new' && (
          <NewReportForm
            variant="phone"
            pin={pin}
            onPinChange={setPin}
            reports={reports}
            onSent={(report) => {
              reload(); // so the new marker is on the map behind the pop-up
              setSent(report);
            }}
            onConfirmed={reload}
          />
        )}
        {/* Temporary placeholders: the following steps fill in these screens. */}
        {view === 'mine' && <p className={styles.placeholder}>Your reports</p>}
        {view === 'notifications' && <p className={styles.placeholder}>Your notifications</p>}
      </main>

      <BottomNav view={view} />

      {sent && (
        <ReportSentDialog
          report={sent}
          variant="phone"
          onClose={() => {
            setSent(null);
            onSelect(sent.id); // back to the map, with the new report open
          }}
          onSeeMine={() => {
            setSent(null);
            navigate('/mine');
          }}
        />
      )}
    </div>
  );
}
