import { Router } from 'express';
import { loginBody, reportIdParams, updateReportBody } from '../lib/validation.js';
import { checkAdminToken, login } from '../services/admin.js';
import type { ReportService } from '../services/reports.js';

export function adminRouter(reports: ReportService) {
  const router = Router();

  router.post('/admin/login', (req, res) => {
    const { password } = loginBody.parse(req.body);
    res.json({ token: login(password) });
  });

  // Every admin route below this line needs "Authorization: Bearer <token>".
  router.use('/admin', (req, _res, next) => {
    checkAdminToken(req.get('Authorization'));
    next();
  });

  router.patch('/admin/reports/:id', async (req, res) => {
    const { id } = reportIdParams.parse(req.params);
    const update = updateReportBody.parse(req.body);
    res.json(await reports.update(id, update));
  });

  return router;
}
