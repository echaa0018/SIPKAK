import type { Report } from '../api/reports';

/**
 * Replaces navigator.geolocation (jsdom has none). Answers at once with a position,
 * or with an error code (1 = permission denied, 2 = unavailable, 3 = timeout).
 */
export function mockGeolocation(
  result: { lat: number; lng: number; accuracy: number } | { errorCode: 1 | 2 | 3 },
) {
  const geolocation = {
    getCurrentPosition(
      ok: (position: GeolocationPosition) => void,
      fail?: (error: GeolocationPositionError) => void,
    ) {
      if ('errorCode' in result) {
        fail?.({
          code: result.errorCode,
          message: '',
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError);
        return;
      }
      ok({
        coords: { latitude: result.lat, longitude: result.lng, accuracy: result.accuracy },
        timestamp: Date.now(),
      } as GeolocationPosition);
    },
  };
  Object.defineProperty(navigator, 'geolocation', { configurable: true, value: geolocation });
}

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
