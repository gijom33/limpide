import { describe, expect, it } from 'vitest';
import { harmonicSeries, type Waveform } from '../music/harmonics';
import { defaultPatch, type Patch } from '../patch/patch';
import { amplitudeToSpectrumDb } from '../viewers/spectrumScale';
import { dB, rms, toneAmplitude, toneAmplitudeHann } from '../test/measure';
import { createSynthEngine, OSCILLATOR_LEVEL } from './synthEngine';

const SR = 48000;

async function render(seconds: number, patch: Partial<Patch>, play: (e: ReturnType<typeof createSynthEngine>) => void) {
  const ctx = new OfflineAudioContext(1, SR * seconds, SR);
  const engine = createSynthEngine(ctx);
  engine.applyPatch({ ...defaultPatch(), ...patch });
  play(engine);
  return (await ctx.startRendering()).getChannelData(0);
}

describe('saw through the low-pass Filter', () => {
  const A2 = 45; // 110 Hz
  const steady = { resonance: 0, ampAttack: 0.001, ampSustain: 1 };
  // Measure over the last half-second, well after the attack, as a whole number of 110 Hz periods.
  const window = (s: Float32Array) => [s.length - SR / 2, s.length] as const;
  const harmonic = (s: Float32Array, n: number) => toneAmplitude(s, SR, 110 * n, ...window(s));

  it('leaves the saw spectrum at 1/n when the Cutoff is wide open (control case)', async () => {
    const s = await render(1, { ...steady, cutoff: 20000 }, (e) => e.noteOn(A2, 1, 0));
    expect(dB(harmonic(s, 20) / harmonic(s, 2))).toBeCloseTo(dB(2 / 20), 0);
  });

  it('attenuates Harmonics above 2 kHz by at least 10 dB more than theory when the Cutoff is 1 kHz', async () => {
    const s = await render(1, { ...steady, cutoff: 1000 }, (e) => e.noteOn(A2, 1, 0));
    const relative = dB(harmonic(s, 20) / harmonic(s, 2)); // 2.2 kHz vs 220 Hz
    expect(relative).toBeLessThan(dB(2 / 20) - 10);
  });
});

describe('Amp Envelope', () => {
  const patch = { cutoff: 20000, ampAttack: 0.001, ampDecay: 0.01, ampRelease: 0.05 };
  const at = (t: number) => Math.round(t * SR);

  async function play(sustain: number) {
    return render(1, { ...patch, ampSustain: sustain }, (e) => {
      e.noteOn(57, 1, 0.1);
      e.noteOff(0.5);
    });
  }

  it('is silent before the Gate opens', async () => {
    const s = await play(1);
    expect(rms(s, 0, at(0.1))).toBe(0);
  });

  it('holds at the Sustain level while the Gate is open', async () => {
    const full = await play(1);
    const half = await play(0.5);
    const ratio = rms(half, at(0.3), at(0.45)) / rms(full, at(0.3), at(0.45));
    expect(ratio).toBeCloseTo(0.5, 1);
  });

  it('fades to silence after Release once the Gate closes', async () => {
    const s = await play(1);
    expect(rms(s, at(0.8), at(1))).toBeLessThan(rms(s, at(0.3), at(0.45)) * 0.001);
  });
});

/** Renders until `at` seconds, then returns what each Tap's analyser holds at that moment. */
async function tapsAt(at: number, patch: Partial<Patch>, note = 45) {
  const ctx = new OfflineAudioContext(1, SR * (at + 0.1), SR);
  const engine = createSynthEngine(ctx);
  engine.applyPatch({ ...defaultPatch(), ...patch });
  engine.noteOn(note, 1, 0);
  const read = (a: AnalyserNode) => {
    const s = new Float32Array(a.fftSize);
    a.getFloatTimeDomainData(s);
    return s;
  };
  const captured = ctx.suspend(at).then(() => {
    const taps = { oscillator: read(engine.taps.oscillator), filter: read(engine.taps.filter), amp: read(engine.taps.amp) };
    void ctx.resume();
    return taps;
  });
  await ctx.startRendering();
  return captured;
}

