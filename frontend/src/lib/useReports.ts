import { useCallback, useEffect, useState } from 'react';
import { listReports, type Report } from '../api/reports';

// After a failed load, try again this much later (e.g. the API was still starting up).
export const RETRY_MS = 3_000;

/** All reports, newest first. Call `reload()` after a change to fetch them again. */
export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Bumping this number re-runs the effect below.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after a newer request started
    let retry: ReturnType<typeof setTimeout> | undefined;
    listReports().then(
      (list) => {
        if (!current) return;
        setReports(list);
        setError(false);
        setLoading(false);
      },
      () => {
        if (!current) return;
        setError(true);
        setLoading(false);
        retry = setTimeout(() => setVersion((v) => v + 1), RETRY_MS);
      },
    );
    return () => {
      current = false;
      clearTimeout(retry);
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { reports, loading, error, reload };
}
