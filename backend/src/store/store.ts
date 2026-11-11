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

export interface ReportFilter {
  status?: ReportStatus;
  reporterId?: string;
}

// Every method is async so the memory store and the Supabase store share one interface.
export interface Store {
  /** Reports matching the filter (all of them without one), newest first. */
  listReports(filter?: ReportFilter): Promise<StoredReport[]>;
  getReport(id: number): Promise<StoredReport | undefined>;
}
