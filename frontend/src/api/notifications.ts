import { request } from './client';
import type { ReportStatus } from './reports';

export interface Notification {
  id: number;
  reportId: number;
  reportDescription: string;
  /** "status" when the status changed (a note may come too), "note" for a note only. */
  kind: 'status' | 'note';
  status: ReportStatus | null;
  note: string | null;
  read: boolean;
  createdAt: string;
}

/** Your notifications, newest first, and how many are unread. */
export function listNotifications() {
  return request<{ notifications: Notification[]; unread: number }>('/notifications');
}

/** Marks these notifications as read (all of them without ids). Returns the new unread count. */
export async function markNotificationsRead(ids?: number[]) {
  const body = ids ? { ids } : {};
  return (await request<{ unread: number }>('/notifications/read', { method: 'POST', body }))
    .unread;
}
