import { describe, expect, it } from 'vitest';
import { harmonicSeries, type Waveform } from '../music/harmonics';
import { defaultPatch, type Patch } from '../patch/patch';
import { amplitudeToSpectrumDb } from '../viewers/spectrumScale';
import { dB, frequencyAround, rms, toneAmplitude, toneAmplitudeHann } from '../test/measure';
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
    engine.pitchChange(69); // now, as live playing does: fundamental() reports what is sounding at this moment
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

describe('Osc 2 Pulse Width', () => {
  it('shapes Osc 2 by its own width, whatever Osc 1’s is', async () => {
    const solo2 = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, mixOsc1: 0, mixOsc2: 1, osc2Waveform: 'pulse', waveform: 'pulse' } as const;
    const s = await render(1, { ...solo2, pulseWidth: 0.5, osc2PulseWidth: 0.25 }, (e) => e.noteOn(45, 1, 0));
    const window = s.subarray(SR / 2, SR / 2 + Math.round((40 * SR) / 110));
    const h = (n: number) => toneAmplitude(window, SR, 110 * n);
    expect(dB(h(4) / h(1)), '25%: every 4th Harmonic missing').toBeLessThan(-40);
    expect(dB(h(2) / h(1)), '25%: even Harmonics present (a 50% pulse would have none)').toBeGreaterThan(-6);
  });
});

describe('Filter Modes and Slopes', () => {
  const MODES = ['lowpass', 'highpass', 'bandpass', 'notch'] as const;
  const harmonics = Float32Array.from({ length: 40 }, (_, i) => 110 * (i + 1));

  async function measure(mode: (typeof MODES)[number], slope: 12 | 24, resonance = 0.4) {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), cutoff: 1000, resonance, filterMode: mode, filterSlope: slope, ampSustain: 1, ampAttack: 0.001 });
    engine.noteOn(45, 1, 0);
    const taps = ctx.suspend(0.5).then(() => {
      const read = (a: AnalyserNode) => {
        const s = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(s);
        return s;
      };
      const out = { osc: read(engine.taps.oscillator), filter: read(engine.taps.filter), curve: engine.filterResponse(harmonics) };
      void ctx.resume();
      return out;
    });
    await ctx.startRendering();
    return taps;
  }

  for (const mode of MODES) {
    for (const slope of [12, 24] as const) {
      it(`plays exactly the Response Curve it draws: ${mode}, ${slope} dB`, async () => {
        const { osc, filter, curve } = await measure(mode, slope);
        for (let i = 0; i < harmonics.length; i++) {
          if (dB(curve[i]) < -40) continue; // too deep to measure against the analyser's floor
          const measured = dB(toneAmplitudeHann(filter, SR, harmonics[i]) / toneAmplitudeHann(osc, SR, harmonics[i]));
          expect(Math.abs(measured - dB(curve[i])), `${harmonics[i]} Hz`).toBeLessThan(0.5);
        }
      });
    }
  }

  it('passes and stops the right regions in each mode (Cutoff 1 kHz)', async () => {
    const at = (curve: Float32Array, n: number) => dB(curve[n - 1]);
    const lp = (await measure('lowpass', 12)).curve;
    expect(at(lp, 2)).toBeGreaterThan(-1);
    expect(at(lp, 40)).toBeLessThan(-20);
    const hp = (await measure('highpass', 12)).curve;
    expect(at(hp, 2)).toBeLessThan(-20);
    expect(at(hp, 40)).toBeGreaterThan(-1);
    const bp = (await measure('bandpass', 12)).curve;
    expect(at(bp, 9)).toBeGreaterThan(-3); // 990 Hz, at the centre
    expect(at(bp, 2)).toBeLessThan(-10);
    expect(at(bp, 40)).toBeLessThan(-10);
    const notch = (await measure('notch', 12)).curve;
    expect(at(notch, 9)).toBeLessThan(-20);
    expect(at(notch, 2)).toBeGreaterThan(-1);
    expect(at(notch, 40)).toBeGreaterThan(-1);
  });

  it('falls about twice as steeply at 24 dB as at 12 dB, an octave past the Cutoff', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    const octaveAbove = (slope: 12 | 24) => {
      engine.applyPatch({ ...defaultPatch(), cutoff: 1000, resonance: 0, filterSlope: slope });
      return dB(engine.filterResponse(Float32Array.of(2000))[0]);
    };
    expect(octaveAbove(24) / octaveAbove(12)).toBeGreaterThan(1.7);
    expect(octaveAbove(24) / octaveAbove(12)).toBeLessThan(2.3);
  });

  it('peaks as high at 24 dB as at 12 dB for the same Resonance', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    const scan = Float32Array.from({ length: 400 }, (_, i) => 500 * 2 ** (i / 200)); // 500 Hz – 2 kHz
    const peak = (slope: 12 | 24, resonance: number) => {
      engine.applyPatch({ ...defaultPatch(), cutoff: 1000, resonance, filterSlope: slope });
      return dB(Math.max(...engine.filterResponse(scan)));
    };
    for (const r of [0.5, 0.8]) expect(Math.abs(peak(24, r) - peak(12, r)), `Resonance ${r}`).toBeLessThan(2);
  });
});

