import { Link } from 'react-router';
import styles from './BottomNav.module.css';
import { ListIcon, MapIcon } from './icons';

/** The admin's phone navigation: Map and Reports. */
export function AdminBottomNav({ active }: { active: 'map' | 'reports' }) {
  const items = [
    { to: '/admin', label: 'Map', Icon: MapIcon, key: 'map' },
    { to: '/admin/reports', label: 'Reports', Icon: ListIcon, key: 'reports' },
  ] as const;

  return (
    <nav className={`${styles.nav} ${styles.two}`} aria-label="Admin">
      {items.map(({ to, label, Icon, key }) => (
        <Link
          key={to}
          to={to}
          className={key === active ? `${styles.item} ${styles.active}` : styles.item}
          aria-current={key === active ? 'page' : undefined}
        >
          <Icon size={26} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
