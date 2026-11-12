import { describe, expect, it } from 'vitest';
import { formatWib } from './formatWib';

describe('formatWib', () => {
  it('shows UTC times in WIB (UTC+7)', () => {
    expect(formatWib('2026-11-11T02:12:00Z')).toBe('11/11/2026 · 09:12 WIB');
  });

  it('moves to the next day after 17:00 UTC', () => {
    expect(formatWib('2026-10-31T17:30:00Z')).toBe('01/11/2026 · 00:30 WIB');
  });

  it('pads single-digit days, months, hours and minutes', () => {
    expect(formatWib('2026-01-04T23:05:00Z')).toBe('05/01/2026 · 06:05 WIB');
  });

  it('uses 24-hour time', () => {
    expect(formatWib('2026-11-10T08:26:00Z')).toBe('10/11/2026 · 15:26 WIB');
  });

  it('accepts times with milliseconds, as new reports have', () => {
    expect(formatWib('2026-11-11T04:32:10.123Z')).toBe('11/11/2026 · 11:32 WIB');
  });
});
