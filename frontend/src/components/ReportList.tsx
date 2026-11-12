import { useEffect, useRef } from 'react';
import type { Report } from '../api/reports';
import { formatWib } from '../lib/formatWib';
import { formatPlace } from '../lib/reportText';
import styles from './ReportList.module.css';
import { ReportPhoto } from './ReportPhoto';
import { StatusLabel } from './StatusLabel';

interface ReportListProps {
  reports: Report[];
  loading: boolean;
  /** The grey line above the list, e.g. "8 reports · newest first". */
  summary: string;
  onSelect: (id: number) => void;
  selectedId?: number;
  /** Phone rows have a photo and a "Sent by you" tag; desktop rows are text only. */
  variant: 'phone' | 'desktop';
}

/** A list of reports, newest first. Each row is a button that selects the report. */
export function ReportList({
  reports,
  loading,
  summary,
  onSelect,
  selectedId,
  variant,
}: ReportListProps) {
  const isPhone = variant === 'phone';
  const listRef = useRef<HTMLUListElement>(null);

  // When a pin is clicked on the map, scroll its row into view.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [selectedId]);

  return (
    <section className={styles.section}>
      <p className={styles.summary}>{loading ? 'Loading reports…' : summary}</p>
      {!loading && reports.length === 0 && <p className={styles.empty}>No reports yet.</p>}
      <ul className={styles.list} ref={listRef}>
        {reports.map((report) => (
          <li key={report.id}>
            <button
              type="button"
              className={styles.row}
              aria-current={report.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(report.id)}
            >
              {isPhone && <ReportPhoto report={report} size="thumb" />}
              <span className={styles.text}>
                <span className={styles.title}>{report.description}</span>
                <span className={styles.muted}>{formatPlace(report)}</span>
                <span className={styles.dateLine}>
                  <span className={styles.muted}>{formatWib(report.createdAt)}</span>
                  <StatusLabel status={report.status} />
                </span>
                {isPhone && report.isMine && <span className={styles.mine}>Sent by you</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
