import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import type { Report } from '../api/reports';
import { statusLabels } from '../lib/status';
import styles from './ReportMarker.module.css';

const checkSvg =
  '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
  'stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

interface ReportMarkerProps {
  report: Report;
  selected: boolean;
  onSelect?: (id: number) => void;
  /** False while you place your own pin: clicks then go to the map, not the marker. */
  interactive?: boolean;
  /** Shows the description in a dark label above the marker (the admin map's selected pin). */
  labelled?: boolean;
}

/** One report on the map, drawn with CSS in its status style. */
export function ReportMarker({
  report,
  selected,
  onSelect,
  interactive = true,
  labelled = false,
}: ReportMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const label = `${report.description}, ${statusLabels[report.status].long}`;

  // A divIcon (HTML + CSS) instead of Leaflet's default PNG pin. The 44 px box is the tap target;
  // the visible dot inside it is smaller.
  const icon = useMemo(
    () =>
      L.divIcon({
        className: `${styles.hitArea} ${selected ? styles.selected : ''}`,
        html: `<span class="${styles.marker} ${styles[report.status]}">${
          report.status === 'done' ? checkSvg : ''
        }</span>`,
        iconSize: [44, 44],
      }),
    [report.status, selected],
  );

  // Leaflet makes the marker a focusable role="button"; give it a name screen readers can read.
  useEffect(() => {
    markerRef.current?.getElement()?.setAttribute('aria-label', label);
  }, [label, icon]);

  // Leaflet also turns Enter on a focused marker into a click.
  const eventHandlers = useMemo(
    () => ({ click: () => onSelect?.(report.id) }),
    [onSelect, report.id],
  );

  return (
    <Marker
      ref={markerRef}
      position={[report.lat, report.lng]}
      icon={icon}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={eventHandlers}
      interactive={interactive}
      keyboard={interactive}
    >
      {labelled && (
        <Tooltip permanent direction="top" offset={[0, -14]} className={styles.label}>
          {report.description}
        </Tooltip>
      )}
    </Marker>
  );
}
