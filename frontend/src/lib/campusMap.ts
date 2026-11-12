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

export const minZoom = 16;
export const maxZoom = 19;

export const mapAttribution = '© OpenStreetMap contributors';
