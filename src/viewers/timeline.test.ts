import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { createDashState } from './dashState';
import { timelineGrid, timelineKey } from './timeline';

const patch = (change: Partial<Patch>): Patch => ({ ...defaultPatch(), lfoAmount: 0, lfo2Amount: 0, filterEnvAmount: 0, ...change });

describe("the Timeline's key, in the owner's order (issue 76)", () => {
  it('names the Amp Envelope alone with no Filter Envelope and no active LFO', () => {
    expect(timelineKey(patch({}))).toEqual([{ mark: 'amp', name: 'Amp Envelope' }]);
  });

  it('adds the Cutoff, then the Filter Envelope, once its Amount is set', () => {
    expect(timelineKey(patch({ filterEnvAmount: 2 })).map((e) => e.mark)).toEqual(['cutoff', 'filterEnvelope', 'amp']);
  });

  it('names an LFO on the Cutoff as the Cutoff, dotted in the Filter’s colour', () => {
    expect(timelineKey(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5 }))).toEqual([
      { mark: 'cutoff', name: 'Cutoff', stage: 'filter', pattern: 'dots' },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it("puts what LFO 1 moves first, then what LFO 2 moves, each in its stage's colour and its LFO's pattern", () => {
    const key = timelineKey(patch({ lfoDestination: 'volume', lfoAmount: 1, lfo2Destination: 'pulseWidth', lfo2Amount: 1, filterEnvAmount: -1 }));
    expect(key).toEqual([
      { mark: 'lfo-volume', name: 'Volume', destination: 'volume', stage: 'amp', pattern: 'dashes' },
      { mark: 'lfo-pulseWidth', name: 'Pulse Width', destination: 'pulseWidth', stage: 'osc', pattern: 'dashDot' },
      { mark: 'cutoff', name: 'Cutoff', stage: 'filter', pattern: 'dots' },
      { mark: 'filterEnvelope', name: 'Filter Envelope' },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it('names nothing but the Amp Envelope before any Patch is known', () => {
    expect(timelineKey(undefined)).toEqual([{ mark: 'amp', name: 'Amp Envelope' }]);
  });
});

describe("the Timeline's moments, on a grid that scrolls with it (the owner, 2026-10-29)", () => {
  const PPS = 626; // a 626 px Timeline showing one second

  it('samples the same moments in every frame, one pixel apart, from the left edge to now', () => {
    const a = timelineGrid(1, 1, PPS);
    const b = timelineGrid(1.0037, 1, PPS);
    expect(a.times.at(-1)).toBeLessThanOrEqual(1);
    expect(a.xs[0]).toBeGreaterThanOrEqual(0);
    expect(a.xs[0]).toBeLessThan(1);
    expect(a.xs[1] - a.xs[0]).toBeCloseTo(1);
    const shared = b.times.filter((t) => t <= a.times.at(-1)!);
    expect(shared).toEqual(a.times.slice(a.times.length - shared.length));
  });

  it("keeps a broken line's marks on the same spot of a fast LFO's curve from frame to frame", () => {
    // LFO 1 on the Pulse Width at 8.42 Hz and 80 %: steep, so a sub-pixel shift in where it is sampled changed the
    // curve's measured length by a pixel or more, and the marks jumped.
    const height = (t: number) => 60 + 50 * Math.sin(2 * Math.PI * 8.42 * t);
    const dashes = createDashState();
    const spot = 0.9; // a moment on the curve, seen in every frame
    const where = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const now = 1 + i * 0.0037;
      const { times } = timelineGrid(now, 1, PPS);
      const ys = times.map(height);
      dashes.nextFrame();
      const start = dashes.start('pulseWidth', times[0], ys, PPS);
      const k = times.findIndex((t) => Math.abs(t - spot) < 0.5 / PPS);
      let along = start;
      for (let x = 1; x <= k; x++) along += Math.hypot(1, ys[x] - ys[x - 1]);
      return along;
    });
    for (const w of where) expect(w).toBeCloseTo(where[0], 6);
  });
});
