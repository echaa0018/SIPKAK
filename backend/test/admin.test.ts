import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/createApp.js';

const password = 'test-password';
const token = 'test-token';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  vi.stubEnv('ADMIN_PASSWORD', password);
  vi.stubEnv('ADMIN_TOKEN', token);
  app = createApp();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const patch = (id: number, body: object, auth: string | null = `Bearer ${token}`) => {
  const req = request(app).patch(`/api/admin/reports/${id}`);
  return auth ? req.set('Authorization', auth).send(body) : req.send(body);
};

describe('POST /api/admin/login', () => {
  it('returns the token for the right password', async () => {
    const res = await request(app).post('/api/admin/login').send({ password });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token });
  });

  it('returns UNAUTHORIZED for a wrong password', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'guess' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns UNAUTHORIZED when no admin password is configured', async () => {
    vi.stubEnv('ADMIN_PASSWORD', '');
    const res = await request(app).post('/api/admin/login').send({ password });

    expect(res.status).toBe(401);
  });

  it('needs a password in the body', async () => {
    const res = await request(app).post('/api/admin/login').send({});

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ password: 'Required' });
  });
});

describe('PATCH /api/admin/reports/:id', () => {
  it('returns UNAUTHORIZED without a token or with a wrong one', async () => {
    const missing = await patch(145, { status: 'in_progress' }, null);
    const wrong = await patch(145, { status: 'in_progress' }, 'Bearer nope');

    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('UNAUTHORIZED');
    expect(wrong.status).toBe(401);
    expect((await request(app).get('/api/reports/145')).body.status).toBe('waiting');
  });

  it('changes the status and adds a history entry', async () => {
    const res = await patch(145, { status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.history).toEqual([
      { status: 'waiting', at: '2026-11-11T03:47:00Z' },
      { status: 'in_progress', at: res.body.updatedAt },
    ]);
    expect(res.body).not.toHaveProperty('reporterId');
    expect((await request(app).get('/api/reports/145')).body.status).toBe('in_progress');
  });

  it('changes status and note together', async () => {
    const res = await patch(145, { status: 'done', note: 'Paving relaid.' });

    expect(res.body).toMatchObject({ status: 'done', note: 'Paving relaid.' });
    expect(res.body.history.at(-1).status).toBe('done');
  });

  it('replaces only the note when the status stays the same', async () => {
    const res = await patch(142, { status: 'in_progress', note: 'Parts arrive tomorrow.' });

    expect(res.status).toBe(200);
    expect(res.body.note).toBe('Parts arrive tomorrow.');
    expect(res.body.history).toHaveLength(2);
  });

  it('rejects the same status again with no note', async () => {
    const res = await patch(142, { status: 'in_progress' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects an empty update and an unknown status', async () => {
    const empty = await patch(142, { note: '  ' });
    const unknown = await patch(142, { status: 'fixed' });

    expect(empty.status).toBe(400);
    expect(empty.body.error.details).toEqual({ status: 'Send a status, a note or both' });
    expect(unknown.status).toBe(400);
  });

  it('returns NOT_FOUND for an unknown report', async () => {
    const res = await patch(9999, { status: 'done' });

    expect(res.status).toBe(404);
  });
});
