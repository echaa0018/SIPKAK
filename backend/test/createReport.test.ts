import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/createApp.js';
import { MAX_PHOTO_BYTES } from '../src/services/reports.js';

const reporterId = '11111111-1111-4111-8111-111111111111';

const jpeg = (bytes: number) => 'data:image/jpeg;base64,' + 'A'.repeat(bytes);

const validReport = {
  description: 'Broken window in the stairwell',
  category: 'other',
  building: 'Aula Barat',
  floor: '1',
  lat: -6.89258,
  lng: 107.61015,
  photo: jpeg(100),
};

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  app = createApp();
});

const post = (body: object, id: string | null = reporterId) => {
  const req = request(app).post('/api/reports');
  return id ? req.set('X-Reporter-Id', id).send(body) : req.send(body);
};

describe('POST /api/reports', () => {
  it('creates a waiting report with the next id', async () => {
    const res = await post(validReport);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 146,
      ...validReport,
      accuracyM: 12,
      status: 'waiting',
      note: null,
      confirmations: 0,
      isMine: true,
    });
    expect(res.body.history).toEqual([{ status: 'waiting', at: res.body.createdAt }]);
    expect(res.body.updatedAt).toBe(res.body.createdAt);
    expect(res.body).not.toHaveProperty('reporterId');
  });

  it('puts the new report first in the list and under mine', async () => {
    await post(validReport);
    const second = await post(validReport);

    expect(second.body.id).toBe(147);
    const all = await request(app).get('/api/reports');
    expect(all.body.reports[0].id).toBe(147);
    const mine = await request(app).get('/api/reports?mine=true').set('X-Reporter-Id', reporterId);
    expect(mine.body.reports.map((r: { id: number }) => r.id)).toEqual([147, 146]);
  });

  it('keeps a JPEG photo and stores an empty floor as null', async () => {
    const photo = jpeg(1000);
    const res = await post({ ...validReport, floor: '  ', photo });

    expect(res.status).toBe(201);
    expect(res.body.photo).toBe(photo);
    expect(res.body.floor).toBeNull();
  });

  it('ignores fields the client may not set', async () => {
    const res = await post({ ...validReport, status: 'done', confirmations: 99, id: 1 });

    expect(res.body).toMatchObject({ id: 146, status: 'waiting', confirmations: 0 });
  });

  it('rejects an empty description with field details', async () => {
    const res = await post({ ...validReport, description: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { description: 'Too short' },
    });
  });

  it('lists every invalid field at once', async () => {
    const res = await post({ floor: 'x'.repeat(21) });

    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details).sort()).toEqual([
      'building',
      'category',
      'description',
      'floor',
      'lat',
      'lng',
      'photo',
    ]);
  });

  it('rejects a point outside campus', async () => {
    const res = await post({ ...validReport, lat: -6.9, lng: 107.6 });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ lat: 'Outside campus', lng: 'Outside campus' });
  });

  it('needs a known category', async () => {
    const missing = await post({ ...validReport, category: undefined });
    const unknown = await post({ ...validReport, category: 'graffiti' });

    expect(missing.status).toBe(400);
    expect(missing.body.error.details).toEqual({ category: 'Choose a category' });
    expect(unknown.body.error.details).toEqual({ category: 'Choose a category' });
  });

  it('needs a photo as evidence', async () => {
    const res = await post({ ...validReport, photo: undefined });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ photo: 'Add a photo' });
  });

  it('rejects an unknown building', async () => {
    const res = await post({ ...validReport, building: 'Gedung Sate' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ building: 'Unknown building' });
  });

  it('rejects a photo that is not a JPEG data URL', async () => {
    const res = await post({ ...validReport, photo: 'data:image/png;base64,AAAA' });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ photo: 'Must be a JPEG data URL' });
  });

  it('accepts a photo of exactly 10 MB', async () => {
    const photo = jpeg(MAX_PHOTO_BYTES - 'data:image/jpeg;base64,'.length);
    const res = await post({ ...validReport, photo });

    expect(res.status).toBe(201);
    expect(res.body.photo).toHaveLength(MAX_PHOTO_BYTES);
  });

  it('rejects a photo over 10 MB with PAYLOAD_TOO_LARGE', async () => {
    const res = await post({ ...validReport, photo: jpeg(MAX_PHOTO_BYTES) });

    expect(res.status).toBe(413);
    expect(res.body.error).toMatchObject({
      code: 'PAYLOAD_TOO_LARGE',
      details: { photo: 'Larger than 10 MB' },
    });
  });

  it('needs a UUID in the X-Reporter-Id header', async () => {
    const missing = await post(validReport, null);
    const invalid = await post(validReport, 'not-a-uuid');

    expect(missing.status).toBe(400);
    expect(missing.body.error.details).toEqual({ 'X-Reporter-Id': 'Required' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details).toEqual({ 'X-Reporter-Id': 'Must be a UUID' });
  });
});
