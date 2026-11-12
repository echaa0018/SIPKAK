import 'leaflet/dist/leaflet.css';

import { useEffect } from 'react';
import { ImageOverlay, MapContainer, useMap } from 'react-leaflet';
import type { Report } from '../api/reports';
import {
  campusBounds,
  campusCenter,
  mapAttribution,
  mapImageUrl,
  maxZoom,
  minZoom,
} from '../lib/campusMap';
import type { LatLng } from '../lib/geo';
import { statuses, statusLabels } from '../lib/status';
import styles from './MapView.module.css';
import { PinLayer } from './PinLayer';
import { ReportMarker } from './ReportMarker';
import { StatusDot } from './StatusDot';

interface MapViewProps {
  reports: Report[];
  /** Phone: legend at the top and no zoom buttons (pinch instead). Desktop: legend at the bottom. */
  variant: 'phone' | 'desktop';
  selectedId?: number;
  onSelect?: (id: number) => void;
  /**
   * Set while reporting damage on desktop: you place your pin by clicking the map, and the
   * report markers stop reacting to clicks.
   */
  pinPicking?: { pin: LatLng | null; onChange: (pin: LatLng) => void };
}

/**
 * Pans the map when the selected report is hidden, e.g. picked in the list or under the phone's
 * report sheet. `bottomPadding` is the height (px) covered at the bottom of the map.
 */
function KeepInView({ report, bottomPadding }: { report?: Report; bottomPadding: number }) {
  const map = useMap();
  const lat = report?.lat;
  const lng = report?.lng;

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.panInside([lat, lng], {
      paddingTopLeft: [40, 40],
      paddingBottomRight: [40, bottomPadding],
    });
  }, [map, lat, lng, bottomPadding]);

  return null;
}

/** The campus map with one marker per report. */
export function MapView({ reports, variant, selectedId, onSelect, pinPicking }: MapViewProps) {
  const isPhone = variant === 'phone';
  const markersReact = !pinPicking;

  return (
    <div className={`${styles.wrapper} ${isPhone ? styles.phone : styles.desktop}`}>
      <MapContainer
        className={styles.map}
        center={campusCenter}
        // Chosen so the campus fills the phone screen and the desktop map pane.
        zoom={isPhone ? 17 : 17.5}
        zoomSnap={0.5}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={campusBounds}
        maxBoundsViscosity={1}
        zoomControl={!isPhone}
        // The credit is drawn below, next to the legend, so it is always visible.
        attributionControl={false}
      >
        <ImageOverlay url={mapImageUrl} bounds={campusBounds} />
        {reports.map((report) => (
          <ReportMarker
            // Leaflet only reads `interactive` when a marker is created, so re-create it.
            key={`${report.id}-${markersReact}`}
            report={report}
            selected={report.id === selectedId}
            onSelect={markersReact ? onSelect : undefined}
            interactive={markersReact}
          />
        ))}
        {pinPicking ? (
          <PinLayer pin={pinPicking.pin} onChange={pinPicking.onChange} />
        ) : (
          <KeepInView
            report={reports.find((r) => r.id === selectedId)}
            bottomPadding={isPhone ? 330 : 60}
          />
        )}
      </MapContainer>

      {pinPicking && <p className={styles.hint}>Click the map to place your pin</p>}

      <div className={styles.overlay}>
        <ul className={styles.legend} aria-label="Legend">
          {statuses.map((status) => (
            <li key={status}>
              <StatusDot status={status} />
              {isPhone ? statusLabels[status].short : statusLabels[status].long}
            </li>
          ))}
        </ul>
        <p className={styles.credit}>{mapAttribution}</p>
      </div>
    </div>
  );
}
