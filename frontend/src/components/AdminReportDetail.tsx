import { useId, useState, type FormEvent } from 'react';
import { updateReport } from '../api/admin';
import { ApiError } from '../api/client';
import type { Report, ReportStatus } from '../api/reports';
import { formatWib } from '../lib/formatWib';
import { formatCoords } from '../lib/geo';
import { formatPlace, reportNumber } from '../lib/reportText';
import { statuses, statusLabels } from '../lib/status';
import styles from './AdminReportDetail.module.css';
import { Dialog } from './Dialog';
import { CloseIcon } from './icons';
import { ReportPhoto } from './ReportPhoto';

interface AdminReportDetailProps {
  report: Report;
  token: string;
  /** Desktop shows its own header with a close button; the phone page has a back button. */
  onClose?: () => void;
  /** After a save: reload the reports so the list and map show the new status. */
  onSaved: () => void;
  /** The token was refused (e.g. the backend's ADMIN_TOKEN changed): sign in again. */
  onUnauthorized: () => void;
  /** The phone page leaves out the pin coordinates, as in its wireframe. */
  showPin?: boolean;
}

/** One report for the facilities team: its details, then the status, a note and "Save". */
export function AdminReportDetail(props: AdminReportDetailProps) {
  const { report, token, onClose, onSaved, onUnauthorized, showPin = true } = props;
  const id = useId();
  const [status, setStatus] = useState<ReportStatus>(report.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'saved' | 'error'; text: string } | null>(null);
  const [photoOpen, setPhotoOpen] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    const trimmed = note.trim();
    const statusChanged = status !== report.status;
    if (!statusChanged && !trimmed) {
      setMessage({ kind: 'error', text: 'Change the status or write a note first.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      await updateReport(token, report.id, {
        ...(statusChanged && { status }),
        ...(trimmed && { note: trimmed }),
      });
      setNote('');
      setMessage({ kind: 'saved', text: 'Saved. The reporter will see this in Notifications.' });
      onSaved();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized();
        return;
      }
      setMessage({ kind: 'error', text: 'Couldn’t save. Try again.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={styles.detail} aria-label={`Report ${reportNumber(report.id)}`}>
      {onClose && (
        <header className={styles.header}>
          <p className={styles.muted}>Report {reportNumber(report.id)}</p>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
      )}

      {report.photo ? (
        <button
          type="button"
          className={styles.photoButton}
          aria-label="Enlarge the reporter's photo"
          onClick={() => setPhotoOpen(true)}
        >
          <ReportPhoto report={report} size="large" />
        </button>
      ) : (
        <ReportPhoto report={report} size="large" />
      )}

      <div>
        <h2 className={styles.title}>{report.description}</h2>
        <p className={styles.muted}>{formatPlace(report)}</p>
      </div>

      <dl className={styles.facts}>
        <dt>Reported</dt>
        <dd>{formatWib(report.createdAt)}</dd>
        <dt>Confirmed</dt>
        <dd>
          {report.confirmations === 0
            ? 'No one else'
            : `${report.confirmations} ${report.confirmations === 1 ? 'other' : 'others'}`}
        </dd>
        {showPin && (
          <>
            <dt>Pin</dt>
            <dd>
              {formatCoords(report)} · ±{report.accuracyM} m
            </dd>
          </>
        )}
      </dl>

      <form className={styles.form} onSubmit={save} noValidate>
        <fieldset className={styles.statusField}>
          <legend className={styles.label}>Status</legend>
          <div className={styles.segmented}>
            {statuses.map((s) => (
              <label key={s} className={styles.segment}>
                <input
                  type="radio"
                  name={`${id}-status`}
                  value={s}
                  checked={status === s}
                  onChange={() => {
                    setStatus(s);
                    setMessage(null);
                  }}
                />
                <span>{statusLabels[s].short}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {report.note && (
          <p className={styles.lastNote}>
            <strong>Last note:</strong> {report.note}
          </p>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-note`}>
            Note to reporter (optional)
          </label>
          <textarea
            id={`${id}-note`}
            className={styles.textarea}
            placeholder="e.g. Technician scheduled for Thursday"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
              setMessage(null);
            }}
          />
        </div>

        <button type="submit" className={styles.primary} disabled={saving}>
          {saving ? 'Saving…' : 'Save and notify reporter'}
        </button>
        {message && (
          <p
            className={message.kind === 'saved' ? styles.saved : styles.error}
            role={message.kind === 'saved' ? 'status' : 'alert'}
          >
            {message.text}
          </p>
        )}
      </form>

      {photoOpen && report.photo && (
        <Dialog
          labelledBy={`${id}-photo-title`}
          onClose={() => setPhotoOpen(false)}
          variant="centered"
        >
          <h2 className={styles.photoTitle} id={`${id}-photo-title`}>
            {report.description}
          </h2>
          <img
            className={styles.bigPhoto}
            src={report.photo}
            alt={`Photo: ${report.description}`}
          />
          <button type="button" className={styles.secondary} onClick={() => setPhotoOpen(false)}>
            Close
          </button>
        </Dialog>
      )}
    </article>
  );
}
