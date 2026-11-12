import { describe, expect, it } from 'vitest';
import { distanceM } from '../src/lib/geo.js';

describe('distanceM', () => {
  it('is 0 for the same point', () => {
    expect(distanceM({ lat: -6.89, lng: 107.61 }, { lat: -6.89, lng: 107.61 })).toBe(0);
  });

  it('is about 111 km for one degree of latitude', () => {
    expect(distanceM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111_195, -1);
  });

  it('puts the simulated position about 26 m from report #0142', () => {
    const here = { lat: -6.89258, lng: 107.61015 };
    const lamp = { lat: -6.892614, lng: 107.609915 };

    expect(Math.round(distanceM(here, lamp))).toBe(26);
  });
});
