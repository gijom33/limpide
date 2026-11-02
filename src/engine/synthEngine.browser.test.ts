import { describe, expect, it } from 'vitest';
import { DIP, envelopeLevel, type GateEvent } from '../modulation/envelope';
import { lfoOffset, osc2Cents } from '../modulation/modulationModel';
import { geekReadout, UNDER_THE_HOOD, underTheHoodAt } from '../music/geek';
import { harmonicSeries, type Waveform } from '../music/harmonics';
import { fmDepthKept, idealPartials, idealReference } from '../music/idealReference';
import { noteIndex } from '../music/tempo';
import { defaultPatch, type Patch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { betweenHarmonicsDb, dB, energyAboveDb, frequencyAround, rms, toneAmplitude, toneAmplitudeHann } from '../test/measure';
import { straightenLimiter } from '../test/straightLimiter';
import { guideLevel } from '../viewers/guides';
import { amplitudeToSpectrumDb } from '../viewers/spectrumScale';
import { createSynthEngine, OSCILLATOR_LEVEL } from './synthEngine';

const SR = 48000;

async function render(seconds: number, patch: Partial<Patch>, play: (e: ReturnType<typeof createSynthEngine>) => void) {
  const ctx = new OfflineAudioContext(1, SR * seconds, SR);
  const engine = createSynthEngine(ctx);
  engine.applyPatch({ ...defaultPatch(), ...patch });
  play(engine);
  return (await ctx.startRendering()).getChannelData(0);
}

/** The largest step between neighbouring samples from `from` to `to` seconds: a click is one far past the wave's own. */
function steepestStep(s: Float32Array, from: number, to: number) {
  let most = 0;
  for (let i = Math.round(from * SR) + 1; i < Math.round(to * SR); i++) most = Math.max(most, Math.abs(s[i] - s[i - 1]));
  return most;
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

// Issue 41: a claim that the Filter hisses at high Resonance with the Cutoff near the top. Measured on 2026-10-26, it
// does not: what sounds there is the resonant peak lifting the saw's top Harmonics, nothing between them.
describe('no hiss at high Resonance and Cutoff', () => {
  const A2 = 45; // 110 Hz: Harmonics close together, so anything between them has little room to hide
  const between = (s: Float32Array) => betweenHarmonicsDb(s, SR, 110);
  const steady = { ampAttack: 0.001, ampSustain: 1, resonance: 1 };

  for (const filterSlope of [12, 24] as const)
    for (const cutoff of [16000, 20000])
      it(`keeps everything between the Harmonics 60 dB under them (Slope ${filterSlope}, Cutoff ${cutoff / 1000} kHz, full Resonance)`, async () => {
        const s = await render(1, { ...steady, filterSlope, cutoff }, (e) => e.noteOn(A2, 1, 0));
        expect(between(s)).toBeLessThan(-60);
      });

  it('hears hiss when there is some: a little Noise in the Mixer is caught (control case)', async () => {
    const s = await render(1, { ...steady, cutoff: 16000, mixNoise: 0.05 }, (e) => e.noteOn(A2, 1, 0));
    expect(between(s)).toBeGreaterThan(-60);
  });
});

// Issue 46: Firefox has no cancelAndHoldAtTime. Without it, a Note must still sound, start to finish.
describe('without cancelAndHoldAtTime (Firefox)', () => {
  it('plays a Note, releases it, and plays the next', async () => {
    const original = AudioParam.prototype.cancelAndHoldAtTime;
    // @ts-expect-error: removed for this test, as in Firefox
    delete AudioParam.prototype.cancelAndHoldAtTime;
    try {
      const s = await render(1, { cutoff: 20000, ampAttack: 0.001, ampSustain: 1, ampRelease: 0.05, glide: 0.1 }, (e) => {
        e.noteOn(57, 1, 0);
        e.noteOff(0.3);
        e.noteOn(69, 1, 0.5);
      });
      expect(rms(s, SR * 0.1, SR * 0.25)).toBeGreaterThan(0.05);
      expect(rms(s, SR * 0.42, SR * 0.48)).toBeLessThan(0.01); // released
      expect(rms(s, SR * 0.7, SR * 0.95)).toBeGreaterThan(0.05);
      expect(frequencyAround(s, SR, 0.85, 0.05)).toBeCloseTo(440, -1);
    } finally {
      AudioParam.prototype.cancelAndHoldAtTime = original;
    }
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
    // Not exactly 0: the limiter's oversampling spreads the Note's first samples a few back (about −400 dB).
    expect(rms(s, 0, at(0.1))).toBeLessThan(1e-12);
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
    const taps = { oscillator: read(engine.taps.oscillator), filter: read(engine.taps.filter), amp: read(engine.taps.amp), engine };
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
  }, 60_000); // 30 renders: past the default limit when the whole suite runs at once

  // The Guides (issue 159) stand at the level the Mixer sends, so only Resonance takes a trace beyond them. A band-limited
  // wave overshoots its own peak at its edges, and the Filter's slope rings a little past it: the allowance for both.
  const OVERSHOOT = 1.15;
  const bothUp = { mixOsc1: 1, mixOsc2: 1, ampSustain: 1, ampAttack: 0.001 };

  it('keeps the Oscillator and Filter Taps inside the Guides with both Oscillators up and no Resonance (issue 159)', async () => {
    let worst = 0;
    for (const waveform of ['saw', 'square', 'triangle'] as const) {
      for (const cutoff of [300, 2000, 20000]) {
        for (const [osc2Detune, filterSlope] of [[0, 12], [7, 24]] as const) {
          const patch = { ...defaultPatch(), ...bothUp, waveform, osc2Waveform: waveform, cutoff, osc2Detune, filterSlope, resonance: 0 };
          const taps = await tapsAt(0.4, patch);
          worst = Math.max(worst, peak(taps.oscillator) / guideLevel(patch), peak(taps.filter) / guideLevel(patch));
        }
      }
    }
    expect(worst).toBeLessThan(OVERSHOOT);
  }, 60_000);

  it('keeps the Oscillator Tap inside the Guides with the Noise up, white or pink, and the Sub (issue 159)', async () => {
    for (const noiseColour of ['white', 'pink'] as const) {
      // Below full scale, where the Guides are not capped: a fifth of Osc 1, the Sub and the Noise at 0.3.
      const patch = { ...defaultPatch(), ampSustain: 1, ampAttack: 0.001, cutoff: 20000, resonance: 0, mixOsc1: 0.2, mixSub: 0.2, mixNoise: 0.3, noiseColour };
      const taps = await tapsAt(0.4, patch);
      expect(peak(taps.oscillator) / guideLevel(patch), noiseColour).toBeLessThan(OVERSHOOT);
    }
  });

  it('takes the Filter Tap beyond the Guides once Resonance is up, both Oscillators up (issue 159)', async () => {
    const patch = { ...defaultPatch(), ...bothUp, cutoff: 873, resonance: 1 };
    const taps = await tapsAt(0.4, patch);
    expect(peak(taps.filter)).toBeGreaterThan(guideLevel(patch) * OVERSHOOT);
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

describe('pitch bend (issue 52)', () => {
  it('moves the sound by its cents, and the model and Cycle Lock with it', async () => {
    const A2 = 45; // 110 Hz
    const steady = { resonance: 0, ampAttack: 0.001, ampSustain: 1, cutoff: 20000 };
    let engine!: ReturnType<typeof createSynthEngine>;
    const s = await render(1, steady, (e) => {
      engine = e;
      e.noteOn(A2, 1, 0);
      e.setBend(200, 0.2); // two semitones up: 123.47 Hz
    });
    const last = [s.length - SR / 2, s.length] as const;
    const bent = 110 * 2 ** (200 / 1200);
    // The fundamental is at the bent pitch, not the played one.
    expect(dB(toneAmplitude(s, SR, bent, ...last) / toneAmplitude(s, SR, 110, ...last))).toBeGreaterThan(20);
    expect(engine.modulationAt(0.8).pitch).toBeCloseTo(A2 + 2, 6);
    expect(engine.modulationAt(0.1).pitch).toBeCloseTo(A2, 6);
    expect(engine.fundamental()).toBeCloseTo(bent, 1);
  });
});

describe('fast Cutoff modulation at full Resonance (issue 41)', () => {
  it('stays finite and inside full scale: the biquads never blow up, however fast the Cutoff moves', async () => {
    // The worst case the knobs allow: the LFO at 20 Hz and full Depth on the Cutoff, a snapping Filter Envelope at
    // full Amount, full Resonance, both Slopes, a low and a high Note.
    for (const filterSlope of [12, 24] as const) {
      for (const note of [33, 81]) {
        const s = await render(
          1,
          {
            filterSlope, resonance: 1, cutoff: 2000, lfoDestination: 'cutoff', lfoRate: 20, lfoAmount: 1,
            filterEnvAmount: 5, filterAttack: 0.001, filterDecay: 0.05, filterSustain: 0, ampAttack: 0.001, ampSustain: 1,
          },
          (e) => {
            for (let t = 0; t < 1; t += 0.125) e.noteOn(note, 1, t);
          },
        );
        let worst = 0;
        for (const v of s) {
          expect(Number.isFinite(v)).toBe(true);
          worst = Math.max(worst, Math.abs(v));
        }
        expect(worst, `${filterSlope} dB, Note ${note}`).toBeLessThanOrEqual(1);
      }
    }
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
  }, 120_000); // 72 renders, 4.6 s alone: past 60 s in a loaded night's suite (issue 177)
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

  it('is drawn for the moment the Spectrum shows, the middle of its window, so the two move together', async () => {
    // The Cutoff jumps from 300 Hz to 6 kHz at 1 s. 40 ms later the Spectrum's window (8192 samples, about 170 ms)
    // is still mostly before the jump, so the Curve still cuts at 2 kHz; 200 ms later it no longer does.
    const ctx = new OfflineAudioContext(1, SR * 1.4, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), cutoff: 300, resonance: 0 });
    const at2k = () => engine.filterResponse(Float32Array.of(2000))[0];
    const read = <T,>(t: number, act: () => T) =>
      ctx.suspend(t).then(() => {
        const value = act();
        void ctx.resume();
        return value;
      });
    const jump = read(1, () => engine.applyPatch({ ...defaultPatch(), cutoff: 6000, resonance: 0 }));
    const soon = read(1.04, at2k);
    const later = read(1.2, at2k);
    await ctx.startRendering();
    await jump;
    expect(dB(await soon)).toBeLessThan(-20);
    expect(dB(await later)).toBeGreaterThan(-1);
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

describe('what the mascot reads (issue 115)', () => {
  it("gives when the newest Note started, a Note handed over ahead only from its start, a dip's from after the dip", () => {
    const ctx = new OfflineAudioContext(1, SR * 2, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ampRelease: 0.5 });
    expect(engine.modulationAt(0).struck).toBeNull();
    engine.noteOn(60, 1, 0.1);
    engine.noteOff(0.3);
    engine.noteOn(62, 1, 0.4); // into the Release: it dips first
    expect(engine.modulationAt(0.2).struck).toBeCloseTo(0.1, 6);
    expect(engine.modulationAt(0.35).struck).toBeCloseTo(0.1, 6);
    expect(engine.modulationAt(0.5).struck).toBeCloseTo(0.4 + DIP, 6);
  });

  it('reading it changes nothing in the sound', async () => {
    const play = (e: ReturnType<typeof createSynthEngine>, read: boolean) => {
      for (let i = 0; i < 8; i++) {
        e.noteOn([60, 69, 62, 64][i % 4], 0.8, i * 0.12);
        if (read) for (let t = 0; t < 1; t += 1 / 30) e.modulationAt(t);
        e.release([60, 69, 62, 64][i % 4], i * 0.12 + 0.1);
      }
    };
    const patch = { voices: 4 as const, lfoAmount: 0.5, lfoDestination: 'cutoff' as const, lfoRetrigger: 'note' as const };
    const without = await render(1, patch, (e) => play(e, false));
    const read = await render(1, patch, (e) => play(e, true));
    // Two renders of the same Notes already differ by about 2e-7 (the browser's rounding): within −120 dB is the same.
    let most = 0;
    for (let i = 0; i < read.length; i++) most = Math.max(most, Math.abs(read[i] - without[i]));
    expect(most).toBeLessThan(1e-6);
  });
});

describe('modulationAt for past moments (the Envelope Timeline)', () => {
  // Issue 45: the Timeline asks for every pixel column, every frame. Each moment must cost the same however many Notes
  // the history holds (it replayed the whole history per column: 3.7 ms a frame grew to 31 ms after 600 Notes).
  it('costs no more per moment after 600 Notes than after 10', () => {
    const timeFor = (notes: number) => {
      const ctx = new OfflineAudioContext(1, SR * 30, SR);
      const engine = createSynthEngine(ctx);
      engine.applyPatch({ ...defaultPatch(), glide: 0.05 });
      for (let i = 0; i < notes; i++) {
        engine.noteOn(48 + (i % 24), 0.8, (i * 24) / notes);
        engine.noteOff((i * 24) / notes + 12 / notes);
      }
      const frame = () => { for (let x = 0; x < 500; x++) engine.modulationAt(24 + x / 500); };
      frame(); // warm up
      const start = performance.now();
      for (let i = 0; i < 20; i++) frame();
      return (performance.now() - start) / 20;
    };
    const few = Math.min(timeFor(10), timeFor(10));
    const many = Math.min(timeFor(600), timeFor(600));
    expect(many).toBeLessThan(few * 3 + 1);
  });
  // The Demo turns knobs every frame: a Patch change must not rebuild a pulse's Fourier series for every Voice.
  it('applies a Patch change with pulse Waveforms on 8 Voices about as fast as with saws', () => {
    const timeFor = (waveform: 'pulse' | 'saw') => {
      const ctx = new OfflineAudioContext(1, SR, SR);
      const engine = createSynthEngine(ctx);
      const patch = { ...defaultPatch(), voices: 8 as const, waveform, osc2Waveform: waveform };
      engine.applyPatch(patch);
      const start = performance.now();
      for (let i = 0; i < 50; i++) engine.applyPatch({ ...patch, cutoff: 1000 + i });
      return (performance.now() - start) / 50;
    };
    const saw = Math.min(timeFor('saw'), timeFor('saw'));
    const pulse = Math.min(timeFor('pulse'), timeFor('pulse'));
    expect(pulse).toBeLessThan(saw * 3 + 0.5);
  });
  it('gives the Envelope levels that replaying every Gate event from the start would', () => {
    const ctx = new OfflineAudioContext(1, SR * 4, SR);
    const engine = createSynthEngine(ctx);
    const patch = { ...defaultPatch(), ampAttack: 0.05, ampDecay: 0.2, ampSustain: 0.6, ampRelease: 0.3, filterAttack: 0.01, filterDecay: 0.1, filterSustain: 0.3, filterRelease: 0.5 };
    engine.applyPatch(patch);
    const amp: GateEvent[] = [];
    const filter: GateEvent[] = [];
    const ampAdsr = { attack: patch.ampAttack, decay: patch.ampDecay, sustain: patch.ampSustain, release: patch.ampRelease };
    const filterAdsr = { attack: patch.filterAttack, decay: patch.filterDecay, sustain: patch.filterSustain, release: patch.filterRelease };
    // Notes that retrigger before the Release ends, and releases before the Decay ends: every segment starts mid-way.
    // Each Note but the first comes while the last still sounds: it dips first, and starts after the dip (issue 102).
    for (const [on, off, velocity] of [[0.1, 0.3, 1], [0.4, 0.45, 0.5], [0.5, 1.2, 0.8], [1.3, 1.31, 1]]) {
      engine.noteOn(60, velocity, on);
      engine.noteOff(off);
      const start = on === 0.1 ? on : on + DIP;
      if (start !== on) amp.push({ time: on, on: false, adsr: ampAdsr, peak: 0, dip: true });
      amp.push({ time: start, on: true, adsr: ampAdsr, peak: velocity }, { time: off, on: false, adsr: ampAdsr, peak: velocity });
      filter.push({ time: start, on: true, adsr: filterAdsr, peak: 1 }, { time: off, on: false, adsr: filterAdsr, peak: 1 });
    }
    for (let t = 0; t < 2; t += 0.001) {
      const m = engine.modulationAt(t);
      expect(m.amp).toBeCloseTo(envelopeLevel(amp, t), 9);
      expect(m.filter).toBeCloseTo(envelopeLevel(filter, t), 9);
    }
  });
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
  it('reports the newest Note and its Velocity, for the modulation ring (they are fixed while it sounds)', () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(defaultPatch());
    expect(engine.modulationAt(0).sounding).toBeNull();
    engine.noteOn(72, 0.5, 0.1);
    expect(engine.modulationAt(0.2).sounding).toEqual({ note: 72, velocity: 0.5 });
    engine.noteOff(0.3);
    expect(engine.modulationAt(0.4).sounding).toBeNull(); // released: no Note is held any more
  });
  it('reports the sounding pitch in semitones: the Note, sliding over the Glide to the next', () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), glide: 0.4, lfoAmount: 0 });
    engine.noteOn(60, 1, 0);
    expect(engine.modulationAt(0.2).pitch).toBeCloseTo(60);
    engine.pitchChange(72, 0.5);
    expect(engine.modulationAt(0.5).pitch).toBeCloseTo(60);
    const sliding = engine.modulationAt(0.6).pitch;
    expect(sliding).toBeGreaterThan(61);
    expect(sliding).toBeLessThan(71);
    expect(engine.modulationAt(0.9).pitch).toBeCloseTo(72, 0); // there by the Glide time (98 % of the way)
  });
  it('a falling saw LFO bends the pitch down then up, in the sound as in the model', async () => {
    const patch = { cutoff: 20000, waveform: 'sine', ampSustain: 1, ampAttack: 0.001, lfoDestination: 'pitch', lfoAmount: 1, lfoRate: 1, lfoWaveform: 'sawDown' } as const;
    let engine: ReturnType<typeof createSynthEngine> | undefined;
    const s = await render(1, patch, (e) => {
      engine = e;
      e.noteOn(69, 1, 0);
    });
    // A quarter of the way into its cycle the falling saw is at −½: half a semitone flat; three quarters, half sharp.
    expect(frequencyAround(s, SR, 0.25, 0.02)).toBeCloseTo(440 * 2 ** (-0.5 / 12), 0);
    expect(frequencyAround(s, SR, 0.75, 0.02)).toBeCloseTo(440 * 2 ** (0.5 / 12), 0);
    expect(engine!.modulationAt(0.25).vibrato).toBeCloseTo(-0.5);
  });
  it('an LFO on Pitch wobbles the sounding pitch a semitone each way at full Depth; aimed elsewhere, not at all', () => {
    const swing = (destination: 'pitch' | 'cutoff') => {
      const ctx = new OfflineAudioContext(1, SR, SR);
      const engine = createSynthEngine(ctx);
      engine.applyPatch({ ...defaultPatch(), lfoDestination: destination, lfoAmount: 1, lfoRate: 5, lfoWaveform: 'triangle' });
      engine.noteOn(60, 1, 0);
      const moments = Array.from({ length: 200 }, (_, i) => engine.modulationAt(0.1 + i / 1000));
      // The vibrato on its own, so the piano can draw it apart from the Note: the pitch less the vibrato is the Note.
      for (const m of moments) expect(m.pitch - m.vibrato).toBeCloseTo(60);
      const pitches = moments.map((m) => m.pitch);
      return [Math.min(...pitches), Math.max(...pitches)];
    };
    const [lo, hi] = swing('pitch');
    expect(lo).toBeCloseTo(59, 1);
    expect(hi).toBeCloseTo(61, 1);
    expect(swing('cutoff')).toEqual([60, 60]);
  });
  // On several Voices too (issue 101): a handed-over Note has its release recorded already, and is cancelled all the same.
  for (const voices of [1, 4] as const)
    it(`a Gate earlier than Notes already handed over (Hold switched off mid-rhythm) cancels them, as in the sound (${voices} Voice${voices > 1 ? 's' : ''})`, async () => {
      const ctx = new OfflineAudioContext(1, SR * 1.2, SR);
      const engine = createSynthEngine(ctx);
      engine.applyPatch({ ...defaultPatch(), voices, ampAttack: 0.005, ampSustain: 1, ampRelease: 0.1, filterAttack: 0.005 });
      const chord = [60, 64];
      // A tap of the rhythm, a chord, its end handed over with its start, as the Transport does…
      for (const note of chord) engine.noteOn(note, 0.9, 0);
      for (const note of chord) engine.release(note, 0.4);
      // …the next tap, handed over ahead of the clock…
      for (const note of chord) engine.noteOn(note, 0.9, 0.5);
      for (const note of chord) engine.release(note, 0.8);
      // …then Hold goes off at 0.45, before it.
      engine.noteOff(0.45);
      const at = engine.modulationAt(0.45);
      for (const t of [0.5, 0.6, 0.8, 0.9]) {
        const m = engine.modulationAt(t);
        expect(m.amp, `amp at ${t}`).toBeGreaterThanOrEqual(0);
        expect(m.amp, `amp at ${t}`).toBeLessThan(at.amp); // releasing: no new Attack at 0.5
        expect(m.filter, `filter at ${t}`).toBeGreaterThanOrEqual(0);
        expect(m.sounding, `at ${t}`).toBeNull();
      }
      // Silence once the Release from 0.45 has run, where the tap handed over would have sounded until 0.8.
      const s = (await ctx.startRendering()).getChannelData(0);
      expect(rms(s, SR * 0.75, SR * 1.2)).toBeLessThan(rms(s, SR * 0.1, SR * 0.4) * 0.001);
    });
});

describe('two LFOs and their destinations', () => {
  // A square LFO at 1 Hz sits at +1 for the first half second and −1 for the second: measure in the middle of each.
  const square = { cutoff: 20000, waveform: 'sine', osc2Waveform: 'sine', ampSustain: 1, ampAttack: 0.001, lfoRate: 1, lfoWaveform: 'square', lfo2Rate: 1, lfo2Waveform: 'square' } as const;
  const up = (s: Float32Array) => frequencyAround(s, SR, 0.25, 0.02);
  const down = (s: Float32Array) => frequencyAround(s, SR, 0.75, 0.02);

  it('LFO 2 makes vibrato on its own, LFO 1 silent', async () => {
    const s = await render(1, { ...square, lfo2Destination: 'pitch', lfo2Amount: 1 }, (e) => e.noteOn(69, 1, 0));
    expect(up(s)).toBeCloseTo(440 * 2 ** (1 / 12), 0);
    expect(down(s)).toBeCloseTo(440 * 2 ** (-1 / 12), 0);
  });

  it('Osc 2 Pitch moves Osc 2 alone, an octave each way at full Depth', async () => {
    const osc2 = { ...square, mixOsc1: 0, mixOsc2: 1, lfoDestination: 'osc2Pitch', lfoAmount: 1 } as const;
    const s = await render(1, osc2, (e) => e.noteOn(69, 1, 0));
    expect(up(s)).toBeCloseTo(880, 0);
    expect(down(s)).toBeCloseTo(220, 0);
    const osc1 = await render(1, { ...osc2, mixOsc1: 1, mixOsc2: 0 }, (e) => e.noteOn(69, 1, 0));
    expect(up(osc1)).toBeCloseTo(440, 0);
  });

  it('a retriggering LFO starts its cycle at each Note, in the sound and the model; a free one runs on', async () => {
    // A Note at 0.3 s: 0.25 s later a free LFO is past half its cycle (down), a retriggered one a quarter in (up).
    const play = { ...square, lfoDestination: 'pitch', lfoAmount: 1 } as const;
    const at = (s: Float32Array, t: number) => frequencyAround(s, SR, t, 0.02);
    let model = 0;
    const free = await render(1.2, play, (e) => e.noteOn(69, 1, 0.3));
    expect(at(free, 0.55)).toBeCloseTo(440 * 2 ** (-1 / 12), 0);
    const retriggered = await render(1.2, { ...play, lfoRetrigger: 'note' }, (e) => {
      e.noteOn(69, 1, 0.3);
      model = e.lfoSwingAt(0.55);
    });
    expect(at(retriggered, 0.55)).toBeCloseTo(440 * 2 ** (1 / 12), 0);
    expect(at(retriggered, 1.05)).toBeCloseTo(440 * 2 ** (-1 / 12), 0); // three quarters in: down
    expect(model).toBe(1);
  });

  it('Detune moves Osc 2 by 50 cents each way at full Depth', async () => {
    const s = await render(1, { ...square, mixOsc1: 0, mixOsc2: 1, lfo2Destination: 'detune', lfo2Amount: 1 }, (e) => e.noteOn(69, 1, 0));
    expect(up(s)).toBeCloseTo(440 * 2 ** (50 / 1200), 0);
    expect(down(s)).toBeCloseTo(440 * 2 ** (-50 / 1200), 0);
  });

  it('Resonance swings the Filter’s peak: full while the LFO is up, none while it is down, in the sound and the model', async () => {
    const patch = { ...square, waveform: 'saw', cutoff: 990, resonance: 0.5, lfoDestination: 'resonance', lfoAmount: 0.5 } as const;
    let engine: ReturnType<typeof createSynthEngine> | undefined;
    const s = await render(1, patch, (e) => {
      engine = e;
      e.noteOn(45, 1, 0); // 110 Hz: Harmonic 9 sits on the Cutoff
    });
    const peak = (from: number, to: number) => toneAmplitude(s, SR, 990, Math.round(from * SR), Math.round(to * SR));
    expect(dB(peak(0.1, 0.4) / peak(0.6, 0.9))).toBeGreaterThan(15);
    expect(engine!.modulationAt(0.25).resonance).toBeCloseTo(1);
    expect(engine!.modulationAt(0.75).resonance).toBeCloseTo(0);
  });

  it('the Volume knob scales the sound and the Amp Tap, not the Filter Tap; the model has it too (issue 62)', async () => {
    let engine: ReturnType<typeof createSynthEngine> | undefined;
    const full = await render(1, square, (e) => e.noteOn(69, 1, 0));
    const half = await render(1, { ...square, volume: 0.5 }, (e) => {
      engine = e;
      e.noteOn(69, 1, 0);
    });
    const level = (x: Float32Array) => rms(x, SR / 2, SR);
    expect(level(half) / level(full)).toBeCloseTo(0.5, 2);
    expect(engine!.modulationAt(0.5).volume).toBeCloseTo(0.5);
    const [a, b] = [await tapsAt(0.5, square, 69), await tapsAt(0.5, { ...square, volume: 0.5 }, 69)];
    expect(rms(b.amp) / rms(a.amp)).toBeCloseTo(0.5, 1);
    expect(rms(b.filter) / rms(a.filter)).toBeCloseTo(1, 2);
  });

  it('Volume makes tremolo: the Envelope’s level while the LFO is up, Depth below it while it is down, in the sound, the Amp Tap and the model', async () => {
    const patch = { ...square, lfoDestination: 'volume', lfoAmount: 0.5 } as const;
    let engine: ReturnType<typeof createSynthEngine> | undefined;
    const s = await render(1, patch, (e) => {
      engine = e;
      e.noteOn(69, 1, 0);
    });
    const still = await render(1, { ...patch, lfoAmount: 0 }, (e) => e.noteOn(69, 1, 0));
    const level = (x: Float32Array, t: number) => rms(x, Math.round((t - 0.1) * SR), Math.round((t + 0.1) * SR));
    expect(level(s, 0.25) / level(still, 0.25)).toBeCloseTo(1, 2);
    expect(level(s, 0.75) / level(still, 0.75)).toBeCloseTo(0.5, 2);
    expect(engine!.modulationAt(0.25).volume).toBeCloseTo(1);
    expect(engine!.modulationAt(0.75).volume).toBeCloseTo(0.5);
    // The Amp Tap shows it: the Viewers see the tremolo as the ear hears it.
    const up = await tapsAt(0.25, patch, 69);
    const down = await tapsAt(0.75, patch, 69);
    expect(rms(down.amp) / rms(up.amp)).toBeCloseTo(0.5, 1);
    expect(rms(down.filter) / rms(up.filter)).toBeCloseTo(1, 1);
  });
});

// Issue 66: a square's or a saw's Fourier series rings past ±1 at its jump (Gibbs, about ±1.18), where the model
// stays at exactly ±1. Measured on Volume at full Depth, where the tremolo's gain is the LFO itself (0.5 + 0.5 × its
// value): the Amp Tap with the LFO, divided sample by sample by the same Note without it. Every Destination is fed
// from the same LFO, so what holds here holds for all of them.
describe('LFO edges (issue 66)', () => {
  const tremolo = { cutoff: 20000, waveform: 'sine', ampSustain: 1, ampAttack: 0.001, lfoDestination: 'volume', lfoAmount: 1 } as const;
  /** The tremolo's gain over the Amp Tap's window ending at `at` (a whole number of 128-frame quanta), and its times. */
  const gainBefore = async (at: number, patch: Partial<Patch>) => {
    const moved = await tapsAt(at, { ...tremolo, ...patch }, 69);
    const { amp: still } = await tapsAt(at, { ...tremolo, ...patch, lfoAmount: 0 }, 69);
    const peak = Math.max(...still.map(Math.abs));
    const gains: { time: number; gain: number }[] = [];
    still.forEach((s, i) => {
      // Where the carrier is near zero the division says nothing.
      if (Math.abs(s) > 0.3 * peak) gains.push({ time: at - (still.length - i) / SR, gain: moved.amp[i] / s });
    });
    return { gains, engine: moved.engine };
  };

  for (const lfoWaveform of ['square', 'saw', 'sawDown'] as const)
    for (const lfoRate of [1, 20])
      it(`keeps a ${lfoWaveform} LFO within ±1 at its edges: the gain never passes the Envelope's level nor flips polarity (${lfoRate} Hz)`, async () => {
        // A window holding the jump at half a cycle (at 20 Hz, several cycles' jumps).
        const { gains } = await gainBefore(lfoRate === 1 ? 0.56 : 1.12, { lfoWaveform, lfoRate });
        const [highest, lowest] = [Math.max(...gains.map((g) => g.gain)), Math.min(...gains.map((g) => g.gain))];
        const measured = `gain from ${lowest.toFixed(4)} to ${highest.toFixed(4)}`;
        expect(highest, measured).toBeLessThan(1.001);
        expect(lowest, measured).toBeGreaterThan(-0.001);
      });

  for (const lfoWaveform of ['square', 'saw', 'sawDown'] as const)
    it(`agrees with the model across the ${lfoWaveform}'s cycle, away from its jumps (1 Hz)`, async () => {
      const { gains, engine } = await gainBefore(0.56, { lfoWaveform, lfoRate: 1 });
      const farFromJump = gains.filter((g) => Math.abs(g.time - 0.5) > 0.001); // over a millisecond from it
      const gap = Math.max(...farFromJump.map((g) => Math.abs(g.gain - engine.modulationAt(g.time).volume)));
      expect(gap).toBeLessThan(0.005); // the LFO within 1 %
    });
});

// Issue 124: a retriggered LFO starts each Waveform where it classically starts, not at the browser oscillator's own
// phase 0 (the middle of a saw's ramp). Measured as issue 66's are, on Volume at full Depth (a gain of 0.5 + 0.5 ×
// the LFO), with the Note at 0.3 s, where a free LFO at 1 Hz is far from any of these starts.
describe('where a retriggered LFO starts (issue 124)', () => {
  const tremolo = { cutoff: 20000, waveform: 'sine', ampSustain: 1, ampAttack: 0.001, lfoDestination: 'volume', lfoAmount: 1, lfoRate: 1 } as const;
  const NOTE = 0.3;
  /**
   * The tremolo's gain over the Amp Tap's window ending at `until` (by default 0.4 s, the Note's first tenth of a
   * second), and its times; `change`, if given, is applied at 0.56 s.
   */
  const gains = async (patch: Partial<Patch>, until = 0.4, change?: Partial<Patch>) => {
    const tap = async (amount: number) => {
      const ctx = new OfflineAudioContext(1, SR * (until + 0.1), SR);
      const engine = createSynthEngine(ctx);
      const first = { ...defaultPatch(), ...tremolo, ...patch, lfoAmount: amount };
      engine.applyPatch(first);
      engine.noteOn(69, 1, NOTE);
      const amp = new Float32Array(engine.taps.amp.fftSize);
      const changed = change && ctx.suspend(0.56).then(() => {
        engine.applyPatch({ ...first, ...change });
        void ctx.resume();
      });
      const captured = ctx.suspend(until).then(() => {
        engine.taps.amp.getFloatTimeDomainData(amp);
        void ctx.resume();
      });
      await ctx.startRendering();
      await Promise.all([changed, captured]);
      return { amp, engine };
    };
    const [moved, still] = [await tap(1), await tap(0)];
    const peak = Math.max(...still.amp.map(Math.abs));
    const measured: { time: number; gain: number }[] = [];
    still.amp.forEach((s, i) => {
      if (Math.abs(s) > 0.3 * peak) measured.push({ time: until - (still.amp.length - i) / SR, gain: moved.amp[i] / s });
    });
    return { measured, engine: moved.engine };
  };

  // Each Waveform's classic start: a Saw at its foot, a Saw Down at its top, a Square at the start of its upper half,
  // a Sine and a Triangle at the centre, rising.
  for (const [lfoWaveform, start] of [['saw', -1], ['sawDown', 1], ['square', 1], ['sine', 0], ['triangle', 0]] as const)
    it(`starts a retriggered ${lfoWaveform} at ${start} at the Note, in the sound as in the model`, async () => {
      const { measured, engine } = await gains({ lfoWaveform, lfoRetrigger: 'note' });
      expect(engine.lfoSwingAt(NOTE)).toBeCloseTo(start, 9);
      // Its first values, a millisecond to five in (past the series' corner): at 1 Hz the wave has moved under 2 %.
      const first = measured.filter((g) => g.time > NOTE + 0.001 && g.time < NOTE + 0.005);
      expect(first.length).toBeGreaterThan(10);
      for (const g of first) expect(g.gain).toBeCloseTo(0.5 + 0.5 * start, 1);
      // And the model follows the sound sample by sample, from there on.
      const after = measured.filter((g) => g.time > NOTE + 0.001);
      const gap = Math.max(...after.map((g) => Math.abs(g.gain - engine.modulationAt(g.time).volume)));
      expect(gap).toBeLessThan(0.005);
    });

  it('leaves a free LFO where it is: a saw at 0.3 s, three tenths into its cycle, at 0.6', async () => {
    const { measured, engine } = await gains({ lfoWaveform: 'saw' });
    expect(engine.lfoSwingAt(NOTE)).toBeCloseTo(0.6, 9);
    const first = measured.filter((g) => g.time > NOTE + 0.001 && g.time < NOTE + 0.005);
    for (const g of first) expect(g.gain).toBeCloseTo(0.8, 1);
  });

  it('keeps the sound and the model together when the Waveform changes after a retriggered saw', async () => {
    // The saw restarted half a cycle along its phase: a sine switched to at 0.56 s runs on from there, in both.
    const { measured, engine } = await gains({ lfoWaveform: 'saw', lfoRetrigger: 'note' }, 0.704, { lfoWaveform: 'sine' });
    const after = measured.filter((g) => g.time > 0.57);
    expect(after.length).toBeGreaterThan(1000);
    const gap = Math.max(...after.map((g) => Math.abs(g.gain - engine.modulationAt(g.time).volume)));
    expect(gap).toBeLessThan(0.005);
  });

  it('opens Key Sync at the Note and closes it over the LFO’s cycle, as its words say', async () => {
    const keySync = PRESETS.find((p) => p.name === 'Key Sync')!.patch;
    let engine: ReturnType<typeof createSynthEngine> | undefined;
    const s = await render(1.2, keySync, (e) => {
      engine = e;
      e.noteOn(57, 1, NOTE); // A3
    });
    // How bright: the centre of its Harmonics' power (the 1st to the 20th, a level-weighted mean of their numbers), in
    // 50 ms windows (whole cycles of 220 Hz) over the 1.5 Hz cycle's two thirds of a second.
    const centre = (from: number) => {
      let [weighted, total] = [0, 0];
      for (let h = 1; h <= 20; h++) {
        const p = toneAmplitude(s, SR, 220 * h, Math.round((NOTE + from) * SR), Math.round((NOTE + from + 0.05) * SR)) ** 2;
        weighted += h * p;
        total += p;
      }
      return weighted / total;
    };
    const centres = [0.01, 0.2, 0.4, 0.6].map(centre);
    for (let i = 1; i < centres.length; i++) expect(centres[i], centres.map((c) => c.toFixed(2)).join(', ')).toBeLessThan(centres[i - 1]);
    // The model: open at its top at the Note (1.48 kHz), closed to its foot at the cycle's end (172 Hz).
    expect(engine!.modulationAt(NOTE).cutoff).toBeGreaterThan(1400);
    expect(engine!.modulationAt(NOTE + 0.66).cutoff).toBeLessThan(180);
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
    const loud = { resonance: 1, ampSustain: 1, ampAttack: 0.001, mixOsc1: 1, mixOsc2: 1, mixNoise: 1, mixSub: 1, osc2Octave: 1 };
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

  /** Both Taps, the Response Curve and the model at each of `times`, a Note (A2 unless said) held from 0. */
  async function capturedAt(patch: Partial<Patch>, times: number[], frequencies: Float32Array<ArrayBuffer>, note = 45) {
    const ctx = new OfflineAudioContext(1, SR * (Math.max(...times) + 0.1), SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ampSustain: 1, ampAttack: 0.001, ...patch });
    engine.noteOn(note, 1, 0);
    const read = (a: AnalyserNode) => {
      const s = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(s);
      return s;
    };
    const frames = times.map((t) =>
      ctx.suspend(t).then(() => {
        const frame = { osc: read(engine.taps.oscillator), filter: read(engine.taps.filter), curve: engine.filterResponse(frequencies), modulation: engine.modulationAt(t) };
        void ctx.resume();
        return frame;
      }),
    );
    await ctx.startRendering();
    return Promise.all(frames);
  }
  /**
   * How far the sound's Filter is from the Curve drawn, in dB, at its worst over `frequencies`: where the Curve is
   * too deep, or the source too quiet, to measure against the analyser's floor, not counted.
   */
  function offTheCurve({ osc, filter, curve }: Awaited<ReturnType<typeof capturedAt>>[number], frequencies: Float32Array) {
    let worst = 0;
    for (let i = 0; i < frequencies.length; i++) {
      const source = toneAmplitudeHann(osc, SR, frequencies[i]);
      if (dB(curve[i]) < -40 || source < 1e-4) continue;
      worst = Math.max(worst, Math.abs(dB(toneAmplitudeHann(filter, SR, frequencies[i]) / source) - dB(curve[i])));
    }
    return worst;
  }

  // Issue 166: the model moves the Resonance, the sound the Q along the curve that follows it. A band-pass's or
  // notch's Q grows by ratios: on a straight line between the swing's ends its foot would pass below zero, a notch
  // going silent and a band-pass letting everything through.
  for (const mode of MODES) {
    for (const slope of [12, 24] as const) {
      it(`keeps the Q at its floor or above under an LFO on Resonance: ${mode}, ${slope} dB, the Curve it draws at the swing's top and foot (issue 166)`, async () => {
        const patch = { cutoff: 1000, resonance: 0.5, filterMode: mode, filterSlope: slope, lfoDestination: 'resonance', lfoWaveform: 'square', lfoRate: 1, lfoAmount: 1 } as const;
        // The square's top is the first half of its cycle, its foot the second: each captured near its end.
        const [top, foot] = await capturedAt(patch, [0.45, 0.95], harmonics);
        expect(top.modulation.resonance).toBeCloseTo(1, 3);
        expect(foot.modulation.resonance).toBeCloseTo(0, 3);
        for (const [name, frame] of [['top', top], ['foot', foot]] as const) expect(offTheCurve(frame, harmonics), name).toBeLessThan(0.5);
      });
    }
  }

  it('holds the Cutoff at 20 Hz and 20 kHz in the sound, where the model does: a square LFO swinging it past each end (issue 166)', async () => {
    const swing = { lfoDestination: 'cutoff', lfoWaveform: 'square', lfoRate: 1, lfoAmount: 1, resonance: 0 } as const;
    // A low-pass at 20 Hz swung two octaves under it: A1's first Harmonics, which 20 Hz still lets through.
    const low = Float32Array.from({ length: 4 }, (_, i) => 55 * (i + 1));
    const [, bottom] = await capturedAt({ ...swing, cutoff: 20 }, [0.45, 0.95], low, 33);
    expect(bottom.modulation.cutoff).toBe(20);
    expect(offTheCurve(bottom, low)).toBeLessThan(0.5);
    // A high-pass at 20 kHz swung two octaves over it: A1's Harmonics either side of it, which 20 kHz lets through.
    const high = Float32Array.from({ length: 80 }, (_, i) => 55 * (340 + i));
    const [top] = await capturedAt({ ...swing, cutoff: 20000, filterMode: 'highpass' }, [0.45], high, 33);
    expect(top.modulation.cutoff).toBe(20000);
    expect(offTheCurve(top, high)).toBeLessThan(0.5);
    expect(dB(toneAmplitudeHann(top.filter, SR, 55 * 380)), 'the sound past 20 kHz').toBeGreaterThan(-80);
  });
});

// Issue 112: an LFO with Sync on repeats once a note value at the tempo, and with Retrigger free its cycle lands on
// the beat. Measured as issue 66's are, on Volume at full Depth: the Amp Tap with the LFO, divided sample by sample by
// the same Note without it, is the tremolo's gain, 0.5 + 0.5 × the LFO (the output lags it, through the limiter's
// oversampling). A quarter-Note saw starts each cycle at its foot, so the gain is 0 on every beat and climbs to 1.
describe('an LFO synced to the tempo (issue 112)', () => {
  const tremolo = {
    cutoff: 20000, waveform: 'sine', ampSustain: 1, ampAttack: 0.001, lfoDestination: 'volume', lfoAmount: 1, lfoWaveform: 'saw',
    lfoSync: 'on', lfoNote: noteIndex('1/4'),
  } as const;
  const SECONDS = 2.6;
  /** The Amp Tap's windows end at these moments (whole 128-frame quanta), each holding a beat or the change. */
  const CAPTURES = [0.32, 0.72, 0.84, 0.96, 1.28, 1.52, 1.72, 2.16, 2.24, 2.56];
  /**
   * The tremolo's gain and its times, with the tempo 120 BPM counted from 0.2 s and the Note at 0; at 0.8 s, `then`
   * is done (a tempo set, a Patch changed, at the run's Depth).
   */
  const gains = async (patch: Partial<Patch>, then: (e: ReturnType<typeof createSynthEngine>, lfoAmount: number) => void) => {
    const run = async (amount: number) => {
      const ctx = new OfflineAudioContext(1, SR * SECONDS, SR);
      const engine = createSynthEngine(ctx);
      engine.setTempo(120, 0.2);
      engine.applyPatch({ ...defaultPatch(), ...tremolo, ...patch, lfoAmount: amount });
      engine.noteOn(69, 1, 0);
      const changed = ctx.suspend(0.8).then(() => {
        then(engine, amount);
        void ctx.resume();
      });
      const windows = CAPTURES.map((at) =>
        ctx.suspend(at).then(() => {
          const amp = new Float32Array(engine.taps.amp.fftSize);
          engine.taps.amp.getFloatTimeDomainData(amp);
          void ctx.resume();
          return { at, amp };
        }),
      );
      await ctx.startRendering();
      await changed;
      return { windows: await Promise.all(windows), engine };
    };
    const [moved, still] = [await run(1), await run(0)];
    const measured: { time: number; gain: number }[] = [];
    still.windows.forEach(({ at, amp }, w) => {
      const peak = Math.max(...amp.map(Math.abs));
      amp.forEach((s, i) => {
        if (Math.abs(s) > 0.3 * peak) measured.push({ time: at - (amp.length - i) / SR, gain: moved.windows[w].amp[i] / s });
      });
    });
    return { measured, engine: moved.engine };
  };
  /** Where the model's saw jumps from its top to its foot, to a tenth of a millisecond. */
  const feet = (engine: ReturnType<typeof createSynthEngine>) => {
    const found: number[] = [];
    for (let t = 0.0001; t < SECONDS; t += 0.0001) if (engine.lfoSwingAt(t) - engine.lfoSwingAt(t - 0.0001) < -1) found.push(t);
    return found;
  };
  /** The largest gap between the sound's gain and the model's, a millisecond or more from the saw's jumps. */
  const gap = (measured: { time: number; gain: number }[], engine: ReturnType<typeof createSynthEngine>, from: number, to: number) => {
    const jumps = feet(engine);
    const away = measured.filter((g) => g.time > from && g.time < to && jumps.every((b) => Math.abs(g.time - b) > 0.0012));
    expect(away.length).toBeGreaterThan(1000);
    return Math.max(...away.map((g) => Math.abs(g.gain - engine.modulationAt(g.time).volume)));
  };
  const near = (measured: { time: number; gain: number }[], at: number) => measured.filter((g) => g.time > at + 0.001 && g.time < at + 0.004);

  it('starts its cycle on each beat: a quarter-Note saw at its foot on the beats of 120 BPM, in the sound as in the model', async () => {
    const { measured, engine } = await gains({}, () => {});
    for (const beat of [0.2, 0.7, 1.2]) {
      expect(engine.lfoSwingAt(beat), `model at ${beat} s`).toBeCloseTo(-1, 9);
      expect(engine.lfoSwingAt(beat + 0.25), `half a beat on, ${beat} s`).toBeCloseTo(0, 9);
      for (const g of near(measured, beat)) expect(g.gain, `sound just after ${beat} s`).toBeCloseTo(0, 1);
    }
    expect(gap(measured, engine, 0.21, SECONDS)).toBeLessThan(0.005);
  });

  /** On the beats from `beats`: the sound at the saw's foot just after each, the model a quarter of a `cycle` on. */
  const onTheBeats = (measured: { time: number; gain: number }[], engine: ReturnType<typeof createSynthEngine>, beats: number[], cycle: number) => {
    for (const beat of beats) {
      expect(engine.lfoSwingAt(beat + cycle / 4), `model a quarter after ${beat} s`).toBeCloseTo(-0.5, 6);
      expect(near(measured, beat).length, `sound measured after ${beat} s`).toBeGreaterThan(50);
      for (const g of near(measured, beat)) expect(g.gain, `sound just after ${beat} s`).toBeCloseTo(0, 1);
    }
  };
  /** No jump where the change was made, at 0.8 s, in the model (the sound is held to it by `gap`). */
  const noJump = (engine: ReturnType<typeof createSynthEngine>) =>
    expect(Math.abs(engine.lfoSwingAt(0.8001) - engine.lfoSwingAt(0.7999))).toBeLessThan(0.01);

  it('follows a tempo set from where it is, pulled onto the beat counted again there over two cycles, the model on the sound', async () => {
    // At 90 BPM a quarter Note is 2/3 s, the beat counted from 0.8 s: on it from 0.8 + 4/3 s, then every 2/3 s.
    const { measured, engine } = await gains({}, (e) => e.setTempo(90));
    noJump(engine);
    onTheBeats(measured, engine, [0.8 + 4 / 3], 2 / 3);
    expect(engine.lfoSwingAt(0.8 + 2 + 1 / 6)).toBeCloseTo(-0.5, 6);
    expect(engine.tempo()).toEqual({ bpm: 90, origin: 0.8 });
    expect(gap(measured, engine, 0.21, SECONDS)).toBeLessThan(0.005);
  });

  it('follows a note value turned from where it is, pulled onto its beat over two cycles, the model on the sound', async () => {
    // A 1/8 at 120 BPM from 0.2 s, 4 Hz: on its beats from 0.8 + 0.5 s, every quarter of a second from 0.2 s.
    const { measured, engine } = await gains({}, (e, lfoAmount) => e.applyPatch({ ...defaultPatch(), ...tremolo, lfoNote: noteIndex('1/8'), lfoAmount }));
    noJump(engine);
    onTheBeats(measured, engine, [1.7, 2.2], 1 / 4);
    expect(gap(measured, engine, 0.21, SECONDS)).toBeLessThan(0.005);
  });

  it('is pulled onto the beat when Sync comes on', async () => {
    // Off until 0.8 s at 0.7 Hz; on there, the saw is pulled onto the beats of 120 BPM counted from 0.2 s over two
    // cycles of 1/2 s: on them from 1.8 s, the next at 2.2 s.
    const synced = await gains({ lfoSync: 'off', lfoRate: 0.7 }, (e, lfoAmount) => e.applyPatch({ ...defaultPatch(), ...tremolo, lfoAmount }));
    noJump(synced.engine);
    onTheBeats(synced.measured, synced.engine, [2.2], 1 / 2);
    expect(synced.engine.lfoSwingAt(2.7 + 1 / 8)).toBeCloseTo(-0.5, 6);
    expect(gap(synced.measured, synced.engine, 0.21, SECONDS)).toBeLessThan(0.005);
  });

  it('restarts at each Note with Retrigger on, at the note value’s Hz, which follows the tempo', async () => {
    const { engine } = await gains({ lfoRetrigger: 'note' }, (e) => {
      e.setTempo(60);
      e.noteOn(69, 1, 1);
    });
    // Restarted at the Note at 0, a 2 Hz saw is at its foot on every half second, the beat count left aside.
    expect(engine.lfoSwingAt(0.5)).toBeCloseTo(-1, 9);
    expect(engine.lfoSwingAt(0.2)).toBeCloseTo(-0.2, 9);
    // At 60 BPM from 0.8 s, 1 Hz, and the Note at 1 s restarts it there.
    expect(engine.lfoSwingAt(1)).toBeCloseTo(-1, 9);
    expect(engine.lfoSwingAt(1.25)).toBeCloseTo(-0.5, 9);
  });
});

// Review 14: a synced free LFO jumped to its new phase when its note value or the tempo changed under a Note, and on
// the Volume that clicked (×121 by hand, ×42 for one BPM). It must change speed from where it is, as a free LFO's Hz
// change always has (1.19.0's, the control here), and come back onto the beat without a jump.
describe('a synced free LFO changes speed without a jump (review 14)', () => {
  const tremolo = {
    cutoff: 20000, resonance: 0, waveform: 'sine', ampSustain: 1, ampAttack: 0.001,
    lfoDestination: 'volume', lfoAmount: 0.8, lfoWaveform: 'sine', lfoRetrigger: 'free',
  } as const;
  const synced = { ...tremolo, lfoSync: 'on', lfoNote: noteIndex('1/8') } as const;
  // A quarter into a 1/8's cycle at 120 BPM (4 Hz) from 0, on a quantum: the 1/16's beat puts it half way round.
  const AT = (211 * 128) / SR;
  /** A3 held from 0.05 s at 120 BPM counted from 0, `change` done at AT; the limiter straight. */
  const play = async (patch: Partial<Patch>, change: (e: ReturnType<typeof createSynthEngine>) => void) => {
    const ctx = new OfflineAudioContext(1, SR * 1.6, SR);
    straightenLimiter(ctx);
    const engine = createSynthEngine(ctx);
    engine.setTempo(120, 0);
    engine.applyPatch({ ...defaultPatch(), ...patch });
    engine.noteOn(57, 1, 0.05);
    void ctx.suspend(AT).then(() => {
      change(engine);
      void ctx.resume();
    });
    return { s: (await ctx.startRendering()).getChannelData(0), engine };
  };
  /** The largest bend (second difference) from `from` to `to` seconds: a jump in the gain is one far past the wave's. */
  const steepestBend = (s: Float32Array, from: number, to: number) => {
    let most = 0;
    for (let i = Math.round(from * SR) + 1; i < Math.round(to * SR) - 1; i++) most = Math.max(most, Math.abs(s[i + 1] - 2 * s[i] + s[i - 1]));
    return most;
  };
  const bendAround = (s: Float32Array) => steepestBend(s, AT - 0.01, AT + 0.6);

  it('a note value turned mid-Note bends no more than a free LFO’s Hz turned, and lands on the new beat', async () => {
    const { s, engine } = await play(synced, (e) => e.applyPatch({ ...defaultPatch(), ...synced, lfoNote: noteIndex('1/16') }));
    const free = await play({ ...tremolo, lfoRate: 4 }, (e) => e.applyPatch({ ...defaultPatch(), ...tremolo, lfoRate: 8 }));
    expect(bendAround(s)).toBeLessThan(1.5 * bendAround(free.s));
    // On the 1/16's beats once it has been pulled there: a sine at its centre rising on each, a quarter on at its top.
    for (const beat of [1, 1.125, 1.25]) {
      expect(engine.lfoSwingAt(beat), `${beat} s`).toBeCloseTo(0, 6);
      expect(engine.lfoSwingAt(beat + 1 / 32), `${beat} s and a quarter`).toBeCloseTo(0.8, 6);
    }
  });

  it('a tempo set mid-Note (one BPM up) bends no more than a free LFO’s Hz turned, and lands on the new beat', async () => {
    const { s, engine } = await play(synced, (e) => e.setTempo(121));
    const free = await play({ ...tremolo, lfoRate: 4 }, (e) => e.applyPatch({ ...defaultPatch(), ...tremolo, lfoRate: (4 * 121) / 120 }));
    expect(bendAround(s)).toBeLessThan(1.5 * bendAround(free.s));
    // The beat counted again from AT: an 1/8 at 121 BPM is 60 / 121 / 2 s.
    for (const n of [4, 5, 6]) expect(engine.lfoSwingAt(AT + (n * 30) / 121), `cycle ${n}`).toBeCloseTo(0, 6);
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

describe('aftertouch (issue 132)', () => {
  // The Cutoff at no pressure and full: two octaves up (Claude's call, open to the owner); the Resonance, a knob with a
  // room, at half: 50 points up from 0.2.
  const cases = [
    { pressure: { destination: 'cutoff', amount: 0 }, cutoff: 300, resonance: 0 },
    { pressure: { destination: 'cutoff', amount: 1 }, cutoff: 1200, resonance: 0 },
    { pressure: { destination: 'resonance', amount: 0.5 }, cutoff: 300, resonance: 0.7, knob: 0.2 },
  ] as const;
  it('moves the Effective Cutoff and Resonance by the reach the model predicts, none at no pressure, and the sound follows', async () => {
    const harmonics = Float32Array.from({ length: 20 }, (_, i) => 110 * (i + 1));
    for (const { pressure, cutoff, resonance, ...rest } of cases) {
      const ctx = new OfflineAudioContext(1, SR, SR);
      const engine = createSynthEngine(ctx);
      const knob = 'knob' in rest ? rest.knob : 0;
      engine.applyPatch({ ...defaultPatch(), cutoff: 300, resonance: knob, ampSustain: 1, ampAttack: 0.001, lfoAmount: 0, lfo2Amount: 0 });
      engine.setPressure(pressure);
      engine.noteOn(45, 1, 0);
      const frame = ctx.suspend(0.5).then(() => {
        const read = (a: AnalyserNode) => {
          const s = new Float32Array(a.fftSize);
          a.getFloatTimeDomainData(s);
          return s;
        };
        const out = { osc: read(engine.taps.oscillator), filter: read(engine.taps.filter), curve: engine.filterResponse(harmonics), m: engine.modulationAt(0.5) };
        void ctx.resume();
        return out;
      });
      await ctx.startRendering();
      const { osc, filter, curve, m } = await frame;
      const name = `${pressure.destination} at ${pressure.amount}`;
      expect(m.cutoff, name).toBeCloseTo(cutoff, 3);
      expect(m.resonance, name).toBeCloseTo(resonance, 6);
      expect(m.pressure).toEqual(pressure);
      for (let i = 0; i < harmonics.length; i++) {
        if (dB(curve[i]) < -40) continue;
        const measured = dB(toneAmplitudeHann(filter, SR, harmonics[i]) / toneAmplitudeHann(osc, SR, harmonics[i]));
        expect(Math.abs(measured - dB(curve[i])), `${harmonics[i]} Hz, ${name}`).toBeLessThan(0.5);
      }
    }
  });

  it('on Pitch, raises the sound by up to a semitone, the model and Cycle Lock with it, and leaves the knobs as they are', async () => {
    const A2 = 45; // 110 Hz
    let engine!: ReturnType<typeof createSynthEngine>;
    const s = await render(1, { resonance: 0, ampAttack: 0.001, ampSustain: 1, cutoff: 20000, lfoAmount: 0, lfo2Amount: 0 }, (e) => {
      engine = e;
      e.noteOn(A2, 1, 0);
      e.setPressure({ destination: 'pitch', amount: 1 }, 0.2);
    });
    const last = [s.length - SR / 2, s.length] as const;
    const raised = 110 * 2 ** (1 / 12);
    expect(dB(toneAmplitude(s, SR, raised, ...last) / toneAmplitude(s, SR, 110, ...last))).toBeGreaterThan(20);
    expect(engine.modulationAt(0.8).pitch).toBeCloseTo(A2 + 1, 6);
    expect(engine.modulationAt(0.1).pitch).toBeCloseTo(A2, 6); // the Timeline's past keeps its own pressure
    expect(engine.fundamental()).toBeCloseTo(raised, 1);
    expect(engine.patchAt(0.8)?.cutoff).toBe(20000);
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

describe('Sub-oscillator', () => {
  /** The Oscillator Tap's samples half a second into a Note. */
  async function oscillatorTap(patch: Partial<Patch>, note: number) {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...patch });
    engine.noteOn(note, 1, 0);
    const frame = ctx.suspend(0.5).then(() => {
      const s = new Float32Array(engine.taps.oscillator.fftSize);
      engine.taps.oscillator.getFloatTimeDomainData(s);
      void ctx.resume();
      return { samples: s, fundamental: engine.fundamental() };
    });
    await ctx.startRendering();
    return frame;
  }

  it('plays a square an octave below Osc 1, at the levels the Ideal Reference draws', async () => {
    const patch = { ...defaultPatch(), mixOsc1: 1, mixSub: 0.6 };
    const { samples } = await oscillatorTap(patch, 57); // Osc 1 at 220 Hz, the Sub at 110 Hz
    const ideal = idealReference(patch, 16);
    for (const n of [1, 2, 3, 4, 5, 6]) {
      const measured = toneAmplitudeHann(samples, SR, 110 * n);
      expect(dB(measured / (ideal[n] * OSCILLATOR_LEVEL)), `Harmonic ${n} of 110 Hz`).toBeLessThan(0.5);
      expect(dB(measured / (ideal[n] * OSCILLATOR_LEVEL)), `Harmonic ${n} of 110 Hz`).toBeGreaterThan(-0.5);
    }
  });

  it('is silent at 0, so Harmonics count from Osc 1 as before', async () => {
    const { samples, fundamental } = await oscillatorTap({ mixSub: 0 }, 57);
    expect(toneAmplitudeHann(samples, SR, 110)).toBeLessThan(1e-3);
    expect(fundamental).toBeCloseTo(220);
  });

  it('moves Cycle Lock and the Harmonic Markers to its own pitch, where the sound now repeats', async () => {
    const { fundamental } = await oscillatorTap({ mixSub: 0.5 }, 57);
    expect(fundamental).toBeCloseTo(110);
  });
});

describe('several Voices (ADR-0007)', () => {
  const A2 = 45; // 110 Hz
  const E3 = 52; // 164.8 Hz
  const steady = { cutoff: 20000, resonance: 0, ampAttack: 0.001, ampSustain: 1, ampRelease: 0.02 };
  const tone = (s: Float32Array, hz: number) => toneAmplitude(s, SR, hz, s.length - SR / 2, s.length);
  const chord = (e: ReturnType<typeof createSynthEngine>) => {
    e.noteOn(A2, 1, 0);
    e.noteOn(E3, 1, 0.1);
  };

  it('plays both Notes of a chord, where one Voice plays only the newest', async () => {
    const poly = await render(1, { ...steady, voices: 4 }, chord);
    expect(dB(tone(poly, 110) / tone(poly, 164.8))).toBeGreaterThan(-3);
    const mono = await render(1, { ...steady, voices: 1 }, chord);
    expect(dB(tone(mono, 110) / tone(mono, 164.8))).toBeLessThan(-30);
  });

  it('shows only the newest Note at the Taps, as if it were played alone', async () => {
    const ctx = new OfflineAudioContext(1, SR * 0.6, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...steady, voices: 4 });
    chord(engine);
    const captured = ctx.suspend(0.5).then(() => {
      const s = new Float32Array(engine.taps.oscillator.fftSize);
      engine.taps.oscillator.getFloatTimeDomainData(s);
      void ctx.resume();
      return s;
    });
    await ctx.startRendering();
    const osc = await captured;
    // Hann-windowed: a rectangular window lets the newest Note's saw leak into 110 Hz by as much, as its cycle falls.
    expect(dB(toneAmplitudeHann(osc, SR, 110) / toneAmplitudeHann(osc, SR, 164.8))).toBeLessThan(-30);
    expect(engine.fundamental()).toBeCloseTo(164.8, 0);
  });

  it('carries the whole chord at the Amp Tap only, when asked to show all Voices', async () => {
    const ctx = new OfflineAudioContext(1, SR * 0.6, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...steady, voices: 4 });
    engine.setTapSource('all');
    chord(engine);
    const read = (a: AnalyserNode) => {
      const s = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(s);
      return s;
    };
    const captured = ctx.suspend(0.5).then(() => {
      const taps = { oscillator: read(engine.taps.oscillator), filter: read(engine.taps.filter), amp: read(engine.taps.amp) };
      void ctx.resume();
      return taps;
    });
    await ctx.startRendering();
    const taps = await captured;
    const older = (s: Float32Array) => dB(toneAmplitudeHann(s, SR, 110) / toneAmplitudeHann(s, SR, 164.8));
    expect(older(taps.amp)).toBeGreaterThan(-3); // both Notes at the Amp Tap
    expect(older(taps.oscillator)).toBeLessThan(-30); // the newest alone before it, so Cycle Lock and the Markers stay exact
    expect(older(taps.filter)).toBeLessThan(-30);
  });

  it('releases one Note of a chord and keeps the other sounding', async () => {
    const s = await render(1, { ...steady, voices: 4 }, (e) => {
      chord(e);
      e.release(E3, 0.3);
    });
    expect(dB(tone(s, 164.8) / tone(s, 110))).toBeLessThan(-30);
  });

  it('on one Voice, releasing the Note sounding closes the Gate, and releasing one it has moved on from does not (issue 75)', async () => {
    const level = (s: Float32Array, from: number) => rms(s, Math.round(SR * from), Math.round(SR * (from + 0.1)));
    const mono = { ...steady, voices: 1 as const };
    const ended = await render(1, mono, (e) => {
      e.noteOn(A2, 1, 0);
      e.release(A2, 0.3);
    });
    expect(level(ended, 0.1)).toBeGreaterThan(0.02);
    expect(level(ended, 0.6)).toBeLessThan(1e-3);
    const movedOn = await render(1, mono, (e) => {
      e.noteOn(A2, 1, 0);
      e.noteOn(E3, 1, 0.2);
      e.release(A2, 0.3); // E3 has the Voice now: it sounds on
    });
    expect(level(movedOn, 0.6)).toBeGreaterThan(0.02);
    // A chord on one Voice plays its last Note, and ends when that Note is released.
    const chordEnded = await render(1, mono, (e) => {
      e.noteOn(A2, 1, 0);
      e.noteOn(E3, 1, 0);
      e.release(A2, 0.3);
      e.release(E3, 0.3);
    });
    expect(level(chordEnded, 0.6)).toBeLessThan(1e-3);
  });

  it('takes the oldest Voice when every Voice is sounding', async () => {
    const s = await render(1, { ...steady, voices: 2 }, (e) => {
      e.noteOn(A2, 1, 0);
      e.noteOn(E3, 1, 0.1);
      e.noteOn(57, 1, 0.2); // A3: takes A2's Voice, so A2 stops and E3 stays
    });
    expect(dB(tone(s, 110) / tone(s, 220))).toBeLessThan(-30);
    expect(dB(tone(s, 164.8) / tone(s, 220))).toBeGreaterThan(-3);
  });

  it('closes the Gate on every Voice at once', async () => {
    const s = await render(1, { ...steady, voices: 4 }, (e) => {
      chord(e);
      e.noteOff(0.3);
    });
    expect(rms(s, Math.round(SR * 0.6), s.length)).toBeLessThan(rms(s, Math.round(SR * 0.15), Math.round(SR * 0.3)) * 0.001);
  });

  it('turns the listening level down by √Voices, after the Amp Tap, so one Voice of four never reaches the limiter', async () => {
    const one = await render(0.5, { ...steady, voices: 1 }, (e) => e.noteOn(A2, 1, 0));
    const four = await render(0.5, { ...steady, voices: 4 }, (e) => e.noteOn(A2, 1, 0));
    const peak = (x: Float32Array) => x.subarray(SR * 0.25).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak(four) / peak(one)).toBeCloseTo(0.5, 1);
    const taps = await tapsAt(0.4, { ...steady, voices: 4 });
    expect(taps.amp.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeCloseTo(OSCILLATOR_LEVEL, 1);
  });

  it('reports when the limiter is bending the summed output, which the one shown Voice cannot tell', async () => {
    const ctx = new OfflineAudioContext(1, SR * 0.6, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...steady, resonance: 1, cutoff: 110, voices: 4 });
    for (const [note, t] of [[A2, 0], [A2 + 7, 0.05], [A2 + 12, 0.1], [A2 + 19, 0.15]] as const) engine.noteOn(note, 1, t);
    const captured = ctx.suspend(0.5).then(() => {
      const limiting = engine.limiting();
      void ctx.resume();
      return limiting;
    });
    await ctx.startRendering();
    expect(await captured).toBe(true);
    const quiet = new OfflineAudioContext(1, SR * 0.6, SR);
    const soft = createSynthEngine(quiet);
    soft.applyPatch({ ...defaultPatch(), ...steady, voices: 4 });
    soft.noteOn(A2, 0.5, 0);
    const captured2 = quiet.suspend(0.5).then(() => {
      const limiting = soft.limiting();
      void quiet.resume();
      return limiting;
    });
    await quiet.startRendering();
    expect(await captured2).toBe(false);
  });
});

// One test per Preset: rendering all of them in one test took most of the browser's 15 s per test, and ran
// past it when the whole suite shared the machine.
describe('every Preset makes a sound when a chord is played, and stays within full scale at the output', () => {
  it.each(PRESETS.map((p) => [p.name, p] as const))('%s', async (_, preset) => {
    const ctx = new OfflineAudioContext(1, SR * 0.8, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(preset.patch);
    engine.noteOn(57, 1, 0); // A3, C#4, E4: a chord with 4 Voices, the newest Note alone with 1
    engine.noteOn(61, 1, 0.02);
    engine.noteOn(64, 1, 0.04);
    const s = (await ctx.startRendering()).getChannelData(0);
    expect(rms(s)).toBeGreaterThanOrEqual(1e-4);
    expect(s.reduce((m, v) => Math.max(m, Math.abs(v)), 0)).toBeLessThanOrEqual(1);
  });
});

describe('the Timeline’s past stays put while knobs turn (the model’s history)', () => {
  it('draws the same LFO and Cutoff for a past moment however many changes follow', async () => {
    // Hundreds of Patch changes, as a knob drag or the Demo makes: every 10 ms for 4 s, the LFO Rate moving.
    const ctx = new OfflineAudioContext(1, SR * 4.2, SR);
    const engine = createSynthEngine(ctx);
    const base = { ...defaultPatch(), lfoAmount: 0.5, lfoDestination: 'cutoff', cutoff: 1000 } as const;
    engine.applyPatch(base);
    engine.noteOn(45, 1, 0);
    const seen: { lfo: number; cutoff: number }[] = [];
    const steps = 400;
    const done = Promise.all(
      Array.from({ length: steps }, (_, i) =>
        ctx.suspend((i + 1) * 0.01).then(() => {
          engine.applyPatch({ ...base, lfoRate: 1 + (i % 7) });
          if (i + 1 === 200 || i + 1 === steps) {
            const m = engine.modulationAt(1.0);
            seen.push({ lfo: m.lfo[0], cutoff: m.cutoff });
            // The LFO plot's cheap reading is the model's LFO times its Depth, through every Rate change.
            for (const t of [0.5, 1.0, (i + 1) * 0.01]) expect(engine.lfoSwingAt(t)).toBe(0.5 * engine.modulationAt(t).lfo[0]);
          }
          void ctx.resume();
        }),
      ),
    );
    await ctx.startRendering();
    await done;
    expect(seen).toHaveLength(2);
    expect(seen[1].lfo).toBeCloseTo(seen[0].lfo, 9); // the moment at 1.0 s looks the same after 200 more changes
    expect(seen[1].cutoff).toBeCloseTo(seen[0].cutoff, 6);
  });
});

describe('Osc 1 Octave (issue 90)', () => {
  const A2 = 45; // 110 Hz
  const clean = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine' } as const;
  const steady = (s: Float32Array) => s.subarray(SR / 2, SR / 2 + Math.round((20 * SR) / 27.5)); // whole periods of 27.5 Hz

  it('moves Osc 1 by whole octaves, and the Sub with it', async () => {
    const down = steady(await render(2, { ...clean, osc1Octave: -1 }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(down, SR, 110) / toneAmplitude(down, SR, 55))).toBeLessThan(-60);
    const sub = steady(await render(2, { ...clean, osc1Octave: -1, mixOsc1: 0, mixSub: 1 }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(sub, SR, 55) / toneAmplitude(sub, SR, 27.5))).toBeLessThan(-60);
  });

  it('leaves Osc 2 on the Note played', async () => {
    const s = steady(await render(2, { ...clean, osc2Waveform: 'sine', osc1Octave: 1, mixOsc1: 0, mixOsc2: 1 }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(s, SR, 220) / toneAmplitude(s, SR, 110))).toBeLessThan(-60);
  });

  it('counts Cycle Lock from Osc 1, and from the Sub below it', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    engine.applyPatch({ ...defaultPatch(), osc1Octave: -1 });
    engine.noteOn(57, 1, 0);
    expect(engine.fundamental()).toBeCloseTo(110);
    engine.applyPatch({ ...defaultPatch(), osc1Octave: 1, mixSub: 0.5 });
    expect(engine.fundamental()).toBeCloseTo(220);
  });

  for (const osc2Octave of [1, 2])
    it(`keeps a pulse's width at its knob's whatever its tuning (Osc 2 at +${osc2Octave} oct, 25 %)`, async () => {
      const solo2 = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, mixOsc1: 0, mixOsc2: 1, osc2Waveform: 'pulse', osc2PulseWidth: 0.25 } as const;
      const s = await render(1, { ...solo2, osc2Octave }, (e) => e.noteOn(A2, 1, 0));
      const f = 110 * 2 ** osc2Octave;
      const window = s.subarray(SR / 2, SR / 2 + Math.round((40 * SR) / 110));
      const h = (n: number) => toneAmplitude(window, SR, f * n);
      expect(dB(h(4) / h(1)), 'every 4th Harmonic missing').toBeLessThan(-40);
      expect(dB(h(2) / h(1)), 'even Harmonics present').toBeGreaterThan(-6);
    });
});

describe('the Sub’s Octave and Waveform (issue 91)', () => {
  const A2 = 45; // 110 Hz: the Sub at 55 Hz, or 27.5 Hz two octaves down
  const subAlone = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, mixOsc1: 0, mixSub: 1 } as const;
  const steady = (s: Float32Array) => s.subarray(SR / 2, SR / 2 + Math.round((20 * SR) / 27.5));

  it('sits two octaves below Osc 1 at −2', async () => {
    const s = steady(await render(2, { ...subAlone, subOctave: -2 }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(s, SR, 55) / toneAmplitude(s, SR, 27.5))).toBeLessThan(-60);
    expect(dB(toneAmplitude(s, SR, 82.5) / toneAmplitude(s, SR, 27.5))).toBeCloseTo(dB(1 / 3), 0); // a square's 3rd
  });

  it('has no 3rd Harmonic as a sine', async () => {
    const s = steady(await render(2, { ...subAlone, subWaveform: 'sine' }, (e) => e.noteOn(A2, 1, 0)));
    expect(dB(toneAmplitude(s, SR, 165) / toneAmplitude(s, SR, 55))).toBeLessThan(-60);
  });

  it('counts Cycle Lock from the Sub, two octaves down', () => {
    const engine = createSynthEngine(new OfflineAudioContext(1, SR, SR));
    engine.applyPatch({ ...defaultPatch(), mixSub: 1, subOctave: -2 });
    engine.noteOn(57, 1, 0);
    expect(engine.fundamental()).toBeCloseTo(55);
  });
});

describe('Pink Noise (issue 92)', () => {
  const noiseAlone = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, mixOsc1: 0, mixNoise: 1 } as const;
  // The average level in a band a third of an octave wide around `f`, from many short Hann-windowed frames.
  const bandLevel = (s: Float32Array, f: number) => {
    let sum = 0;
    let n = 0;
    for (let from = SR / 2; from + 4096 <= s.length; from += 4096)
      for (const k of [0.9, 0.95, 1, 1.05, 1.1]) {
        sum += toneAmplitudeHann(s.subarray(from, from + 4096), SR, f * k) ** 2;
        n++;
      }
    return Math.sqrt(sum / n);
  };

  it('falls 3 dB an octave, 10 dB a decade; white stays level', async () => {
    const pink = await render(3, { ...noiseAlone, noiseColour: 'pink' }, (e) => e.noteOn(57, 1, 0));
    const white = await render(3, noiseAlone, (e) => e.noteOn(57, 1, 0));
    expect(dB(bandLevel(pink, 4000) / bandLevel(pink, 400))).toBeCloseTo(-10, -0.5);
    expect(Math.abs(dB(bandLevel(white, 4000) / bandLevel(white, 400)))).toBeLessThan(2);
  });

  it('is as loud as white (RMS within 1 dB)', async () => {
    const pink = await render(2, { ...noiseAlone, noiseColour: 'pink' }, (e) => e.noteOn(57, 1, 0));
    const white = await render(2, noiseAlone, (e) => e.noteOn(57, 1, 0));
    expect(Math.abs(dB(rms(pink, SR / 2) / rms(white, SR / 2)))).toBeLessThan(1);
  });
});

describe('Ring Modulation (issue 88)', () => {
  const A2 = 45; // 110 Hz
  const ringAlone = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine', mixOsc1: 0, mixOsc2: 0, mixRing: 1 } as const;

  it('sounds two sines a fifth apart at their difference and their sum, and at neither pitch', async () => {
    const s = await render(1.5, { ...ringAlone, osc2Semitone: 7 }, (e) => e.noteOn(A2, 1, 0));
    const window = s.subarray(SR / 2, SR / 2 + 32768);
    const fifth = 110 * 2 ** (7 / 12);
    const at = (f: number) => toneAmplitudeHann(window, SR, f);
    expect(dB(at(fifth - 110) / at(fifth + 110))).toBeCloseTo(0, 0);
    expect(dB(at(110) / at(fifth + 110))).toBeLessThan(-40);
    expect(dB(at(fifth) / at(fifth + 110))).toBeLessThan(-40);
  });

  it('does not restart the Oscillators on a legato Note, a key pressed while one is held (issue 94, decision 2)', async () => {
    // One Voice, one sine, a Glide: the second key slides on from the first, so the wave carries on, with no jump.
    const patch = { cutoff: 20000, resonance: 0, ampAttack: 0.001, ampSustain: 1, waveform: 'sine', glide: 0.2 } as const;
    const s = await render(0.8, patch, (e) => {
      e.noteOn(45, 1, 0);
      e.noteOn(52, 1, 0.5023); // a quarter of a 110 Hz cycle past a whole number of them
    });
    expect(steepestStep(s, 0.497, 0.507)).toBeLessThan(1.5 * steepestStep(s, 0.3, 0.45));
  });

  it('sounds the same on a Note whether or not Osc 2 was retuned before it (issue 94)', async () => {
    const squares = { ...defaultPatch(), ...ringAlone, waveform: 'square', osc2Waveform: 'square' } as const;
    const second = async (away: number) => {
      const ctx = new OfflineAudioContext(1, SR * 2, SR);
      const e = createSynthEngine(ctx);
      e.applyPatch(squares);
      e.noteOn(A2, 1, 0);
      e.noteOff(0.1);
      // Osc 2 a semitone up for a while, then back, before the next Note (a context suspends once at a moment).
      if (away) {
        ctx.suspend(0.25).then(() => {
          e.applyPatch({ ...squares, osc2Semitone: 1 });
          ctx.resume();
        });
        ctx.suspend(0.25 + Math.round(away * 128) / 128).then(() => {
          e.applyPatch(squares);
          ctx.resume();
        });
      }
      e.noteOn(A2, 1, 1);
      const s = (await ctx.startRendering()).getChannelData(0);
      return toneAmplitude(s, SR, 220, 1.25 * SR, 1.25 * SR + 40 * (SR / 110));
    };
    const [never, retuned] = [await second(0), await second(0.37)];
    expect(Math.abs(dB(retuned / never))).toBeLessThan(0.5);
  });

  it('sounds a Square times a Square an octave up at the levels the Ideal draws (issue 94)', async () => {
    const patch = { ...defaultPatch(), ...ringAlone, waveform: 'square', osc2Waveform: 'square', osc2Octave: 1 } as const;
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(patch);
    engine.noteOn(A2, 1, 0);
    const frame = ctx.suspend(0.5).then(() => {
      const s = new Float32Array(engine.taps.oscillator.fftSize);
      engine.taps.oscillator.getFloatTimeDomainData(s);
      void ctx.resume();
      return s;
    });
    await ctx.startRendering();
    const samples = await frame;
    const ideal = idealReference(patch, 16);
    for (const n of [1, 3, 5, 7]) {
      const measured = toneAmplitudeHann(samples, SR, 110 * n);
      expect(Math.abs(dB(measured / (ideal[n] * OSCILLATOR_LEVEL))), `Harmonic ${n} of 110 Hz`).toBeLessThan(0.5);
    }
    // The even ones cancel, in the sound as in the Ideal.
    for (const n of [2, 4, 6]) expect(ideal[n]).toBe(0);
    for (const n of [2, 4, 6]) expect(dB(toneAmplitudeHann(samples, SR, 110 * n) / (ideal[1] * OSCILLATOR_LEVEL))).toBeLessThan(-40);
  });

  it('is silent while Ring is down, whatever the Oscillators', async () => {
    const s = await render(0.5, { ...ringAlone, mixRing: 0, osc2Semitone: 7 }, (e) => e.noteOn(A2, 1, 0));
    expect(rms(s, SR / 4)).toBeLessThan(1e-6);
  });
});

describe('FM (issue 89)', () => {
  const sines = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine' } as const;
  const harmonics = async (note: number, fm: number) => {
    const s = await render(1.5, { ...sines, crossMod: fm }, (e) => e.noteOn(note, 1, 0));
    const f = 440 * 2 ** ((note - 69) / 12);
    const window = s.subarray(SR / 2, SR / 2 + Math.round((40 * SR) / f) * 1);
    return (n: number) => toneAmplitude(window, SR, f * n);
  };

  it('gives Osc 1 sidebands on its Harmonics, none while FM is down', async () => {
    const off = await harmonics(45, 0);
    expect(dB(off(2) / off(1))).toBeLessThan(-60);
    const on = await harmonics(45, 0.25);
    expect(dB(on(2) / on(1))).toBeGreaterThan(-20);
    expect(dB(on(3) / on(1))).toBeGreaterThan(-40);
  });

  it('keeps the same index on every Note: an octave up, the same spectrum', async () => {
    const low = await harmonics(45, 0.25);
    const high = await harmonics(57, 0.25);
    expect(dB(high(2) / high(1))).toBeCloseTo(dB(low(2) / low(1)), 0);
  });
});

describe('an LFO on FM (issue 97)', () => {
  it('swings the sidebands with the LFO, down to none at its trough when it reaches 0', async () => {
    // FM at 25 %, LFO 1 at full Depth on it, slow and retriggered: it swings FM from 0 to 50 % once a second.
    const patch = {
      cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine', crossMod: 0.25,
      lfoDestination: 'fm', lfoAmount: 1, lfoRate: 1, lfoWaveform: 'sine', lfoRetrigger: 'note',
    } as const;
    const s = await render(1.2, patch, (e) => e.noteOn(45, 1, 0));
    const f = 110;
    const second = (at: number) => {
      const start = Math.round(at * SR);
      const window = s.subarray(start, start + Math.round((8 * SR) / f));
      return dB(toneAmplitude(window, SR, 2 * f) / toneAmplitude(window, SR, f));
    };
    // A sine LFO peaks a quarter of a cycle in (FM at 50 %) and dips three quarters in (FM at 0).
    expect(second(0.21)).toBeGreaterThan(-15);
    expect(second(0.71)).toBeLessThan(-45);
  });

  it('sounds the sidebands the Ideal draws for the FM the model gives, at each end of a square LFO (ADR-0003)', async () => {
    // FM at 30 %, LFO 1 at a fifth of its Depth on it: FM at 50 % for the LFO's first second, 10 % for its next.
    const patch = {
      ...defaultPatch(), cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7,
      crossMod: 0.3, lfoDestination: 'fm', lfoAmount: 0.2, lfoRate: 0.5, lfoWaveform: 'square', lfoRetrigger: 'note',
    } as const;
    let engine!: ReturnType<typeof createSynthEngine>;
    const s = await render(2, patch, (e) => {
      engine = e;
      e.noteOn(57, 1, 0); // 220 Hz
    });
    const fms: number[] = [];
    for (const t of [0.5, 1.5]) {
      const fm = patch.crossMod + lfoOffset(patch, 'fm', engine.modulationAt(t).lfo, patch.crossMod);
      fms.push(fm);
      const window = s.subarray(Math.round(t * SR) - 4096, Math.round(t * SR) + 4096);
      const marks = idealPartials({ ...patch, crossMod: fm, lfoAmount: 0 }, 32).filter((p) => p.ratio * 220 < 4000);
      const top = Math.max(...marks.map((p) => p.level));
      const shown = marks.filter((p) => p.level > top / 100);
      const heard = shown.map((p) => toneAmplitudeHann(window, SR, 220 * p.ratio));
      const loudest = Math.max(...heard);
      expect(shown.length, `at ${t} s`).toBeGreaterThan(2);
      shown.forEach((p, i) =>
        expect(Math.abs(dB(heard[i] / loudest) - dB(p.level / top)), `the partial at ${p.ratio.toFixed(3)}, ${t} s`).toBeLessThan(0.5),
      );
    }
    expect(fms[0]).toBeCloseTo(0.5);
    expect(fms[1]).toBeCloseTo(0.1);
  });
});

describe('FM’s sidebands in the Ideal (issue 96)', () => {
  const A2 = 45; // 110 Hz
  const fm = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, mixOsc1: 1, mixOsc2: 0 } as const;
  /** Each of Osc 1's marks the sound reaches within 40 dB of the strongest, as dB from the strongest: the Ideal's and the sound's. */
  const compare = async (patch: Partial<Patch>) => {
    const full = { ...defaultPatch(), ...fm, ...patch };
    const s = await render(1.5, full, (e) => e.noteOn(A2, 1, 0));
    const window = s.subarray(SR / 2, SR / 2 + 32768);
    const marks = idealPartials(full, 64).filter((p) => p.source === 'osc1' && p.ratio * 110 < 4000);
    const top = Math.max(...marks.map((p) => p.level));
    const shown = marks.filter((p) => p.level > top / 100);
    const heard = shown.map((p) => toneAmplitudeHann(window, SR, 110 * p.ratio));
    const loudest = Math.max(...heard);
    return shown.map((p, i) => ({ ratio: p.ratio, ideal: dB(p.level / top), sound: dB(heard[i] / loudest) }));
  };

  it('draws two Sines a fifth apart with FM at each sideband the sound makes (the Bessel functions)', async () => {
    const marks = await compare({ waveform: 'sine', osc2Waveform: 'sine', osc2Semitone: 7, crossMod: 0.25 });
    expect(marks.length).toBeGreaterThan(4); // the carrier and sidebands either side, not one plain Harmonic
    for (const m of marks) expect(Math.abs(m.sound - m.ideal), `the partial at ${m.ratio.toFixed(3)}`).toBeLessThan(0.5);
  });

  it('draws a Saw modulated by a Square in tune at each Harmonic the sound makes (worked out from the waves)', async () => {
    const marks = await compare({ waveform: 'saw', osc2Waveform: 'square', crossMod: 0.1 });
    for (const m of marks.slice(0, 8)) expect(Math.abs(m.sound - m.ideal), `Harmonic ${m.ratio}`).toBeLessThan(1);
    // FM moves the levels away from a plain Saw's 1/n.
    expect(Math.abs(marks[1].ideal - dB(1 / 2))).toBeGreaterThan(1);
  });
});

describe('the Ideal on a held Envelope (issue 98)', () => {
  const A2 = 45; // 110 Hz
  // Env Amount 14 at a Sustain of 0.5 holds Osc 2 a fifth above its knobs while the Note is held.
  const held = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, osc2EnvAmount: 14, filterAttack: 0.001, filterDecay: 0.05, filterSustain: 0.5 } as const;
  /** Each of `source`'s marks within 40 dB of its strongest, under 4 kHz, as dB from the strongest: the Ideal's and the sound's. */
  const compare = async (patch: Partial<Patch>, source: string) => {
    const full = { ...defaultPatch(), ...held, ...patch };
    const s = await render(1.5, full, (e) => e.noteOn(A2, 1, 0));
    const window = s.subarray(SR / 2, SR / 2 + 32768);
    const marks = idealPartials(full, 64, { gateOn: true }).filter((p) => p.source === source && p.ratio * 110 < 4000);
    const top = Math.max(...marks.map((p) => p.level));
    const shown = marks.filter((p) => p.level > top / 100);
    const heard = shown.map((p) => toneAmplitudeHann(window, SR, 110 * p.ratio));
    const loudest = Math.max(...heard);
    return shown.map((p, i) => ({ ratio: p.ratio, ideal: dB(p.level / top), sound: dB(heard[i] / loudest) }));
  };
  const onPeaks = (marks: Awaited<ReturnType<typeof compare>>) => {
    expect(marks.length).toBeGreaterThan(1);
    for (const m of marks) expect(Math.abs(m.sound - m.ideal), `the mark at ${m.ratio.toFixed(3)}`).toBeLessThan(1);
  };

  it('puts Osc 2’s squares on its Harmonics a fifth up', async () => {
    onPeaks(await compare({ mixOsc1: 0, mixOsc2: 1, osc2Waveform: 'square' }, 'osc2'));
  });

  it('puts Ring’s diamonds on the sum and difference with Osc 2 a fifth up', async () => {
    onPeaks(await compare({ mixOsc1: 0, mixOsc2: 0, mixRing: 1, waveform: 'sine', osc2Waveform: 'sine' }, 'ring'));
  });

  it('puts FM’s circles on the sidebands of Osc 2 a fifth up, at the index the knobs set', async () => {
    onPeaks(await compare({ mixOsc1: 1, mixOsc2: 0, crossMod: 0.25, waveform: 'sine', osc2Waveform: 'sine' }, 'osc1'));
  });
});

describe('FM and Ring under the top, and no offset (issue 103)', () => {
  const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
  const C4 = 60;
  const C6 = 84;
  const C7 = 96;
  const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
  /** A Note held from 0 to `hold`, rendered at `rate`. */
  const play = async (patch: Patch, note: number, seconds: number, rate = SR, hold = seconds) => {
    const ctx = new OfflineAudioContext(1, Math.round(rate * seconds), rate);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(patch);
    engine.noteOn(note, 1, 0);
    engine.noteOff(hold);
    return (await ctx.startRendering()).getChannelData(0);
  };
  const HIGH = 192000;
  /** Rendered at 192 kHz, nothing folds: what lies past 24 kHz is what a 48 kHz device folds back. */
  const foldedDb = async (patch: Patch, note: number) => energyAboveDb(await play(patch, note, 0.8, HIGH), HIGH, 24000, HIGH * 0.05, 131072);

  for (const name of ['Clang Alarm', 'Breathing Bell', 'FM Bell'])
    it(`keeps ${name} on C7 from folding back: under −60 dB past 24 kHz, rendered at 192 kHz as review 14 measured`, async () => {
      expect(await foldedDb(preset(name), C7)).toBeLessThan(-60);
    });

  it('hears what lies past 24 kHz when there is some: a plain Saw on C7 (control case)', async () => {
    expect(await foldedDb({ ...defaultPatch(), cutoff: 20000, resonance: 0, ampSustain: 1 }, C7)).toBeGreaterThan(-40);
  });

  it('draws the Ideal at the depth the Note keeps: two Sines like FM Bell’s on C7 sound at its sidebands', async () => {
    const patch = {
      ...defaultPatch(), cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001,
      waveform: 'sine', osc2Waveform: 'sine', osc2Octave: 1, osc2Semitone: 10, crossMod: 0.3,
    } as const;
    const kept = fmDepthKept(patch, hz(C7), SR);
    expect(kept).toBeLessThan(0.5);
    // At the Oscillator Tap, where the Ideal is drawn: the open Filter already bends the top a little.
    const window = (await tapsAt(0.5, patch, C7)).oscillator;
    const marks = idealPartials(patch, 16, { fmKept: kept }).filter((p) => p.source === 'osc1' && p.ratio * hz(C7) < 20000);
    const top = Math.max(...marks.map((p) => p.level));
    const shown = marks.filter((p) => p.level > top / 100);
    expect(shown.length).toBeGreaterThan(2); // the carrier and sidebands, not one plain Harmonic
    const heard = shown.map((p) => toneAmplitudeHann(window, SR, hz(C7) * p.ratio));
    const loudest = Math.max(...heard);
    // Within 1 dB: the browser sums Osc 1's swing sample by sample, which with Osc 2 at 7.5 kHz swings it about 4 %
    // further than the Ideal's index (J_2, 40 dB down, 0.7 dB louder).
    for (const [i, p] of shown.entries())
      expect(Math.abs(dB(heard[i] / loudest) - dB(p.level / top)), `the partial at ${p.ratio.toFixed(3)}`).toBeLessThan(1);
  });

  it('takes FM Ladder’s offset out: under −60 dBFS while the Gate is open, the Oscillator Tap’s wave centred', async () => {
    const s = await play(preset('FM Ladder'), C4, 1.2, SR, 1);
    const mean = s.subarray(0, SR).reduce((sum, v) => sum + v, 0) / SR;
    expect(dB(Math.abs(mean))).toBeLessThan(-60);
    const taps = await tapsAt(0.9, preset('FM Ladder'), C4);
    const tapMean = taps.oscillator.reduce((sum, v) => sum + v, 0) / taps.oscillator.length;
    const peak = taps.oscillator.reduce((most, v) => Math.max(most, Math.abs(v)), 0);
    expect(Math.abs(tapMean) / peak).toBeLessThan(0.01);
  });

  for (const note of [C4, C6])
    it(`keeps Ring Octave clean between its Harmonics on ${note === C4 ? 'C4' : 'C6'}: under −60 dB`, async () => {
      expect(betweenHarmonicsDb(await play(preset('Ring Octave'), note, 1), SR, hz(note))).toBeLessThan(-60);
    });

  it('drops only while Ring is up the Harmonics Ring would fold: a Saw through the Mixer alone keeps its full wave', async () => {
    const saws = { ...defaultPatch(), cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, mixRing: 0 };
    const fifteenth = async (patch: Patch) => {
      const s = await play(patch, C6, 0.6);
      const window = s.subarray(SR * 0.2, SR * 0.2 + 16384);
      return dB(toneAmplitudeHann(window, SR, hz(C6) * 15) / toneAmplitudeHann(window, SR, hz(C6)));
    };
    // A Saw's 15th Harmonic (15.7 kHz) at 1/15 of its first; with Ring up beside it, past the 12 kHz each of two Saws keeps.
    expect(await fifteenth(saws)).toBeCloseTo(dB(1 / 15), 0);
    expect(await fifteenth({ ...saws, mixRing: 0.001 })).toBeLessThan(dB(1 / 15) - 40);
  });

  const ringed = { ...defaultPatch(), cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, ampRelease: 0.01, mixRing: 0.001 };

  it('keeps a Note handed over on its own wave when a knob turns before it starts: C4 after C7, its 15th Harmonic whole (the 1.16.1 review)', async () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(ringed);
    engine.noteOn(C7, 1, 0);
    engine.release(C7, 0.2);
    engine.noteOn(C4, 1, 0.4); // handed over, and C7's Release faded by then: no dip
    const turned = ctx.suspend(0.3).then(() => {
      engine.applyPatch({ ...ringed, cutoff: 19000 });
      void ctx.resume();
    });
    const s = (await ctx.startRendering()).getChannelData(0);
    await turned;
    // C4 keeps 45 Harmonics beside Ring; C7's wave has 5.
    const window = s.subarray(SR * 0.6, SR * 0.6 + 16384);
    expect(dB(toneAmplitudeHann(window, SR, hz(C4) * 15) / toneAmplitudeHann(window, SR, hz(C4)))).toBeCloseTo(dB(1 / 15), 0);
  });

  it('gives a Note taking a Voice at the moment another started there its own wave: C7 after C4 and E4 on 2 Voices folds nothing back (the 1.16.1 review)', async () => {
    const ctx = new OfflineAudioContext(1, HIGH * 0.8, HIGH);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...ringed, voices: 2 });
    for (const note of [C4, 64, C7]) engine.noteOn(note, 1, 0); // C7 takes C4's Voice, at the moment C4 started
    const s = (await ctx.startRendering()).getChannelData(0);
    expect(energyAboveDb(s, HIGH, 24000, HIGH * 0.05, 131072)).toBeLessThan(-60);
  });
});

