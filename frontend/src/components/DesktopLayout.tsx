import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { Report } from '../api/reports';
import type { LatLng } from '../lib/geo';
import styles from './DesktopLayout.module.css';
import { PlusIcon } from './icons';
import { MapView } from './MapView';
import { NewReportForm } from './NewReportForm';
import type { LayoutProps } from './ReporterShell';
import { ReportDetail } from './ReportDetail';
import { ReportList } from './ReportList';
import { ReportSentDialog } from './ReportSentDialog';

const tabs = [
  { to: '/', label: 'All reports', view: 'all' },
  { to: '/mine', label: 'My reports', view: 'mine' },
  { to: '/notifications', label: 'Notifications', view: 'notifications' },
] as const;

const plural = (n: number) => (n === 1 ? '1 report' : `${n} reports`);

/** Desktop layout: a header, then three panes (list tabs, map, details) split by thin lines. */
export function DesktopLayout(props: LayoutProps) {
  const { view, reports, loading, loadError, selected, onSelect, onCloseSelected, reload } = props;
  // The left pane shows My reports or Notifications on those URLs, and all reports otherwise
  // (on /list and /report/new too).
  const leftTab = view === 'mine' || view === 'notifications' ? view : 'all';
  const navigate = useNavigate();
  // The form's pin, placed on the big map. Starts empty: click the map or use your location.
  const [pin, setPin] = useState<LatLng | null>(null);
  // The report you just sent, while the "Report sent" pop-up is open.
  const [sent, setSent] = useState<Report | null>(null);

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
          {leftTab === 'all' && (
            <ReportList
              reports={reports}
              loading={loading}
              summary={`${plural(reports.length)} · newest first`}
              onSelect={onSelect}
              selectedId={selected?.id}
              variant="desktop"
            />
          )}
          {/* Temporary placeholders: the following steps fill in these tabs. */}
          {leftTab === 'mine' && <p className={styles.placeholder}>Your reports</p>}
          {leftTab === 'notifications' && <p className={styles.placeholder}>Your notifications</p>}
        </aside>

        <section className={styles.center} aria-label="Map">
          {loadError && (
            <p className={styles.error} role="alert">
              Couldn’t load the reports. Check your connection and reload the page.
            </p>
          )}
          <MapView
            reports={reports}
            variant="desktop"
            selectedId={selected?.id}
            onSelect={onSelect}
            pinPicking={view === 'new' ? { pin, onChange: setPin } : undefined}
          />
        </section>

        <aside className={styles.right} aria-label="Details">
          {view === 'new' ? (
            <NewReportForm
              variant="desktop"
              pin={pin}
              onPinChange={setPin}
              reports={reports}
              onSent={(report) => {
                setPin(null);
                reload(); // so the new marker is on the map behind the pop-up
                setSent(report);
              }}
              onConfirmed={reload}
              onClose={() => navigate('/')}
            />
          ) : selected ? (
            <ReportDetail report={selected} onClose={onCloseSelected} onConfirmed={reload} />
          ) : (
            <p className={styles.placeholder}>Select a report on the map or in the list.</p>
          )}
        </aside>
      </div>

      {sent && (
        <ReportSentDialog
          report={sent}
          variant="desktop"
          onClose={() => {
            setSent(null);
            onSelect(sent.id); // the right pane then shows the new report
          }}
          onSeeMine={() => {
            setSent(null);
            navigate(`/mine?report=${sent.id}`);
          }}
        />
      )}
    </div>
  );
}
