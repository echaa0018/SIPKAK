import express from 'express';
import { errorHandler, notFound } from './lib/errors.js';
import { metaRouter } from './routes/meta.js';
import { reportsRouter } from './routes/reports.js';
import { createReportService } from './services/reports.js';
import { createMemoryStore } from './store/memoryStore.js';
import type { Store } from './store/store.js';

// Tests pass their own store so each test starts from fresh seed data.
export function createApp(store: Store = createMemoryStore()) {
  const app = express();
  const reports = createReportService(store);

  app.use(express.json({ limit: '1mb' }));
  app.use('/api', metaRouter);
  app.use('/api', reportsRouter(reports));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
