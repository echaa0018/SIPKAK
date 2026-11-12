import type { ReportStatus } from '../api/reports';
import { statusLabels } from '../lib/status';
import styles from './StatusLabel.module.css';
import { StatusDot } from './StatusDot';

/** "● Waiting", "◉ In progress" or "○ Done", in bold. */
export function StatusLabel({ status, long = false }: { status: ReportStatus; long?: boolean }) {
  return (
    <span className={styles.label}>
      <StatusDot status={status} />
      {long ? statusLabels[status].long : statusLabels[status].short}
    </span>
  );
}
