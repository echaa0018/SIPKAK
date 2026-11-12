import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { AdminReportDetail } from '../components/AdminReportDetail';
import { SignOutIcon } from '../components/icons';
import { MapView } from '../components/MapView';
import { ReportList } from '../components/ReportList';
import { StatusFilter, type StatusFilterValue } from '../components/StatusFilter';
import { clearAdminToken, getAdminToken } from '../lib/adminSession';
import { useIsDesktop } from '../lib/useIsDesktop';
import { useReports } from '../lib/useReports';
import styles from './AdminPage.module.css';

/** /admin: the facilities team's dashboard. */
export function AdminPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { reports, loading, error, reload } = useReports();
  // RequireAdmin only shows this page when there is a token.
  const token = getAdminToken() ?? '';
  const [filter, setFilter] = useState<StatusFilterValue>('all');

  // As on the reporter side, the selected report lives in the URL (?report=142).
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = reports.find((r) => r.id === Number(searchParams.get('report')));
  const select = (id: number) => setSearchParams({ report: String(id) });

  // The filter applies to both the list and the map pins.
  const shown = filter === 'all' ? reports : reports.filter((r) => r.status === filter);

  function signOut() {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <p className={styles.brand}>
          <strong>SIPKAK</strong>{' '}
          <span>{isDesktop ? 'Facilities admin · ITB Ganesha' : 'Facilities admin'}</span>
        </p>
        {isDesktop ? (
          <button type="button" className={styles.textButton} onClick={signOut}>
            Sign out
          </button>
        ) : (
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Sign out"
            onClick={signOut}
          >
            <SignOutIcon />
          </button>
        )}
      </header>

      {error && (
        <p className={styles.error} role="alert">
          Couldn’t load the reports. Trying again…
        </p>
      )}

      {isDesktop ? (
        <div className={styles.panes}>
          <aside className={styles.left} aria-label="Reports">
            <div className={styles.listHeader}>
              <h1 className={styles.heading}>Reports</h1>
              <span className={styles.muted}>Newest first</span>
            </div>
            <StatusFilter reports={reports} value={filter} onChange={setFilter} />
            <ReportList
              reports={shown}
              loading={loading}
              onSelect={select}
              selectedId={selected?.id}
              variant="desktop"
              kind="admin"
              empty="No reports with this status."
            />
          </aside>

          <section className={styles.center} aria-label="Map">
            <MapView
              reports={shown}
              variant="desktop"
              selectedId={selected?.id}
              onSelect={select}
              labelSelected
            />
          </section>

          <aside className={styles.right} aria-label="Details">
            {selected ? (
              <AdminReportDetail
                key={selected.id}
                report={selected}
                token={token}
                onClose={() => setSearchParams({})}
                onSaved={reload}
                onUnauthorized={signOut}
              />
            ) : (
              <p className={styles.hint}>Select a report in the list or on the map.</p>
            )}
          </aside>
        </div>
      ) : (
        // Temporary placeholder: step 23 adds the phone layout.
        <main className={styles.main}>
          <p className={styles.hint}>Report dashboard</p>
        </main>
      )}
    </div>
  );
}
