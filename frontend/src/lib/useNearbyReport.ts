import { useEffect, useState } from 'react';
import { listNearbyReports, type NearbyReport } from '../api/reports';
import type { LatLng } from './geo';

const WAIT_MS = 400;

/**
 * The nearest open report within 30 m of the pin, or null. Waits until the pin has stood still
 * for 400 ms, so dragging doesn't send a request for every step.
 */
export function useNearbyReport(pin: LatLng | null): NearbyReport | null {
  const [nearby, setNearby] = useState<{ pin: LatLng; report: NearbyReport | null } | null>(null);

  useEffect(() => {
    if (!pin) return;
    let current = true;
    const timer = setTimeout(() => {
      listNearbyReports(pin.lat, pin.lng).then(
        (reports) => current && setNearby({ pin, report: reports[0] ?? null }),
        () => current && setNearby({ pin, report: null }), // no warning if the check fails
      );
    }, WAIT_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [pin]);

  // Only show a warning that belongs to where the pin is now.
  return pin && nearby?.pin === pin ? nearby.report : null;
}
