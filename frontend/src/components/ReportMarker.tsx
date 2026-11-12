import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { Marker } from 'react-leaflet';
import type { Report } from '../api/reports';
import { statusLabels } from '../lib/status';
import styles from './ReportMarker.module.css';

const checkSvg =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
  'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

/** One report on the map, drawn with CSS in its status style. */
export function ReportMarker({ report }: { report: Report }) {
  const markerRef = useRef<L.Marker>(null);
  const label = `${report.description}, ${statusLabels[report.status].long}`;

  // A divIcon (HTML + CSS) instead of Leaflet's default PNG pin. The 44 px box is the tap target;
  // the visible dot inside it is smaller.
  const icon = useMemo(
    () =>
      L.divIcon({
        className: styles.hitArea,
        html: `<span class="${styles.marker} ${styles[report.status]}">${
          report.status === 'done' ? checkSvg : ''
        }</span>`,
        iconSize: [44, 44],
      }),
    [report.status],
  );

  // Leaflet makes the marker a focusable role="button"; give it a name screen readers can read.
  useEffect(() => {
    markerRef.current?.getElement()?.setAttribute('aria-label', label);
  }, [label, icon]);

  return <Marker ref={markerRef} position={[report.lat, report.lng]} icon={icon} />;
}
