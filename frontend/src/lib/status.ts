import type { ReportStatus } from '../api/reports';

export const statusLabels: Record<ReportStatus, { long: string; short: string }> = {
  waiting: { long: 'Waiting for review', short: 'Waiting' },
  in_progress: { long: 'In progress', short: 'In progress' },
  done: { long: 'Done', short: 'Done' },
};

export const statuses: ReportStatus[] = ['waiting', 'in_progress', 'done'];
