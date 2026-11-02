import { describe, expect, it } from 'vitest';
import { createSynthEngine } from '../engine/synthEngine';
import { defaultPatch, type Patch } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { traceJitter } from '../test/measure';
import { createCycleLock, type LockedTrace } from './cycleLock';
import { scopeTrace } from './scopeTrace';
import { scopeWindow } from './scopeWindow';

// Issue 180: the Scopes' steadiness on the real engine's sound, by the research's method
// (docs/research/180-steadier-scopes.md): rendered offline, every Tap read 60 times a second as the render loop
// reads it, each frame Cycle Locked as the Scope does (2 cycles, 600 points: a 300-pixel Scope), and the jitter
// measured between consecutive traces.

const SR = 48000;
const FPS = 60;
const CYCLES = 2;
const POINTS = 600;
const FROM = 0.6;
type Tap = 'oscillator' | 'filter' | 'amp';
type Engine = ReturnType<typeof createSynthEngine>;

interface Frame {
  samples: Float32Array;
  /** The audio clock at the read. */
  end: number;
  /** The fundamental the Scope's window follows (no vibrato). */
  f: number;
  frequencyAt(time: number): number;
}

/** Renders `patch` played by `play`, and reads `tap` at every frame from FROM to `to` seconds. */
async function capture(patch: Patch, play: (e: Engine) => void, tap: Tap, to = 2.6): Promise<Frame[]> {
  const ctx = new OfflineAudioContext(1, Math.round(SR * (to + 0.05)), SR);
  const engine = createSynthEngine(ctx);
  engine.applyPatch(patch);
  engine.setTapSource('all');
  play(engine);
  const frames: Frame[] = [];
  for (let k = 0; FROM + k / FPS < to; k++)
    void ctx.suspend(FROM + k / FPS).then(() => {
      const samples = new Float32Array(engine.taps[tap].fftSize);
      engine.taps[tap].getFloatTimeDomainData(samples);
      frames.push({ samples, end: engine.now(), f: engine.fundamental(), frequencyAt: engine.fundamentalAt });
      void ctx.resume();
    });
  await ctx.startRendering();
  return frames;
}

/** Each frame Cycle Locked as the Scope does. */
function drawn(frames: Frame[]): LockedTrace[] {
  const lock = createCycleLock();
  return frames.map((frame) => lock({ ...frame, sampleRate: SR, cycles: scopeWindow(frame.samples.length, SR, frame.f, CYCLES).cycles, points: POINTS }));
}

const quantile = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(q * (xs.length - 1) + 0.5))];
const percent = (x: number) => Math.round(x * 1000) / 10;
const loud = (trace: Float32Array) => Math.hypot(...trace) / Math.sqrt(trace.length) >= 1e-3;

/** The jitter's median and 95th percentile, in %, over the frames where both traces sound. */
function steadiness(traces: Float32Array[]) {
  const js: number[] = [];
  for (let k = 1; k < traces.length; k++) if (loud(traces[k]) && loud(traces[k - 1])) js.push(traceJitter(traces[k], traces[k - 1]));
  return { median: percent(quantile(js, 0.5)), p95: percent(quantile(js, 0.95)) };
}

/**
 * The floor: each frame's best match to the previous trace from any start at least half a frame later, what is left
 * being the wave's own change, which no choice of start removes. A coarse search on 64 points, then finer.
 */
function floor(frames: Frame[], traces: LockedTrace[]) {
  const js: number[] = [];
  for (let k = 1; k < frames.length; k++) {
    const { samples } = frames[k];
    const { trace: previous, length } = traces[k - 1];
    if (!loud(previous)) continue;
    const moved = (frames[k].end - frames[k - 1].end) * SR;
    const first = Math.max(0, Math.ceil(traces[k - 1].start - moved / 2));
    const last = samples.length - length - 2;
    let best = first;
    let bestMiss = Infinity;
    for (let c = first; c <= last; c++) {
      let miss = 0;
      for (let p = 0; p < POINTS && miss < bestMiss; p++) miss += (samples[c + Math.round((p * length) / (POINTS - 1))] - previous[p]) ** 2;
      if (miss < bestMiss) [best, bestMiss] = [c, miss];
    }
    let fine = Infinity;
    for (let c = Math.max(first, best - 1); c <= Math.min(last, best + 1); c += 1 / 16) fine = Math.min(fine, traceJitter(scopeTrace(samples, c, length, POINTS), previous));
    js.push(fine);
  }
  return percent(quantile(js, 0.5));
}

