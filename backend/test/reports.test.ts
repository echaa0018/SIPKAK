import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp.js';
import { demoReporterId } from '../src/data/seed.js';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp();
});

describe('GET /api/reports', () => {
  it('lists the 8 seed reports, newest first', async () => {
    const res = await request(app).get('/api/reports');

    expect(res.status).toBe(200);
    expect(res.body.reports.map((r: { id: number }) => r.id)).toEqual([
      145, 144, 142, 139, 133, 127, 120, 98,
    ]);
  });

  it('never sends reporterId', async () => {
    const res = await request(app).get('/api/reports').set('X-Reporter-Id', demoReporterId);

    expect(JSON.stringify(res.body)).not.toContain('reporterId');
  });

  it('sets isMine only for reports sent by the X-Reporter-Id reporter', async () => {
    const res = await request(app).get('/api/reports').set('X-Reporter-Id', demoReporterId);
    const mine = res.body.reports.filter((r: { isMine: boolean }) => r.isMine);

    expect(mine.map((r: { id: number }) => r.id)).toEqual([142, 127, 98]);
  });

  it('sets isMine to false for everything without the header', async () => {
    const res = await request(app).get('/api/reports');

    expect(res.body.reports.every((r: { isMine: boolean }) => r.isMine === false)).toBe(true);
  });
});

describe('GET /api/reports filters', () => {
  const ids = (res: request.Response) => res.body.reports.map((r: { id: number }) => r.id);

  it('filters by status', async () => {
    expect(ids(await request(app).get('/api/reports?status=done'))).toEqual([127, 120]);
    expect(ids(await request(app).get('/api/reports?status=waiting'))).toEqual([145, 144, 139, 98]);
    expect(ids(await request(app).get('/api/reports?status=in_progress'))).toEqual([142, 133]);
  });

  it('keeps only your own reports with mine=true', async () => {
    const res = await request(app)
      .get('/api/reports?mine=true')
      .set('X-Reporter-Id', demoReporterId);

    expect(res.status).toBe(200);
    expect(ids(res)).toEqual([142, 127, 98]);
    expect(JSON.stringify(res.body)).not.toContain('reporterId');
  });

  it('combines mine and status', async () => {
    const res = await request(app)
      .get('/api/reports?mine=true&status=done')
      .set('X-Reporter-Id', demoReporterId);

    expect(ids(res)).toEqual([127]);
  });

  it('returns nothing with mine=true for a reporter who has sent nothing', async () => {
    const res = await request(app)
      .get('/api/reports?mine=true')
      .set('X-Reporter-Id', '11111111-1111-4111-8111-111111111111');

    expect(ids(res)).toEqual([]);
  });

  it('lists everything with mine=false', async () => {
    expect(ids(await request(app).get('/api/reports?mine=false'))).toHaveLength(8);
  });

  it('needs the X-Reporter-Id header for mine=true', async () => {
    const res = await request(app).get('/api/reports?mine=true');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { 'X-Reporter-Id': 'Required' },
    });
  });

  it('rejects an unknown status', async () => {
    const res = await request(app).get('/api/reports?status=fixed');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { status: expect.any(String) },
    });
  });
});

describe('GET /api/reports/:id', () => {
  it('returns one report', async () => {
    const res = await request(app).get('/api/reports/142');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: 142,
      description: 'Lamp by the east stairs is out',
      building: 'Aula Barat',
      status: 'in_progress',
      isMine: false,
      history: [
        { status: 'waiting', at: '2026-11-11T02:12:00Z' },
        { status: 'in_progress', at: '2026-11-11T04:20:00Z' },
      ],
    });
    expect(res.body).not.toHaveProperty('reporterId');
  });

  it('returns NOT_FOUND for an unknown id', async () => {
    const res = await request(app).get('/api/reports/9999');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns VALIDATION_ERROR for an id that is not a number', async () => {
    const res = await request(app).get('/api/reports/abc');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { id: expect.any(String) },
    });
  });
});

describe('GET /api/buildings', () => {
  it('lists the buildings for the form dropdown', async () => {
    const res = await request(app).get('/api/buildings');

    expect(res.status).toBe(200);
    expect(res.body.buildings).toHaveLength(35);
    expect(res.body.buildings[0]).toEqual({ name: 'Aula Barat', lat: -6.89246, lng: 107.609824 });
    expect(res.body.buildings).toContainEqual({
      name: 'Outdoor area / walkway',
      lat: null,
      lng: null,
    });
  });
});
