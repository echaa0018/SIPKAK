import 'leaflet/dist/leaflet.css';

import { useEffect, useState } from 'react';
import { ImageOverlay, MapContainer, useMap, useMapEvents } from 'react-leaflet';
import type { Report } from '../api/reports';
import {
  campusBounds,
  campusCenter,
  clampToCampus,
  mapAttribution,
  mapImageUrl,
  maxZoom,
  minZoom,
  simulatedPosition,
} from '../lib/campusMap';
import type { LatLng } from '../lib/geo';
import { PIN_PATH } from './PinLayer';
import styles from './PinPicker.module.css';
import { ReportMarker } from './ReportMarker';

const START_ZOOM = 18;

/** Metres per screen pixel at this zoom and latitude (Web Mercator). */
const metresPerPixel = (lat: number, zoom: number) =>
  (156_543.03 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

interface PinPickerProps {
  pin: LatLng | null;
  onChange: (pin: LatLng) => void;
  reports: Report[];
}

/**
 * Keeps the map and the pin in step. The pin is always the map's centre: dragging the map moves
 * it, and a pin set from outside (e.g. "Use my location") moves the map.
 */
function CentreSync({ pin, onChange, onZoom }: PinPickerProps & { onZoom: (z: number) => void }) {
  const map = useMap();
  const lat = pin?.lat;
  const lng = pin?.lng;

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    if (!map.getCenter().equals([lat, lng], 1e-7)) map.setView([lat, lng], map.getZoom());
  }, [map, lat, lng]);

  useMapEvents({
    moveend: () => {
      const centre = map.getCenter();
      if (lat === undefined || lng === undefined || !centre.equals([lat, lng], 1e-7)) {
        onChange(clampToCampus(centre));
      }
    },
    zoomend: () => onZoom(map.getZoom()),
    // A tap moves the map so the tapped spot comes to the centre, under the pin.
    click: (event) => map.panTo(event.latlng),
  });

  return null;
}

/** The phone's small location map: drag the map (or tap it) to put the pin in the right spot. */
export function PinPicker({ pin, onChange, reports }: PinPickerProps) {
  const [zoom, setZoom] = useState(START_ZOOM);
  const accuracyPx =
    (2 * simulatedPosition.accuracyM) / metresPerPixel(pin?.lat ?? campusCenter[0], zoom);

  return (
    <div className={styles.picker}>
      <MapContainer
        className={styles.map}
        center={pin ? [pin.lat, pin.lng] : campusCenter}
        zoom={START_ZOOM}
        minZoom={minZoom}
        maxZoom={maxZoom}
        maxBounds={campusBounds}
        maxBoundsViscosity={1}
        zoomControl={false}
        attributionControl={false}
      >
        <ImageOverlay url={mapImageUrl} bounds={campusBounds} />
        {reports.map((report) => (
          <ReportMarker key={report.id} report={report} selected={false} interactive={false} />
        ))}
        <CentreSync pin={pin} onChange={onChange} onZoom={setZoom} reports={reports} />
      </MapContainer>

      {/* Drawn over the map's centre, so they stay put while the map moves underneath. */}
      <span
        className={styles.accuracy}
        style={{ width: accuracyPx, height: accuracyPx }}
        aria-hidden="true"
      />
      <svg className={styles.pin} viewBox="0 0 32 40" aria-hidden="true">
        <path d={PIN_PATH} fill="#1c1c1a" stroke="#fff" strokeWidth="2" />
        <circle cx="16" cy="15" r="5" fill="#fff" />
      </svg>
      <p className={styles.credit}>{mapAttribution}</p>
    </div>
  );
}