describe('Taps', () => {
  const level20th = (s: Float32Array) => toneAmplitude(s, SR, 110 * 20);
  const fundamental = (s: Float32Array) => toneAmplitude(s, SR, 110);

  it('shows high Harmonics at the Oscillator Tap that the Filter Tap has lost when the Cutoff is low', async () => {
    const taps = await tapsAt(0.5, { cutoff: 300, resonance: 0, ampSustain: 1, ampAttack: 0.001 });
    expect(dB(level20th(taps.oscillator) / fundamental(taps.oscillator))).toBeCloseTo(dB(1 / 20), 0);
    expect(dB(level20th(taps.filter) / level20th(taps.oscillator))).toBeLessThan(-30);
  });

  it('shows the Amp Envelope only at the Amp Tap', async () => {
    const taps = await tapsAt(0.5, { cutoff: 20000, ampSustain: 0.25, ampAttack: 0.001, ampDecay: 0.01 });
    const ratio = rms(taps.amp) / rms(taps.filter);
    const fullSustainTaps = await tapsAt(0.5, { cutoff: 20000, ampSustain: 1, ampAttack: 0.001 });
    expect(ratio / (rms(fullSustainTaps.amp) / rms(fullSustainTaps.filter))).toBeCloseTo(0.25, 1);
  });
});

describe('shared scale across Taps', () => {
  const peak = (s: Float32Array) => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

  it('runs the Oscillator at the nominal level of 0.5 (−6 dB), leaving headroom for Resonance', async () => {
    const taps = await tapsAt(0.5, { cutoff: 20000 });
    expect(peak(taps.oscillator)).toBeCloseTo(OSCILLATOR_LEVEL, 1);
    expect(OSCILLATOR_LEVEL).toBe(0.5);
  });

  it('shows the Amp Tap at the same scale as the Filter Tap when the Amp Envelope is fully open', async () => {
    const taps = await tapsAt(0.5, { cutoff: 1000, ampSustain: 1, ampAttack: 0.001 });
    expect(rms(taps.amp) / rms(taps.filter)).toBeCloseTo(1, 2);
  });

  it('keeps every Tap within ±1 while Resonance is off; only Resonance can push the Filter Tap past it (OVER)', async () => {
    let worst = 0;
    for (const note of [24, 36, 48, 60, 72, 84]) {
      for (const cutoff of [100, 300, 873, 2000, 6000]) {
        const taps = await tapsAt(0.4, { cutoff, resonance: 0, ampSustain: 1, ampAttack: 0.001 }, note);
        worst = Math.max(worst, peak(taps.oscillator), peak(taps.filter), peak(taps.amp));
      }
    }
    expect(worst).toBeLessThan(0.8);
  });

  it('plays an open saw at the Nominal Level times the master volume (0.5 × 0.45)', async () => {
    const s = await render(0.5, { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001 }, (e) => e.noteOn(45, 1, 0));
    expect(peak(s.subarray(SR * 0.25))).toBeCloseTo(0.225, 1);
  });
});

describe('fundamental', () => {
  it('reports the sounding Note’s frequency for Cycle Lock, starting at A4 because the Oscillator runs from the start', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    engine.applyPatch(defaultPatch());
    expect(engine.fundamental()).toBeCloseTo(440);
    engine.noteOn(57, 1, 0);
    expect(engine.fundamental()).toBeCloseTo(220);
    engine.pitchChange(69, 0.1);
    expect(engine.fundamental()).toBeCloseTo(440);
  });
});

describe('headroom', () => {
  it('never exceeds full scale at the output, even at maximum Resonance, Velocity and Sustain', async () => {
    let worst = 0;
    for (const note of [24, 36, 48, 60, 72, 84]) {
      for (const cutoff of [60, 100, 150, 220, 300, 450, 600, 873, 1300, 2000, 3000, 6000]) {
        const s = await render(0.6, { cutoff, resonance: 1, ampSustain: 1, ampAttack: 0.001 }, (e) => e.noteOn(note, 1, 0));
        for (const v of s) worst = Math.max(worst, Math.abs(v));
      }
    }
    expect(worst).toBeLessThan(1);
  });
});

