// ITB is in Bandung, so every date is shown in Western Indonesia Time (UTC+7).
const wibFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Jakarta',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Formats an ISO time as "dd/MM/yyyy · HH:mm WIB", e.g. "11/11/2026 · 09:12 WIB". */
export function formatWib(iso: string): string {
  const parts = Object.fromEntries(
    wibFormat.formatToParts(new Date(iso)).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} · ${parts.hour}:${parts.minute} WIB`;
}
