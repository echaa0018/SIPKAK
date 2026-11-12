// Calls a RUNNING API and prints ✓ or ✗ for each check.
// Usage: npm run smoke -w backend
//   or, against a deployed backend (PowerShell): $env:API_URL="https://…"; npm run smoke -w backend
// It creates one report and updates it, using fresh random reporter ids each run.

const API_URL = (process.env.API_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'sipkak-admin';

const reporter = crypto.randomUUID();
const otherReporter = crypto.randomUUID();
let passed = 0;
let failed = 0;

async function call(method, path, { body, reporterId, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (reporterId) headers['X-Reporter-Id'] = reporterId;
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function check(name, run) {
  try {
    const problem = await run();
    if (problem) throw new Error(problem);
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    console.log(`✗ ${name}: ${error.message}`);
  }
}

// Returns a message when `actual` is not `expected`, so checks read as one line each.
const expectEqual = (label, actual, expected) =>
  actual === expected ? undefined : `${label} was ${JSON.stringify(actual)}, expected ${expected}`;

console.log(`Smoke test against ${API_URL}\n`);

let created;
let token;

await check('GET /api/health', async () => {
  const res = await call('GET', '/api/health');
  return expectEqual('ok', res.body?.ok, true);
});

await check('GET /api/buildings', async () => {
  const res = await call('GET', '/api/buildings');
  return res.body?.buildings?.length > 0 ? undefined : 'no buildings';
});

await check('GET /api/reports lists reports newest first, without reporterId', async () => {
  const res = await call('GET', '/api/reports');
  const times = res.body.reports.map((r) => Date.parse(r.createdAt));
  if (times.some((t, i) => i > 0 && t > times[i - 1])) return 'not newest first';
  if (JSON.stringify(res.body).includes('reporterId')) return 'reporterId was sent';
});

await check('GET /api/reports?status=done returns only done reports', async () => {
  const res = await call('GET', '/api/reports?status=done');
  return res.body.reports.every((r) => r.status === 'done') ? undefined : 'wrong status';
});

await check('POST /api/reports creates a report', async () => {
  const res = await call('POST', '/api/reports', {
    reporterId: reporter,
    body: {
      description: 'Smoke test: broken window',
      category: 'other',
      building: 'Aula Barat',
      lat: -6.89258,
      lng: 107.61015,
      photo: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==',
    },
  });
  created = res.body;
  return expectEqual('status', res.status, 201) ?? expectEqual('isMine', created?.isMine, true);
});

await check('POST /api/reports rejects an empty description', async () => {
  const res = await call('POST', '/api/reports', {
    reporterId: reporter,
    body: { description: '', building: 'Aula Barat', lat: -6.89258, lng: 107.61015 },
  });
  return expectEqual('status', res.status, 400);
});

await check('GET /api/reports/:id returns the new report', async () => {
  const res = await call('GET', `/api/reports/${created.id}`);
  return expectEqual('description', res.body?.description, 'Smoke test: broken window');
});

await check('GET /api/reports/:id returns 404 for an unknown id', async () => {
  const res = await call('GET', '/api/reports/999999');
  return expectEqual('status', res.status, 404);
});

await check('GET /api/reports?mine=true includes the new report', async () => {
  const res = await call('GET', '/api/reports?mine=true', { reporterId: reporter });
  return res.body.reports.some((r) => r.id === created.id) ? undefined : 'not in mine';
});

await check('GET /api/reports/nearby finds the new report', async () => {
  const res = await call('GET', '/api/reports/nearby?lat=-6.89258&lng=107.61015');
  const found = res.body.reports.find((r) => r.id === created.id);
  return found ? expectEqual('distanceM', found.distanceM, 0) : 'not found nearby';
});

await check('POST /api/reports/:id/confirmations counts a +1 once', async () => {
  const first = await call('POST', `/api/reports/${created.id}/confirmations`, {
    reporterId: otherReporter,
  });
  const second = await call('POST', `/api/reports/${created.id}/confirmations`, {
    reporterId: otherReporter,
  });
  return (
    expectEqual('confirmations', first.body?.confirmations, 1) ??
    expectEqual('second status', second.status, 409)
  );
});

await check('POST /api/admin/login rejects a wrong password', async () => {
  const res = await call('POST', '/api/admin/login', { body: { password: 'wrong-password' } });
  return expectEqual('status', res.status, 401);
});

await check('POST /api/admin/login returns a token', async () => {
  const res = await call('POST', '/api/admin/login', { body: { password: ADMIN_PASSWORD } });
  token = res.body?.token;
  return token ? undefined : `status ${res.status} (is ADMIN_PASSWORD right?)`;
});

await check('PATCH /api/admin/reports/:id needs a token', async () => {
  const res = await call('PATCH', `/api/admin/reports/${created.id}`, {
    body: { status: 'in_progress' },
  });
  return expectEqual('status', res.status, 401);
});

await check('PATCH /api/admin/reports/:id changes the status', async () => {
  const res = await call('PATCH', `/api/admin/reports/${created.id}`, {
    token,
    body: { status: 'in_progress', note: 'Smoke test note' },
  });
  return (
    expectEqual('status', res.body?.status, 'in_progress') ??
    expectEqual('history length', res.body?.history?.length, 2)
  );
});

await check('GET /api/notifications shows the update as unread', async () => {
  const res = await call('GET', '/api/notifications', { reporterId: reporter });
  return (
    expectEqual('unread', res.body?.unread, 1) ??
    expectEqual('kind', res.body?.notifications?.[0]?.kind, 'status')
  );
});

await check('POST /api/notifications/read brings unread to 0', async () => {
  const res = await call('POST', '/api/notifications/read', { reporterId: reporter, body: {} });
  return expectEqual('unread', res.body?.unread, 0);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
