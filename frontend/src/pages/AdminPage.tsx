import { useNavigate } from 'react-router';
import { SignOutIcon } from '../components/icons';
import { clearAdminToken } from '../lib/adminSession';
import { useIsDesktop } from '../lib/useIsDesktop';
import styles from './AdminPage.module.css';

/** /admin: the facilities team's dashboard. */
export function AdminPage() {
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();

  function signOut() {
    clearAdminToken();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <p className={styles.brand}>
          <strong>SIPKAK</strong>{' '}
          <span>{isDesktop ? 'Facilities admin · ITB Ganesha' : 'Facilities admin'}</span>
        </p>
        {isDesktop ? (
          <button type="button" className={styles.textButton} onClick={signOut}>
            Sign out
          </button>
        ) : (
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Sign out"
            onClick={signOut}
          >
            <SignOutIcon />
          </button>
        )}
      </header>

      {/* Temporary placeholder: the next step adds the report list, map and details. */}
      <main className={styles.main}>
        <p className={styles.placeholder}>Report dashboard</p>
      </main>
    </div>
  );
}
