import { describe, expect, it } from 'vitest';
import { CHOICES, defaultPatch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { filterQ, geekReadout, harmonicFormula, levelDb, oscillatorFormulas, qText, responseFormula, UNDER_THE_HOOD, widestGeekReadout } from './geek';
import { harmonicSeries } from './harmonics';
import { noteIndex } from './tempo';

describe('the Synth Geek Layer: Resonance as Q', () => {
  it('is a flat Butterworth (0.71) at Resonance 0 for low- and high-pass, at either Slope', () => {
    expect(filterQ('lowpass', 12, 0).q).toBeCloseTo(Math.SQRT1_2, 2);
    expect(filterQ('highpass', 12, 0).q).toBeCloseTo(Math.SQRT1_2, 2);
    expect(qText('lowpass', 12, 0)).toBe('Q 0.71');
  });

  it('rises with Resonance, and at 24 dB is shared by two stages', () => {
    expect(filterQ('lowpass', 12, 1).q).toBeGreaterThan(filterQ('lowpass', 12, 0.5).q);
    expect(filterQ('lowpass', 24, 0.5)).toMatchObject({ stages: 2 });
    // Two stages each with half the peak in dB: each Q is the square root of the one-stage Q.
    expect(filterQ('lowpass', 24, 0.5).q).toBeCloseTo(Math.sqrt(filterQ('lowpass', 12, 0.5).q), 5);
    expect(qText('lowpass', 24, 0.5)).toMatch(/^Q \d+\.\d+ ×2$/);
  });

  it('for band-pass and notch is the centre over the bandwidth: 0.5 to 20', () => {
    expect(filterQ('bandpass', 12, 0).q).toBeCloseTo(0.5);
    expect(filterQ('notch', 12, 1).q).toBeCloseTo(20);
  });
});

describe('the Synth Geek Layer: levels in dB', () => {
  it('reads a gain in dB, silence as −∞', () => {
    expect(levelDb(1)).toBe('0.0 dB');
    expect(levelDb(0.5)).toBe('−6.0 dB');
    expect(levelDb(0)).toBe('−∞ dB');
  });

  it('shows Q on Resonance and dB on the Mixer and the Amp’s Sustain, nothing elsewhere', () => {
    const patch = defaultPatch();
    expect(geekReadout('resonance', 0, patch)).toBe('Q 0.71');
    expect(geekReadout('mixOsc2', 0.5, patch)).toBe('−6.0 dB');
    expect(geekReadout('ampSustain', 1, patch)).toBe('0.0 dB');
    expect(geekReadout('cutoff', 1000, patch)).toBeUndefined();
  });
});

describe('the Synth Geek Layer: Osc 2’s tuning (issue 167)', () => {
  const patch = defaultPatch();

  it('reads the Semitone as Osc 2’s frequency ratio, whole octaves as fractions', () => {
    expect(geekReadout('osc2Semitone', 7, patch)).toBe('×1.498');
    expect(geekReadout('osc2Semitone', -7, patch)).toBe('×0.667');
    expect(geekReadout('osc2Semitone', 0, patch)).toBe('×1');
    expect(geekReadout('osc2Semitone', 12, patch)).toBe('×2');
    expect(geekReadout('osc2Semitone', -12, patch)).toBe('×½');
  });

  it('reads the Octave as its multiple', () => {
    expect(geekReadout('osc2Octave', 1, patch)).toBe('×2');
    expect(geekReadout('osc2Octave', 2, patch)).toBe('×4');
    expect(geekReadout('osc2Octave', -1, patch)).toBe('×½');
    expect(geekReadout('osc2Octave', -2, patch)).toBe('×¼');
    expect(geekReadout('osc2Octave', 0, patch)).toBe('×1');
  });

  it('reads Detune as its beating rate at the Note played, at A4 (said) before any', () => {
    // 440 Hz × (2^(10/1200) − 1) = 2.549 Hz; at C4 (261.6 Hz) 1.516 Hz; an octave up on Osc 2, twice A4's.
    expect(geekReadout('osc2Detune', 10, patch)).toBe('2.55 Hz at A4');
    expect(geekReadout('osc2Detune', 10, patch, 69)).toBe('2.55 Hz beats');
    expect(geekReadout('osc2Detune', 10, patch, 60)).toBe('1.52 Hz beats');
    expect(geekReadout('osc2Detune', -10, patch, 69)).toBe('2.53 Hz beats');
    expect(geekReadout('osc2Detune', 10, { ...patch, osc2Octave: 1 }, 69)).toBe('5.10 Hz beats');
    expect(geekReadout('osc2Detune', 50, { ...patch, osc2Octave: 2, osc2Semitone: 12 }, 108)).toBe('981 Hz beats');
    expect(geekReadout('osc2Detune', 0, patch, 69)).toBe('0.00 Hz beats');
  });

  it('sizes each for its widest', () => {
    for (const id of ['osc2Octave', 'osc2Semitone', 'osc2Detune'] as const) expect(widestGeekReadout(id)).not.toHaveLength(0);
  });
});

describe('the Synth Geek Layer: the LFOs (issue 169)', () => {
  const patch = defaultPatch(); // LFO 1 on the Cutoff, LFO 2 on Pitch

  it('reads a Rate as its period: 2 Hz is 0.50 s', () => {
    expect(geekReadout('lfoRate', 2, patch)).toBe('0.50 s');
    expect(geekReadout('lfo2Rate', 3, patch)).toBe('0.33 s');
    expect(geekReadout('lfoRate', 20, patch)).toBe('0.050 s');
    expect(geekReadout('lfoRate', 0.05, patch)).toBe('20.0 s');
  });

  it('reads a synced Rate as its period at the tempo: 1/4 at 120 BPM is 0.50 s', () => {
    expect(geekReadout('lfoNote', noteIndex('1/4'), patch, null, 120)).toBe('0.50 s');
    expect(geekReadout('lfo2Note', noteIndex('1/4'), patch, null, 90)).toBe('0.67 s');
    expect(geekReadout('lfoNote', noteIndex('1 bar'), patch, null, 120)).toBe('2.00 s');
    expect(geekReadout('lfoNote', noteIndex('4 bars D'), patch, null, 40)).toBe('36.0 s');
    expect(geekReadout('lfoNote', noteIndex('1/32 T'), patch, null, 240)).toBe('0.021 s');
  });

  it('reads a Depth as the swing in its Destination’s own unit', () => {
    const on = (destination: string, extra = {}) => ({ ...patch, lfoDestination: destination, ...extra }) as typeof patch;
    expect(geekReadout('lfoAmount', 0.4, patch)).toBe('±0.80 oct');
    expect(geekReadout('lfo2Amount', 0.5, patch)).toBe('±0.50 st');
    expect(geekReadout('lfoAmount', 1, on('osc2Pitch'))).toBe('±12.0 st');
    expect(geekReadout('lfoAmount', 0.5, on('detune'))).toBe('±25.0 ¢');
    expect(geekReadout('lfoAmount', 0.3, on('pulseWidth'))).toBe('±12 %');
    expect(geekReadout('lfoAmount', 0.5, on('resonance'))).toBe('±20 %'); // as far as the knob's 20 % leaves room
    expect(geekReadout('lfoAmount', 0.5, on('fm', { crossMod: 0.3 }))).toBe('±30 %');
    expect(geekReadout('lfoAmount', 0, patch)).toBe('±0.00 oct');
  });

  it('reads a Depth on Volume as the dip below the top of its wave, in dB', () => {
    const volume = { ...patch, lfoDestination: 'volume' } as const;
    expect(geekReadout('lfoAmount', 0.5, volume)).toBe('−6.0 dB');
    expect(geekReadout('lfoAmount', 1, volume)).toBe('−∞ dB');
    expect(geekReadout('lfoAmount', 0, volume)).toBe('0.0 dB');
  });

  it('a Pulse Width swing keeps within its ends, as the engine’s: a 25 % pulse swings 20 % at most', () => {
    const pw = { ...patch, lfoDestination: 'pulseWidth' } as const;
    expect(geekReadout('lfoAmount', 1, pw)).toBe('±20 %');
    // Osc 1's width while it is a pulse, Osc 2's when it alone is.
    expect(geekReadout('lfoAmount', 1, { ...pw, waveform: 'pulse', osc2Waveform: 'pulse', osc2PulseWidth: 0.5 })).toBe('±20 %');
    expect(geekReadout('lfoAmount', 1, { ...pw, waveform: 'saw', osc2Waveform: 'pulse', osc2PulseWidth: 0.5 })).toBe('±40 %');
    // Both LFOs on one Destination share its room.
    expect(geekReadout('lfo2Amount', 0.5, { ...pw, lfoAmount: 0.5, lfo2Destination: 'pulseWidth' })).toBe('±10 %');
  });

  it('sizes each for its widest', () => {
    for (const id of ['lfoRate', 'lfoNote', 'lfo2Rate', 'lfo2Note', 'lfoAmount', 'lfo2Amount'] as const) expect(widestGeekReadout(id)).not.toHaveLength(0);
  });

  it('gives the formulas of the period and the swing', () => {
    expect(UNDER_THE_HOOD.lfoRate.formula).toBe('T = 1 / f');
    expect(UNDER_THE_HOOD.lfoNote.formula).toBe('T = beats × 60 / BPM');
    // The reach at full Depth from the laws the engine swings by.
    expect(UNDER_THE_HOOD.lfoDepth.where).toContain('Pitch ±1 st');
    expect(UNDER_THE_HOOD.lfoDepth.where).toContain('Cutoff ±2 oct');
    expect(UNDER_THE_HOOD.lfoDepth.where).toContain('Detune ±50 ¢');
    expect(UNDER_THE_HOOD.lfoDepth.where).toContain('Pulse Width ±40 %');
  });
});

describe('the Synth Geek Layer: Key Track (issue 169)', () => {
  const patch = { ...defaultPatch(), cutoff: 1000, keyTrack: 1 };

  it('reads the Cutoff at the Note played, the Effective Cutoff’s figure: A4 before any', () => {
    expect(geekReadout('keyTrack', 1, patch, 72)).toBe('2.00 kHz');
    expect(geekReadout('keyTrack', 1, patch, 60)).toBe('1.00 kHz');
    expect(geekReadout('keyTrack', 1, patch)).toBe('1.68 kHz'); // 1 kHz × 2^(9/12)
    expect(geekReadout('keyTrack', 0.5, patch, 84)).toBe('2.00 kHz');
    expect(geekReadout('keyTrack', 0, patch, 84)).toBe('1.00 kHz');
    expect(geekReadout('keyTrack', 1, { ...patch, cutoff: 20000 }, 96)).toBe('20.00 kHz');
    expect(geekReadout('keyTrack', 1, { ...patch, cutoff: 200 }, 24)).toBe('25 Hz'); // three octaves under C4
  });

  it('sizes it for its widest, and gives its formula', () => {
    expect(widestGeekReadout('keyTrack')).not.toHaveLength(0);
    expect(UNDER_THE_HOOD.keyTrack.formula).toBe('fc = Cutoff × 2^(k·(n − 60)/12)');
  });
});

describe('the Synth Geek Layer: formulas as data', () => {
  it('has a Harmonic formula for every Waveform, whose numbers match the Ideal Reference', () => {
    for (const w of CHOICES.waveform) expect(harmonicFormula(w, 0.3).formula.length, w).toBeGreaterThan(5);
    // The saw's 1/n and the triangle's 1/n², as the series the Viewers draw.
    const saw = harmonicSeries('saw', 0.5, 8).magnitudes;
    expect(saw[3] / saw[1]).toBeCloseTo(1 / 3);
    const triangle = harmonicSeries('triangle', 0.5, 8).magnitudes;
    expect(triangle[3] / triangle[1]).toBeCloseTo(1 / 9);
    expect(harmonicFormula('pulse', 0.25).where).toContain('25 %');
  });

  it('has a Response Curve formula for every Filter Mode, squared at 24 dB', () => {
    for (const mode of CHOICES.filterMode) {
      expect(responseFormula(mode, 12).formula, mode).toMatch(/^\|H\| = .*x/);
      expect(responseFormula(mode, 24).formula, mode).toMatch(/\)²$/);
    }
    expect(responseFormula('highpass', 12).formula).toContain('x² /');
  });
});

