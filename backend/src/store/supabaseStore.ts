import { createClient, type PostgrestError } from '@supabase/supabase-js';
import type {
  ReportCategory,
  ReportFilter,
  ReportStatus,
  StatusChange,
  Store,
  StoredNotification,
  StoredReport,
} from './store.js';

// Rows as Postgres stores them (snake_case). See supabase/schema.sql.
interface ReportRow {
  id: number;
  description: string;
  category: ReportCategory;
  building: string;
  floor: string | null;
  lat: number;
  lng: number;
  accuracy_m: number;
  photo: string | null;
  status: ReportStatus;
  note: string | null;
  confirmations: number;
  reporter_id: string;
  created_at: string;
  updated_at: string;
  report_history: StatusChange[];
}

interface NotificationRow {
  id: number;
  reporter_id: string;
  report_id: number;
  kind: 'status' | 'note';
  status: ReportStatus | null;
  note: string | null;
  read: boolean;
  created_at: string;
}

// A report together with its history, in one request.
const REPORT_COLUMNS = '*, report_history(status, at)';

// Postgres answers "2026-11-11 03:47:00+00"; the API always sends "2026-11-11T03:47:00.000Z".
const iso = (time: string) => new Date(time).toISOString();

function toReport(row: ReportRow): StoredReport {
  return {
    id: row.id,
    description: row.description,
    category: row.category,
    building: row.building,
    floor: row.floor,
    lat: row.lat,
    lng: row.lng,
    accuracyM: row.accuracy_m,
    photo: row.photo,
    status: row.status,
    note: row.note,
    confirmations: row.confirmations,
    reporterId: row.reporter_id,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    history: [...row.report_history]
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
      .map((h) => ({ status: h.status, at: iso(h.at) })),
  };
}

function toNotification(row: NotificationRow): StoredNotification {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportId: row.report_id,
    kind: row.kind,
    status: row.status,
    note: row.note,
    read: row.read,
    createdAt: iso(row.created_at),
  };
}

/** Throws if Supabase reported an error, otherwise returns the data. */
function check<T>({ data, error }: { data: T; error: PostgrestError | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data;
}

/**
 * Keeps the data in Supabase (Postgres), so it survives restarts. It connects with the secret
 * key, which skips Row Level Security: it must only ever be used on the server.
 */
export function createSupabaseStore(url: string, secretKey: string): Store {
  // An easy mistake: copying the "API URL" (…/rest/v1/) instead of the project URL.
  // supabase-js adds /rest/v1 itself, so every request would fail with "Invalid path".
  if (/\/rest\/v1\/?$/.test(url)) {
    throw new Error(
      'SUPABASE_URL must be the project URL, like https://xxxx.supabase.co, without /rest/v1/.',
    );
  }
  const db = createClient(url, secretKey, { auth: { persistSession: false } });

  async function getReport(id: number): Promise<StoredReport | undefined> {
    const row = check(await db.from('reports').select(REPORT_COLUMNS).eq('id', id).maybeSingle());
    return row ? toReport(row as ReportRow) : undefined;
  }

  return {
    kind: 'supabase',

    async listReports({ status, category, reporterId }: ReportFilter = {}) {
      let query = db
        .from('reports')
        .select(REPORT_COLUMNS)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false });
      if (status) query = query.eq('status', status);
      if (category) query = query.eq('category', category);
      if (reporterId) query = query.eq('reporter_id', reporterId);
      return (check(await query) as ReportRow[]).map(toReport);
    },

    getReport,

    async createReport({ history, ...report }) {
      const { id } = check(
        await db
          .from('reports')
          .insert({
            description: report.description,
            category: report.category,
            building: report.building,
            floor: report.floor,
            lat: report.lat,
            lng: report.lng,
            accuracy_m: report.accuracyM,
            photo: report.photo,
            status: report.status,
            note: report.note,
            confirmations: report.confirmations,
            reporter_id: report.reporterId,
            created_at: report.createdAt,
            updated_at: report.updatedAt,
          })
          .select('id')
          .single(),
      ) as { id: number };

      check(
        await db
          .from('report_history')
          .insert(history.map((h) => ({ report_id: id, status: h.status, at: h.at }))),
      );
      return (await getReport(id))!;
    },

    async addConfirmation(reportId, reporterId) {
      // One database call does both steps; see add_confirmation() in schema.sql.
      const count = check(
        await db.rpc('add_confirmation', { p_report_id: reportId, p_reporter_id: reporterId }),
      ) as number | null;
      return count ?? undefined;
    },

    async updateReport(id, { status, note, at }) {
      const changes = {
        updated_at: at,
        ...(status !== undefined && { status }),
        ...(note !== undefined && { note }),
      };
      const updated = check(await db.from('reports').update(changes).eq('id', id).select('id'));
      if (!updated || updated.length === 0) return undefined;

      if (status !== undefined) {
        check(await db.from('report_history').insert({ report_id: id, status, at }));
      }
      return getReport(id);
    },

    async listNotifications(reporterId) {
      const rows = check(
        await db
          .from('notifications')
          .select('*')
          .eq('reporter_id', reporterId)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false }),
      ) as NotificationRow[];
      return rows.map(toNotification);
    },

    async createNotification(notification) {
      const row = check(
        await db
          .from('notifications')
          .insert({
            reporter_id: notification.reporterId,
            report_id: notification.reportId,
            kind: notification.kind,
            status: notification.status,
            note: notification.note,
            created_at: notification.createdAt,
          })
          .select('*')
          .single(),
      ) as NotificationRow;
      return toNotification(row);
    },

    async markNotificationsRead(reporterId, ids) {
      let query = db.from('notifications').update({ read: true }).eq('reporter_id', reporterId);
      if (ids) query = query.in('id', ids);
      check(await query);
    },
  };
}