const preset = (name: string) => {
  const found = PRESETS.find((p) => p.name === name);
  if (!found) throw new Error(name);
  return found.patch;
};
const init = defaultPatch();
const hold =
  (...notes: number[]) =>
  (e: Engine) => {
    for (const note of notes) e.noteOn(note, 1, 0);
  };
const C3 = 48;

/** 1.21.1's Cycle Lock: the phase at the Note's steady pitch over the buffer less the window, the trace from its oldest end. */
function lockedIn1211(frame: Frame): Float32Array {
  const { samples, f } = frame;
  const length = Math.max(2, Math.floor(scopeWindow(samples.length, SR, f, CYCLES).length));
  const head = samples.subarray(0, samples.length - length - 1);
  const w = (2 * Math.PI * f) / SR;
  let s = 0;
  let c = 0;
  for (let i = 0; i < head.length; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (head.length - 1));
    s += head[i] * hann * Math.sin(w * i);
    c += head[i] * hann * Math.cos(w * i);
  }
  const start = Math.hypot(s, c) < 1e-6 * head.length ? 0 : ((((-Math.atan2(c, s)) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / w;
  return scopeTrace(samples, start, length, POINTS);
}

const C4 = 60;
const sound = {
  saw: [init, hold(C3), 'oscillator'],
  detune3: [{ ...init, mixOsc2: 1, osc2Detune: 3 }, hold(C3), 'amp'],
  detune10: [{ ...init, mixOsc2: 1, osc2Detune: 10 }, hold(C3), 'amp'],
  pwm: [preset('PWM Morph'), hold(C3), 'amp'],
  noise: [{ ...init, mixNoise: 0.3 }, hold(C3), 'amp'],
  slowVibrato: [preset('Slow Vibrato'), hold(C3), 'amp'],
  fastVibrato: [preset('Fast Vibrato'), hold(C3), 'amp'],
  fm15: [{ ...preset('FM Ladder'), osc2Semitone: 7 }, hold(C3), 'amp'],
  fm1414: [{ ...preset('FM Ladder'), osc2Semitone: 6 }, hold(C3), 'amp'],
  ring238: [{ ...preset('Ring Bell'), ampSustain: 1 }, hold(C3), 'amp'],
  perfectFifth: [preset('Perfect Fifth'), hold(C3), 'amp'],
  majorTriad: [{ ...init, voices: 8, ampSustain: 1 }, hold(C4, C4 + 4, C4 + 7), 'amp'],
  octave: [{ ...init, voices: 8, ampSustain: 1 }, hold(C3, C4), 'amp'],
} satisfies Record<string, [Patch, (e: Engine) => void, Tap]>;
const framesOf = (name: keyof typeof sound) => {
  const [patch, play, tap] = sound[name];
  return capture(patch, play, tap);
};
/** The Portamento Preset gliding C3 to G3 to G2, its Glides measured whole. */
const portamento = () =>
  capture(
    preset('Portamento'),
    (e) => {
      e.noteOn(C3, 1, 0);
      e.noteOn(C3 + 7, 1, 1.2);
      e.noteOn(C3 - 5, 1, 2.6);
    },
    'amp',
    4.1,
  );

describe('the Scopes on the engine’s sound (issue 180)', () => {
  it('stand still through vibrato and Glide: Slow and Fast Vibrato under 10 % from frame to frame, the Portamento’s Glides under 15 %', async () => {
    for (const name of ['slowVibrato', 'fastVibrato'] as const) expect(steadiness(drawn(await framesOf(name)).map((t) => t.trace)).median, name).toBeLessThan(10);
    expect(steadiness(drawn(await portamento()).map((t) => t.trace)).median).toBeLessThan(15);
  });

  it('keep Slow Vibrato’s words, “the Scope stays locked through it”, true on every Tap (decision 9)', async () => {
    expect(PRESETS.find((p) => p.name === 'Slow Vibrato')?.about).toContain('the Scope stays locked through it');
    for (const tap of ['oscillator', 'filter', 'amp'] as const) {
      const { median, p95 } = steadiness(drawn(await capture(preset('Slow Vibrato'), hold(C3), tap)).map((t) => t.trace));
      expect(median, tap).toBeLessThan(2);
      expect(p95, tap).toBeLessThan(5);
    }
  });

  it('no longer flip where the wave repeats every two cycles: a Perfect Fifth, FM at 3:2 and an octave chord under 10 % at the 95th percentile', async () => {
    for (const name of ['perfectFifth', 'fm15', 'octave'] as const) expect(steadiness(drawn(await framesOf(name)).map((t) => t.trace)).p95, name).toBeLessThan(10);
  });

  it('flip less than 1.21.1’s lock did on FM and Ring at ratios that are not whole and on a major triad on the Amp Tap', async () => {
    // Their waves never repeat: what is left is the sound's own change (docs/research/180-steadier-scopes.md).
    for (const name of ['fm1414', 'ring238', 'majorTriad'] as const) {
      const frames = await framesOf(name);
      const before = steadiness(frames.map(lockedIn1211)).p95;
      expect(steadiness(drawn(frames).map((t) => t.trace)).p95, name).toBeLessThan(before - 20);
    }
  });

  it('hide no real change: a saw, detune, PWM and Noise move within 3 points of their floor', async () => {
    for (const name of ['saw', 'detune3', 'detune10', 'pwm', 'noise'] as const) {
      const frames = await framesOf(name);
      const traces = drawn(frames);
      expect(Math.abs(steadiness(traces.map((t) => t.trace)).median - floor(frames, traces)), name).toBeLessThan(3);
    }
  });

  it('settle on a new Note played without Glide at once, rather than sliding as the old one leaves the buffer (the 2026-11-02 review)', async () => {
    for (const patch of [init, preset('Resonant Ring')]) {
      const frames = await capture(
        patch,
        (e) => {
          e.noteOn(C3, 1, 0);
          e.noteOn(C3 + 7, 1, 1.2);
        },
        'amp',
        1.8,
      );
      const traces = drawn(frames).map((t) => t.trace);
      // From the third frame after the Note, while the old Note still fills most of the buffer.
      const after = Math.round((1.2 - FROM) * FPS) + 3;
      for (let k = after; k < after + 12; k++) expect(traceJitter(traces[k], traces[k - 1]), `frame ${k}`).toBeLessThan(0.1);
    }
  });

  it('draw the newest sound: every trace ends at most a cycle and 20 ms before its buffer does (1.21.1: 94 to 165 ms)', async () => {
    for (const frames of [await framesOf('fastVibrato'), await framesOf('majorTriad'), await portamento()])
      drawn(frames).forEach(({ start, length }, k) => {
        const age = (frames[k].samples.length - 1 - (start + length)) / SR;
        expect(age, `frame ${k}`).toBeLessThanOrEqual(1 / frames[k].frequencyAt(frames[k].end) + 0.02 + 1e-3);
      });
  });

  it('cost no more a frame than 1.21.1’s lock (review 18)', async () => {
    const frames = (await framesOf('detune10')).slice(0, 30);
    const msPerFrame = (draw: () => void) => {
      let calls = 0;
      const t0 = performance.now();
      while (performance.now() - t0 < 300) {
        draw();
        calls++;
      }
      return (performance.now() - t0) / calls / frames.length;
    };
    const before = msPerFrame(() => frames.forEach(lockedIn1211));
    const now = msPerFrame(() => drawn(frames));
    expect(now).toBeLessThan(before);
  });
});
