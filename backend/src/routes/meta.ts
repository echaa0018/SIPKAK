import { Router } from 'express';
import { buildings } from '../data/buildings.js';

export const metaRouter = Router();

metaRouter.get('/health', (_req, res) => {
  res.json({ ok: true, store: process.env.DATA_STORE ?? 'memory' });
});

metaRouter.get('/buildings', (_req, res) => {
  res.json({ buildings });
});