describe('the Filter Envelope on Osc 2’s pitch (issue 93)', () => {
  const osc2Alone = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, osc2Waveform: 'sine', mixOsc1: 0, mixOsc2: 1, filterAttack: 0.001 } as const;

  it('takes Osc 2 an octave up at the Envelope’s full level, and back once it has fallen to a Sustain of 0', async () => {
    const held = await render(1, { ...osc2Alone, osc2EnvAmount: 12, filterSustain: 1 }, (e) => e.noteOn(45, 1, 0));
    expect(frequencyAround(held, SR, 0.7, 0.2)).toBeCloseTo(220, -1);
    const fallen = await render(1, { ...osc2Alone, osc2EnvAmount: 12, filterSustain: 0, filterDecay: 0.05 }, (e) => e.noteOn(45, 1, 0));
    expect(frequencyAround(fallen, SR, 0.7, 0.2)).toBeCloseTo(110, -1);
  });

  it('leaves Osc 2 alone at 0', async () => {
    const s = await render(1, { ...osc2Alone, filterSustain: 1 }, (e) => e.noteOn(45, 1, 0));
    expect(frequencyAround(s, SR, 0.7, 0.2)).toBeCloseTo(110, -1);
  });

  it('slides Osc 2 down with the Envelope as the model says, through its Decay (ADR-0003)', async () => {
    const patch = { ...defaultPatch(), ...osc2Alone, osc2EnvAmount: 12, filterDecay: 2, filterSustain: 0 };
    let engine!: ReturnType<typeof createSynthEngine>;
    const s = await render(2, patch, (e) => {
      engine = e;
      e.noteOn(69, 1, 0);
    });
    const heard = [0.1, 0.3, 1].map((t) => {
      const { lfo, filter } = engine.modulationAt(t);
      const model = 440 * 2 ** (osc2Cents(patch, lfo, filter) / 1200);
      expect(Math.abs(1200 * Math.log2(frequencyAround(s, SR, t, 0.01) / model)), `cents from the model at ${t} s`).toBeLessThan(5);
      return model;
    });
    // It has moved: from most of an octave up, most of the way back to the Note.
    expect(heard[0]).toBeGreaterThan(700);
    expect(heard[2]).toBeLessThan(500);
  });
});

