import type { Notification } from '../api/notifications';
import type { Report } from '../api/reports';
import { statusLabels } from './status';

/** The report number as shown in the UI: 142 → "#0142". */
export function reportNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`;
}

/** "Aula Barat · Floor 1", "Labtek XI · Ground floor", or just the building. */
export function formatPlace({ building, floor }: Pick<Report, 'building' | 'floor'>): string {
  if (!floor) return building;
  // A number reads best as "Floor 2"; words such as "Ground" read best as "Ground floor".
  const floorText = /^\d+$/.test(floor)
    ? `Floor ${floor}`
    : /floor/i.test(floor)
      ? floor
      : `${floor} floor`;
  return `${building} · ${floorText}`;
}

/** "Your report is now In progress", "Your report is Done", or "Admin added a note…". */
export function notificationTitle({ kind, status }: Pick<Notification, 'kind' | 'status'>): string {
  if (kind === 'note' || !status) return 'Admin added a note to your report';
  if (status === 'done') return 'Your report is Done';
  return `Your report is now ${statusLabels[status].long}`;
}

/** "3 others confirmed this", "1 other confirmed this", or nothing yet. */
export function confirmationsText(count: number): string {
  if (count === 0) return 'No one else has confirmed this yet';
  return `${count} ${count === 1 ? 'other' : 'others'} confirmed this`;
}
