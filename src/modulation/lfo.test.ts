import { describe, expect, it } from 'vitest';
import { createLfoClock, glideFrequency, LFO_START, lfoPhase, lfoShape } from './lfo';

describe('lfoShape: one cycle of each LFO Waveform (phase 0–1), like Web Audio’s own oscillators', () => {
  it('sine starts at 0 and peaks a quarter of the way through', () => {
    expect(lfoShape('sine', 0)).toBeCloseTo(0);
    expect(lfoShape('sine', 0.25)).toBeCloseTo(1);
    expect(lfoShape('sine', 0.75)).toBeCloseTo(-1);
  });

  it('triangle rises from 0 to +1 at a quarter, down to −1 at three quarters', () => {
    expect(lfoShape('triangle', 0)).toBeCloseTo(0);
    expect(lfoShape('triangle', 0.125)).toBeCloseTo(0.5);
    expect(lfoShape('triangle', 0.25)).toBeCloseTo(1);
    expect(lfoShape('triangle', 0.75)).toBeCloseTo(-1);
  });

  it('square is +1 for the first half and −1 for the second', () => {
    expect(lfoShape('square', 0.1)).toBe(1);
    expect(lfoShape('square', 0.6)).toBe(-1);
  });

  it('saw rises from 0 to +1 by half way, jumps to −1 and rises back to 0', () => {
    expect(lfoShape('saw', 0)).toBeCloseTo(0);
    expect(lfoShape('saw', 0.25)).toBeCloseTo(0.5);
    expect(lfoShape('saw', 0.75)).toBeCloseTo(-0.5);
  });

  it('a falling saw is the saw upside down: from 0 to −1 by half way, a jump to +1, and down back to 0', () => {
    expect(lfoShape('sawDown', 0)).toBeCloseTo(0);
    expect(lfoShape('sawDown', 0.25)).toBeCloseTo(-0.5);
    expect(lfoShape('sawDown', 0.75)).toBeCloseTo(0.5);
  });
});

describe('LFO_START: where a retriggered LFO starts each Waveform (issue 124, decided by the owner)', () => {
  it('a Saw at its foot, a Saw Down at its top, a Square on its upper half, a Sine and a Triangle at the centre rising', () => {
    expect(lfoShape('saw', LFO_START.saw)).toBe(-1);
    expect(lfoShape('sawDown', LFO_START.sawDown)).toBe(1);
    expect(lfoShape('square', LFO_START.square)).toBe(1);
    expect(lfoShape('square', LFO_START.square + 0.49)).toBe(1); // the whole upper half is ahead
    for (const w of ['sine', 'triangle'] as const) {
      expect(lfoShape(w, LFO_START[w])).toBeCloseTo(0, 9);
      expect(lfoShape(w, LFO_START[w] + 0.01)).toBeGreaterThan(0);
    }
  });
});

describe('lfoPhase: where in its cycle the LFO is, given its Rate over time', () => {
  it('advances at the Rate', () => {
    expect(lfoPhase([{ time: 0, rate: 2 }], 0.3)).toBeCloseTo(0.6);
    expect(lfoPhase([{ time: 0, rate: 2 }], 1.3)).toBeCloseTo(0.6); // whole cycles wrap
  });

  it('stays continuous when the Rate changes (no jump), as a running oscillator does', () => {
    const history = [
      { time: 0, rate: 2 },
      { time: 1, rate: 4 },
    ];
    expect(lfoPhase(history, 1)).toBeCloseTo(0); // 2 whole cycles
    expect(lfoPhase(history, 1.1)).toBeCloseTo(0.4);
  });

  it('is at the start before the LFO runs', () => {
    expect(lfoPhase([{ time: 5, rate: 2 }], 1)).toBe(0);
  });
});

describe('glideFrequency: the pitch sliding between Notes', () => {
  const slide = [
    { time: 0, frequency: 220, glide: 0 },
    { time: 1, frequency: 440, glide: 0.4 },
  ];

  it('jumps straight to a Note when Glide is off', () => {
    expect(glideFrequency(slide, 0.5)).toBe(220);
  });

  it('slides from the previous pitch, nearly arriving (98%) by the Glide time', () => {
    expect(glideFrequency(slide, 1)).toBeCloseTo(220);
    const arrived = (glideFrequency(slide, 1.4) - 220) / (440 - 220);
    expect(arrived).toBeCloseTo(1 - Math.exp(-4), 3);
    expect(glideFrequency(slide, 3)).toBeCloseTo(440, 3);
  });

  it('starts a new slide from wherever the pitch has got to', () => {
    const interrupted = [...slide, { time: 1.1, frequency: 110, glide: 0.4 }];
    expect(glideFrequency(interrupted, 1.1)).toBeCloseTo(glideFrequency(slide, 1.1));
  });
});

