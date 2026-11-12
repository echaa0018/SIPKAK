import type { Notification } from '../api/notifications';
import { formatWib } from '../lib/formatWib';
import { notificationTitle, reportNumber } from '../lib/reportText';
import styles from './NotificationList.module.css';

interface NotificationListProps {
  notifications: Notification[];
  /** Marks it read and opens its report. */
  onOpen: (notification: Notification) => void;
  /** Desktop shows a grey "Updates on reports you sent" line above the list. */
  variant: 'phone' | 'desktop';
}

/** Updates from the facilities team on reports you sent. Unread ones have a dot and a tint. */
export function NotificationList({ notifications, onOpen, variant }: NotificationListProps) {
  return (
    <section className={styles.section}>
      {variant === 'desktop' && <p className={styles.summary}>Updates on reports you sent</p>}
      {notifications.length === 0 && (
        <p className={styles.empty}>
          No updates yet. When the facilities team updates a report you sent, it shows up here.
        </p>
      )}
      <ul className={styles.list}>
        {notifications.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              className={n.read ? styles.row : `${styles.row} ${styles.unread}`}
              onClick={() => onOpen(n)}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span className={styles.text}>
                <span className={styles.title}>
                  {notificationTitle(n)}
                  {!n.read && <span className={styles.visuallyHidden}> (unread)</span>}
                </span>
                <span className={styles.muted}>
                  {reportNumber(n.reportId)} · {n.reportDescription}
                </span>
                {n.note && (
                  <span className={styles.note}>
                    <strong>Note:</strong> {n.note}
                  </span>
                )}
                <span className={styles.muted}>{formatWib(n.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
