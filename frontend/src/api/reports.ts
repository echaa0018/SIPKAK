import type { ReportCategory } from '../lib/categories';
import { request } from './client';

export type ReportStatus = 'waiting' | 'in_progress' | 'done';

export interface Report {
  id: number;
  description: string;
  category: ReportCategory;
  building: string;
  floor: string | null;
  lat: number;
  lng: number;
  accuracyM: number;
  /** A JPEG data URL, or null (only old demo reports have none). */
  photo: string | null;
  status: ReportStatus;
  /** The latest note from facilities. */
  note: string | null;
  confirmations: number;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
  history: { status: ReportStatus; at: string }[];
}

export interface NearbyReport extends Report {
  distanceM: number;
}

export interface Building {
  name: string;
  /** Building centre; null for places with no fixed point. */
  lat: number | null;
  lng: number | null;
}

export interface NewReport {
  description: string;
  category: ReportCategory;
  building: string;
  floor?: string | null;
  lat: number;
  lng: number;
  accuracyM?: number;
  /** Required: a JPEG data URL from resizeImage(). */
  photo: string;
}

export async function listReports(filter: { status?: ReportStatus; mine?: boolean } = {}) {
  const query = new URLSearchParams();
  if (filter.status) query.set('status', filter.status);
  if (filter.mine) query.set('mine', 'true');
  const search = query.toString();
  return (await request<{ reports: Report[] }>(search ? `/reports?${search}` : '/reports')).reports;
}

export function getReport(id: number) {
  return request<Report>(`/reports/${id}`);
}

/** Open reports within `radius` metres (at most 100), nearest first. */
export async function listNearbyReports(lat: number, lng: number, radius = 30) {
  const query = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
  return (await request<{ reports: NearbyReport[] }>(`/reports/nearby?${query}`)).reports;
}

export function createReport(report: NewReport) {
  return request<Report>('/reports', { method: 'POST', body: report });
}

/** "Same problem (+1)". Fails with a 409 if you already confirmed it or sent it yourself. */
export function confirmReport(id: number) {
  return request<{ confirmations: number }>(`/reports/${id}/confirmations`, { method: 'POST' });
}

export async function listBuildings() {
  return (await request<{ buildings: Building[] }>('/buildings')).buildings;
}
