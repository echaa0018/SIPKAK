const STORAGE_KEY = 'sipkak.reporterId';

// Used only when localStorage is blocked (e.g. some private windows): lasts until the tab closes.
let fallbackId: string | undefined;

// A version 4 UUID. crypto.randomUUID() would be shorter, but browsers only offer it on
// HTTPS or localhost, and testers open the dev server on their phone over plain http.
function newUuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Who "you" are, without an account: a random UUID kept in this browser's localStorage.
 * The API gets it in the X-Reporter-Id header.
 */
export function getReporterId(): string {
  // SIMULATED: a fixed demo ID, so the seed reports show up under "My reports" and Notifications.
  // The real app would use the random ID only (or a real sign-in).
  const demoId: string | undefined = import.meta.env.VITE_DEMO_REPORTER_ID;
  if (demoId) return demoId;

  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = newUuid();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    fallbackId ??= newUuid();
    return fallbackId;
  }
}
