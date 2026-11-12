import L from 'leaflet';
import { useMemo } from 'react';
import { Circle, Marker, useMapEvents } from 'react-leaflet';
import { clampToCampus, simulatedPosition } from '../lib/campusMap';
import type { LatLng } from '../lib/geo';

// A black map pin in a 32 × 40 box. Its tip (16, 39) is the exact spot.
export const PIN_PATH = 'M16 39C16 39 30 24 30 15A14 14 0 0 0 2 15C2 24 16 39 16 39Z';

const pinIcon = L.divIcon({
  className: '',
  html:
    `<svg width="32" height="40" viewBox="0 0 32 40" aria-hidden="true">` +
    `<path d="${PIN_PATH}" fill="#1c1c1a" stroke="#fff" stroke-width="2"/>` +
    `<circle cx="16" cy="15" r="5" fill="#fff"/></svg>`,
  iconSize: [32, 40],
  iconAnchor: [16, 39],
});

export const accuracyStyle = {
  color: '#62625d',
  weight: 1,
  fillColor: '#62625d',
  fillOpacity: 0.12,
};

interface PinLayerProps {
  pin: LatLng | null;
  onChange: (pin: LatLng) => void;
}

/** Your pin on the desktop map: click the map to place it, drag it to move it. */
export function PinLayer({ pin, onChange }: PinLayerProps) {
  useMapEvents({
    click: (event) => onChange(clampToCampus(event.latlng)),
  });

  const eventHandlers = useMemo(
    () => ({
      dragend: (event: L.DragEndEvent) => {
        onChange(clampToCampus((event.target as L.Marker).getLatLng()));
      },
    }),
    [onChange],
  );

  if (!pin) return null;
  return (
    <>
      <Circle
        center={[pin.lat, pin.lng]}
        radius={simulatedPosition.accuracyM}
        pathOptions={accuracyStyle}
        interactive={false}
      />
      <Marker
        position={[pin.lat, pin.lng]}
        icon={pinIcon}
        draggable
        title="Your pin. Drag it to move it."
        zIndexOffset={2000}
        eventHandlers={eventHandlers}
      />
    </>
  );
}
