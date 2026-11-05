import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { createDashState } from './dashState';
import { createColumnSamples, timelineGrid, timelineKey } from './timeline';

const patch = (change: Partial<Patch>): Patch => ({ ...defaultPatch(), lfoAmount: 0, lfo2Amount: 0, filterEnvAmount: 0, ...change });

describe("the Timeline's key, in the owner's order (issue 76)", () => {
  it('names the Amp Envelope alone with no Filter Envelope and no active LFO', () => {
    expect(timelineKey(patch({}), null)).toEqual([{ mark: 'amp', name: 'Amp Envelope' }]);
  });

  it('adds the Cutoff, then the Filter Envelope, once its Amount is set', () => {
    expect(timelineKey(patch({ filterEnvAmount: 2 }), null).map((e) => e.mark)).toEqual(['cutoff', 'filterEnvelope', 'amp']);
  });

  it('names an LFO on the Cutoff as the Cutoff, dotted in the Filter’s colour', () => {
    expect(timelineKey(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5 }), null)).toEqual([
      { mark: 'cutoff', name: 'Cutoff', stage: 'filter', pattern: 'dots' },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it("puts what LFO 1 moves first, then what LFO 2 moves, each in its stage's colour and its LFO's pattern", () => {
    const key = timelineKey(patch({ lfoDestination: 'volume', lfoAmount: 1, lfo2Destination: 'pulseWidth', lfo2Amount: 1, filterEnvAmount: -1 }), null);
    expect(key).toEqual([
      { mark: 'lfo-volume', name: 'Volume', destination: 'volume', stage: 'amp', pattern: 'dashes' },
      { mark: 'lfo-pulseWidth', name: 'Pulse Width', destination: 'pulseWidth', stage: 'osc', pattern: 'dashDot' },
      { mark: 'cutoff', name: 'Cutoff', stage: 'filter', pattern: 'dots' },
      { mark: 'filterEnvelope', name: 'Filter Envelope' },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it('adds what aftertouch moves once a keyboard sends it, after the LFOs’ (issue 132)', () => {
    expect(timelineKey(patch({}), 'cutoff').map((e) => e.mark)).toEqual(['cutoff', 'amp']);
    expect(timelineKey(patch({ lfoDestination: 'volume', lfoAmount: 1 }), 'resonance')).toEqual([
      { mark: 'lfo-volume', name: 'Volume', destination: 'volume', stage: 'amp', pattern: 'dashes' },
      { mark: 'lfo-resonance', name: 'Resonance', destination: 'resonance', stage: 'filter', pattern: 'dashes', aftertouch: true },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
    // On a Destination an LFO already moves: its line, once.
    expect(timelineKey(patch({ lfo2Destination: 'volume', lfo2Amount: 1 }), 'volume')).toEqual([
      { mark: 'lfo-volume', name: 'Volume', destination: 'volume', stage: 'amp', pattern: 'dashDot', aftertouch: true },
      { mark: 'amp', name: 'Amp Envelope' },
    ]);
  });

  it('names nothing but the Amp Envelope before any Patch is known', () => {
    expect(timelineKey(undefined, null)).toEqual([{ mark: 'amp', name: 'Amp Envelope' }]);
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

describe("the Timeline's samples, kept from frame to frame (issue 215)", () => {
  const PPS = 626;
  // A past moment's Modulation never changes (the model's history is kept by age and only added to): a stand-in for it.
  const model = (t: number) => ({ amp: Math.sin(t * 7), at: t });

  it('works out only the columns new since the last frame, and the same samples as worked out afresh', () => {
    const asked: number[] = [];
    const samples = createColumnSamples((t) => {
      asked.push(t);
      return model(t);
    });
    let previous = timelineGrid(1, 1, PPS);
    samples(previous, PPS, 0);
    for (const now of [1.0167, 1.0334, 1.05]) {
      asked.length = 0;
      const grid = timelineGrid(now, 1, PPS);
      expect(samples(grid, PPS, 0)).toEqual(grid.times.map(model));
      // The new columns, and the last frame's newest again: a Note or a knob can land on the moment it was drawn at.
      expect(asked).toEqual(grid.times.filter((t) => t >= previous.times.at(-1)!));
      previous = grid;
    }
  });

  it('works out every column afresh at a new scale (a resize, another time span) and when time stands still', () => {
    const asked: number[] = [];
    const samples = createColumnSamples((t) => {
      asked.push(t);
      return model(t);
    });
    samples(timelineGrid(1, 1, PPS), PPS, 0);
    asked.length = 0;
    const wider = timelineGrid(1.0167, 1, 700);
    expect(samples(wider, 700, 0)).toEqual(wider.times.map(model));
    expect(asked).toEqual(wider.times);
    asked.length = 0;
    samples(wider, 700, 0); // a frozen Timeline, or a clock not yet running
    expect(asked).toEqual([wider.times.at(-1)]);
  });

  it("works out again, every frame, the columns from before the model's past is settled", () => {
    // Before the first Note, the first Note's key stands in for the Key Track's; before the first Patch, the first
    // Patch, which a knob replaces while the clock stands still: those columns change when it comes.
    const asked: number[] = [];
    const samples = createColumnSamples((t) => {
      asked.push(t);
      return model(t);
    });
    const settled = 0.5;
    samples(timelineGrid(1, 1, PPS), PPS, settled);
    asked.length = 0;
    const grid = timelineGrid(1.0167, 1, PPS);
    expect(samples(grid, PPS, settled)).toEqual(grid.times.map(model));
    const previousNewest = timelineGrid(1, 1, PPS).times.at(-1)!;
    expect(asked).toEqual(grid.times.filter((t) => t < settled || t >= previousNewest));
  });
});
