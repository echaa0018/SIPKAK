import { AppError } from '../lib/errors.js';
import type { Store, StoredReport } from '../store/store.js';

// The report shape the API sends: the stored report without reporterId, plus isMine.
export type Report = Omit<StoredReport, 'reporterId'> & { isMine: boolean };

export function toApiReport({ reporterId, ...report }: StoredReport, viewerId?: string): Report {
  return { ...report, isMine: viewerId !== undefined && reporterId === viewerId };
}

export function createReportService(store: Store) {
  return {
    async list(viewerId?: string): Promise<Report[]> {
      const reports = await store.listReports();
      return reports.map((report) => toApiReport(report, viewerId));
    },

    async get(id: number, viewerId?: string): Promise<Report> {
      const report = await store.getReport(id);
      if (!report) throw new AppError('NOT_FOUND', `Report ${id} not found`);
      return toApiReport(report, viewerId);
    },
  };
}

export type ReportService = ReturnType<typeof createReportService>;
