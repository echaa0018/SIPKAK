import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp.js';

const app = createApp();

describe('GET /api/health', () => {
  it('reports that the API is up and which store it uses', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, store: 'memory' });
  });
});

describe('errors', () => {
  it('returns a NOT_FOUND error for unknown routes', async () => {
    const res = await request(app).get('/api/nope');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toEqual(expect.any(String));
  });

  it('returns a VALIDATION_ERROR for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{"oops"');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns PAYLOAD_TOO_LARGE for bodies over 1 MB', async () => {
    const res = await request(app)
      .post('/api/health')
      .send({ text: 'x'.repeat(1024 * 1024 + 1) });

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});
