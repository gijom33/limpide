import { describe, expect, it } from 'vitest';
import { CHOICES, defaultPatch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import {
  filterQ, geekReadout, harmonicFormula, harmonicNumber, levelDb, noiseSlope, oscillatorFormulas, qText, responseFormula, scopeReadout, syncedRateConversion,
  syncedRateUnderTheHood, UNDER_THE_HOOD, underTheHoodAt, widestGeekReadout,
} from './geek';
import { harmonicSeries } from './harmonics';
import { NOTE_VALUES, noteHz, noteIndex } from './tempo';

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
    expect(geekReadout('osc2Detune', 10, patch, { note: 69 })).toBe('2.55 Hz beats');
    expect(geekReadout('osc2Detune', 10, patch, { note: 60 })).toBe('1.52 Hz beats');
    expect(geekReadout('osc2Detune', -10, patch, { note: 69 })).toBe('2.53 Hz beats');
    expect(geekReadout('osc2Detune', 10, { ...patch, osc2Octave: 1 }, { note: 69 })).toBe('5.10 Hz beats');
    expect(geekReadout('osc2Detune', 50, { ...patch, osc2Octave: 2, osc2Semitone: 12 }, { note: 108 })).toBe('981 Hz beats');
    expect(geekReadout('osc2Detune', 0, patch, { note: 69 })).toBe('0.00 Hz beats');
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
    expect(geekReadout('lfoNote', noteIndex('1/4'), patch, { bpm: 120 })).toBe('0.50 s');
    expect(geekReadout('lfo2Note', noteIndex('1/4'), patch, { bpm: 90 })).toBe('0.67 s');
    expect(geekReadout('lfoNote', noteIndex('1 bar'), patch, { bpm: 120 })).toBe('2.00 s');
    expect(geekReadout('lfoNote', noteIndex('4 bars D'), patch, { bpm: 40 })).toBe('36.0 s');
    expect(geekReadout('lfoNote', noteIndex('1/32 T'), patch, { bpm: 240 })).toBe('0.021 s');
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

describe('the Synth Geek Layer: a synced Rate’s conversion, with the live numbers (issue 137)', () => {
  it('works a straight value out at the tempo: 1/8 at 120 BPM is 4 Hz', () => {
    expect(syncedRateConversion(noteIndex('1/8'), 120)).toBe('1/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz');
    expect(syncedRateConversion(noteIndex('1/4'), 120)).toBe('1/4 at 120 BPM: 120 ÷ 60 × 1 = 2 Hz');
    expect(syncedRateConversion(noteIndex('1 bar'), 60)).toBe('1 bar at 60 BPM: 60 ÷ 60 ÷ 4 = 0.25 Hz');
    expect(syncedRateConversion(noteIndex('1/32'), 240)).toBe('1/32 at 240 BPM: 240 ÷ 60 × 8 = 32 Hz');
  });

  it('a dotted value, half as long again, as a fraction: 1/4 D at 120 BPM is 4/3 Hz', () => {
    expect(syncedRateConversion(noteIndex('1/4 D'), 120)).toBe('1/4 D at 120 BPM: 120 ÷ 60 × 2/3 = 1.33 Hz');
    expect(syncedRateConversion(noteIndex('1/2 D'), 100)).toBe('1/2 D at 100 BPM: 100 ÷ 60 ÷ 3 = 0.556 Hz');
  });

  it('a triplet value, two thirds as long: 1/8 T at 90 BPM is 4.5 Hz', () => {
    expect(syncedRateConversion(noteIndex('1/8 T'), 90)).toBe('1/8 T at 90 BPM: 90 ÷ 60 × 3 = 4.5 Hz');
    expect(syncedRateConversion(noteIndex('1/4 T'), 120)).toBe('1/4 T at 120 BPM: 120 ÷ 60 × 3/2 = 3 Hz');
    expect(syncedRateConversion(noteIndex('4 bars T'), 40)).toBe('4 bars T at 40 BPM: 40 ÷ 60 × 3/32 = 0.0625 Hz');
  });

  it('its Hz is the one the engine runs the LFO at, for every note value at a few tempos', () => {
    for (const bpm of [40, 97, 120, 240])
      for (const [index] of NOTE_VALUES.entries()) {
        const hz = Number(syncedRateConversion(index, bpm).match(/= ([\d.]+) Hz$/)![1]);
        expect(hz / noteHz(index, bpm), `${NOTE_VALUES[index].name} at ${bpm}`).toBeCloseTo(1, 2);
      }
  });

  it('leads its formula under the hood, with the period the readout shows', () => {
    const { formula, where } = syncedRateUnderTheHood(noteIndex('1/8'), 120);
    expect(formula).toBe(UNDER_THE_HOOD.lfoNote.formula);
    expect(where).toMatch(/^1\/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz, one cycle every 0\.25 s\. /);
    expect(where).toContain(UNDER_THE_HOOD.lfoNote.where);
  });
});

describe('the Synth Geek Layer: Key Track (issue 169)', () => {
  const patch = { ...defaultPatch(), cutoff: 1000, keyTrack: 1 };

  it('reads the Cutoff at the Note played, the Effective Cutoff’s figure: A4 before any', () => {
    expect(geekReadout('keyTrack', 1, patch, { note: 72 })).toBe('2.00 kHz');
    expect(geekReadout('keyTrack', 1, patch, { note: 60 })).toBe('1.00 kHz');
    expect(geekReadout('keyTrack', 1, patch)).toBe('1.68 kHz'); // 1 kHz × 2^(9/12)
    expect(geekReadout('keyTrack', 0.5, patch, { note: 84 })).toBe('2.00 kHz');
    expect(geekReadout('keyTrack', 0, patch, { note: 84 })).toBe('1.00 kHz');
    expect(geekReadout('keyTrack', 1, { ...patch, cutoff: 20000 }, { note: 96 })).toBe('20.00 kHz');
    expect(geekReadout('keyTrack', 1, { ...patch, cutoff: 200 }, { note: 24 })).toBe('25 Hz'); // three octaves under C4
  });

  it('sizes it for its widest, and gives its formula', () => {
    expect(widestGeekReadout('keyTrack')).not.toHaveLength(0);
    expect(UNDER_THE_HOOD.keyTrack.formula).toBe('fc = Cutoff × 2^(k·(n − 60)/12)');
  });
});

describe('the Synth Geek Layer: the Envelopes and Glide (issue 168)', () => {
  it('works out each Envelope stage’s τ at its fader’s setting, Attack a curve too', () => {
    expect(underTheHoodAt('ampDecay', 0.3)?.where).toMatch(/^τ = Decay ÷ 4 = 75\.0 ms now/);
    expect(underTheHoodAt('filterDecay', 0.3)?.where).toMatch(/^τ = Decay ÷ 4 = 75\.0 ms now/);
    expect(underTheHoodAt('ampRelease', 0.3)?.where).toMatch(/^τ = Release ÷ 6 = 50\.0 ms now/);
    expect(underTheHoodAt('ampAttack', 0.01)?.where).toMatch(/^τ = Attack ÷ 3 = 3\.33 ms now/);
    expect(underTheHoodAt('filterRelease', 10)?.where).toMatch(/^τ = Release ÷ 6 = 1\.67 s now/);
    expect(underTheHoodAt('ampDecay', 0.001)?.where).toMatch(/^τ = Decay ÷ 4 = 0\.250 ms now/);
  });

  it('says how far each curve gets: 63 % in one τ, and where it is at the stage’s time', () => {
    expect(underTheHoodAt('ampAttack', 0.01)?.where).toContain('63 %');
    expect(underTheHoodAt('ampAttack', 0.01)?.where).toContain('95 %');
    expect(underTheHoodAt('ampAttack', 0.01)?.where).toContain('not a straight rise');
    expect(underTheHoodAt('ampDecay', 0.3)?.where).toContain('98 %');
    expect(underTheHoodAt('ampRelease', 0.3)?.where).toContain('99.75 %');
    expect(underTheHoodAt('ampAttack', 0.01)?.formula).toBe('x = 1 − (1 − x₀)·e^(−t/τ)');
    expect(underTheHoodAt('ampDecay', 0.3)?.formula).toBe('x = S + (x₀ − S)·e^(−t/τ)');
    expect(underTheHoodAt('ampRelease', 0.3)?.formula).toBe('x = x₀·e^(−t/τ)');
  });

  it('writes a τ a hair under a second as the second it rounds to', () => {
    expect(underTheHoodAt('ampDecay', 3.9984)?.where).toMatch(/^τ = Decay ÷ 4 = 1\.00 s now/);
  });

  it('gives Glide’s slide curve and its τ, with no live number (issue 133, decision 10)', () => {
    expect(UNDER_THE_HOOD.glide.formula).toBe('f = f₂ + (f₁ − f₂)·e^(−t/τ)');
    expect(UNDER_THE_HOOD.glide.where).toMatch(/^τ = Glide ÷ 4\. /);
    expect(UNDER_THE_HOOD.glide.where).not.toContain('now');
    expect(underTheHoodAt('glide', 0.4)).toBeUndefined();
  });

  it('has none for the other controls', () => {
    expect(underTheHoodAt('ampSustain', 0.5)).toBeUndefined();
    expect(underTheHoodAt('cutoff', 1000)).toBeUndefined();
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

// Issue 170: the Viewers' numbers (issue 133, decision 11).
describe('the Synth Geek Layer on the Viewers (issue 170)', () => {
  it('writes the period and frequency of the fundamental the Scope holds still on, A4 said before any Note', () => {
    expect(scopeReadout(440, 69)).toBe('2.27 ms · 440 Hz');
    expect(scopeReadout(261.6256, 60)).toBe('3.82 ms · 261.6 Hz');
    expect(scopeReadout(440, null)).toBe('2.27 ms · 440 Hz at A4');
    // Three figures for the period, from a C8 to a Sub two octaves under an A0.
    expect(scopeReadout(4186.009, 108)).toBe('0.239 ms · 4186 Hz');
    expect(scopeReadout(27.5, 21)).toBe('36.4 ms · 27.5 Hz');
    expect(scopeReadout(1.71875, 21)).toBe('582 ms · 1.72 Hz');
  });

  it('numbers the Harmonic a frequency is on, and none between two or where the Spectrum cannot part them', () => {
    const binHz = 48000 / 8192;
    expect(harmonicNumber(1320.4, 440, binHz)).toBe(3);
    expect(harmonicNumber(440, 440, binHz)).toBe(1);
    expect(harmonicNumber(1540, 440, binHz)).toBeUndefined(); // 3.5 × f₀: between the 3rd and the 4th
    expect(harmonicNumber(1386, 440, binHz)).toBeUndefined(); // 3.15 ×: a Ring product beside the 3rd, not on it
    expect(harmonicNumber(100, 440, binHz)).toBeUndefined(); // under the fundamental
    expect(harmonicNumber(33, 11, binHz)).toBeUndefined(); // Harmonics under 4 bins apart are not told apart
  });

  it('gives the Noise’s slope while it is up, white or pink', () => {
    expect(noiseSlope({ ...defaultPatch(), mixNoise: 0 })).toBeUndefined();
    expect(noiseSlope({ ...defaultPatch(), mixNoise: 0.5, noiseColour: 'pink' })).toBe('pink: −3 dB/oct');
    expect(noiseSlope({ ...defaultPatch(), mixNoise: 0.5, noiseColour: 'white' })).toBe('white: 0 dB/oct');
  });
});
