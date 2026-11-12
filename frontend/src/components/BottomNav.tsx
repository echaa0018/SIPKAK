import { Link } from 'react-router';
import styles from './BottomNav.module.css';
import { BellIcon, ClockIcon, MapIcon, PlusCircleIcon } from './icons';
import type { ReporterView } from './ReporterShell';

const items = [
  // "Map" stays highlighted on the list too: the Map/List switch is part of the same screen.
  { to: '/', label: 'Map', Icon: MapIcon, views: ['map', 'list'] },
  { to: '/report/new', label: 'Report', Icon: PlusCircleIcon, views: ['new'] },
  { to: '/mine', label: 'My reports', Icon: ClockIcon, views: ['mine'] },
  { to: '/notifications', label: 'Notifications', Icon: BellIcon, views: ['notifications'] },
] as const;

/** The phone's bottom navigation. */
export function BottomNav({ view }: { view: ReporterView }) {
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
          >
            <Icon size={26} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
