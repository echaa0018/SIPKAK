import { request } from './client';
import type { Report, ReportStatus } from './reports';

/** Returns the admin token. Fails with a 401 for a wrong password. */
export async function adminLogin(password: string) {
  return (await request<{ token: string }>('/admin/login', { method: 'POST', body: { password } }))
    .token;
}

/** Changes the status, the note, or both, and notifies the reporter. */
export function updateReport(
  token: string,
  id: number,
  update: { status?: ReportStatus; note?: string },
) {
  return request<Report>(`/admin/reports/${id}`, { method: 'PATCH', body: update, token });
}
