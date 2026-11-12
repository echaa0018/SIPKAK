import { useState } from 'react';
import { useLocation, useMatch, useNavigate, useSearchParams } from 'react-router';
import { AdminBottomNav } from '../components/AdminBottomNav';
import { AdminReportDetail } from '../components/AdminReportDetail';
import { CategoryFilter, type CategoryFilterValue } from '../components/CategoryFilter';
import { BackIcon, SignOutIcon } from '../components/icons';
import { MapView } from '../components/MapView';
import { ReportList } from '../components/ReportList';
import { ReportSheet } from '../components/ReportSheet';
import { StatusFilter, type StatusFilterValue } from '../components/StatusFilter';
import { clearAdminToken, getAdminToken } from '../lib/adminSession';
import { reportNumber } from '../lib/reportText';
import { useIsDesktop } from '../lib/useIsDesktop';
import { useReports } from '../lib/useReports';
import styles from './AdminPage.module.css';

/** Where the phone's report page was opened from, so Back and the nav highlight match. */
type From = 'map' | 'reports';

/**
 * The facilities team's dashboard.
 * Desktop: list, map and details side by side at /admin (?report=142 selects one).
 * Phone: /admin is the map, /admin/reports the list, /admin/reports/142 one report.
 */
export function AdminPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useIsDesktop();
  const { reports, loading, error, reload } = useReports();
  // RequireAdmin only shows this page when there is a token.
  const token = getAdminToken() ?? '';
  const [filter, setFilter] = useState<StatusFilterValue>('all');
  const [category, setCategory] = useState<CategoryFilterValue>('all');
  const [searchParams, setSearchParams] = useSearchParams();

  const detailMatch = useMatch('/admin/reports/:id');
  const phoneView = detailMatch
    ? 'detail'
    : location.pathname === '/admin/reports'
      ? 'list'
      : 'map';
  const selectedId = Number(detailMatch?.params.id ?? searchParams.get('report'));
  const selected = reports.find((r) => r.id === selectedId);
  const from: From = (location.state as { from?: From } | null)?.from ?? 'map';

  // Both filters apply to the list and the map pins. The status counts follow the category.
  const inCategory = category === 'all' ? reports : reports.filter((r) => r.category === category);
  const shown = filter === 'all' ? inCategory : inCategory.filter((r) => r.status === filter);

  function signOut() {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  const signOutButton = isDesktop ? (
    <button type="button" className={styles.textButton} onClick={signOut}>
      Sign out
    </button>
  ) : (
    <button type="button" className={styles.iconButton} aria-label="Sign out" onClick={signOut}>
      <SignOutIcon />
    </button>
  );

  const errorBar = error && (
    <p className={styles.error} role="alert">
      Couldn’t load the reports. Trying again…
    </p>
  );

  const detail = (report: NonNullable<typeof selected>, onClose?: () => void) => (
    <AdminReportDetail
      key={report.id}
      report={report}
      token={token}
      onClose={onClose}
      onSaved={reload}
      onUnauthorized={signOut}
      showPin={isDesktop}
    />
  );

  if (isDesktop) {
    const select = (id: number) => navigate({ pathname: '/admin', search: `?report=${id}` });
    return (
      <div className={styles.layout}>
        <header className={styles.header}>
          <p className={styles.brand}>
            <strong>SIPKAK</strong> <span>Facilities admin · ITB Ganesha</span>
          </p>
          {signOutButton}
        </header>
        {errorBar}

        <div className={styles.panes}>
          <aside className={styles.left} aria-label="Reports">
            <div className={styles.listHeader}>
              <h1 className={styles.heading}>Reports</h1>
              <span className={styles.muted}>Newest first</span>
            </div>
            <CategoryFilter value={category} onChange={setCategory} />
            <StatusFilter reports={inCategory} value={filter} onChange={setFilter} />
            <ReportList
              reports={shown}
              loading={loading}
              onSelect={select}
              selectedId={selected?.id}
              variant="desktop"
              kind="admin"
              empty="No reports match these filters."
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
              detail(selected, () => navigate('/admin'))
            ) : (
              <p className={styles.hint}>Select a report in the list or on the map.</p>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // Phone
  function back() {
    // Back to wherever you came from; if the page was opened directly, to the map or list.
    if (location.key !== 'default') navigate(-1);
    else navigate(from === 'reports' ? '/admin/reports' : `/admin?report=${selectedId}`);
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        {phoneView === 'detail' ? (
          <div className={styles.titleRow}>
            <button type="button" className={styles.iconButton} aria-label="Back" onClick={back}>
              <BackIcon />
            </button>
            <h1 className={styles.heading}>Report {reportNumber(selectedId)}</h1>
          </div>
        ) : phoneView === 'list' ? (
          <p className={styles.brand}>
            <strong className={styles.heading}>Reports</strong> <span>Facilities admin</span>
          </p>
        ) : (
          <p className={styles.brand}>
            <strong>SIPKAK</strong> <span>Facilities admin</span>
          </p>
        )}
        {signOutButton}
      </header>
      {errorBar}

      <main className={styles.main}>
        {phoneView === 'map' && (
          <>
            <MapView
              reports={reports}
              variant="phone"
              selectedId={selected?.id}
              onSelect={(id) => setSearchParams({ report: String(id) })}
            />
            {selected && (
              <ReportSheet
                report={selected}
                onClose={() => setSearchParams({})}
                updateHref={`/admin/reports/${selected.id}`}
              />
            )}
          </>
        )}

        {phoneView === 'list' && (
          <div className={styles.phoneList}>
            <CategoryFilter value={category} onChange={setCategory} />
            <StatusFilter reports={inCategory} value={filter} onChange={setFilter} />
            <ReportList
              reports={shown}
              loading={loading}
              onSelect={(id) =>
                navigate(`/admin/reports/${id}`, { state: { from: 'reports' satisfies From } })
              }
              variant="phone"
              kind="admin"
              empty="No reports match these filters."
            />
          </div>
        )}

        {phoneView === 'detail' &&
          (selected ? (
            detail(selected)
          ) : (
            <p className={styles.hint}>{loading ? 'Loading report…' : 'Report not found.'}</p>
          ))}
      </main>

      <AdminBottomNav
        active={
          phoneView === 'list' || (phoneView === 'detail' && from === 'reports') ? 'reports' : 'map'
        }
      />
    </div>
  );
}
