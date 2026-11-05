import { describe, expect, it } from 'vitest';
import { createRest, createSilence } from './rest';

describe('a Viewer at rest (issue 214)', () => {
  it('draws a still picture once, then skips the frames that would draw it again', () => {
    const rest = createRest();
    expect(rest(true, [300, 'dark'])).toBe(false);
    expect(rest(true, [300, 'dark'])).toBe(true);
    expect(rest(true, [300, 'dark'])).toBe(true);
  });

  it('draws again on the first frame any of its inputs changes, a curve’s values included', () => {
    const rest = createRest();
    rest(true, [300, 'dark', Float32Array.of(1, 0.5)]);
    expect(rest(true, [300, 'dark', Float32Array.of(1, 0.5)])).toBe(true);
    expect(rest(true, [300, 'light', Float32Array.of(1, 0.5)])).toBe(false); // the theme
    expect(rest(true, [300, 'light', Float32Array.of(1, 0.5)])).toBe(true);
    expect(rest(true, [320, 'light', Float32Array.of(1, 0.5)])).toBe(false); // a resize
    expect(rest(true, [320, 'light', Float32Array.of(1, 0.25)])).toBe(false); // the Response Curve
    expect(rest(true, [320, 'light', Float32Array.of(1, 0.25)])).toBe(true);
  });

  it('draws every frame while its picture moves, and once more when it comes to rest', () => {
    const rest = createRest();
    rest(true, [300]);
    expect(rest(false, [300])).toBe(false);
    expect(rest(false, [300])).toBe(false);
    expect(rest(true, [300])).toBe(false); // the first still frame is drawn, the moving one before it differed
    expect(rest(true, [300])).toBe(true);
  });
});

describe('how long a Viewer has been silent (issue 214)', () => {
  it('counts from its first silent frame, and starts again after any sound', () => {
    const silence = createSilence();
    expect(silence(false, 100)).toBe(0);
    expect(silence(true, 116)).toBe(0);
    expect(silence(true, 200)).toBe(84);
    expect(silence(true, 400)).toBe(284);
    expect(silence(false, 416)).toBe(0); // a Note
    expect(silence(true, 432)).toBe(0);
    expect(silence(true, 500)).toBe(68);
  });
});
