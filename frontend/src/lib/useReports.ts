import { useCallback, useEffect, useState } from 'react';
import { listAdminReports } from '../api/admin';
import { ApiError } from '../api/client';
import { listReports, type Report } from '../api/reports';
import { REPORTS_SYNC_KEY } from './reportSync';

// After a failed load, try again this much later (e.g. the API was still starting up).
export const RETRY_MS = 3_000;
export const SYNC_MS = 10_000;

/**
 * All reports, newest first. Call `reload()` after a change to fetch them again; they also
 * reload whenever the window gets focus.
 */
export function useReports(adminToken?: string) {
  const [reports, setReports] = useState<Report[]>([]);
  const [mineReports, setMineReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  // Bumping this number re-runs the effect below.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after a newer request started
    let retry: ReturnType<typeof setTimeout> | undefined;
    const fetchReports = adminToken !== undefined
      ? listAdminReports(adminToken).then((publicAndAdmin) => ({ list: publicAndAdmin, mine: [] as Report[] }))
      : Promise.all([listReports(), listReports({ mine: true })]).then(([list, mine]) => ({ list, mine }));
    fetchReports.then(
      ({ list, mine }) => {
        if (!current) return;
        setReports(list);
        setMineReports(mine);
        setError(false);
        setErrorMessage(null);
        setUnauthorized(false);
        setLoading(false);
      },
      (cause: unknown) => {
        if (!current) return;
        const sessionExpired = adminToken !== undefined && cause instanceof ApiError && cause.status === 401;
        setUnauthorized(sessionExpired);
        setError(!sessionExpired);
        if (!sessionExpired) {
          if (cause instanceof ApiError) {
            setErrorMessage(cause.status === 0 ? cause.message
              : `${cause.message} (HTTP ${cause.status}). ${cause.status >= 500 ? 'Check the API terminal and Supabase schema if configured.' : ''}`.trim());
          } else {
            setErrorMessage('Unexpected error loading reports. Check the API terminal.');
          }
        }
        setLoading(false);
        if (!sessionExpired) retry = setTimeout(() => setVersion((v) => v + 1), RETRY_MS);
      },
    );
    return () => {
      current = false;
      clearTimeout(retry);
    };
  }, [version, adminToken]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Both dashboards read the SAME backend store. Polling makes a moderation decision
  // visible in other browser tabs (guest and admin), without requiring a page reload.
  useEffect(() => {
    const refreshVisible = () => {
      if (document.visibilityState !== 'hidden') reload();
    };
    const interval = setInterval(refreshVisible, SYNC_MS);
    const onStorage = (event: StorageEvent) => {
      if (event.key === REPORTS_SYNC_KEY) refreshVisible();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refreshVisible);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refreshVisible);
      document.removeEventListener('visibilitychange', refreshVisible);
    };
  }, [reload]);

  return { reports, mineReports, loading, error, errorMessage, unauthorized, reload };
}
