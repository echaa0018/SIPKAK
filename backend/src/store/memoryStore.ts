import { seedReports } from '../data/seed.js';
import type { Store, StoredReport } from './store.js';

const newestFirst = (a: StoredReport, b: StoredReport) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id;

// SIMULATED: data lives in this process and resets on every restart.
// The real app keeps it in a database (the Supabase store in phase 4).
export function createMemoryStore(initial: StoredReport[] = seedReports): Store {
  // Work on a copy, and hand out copies, so nobody can change the seed or the store by accident.
  const reports = structuredClone(initial);

  return {
    async listReports({ status, reporterId } = {}) {
      const matching = reports.filter(
        (r) =>
          (status === undefined || r.status === status) &&
          (reporterId === undefined || r.reporterId === reporterId),
      );
      return structuredClone(matching.sort(newestFirst));
    },

    async getReport(id) {
      const report = reports.find((r) => r.id === id);
      return report && structuredClone(report);
    },
  };
}