describe('what follows an Oscillator’s pitch when something moves it (issue 98)', () => {
  const [A2, A3] = [45, 57]; // 110 and 220 Hz
  const pulse = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'pulse', pulseWidth: 0.25, osc2Waveform: 'pulse', osc2PulseWidth: 0.25 } as const;
  const solo2 = { ...pulse, mixOsc1: 0, mixOsc2: 1 } as const;
  /**
   * The Pulse Width of each 50 ms window, from `from` to `to` seconds, as the share of it the wave spends on its
   * shorter side of its mean, and its RMS: a 25 % pulse spends a quarter of its cycle on one side, whatever its pitch.
   */
  const pulseWidths = (s: Float32Array, from: number, to: number) => {
    const size = Math.round(0.05 * SR);
    const out: { at: number; pulseWidth: number; level: number }[] = [];
    for (let start = Math.round(from * SR); start + size <= Math.round(to * SR); start += size) {
      const window = s.subarray(start, start + size);
      const mean = window.reduce((sum, v) => sum + v, 0) / size;
      const above = window.filter((v) => v > mean).length / size;
      out.push({ at: start / SR, pulseWidth: Math.min(above, 1 - above), level: rms(window) });
    }
    return out;
  };
  /** Every window of `s` from `from` to `to` seconds at `width`. */
  const expectWidth = (s: Float32Array, from: number, to: number, width = 0.25) => {
    for (const w of pulseWidths(s, from, to)) expect(Math.abs(w.pulseWidth - width), `the width at ${w.at.toFixed(2)} s`).toBeLessThan(0.03);
  };
  const steadyLevel = async () => rms((await render(0.6, solo2, (e) => e.noteOn(A3, 1, 0))).subarray(SR * 0.3));

  for (const osc2EnvAmount of [12, 24])
    it(`keeps a pulse at 25 %, never silent, as Env Amount sweeps Osc 2 up to +${osc2EnvAmount} semitones`, async () => {
      // A one-second Attack takes Osc 2 up smoothly; full Sustain holds it at the top.
      const s = await render(1.6, { ...solo2, osc2EnvAmount, filterAttack: 1, filterSustain: 1 }, (e) => e.noteOn(A3, 1, 0));
      const level = await steadyLevel();
      expectWidth(s, 0.05, 1.55);
      for (const w of pulseWidths(s, 0.05, 1.55)) expect(dB(w.level / level), `the level at ${w.at.toFixed(2)} s`).toBeGreaterThan(-3);
    });

  it('keeps a pulse at 25 % under an LFO on Osc 2 Pitch, an octave each way', async () => {
    const s = await render(2.1, { ...solo2, lfoDestination: 'osc2Pitch', lfoAmount: 1, lfoRate: 0.5, lfoWaveform: 'sine', lfoRetrigger: 'note' }, (e) => e.noteOn(A3, 1, 0));
    expectWidth(s, 0.05, 2.05);
  });

  it('keeps a pulse at 25 % on Osc 1 under the pitch bend, an octave up', async () => {
    const s = await render(1, pulse, (e) => {
      e.noteOn(A3, 1, 0);
      e.setBend(1200, 0.3);
    });
    expectWidth(s, 0.35, 0.95);
    expect(frequencyAround(s, SR, 0.7, 0.2)).toBeCloseTo(440, -1);
  });

  it('leaves FM’s depth on the knobs: Osc 2 held a fifth up by Env Amount sounds as Osc 2 tuned a fifth up, its index down by the fifth', async () => {
    const sines = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine', mixOsc2: 0 } as const;
    const fifth = 2 ** (7 / 12);
    const enveloped = await render(1.5, { ...sines, crossMod: 0.3, osc2EnvAmount: 7, filterAttack: 0.001, filterSustain: 1 }, (e) => e.noteOn(A2, 1, 0));
    const tuned = await render(1.5, { ...sines, crossMod: 0.3 / fifth, osc2Semitone: 7 }, (e) => e.noteOn(A2, 1, 0));
    const window = (s: Float32Array) => s.subarray(SR / 2, SR / 2 + 32768);
    // The carrier and its sidebands either side, at 110 Hz + k × Osc 2's.
    for (const k of [-2, -1, 0, 1, 2]) {
      const f = Math.abs(110 + k * 110 * fifth);
      const [a, b] = [enveloped, tuned].map((s) => toneAmplitudeHann(window(s), SR, f));
      expect(dB(a / b), `the sideband at ${f.toFixed(1)} Hz`).toBeCloseTo(0, 0);
    }
  });

  /** A Note of A2 gliding to A3 over 0.4 s, a knob turned 0.1 s into the slide. */
  const glidingWithAKnob = async (patch: Partial<Patch>) => {
    const ctx = new OfflineAudioContext(1, SR * 2, SR);
    const engine = createSynthEngine(ctx);
    const full = { ...defaultPatch(), ...patch, glide: 0.4 };
    engine.applyPatch(full);
    engine.noteOn(A2, 1, 0);
    engine.noteOn(A3, 1, 0.5);
    const turned = ctx.suspend(0.6).then(() => {
      engine.applyPatch({ ...full, cutoff: 19000 });
      void ctx.resume();
    });
    const s = (await ctx.startRendering()).getChannelData(0);
    await turned;
    return s;
  };

  it('keeps a pulse sliding on to the Note’s pitch after a knob turns mid-Glide: 25 % at the Glide’s end', async () => {
    const s = await glidingWithAKnob(pulse);
    expect(frequencyAround(s, SR, 1.6, 0.2)).toBeCloseTo(220, -1);
    expectWidth(s, 1.4, 1.95);
  });

  it('keeps FM’s depth sliding on to the Note’s pitch after a knob turns mid-Glide: the sidebands of the Note played alone', async () => {
    const fm = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine', mixOsc2: 0, osc2Semitone: 7, crossMod: 0.25 } as const;
    const glided = await glidingWithAKnob(fm);
    const alone = await render(2, fm, (e) => e.noteOn(A3, 1, 0));
    const fifth = 2 ** (7 / 12);
    const window = (s: Float32Array) => s.subarray(SR * 1.4, SR * 1.4 + 16384);
    const level = (s: Float32Array, k: number) => toneAmplitudeHann(window(s), SR, Math.abs(220 + k * 220 * fifth));
    for (const k of [-2, -1, 1, 2]) {
      const [a, b] = [glided, alone].map((s) => dB(level(s, k) / level(s, 0)));
      expect(a - b, `the sideband k = ${k}`).toBeCloseTo(0, 0);
    }
  });

  it('gives a Note handed over ahead the FM of a knob turned before it starts (the review of 98)', async () => {
    const fm = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine', mixOsc2: 0, osc2Semitone: 7, crossMod: 0.25 } as const;
    const ctx = new OfflineAudioContext(1, SR * 2, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...fm, glide: 0.4 });
    engine.noteOn(A2, 1, 0);
    engine.noteOn(A3, 1, 0.5); // handed over, gliding from 0.5 s
    const turned = ctx.suspend(0.45).then(() => {
      engine.applyPatch({ ...defaultPatch(), ...fm, glide: 0.4, crossMod: 0.1 });
      void ctx.resume();
    });
    const glided = (await ctx.startRendering()).getChannelData(0);
    await turned;
    const alone = await render(2, { ...fm, crossMod: 0.1 }, (e) => e.noteOn(A3, 1, 0));
    const fifth = 2 ** (7 / 12);
    const window = (s: Float32Array) => s.subarray(SR * 1.4, SR * 1.4 + 16384);
    const level = (s: Float32Array, k: number) => toneAmplitudeHann(window(s), SR, Math.abs(220 + k * 220 * fifth));
    for (const k of [-1, 1]) {
      const [a, b] = [glided, alone].map((s) => dB(level(s, k) / level(s, 0)));
      expect(a - b, `the sideband k = ${k}`).toBeCloseTo(0, 0);
    }
  });

  it('measures 50 % at 50 % (control case: the measure tells widths apart)', async () => {
    const s = await render(0.6, { ...solo2, osc2PulseWidth: 0.5 }, (e) => e.noteOn(A3, 1, 0));
    expectWidth(s, 0.1, 0.55, 0.5);
  });
});