describe('Waveforms match their Ideal Reference', () => {
  const A2 = 45;
  const F = 110;
  const open = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001 };

  async function measuredHarmonics(waveform: Waveform, pulseWidth: number) {
    const s = await render(1, { ...open, waveform, pulseWidth }, (e) => e.noteOn(A2, 1, 0));
    // A whole number of periods, so each Harmonic falls exactly on the Goertzel frequency.
    const from = SR / 2;
    const to = from + Math.round((40 * SR) / F);
    return (n: number) => toneAmplitude(s, SR, F * n, from, to);
  }

  for (const [waveform, pulseWidth] of [['saw', 0.5], ['square', 0.5], ['triangle', 0.5], ['pulse', 0.25], ['pulse', 0.1]] as const) {
    it(`plays a ${waveform}${waveform === 'pulse' ? ` at ${pulseWidth * 100}%` : ''} with the Harmonic levels of its Fourier series`, async () => {
      const ideal = harmonicSeries(waveform, pulseWidth, 64).magnitudes;
      const measured = await measuredHarmonics(waveform, pulseWidth);
      const fundamental = measured(1);
      for (let n = 2; n <= 12; n++) {
        if (ideal[n] / ideal[1] < 1e-3) {
          expect(dB(measured(n) / fundamental), `harmonic ${n} should be absent`).toBeLessThan(-40);
        } else {
          expect(dB(measured(n) / fundamental), `harmonic ${n}`).toBeCloseTo(dB(ideal[n] / ideal[1]), 0);
        }
      }
    });
  }
});

describe('Spectrum calibration', () => {
  it('reads a sine at the Nominal Level where the Ideal Reference will draw it', async () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), waveform: 'sine' });
    const bins = new Float32Array(engine.taps.oscillator.frequencyBinCount);
    const read = ctx.suspend(0.5).then(() => {
      engine.taps.oscillator.getFloatFrequencyData(bins);
      void ctx.resume();
    });
    await ctx.startRendering();
    await read;
    const peak = Math.max(...bins);
    // ±1.2 dB: the Blackman window's scalloping when the tone falls between FFT bins.
    expect(Math.abs(peak - amplitudeToSpectrumDb(OSCILLATOR_LEVEL))).toBeLessThan(1.2);
  });
});

describe('filterResponse (the Response Curve)', () => {
  it('matches the attenuation actually measured between the Oscillator and Filter Taps, Harmonic by Harmonic', async () => {
    const patch = { cutoff: 1000, resonance: 0.6, ampSustain: 1, ampAttack: 0.001 };
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...patch });
    engine.noteOn(45, 1, 0); // 110 Hz saw
    const taps = ctx.suspend(0.5).then(() => {
      const read = (a: AnalyserNode) => {
        const s = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(s);
        return s;
      };
      const out = { osc: read(engine.taps.oscillator), filter: read(engine.taps.filter) };
      void ctx.resume();
      return out;
    });
    await ctx.startRendering();
    const { osc, filter } = await taps;

    const harmonics = Float32Array.from({ length: 30 }, (_, i) => 110 * (i + 1));
    const curve = engine.filterResponse(harmonics);
    for (let i = 0; i < harmonics.length; i++) {
      const measured = dB(toneAmplitudeHann(filter, SR, harmonics[i]) / toneAmplitudeHann(osc, SR, harmonics[i]));
      expect(Math.abs(measured - dB(curve[i])), `${harmonics[i]} Hz: measured ${measured.toFixed(2)} dB`).toBeLessThan(0.5);
    }
  });

  it('shows the Resonance peak at the Cutoff, above the pass band', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    engine.applyPatch({ ...defaultPatch(), cutoff: 1000, resonance: 0.8 });
    const [passBand, atCutoff, octaveAbove] = engine.filterResponse(Float32Array.of(100, 1000, 2000));
    expect(dB(atCutoff / passBand)).toBeGreaterThan(15);
    expect(dB(octaveAbove / passBand)).toBeLessThan(-6);
  });
});

