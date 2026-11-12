import { describe, expect, it } from 'vitest';
import { distanceM, formatCoords } from './geo';

describe('distanceM', () => {
  it('puts the simulated position about 26 m from report #0142', () => {
    const here = { lat: -6.89258, lng: 107.61015 };
    const lamp = { lat: -6.892614, lng: 107.609915 };

    expect(Math.round(distanceM(here, lamp))).toBe(26);
  });
});

describe('formatCoords', () => {
  it('shows five decimals with a real minus sign', () => {
    expect(formatCoords({ lat: -6.89258, lng: 107.61015 })).toBe('−6.89258, 107.61015');
    expect(formatCoords({ lat: -6.8925801234, lng: 107.6 })).toBe('−6.89258, 107.60000');
  });
});
