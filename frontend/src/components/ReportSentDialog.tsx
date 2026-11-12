import { useId } from 'react';
import type { Report } from '../api/reports';
import { formatWib } from '../lib/formatWib';
import { reportNumber } from '../lib/reportText';
import { Dialog } from './Dialog';
import styles from './ReportSentDialog.module.css';

interface ReportSentDialogProps {
  report: Report;
  variant: 'phone' | 'desktop';
  /** "Back to map" on the phone, "Close" on desktop (and Escape). */
  onClose: () => void;
  onSeeMine: () => void;
}

/** "Report sent", with the report's number and time, shown right after sending. */
export function ReportSentDialog({ report, variant, onClose, onSeeMine }: ReportSentDialogProps) {
  const id = useId();
  const isPhone = variant === 'phone';

  const seeMine = (
    <button type="button" className={styles.primary} onClick={onSeeMine}>
      See it in My reports
    </button>
  );
  const close = (
    <button type="button" className={styles.secondary} onClick={onClose}>
      {isPhone ? 'Back to map' : 'Close'}
    </button>
  );

  return (
    <Dialog
      labelledBy={`${id}-title`}
      describedBy={`${id}-text`}
      onClose={onClose}
      variant={isPhone ? 'sheet' : 'centered'}
    >
      <div className={styles.check} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className={styles.title} id={`${id}-title`}>
        Report sent
      </h2>
      <p className={styles.meta}>
        {reportNumber(report.id)} · {formatWib(report.createdAt)}
      </p>
      <p className={styles.text} id={`${id}-text`}>
        It&apos;s on the campus map now. You&apos;ll get a notification
        {isPhone ? '' : ' here'} when the facilities team updates it.
      </p>
      {/* The phone stacks the buttons with the main one on top; desktop puts it on the right. */}
      <div className={isPhone ? styles.stacked : styles.inline}>
        {isPhone ? (
          <>
            {seeMine}
            {close}
          </>
        ) : (
          <>
            {close}
            {seeMine}
          </>
        )}
      </div>
    </Dialog>
  );
}
