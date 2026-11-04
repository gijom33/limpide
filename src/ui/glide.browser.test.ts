import { afterEach, describe, expect, it } from 'vitest';
import { glideTo } from './glide';

/** Lets `n` frames go by, each held `ms` long, as a slow device draws them. */
const slowFrames = (n: number, ms: number) =>
  new Promise<void>((done) => {
    const next = () => {
      const end = performance.now() + ms;
      while (performance.now() < end);
      if (n-- > 0) requestAnimationFrame(next);
      else done();
    };
    requestAnimationFrame(next);
  });

describe('glideTo: the Demo’s slow scroll', () => {
  let page: HTMLElement | undefined;
  afterEach(() => {
    page?.remove();
    scrollTo({ top: 0, behavior: 'instant' });
  });

  // Bead's motion goes at most LONGEST_STEP a frame, so on a device drawing fewer than 20 frames a second a scroll on the
  // clock would stop before Bead's flight across it lands (GitHub's Linux WebKit draws about 15 a second).
  it('on frames slower than Bead’s longest step, slows as Bead does, so it is still under way after its time (issue 224)', async () => {
    page = document.body.appendChild(document.createElement('div'));
    page.style.height = '5000px';
    scrollTo({ top: 0, behavior: 'instant' });
    let ended = false;
    const stop = glideTo(2000, 600, () => (ended = true));
    await slowFrames(8, 100); // 0.8 s of the clock, but 8 steps of at most 0.05 s: 0.4 s of its 0.6 s
    expect(ended).toBe(false);
    expect(scrollY).toBeGreaterThan(0);
    expect(scrollY).toBeLessThan(2000);
    await slowFrames(6, 100);
    expect(ended).toBe(true);
    expect(scrollY).toBe(2000);
    stop();
  });
});
