import type { ReportStatus } from '../api/reports';
import styles from './StatusDot.module.css';

/** The small status symbol used in the legend and lists. Decorative: the label next to it says it. */
export function StatusDot({ status }: { status: ReportStatus }) {
  return <span className={`${styles.dot} ${styles[status]}`} aria-hidden="true" />;
}
