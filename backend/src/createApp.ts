import express from 'express';
import { errorHandler, notFound } from './lib/errors.js';
import { metaRouter } from './routes/meta.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use('/api', metaRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
