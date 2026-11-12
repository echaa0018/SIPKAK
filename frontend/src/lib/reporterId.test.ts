import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getReporterId } from './reporterId';

const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

beforeEach(() => {
  // Make sure a demo ID from a local .env doesn't leak into these tests.
  vi.stubEnv('VITE_DEMO_REPORTER_ID', '');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('getReporterId', () => {
  it('creates a random UUID and keeps it in localStorage', () => {
    const id = getReporterId();

    expect(id).toMatch(uuidV4);
    expect(localStorage.getItem('sipkak.reporterId')).toBe(id);
  });

  it('returns the same ID every time', () => {
    expect(getReporterId()).toBe(getReporterId());
  });

  it('reuses an ID saved earlier', () => {
    localStorage.setItem('sipkak.reporterId', '99999999-9999-4999-8999-999999999999');

    expect(getReporterId()).toBe('99999999-9999-4999-8999-999999999999');
  });

  it('uses VITE_DEMO_REPORTER_ID when it is set', () => {
    vi.stubEnv('VITE_DEMO_REPORTER_ID', '00000000-0000-4000-8000-000000000001');

    expect(getReporterId()).toBe('00000000-0000-4000-8000-000000000001');
    expect(localStorage.getItem('sipkak.reporterId')).toBeNull();
  });

  it('still works when localStorage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const id = getReporterId();
    expect(id).toMatch(uuidV4);
    expect(getReporterId()).toBe(id);
  });
});
