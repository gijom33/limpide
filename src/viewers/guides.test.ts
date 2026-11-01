import { describe, expect, it } from 'vitest';
import { createGuideGlide } from './guides';

describe('the Guides’ glide (issue 159)', () => {
  it('starts where the Mixer is, then moves smoothly to a new level, a little each frame, arriving in a fifth of a second', () => {
    const glide = createGuideGlide();
    expect(glide(0.5, 0, false)).toBe(0.5);
    const frames = [16, 33, 50, 66].map((t) => glide(1, t, false));
    for (const [i, level] of frames.entries()) {
      expect(level).toBeGreaterThan(i === 0 ? 0.5 : frames[i - 1]);
      expect(level).toBeLessThan(1);
    }
    expect(glide(1, 250, false)).toBe(1);
    expect(glide(1, 266, false)).toBe(1); // and stays
  });

  it('jumps when reduced motion is asked for', () => {
    const glide = createGuideGlide();
    glide(0.5, 0, true);
    expect(glide(1, 16, true)).toBe(1);
    expect(glide(0.25, 33, true)).toBe(0.25);
  });

  it('turns back from wherever it has reached when the level changes on the way', () => {
    const glide = createGuideGlide();
    glide(0.5, 0, false);
    const reached = glide(1, 30, false);
    const back = glide(0.5, 46, false);
    expect(back).toBeLessThan(reached);
    expect(back).toBeGreaterThan(0.5);
  });
});
