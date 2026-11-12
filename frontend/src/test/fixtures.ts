import type { Report } from '../api/reports';

/** A report for tests; override only the fields a test cares about. */
export function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    id: 142,
    description: 'Lamp by the east stairs is out',
    building: 'Aula Barat',
    floor: '1',
    lat: -6.892614,
    lng: 107.609915,
    accuracyM: 12,
    photo: null,
    status: 'in_progress',
    note: 'Technician scheduled for 12/11/2026.',
    confirmations: 3,
    isMine: false,
    createdAt: '2026-11-11T02:12:00Z',
    updatedAt: '2026-11-11T04:20:00Z',
    history: [
      { status: 'waiting', at: '2026-11-11T02:12:00Z' },
      { status: 'in_progress', at: '2026-11-11T04:20:00Z' },
    ],
    ...overrides,
  };
}
