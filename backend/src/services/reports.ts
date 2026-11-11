import { AppError } from '../lib/errors.js';
import type { ReportStatus, Store, StoredReport } from '../store/store.js';

// The report shape the API sends: the stored report without reporterId, plus isMine.
export type Report = Omit<StoredReport, 'reporterId'> & { isMine: boolean };

export function toApiReport({ reporterId, ...report }: StoredReport, viewerId?: string): Report {
  return { ...report, isMine: viewerId !== undefined && reporterId === viewerId };
}

export function createReportService(store: Store) {
  return {
    /** `mine` keeps only the viewer's own reports, so it needs a viewer. */
    async list(
      { status, mine }: { status?: ReportStatus; mine?: boolean },
      viewerId?: string,
    ): Promise<Report[]> {
      if (mine && !viewerId) {
        throw new AppError('VALIDATION_ERROR', 'mine=true needs the X-Reporter-Id header', {
          'X-Reporter-Id': 'Required',
        });
      }
      const reports = await store.listReports({ status, reporterId: mine ? viewerId : undefined });
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
