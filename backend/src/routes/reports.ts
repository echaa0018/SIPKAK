import { Router } from 'express';
import { listReportsQuery, reportIdParams } from '../lib/validation.js';
import type { ReportService } from '../services/reports.js';

export function reportsRouter(reports: ReportService) {
  const router = Router();

  // X-Reporter-Id is optional on GET requests: it sets isMine, and ?mine=true needs it.
  router.get('/reports', async (req, res) => {
    const query = listReportsQuery.parse(req.query);
    res.json({ reports: await reports.list(query, req.get('X-Reporter-Id')) });
  });

  router.get('/reports/:id', async (req, res) => {
    const { id } = reportIdParams.parse(req.params);
    res.json(await reports.get(id, req.get('X-Reporter-Id')));
  });

  return router;
}
