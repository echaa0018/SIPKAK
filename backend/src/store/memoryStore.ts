import { seedNotifications, seedReports } from '../data/seed.js';
import type { Store } from './store.js';

const newestFirst = (a: { id: number; createdAt: string }, b: { id: number; createdAt: string }) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id;

const nextIdAfter = (items: { id: number }[]) => Math.max(0, ...items.map((item) => item.id)) + 1;

// SIMULATED: data lives in this process and resets on every restart.
// The real app keeps it in a database (the Supabase store in phase 4).
export function createMemoryStore(): Store {
  // Work on copies, and hand out copies, so nobody can change the seed or the store by accident.
  const reports = structuredClone(seedReports);
  const notifications = structuredClone(seedNotifications);
  let nextReportId = nextIdAfter(reports);
  let nextNotificationId = nextIdAfter(notifications);
  // Who confirmed what, as "reportId:reporterId". The seed only has counts, not names.
  const confirmed = new Set<string>();

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

    async createReport(input) {
      const report = { ...structuredClone(input), id: nextReportId++ };
      reports.push(report);
      return structuredClone(report);
    },

    async addConfirmation(reportId, reporterId) {
      const report = reports.find((r) => r.id === reportId);
      const key = `${reportId}:${reporterId}`;
      if (!report || confirmed.has(key)) return undefined;
      confirmed.add(key);
      return ++report.confirmations;
    },

    async updateReport(id, { status, note, at }) {
      const report = reports.find((r) => r.id === id);
      if (!report) return undefined;
      if (status !== undefined) {
        report.status = status;
        report.history.push({ status, at });
      }
      if (note !== undefined) report.note = note;
      report.updatedAt = at;
      return structuredClone(report);
    },

    async listNotifications(reporterId) {
      const mine = notifications.filter((n) => n.reporterId === reporterId);
      return structuredClone(mine.sort(newestFirst));
    },

    async createNotification(input) {
      const notification = { ...input, id: nextNotificationId++, read: false };
      notifications.push(notification);
      return structuredClone(notification);
    },

    async markNotificationsRead(reporterId, ids) {
      for (const n of notifications) {
        if (n.reporterId === reporterId && (ids === undefined || ids.includes(n.id))) {
          n.read = true;
        }
      }
    },
  };
}
