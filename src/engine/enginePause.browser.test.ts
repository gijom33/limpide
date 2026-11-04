import { describe, expect, it } from 'vitest';
import { noteIndex } from '../music/tempo';
import { defaultPatch, type Patch } from '../patch/patch';
import { createSynthEngine } from './synthEngine';

// Issue 216: in a long silence the page pauses the sound engine. The engine's part: saying from when nothing sounds,
// and, while paused, a clock that runs on by the page's for what is drawn, the LFOs and the beat carried on by the time
// paused when it wakes, in the sound as in the model, so nothing drawn jumps and the first Note sounds as ever.

const SR = 48000;
type Engine = ReturnType<typeof createSynthEngine>;

/** The largest step between neighbouring samples from `from` to `to` seconds: a click is one far past the wave's own. */
function steepestStep(s: Float32Array, from: number, to: number) {
  let most = 0;
  for (let i = Math.round(from * SR) + 1; i < Math.round(to * SR); i++) most = Math.max(most, Math.abs(s[i] - s[i - 1]));
  return most;
}

/**
 * Renders `seconds` of `patch`; at `at` the sound stops (an OfflineAudioContext's own suspend stands in for the page's)
 * and `during` runs, given the engine and a page clock to move on.
 */
async function render(seconds: number, patch: Partial<Patch>, at: number, during: (e: Engine, wall: { now: number }) => void, before?: (e: Engine) => void) {
  const ctx = new OfflineAudioContext(1, SR * seconds, SR);
  const wall = { now: 100 };
  const engine = createSynthEngine(ctx, { wall: () => wall.now });
  engine.applyPatch({ ...defaultPatch(), ...patch });
  before?.(engine);
  const done = ctx.suspend(at).then(() => {
    during(engine, wall);
    void ctx.resume();
  });
  const s = (await ctx.startRendering()).getChannelData(0);
  await done;
  return { s, engine };
}

describe('from when nothing sounds (issue 216)', () => {
  it('is never before any Note, not while a key is held, and once a released Note has faded to nothing', async () => {
    const ctx = new OfflineAudioContext(1, SR * 2, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch({ ...defaultPatch(), ampRelease: 0.1 });
    expect(engine.quietFrom()).toBe(-Infinity);
    engine.noteOn(57, 1, 0.1);
    expect(engine.quietFrom()).toBe(Infinity);
    engine.noteOff(0.3);
    const quiet = engine.quietFrom();
    expect(quiet).toBeGreaterThan(0.4);
    expect(quiet).toBeLessThan(2);
    const s = (await ctx.startRendering()).getChannelData(0);
    expect(Math.max(...s.subarray(Math.round(0.35 * SR), Math.round(0.36 * SR)).map(Math.abs))).toBeGreaterThan(0.01);
    expect(Math.max(...s.subarray(Math.round(quiet * SR)).map(Math.abs))).toBeLessThan(1e-6);
  });
});

describe('a pause (issue 216)', () => {
  const tremolo = { cutoff: 20000, waveform: 'sine', ampSustain: 1, ampAttack: 0.005, lfoDestination: 'volume', lfoAmount: 1, lfoRate: 1.3 } as const;

  it('shows its clock running on by the page’s while the sound’s stands still, and picks the sound’s up again without a jump', async () => {
    const shown: { lfo: number[]; now: number; sound: number } = { lfo: [], now: 0, sound: 0 };
    const after: number[] = [];
    await render(1.5, tremolo, 1, (e, wall) => {
      e.pause();
      expect(e.paused()).toBe(true);
      wall.now += 3.3;
      shown.now = e.shownNow();
      shown.sound = e.now();
      // The plot's last second, as drawn the frame before the wake.
      for (let i = 0; i <= 10; i++) shown.lfo.push(e.lfoSwingAt(shown.now - i / 10));
      e.wake();
      expect(e.paused()).toBe(false);
      for (let i = 0; i <= 10; i++) after.push(e.lfoSwingAt(e.shownNow() - i / 10));
    });
    expect(shown.sound).toBeCloseTo(1, 9);
    expect(shown.now).toBeCloseTo(4.3, 9);
    for (let i = 0; i <= 10; i++) expect(after[i], `${i / 10} s back`).toBeCloseTo(shown.lfo[i], 6);
    // And it moved while paused: not the value the sound stood at.
    expect(Math.abs(shown.lfo[0] - Math.sin(2 * Math.PI * 1.3 * 1))).toBeGreaterThan(0.1);
  });

  it('lets the first Note after it start on time, without a click, the LFO in the sound where the model has it', async () => {
    // A shallower tremolo, so the Note is heard from its start wherever the LFO has got to.
    const shallow = { ...tremolo, lfoAmount: 0.3 };
    const { s, engine } = await render(1.6, shallow, 1, (e, wall) => {
      e.pause();
      wall.now += 7.77;
      e.wake();
      e.noteOn(69, 1);
    });
    const plain = await render(1.6, shallow, 1, (e) => e.noteOn(69, 1));
    // Nothing before the Note, and the Note heard from the very sample it is without a pause.
    expect(Math.max(...s.subarray(0, SR).map(Math.abs))).toBeLessThan(1e-6);
    const heard = (x: Float32Array) => x.findIndex((v) => Math.abs(v) > 1e-6);
    expect(heard(s)).toBe(heard(plain.s));
    // No click: the Note opens no more steeply than one played without a pause.
    expect(steepestStep(s, 1, 1.1)).toBeLessThan(1.5 * steepestStep(plain.s, 1, 1.1));
    // The tremolo in the sound follows the model's carried LFO, sample by sample: against the same Note with no LFO.
    const still = await render(1.6, { ...shallow, lfoAmount: 0 }, 1, (e, wall) => {
      e.pause();
      wall.now += 7.77;
      e.wake();
      e.noteOn(69, 1);
    });
    let gap = 0;
    for (let i = Math.round(1.05 * SR); i < s.length; i++) {
      if (Math.abs(still.s[i]) < 0.01) continue;
      const t = i / SR;
      gap = Math.max(gap, Math.abs(s[i] / still.s[i] - engine.modulationAt(t).volume / still.engine.modulationAt(t).volume));
    }
    expect(gap).toBeLessThan(0.01);
  });

  it('keeps a synced LFO on the beat, the beat carried on with it', async () => {
    const synced = { ...tremolo, lfoSync: 'on', lfoNote: noteIndex('1/4'), lfoRetrigger: 'free', lfoWaveform: 'sine' } as const;
    const { engine } = await render(1.5, synced, 1, (e, wall) => {
      e.pause();
      wall.now += 0.3;
      e.wake();
    }, (e) => e.setTempo(120, 0));
    // 120 BPM: a beat every half second, counted from 0 and carried on by 0.3 s. A sine at its centre rising on each.
    const { origin } = engine.tempo();
    expect(((origin % 0.5) + 0.5) % 0.5).toBeCloseTo(0.2, 6);
    for (const k of [3, 4]) expect(engine.lfoSwingAt(origin + k * 0.5), `beat ${k}`).toBeCloseTo(0, 6);
  });
});