describe('Notes handed over ahead of the clock (issue 101)', () => {
  const bareSine = { cutoff: 20000, resonance: 0, waveform: 'sine', ampAttack: 0.001, ampSustain: 1, ampRelease: 0.01 } as const;
  const peak = (s: Float32Array, from: number, to: number) => s.subarray(Math.round(from * SR), Math.round(to * SR)).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  /** The Demo plays a Note at 0 and hands the next over for `next`; a key takes over at `key`, before it. */
  const takeOver = (e: ReturnType<typeof createSynthEngine>, key: number, next: number) => {
    e.noteOn(69, 1, 0);
    e.release(69, next - 0.05);
    e.noteOn(69, 1, next);
    e.release(69, next + 0.2);
    e.noteOff(key); // the Demo stops…
    e.noteOn(69, 1, key); // …and the key plays
  };

  it('a key taking over within the look-ahead sounds one copy of each Oscillator: a bare sine peaks as one Note does', async () => {
    // A4 is 132 whole cycles at 0.3 s: two copies would be in phase, and double.
    const s = await render(1, bareSine, (e) => takeOver(e, 0.3, 0.5));
    expect(peak(s, 0.32, 0.6) / peak(s, 0.1, 0.28)).toBeCloseTo(1, 1);
  });

  it('a retriggering LFO taking over within the look-ahead runs alone, in the sound as in the model', async () => {
    // A square LFO at 1 Hz on the pitch: the Demo's is down from 0.5 s; the key's, restarted at 0.6 s, is up.
    const patch = { ...bareSine, lfoDestination: 'pitch', lfoAmount: 1, lfoRate: 1, lfoWaveform: 'square', lfoRetrigger: 'note' } as const;
    let model = 0;
    const s = await render(1.2, patch, (e) => {
      takeOver(e, 0.6, 0.8);
      model = e.lfoSwingAt(0.7);
    });
    expect(model).toBe(1);
    expect(frequencyAround(s, SR, 0.7, 0.02)).toBeCloseTo(440 * 2 ** (1 / 12), 0);
  });

  it('over many Notes, removes every connection made to and from an Oscillator once it has ended', async () => {
    const made = new Map<object, Set<object>>(); // a node → what it feeds, nodes and params
    const { connect, disconnect } = AudioNode.prototype;
    AudioNode.prototype.connect = function (this: AudioNode, destination: AudioNode | AudioParam, ...rest: number[]) {
      if (!made.has(this)) made.set(this, new Set());
      made.get(this)!.add(destination);
      return (connect as (...a: unknown[]) => AudioNode).call(this, destination, ...rest);
    } as typeof connect;
    AudioNode.prototype.disconnect = function (this: AudioNode, ...args: unknown[]) {
      const destination = args[0];
      if (destination instanceof AudioNode || destination instanceof AudioParam) made.get(this)?.delete(destination);
      else made.delete(this);
      return (disconnect as (...a: unknown[]) => void).apply(this, args);
    } as typeof disconnect;
    try {
      const ctx = new OfflineAudioContext(1, SR * 4, SR);
      const ended = new Set<OscillatorNode>();
      const create = ctx.createOscillator.bind(ctx);
      ctx.createOscillator = () => {
        const o = create();
        o.addEventListener('ended', () => ended.add(o));
        return o;
      };
      const engine = createSynthEngine(ctx);
      engine.applyPatch({ ...defaultPatch(), voices: 4, lfoRetrigger: 'note', lfo2Retrigger: 'note' });
      // Many Notes on several Voices, each played as the players do, and a key taking over before some.
      for (let i = 0; i < 30; i++) {
        const t = i * 0.1;
        engine.noteOn(48 + (i % 12), 1, t + 0.05);
        engine.release(48 + (i % 12), t + 0.09);
        if (i % 3 === 0) engine.noteOn(60, 1, t + 0.02);
      }
      await ctx.startRendering();
      await new Promise((resolve) => setTimeout(resolve, 50)); // the ended events
      const fed = (o: OscillatorNode) => [...made.values()].filter((to) => to.has(o.frequency) || to.has(o.detune)).length;
      expect(ended.size).toBeGreaterThan(100);
      for (const o of ended) {
        expect(made.get(o)?.size ?? 0, 'what it fed').toBe(0);
        expect(fed(o), 'what fed it').toBe(0);
      }
    } finally {
      AudioNode.prototype.connect = connect;
      AudioNode.prototype.disconnect = disconnect;
    }
  });
});

