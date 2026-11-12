import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/createApp.js';
import { demoReporterId } from '../src/data/seed.js';

const token = 'test-token';
const newReporter = '44444444-4444-4444-8444-444444444444';

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  vi.stubEnv('ADMIN_TOKEN', token);
  app = createApp();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const getNotifications = (reporterId: string) =>
  request(app).get('/api/notifications').set('X-Reporter-Id', reporterId);

const markRead = (reporterId: string, body?: object) => {
  const req = request(app).post('/api/notifications/read').set('X-Reporter-Id', reporterId);
  return body ? req.send(body) : req;
};

const adminPatch = (id: number, body: object) =>
  request(app).patch(`/api/admin/reports/${id}`).set('Authorization', `Bearer ${token}`).send(body);

describe('GET /api/notifications', () => {
  it("lists the demo reporter's 4 seed notifications, newest first, with 2 unread", async () => {
    const res = await getNotifications(demoReporterId);

    expect(res.status).toBe(200);
    expect(res.body.unread).toBe(2);
    expect(res.body.notifications.map((n: { id: number }) => n.id)).toEqual([4, 3, 2, 1]);
    expect(res.body.notifications[0]).toEqual({
      id: 4,
      reportId: 142,
      reportDescription: 'Lamp by the east stairs is out',
      kind: 'status',
      status: 'in_progress',
      note: 'Technician scheduled for 12/11/2026.',
      read: false,
      createdAt: '2026-11-11T04:20:00Z',
    });
    expect(JSON.stringify(res.body)).not.toContain('reporterId');
  });

  it('is empty for a reporter with no notifications', async () => {
    const res = await getNotifications(newReporter);

    expect(res.body).toEqual({ notifications: [], unread: 0 });
  });

  it('needs the X-Reporter-Id header', async () => {
    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual({ 'X-Reporter-Id': 'Required' });
  });
});

describe('POST /api/notifications/read', () => {
  it('marks the given ids as read', async () => {
    const res = await markRead(demoReporterId, { ids: [4] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ unread: 1 });
  });

  it('marks everything as read without ids, even with no body', async () => {
    expect((await markRead(demoReporterId)).body).toEqual({ unread: 0 });
    expect((await getNotifications(demoReporterId)).body.unread).toBe(0);
  });

  it("cannot touch another reporter's notifications", async () => {
    await markRead(newReporter, { ids: [3, 4] });

    expect((await getNotifications(demoReporterId)).body.unread).toBe(2);
  });

  it('rejects ids that are not numbers', async () => {
    const res = await markRead(demoReporterId, { ids: ['4'] });

    expect(res.status).toBe(400);
  });
});

describe('notifications from admin updates', () => {
  it('sends a "status" notification, with the note, when the status changes', async () => {
    await adminPatch(142, { status: 'done', note: 'Lamp replaced.' });
    const res = await getNotifications(demoReporterId);

    expect(res.body.unread).toBe(3);
    expect(res.body.notifications[0]).toMatchObject({
      id: 5,
      reportId: 142,
      reportDescription: 'Lamp by the east stairs is out',
      kind: 'status',
      status: 'done',
      note: 'Lamp replaced.',
      read: false,
    });
  });

  it('sends a "status" notification with no note when only the status changes', async () => {
    await adminPatch(98, { status: 'in_progress' });
    const first = (await getNotifications(demoReporterId)).body.notifications[0];

    expect(first).toMatchObject({
      reportId: 98,
      kind: 'status',
      status: 'in_progress',
      note: null,
    });
  });

  it('sends a "note" notification when only the note changes', async () => {
    await adminPatch(142, { note: 'Technician is on the way.' });
    const first = (await getNotifications(demoReporterId)).body.notifications[0];

    expect(first).toMatchObject({
      reportId: 142,
      kind: 'note',
      status: null,
      note: 'Technician is on the way.',
    });
  });

  it('notifies the owner of a newly sent report, and no one else', async () => {
    const created = await request(app).post('/api/reports').set('X-Reporter-Id', newReporter).send({
      description: 'Broken window in the stairwell',
      category: 'other',
      building: 'Aula Barat',
      lat: -6.89258,
      lng: 107.61015,
      photo: 'data:image/jpeg;base64,AAAA',
    });
    await adminPatch(created.body.id, { status: 'in_progress' });

    const owner = await getNotifications(newReporter);
    expect(owner.body.unread).toBe(1);
    expect(owner.body.notifications[0]).toMatchObject({
      reportId: 146,
      reportDescription: 'Broken window in the stairwell',
    });
    expect((await getNotifications(demoReporterId)).body.unread).toBe(2);

    expect((await markRead(newReporter)).body).toEqual({ unread: 0 });
  });

  it('sends nothing when the update is rejected', async () => {
    await adminPatch(142, { status: 'in_progress' });

    expect((await getNotifications(demoReporterId)).body.notifications).toHaveLength(4);
  });
});
