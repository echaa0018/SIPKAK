// Remembers which reports you gave a "+1" in this browser, so the button stays disabled after a
// reload. The API also refuses a second +1 (409), so this only saves a pointless click.
const STORAGE_KEY = 'sipkak.confirmed';

function load(): number[] {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.filter((id) => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function hasConfirmed(reportId: number): boolean {
  return load().includes(reportId);
}

export function rememberConfirmed(reportId: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set([...load(), reportId])]));
  } catch {
    // Storage blocked: the button is still disabled until the page reloads.
  }
}
