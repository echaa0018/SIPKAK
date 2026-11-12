import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';

// SIMULATED: the map is one SVG drawn from OpenStreetMap and placed at its real coordinates.
// The real app would use a tile server.
export const mapImageUrl = '/map/itb-ganesha-map.svg';

/** [[south, west], [north, east]] of the map image. You can't pan outside them. */
export const campusBounds: LatLngBoundsExpression = [
  [-6.894187, 107.607833],
  [-6.886997, 107.613081],
];

export const campusCenter: LatLngTuple = [-6.890592, 107.610457];

const [[south, west], [north, east]] = campusBounds as [LatLngTuple, LatLngTuple];

/** Whether a point is inside the map image (the API rejects reports outside it). */
export function isInsideCampus({ lat, lng }: { lat: number; lng: number }) {
  return lat >= south && lat <= north && lng >= west && lng <= east;
}

/** Keeps a point inside the map image, so a pin can't be sent from off campus. */
export function clampToCampus({ lat, lng }: { lat: number; lng: number }) {
  return {
    lat: Math.min(north, Math.max(south, lat)),
    lng: Math.min(east, Math.max(west, lng)),
  };
}

export const minZoom = 16;
export const maxZoom = 19;

export const mapAttribution = '© OpenStreetMap contributors';

// "Use my location" asks the browser for GPS (navigator.geolocation). This fixed spot is only
// for testing away from campus: it is the first choice of the "Simulate being at…" select.
// It is 26 m from report #0142, so the duplicate warning shows up.
export const simulatedPosition = {
  lat: -6.89258,
  lng: 107.61015,
  accuracyM: 12,
  label: 'South of Aula Barat',
};
