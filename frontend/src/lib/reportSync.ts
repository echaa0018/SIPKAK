// Guest and admin use the same API. Let other tabs on this origin refresh immediately
// after a report is created, reviewed or updated; polling is the cross-device fallback.
export const REPORTS_SYNC_KEY = 'sipkak.reports.changed';

export function notifyReportsChanged(): void {
  try {
    localStorage.setItem(REPORTS_SYNC_KEY, `${Date.now()}-${Math.random()}`);
  } catch {
    // Browsers may disable storage; the 10-second polling fallback remains available.
  }
}
