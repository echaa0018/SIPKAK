import { useState } from 'react';
import { ApiError } from '../api/client';
import { confirmReport, type Report } from '../api/reports';
import { hasConfirmed, rememberConfirmed } from '../lib/confirmed';
import styles from './ConfirmButton.module.css';

interface ConfirmButtonProps {
  report: Pick<Report, 'id' | 'isMine'>;
  /** Called after a successful +1, so the caller can reload the count. */
  onConfirmed: () => void;
  label?: string;
}

/** "Same problem (+1)". Hidden on your own reports, disabled once you've confirmed. */
export function ConfirmButton({
  report,
  onConfirmed,
  label = 'Same problem (+1)',
}: ConfirmButtonProps) {
  const [confirmed, setConfirmed] = useState(() => hasConfirmed(report.id));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (report.isMine) return null;

  async function confirm() {
    setSending(true);
    setError(null);
    try {
      await confirmReport(report.id);
      rememberConfirmed(report.id);
      setConfirmed(true);
      onConfirmed();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        // The API already has your +1 (e.g. from another tab).
        rememberConfirmed(report.id);
        setConfirmed(true);
      } else {
        setError('Couldn’t send your +1. Try again.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        disabled={confirmed || sending}
        onClick={confirm}
      >
        {confirmed ? 'You confirmed this' : label}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
