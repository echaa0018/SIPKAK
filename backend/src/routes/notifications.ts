import { Router } from 'express';
import { markReadBody, requireReporterId } from '../lib/validation.js';
import type { NotificationService } from '../services/notifications.js';

export function notificationsRouter(notifications: NotificationService) {
  const router = Router();

  // SIMULATED: the frontend polls this every 15 seconds. The real app would push updates
  // (for example with Supabase Realtime or web push).
  router.get('/notifications', async (req, res) => {
    const reporterId = requireReporterId(req.get('X-Reporter-Id'));
    res.json(await notifications.list(reporterId));
  });

  router.post('/notifications/read', async (req, res) => {
    const reporterId = requireReporterId(req.get('X-Reporter-Id'));
    // A request with no body at all also means "mark all as read".
    const { ids } = markReadBody.parse(req.body ?? {});
    res.json(await notifications.markRead(reporterId, ids));
  });

  return router;
}
