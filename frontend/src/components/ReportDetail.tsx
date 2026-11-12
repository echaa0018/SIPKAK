import type { Report, ReportStatus } from '../api/reports';
import { categoryLabels } from '../lib/categories';
import { formatWib } from '../lib/formatWib';
import { confirmationsText, formatPlace, reportNumber } from '../lib/reportText';
import { ConfirmButton } from './ConfirmButton';
import { FacilitiesNote } from './FacilitiesNote';
import { CloseIcon } from './icons';
import styles from './ReportDetail.module.css';
import { ReportPhoto } from './ReportPhoto';

const stepOrder: Record<ReportStatus, number> = { waiting: 0, in_progress: 1, done: 2 };

/** Reported / In progress / Done, each with its date, or "Not yet". */
function timeline(report: Report) {
  // The latest time the report entered a status (an admin may have moved it back and forth).
  const lastTime = (status: ReportStatus) =>
    report.history.filter((h) => h.status === status).at(-1)?.at;

  return (['waiting', 'in_progress', 'done'] as const).map((status) => {
    const reached = stepOrder[report.status] >= stepOrder[status];
    const at = status === 'waiting' ? report.createdAt : lastTime(status);
    return {
      label: status === 'waiting' ? 'Reported' : status === 'in_progress' ? 'In progress' : 'Done',
      reached,
      // Reached without its own entry means the admin skipped that step.
      when: !reached ? 'Not yet' : at ? formatWib(at) : 'Skipped',
    };
  });
}

interface ReportDetailProps {
  report: Report;
  onClose: () => void;
  onConfirmed: () => void;
}

/** The selected report in the desktop right pane. */
export function ReportDetail({ report, onClose, onConfirmed }: ReportDetailProps) {
  return (
    <article className={styles.detail} aria-label={`Report ${reportNumber(report.id)}`}>
      <header className={styles.header}>
        <p className={styles.number}>Report {reportNumber(report.id)}</p>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      <ReportPhoto report={report} size="large" />

      <div>
        <h2 className={styles.title}>{report.description}</h2>
        <p className={styles.place}>{categoryLabels[report.category]}</p>
        <p className={styles.place}>{formatPlace(report)}</p>
      </div>

      <ol className={styles.timeline} aria-label="Progress">
        {timeline(report).map((step) => (
          <li key={step.label} className={step.reached ? styles.reached : undefined}>
            <span className={styles.stepLabel}>{step.label}</span>
            <span className={styles.stepWhen}>{step.when}</span>
          </li>
        ))}
      </ol>

      <FacilitiesNote note={report.note} />

      <footer className={styles.footer}>
        <p className={styles.muted}>{confirmationsText(report.confirmations)}</p>
        <ConfirmButton
          key={report.id}
          report={report}
          onConfirmed={onConfirmed}
          label="Same problem here (+1)"
        />
      </footer>
    </article>
  );
}
