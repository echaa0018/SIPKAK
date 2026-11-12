import { useEffect, useRef, type ReactNode } from 'react';
import type { Report } from '../api/reports';
import { formatWib } from '../lib/formatWib';
import { formatPlace, reportNumber } from '../lib/reportText';
import styles from './ReportList.module.css';
import { ReportPhoto } from './ReportPhoto';
import { StatusLabel } from './StatusLabel';

interface ReportListProps {
  reports: Report[];
  loading: boolean;
  /** The grey line above the list, e.g. "8 reports · newest first". Left out if not given. */
  summary?: string;
  onSelect: (id: number) => void;
  selectedId?: number;
  /** Phone rows have a photo; desktop rows are text only. */
  variant: 'phone' | 'desktop';
  /**
   * "all": phone rows tag your own reports "Sent by you".
   * "mine": phone rows say "Sent <date>" with the full status on its own line.
   * "admin": no photos; desktop rows show the report number top right.
   */
  kind?: 'all' | 'mine' | 'admin';
  /** Shown when there are no reports. */
  empty?: ReactNode;
}

/** A list of reports, newest first. Each row is a button that selects the report. */
export function ReportList({
  reports,
  loading,
  summary,
  onSelect,
  selectedId,
  variant,
  kind = 'all',
  empty = 'No reports yet.',
}: ReportListProps) {
  const isPhone = variant === 'phone';
  // The phone's My reports rows follow their own wireframe (status under the date).
  const historyRows = isPhone && kind === 'mine';
  const listRef = useRef<HTMLUListElement>(null);

  // When a pin is clicked on the map, scroll its row into view.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedId]);

  const showPhoto = isPhone && kind !== 'admin';
  const showNumber = !isPhone && kind === 'admin';

  return (
    <section className={styles.section}>
      {(summary || loading) && (
        <p className={styles.summary}>{loading ? 'Loading reports…' : summary}</p>
      )}
      {!loading && reports.length === 0 && <div className={styles.empty}>{empty}</div>}
      <ul className={styles.list} ref={listRef}>
        {reports.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              className={styles.row}
              aria-current={report.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(report.id)}
            >
              {showPhoto && <ReportPhoto report={report} size="thumb" />}
              <span className={styles.text}>
                <span className={styles.titleLine}>
                  <span className={styles.title}>{report.description}</span>
                  {showNumber && <span className={styles.muted}>{reportNumber(report.id)}</span>}
                </span>
                <span className={styles.muted}>{formatPlace(report)}</span>
                {historyRows ? (
                  <>
                    <span className={styles.muted}>Sent {formatWib(report.createdAt)}</span>
                    <span className={styles.statusLine}>
                      <StatusLabel status={report.status} long />
                    </span>
                  </>
                ) : (
                  <span className={styles.dateLine}>
                    <span className={styles.muted}>{formatWib(report.createdAt)}</span>
                    <StatusLabel status={report.status} />
                  </span>
                )}
                {isPhone && kind === 'all' && report.isMine && (
                  <span className={styles.mine}>Sent by you</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