describe('a Note reaching a Voice still sounding dips first, so it does not click (issue 102)', () => {
  // Init with a sine, the Filter open so it does not smooth a click away.
  const sine = { waveform: 'sine', cutoff: 20000 } as const;
  /** The largest second difference between samples: a burst of high frequencies, on a Patch that swells slowly. */
  const sharpest = (s: Float32Array, from: number, to: number) => {
    let most = 0;
    for (let i = Math.round(from * SR) + 2; i < Math.round(to * SR); i++) most = Math.max(most, Math.abs(s[i] - 2 * s[i - 1] + s[i - 2]));
    return most;
  };

  // C2, let go at 0.5 s, then a Note about 50 ms into its Release, where C2's wave is at its peak (36¼ cycles): the
  // review's staccato line. The step was 36 times the steady sine's (0.4 s Release) and 66 times (1.5 s); now the
  // steepest is the new Note's own Attack, as from silence.
  for (const [ampRelease, next] of [[0.4, 38], [1.5, 38], [1.5, 36]] as const)
    it(`plays a Note into the last one's Release with no step past the steady sine's (Init, ${ampRelease} s Release, ${next === 36 ? 'the same key again' : 'D2'})`, async () => {
      const s = await render(1.4, { ...sine, ampRelease }, (e) => {
        e.noteOn(36, 1, 0);
        e.noteOff(0.5);
        e.noteOn(next, 1, 0.5542);
      });
      expect(steepestStep(s, 0.55, 0.6)).toBeLessThan(1.5 * steepestStep(s, 1, 1.3));
    });

  // A burst 2.4 times the sustain's before.
  it('strikes a chord again in Glass Pad’s Release with no burst past its sustain’s', async () => {
    const glassPad = PRESETS.find((p) => p.name === 'Glass Pad')!.patch;
    const chord = [60, 64, 67];
    const s = await render(3, glassPad, (e) => {
      for (const note of chord) e.noteOn(note, 1, 0);
      e.noteOff(1.8);
      for (const note of chord) e.noteOn(note, 1, 2);
    });
    expect(sharpest(s, 1.99, 2.1)).toBeLessThan(1.5 * sharpest(s, 1.3, 1.8));
  });

  it('takes a held Voice for a new Note with no step past the steady chord’s (2 Voices)', async () => {
    const s = await render(1, { ...sine, voices: 2 }, (e) => {
      e.noteOn(45, 1, 0);
      e.noteOn(52, 1, 0.1);
      e.noteOn(57, 1, 0.30227); // A3 takes A2's Voice, A2 still held, at its wave's peak (33¼ cycles)
    });
    expect(steepestStep(s, 0.295, 0.35)).toBeLessThan(1.5 * steepestStep(s, 0.7, 0.95));
  });

  // The legato rule's one-Voice condition (the 1.16.0 review): on several Voices a held Voice taken by a new Note, or
  // its key struck again, restarts after a dip; on one Voice the same Note is legato and slides on.
  const takings = {
    'a held Voice taken for a new Note': [45, 52, 57],
    'a held key struck again': [45, 52, 45],
  };
  for (const [how, [first, second, third]] of Object.entries(takings))
    it(`restarts ${how} on 2 Voices, dipping first; on 1 Voice it is legato (issue 94)`, async () => {
      const struck = async (voices: 1 | 2) => {
        let engine!: ReturnType<typeof createSynthEngine>;
        await render(0.5, { ...sine, voices, ampAttack: 0.001, ampSustain: 1 }, (e) => {
          engine = e;
          e.noteOn(first, 1, 0);
          e.noteOn(second, 1, 0.1);
          e.noteOn(third, 1, 0.3);
        });
        return { at: engine.modulationAt(0.4).struck, inDip: engine.modulationAt(0.3 + DIP * 0.9).amp };
      };
      const two = await struck(2);
      expect(two.at).toBeCloseTo(0.3 + DIP, 6);
      expect(two.inDip).toBeLessThan(0.2);
      const one = await struck(1);
      expect(one.at).toBeCloseTo(0.3, 6);
      expect(one.inDip).toBeGreaterThan(0.9);
    });

  // A Gate off before the Note it closes has started. Issue 101 left the first to 102: the Demo stopped, or Hold switched
  // off, before a Note it handed over. A4, its restart due at a quarter of a cycle (245¼ cycles, after the dip): a step
  // there if it restarts (9 and 7 times the held Note's steepest before), 1.4 times the level if a second copy joins in.
  const due = 245.25 / 440;
  const calledOff = {
    'a player stopped before it': (e: ReturnType<typeof createSynthEngine>) => {
      e.noteOn(69, 1, 0);
      e.release(69, 0.45);
      e.noteOn(69, 1, due - DIP); // handed over: the Voice will still sound then, so it dips first
      e.release(69, 0.8);
      e.noteOff(0.5);
    },
    'a key let go within the dip, on 2 Voices': (e: ReturnType<typeof createSynthEngine>) => {
      e.noteOn(69, 1, 0);
      e.noteOn(69, 1, due - DIP); // the key again: its own Voice, still sounding
      e.release(69, due - DIP / 2);
    },
  };
  for (const [how, play] of Object.entries(calledOff))
    it(`does not restart the Oscillators for a Note called off before it starts (${how}): the Release runs on, one copy, with no step`, async () => {
      let engine: ReturnType<typeof createSynthEngine> | undefined;
      const s = await render(1, { ...sine, ampRelease: 1.5, voices: how.endsWith('2 Voices') ? 2 : 1 }, (e) => {
        engine = e;
        play(e);
      });
      expect(steepestStep(s, due - 0.02, due + 0.02)).toBeLessThan(1.1 * steepestStep(s, 0.4, 0.45));
      // One copy: the sound's level falls as the model's does, where a second copy would add 40 % to it.
      const peak = (from: number, to: number) => s.subarray(Math.round(from * SR), Math.round(to * SR)).reduce((m, v) => Math.max(m, Math.abs(v)), 0);
      const level = (t: number) => engine!.modulationAt(t).amp;
      expect(peak(due + 0.005, due + 0.03) / peak(due - 0.03, due - 0.005)).toBeLessThan((1.1 * level(due + 0.005)) / level(due - 0.03));
    });

  it('does not restart a retriggered LFO for a Note called off before it starts: the Release keeps its LFO, in the sound as in the model (the 1.16.1 review)', async () => {
    // A square LFO at 1 Hz on the pitch, started at 0: down from 0.5 s. The Note handed over for `due` would start it up again.
    const patch = { ...sine, ampRelease: 1.5, lfoDestination: 'pitch', lfoAmount: 1, lfoRate: 1, lfoWaveform: 'square', lfoRetrigger: 'note' } as const;
    let model = 0;
    const s = await render(1, patch, (e) => {
      calledOff['a player stopped before it'](e);
      model = e.lfoSwingAt(0.65);
    });
    expect(model).toBe(-1);
    expect(frequencyAround(s, SR, 0.65, 0.02)).toBeCloseTo(440 * 2 ** (-1 / 12), 0);
  });

  it('restarts a retriggered LFO once for a chord, where its Notes that do not dip start, whichever comes first (the 1.16.1 review)', async () => {
    // C4, in its Release, takes its own Voice again and dips; E4 starts at once on the free one.
    const patch = { ...sine, voices: 2, ampRelease: 0.4, lfoDestination: 'pitch', lfoAmount: 1, lfoRate: 5, lfoWaveform: 'saw', lfoRetrigger: 'note' } as const;
    const chord = 0.35;
    const renders: Float32Array[] = [];
    for (const notes of [[60, 64], [64, 60]]) {
      let swing = 0;
      const s = await render(0.6, patch, (e) => {
        e.noteOn(60, 1, 0);
        e.release(60, 0.3);
        for (const note of notes) e.noteOn(note, 1, chord);
        swing = e.lfoSwingAt(chord + 0.02);
      });
      expect(swing, `${notes}`).toBeCloseTo(-0.8, 6); // a 5 Hz saw from its foot at the chord, a tenth of a cycle on
      renders.push(s);
    }
    // One restart in the sound too, whichever Note came first: the two play alike.
    const [one, other] = renders;
    let most = 0;
    for (let i = Math.round(chord * SR); i < one.length; i++) most = Math.max(most, Math.abs(one[i] - other[i]));
    expect(most).toBeLessThan(1e-4);
  });

  /**
   * A4, let go just before 0.3 s, and E4 into its Release at 0.32 s: the Amp's gain, sample by sample from 0.31 s to
   * 0.336 s (the Amp Tap over the Filter Tap, wherever the wave is not near zero), beside the model's. `live` changes
   * the Gate at its moment, as the page does, rather than all ahead.
   */
  async function dipAtTheTaps(live: boolean) {
    const quantum = 128 / SR; // where an offline context can suspend
    const [off, on, end] = [112 * quantum, 120 * quantum, 126 * quantum];
    const ctx = new OfflineAudioContext(1, SR * 0.5, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ...sine, resonance: 0, ampAttack: 0.005 });
    engine.noteOn(69, 1, 0);
    const changes = [() => engine.noteOff(off), () => engine.noteOn(64, 1, on)];
    if (live) [off, on].forEach((t, i) => ctx.suspend(t).then(() => { changes[i](); void ctx.resume(); }));
    else for (const change of changes) change();
    const read = (a: AnalyserNode) => {
      const s = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(s);
      return s;
    };
    const captured = ctx.suspend(end).then(() => {
      const taps = { amp: read(engine.taps.amp), filter: read(engine.taps.filter) };
      void ctx.resume();
      return taps;
    });
    await ctx.startRendering();
    const { amp, filter } = await captured;
    const gains = [];
    for (let i = 0; i < amp.length; i++) {
      const time = end - (amp.length - i) / SR;
      if (time >= 0.31 && Math.abs(filter[i]) > 0.05) gains.push({ time, sound: amp[i] / filter[i], model: engine.modulationAt(time).amp });
    }
    return { gains, engine, on };
  }

  it('dips in the model as in the sound: the Amp Envelope, sample by sample, through the dip and the next Attack (ADR-0003)', async () => {
    const { gains, engine, on } = await dipAtTheTaps(false);
    expect(gains.length).toBeGreaterThan(500);
    for (const { time, sound, model } of gains) expect(sound, `at ${time}`).toBeCloseTo(model, 4);
    const before = engine.modulationAt(on).amp;
    expect(engine.modulationAt(on + DIP / 2).amp).toBeCloseTo(before / 2, 9); // a straight line…
    expect(engine.modulationAt(on + DIP).amp).toBeCloseTo(0, 12); // …to silence, where the Note starts
  });

  it('starts the Attack from the dip’s silence without cancelAndHoldAtTime too (Firefox), played live', async () => {
    const original = AudioParam.prototype.cancelAndHoldAtTime;
    // @ts-expect-error: removed for this test, as in Firefox
    delete AudioParam.prototype.cancelAndHoldAtTime;
    try {
      const { gains } = await dipAtTheTaps(true);
      for (const { time, sound, model } of gains) expect(sound, `at ${time}`).toBeCloseTo(model, 2);
    } finally {
      AudioParam.prototype.cancelAndHoldAtTime = original;
    }
  });

  it('starts a Note into silence when it is asked for, within a sample', async () => {
    const asked = 0.4;
    const s = await render(0.6, { ...sine, cutoff: 20000, ampAttack: 0.001, ampRelease: 0.02 }, (e) => {
      e.noteOn(69, 1, 0);
      e.noteOff(0.1); // faded long before the next
      e.noteOn(69, 1, asked);
    });
    // The limiter's oversampling delays the whole output a little: count from where the first Note starts.
    const onset = (from: number) => Math.round(from * SR) + s.subarray(Math.round(from * SR)).findIndex((v) => Math.abs(v) > 1e-4);
    expect(Math.abs(onset(0.3) - onset(0) - asked * SR)).toBeLessThanOrEqual(1);
  });
});

