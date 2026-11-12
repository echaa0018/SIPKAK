import { Link } from 'react-router';
import styles from './BottomNav.module.css';
import { BellIcon, ClockIcon, MapIcon, PlusCircleIcon } from './icons';
import type { ReporterView } from './ReporterShell';
import { notificationsLabel, UnreadBadge } from './UnreadBadge';

const items = [
  // "Map" stays highlighted on the list too: the Map/List switch is part of the same screen.
  { to: '/', label: 'Map', Icon: MapIcon, views: ['map', 'list'] },
  { to: '/report/new', label: 'Report', Icon: PlusCircleIcon, views: ['new'] },
  { to: '/mine', label: 'My reports', Icon: ClockIcon, views: ['mine'] },
  { to: '/notifications', label: 'Notifications', Icon: BellIcon, views: ['notifications'] },
] as const;

/** The phone's bottom navigation. Notifications carries the unread count. */
export function BottomNav({ view, unread }: { view: ReporterView; unread: number }) {
  return (
    <nav className={styles.nav} aria-label="Main">
      {items.map(({ to, label, Icon, views }) => {
        const active = (views as readonly ReporterView[]).includes(view);
        return (
          <Link
            key={to}
            to={to}
            className={active ? `${styles.item} ${styles.active}` : styles.item}
            aria-current={active ? 'page' : undefined}
            aria-label={to === '/notifications' ? notificationsLabel(unread) : undefined}
          >
            <Icon size={26} />
            <span>{label}</span>
            {to === '/notifications' && <UnreadBadge count={unread} className={styles.badge} />}
          </Link>
        );
      })}
    </nav>
  );
}
