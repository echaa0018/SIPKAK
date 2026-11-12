import { Link } from 'react-router';
import type { Report } from '../api/reports';
import { formatWib } from '../lib/formatWib';
import { categoryLabels } from '../lib/categories';
import { confirmationsText, formatPlace, reportNumber } from '../lib/reportText';
import { ConfirmButton } from './ConfirmButton';
import { FacilitiesNote } from './FacilitiesNote';
import { CloseIcon } from './icons';
import { ReportPhoto } from './ReportPhoto';
import styles from './ReportSheet.module.css';
import { StatusLabel } from './StatusLabel';

interface ReportSheetProps {
  report: Report;
  onClose: () => void;
  /** Reporter: after a +1, reload the count. */
  onConfirmed?: () => void;
  /** Admin: where "Update status" goes. The sheet then shows that button instead of +1. */
  updateHref?: string;
}

/** The selected report on the phone: a sheet over the bottom of the map. */
export function ReportSheet({ report, onClose, onConfirmed, updateHref }: ReportSheetProps) {
  return (
    <article className={styles.sheet} aria-label={`Report ${reportNumber(report.id)}`}>
      <div className={styles.handle} aria-hidden="true" />

      <div className={styles.top}>
        <ReportPhoto report={report} size="thumb" />
        <div className={styles.text}>
          <h2 className={styles.title}>{report.description}</h2>
          <p className={styles.muted}>{categoryLabels[report.category]}</p>
          <p className={styles.muted}>{formatPlace(report)}</p>
          <p className={styles.muted}>{formatWib(report.createdAt)}</p>
        </div>
        <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </div>

      {updateHref ? (
        <div className={styles.status}>
          <StatusLabel status={report.status} long />
          <Link to={updateHref} className={styles.primary}>
            Update status
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.status}>
            <div>
              <StatusLabel status={report.status} long />
              <p className={styles.muted}>{confirmationsText(report.confirmations)}</p>
            </div>
            <ConfirmButton
              key={report.id}
              report={report}
              onConfirmed={onConfirmed ?? (() => {})}
            />
          </div>
          <FacilitiesNote note={report.note} />
        </>
      )}
    </article>
  );
}
