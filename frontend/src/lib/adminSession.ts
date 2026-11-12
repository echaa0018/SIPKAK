const STORAGE_KEY = 'sipkak.adminToken';

// SIMULATED: the admin token is the backend's fixed ADMIN_TOKEN, kept in sessionStorage so it
// survives a refresh but not closing the tab. The real app would use a proper sign-in
// (e.g. Supabase Auth) with short-lived tokens.

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage blocked: you stay signed in until you leave the page.
  }
}

export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
