-- SIPKAK demo data: the same 8 reports and 4 notifications as the in-memory store.
-- Run it after schema.sql: SQL Editor -> New query -> paste -> Run.
-- WARNING: it first EMPTIES all four tables, so it also resets the demo. Times are UTC.

truncate table notifications, confirmations, report_history, reports restart identity cascade;

insert into reports
  (id, description, category, building, floor, lat, lng, accuracy_m, photo, status, note,
   confirmations, reporter_id, created_at, updated_at)
values
  (145, 'Cracked paving by the main gate', 'paths', 'Main gate (Jl. Ganesha)', null, -6.893057, 107.610385, 12, null, 'waiting', null, 0, 'seed-reporter-145', '2026-11-11T03:47:00Z', '2026-11-11T03:47:00Z'),
  (144, 'Leaking tap in the 2nd-floor toilet', 'toilets', 'Labtek VIII', '2', -6.890579, 107.610955, 12, null, 'waiting', null, 1, 'seed-reporter-144', '2026-11-11T03:03:00Z', '2026-11-11T03:03:00Z'),
  (142, 'Lamp by the east stairs is out', 'lighting', 'Aula Barat', '1', -6.892614, 107.609915, 12, null, 'in_progress', 'Technician scheduled for 12/11/2026.', 3, '00000000-0000-4000-8000-000000000001', '2026-11-11T02:12:00Z', '2026-11-11T04:20:00Z'),
  (139, 'Projector won’t turn on', 'classroom', 'GKU Timur', '2', -6.890389, 107.612086, 12, null, 'waiting', null, 0, 'seed-reporter-139', '2026-11-10T08:26:00Z', '2026-11-10T08:26:00Z'),
  (133, 'Loose handrail on the ramp', 'accessibility', 'Labtek XI', 'Ground', -6.889484, 107.609453, 12, null, 'in_progress', 'Waiting for replacement parts.', 2, 'seed-reporter-133', '2026-11-08T01:51:00Z', '2026-11-09T02:00:00Z'),
  (127, 'Broken chair, third row', 'classroom', 'Labtek V', '2', -6.890588, 107.609788, 12, null, 'done', 'Chair replaced.', 0, '00000000-0000-4000-8000-000000000001', '2026-11-04T06:40:00Z', '2026-11-05T03:30:00Z'),
  (120, 'Flickering lights in the reading room', 'lighting', 'Perpustakaan Pusat', '3', -6.888273, 107.610729, 12, null, 'done', 'Ballast replaced.', 4, 'seed-reporter-120', '2026-11-01T09:02:00Z', '2026-11-03T07:00:00Z'),
  (98, 'Tap leaking in the men’s toilet', 'toilets', 'CC Timur', '1', -6.891239, 107.610765, 12, null, 'waiting', 'Passed to the CC Timur building manager.', 0, '00000000-0000-4000-8000-000000000001', '2026-10-21T03:05:00Z', '2026-11-10T07:05:00Z');

insert into report_history (report_id, status, at)
values
  (145, 'waiting', '2026-11-11T03:47:00Z'),
  (144, 'waiting', '2026-11-11T03:03:00Z'),
  (142, 'waiting', '2026-11-11T02:12:00Z'),
  (142, 'in_progress', '2026-11-11T04:20:00Z'),
  (139, 'waiting', '2026-11-10T08:26:00Z'),
  (133, 'waiting', '2026-11-08T01:51:00Z'),
  (133, 'in_progress', '2026-11-09T02:00:00Z'),
  (127, 'waiting', '2026-11-04T06:40:00Z'),
  (127, 'in_progress', '2026-11-04T08:10:00Z'),
  (127, 'done', '2026-11-05T03:30:00Z'),
  (120, 'waiting', '2026-11-01T09:02:00Z'),
  (120, 'in_progress', '2026-11-02T01:45:00Z'),
  (120, 'done', '2026-11-03T07:00:00Z'),
  (98, 'waiting', '2026-10-21T03:05:00Z');

insert into notifications (id, reporter_id, report_id, kind, status, note, read, created_at)
values
  (4, '00000000-0000-4000-8000-000000000001', 142, 'status', 'in_progress', 'Technician scheduled for 12/11/2026.', false, '2026-11-11T04:20:00Z'),
  (3, '00000000-0000-4000-8000-000000000001', 98, 'note', null, 'Passed to the CC Timur building manager.', false, '2026-11-10T07:05:00Z'),
  (2, '00000000-0000-4000-8000-000000000001', 127, 'status', 'done', 'Chair replaced.', true, '2026-11-05T03:30:00Z'),
  (1, '00000000-0000-4000-8000-000000000001', 127, 'status', 'in_progress', null, true, '2026-11-04T08:10:00Z');

-- The next new report gets id 146, and the next notification id 5.
select setval(pg_get_serial_sequence('reports', 'id'), 145);
select setval(pg_get_serial_sequence('notifications', 'id'), 4);
