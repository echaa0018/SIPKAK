export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Distance in metres between two points (haversine formula, same as the backend). */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** "−6.89258, 107.61015": five decimals (about 1 m) and a real minus sign. */
export function formatCoords({ lat, lng }: LatLng): string {
  const format = (n: number) => n.toFixed(5).replace('-', '−');
  return `${format(lat)}, ${format(lng)}`;
}
