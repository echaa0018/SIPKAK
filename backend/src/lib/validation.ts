import { z } from 'zod';

export const reportStatus = z.enum(['waiting', 'in_progress', 'done']);

export const reportIdParams = z.object({ id: z.coerce.number().int().positive() });

// GET /api/reports?status=&mine=true
export const listReportsQuery = z.object({
  status: reportStatus.optional(),
  mine: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});