describe('LFO (model-driven, ADR-0003)', () => {
  const clean = { resonance: 0, ampSustain: 1, ampAttack: 0.001 } as const;
  const window = (s: Float32Array, t: number, n = 2048) => s.subarray(Math.round(t * SR) - n / 2, Math.round(t * SR) + n / 2);

  it('swings the Cutoff an octave each way at half Amount, at its Rate and in step with the model', async () => {
    const lfo = { ...clean, cutoff: 1000, lfoAmount: 0.5, lfoRate: 1, lfoDestination: 'cutoff', lfoWaveform: 'sine' } as const;
    let engine!: ReturnType<typeof createSynthEngine>;
    const swung = await render(2.2, lfo, (e) => {
      engine = e;
      e.noteOn(45, 1, 0);
    });
    const open = await render(2.2, { ...clean, cutoff: 20000 }, (e) => e.noteOn(45, 1, 0));
    const expected = (cutoff: number) => {
      const twin = new OfflineAudioContext(1, 128, SR).createBiquadFilter();
      twin.frequency.value = cutoff;
      twin.Q.value = -3.01;
      const mag = new Float32Array(1);
      twin.getFrequencyResponse(Float32Array.of(1320), mag, new Float32Array(1));
      return dB(mag[0]);
    };
    for (const [t, cutoff] of [[1.25, 2000], [1.75, 500]] as const) {
      expect(engine.modulationAt(t).cutoff, `model at ${t} s`).toBeCloseTo(cutoff, -1);
      const measured = dB(toneAmplitudeHann(window(swung, t), SR, 1320) / toneAmplitudeHann(window(open, t), SR, 1320));
      expect(Math.abs(measured - expected(cutoff)), `sound at ${t} s`).toBeLessThan(0.7);
    }
  });

  it('makes a vibrato of up to a semitone each way when aimed at the pitch', async () => {
    const s = await render(1.6, { ...clean, cutoff: 20000, waveform: 'sine', lfoAmount: 1, lfoRate: 2, lfoDestination: 'pitch' }, (e) => e.noteOn(69, 1, 0));
    expect(frequencyAround(s, SR, 1.125, 0.02) / 440).toBeCloseTo(2 ** (1 / 12), 2);
    expect(frequencyAround(s, SR, 1.375, 0.02) / 440).toBeCloseTo(2 ** (-1 / 12), 2);
  });

  it('modulates Pulse Width, changing the Harmonic pattern (PWM)', async () => {
    const s = await render(1.7, { ...clean, cutoff: 20000, waveform: 'pulse', pulseWidth: 0.5, lfoAmount: 1, lfoRate: 0.5, lfoDestination: 'pulseWidth' }, (e) =>
      e.noteOn(57, 1, 0),
    );
    const h = (t: number, n: number) => toneAmplitudeHann(window(s, t, 4096), SR, 220 * n);
    // Width 90% at t = 0.5 s: |sin(2π·0.9)|/2 ÷ |sin(π·0.9)| ≈ 0.95 → about −0.4 dB
    expect(dB(h(0.5, 2) / h(0.5, 1))).toBeCloseTo(dB(Math.abs(Math.sin(2 * Math.PI * 0.9)) / 2 / Math.sin(Math.PI * 0.9)), 0);
    // Width 50% at t = 1 s (a square): no even Harmonics
    expect(dB(h(1, 2) / h(1, 1))).toBeLessThan(-15);
  });
});

describe('Glide', () => {
  it('slides the pitch to the new Note over the Glide time, as the model says, and Cycle Lock follows it', async () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), cutoff: 20000, waveform: 'sine', glide: 0.4, ampSustain: 1, ampAttack: 0.001 });
    engine.noteOn(57, 1, 0); // 220 Hz
    engine.noteOn(69, 1, 0.5); // to 440 Hz
    let followed = 0;
    const midSlide = ctx.suspend(0.6).then(() => {
      followed = engine.fundamental();
      void ctx.resume();
    });
    const s = (await ctx.startRendering()).getChannelData(0);
    await midSlide;
    const model = 440 + (220 - 440) * Math.exp(-1); // 0.1 s into a 0.4 s Glide
    expect(frequencyAround(s, SR, 0.6, 0.012) / model).toBeCloseTo(1, 1);
    expect(followed / model).toBeCloseTo(1, 2);
    expect(frequencyAround(s, SR, 0.25, 0.02)).toBeCloseTo(220, 0); // the first Note does not glide in
  });

  it('jumps straight to the new Note when Glide is off', async () => {
    const s = await render(1, { cutoff: 20000, waveform: 'sine', ampSustain: 1, ampAttack: 0.001 }, (e) => {
      e.noteOn(57, 1, 0);
      e.noteOn(69, 1, 0.5);
    });
    expect(frequencyAround(s, SR, 0.53, 0.02)).toBeCloseTo(440, 0);
  });
});