describe('Legato (issue 119)', () => {
  // One Voice, one sine: a slow Attack and Decay, so a Note's start is plain to see in the level.
  const slow = { cutoff: 20000, resonance: 0, waveform: 'sine', ampAttack: 0.4, ampDecay: 0.4, ampSustain: 0.3, ampRelease: 0.1 } as const;
  // The output's level as an Envelope's: a sine at the Nominal Level, through the master's 0.45, has an RMS of 0.5 × 0.45 / √2.
  const envelopeOf = (s: Float32Array, t: number) => (rms(s, Math.round(t * SR) - 600, Math.round(t * SR) + 600) * Math.SQRT2) / (OSCILLATOR_LEVEL * 0.45);

  it('gives a second key held over the first no new Attack on the Amp Envelope; with Legato off, it starts one', async () => {
    const line = (legato: 'on' | 'off') =>
      render(1.4, { ...slow, ampDecay: 0.1, legato }, (e) => {
        e.noteOn(69, 1, 0.1);
        e.noteOn(81, 1, 1); // the first key still held, its Envelope at its Sustain
      });
    const [on, off] = [await line('on'), await line('off')];
    expect(envelopeOf(on, 0.9)).toBeCloseTo(0.3, 2); // the first Note held at its Sustain
    expect(envelopeOf(on, 1.2)).toBeCloseTo(0.3, 2); // carries on through the second
    expect(envelopeOf(off, 1.2)).toBeGreaterThan(0.6); // a new Attack
  });

  it('keeps the model on the sound along a legato line: one Attack, one Release, whatever the Notes between', async () => {
    let engine!: ReturnType<typeof createSynthEngine>;
    const filterEnvelope = { filterEnvAmount: 1, filterAttack: 0.2, filterDecay: 0.3, filterSustain: 0.5, filterRelease: 0.2 };
    const s = await render(1.6, { ...slow, ...filterEnvelope, legato: 'on' }, (e) => {
      engine = e;
      e.noteOn(69, 1, 0.1);
      e.noteOn(81, 0.4, 0.3); // in the Attack: a softer key changes nothing either
      e.noteOn(76, 1, 0.7); // in the Decay
      e.noteOff(1.2);
    });
    const amp: GateEvent[] = [
      { time: 0.1, on: true, adsr: { attack: 0.4, decay: 0.4, sustain: 0.3, release: 0.1 }, peak: 1 },
      { time: 1.2, on: false, adsr: { attack: 0.4, decay: 0.4, sustain: 0.3, release: 0.1 }, peak: 1 },
    ];
    const filter: GateEvent[] = amp.map((e) => ({ ...e, adsr: { attack: 0.2, decay: 0.3, sustain: 0.5, release: 0.2 } }));
    for (let t = 0.05; t < 1.5; t += 0.01) {
      expect(engine.modulationAt(t).amp, `${t.toFixed(2)} s`).toBeCloseTo(envelopeLevel(amp, t), 9);
      expect(engine.modulationAt(t).filter, `${t.toFixed(2)} s`).toBeCloseTo(envelopeLevel(filter, t), 9);
    }
    // The sound as the model says, and as one Note held as long sounds: the line has its Attack and its Release alone.
    const alone = await render(1.6, { ...slow, ...filterEnvelope }, (e) => {
      e.noteOn(69, 1, 0.1);
      e.noteOff(1.2);
    });
    for (const t of [0.2, 0.35, 0.5, 0.65, 0.8, 1.0, 1.25]) {
      expect(envelopeOf(s, t), `${t} s`).toBeCloseTo(engine.modulationAt(t).amp, 1);
      expect(envelopeOf(s, t), `${t} s`).toBeCloseTo(envelopeOf(alone, t), 2);
    }
    expect(engine.modulationAt(1).struck).toBe(0.1); // the line's one Note struck
    expect(engine.modulationAt(1).sounding?.note).toBe(76); // at the newest Note's pitch
  });

  it('does not restart a retriggered LFO on a legato Note, in the sound and the model; with Legato off, it does', async () => {
    // A square LFO at 1 Hz on Pitch, retriggered: up for half a second from the first Note at 0.3, down for the next.
    const lfo = { cutoff: 20000, waveform: 'sine', ampAttack: 0.001, ampSustain: 1, lfoRate: 1, lfoWaveform: 'square', lfoDestination: 'pitch', lfoAmount: 1, lfoRetrigger: 'note' } as const;
    const line = async (legato: 'on' | 'off') => {
      let swing = 0;
      const s = await render(1.2, { ...lfo, legato }, (e) => {
        e.noteOn(57, 1, 0.3);
        e.noteOn(69, 1, 0.6);
        swing = e.lfoSwingAt(0.95);
      });
      return { swing, pitch: frequencyAround(s, SR, 0.95, 0.02) };
    };
    const on = await line('on');
    expect(on.swing).toBe(-1); // 0.65 s into the first Note's cycle: down
    expect(on.pitch).toBeCloseTo(440 * 2 ** (-1 / 12), 0);
    const off = await line('off');
    expect(off.swing).toBe(1); // 0.35 s into the second Note's: up
    expect(off.pitch).toBeCloseTo(440 * 2 ** (1 / 12), 0);
  });

  it('starts a Note as before when no key is held, Hold keeping the last or not, and has no effect on several Voices', async () => {
    const struck = async (patch: Partial<Patch>, play: (e: ReturnType<typeof createSynthEngine>) => void) => {
      let engine!: ReturnType<typeof createSynthEngine>;
      await render(1.2, { ...slow, legato: 'on', ...patch }, (e) => {
        engine = e;
        play(e);
      });
      return engine.modulationAt(1.1).struck;
    };
    // Let go, then the next key: a Note of its own, after a dip (the first still in its Release).
    expect(await struck({}, (e) => {
      e.noteOn(69, 1, 0.1);
      e.noteOff(0.9);
      e.noteOn(81, 1, 0.95);
    })).toBeCloseTo(0.95 + DIP, 6);
    // Hold keeping the first, every key up: the next is struck afresh, its Attack at once, with no dip (issue 119).
    expect(await struck({}, (e) => {
      e.noteOn(69, 1, 0.1);
      e.noteOn(81, 1, 1, { afresh: true });
    })).toBe(1);
    // Two Voices: the second key takes a Voice of its own and starts there.
    expect(await struck({ voices: 2 }, (e) => {
      e.noteOn(69, 1, 0.1);
      e.noteOn(81, 1, 1);
    })).toBe(1);
  });
});

