import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import type { Report } from '../api/reports';
import { campusCenter } from '../lib/campusMap';
import type { LatLng } from '../lib/geo';
import { BottomNav } from './BottomNav';
import { notifyReportsChanged } from '../lib/reportSync';
import { LockIcon } from './icons';
import { MapView } from './MapView';
import { MyReportsList } from './MyReportsList';
import { NewReportForm } from './NewReportForm';
import { NotificationList } from './NotificationList';
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
  const { view, reports, mineReports, loading, loadError, selected, onSelect, onCloseSelected, reload } = props;
  const { notifications, unread, onOpenNotification } = props;
  const title = titles[view];
  // The form's pin starts in the middle of campus; drag the map or use your location to move it.
  const [pin, setPin] = useState<LatLng | null>({ lat: campusCenter[0], lng: campusCenter[1] });
  // The report you just sent, while the "Report sent" pop-up is open.
  const [sent, setSent] = useState<Report | null>(null);
  const navigate = useNavigate();

  return (
    <div className={styles.layout}>
      <header className={styles.topBar}>
        <div className={styles.headerContent}>
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
        </div>
        <Link to="/admin" className={styles.adminEntry}>
          <LockIcon size={16} /> Admin
        </Link>
      </header>

      {loadError && (
        <p className={styles.error} role="alert">
          Couldn’t load the reports. Trying again…
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
              reload(); // only approved reports appear on the public map
              notifyReportsChanged(); // notify admin tabs immediately
              setSent(report);
            }}
            onConfirmed={reload}
          />
        )}
        {view === 'mine' && (
          <>
            <MyReportsList reports={mineReports} loading={loading} onSelect={onSelect} variant="phone" />
            {selected?.isMine && (
              <ReportSheet report={selected} onClose={onCloseSelected} onConfirmed={reload} />
            )}
          </>
        )}
        {view === 'notifications' && (
          <NotificationList
            notifications={notifications}
            onOpen={onOpenNotification}
            variant="phone"
          />
        )}
      </main>

      <BottomNav view={view} unread={unread} />

      {sent && (
        <ReportSentDialog
          report={sent}
          variant="phone"
          onClose={() => {
            setSent(null);
            navigate('/'); // back to public map; My reports is the private view
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
