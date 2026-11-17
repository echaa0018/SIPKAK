import request from 'supertest';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/createApp.js';
import { login } from '../src/services/admin.js';

const reporter = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
let token: string;
const validReport = {
  description: 'Broken handrail near the entrance',
  building: 'Aula Barat', floor: '1', lat: -6.89258, lng: 107.61015,
  photo: 'data:image/jpeg;base64,AAAA',
};
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  vi.stubEnv('ADMIN_USERS_JSON', '');
  vi.stubEnv('ADMIN_USERNAME', 'admin');
  vi.stubEnv('ADMIN_PASSWORD', 'review-test-password');
  vi.stubEnv('ADMIN_SESSION_SECRET', 'review-test-signing-secret');
  token = login('admin', 'review-test-password');
  app = createApp();
});
afterEach(() => vi.unstubAllEnvs());
const create = (id = reporter) => request(app).post('/api/reports')
  .set('X-Reporter-Id', id).send(validReport);
const review = (id: number, decision: object, auth = token) =>
  request(app).patch(`/api/admin/reports/${id}/review`)
    .set('Authorization', `Bearer ${auth}`).send(decision);

describe('anonymous reporting with verification', () => {
  it('hides pending reports from public list, detail and nearby search', async () => {
    const posted = await create();
    expect(posted.status).toBe(201);
    const id = posted.body.id;
    expect(posted.body.reviewStatus).toBe('pending');
    const list = await request(app).get('/api/reports');
    expect(list.body.reports.some((r: { id: number }) => r.id === id)).toBe(false);
    expect((await request(app).get(`/api/reports/${id}`)).status).toBe(404);
    expect((await request(app).get(`/api/reports/${id}`).set('X-Reporter-Id', other)).status).toBe(404);
    const mine = await request(app).get('/api/reports?mine=true').set('X-Reporter-Id', reporter);
    expect(mine.body.reports[0].id).toBe(id);
    expect((await request(app).get(`/api/reports/${id}`).set('X-Reporter-Id', reporter)).status).toBe(200);
    const nearby = await request(app).get('/api/reports/nearby?lat=-6.89258&lng=107.61015');
    expect(nearby.body.reports.some((r: { id: number }) => r.id === id)).toBe(false);
  });

  it('only lets authenticated admins approve, then makes the report visible', async () => {
    const id = (await create()).body.id as number;
    expect((await request(app).get('/api/admin/reports')).status).toBe(401);
    expect((await review(id, { decision: 'approved' }, 'wrong')).status).toBe(401);
    expect((await request(app).get('/api/admin/reports').set('Authorization', `Bearer ${token}`)).body.reports[0].id).toBe(id);
    const accepted = await review(id, { decision: 'approved' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.reviewStatus).toBe('approved');
    expect((await request(app).get('/api/reports')).body.reports[0].id).toBe(id);
    expect((await review(id, { decision: 'approved' })).status).toBe(409);
    const n = await request(app).get('/api/notifications').set('X-Reporter-Id', reporter);
    expect(n.body.notifications[0].note).toContain('approved');
  });

  it('rejects with an explanation and keeps the report private', async () => {
    const id = (await create()).body.id as number;
    expect((await review(id, { decision: 'rejected', reason: 'No' })).status).toBe(400);
    const result = await review(id, { decision: 'rejected', reason: 'Not a real campus facility.' });
    expect(result.status).toBe(200);
    expect(result.body.reviewStatus).toBe('rejected');
    expect((await request(app).get(`/api/reports/${id}`)).status).toBe(404);
    const mine = await request(app).get('/api/reports?mine=true').set('X-Reporter-Id', reporter);
    expect(mine.body.reports[0].note).toContain('Not a real campus facility.');
    const n = await request(app).get('/api/notifications').set('X-Reporter-Id', reporter);
    expect(n.body.notifications[0].note).toContain('rejected');
  });

  it('does not permit processing, or confirming, an unpublished report', async () => {
    const id = (await create()).body.id as number;
    const update = await request(app).patch(`/api/admin/reports/${id}`)
      .set('Authorization', `Bearer ${token}`).send({ status: 'in_progress' });
    expect(update.status).toBe(409);
    const confirm = await request(app).post(`/api/reports/${id}/confirmations`)
      .set('X-Reporter-Id', other);
    expect(confirm.status).toBe(404);
  });

  it('limits a single anonymous reporter to three reports in 10 minutes', async () => {
    for (let i = 0; i < 3; i++) expect((await create()).status).toBe(201);
    const blocked = await create();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
