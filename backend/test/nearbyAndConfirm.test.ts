import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp.js';
import { demoReporterId } from '../src/data/seed.js';

const otherReporter = '22222222-2222-4222-8222-222222222222';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp();
});

describe('GET /api/reports/nearby', () => {
  it('finds report #0142 about 26 m from the simulated position', async () => {
    const res = await request(app).get('/api/reports/nearby?lat=-6.89258&lng=107.61015');

    expect(res.status).toBe(200);
    expect(res.body.reports).toHaveLength(1);
    expect(res.body.reports[0]).toMatchObject({
      id: 142,
      description: 'Lamp by the east stairs is out',
      distanceM: 26,
    });
    expect(res.body.reports[0]).not.toHaveProperty('reporterId');
  });

  it('sorts nearest first within a bigger radius', async () => {
    // Between the Labtek V/VIII and CC Timur reports.
    const res = await request(app).get('/api/reports/nearby?lat=-6.8909&lng=107.6107&radius=100');
    const distances = res.body.reports.map((r: { distanceM: number }) => r.distanceM);

    expect(res.body.reports.map((r: { id: number }) => r.id)).toEqual([98, 144]);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
    expect(distances.every((d: number) => d <= 100)).toBe(true);
  });

  it('leaves out reports that are done', async () => {
    // Exactly on report #0127, which is done.
    const res = await request(app).get(
      '/api/reports/nearby?lat=-6.890588&lng=107.609788&radius=10',
    );

    expect(res.body.reports).toEqual([]);
  });

  it('sets isMine from the header', async () => {
    const res = await request(app)
      .get('/api/reports/nearby?lat=-6.89258&lng=107.61015')
      .set('X-Reporter-Id', demoReporterId);

    expect(res.body.reports[0].isMine).toBe(true);
  });

  it('rejects a radius over 100 m and a missing point', async () => {
    const tooFar = await request(app).get('/api/reports/nearby?lat=-6.89&lng=107.61&radius=101');
    const noPoint = await request(app).get('/api/reports/nearby');

    expect(tooFar.status).toBe(400);
    expect(tooFar.body.error.details).toEqual({ radius: 'At most 100 metres' });
    expect(noPoint.status).toBe(400);
    expect(noPoint.body.error.details).toEqual({ lat: 'Required', lng: 'Required' });
  });
});

describe('POST /api/reports/:id/confirmations', () => {
  const confirm = (id: number | string, reporterId?: string) => {
    const req = request(app).post(`/api/reports/${id}/confirmations`);
    return reporterId ? req.set('X-Reporter-Id', reporterId) : req;
  };

  it('adds one to the count', async () => {
    const res = await confirm(142, otherReporter);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ confirmations: 4 });
    expect((await request(app).get('/api/reports/142')).body.confirmations).toBe(4);
  });

  it('returns CONFLICT when the same reporter confirms twice', async () => {
    await confirm(142, otherReporter);
    const second = await confirm(142, otherReporter);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CONFLICT');
    expect((await request(app).get('/api/reports/142')).body.confirmations).toBe(4);
  });

  it('lets different reporters each confirm once', async () => {
    await confirm(145, otherReporter);
    const res = await confirm(145, '33333333-3333-4333-8333-333333333333');

    expect(res.body).toEqual({ confirmations: 2 });
  });

  it('returns CONFLICT when you confirm your own report', async () => {
    const res = await confirm(142, demoReporterId);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns NOT_FOUND for an unknown report', async () => {
    const res = await confirm(9999, otherReporter);

    expect(res.status).toBe(404);
  });

  it('needs the X-Reporter-Id header', async () => {
    const res = await confirm(142);

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ 'X-Reporter-Id': 'Required' });
  });
});
