import { describe, expect, it } from 'vitest';
import { type StepSize, stepParam, stepParamBy } from './grid';
import { inUnitShown, PARAMS, type ParamId } from './patch';

/** Where one press of `size` takes Parameter `id` from `value`, the Synth Geek Layer on or not (issue 201). */
const step = (id: ParamId, value: number, direction: 1 | -1, size: StepSize = 'unit', geek = true) =>
  stepParam(inUnitShown(PARAMS[id], geek), value, direction, size);
/** The values `presses` presses go through, each from where the last one left it. */
const presses = (id: ParamId, from: number, count: number, size: StepSize = 'unit') =>
  Array.from({ length: Math.abs(count) }, (_, i) => stepParamBy(PARAMS[id], from, Math.sign(count) * (i + 1), size));

describe('percent controls: 1 % a press, Shift 0.1 %, Page 10 %', () => {
  it('steps Sustain from 70 %', () => {
    expect(step('ampSustain', 0.7, 1, 'unit')).toBe(0.71);
    expect(step('ampSustain', 0.7, 1, 'fine')).toBe(0.701);
    expect(step('ampSustain', 0.7, 1, 'coarse')).toBe(0.8);
    expect(step('ampSustain', 0.7, -1, 'unit')).toBe(0.69);
  });
});

describe('snapping: a value left off the grid by a drag lands on it at the first press, and stays on it', () => {
  it('from 70.4 % goes up to 71 % and down to 70 %, then on by whole percents', () => {
    expect(step('resonance', 0.704, 1)).toBe(0.71);
    expect(step('resonance', 0.704, -1)).toBe(0.7);
    expect(presses('resonance', 0.704, 3)).toEqual([0.71, 0.72, 0.73]);
    expect(step('resonance', 0.704, 1, 'coarse')).toBe(0.8);
    expect(step('resonance', 0.704, -1, 'fine')).toBe(0.703);
  });

  it('reaches the ends of the range, and stays there', () => {
    expect(presses('pulseWidth', 0.93, 3)).toEqual([0.94, 0.95, 0.95]);
    expect(step('resonance', 0.04, -1, 'coarse')).toBe(0);
  });
});

describe('frequency and pitch: a semitone a press, Shift 10 cents, Page an octave', () => {
  it('steps the Cutoff from 2.00 kHz', () => {
    expect(step('cutoff', 2000, 1)).toBeCloseTo(2118.93, 2);
    expect(step('cutoff', 2000, -1)).toBeCloseTo(1887.75, 2);
    expect(step('cutoff', 2000, 1, 'fine')).toBeCloseTo(2011.6, 1);
    expect(step('cutoff', 2000, 1, 'coarse')).toBe(4000);
    expect(step('cutoff', 2000, -1, 'coarse')).toBe(1000);
  });

  it('lands a dragged Cutoff of 2.07 kHz on 2.12 kHz going up and 2.00 kHz going down', () => {
    expect(step('cutoff', 2070, 1)).toBeCloseTo(2118.93, 2);
    expect(step('cutoff', 2070, -1)).toBe(2000);
  });

  it('leaves the Cutoff’s ends round, reaching them from the grid', () => {
    expect(step('cutoff', 20, 1)).toBeCloseTo(20.857, 3); // the lowest of 1 kHz's semitones above 20 Hz
    expect(step('cutoff', step('cutoff', 20, 1), -1)).toBe(20);
    expect(step('cutoff', 19000, 1, 'coarse')).toBe(20000);
  });

  it('steps Osc 2’s Env Amount by semitones, Shift 10 cents, Page an octave', () => {
    expect(step('osc2EnvAmount', 0, 1)).toBe(1);
    expect(step('osc2EnvAmount', 0, 1, 'fine')).toBe(0.1);
    expect(step('osc2EnvAmount', 0, -1, 'coarse')).toBe(-12);
  });

  it('steps Detune by a cent, Shift 0.1, Page 10 cents', () => {
    expect(step('osc2Detune', 0, 1)).toBe(1);
    expect(step('osc2Detune', 0, -1, 'fine')).toBe(-0.1);
    expect(step('osc2Detune', 3, 1, 'coarse')).toBe(10);
  });

  it('steps the Filter’s Amount by 0.1 octave, Shift 0.01, Page 1 octave', () => {
    expect(step('filterEnvAmount', 0, 1)).toBe(0.1);
    expect(presses('filterEnvAmount', 0, -3, 'fine')).toEqual([-0.01, -0.02, -0.03]);
    expect(step('filterEnvAmount', 0.1, 1, 'coarse')).toBe(1);
  });
});