describe('Filter Envelope (model-driven automation, ADR-0003)', () => {
  /** Renders, and at each of `times` captures both Taps plus what the engine reports at that moment. */
  async function captureAt(times: number[], patch: Partial<Patch>, play: (e: ReturnType<typeof createSynthEngine>) => void) {
    const ctx = new OfflineAudioContext(1, SR * (Math.max(...times) + 0.2), SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...patch });
    play(engine);
    const read = (a: AnalyserNode) => {
      const s = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(s);
      return s;
    };
    const frames = times.map((t) =>
      ctx.suspend(t).then(() => {
        const frame = {
          osc: read(engine.taps.oscillator),
          filter: read(engine.taps.filter),
          amp: read(engine.taps.amp),
          modulation: engine.modulationAt(t),
          response: engine.filterResponse(Float32Array.from({ length: 30 }, (_, i) => 110 * (i + 1))),
        };
        void ctx.resume();
        return frame;
      }),
    );
    await ctx.startRendering();
    return Promise.all(frames);
  }

  const envelope = { cutoff: 200, resonance: 0, filterEnvAmount: 3, filterAttack: 0.001, filterDecay: 0.05, filterSustain: 1, filterRelease: 0.05 };

  it('raises the Effective Cutoff by the Envelope Amount, and the sound follows the model', async () => {
    const [held, released] = await captureAt([0.6, 1.6], { ...envelope, ampSustain: 1, ampAttack: 0.001, ampRelease: 5 }, (e) => {
      e.noteOn(45, 1, 0);
      e.noteOff(1);
    });
    expect(held.modulation.cutoff).toBeCloseTo(1600, -1); // 200 Hz × 2³ while the Envelope is held open
    expect(released.modulation.cutoff).toBeCloseTo(200, 0); // back to the Cutoff after Release

    for (const frame of [held, released]) {
      for (let i = 0; i < 30; i++) {
        const f = 110 * (i + 1);
        const measured = dB(toneAmplitudeHann(frame.filter, SR, f) / toneAmplitudeHann(frame.osc, SR, f));
        expect(Math.abs(measured - dB(frame.response[i])), `${f} Hz at ${frame.modulation.cutoff.toFixed(0)} Hz`).toBeLessThan(0.5);
      }
    }
  });

  it('changes nothing while the Envelope Amount is zero', async () => {
    const [frame] = await captureAt([0.5], { ...envelope, filterEnvAmount: 0 }, (e) => e.noteOn(45, 1, 0));
    expect(frame.modulation.cutoff).toBe(200);
  });

  it('reports the Amp Envelope level the Amp Tap actually has', async () => {
    const [frame] = await captureAt([0.6], { cutoff: 20000, ampAttack: 0.001, ampDecay: 0.05, ampSustain: 0.5 }, (e) => e.noteOn(45, 0.6, 0));
    expect(frame.modulation.amp).toBeCloseTo(0.3, 3);
    expect(rms(frame.amp) / rms(frame.filter)).toBeCloseTo(0.3, 2);
  });
});

describe('Resonance and level', () => {
  it('leaves the pass band at full level: Resonance only adds the peak at the Cutoff', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    for (const resonance of [0, 0.5, 1]) {
      engine.applyPatch({ ...defaultPatch(), cutoff: 2000, resonance });
      const [passBand] = engine.filterResponse(Float32Array.of(40));
      expect(dB(passBand), `Resonance ${resonance}`).toBeCloseTo(0, 1);
    }
  });
});

describe('modulationAt for past moments (the Envelope Timeline)', () => {
  it('uses the Cutoff that was in force at that moment, so a hand sweep is drawn as a sweep', async () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), cutoff: 300 });
    const changed = ctx.suspend(0.5).then(() => {
      engine.applyPatch({ ...defaultPatch(), cutoff: 3000 });
      void ctx.resume();
    });
    await ctx.startRendering();
    await changed;
    expect(engine.modulationAt(0.25).cutoff).toBe(300);
    expect(engine.modulationAt(0.75).cutoff).toBe(3000);
  });
});

