import { Router } from 'express';
import { z } from 'zod';
import type { ReportService } from '../services/reports.js';

const idParams = z.object({ id: z.coerce.number().int().positive() });

export function reportsRouter(reports: ReportService) {
  const router = Router();

  // X-Reporter-Id is optional on GET requests; it only sets isMine.
  router.get('/reports', async (req, res) => {
    res.json({ reports: await reports.list(req.get('X-Reporter-Id')) });
  });

  router.get('/reports/:id', async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.json(await reports.get(id, req.get('X-Reporter-Id')));
  });

  return router;
}