// Issue 133, decision 4: every live number of the Synth Geek Layer is held to what the engine plays (issue 167).
describe('the Synth Geek Layer’s numbers for Osc 2, held to the engine (issue 167)', () => {
  const sines = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine' } as const;
  /** A readout's multiple as a number: "×1.498" is 1.498, "×½" 0.5. */
  const multiple = (readout: string | undefined) => {
    const figure = readout!.replace('×', '');
    return ({ '½': 0.5, '¼': 0.25 } as Record<string, number>)[figure] ?? Number(figure);
  };

  for (const [id, value] of [['osc2Semitone', 7], ['osc2Octave', 1], ['osc2Octave', -1]] as const)
    it(`Osc 2 sounds at the Note times what ${id === 'osc2Octave' ? 'Octave' : 'Semitone'} ${value > 0 ? '+' : ''}${value} reads`, async () => {
      const patch = { ...defaultPatch(), ...sines, mixOsc1: 0, mixOsc2: 1, [id]: value };
      const s = await render(1, patch, (e) => e.noteOn(69, 1, 0));
      expect(frequencyAround(s, SR, 0.6, 0.5) / 440).toBeCloseTo(multiple(geekReadout(id, value, patch)), 3);
    });

  // f is Osc 2 before Detune: an octave up with Osc 1, the beats are twice as fast.
  for (const [where, octaves] of [['at A4', { osc1Octave: 0, osc2Octave: 0 }], ['both an octave up', { osc1Octave: 1, osc2Octave: 1 }]] as const)
    it(`the summed Oscillators beat as fast as Detune 10 cents reads, ${where}`, async () => {
      const patch = { ...defaultPatch(), ...sines, ...octaves, mixOsc1: 1, mixOsc2: 1, osc2Detune: 10 };
      let note: number | null = null;
      const s = await render(5, patch, (e) => {
        expect(e.newestNote()).toBeNull();
        e.noteOn(69, 1, 0);
        note = e.newestNote();
      });
      const readout = geekReadout('osc2Detune', 10, patch, { note });
      expect(readout).toMatch(/ Hz beats$/);
      // The level swells and fades once a beat: count its rises through the middle, 10 ms frames, after the Attack.
      const frame = SR / 100;
      const levels: number[] = [];
      for (let from = SR / 4; from + frame <= s.length; from += frame / 2) levels.push(rms(s, from, from + frame));
      const middle = (Math.max(...levels) + Math.min(...levels)) / 2;
      const rises: number[] = [];
      for (let i = 1; i < levels.length; i++)
        if (levels[i - 1] < middle && levels[i] >= middle) rises.push(i - 1 + (middle - levels[i - 1]) / (levels[i] - levels[i - 1]));
      const beatsHz = (rises.length - 1) / (((rises[rises.length - 1] - rises[0]) * frame) / 2 / SR);
      expect(Math.abs(beatsHz - Number.parseFloat(readout!))).toBeLessThan(0.01);
    });
});

