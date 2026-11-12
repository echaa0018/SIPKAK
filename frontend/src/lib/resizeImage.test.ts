import { describe, expect, it } from 'vitest';
import { fitWithin } from './resizeImage';

// The canvas part needs a real browser; this checks the size maths.
describe('fitWithin', () => {
  it('shrinks a landscape photo to 800 px wide', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 800, height: 600 });
  });

  it('shrinks a portrait photo to 800 px tall', () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 600, height: 800 });
  });

  it('leaves a small photo alone', () => {
    expect(fitWithin(640, 480)).toEqual({ width: 640, height: 480 });
  });
});
