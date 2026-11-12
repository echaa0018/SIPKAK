import { useSyncExternalStore } from 'react';

// Below 900 px wide the app uses the phone layout; from 900 px it uses the desktop layout.
const desktopQuery = '(min-width: 900px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia?.(desktopQuery);
  media?.addEventListener('change', onChange);
  return () => media?.removeEventListener('change', onChange);
}

const isDesktopNow = () => window.matchMedia?.(desktopQuery).matches ?? false;

/** True when the window is at least 900 px wide. Updates when the window is resized. */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, isDesktopNow);
}