describe('Osc 2, Noise and the Mixer', () => {
  const A2 = 45; // 110 Hz
  const clean = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine' } as const;
  const steady = (s: Float32Array) => s.subarray(SR / 2, SR / 2 + Math.round((40 * SR) / 110)); // 40 whole periods

  it('adds energy at twice the fundamental when Osc 2 is an octave up', async () => {
    const off = steady(await render(1, { ...clean, mixOsc2: 0, osc2Octave: 1 }, (e) => e.noteOn(A2, 1, 0)));
    const on = steady(await render(1, { ...clean, mixOsc2: 1, osc2Octave: 1 }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(off, SR, 220) / toneAmplitude(off, SR, 110))).toBeLessThan(-60);
    expect(dB(toneAmplitude(on, SR, 220) / toneAmplitude(on, SR, 110))).toBeCloseTo(0, 0);
  });

  it('moves Osc 2 by its Semitone offset (a fifth: 7 semitones)', async () => {
    const s = await render(1, { ...clean, mixOsc2: 1, osc2Semitone: 7 }, (e) => e.noteOn(A2, 1, 0));
    const window = s.subarray(SR / 2, SR / 2 + 8192);
    const fifth = 110 * 2 ** (7 / 12);
    expect(dB(toneAmplitudeHann(window, SR, fifth) / toneAmplitudeHann(window, SR, 110))).toBeCloseTo(0, 0);
  });

  it('makes the sound beat at the Detune difference', async () => {
    const s = await render(2.2, { ...clean, mixOsc2: 1, osc2Detune: 20 }, (e) => e.noteOn(A2, 1, 0));
    const beat = 110 * (2 ** (20 / 1200) - 1); // ≈ 1.28 Hz: one swell every ~0.8 s
    const levels: number[] = [];
    for (let t = 0.2; t < 2.2 - 0.02; t += 0.02) levels.push(rms(s, Math.round(t * SR), Math.round((t + 0.02) * SR)));
    expect(Math.max(...levels) / Math.min(...levels)).toBeGreaterThan(5);
    expect(beat).toBeGreaterThan(1);
  });

  it('fills the gaps between Harmonics with Noise', async () => {
    const between = 165; // halfway between the 1st and 2nd Harmonic of 110 Hz
    const quiet = steady(await render(1, { cutoff: 20000, mixNoise: 0, ampSustain: 1 }, (e) => e.noteOn(A2, 1, 0)));
    const noisy = steady(await render(1, { cutoff: 20000, mixNoise: 0.5, ampSustain: 1 }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(noisy, SR, between) / toneAmplitude(quiet, SR, between))).toBeGreaterThan(30);
  });

  it('keeps the Harmonic Markers on Osc 1, whatever Osc 2 is tuned to', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    engine.applyPatch({ ...defaultPatch(), mixOsc2: 1, osc2Octave: 2, osc2Semitone: 5 });
    engine.noteOn(57, 1, 0);
    expect(engine.fundamental()).toBeCloseTo(220);
  });

  it('shows the Mixer’s output at the Oscillator Tap', async () => {
    const full = await tapsAt(0.5, { ...clean, mixOsc1: 1 });
    const half = await tapsAt(0.5, { ...clean, mixOsc1: 0.5 });
    expect(rms(half.oscillator) / rms(full.oscillator)).toBeCloseTo(0.5, 2);
  });

  it('never exceeds full scale at the output with every source at full level and maximum Resonance', async () => {
    let worst = 0;
    const loud = { resonance: 1, ampSustain: 1, ampAttack: 0.001, mixOsc1: 1, mixOsc2: 1, mixNoise: 1, osc2Octave: 1 };
    for (const note of [24, 48, 72]) {
      for (const cutoff of [100, 300, 873, 3000]) {
        const s = await render(0.6, { ...loud, cutoff }, (e) => e.noteOn(note, 1, 0));
        for (const v of s) worst = Math.max(worst, Math.abs(v));
      }
    }
    expect(worst).toBeLessThan(1);
  });
});
