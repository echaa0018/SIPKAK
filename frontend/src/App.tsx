import { useEffect, useState } from 'react';
import { getHealth } from './api/client';
import styles from './App.module.css';

type ApiState = 'checking' | 'connected' | 'offline';

export default function App() {
  const [api, setApi] = useState<ApiState>('checking');

  // Temporary: shows whether the backend is reachable, re-checked every 5 seconds.
  useEffect(() => {
    let active = true;
    const check = () =>
      getHealth().then(
        () => active && setApi('connected'),
        () => active && setApi('offline'),
      );
    check();
    const timer = setInterval(check, 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.brand}>SIPKAK</h1>
        <p className={styles.subtitle}>Campus damage reports · ITB Ganesha</p>
      </header>
      <p className={styles.status}>API: {api}</p>
    </>
  );
}
