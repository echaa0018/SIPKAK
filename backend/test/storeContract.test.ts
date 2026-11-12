import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createMemoryStore } from '../src/store/memoryStore.js';
import type { Store, StoredReport } from '../src/store/store.js';
import { createSupabaseStore } from '../src/store/supabaseStore.js';

// The same checks run against every store, so both behave the same way.
// The memory store always runs. The Supabase store runs only when SUPABASE_URL and
// SUPABASE_SECRET_KEY are set (npm run test:supabase -w backend reads them from backend/.env);
// it needs schema.sql and seed.sql to have been run, and it deletes what it creates.

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;

// Every run uses new reporter ids, so it never touches anyone else's data.
const owner = `contract-${randomUUID()}`;
const otherReporter = `contract-${randomUUID()}`;

const stores: { name: string; skip: boolean; create: () => Store; cleanUp: () => Promise<void> }[] =
  [
    { name: 'memory', skip: false, create: createMemoryStore, cleanUp: async () => {} },
    {
      name: 'supabase',
      skip: !SUPABASE_URL || !SUPABASE_SECRET_KEY,
      create: () => createSupabaseStore(SUPABASE_URL!, SUPABASE_SECRET_KEY!),
      // Deleting the test reports also deletes their history, +1s and notifications (cascade).
      cleanUp: async () => {
        const db = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!);
        await db.from('reports').delete().eq('reporter_id', owner);
      },
    },
  ];

const sameTime = (a: string, b: string) => expect(Date.parse(a)).toBe(Date.parse(b));

function newReport(overrides: Partial<StoredReport> = {}): Omit<StoredReport, 'id'> {
  const now = new Date().toISOString();
  return {
    description: 'Contract test: broken window',
    building: 'Aula Barat',
    floor: '1',
    lat: -6.89258,
    lng: 107.61015,
    accuracyM: 12,
    photo: null,
    status: 'waiting',
    note: null,
    confirmations: 0,
    reporterId: owner,
    createdAt: now,
    updatedAt: now,
    history: [{ status: 'waiting', at: now }],
    ...overrides,
  };
}

for (const { name, skip, create, cleanUp } of stores) {
  describe.skipIf(skip)(`${name} store`, () => {
    // Created here, not above: a skipped describe still runs its body.
    let store: Store;
    beforeAll(() => {
      store = create();
    });
    afterAll(cleanUp);

    it('says which store it is', () => {
      expect(store.kind).toBe(name);
    });

    it('has the seed reports, newest first', async () => {
      const reports = await store.listReports();
      const lamp = reports.find((r) => r.id === 142);

      expect(lamp).toMatchObject({ description: 'Lamp by the east stairs is out', floor: '1' });
      expect(lamp!.history.map((h) => h.status)).toEqual(['waiting', 'in_progress']);
      const times = reports.map((r) => Date.parse(r.createdAt));
      expect(times).toEqual([...times].sort((a, b) => b - a));
    });

    it('returns undefined for an unknown id', async () => {
      expect(await store.getReport(999_999_999)).toBeUndefined();
    });

    it('creates a report with a new id and reads it back the same', async () => {
      const input = newReport();
      const created = await store.createReport(input);

      expect(created.id).toBeGreaterThan(145);
      const read = (await store.getReport(created.id))!;
      expect(read).toMatchObject({
        id: created.id,
        description: input.description,
        building: input.building,
        floor: '1',
        lat: input.lat,
        lng: input.lng,
        status: 'waiting',
        reporterId: owner,
      });
      sameTime(read.createdAt, input.createdAt);
      expect(read.history).toHaveLength(1);
      sameTime(read.history[0].at, input.createdAt);
    });

    it('filters by reporter and by status', async () => {
      const created = await store.createReport(newReport({ description: 'Contract test: filter' }));

      const mine = await store.listReports({ reporterId: owner });
      expect(mine.map((r) => r.id)).toContain(created.id);
      expect(mine.every((r) => r.reporterId === owner)).toBe(true);

      const done = await store.listReports({ status: 'done' });
      expect(done.every((r) => r.status === 'done')).toBe(true);
      expect(done.map((r) => r.id)).not.toContain(created.id);
    });

    it('counts a +1 once per reporter', async () => {
      const created = await store.createReport(newReport({ description: 'Contract test: +1' }));

      expect(await store.addConfirmation(created.id, otherReporter)).toBe(1);
      expect(await store.addConfirmation(created.id, otherReporter)).toBeUndefined();
      expect((await store.getReport(created.id))!.confirmations).toBe(1);
    });

    it('updates the status (adding history) and the note', async () => {
      const created = await store.createReport(newReport({ description: 'Contract test: update' }));
      const at = new Date(Date.now() + 1000).toISOString();

      const updated = (await store.updateReport(created.id, { status: 'in_progress', at }))!;
      expect(updated.status).toBe('in_progress');
      expect(updated.history.map((h) => h.status)).toEqual(['waiting', 'in_progress']);
      sameTime(updated.updatedAt, at);

      const noted = (await store.updateReport(created.id, { note: 'Crew booked.', at }))!;
      expect(noted).toMatchObject({ status: 'in_progress', note: 'Crew booked.' });
      expect(noted.history).toHaveLength(2);

      expect(await store.updateReport(999_999_999, { note: 'x', at })).toBeUndefined();
    });

    it('stores notifications per reporter, newest first, and marks them read', async () => {
      const report = await store.createReport(newReport({ description: 'Contract test: notify' }));
      const first = await store.createNotification({
        reporterId: owner,
        reportId: report.id,
        kind: 'status',
        status: 'in_progress',
        note: null,
        createdAt: new Date(Date.now() - 1000).toISOString(),
      });
      const second = await store.createNotification({
        reporterId: owner,
        reportId: report.id,
        kind: 'note',
        status: null,
        note: 'Crew booked.',
        createdAt: new Date().toISOString(),
      });
      expect(first.read).toBe(false);

      const list = await store.listNotifications(owner);
      expect(list.map((n) => n.id)).toEqual([second.id, first.id]);
      expect(await store.listNotifications(otherReporter)).toEqual([]);

      await store.markNotificationsRead(owner, [first.id]);
      expect((await store.listNotifications(owner)).map((n) => n.read)).toEqual([false, true]);

      await store.markNotificationsRead(owner);
      expect((await store.listNotifications(owner)).every((n) => n.read)).toBe(true);
    });
  });
}
