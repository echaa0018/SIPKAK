import { useCallback, useEffect, useState } from 'react';
import { listReports, type Report } from '../api/reports';

/** All reports, newest first. Call `reload()` after a change to fetch them again. */
export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState(false);
  // Bumping this number re-runs the effect below.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after a newer request started
    listReports().then(
      (list) => {
        if (!current) return;
        setReports(list);
        setError(false);
      },
      () => {
        if (current) setError(true);
      },
    );
    return () => {
      current = false;
    };
  }, [version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { reports, error, reload };
}
