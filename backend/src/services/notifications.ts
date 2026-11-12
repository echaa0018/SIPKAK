import type { Store, StoredNotification } from '../store/store.js';

// The notification shape the API sends: no reporterId, plus the report's description.
export type Notification = Omit<StoredNotification, 'reporterId'> & {
  reportDescription: string;
};

export function createNotificationService(store: Store) {
  return {
    /** This reporter's notifications, newest first, and how many are unread. */
    async list(reporterId: string): Promise<{ notifications: Notification[]; unread: number }> {
      const stored = await store.listNotifications(reporterId);
      const reports = await store.listReports({ reporterId });
      const descriptions = new Map(reports.map((r) => [r.id, r.description]));

      const notifications = stored.map(({ reporterId: _owner, ...n }) => ({
        ...n,
        reportDescription: descriptions.get(n.reportId) ?? '',
      }));
      return { notifications, unread: notifications.filter((n) => !n.read).length };
    },

    /** Marks the given ids as read (all of them without ids) and returns the new unread count. */
    async markRead(reporterId: string, ids?: number[]): Promise<{ unread: number }> {
      await store.markNotificationsRead(reporterId, ids);
      const { unread } = await this.list(reporterId);
      return { unread };
    },
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
