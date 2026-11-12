import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { updateReport } from './admin';
import { ApiError, request } from './client';
import { markNotificationsRead } from './notifications';
import { createReport, listNearbyReports, listReports } from './reports';

const demoId = '00000000-0000-4000-8000-000000000001';
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubEnv('VITE_DEMO_REPORTER_ID', demoId);
  // A new Response per call: a body can only be read once.
  fetchMock = vi.fn(async () => Response.json({ reports: [] }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** The [url, init] of the last fetch call. */
const lastCall = () => fetchMock.mock.lastCall as [string, RequestInit];

describe('request', () => {
  it('sends X-Reporter-Id on every request', async () => {
    await request('/reports');

    const [url, init] = lastCall();
    expect(url).toBe('/api/reports');
    expect(init.method).toBe('GET');
    expect(init.headers).toEqual({ 'X-Reporter-Id': demoId });
  });

  it('sends a JSON body and the admin token when given', async () => {
    await request('/admin/reports/1', { method: 'PATCH', body: { status: 'done' }, token: 'abc' });

    const [, init] = lastCall();
    expect(init.body).toBe('{"status":"done"}');
    expect(init.headers).toEqual({
      'X-Reporter-Id': demoId,
      'Content-Type': 'application/json',
      Authorization: 'Bearer abc',
    });
  });

  it('turns an API error into an ApiError with code and details', async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request',
            details: { description: 'Too short' },
          },
        },
        { status: 400 },
      ),
    );

    const error = await request('/reports').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid request',
      details: { description: 'Too short' },
    });
  });

  it('still gives an ApiError when the error body is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('Bad gateway', { status: 502 }));

    await expect(request('/reports')).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL',
      details: {},
    });
  });

  it('gives a NETWORK ApiError when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/reports')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });
});

describe('endpoint helpers', () => {
  it('builds the list query', async () => {
    await listReports();
    expect(lastCall()[0]).toBe('/api/reports');

    await listReports({ status: 'done', mine: true });
    expect(lastCall()[0]).toBe('/api/reports?status=done&mine=true');
  });

  it('builds the nearby query with a default radius of 30 m', async () => {
    await listNearbyReports(-6.89258, 107.61015);

    expect(lastCall()[0]).toBe('/api/reports/nearby?lat=-6.89258&lng=107.61015&radius=30');
  });

  it('posts a new report', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 146 }, { status: 201 }));
    const report = {
      description: 'Broken window',
      category: 'other' as const,
      building: 'Aula Barat',
      lat: -6.89,
      lng: 107.61,
      photo: 'data:image/jpeg;base64,AAAA',
    };

    expect(await createReport(report)).toEqual({ id: 146 });
    expect(lastCall()[1]).toMatchObject({ method: 'POST', body: JSON.stringify(report) });
  });

  it('marks all notifications read with an empty body', async () => {
    fetchMock.mockResolvedValue(Response.json({ unread: 0 }));

    expect(await markNotificationsRead()).toBe(0);
    expect(lastCall()[1].body).toBe('{}');
  });

  it('sends the admin token with updates', async () => {
    fetchMock.mockResolvedValue(Response.json({ id: 145 }));
    await updateReport('tok', 145, { status: 'in_progress' });

    const [url, init] = lastCall();
    expect(url).toBe('/api/admin/reports/145');
    expect(init.method).toBe('PATCH');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer tok' });
  });
});
