import { useCallback, useEffect, useRef, useState } from 'react';
import { listNotifications, markNotificationsRead, type Notification } from '../api/notifications';

export const POLL_MS = 15_000;

/**
 * Your notifications and the unread count, kept fresh.
 *
 * SIMULATED: asks the API again every 15 seconds and whenever the window gets focus.
 * The real app would have the server push updates (e.g. Supabase Realtime or web push).
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Ids you opened in this tab. A poll that started before the server saved "read" must not
  // make them unread again.
  const openedIds = useRef(new Set<number>());

  useEffect(() => {
    let current = true;
    const load = () =>
      listNotifications().then(
        (data) => {
          if (!current) return;
          setNotifications(
            data.notifications.map((n) => (openedIds.current.has(n.id) ? { ...n, read: true } : n)),
          );
        },
        () => {}, // keep showing what we had; the next poll tries again
      );

    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener('focus', load);
    return () => {
      current = false;
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, []);

  /** Marks one notification as read: at once on screen, then on the server. */
  const markRead = useCallback((id: number) => {
    openedIds.current.add(id);
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationsRead([id]).catch(() => {}); // the next poll shows the server's view anyway
  }, []);

  // The same number the API sends as `unread`, but it also drops the moment you open one.
  const unread = notifications.filter((n) => !n.read).length;
  return { notifications, unread, markRead };
}
