import styles from './UnreadBadge.module.css';

/** The link's name for screen readers, e.g. "Notifications, 2 unread". */
export function notificationsLabel(unread: number): string | undefined {
  return unread > 0 ? `Notifications, ${unread} unread` : undefined;
}

/**
 * The small orange count next to "Notifications". Hidden when nothing is unread. It is only
 * visual: put `notificationsLabel(count)` on the link so screen readers hear the count.
 */
export function UnreadBadge({ count, className = '' }: { count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <span className={`${styles.badge} ${className}`} aria-hidden="true">
      {count > 99 ? '99+' : count}
    </span>
  );
}
