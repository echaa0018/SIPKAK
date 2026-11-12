import type { Report } from '../api/reports';

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

/** "3 others confirmed this", "1 other confirmed this", or nothing yet. */
export function confirmationsText(count: number): string {
  if (count === 0) return 'No one else has confirmed this yet';
  return `${count} ${count === 1 ? 'other' : 'others'} confirmed this`;
}