describe('Velocity → Cutoff', () => {
  it('opens the Filter for harder hits, and the sound follows the model', async () => {
    const harmonics = Float32Array.from({ length: 20 }, (_, i) => 110 * (i + 1));
    for (const velocity of [0.5, 1]) {
      const ctx = new OfflineAudioContext(1, SR, SR);
      const engine = createSynthEngine(ctx);
      engine.applyPatch({ ...defaultPatch(), cutoff: 300, resonance: 0, velocityCutoff: 1, ampSustain: 1, ampAttack: 0.001 });
      engine.noteOn(45, velocity, 0);
      const frame = ctx.suspend(0.5).then(() => {
        const read = (a: AnalyserNode) => {
          const s = new Float32Array(a.fftSize);
          a.getFloatTimeDomainData(s);
          return s;
        };
        const out = { osc: read(engine.taps.oscillator), filter: read(engine.taps.filter), curve: engine.filterResponse(harmonics), cutoff: engine.modulationAt(0.5).cutoff };
        void ctx.resume();
        return out;
      });
      await ctx.startRendering();
      const { osc, filter, curve, cutoff } = await frame;
      expect(cutoff, `velocity ${velocity}`).toBeCloseTo(300 * 2 ** (2 * velocity), -1);
      for (let i = 0; i < harmonics.length; i++) {
        if (dB(curve[i]) < -40) continue;
        const measured = dB(toneAmplitudeHann(filter, SR, harmonics[i]) / toneAmplitudeHann(osc, SR, harmonics[i]));
        expect(Math.abs(measured - dB(curve[i])), `${harmonics[i]} Hz at velocity ${velocity}`).toBeLessThan(0.5);
      }
    }
  });
});

describe('Key Track', () => {
  /** Renders a Note and reads both Taps, the Response Curve and the model at `when`. */
  async function measureAt(patch: Partial<Patch>, play: (e: ReturnType<typeof createSynthEngine>) => void, when: number, harmonics: Float32Array<ArrayBuffer>) {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), resonance: 0, ampSustain: 1, ampAttack: 0.001, ...patch });
    play(engine);
    const frame = ctx.suspend(when).then(() => {
      const read = (a: AnalyserNode) => {
        const s = new Float32Array(a.fftSize);
        a.getFloatTimeDomainData(s);
        return s;
      };
      const out = { osc: read(engine.taps.oscillator), filter: read(engine.taps.filter), curve: engine.filterResponse(harmonics), cutoff: engine.modulationAt(when).cutoff };
      void ctx.resume();
      return out;
    });
    await ctx.startRendering();
    return frame;
  }

  it('moves the Cutoff an octave per octave from C4 at 100 %, and the sound follows the model', async () => {
    for (const [note, expected] of [[60, 600], [72, 1200], [48, 300]] as const) {
      const f0 = 440 * 2 ** ((note - 69) / 12);
      const harmonics = Float32Array.from({ length: 12 }, (_, i) => f0 * (i + 1));
      const { osc, filter, curve, cutoff } = await measureAt({ cutoff: 600, keyTrack: 1 }, (e) => e.noteOn(note, 1, 0), 0.5, harmonics);
      expect(cutoff, `note ${note}`).toBeCloseTo(expected, -1);
      for (let i = 0; i < harmonics.length; i++) {
        if (dB(curve[i]) < -40) continue;
        const measured = dB(toneAmplitudeHann(filter, SR, harmonics[i]) / toneAmplitudeHann(osc, SR, harmonics[i]));
        expect(Math.abs(measured - dB(curve[i])), `${harmonics[i].toFixed(0)} Hz, note ${note}`).toBeLessThan(0.5);
      }
    }
  });

  it('slides with the Glide, the same way as the model', async () => {
    const harmonics = Float32Array.from({ length: 4 }, (_, i) => 1000 * (i + 1));
    const { cutoff } = await measureAt(
      { cutoff: 600, keyTrack: 1, glide: 0.4 },
      (e) => {
        e.noteOn(60, 1, 0);
        e.noteOn(72, 1, 0.5);
      },
      0.6,
      harmonics,
    );
    // 0.1 s into a 0.4 s Glide (time constant 0.1 s): the tracked Note is 1 − e⁻¹ of the way from C4 to C5.
    const note = 72 + (60 - 72) * Math.exp(-1);
    expect(cutoff / (600 * 2 ** ((note - 60) / 12))).toBeCloseTo(1, 2);
  });

  it('changes nothing at 0 %, whatever the Note', async () => {
    const { cutoff } = await measureAt({ cutoff: 600 }, (e) => e.noteOn(84, 1, 0), 0.3, Float32Array.of(1000));
    expect(cutoff).toBeCloseTo(600, 0);
  });
});