describe('createLfoClock', () => {
  const changes = Array.from({ length: 300 }, (_, i) => ({ time: 1 + i * 0.01, rate: 1 + (i % 7) }));

  it('gives the same phase as integrating the whole Rate history', () => {
    const clock = createLfoClock(0, 2);
    for (const c of changes) clock.setRate(c.time, c.rate);
    const history = [{ time: 0, rate: 2 }, ...changes];
    for (const t of [0.5, 1, 1.234, 2.5, 3.99, 5]) expect(clock.phaseAt(t)).toBeCloseTo(lfoPhase(history, t), 9);
  });

  it('forgets old Rate changes without moving the phase of anything after them', () => {
    const clock = createLfoClock(0, 2);
    for (const c of changes) clock.setRate(c.time, c.rate);
    const before = [2.5, 3, 3.5, 3.99].map((t) => clock.phaseAt(t));
    clock.forgetBefore(2.4);
    expect(clock.size).toBeLessThan(changes.length);
    expect([2.5, 3, 3.5, 3.99].map((t) => clock.phaseAt(t))).toEqual(before);
  });

  it('takes a second change at the same moment as a correction, not a zero-length segment', () => {
    const clock = createLfoClock(0, 1);
    clock.setRate(1, 3);
    clock.setRate(1, 5);
    expect(clock.phaseAt(1.1)).toBeCloseTo(0.5, 9); // 1 cycle at 1 Hz, then 0.1 s at 5 Hz
  });

  it('restarts its cycle at a Note (retrigger): phase 0 there, then on at the Rate', () => {
    const clock = createLfoClock(0, 2);
    clock.restart(1.3, 0);
    expect(clock.phaseAt(1.2)).toBeCloseTo(0.4); // untouched before the restart
    expect(clock.phaseAt(1.3)).toBeCloseTo(0);
    expect(clock.phaseAt(1.55)).toBeCloseTo(0.5);
  });

  it('restarts at the phase it is given, and keeps it through a later Rate change (issue 124)', () => {
    const clock = createLfoClock(0, 2);
    clock.restart(1.3, 0.5);
    expect(clock.phaseAt(1.3)).toBeCloseTo(0.5);
    expect(clock.phaseAt(1.425)).toBeCloseTo(0.75); // a quarter of a cycle on at 2 Hz
    clock.setRate(1, 4); // a Rate change before it, made after it was handed over
    expect(clock.phaseAt(1.3)).toBeCloseTo(0.5);
    expect(clock.phaseAt(1.4)).toBeCloseTo(0.9);
  });

  it('takes a restart scheduled ahead of a later Rate change made before it (a Note handed over early)', () => {
    const clock = createLfoClock(0, 1);
    clock.restart(2, 0); // a Note scheduled for t = 2
    clock.setRate(1.5, 4); // the Rate turned at 1.5, before the Note sounds
    expect(clock.phaseAt(1.75)).toBeCloseTo(0.5 + 4 * 0.25 - 1); // 1.5 cycles + 1 cycle
    expect(clock.phaseAt(2)).toBeCloseTo(0);
    expect(clock.phaseAt(2.1)).toBeCloseTo(0.4); // at the new Rate after the restart
  });

  it('forgets old restarts without moving the phase after them', () => {
    const clock = createLfoClock(0, 3);
    clock.restart(1, 0.5);
    clock.setRate(2, 1);
    clock.restart(3, 0.5);
    const before = [3.2, 3.7].map((t) => clock.phaseAt(t));
    clock.forgetBefore(3.1);
    expect([3.2, 3.7].map((t) => clock.phaseAt(t))).toEqual(before);
  });

  it('calls off the restarts after a moment, its cycle running on through them, a Rate change there kept (the 1.16.1 review)', () => {
    const clock = createLfoClock(0, 1);
    clock.restart(0.5, 0);
    clock.restart(2, 0.5);
    clock.setRate(2, 2);
    clock.cancelAfter(1);
    expect(clock.phaseAt(0.75)).toBeCloseTo(0.25); // the restart before it stands
    expect(clock.phaseAt(2)).toBeCloseTo(0.5); // 1.5 cycles since 0.5
    expect(clock.phaseAt(2.1)).toBeCloseTo(0.7); // on at the Rate set at 2
  });
});
