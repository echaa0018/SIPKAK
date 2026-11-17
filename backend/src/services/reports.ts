import { AppError } from '../lib/errors.js';
import { distanceM, type Point } from '../lib/geo.js';
import type { CreateReportInput, UpdateReportInput } from '../lib/validation.js';
import type { ReportStatus, Store, StoredReport } from '../store/store.js';

// Measured on the data URL string the client sends.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

// Used when the client sends no accuracy, e.g. a pin placed by hand on the map.
const SIMULATED_ACCURACY_M = 12;

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
      return reports.filter((report) => mine || report.reviewStatus === 'approved')
        .map((report) => toApiReport(report, viewerId));
    },

    async get(id: number, viewerId?: string): Promise<Report> {
      const report = await store.getReport(id);
      if (!report || (report.reviewStatus !== 'approved' && report.reporterId !== viewerId)) {
        throw new AppError('NOT_FOUND', `Report ${id} not found`);
      }
      return toApiReport(report, viewerId);
    },

    /** New reports always start as "waiting". */
    async create(input: CreateReportInput, reporterId: string): Promise<Report> {
      // SIMULATED: the photo travels inside the JSON body. The real app would upload it to
      // Supabase Storage and keep only its URL.
      if (input.photo && input.photo.length > MAX_PHOTO_BYTES) {
        throw new AppError('PAYLOAD_TOO_LARGE', 'The photo is larger than 10 MB', {
          photo: 'Larger than 10 MB',
        });
      }

      const now = new Date().toISOString();
      const report = await store.createReport({
        ...input,
        accuracyM: input.accuracyM ?? SIMULATED_ACCURACY_M,
        status: 'waiting',
        reviewStatus: 'pending',
        note: null,
        confirmations: 0,
        reporterId,
        createdAt: now,
        updatedAt: now,
        history: [{ status: 'waiting', at: now }],
      });
      return toApiReport(report, reporterId);
    },

    /** Open (not done) reports within `radius` metres of a point, nearest first. */
    async nearby(
      point: Point & { radius: number },
      viewerId?: string,
    ): Promise<(Report & { distanceM: number })[]> {
      const reports = await store.listReports();
      return reports
        .filter((report) => report.reviewStatus === 'approved' && report.status !== 'done')
        .map((report) => ({ report, distance: distanceM(point, report) }))
        .filter(({ distance }) => distance <= point.radius)
        .sort((a, b) => a.distance - b.distance)
        .map(({ report, distance }) => ({
          ...toApiReport(report, viewerId),
          distanceM: Math.round(distance),
        }));
    },

    /** "Same problem (+1)". You can't confirm your own report, or confirm twice. */
    async confirm(id: number, reporterId: string): Promise<{ confirmations: number }> {
      const report = await store.getReport(id);
      if (!report) throw new AppError('NOT_FOUND', `Report ${id} not found`);
      if (report.reviewStatus !== 'approved') throw new AppError('NOT_FOUND', `Report ${id} not found`);
      if (report.reporterId === reporterId) {
        throw new AppError('CONFLICT', 'You sent this report, so you cannot confirm it');
      }

      const confirmations = await store.addConfirmation(id, reporterId);
      if (confirmations === undefined) {
        throw new AppError('CONFLICT', 'You have already confirmed this report');
      }
      return { confirmations };
    },

    /** Admin's full queue, including unpublished pending and rejected reports. */
    async adminList(): Promise<Report[]> {
      return (await store.listReports()).map((r) => toApiReport(r));
    },

    /** Only pending reports may be approved or rejected. Rejection requires an explanation. */
    async review(id: number, decision: 'approved' | 'rejected', reason?: string): Promise<Report> {
      const existing = await store.getReport(id);
      if (!existing) throw new AppError('NOT_FOUND', `Report ${id} not found`);
      if (existing.reviewStatus !== 'pending') {
        throw new AppError('CONFLICT', 'This report has already been reviewed');
      }
      const at = new Date().toISOString();
      const note = decision === 'rejected' ? reason!.trim() : null;
      const updated = await store.reviewReport(id, decision, note, at);
      if (!updated) throw new AppError('CONFLICT', 'This report has already been reviewed');
      await store.createNotification({
        reporterId: existing.reporterId, reportId: id, kind: 'note', status: null,
        note: decision === 'approved'
          ? 'Your report was approved and is now visible on the campus map.'
          : `Your report was rejected: ${note}`,
        createdAt: at,
      });
      return toApiReport(updated);
    },

    /**
     * Admin update. Setting the status it already has, with no note, is rejected.
     * Every update sends the reporter one notification.
     */
    async update(id: number, { status, note }: UpdateReportInput): Promise<Report> {
      const report = await store.getReport(id);
      if (!report) throw new AppError('NOT_FOUND', `Report ${id} not found`);
      if (report.reviewStatus !== 'approved') {
        throw new AppError('CONFLICT', 'Approve this report before updating repair status');
      }

      const statusChanged = status !== undefined && status !== report.status;
      if (!statusChanged && note === undefined) {
        throw new AppError('VALIDATION_ERROR', 'Nothing to change', {
          status: `The report is already ${report.status}`,
        });
      }

      const at = new Date().toISOString();
      const updated = await store.updateReport(id, {
        status: statusChanged ? status : undefined,
        note,
        at,
      });

      await store.createNotification({
        reporterId: report.reporterId,
        reportId: id,
        kind: statusChanged ? 'status' : 'note',
        status: statusChanged ? status : null,
        note: note ?? null,
        createdAt: at,
      });
      return toApiReport(updated!);
    },
  };
}

export type ReportService = ReturnType<typeof createReportService>;
