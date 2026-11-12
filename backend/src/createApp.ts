import express from 'express';
import { errorHandler, notFound } from './lib/errors.js';
import { adminRouter } from './routes/admin.js';
import { metaRouter } from './routes/meta.js';
import { notificationsRouter } from './routes/notifications.js';
import { reportsRouter } from './routes/reports.js';
import { createNotificationService } from './services/notifications.js';
import { createReportService } from './services/reports.js';
import { createStore } from './store/createStore.js';
import type { Store } from './store/store.js';

// The store comes from DATA_STORE (memory by default). Each createApp() without a store gets a
// fresh memory store, so every test starts from the seed data.
export function createApp(store: Store = createStore()) {
  const app = express();
  const reports = createReportService(store);
  const notifications = createNotificationService(store);

  // The photo (up to 10 MB) travels inside the JSON body, plus 1 MB for the other fields.
  app.use(express.json({ limit: '11mb' }));
  app.use('/api', metaRouter(store.kind));
  app.use('/api', reportsRouter(reports));
  app.use('/api', notificationsRouter(notifications));
  app.use('/api', adminRouter(reports));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
