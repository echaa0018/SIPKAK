import { Router } from 'express';
import { buildings } from '../data/buildings.js';
import type { Store } from '../store/store.js';

export function metaRouter(storeKind: Store['kind']) {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, store: storeKind });
  });

  router.get('/buildings', (_req, res) => {
    res.json({ buildings });
  });

  return router;
}