describe('times and the free Rate: a round series of about 20 a decade, Page doubling or halving, Shift 1 %', () => {
  it('steps the Attack from 10 ms through 11, 12, 14 … ms', () => {
    expect(presses('ampAttack', 0.01, 20)).toEqual(
      [11, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40, 45, 50, 56, 63, 71, 80, 90, 100].map((ms) => ms / 1000),
    );
    expect(step('ampAttack', 0.01, -1)).toBe(0.009);
    expect(step('ampAttack', 0.01, 1, 'coarse')).toBe(0.02);
    expect(step('ampAttack', 0.02, -1, 'coarse')).toBe(0.01);
    expect(step('ampAttack', 0.01, 1, 'fine')).toBe(0.0101);
    expect(step('ampAttack', 0.0101, -1, 'fine')).toBe(0.01);
  });

  it('lands a dragged time on the series, either way', () => {
    expect(step('ampDecay', 0.3, 1)).toBe(0.32);
    expect(step('ampDecay', 0.3, -1)).toBe(0.28);
    expect(step('ampDecay', 0.3, 1, 'coarse')).toBe(0.63); // double, to the nearest of the series
    expect(step('ampDecay', 0.3, -1, 'coarse')).toBe(0.16); // 0.15 is nearer 0.16 than 0.14, by ratio
  });

  it('crosses the decades and reaches the ends: 1 ms, and 10 s', () => {
    expect(step('ampRelease', 0.9, 1)).toBe(1);
    expect(step('ampRelease', 1, 1)).toBe(1.1);
    expect(step('ampRelease', 0.0011, -1)).toBe(0.001);
    expect(step('ampRelease', 9, 1, 'coarse')).toBe(10);
    expect(step('glide', 0.001, 1)).toBe(0.0011);
    expect(step('glide', 1.8, 1, 'coarse')).toBe(2);
  });

  it('steps the free LFO Rate on the same series, in Hz', () => {
    expect(presses('lfoRate', 2, 3)).toEqual([2.2, 2.5, 2.8]);
    expect(step('lfoRate', 2, 1, 'coarse')).toBe(4);
    expect(step('lfoRate', 0.056, -1)).toBe(0.05);
    expect(step('lfoRate', 18, 1)).toBe(20);
  });
});

describe('the Mixer’s faders outside the Synth Geek Layer: 1 % a press, as they read (issue 201)', () => {
  const off = (id: ParamId, value: number, direction: 1 | -1, size: StepSize = 'unit') => step(id, value, direction, size, false);
  it('steps Osc 1’s fader down from 100 %', () => {
    expect(off('mixOsc1', 1, -1)).toBe(0.99);
    expect(off('mixOsc1', 1, -1, 'coarse')).toBe(0.9);
    expect(off('mixOsc1', 1, -1, 'fine')).toBe(0.999);
    expect(off('mixSub', 0.01, -1)).toBe(0); // no dB floor: 1 % then 0 %
  });

  it('lands a dragged fader on a round percent', () => {
    expect(off('mixNoise', 0.504, 1)).toBe(0.51);
    expect(off('mixNoise', 0.504, -1)).toBe(0.5);
  });
});

describe('Ring reads % and steps 1 % in and out of the Synth Geek Layer (issue 201)', () => {
  it('steps by the percent', () => {
    expect(step('mixRing', 0.5, 1, 'unit', true)).toBe(0.51);
    expect(step('mixRing', 0.5, 1, 'unit', false)).toBe(0.51);
    expect(step('mixRing', 0.5, -1, 'coarse', true)).toBe(0.4);
  });
});

describe('the other Grids do not depend on the Synth Geek Layer (issue 201)', () => {
  it('steps Sustain and the Octave alike, on or off', () => {
    for (const geek of [true, false]) {
      expect(step('ampSustain', 0.7, 1, 'unit', geek)).toBe(0.71);
      expect(step('osc1Octave', 0, 1, 'unit', geek)).toBe(1);
    }
  });
});

describe('the Mixer’s faders in the Synth Geek Layer: 0.5 dB a press, Shift 0.1 dB, Page 6 dB, then −∞ below the lowest step', () => {
  const db = (level: number) => 20 * Math.log10(level);
  it('steps Osc 1’s fader down from 0 dB', () => {
    expect(db(step('mixOsc1', 1, -1))).toBeCloseTo(-0.5, 9);
    expect(db(step('mixOsc1', 1, -1, 'fine'))).toBeCloseTo(-0.1, 9);
    expect(db(step('mixOsc1', 1, -1, 'coarse'))).toBeCloseTo(-6, 9);
    expect(step('mixOsc1', 1, 1)).toBe(1);
  });

  it('goes from its lowest dB step to silence, and back', () => {
    const lowest = 10 ** (-40 / 20);
    expect(step('mixOsc2', lowest, -1)).toBe(0);
    expect(step('mixOsc2', 0, 1)).toBe(lowest);
    expect(step('mixOsc2', 0, 1, 'coarse')).toBe(lowest);
    expect(db(step('mixOsc2', lowest, 1))).toBeCloseTo(-39.5, 9);
    expect(step('mixOsc2', 10 ** (-38 / 20), -1, 'coarse')).toBe(lowest); // no further than the lowest step
    expect(step('mixOsc2', 0.004, 1)).toBe(lowest); // dragged below it
  });

  it('lands a dragged fader on the half-dB grid', () => {
    expect(db(step('mixSub', 0.5, 1))).toBeCloseTo(-6, 9); // 0.5 is −6.02 dB
    expect(db(step('mixSub', 0.5, -1))).toBeCloseTo(-6.5, 9);
  });
});

describe('stepped controls: a whole step a press, Shift too', () => {
  it('steps the Octave, the Semitone and a note value', () => {
    expect(step('osc1Octave', 0, 1)).toBe(1);
    expect(step('osc1Octave', 0, 1, 'fine')).toBe(1);
    expect(step('osc1Octave', 2, 1)).toBe(2);
    expect(step('osc2Semitone', 1, 1, 'coarse')).toBe(3);
    expect(step('lfoNote', 10, -1)).toBe(9);
  });
});
