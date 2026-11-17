import { ApiError, request } from './client';
import type { Report, ReportStatus } from './reports';

/** Returns an expiring admin session token after verifying both credentials. */
export async function adminLogin(username: string, password: string) {
  return (await request<{ token: string }>('/admin/login', { method: 'POST', body: { username, password } }))
    .token;
}

export async function listAdminReports(token: string) {
  let result: { reports: Report[] };
  try {
    result = await request<{ reports: Report[] }>('/admin/reports', { token });
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 404) {
      throw new ApiError(404, 'WRONG_BACKEND',
        'Admin reports endpoint is missing. Check that this SIPKAK backend is running on port 3011.');
    }
    throw cause;
  }
  if (!result || !Array.isArray(result.reports)) {
    throw new ApiError(0, 'INVALID_RESPONSE',
      'The backend returned an unexpected report list. Check the server version and port.');
  }
  return result.reports;
}

export function reviewReport(token: string, id: number,
  review: { decision: 'approved' } | { decision: 'rejected'; reason: string }) {
  return request<Report>(`/admin/reports/${id}/review`, { method: 'PATCH', body: review, token });
}

/** Changes the status, the note, or both, and notifies the reporter. */
export function updateReport(
  token: string,
  id: number,
  update: { status?: ReportStatus; note?: string },
) {
  return request<Report>(`/admin/reports/${id}`, { method: 'PATCH', body: update, token });
}
