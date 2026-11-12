import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { adminLogin } from '../api/admin';
import { ApiError } from '../api/client';
import { getAdminToken, setAdminToken } from '../lib/adminSession';
import styles from './AdminLoginPage.module.css';

/** /admin/login: the facilities team signs in with the shared admin password. */
export function AdminLoginPage() {
  const id = useId();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Back to the admin page you asked for before being sent here.
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (getAdminToken()) return <Navigate to={from} replace />;

  async function signIn(event: FormEvent) {
    event.preventDefault();
    if (!password) {
      setError('Enter the admin password.');
      return;
    }
    setSigningIn(true);
    setError(null);
    try {
      setAdminToken(await adminLogin(password));
      navigate(from, { replace: true });
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? 'Wrong password. Try again.'
          : 'Couldn’t sign in. Check your connection and try again.',
      );
      setSigningIn(false);
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.card} onSubmit={signIn} noValidate aria-labelledby={`${id}-title`}>
        <p className={styles.brand}>
          <strong>SIPKAK</strong> <span>Facilities admin</span>
        </p>
        <h1 className={styles.title} id={`${id}-title`}>
          Sign in
        </h1>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${id}-password`}>
            Password
          </label>
          <input
            id={`${id}-password`}
            className={styles.input}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && (
            <p className={styles.error} id={`${id}-error`} role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" className={styles.primary} disabled={signingIn}>
          {signingIn ? 'Signing in…' : 'Sign in'}
        </button>
        <Link to="/" className={styles.back}>
          Back to the campus map
        </Link>
      </form>
    </main>
  );
}
