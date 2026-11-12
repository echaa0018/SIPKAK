export type ReportStatus = 'waiting' | 'in_progress' | 'done';

export interface StatusChange {
  status: ReportStatus;
  at: string;
}

// A report as the store keeps it. The API never sends reporterId to clients.
export interface StoredReport {
  id: number;
  description: string;
  building: string;
  floor: string | null;
  lat: number;
  lng: number;
  accuracyM: number;
  photo: string | null;
  status: ReportStatus;
  note: string | null;
  confirmations: number;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
  history: StatusChange[];
}

// A message for a reporter after facilities updated their report.
export interface StoredNotification {
  id: number;
  reporterId: string;
  reportId: number;
  /** "status" when the status changed (the note may come too), "note" for a note only. */
  kind: 'status' | 'note';
  status: ReportStatus | null;
  note: string | null;
  read: boolean;
  createdAt: string;
}

export interface ReportFilter {
  status?: ReportStatus;
  reporterId?: string;
}

// Every method is async so the memory store and the Supabase store share one interface.
export interface Store {
  /** Which store this is; /api/health reports it. */
  readonly kind: 'memory' | 'supabase';
  /** Reports matching the filter (all of them without one), newest first. */
  listReports(filter?: ReportFilter): Promise<StoredReport[]>;
  getReport(id: number): Promise<StoredReport | undefined>;
  /** Saves a new report and gives it the next id. */
  createReport(report: Omit<StoredReport, 'id'>): Promise<StoredReport>;
  /**
   * Records a "+1" from this reporter and returns the report's new count,
   * or undefined if this reporter has already confirmed it.
   */
  addConfirmation(reportId: number, reporterId: string): Promise<number | undefined>;
  /**
   * Applies an admin update at time `at`: a `status` also appends to history,
   * a `note` replaces the note. Returns undefined if there is no such report.
   */
  updateReport(
    id: number,
    update: { status?: ReportStatus; note?: string; at: string },
  ): Promise<StoredReport | undefined>;

  /** This reporter's notifications, newest first. */
  listNotifications(reporterId: string): Promise<StoredNotification[]>;
  /** Saves a new, unread notification and gives it the next id. */
  createNotification(
    notification: Omit<StoredNotification, 'id' | 'read'>,
  ): Promise<StoredNotification>;
  /** Marks this reporter's notifications with these ids as read (all of them without ids). */
  markNotificationsRead(reporterId: string, ids?: number[]): Promise<void>;
}
