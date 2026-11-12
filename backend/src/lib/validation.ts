import { z } from 'zod';
import { buildings } from '../data/buildings.js';
import { mapBounds } from '../data/mapBounds.js';
import { AppError } from './errors.js';

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

// GET /api/reports/nearby?lat=&lng=&radius=30
export const nearbyQuery = z.object({
  lat: z.coerce.number({ error: 'Required' }),
  lng: z.coerce.number({ error: 'Required' }),
  radius: z.coerce.number().positive().max(100, 'At most 100 metres').default(30),
});

const buildingNames = new Set(buildings.map((b) => b.name));

// POST /api/reports. The photo's 10 MB limit is checked in the service, because it is a 413.
export const createReportBody = z.object({
  description: z
    .string({ error: 'Required' })
    .trim()
    .min(5, 'Too short')
    .max(280, 'At most 280 characters'),
  building: z
    .string({ error: 'Required' })
    .refine((name) => buildingNames.has(name), 'Unknown building'),
  floor: z
    .string()
    .trim()
    .max(20, 'At most 20 characters')
    .nullish()
    .transform((floor) => floor || null),
  lat: z
    .number({ error: 'Required' })
    .min(mapBounds.south, 'Outside campus')
    .max(mapBounds.north, 'Outside campus'),
  lng: z
    .number({ error: 'Required' })
    .min(mapBounds.west, 'Outside campus')
    .max(mapBounds.east, 'Outside campus'),
  accuracyM: z.number().positive().optional(),
  photo: z
    .string()
    .startsWith('data:image/jpeg;base64,', 'Must be a JPEG data URL')
    .nullish()
    .transform((photo) => photo ?? null),
});

export type CreateReportInput = z.infer<typeof createReportBody>;

// POST /api/notifications/read. No ids means "mark all as read".
export const markReadBody = z.object({
  ids: z.array(z.number().int().positive()).optional(),
});

// POST /api/admin/login
export const loginBody = z.object({
  password: z.string({ error: 'Required' }).min(1, 'Required'),
});

// PATCH /api/admin/reports/:id. An empty note counts as no note.
export const updateReportBody = z
  .object({
    status: reportStatus.optional(),
    note: z
      .string()
      .trim()
      .max(500, 'At most 500 characters')
      .optional()
      .transform((note) => note || undefined),
  })
  .refine((body) => body.status !== undefined || body.note !== undefined, {
    message: 'Send a status, a note or both',
    path: ['status'],
  });

export type UpdateReportInput = z.infer<typeof updateReportBody>;

/** Reads the X-Reporter-Id header where it is required. */
export function requireReporterId(value: string | undefined): string {
  if (!z.uuid().safeParse(value).success) {
    throw new AppError('VALIDATION_ERROR', 'The X-Reporter-Id header must be a UUID', {
      'X-Reporter-Id': value ? 'Must be a UUID' : 'Required',
    });
  }
  return value!;
}
