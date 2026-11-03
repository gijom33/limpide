import { describe, expect, it } from 'vitest';
import { mascotClock } from './mascotClock';

/** An audio clock and the page's, both set by hand, in seconds. */
function clocks() {
  const at = { audio: 10, wall: 100 };
  const clock = mascotClock(
    () => at.audio,
    () => at.wall,
  );
  /** Both move on by `seconds`, in frames of 1/60 s; the audio clock only while `running`. */
  const pass = (seconds: number, running: boolean) => {
    for (let frame = 0; frame < Math.round(seconds * 60); frame++) {
      at.wall += 1 / 60;
      if (running) at.audio += 1 / 60;
      clock();
    }
  };
  return { at, clock, pass };
}

describe('mascotClock', () => {
  it("is the audio clock while the sound runs, so Bead moves with what is heard", () => {
    const { clock, pass } = clocks();
    const start = clock();
    expect(start).toBe(10);
    pass(2, true);
    expect(clock() - start).toBeCloseTo(2, 2);
  });

  it('moves on with the page while the browser holds the sound stopped (before the first tap, an iPhone back from another app)', () => {
    const { clock, pass } = clocks();
    const start = clock();
    pass(3, false);
    // Never frozen: within a tenth of a second of the page's time.
    expect(clock() - start).toBeGreaterThan(2.85);
  });

  it('never goes back, and follows the audio clock again once the sound runs', () => {
    const { at, clock, pass } = clocks();
    pass(1, true);
    pass(3, false);
    const stopped = clock();
    pass(2, true);
    expect(clock() - stopped).toBeCloseTo(2, 2);
    // Each read at least the last.
    let last = clock();
    for (let i = 0; i < 100; i++) {
      at.wall += 0.004;
      if (i % 3 === 0) at.audio += 0.012; // the audio clock in render quanta, a step every few reads
      const t = clock();
      expect(t).toBeGreaterThanOrEqual(last);
      last = t;
    }
  });

  it('counts no page time while the audio clock merely steps in chunks, as it does while running', () => {
    const { at, clock } = clocks();
    const start = clock();
    for (let i = 0; i < 600; i++) {
      at.wall += 1 / 60;
      if (i % 2 === 0) at.audio += 2 / 60; // a 30 Hz step: still running
      clock();
    }
    expect(clock() - start).toBeCloseTo(10, 1);
  });
});