describe('the Synth Geek Layer under FM and Ring (issue 109)', () => {
  const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
  const text = (lines: { formula: string; where: string }[]) => lines.map((l) => `${l.formula} | ${l.where}`).join('\n');

  it('gives Osc 1’s series alone while neither is up', () => {
    expect(oscillatorFormulas(defaultPatch())).toEqual([harmonicFormula('saw', 0.25)]);
  });

  it('Osc 1 silent (its fader down, Ring off): its series marked as not the sound, FM up or not', () => {
    for (const fm of [0, 0.5]) {
      const [line, ...rest] = oscillatorFormulas({ ...defaultPatch(), mixOsc1: 0, mixRing: 0, crossMod: fm });
      expect(rest).toEqual([]);
      expect(line.where).toContain('Osc 1 is silent: not the sound now');
    }
  });

  it('with FM at 50 %: the sideband rule, β = 2 and its Bessel sizes, and the saw’s series no longer the sound’s', () => {
    const lines = oscillatorFormulas({ ...defaultPatch(), crossMod: 0.5 });
    expect(lines[0].formula).toBe('n f₁ + k f₂:  bₙ |Jₖ(n β)|,  β = 4 × FM = 2.00');
    // J₀ to J₃ of 2, and Osc 2 in tune: on the Harmonics.
    expect(lines[0].where).toBe('f₂ / f₁ = 1: on the Harmonics; |J₀…J₃(β)| 0.22 0.58 0.35 0.13; Osc 2 a Saw: its 1st Harmonic only');
    expect(lines[1]).toEqual({ formula: 'bₙ = 2 / (π n)', where: 'bₙ: Osc 1 before FM, not the sound now' });
    expect(text(lines)).not.toContain('every n: each Harmonic 1/n of the first');
  });

  it('with FM off the ladder: between the Harmonics; FM Ladder’s two Sines say nothing of Osc 2’s Waveform', () => {
    expect(oscillatorFormulas({ ...preset('FM Ladder'), osc2Semitone: 3 })[0].where).toMatch(/^f₂ \/ f₁ = 1\.19: between the Harmonics; /);
    expect(oscillatorFormulas(preset('FM Ladder'))[0].where).not.toContain('Osc 2');
  });

  it('with Ring at 100 %: the sum and the difference for the knobs, the series only as Osc 1’s own', () => {
    const both = oscillatorFormulas({ ...defaultPatch(), mixRing: 1, osc2Octave: 1, osc2Semitone: 3 });
    expect(both[0].where).toBe('every n: each Harmonic 1/n of the first; Osc 1’s own, Ring adds the rest');
    expect(both[1].where).toBe('sums and differences (cₘ: Osc 2’s series); the first pair 1.38 and 3.38 × f₁');
    // Ring Bell: Osc 1 heard through Ring alone, so no series of its own.
    expect(oscillatorFormulas(preset('Ring Bell')).map((l) => l.formula)).toEqual(['Ring, Osc 1 × Osc 2:  n f₁ ± m f₂,  ½ bₙ cₘ']);
    // In tune, the difference is 0 Hz: an offset the engine takes out.
    expect(oscillatorFormulas({ ...defaultPatch(), mixRing: 1 })[1].where).toContain('the first pair 0 (taken out) and 2 × f₁');
  });

  it('leaves FM out while Osc 1 is not heard: it moves nothing that sounds', () => {
    expect(text(oscillatorFormulas({ ...defaultPatch(), crossMod: 0.5, mixOsc1: 0 }))).not.toContain('β');
  });
});