// Issue 133, decision 4: the LFOs' and Key Track's numbers held to what the engine plays (issue 169).
describe('the Synth Geek Layer’s numbers for the LFOs and Key Track, held to the engine (issue 169)', () => {
  const sine = { cutoff: 20000, resonance: 0, ampSustain: 1, ampAttack: 0.001, waveform: 'sine', osc2Waveform: 'sine' } as const;
  /** A readout's number: "±0.80 oct" is 0.8, "−6.0 dB" −6. */
  const number = (readout: string | undefined) => Number.parseFloat(readout!.replace('±', '').replace('−', '-'));

  /** How long the sound takes to repeat a square LFO's tremolo: the mean time between its swells, after the first. */
  const tremoloPeriod = async (patch: Partial<Patch>, bpm: number) => {
    const seconds = 4;
    const ctx = new OfflineAudioContext(1, SR * seconds, SR);
    const engine = createSynthEngine(ctx);
    engine.setTempo(bpm, 0);
    engine.applyPatch({ ...defaultPatch(), ...sine, lfoDestination: 'volume', lfoAmount: 1, lfoWaveform: 'square', ...patch });
    engine.noteOn(69, 1, 0);
    const s = (await ctx.startRendering()).getChannelData(0);
    const frame = SR / 1000; // 1 ms
    const levels: number[] = [];
    for (let from = 0; from + frame <= s.length; from += frame) levels.push(rms(s, from, from + frame));
    const middle = Math.max(...levels) / 2;
    const rises: number[] = [];
    for (let i = 1; i < levels.length; i++) if (levels[i - 1] < middle && levels[i] >= middle) rises.push(i);
    return ((rises[rises.length - 1] - rises[1]) * frame) / SR / (rises.length - 2);
  };

  for (const [what, patch, bpm, id, value] of [
    ['a Rate of 2 Hz', { lfoRate: 2 }, 120, 'lfoRate', 2],
    ['a Rate of 3 Hz', { lfoRate: 3 }, 120, 'lfoRate', 3],
    ['a synced 1/4 at 120 BPM', { lfoSync: 'on', lfoNote: noteIndex('1/4') }, 120, 'lfoNote', noteIndex('1/4')],
    ['a synced 1/8 T at 100 BPM', { lfoSync: 'on', lfoNote: noteIndex('1/8 T') }, 100, 'lfoNote', noteIndex('1/8 T')],
  ] as const)
    it(`an LFO repeats as often as ${what} reads`, async () => {
      const readout = geekReadout(id, value, { ...defaultPatch(), ...patch }, { bpm });
      expect(readout).toMatch(/ s$/);
      const period = await tremoloPeriod(patch, bpm);
      // To the readout's last figure.
      expect(Math.abs(period - number(readout))).toBeLessThan(0.006);
    });

  // A square LFO at 1 Hz is at its top for the first half second and its foot for the second: measured in each.
  const square = { ...sine, lfoRate: 1, lfoWaveform: 'square' } as const;
  const up = (s: Float32Array) => frequencyAround(s, SR, 0.25, 0.2);
  const down = (s: Float32Array) => frequencyAround(s, SR, 0.75, 0.2);

  it('Pitch swings by the semitones its Depth reads', async () => {
    const patch = { ...defaultPatch(), ...square, lfoDestination: 'pitch', lfoAmount: 0.6 } as const;
    const s = await render(1, patch, (e) => e.noteOn(69, 1, 0));
    expect(geekReadout('lfoAmount', 0.6, patch)).toBe('±0.60 st');
    expect((12 * Math.log2(up(s) / down(s))) / 2).toBeCloseTo(number(geekReadout('lfoAmount', 0.6, patch)), 2);
  });

  it('Detune swings Osc 2 by the cents its Depth reads', async () => {
    const patch = { ...defaultPatch(), ...square, mixOsc1: 0, mixOsc2: 1, lfoDestination: 'detune', lfoAmount: 0.5 } as const;
    const s = await render(1, patch, (e) => e.noteOn(69, 1, 0));
    expect(geekReadout('lfoAmount', 0.5, patch)).toBe('±25.0 ¢');
    expect((1200 * Math.log2(up(s) / down(s))) / 2).toBeCloseTo(number(geekReadout('lfoAmount', 0.5, patch)), 0);
  });

  it('Osc 2 Pitch swings Osc 2 by the semitones its Depth reads', async () => {
    const patch = { ...defaultPatch(), ...square, mixOsc1: 0, mixOsc2: 1, lfoDestination: 'osc2Pitch', lfoAmount: 0.25 } as const;
    const s = await render(1, patch, (e) => e.noteOn(69, 1, 0));
    expect(geekReadout('lfoAmount', 0.25, patch)).toBe('±3.00 st');
    expect((12 * Math.log2(up(s) / down(s))) / 2).toBeCloseTo(number(geekReadout('lfoAmount', 0.25, patch)), 2);
  });

  it('the Resonance swings by the share its Depth reads, as far as the knob leaves room, in the Resonance the Filter takes', async () => {
    const patch = { ...defaultPatch(), ...square, resonance: 0.3, lfoDestination: 'resonance', lfoAmount: 0.5 } as const;
    let engine!: ReturnType<typeof createSynthEngine>;
    await render(1, patch, (e) => {
      engine = e;
      e.noteOn(69, 1, 0);
    });
    expect(geekReadout('lfoAmount', 0.5, patch)).toBe('±30 %');
    const swing = (engine.modulationAt(0.25).resonance - engine.modulationAt(0.75).resonance) / 2;
    expect(swing * 100).toBeCloseTo(number(geekReadout('lfoAmount', 0.5, patch)), 0);
  });

  it('the Cutoff swings by the octaves its Depth reads, in the Effective Cutoff the Filter follows', async () => {
    const patch = { ...defaultPatch(), ...square, cutoff: 1000, lfoDestination: 'cutoff', lfoAmount: 0.4 } as const;
    let engine!: ReturnType<typeof createSynthEngine>;
    await render(1, patch, (e) => {
      engine = e;
      e.noteOn(60, 1, 0);
    });
    expect(geekReadout('lfoAmount', 0.4, patch)).toBe('±0.80 oct');
    expect(Math.log2(engine.modulationAt(0.25).cutoff / engine.modulationAt(0.75).cutoff) / 2).toBeCloseTo(number(geekReadout('lfoAmount', 0.4, patch)), 2);
  });

  it('Volume dips by the dB its Depth reads, below the top of its wave', async () => {
    const patch = { ...defaultPatch(), ...square, lfoDestination: 'volume', lfoAmount: 0.5 } as const;
    const s = await render(1, patch, (e) => e.noteOn(69, 1, 0));
    const level = (t: number) => rms(s, Math.round((t - 0.1) * SR), Math.round((t + 0.1) * SR));
    expect(geekReadout('lfoAmount', 0.5, patch)).toBe('−6.0 dB');
    expect(dB(level(0.75) / level(0.25))).toBeCloseTo(number(geekReadout('lfoAmount', 0.5, patch)), 1);
  });

  it('a pulse’s width swings by the share its Depth reads', async () => {
    const patch = { ...defaultPatch(), ...square, waveform: 'pulse', pulseWidth: 0.5, lfoDestination: 'pulseWidth', lfoAmount: 0.3 } as const;
    const s = await render(1, patch, (e) => e.noteOn(57, 1, 0));
    // The share of each cycle the pulse is high: the samples above the middle of its swing, over 0.2 s.
    const high = (t: number) => {
      const w = s.subarray(Math.round((t - 0.1) * SR), Math.round((t + 0.1) * SR));
      const middle = (Math.max(...w) + Math.min(...w)) / 2;
      return w.filter((x) => x > middle).length / w.length;
    };
    expect(geekReadout('lfoAmount', 0.3, patch)).toBe('±12 %');
    expect((Math.abs(high(0.25) - high(0.75)) / 2) * 100).toBeCloseTo(number(geekReadout('lfoAmount', 0.3, patch)), 0);
  });

  it('Key Track reads the Effective Cutoff at the Note played, and at A4 before any', async () => {
    const patch = { ...defaultPatch(), ...sine, cutoff: 1000, keyTrack: 0.5 };
    let engine!: ReturnType<typeof createSynthEngine>;
    let before = 0;
    let note: number | null = null;
    await render(1, patch, (e) => {
      engine = e;
      before = e.modulationAt(0).cutoff;
      e.noteOn(79, 1, 0.1);
      note = e.newestNote();
    });
    // "1.68 kHz" is 1680 Hz to three figures.
    const hz = (readout: string | undefined) => number(readout) * (readout!.endsWith('kHz') ? 1000 : 1);
    const atA4 = geekReadout('keyTrack', 0.5, patch);
    expect(Math.abs(hz(atA4) / before - 1)).toBeLessThan(0.005);
    const atNote = geekReadout('keyTrack', 0.5, patch, { note });
    expect(atNote).toBe('1.73 kHz'); // 1 kHz × 2^(0.5 × 19/12)
    expect(Math.abs(hz(atNote) / engine.modulationAt(0.5).cutoff - 1)).toBeLessThan(0.005);
  });
});

// Issue 133, decision 4: the Envelopes' and Glide's time constants, as their tips give them, held to the engine (issue 168).
describe('the Synth Geek Layer’s time constants for the Envelopes and Glide, held to the engine (issue 168)', () => {
  /** The τ a tip works out: "τ = Decay ÷ 4 = 0.500 s now" is 0.5. */
  const tau = (id: Parameters<typeof underTheHoodAt>[0], value: number) => {
    const [, figure, unit] = underTheHoodAt(id, value)!.where.match(/^τ = \w+ ÷ \d = ([\d.]+) (ms|s) now/)!;
    return Number(figure) / (unit === 'ms' ? 1000 : 1);
  };
  /**
   * The Amp Envelope's level at each of `times`, as the Amp Tap shows it: its last 20 ms over the Filter Tap's, the
   * level halfway through them (an A5 sine, 17 cycles in the window).
   */
  const ampLevels = async (patch: Partial<Patch>, play: (e: ReturnType<typeof createSynthEngine>) => void, times: number[]) => {
    const window = Math.round(SR * 0.02);
    const ctx = new OfflineAudioContext(1, SR * (Math.max(...times) + 0.2), SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), cutoff: 20000, resonance: 0, waveform: 'sine', ...patch });
    play(engine);
    const tail = (a: AnalyserNode) => {
      const s = new Float32Array(a.fftSize);
      a.getFloatTimeDomainData(s);
      return s.subarray(s.length - window);
    };
    const levels = times.map((t) =>
      ctx.suspend(t + 0.01).then(() => {
        const level = rms(tail(engine.taps.amp)) / rms(tail(engine.taps.filter));
        void ctx.resume();
        return level;
      }),
    );
    await ctx.startRendering();
    return Promise.all(levels);
  };

  it('the Attack rises 63 % of the way in the τ its tip reads: a curve, not a straight rise', async () => {
    const t = tau('ampAttack', 3);
    expect(t).toBe(1);
    const [level] = await ampLevels({ ampAttack: 3, ampSustain: 1 }, (e) => e.noteOn(81, 1, 0), [t]);
    expect(level).toBeCloseTo(1 - Math.exp(-1), 2);
  });

  it('the Decay falls 63 % of the way to the Sustain in the τ its tip reads', async () => {
    const t = tau('ampDecay', 2);
    expect(t).toBe(0.5);
    // Sustain at 0: from where the Attack left it (all but the fastest Attack's last 5 %), down to silence.
    const [start, after] = await ampLevels({ ampAttack: 0.001, ampDecay: 2, ampSustain: 0 }, (e) => e.noteOn(81, 1, 0), [0.2, 0.2 + t]);
    expect(after / start).toBeCloseTo(Math.exp(-1), 2);
  });

  it('the Release falls 63 % of the way to silence in the τ its tip reads', async () => {
    const t = tau('ampRelease', 3);
    expect(t).toBe(0.5);
    const [start, after] = await ampLevels(
      { ampAttack: 0.001, ampSustain: 1, ampRelease: 3 },
      (e) => {
        e.noteOn(81, 1, 0);
        e.noteOff(0.3);
      },
      [0.5, 0.5 + t],
    );
    expect(after / start).toBeCloseTo(Math.exp(-1), 2);
  });

  it('Glide slides 63 % of the way to the new Note in the τ its tip gives', async () => {
    // "τ = Glide ÷ 4": its tip gives the rule, with no live number (issue 133, decision 10).
    const t = 2 / Number(UNDER_THE_HOOD.glide.where.match(/^τ = Glide ÷ (\d+)\./)![1]);
    expect(t).toBe(0.5);
    const s = await render(1.5, { cutoff: 20000, waveform: 'sine', glide: 2, lfoAmount: 0, ampSustain: 1, ampAttack: 0.001 }, (e) => {
      e.noteOn(57, 1, 0); // 220 Hz
      e.noteOn(69, 1, 0.5); // to 440 Hz
    });
    expect(frequencyAround(s, SR, 0.5 + t, 0.02) / (440 + (220 - 440) * Math.exp(-1))).toBeCloseTo(1, 2);
  });
});
