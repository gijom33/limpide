import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TRACK } from '../demo/track';
import { type ParamId, type Patch, setParam } from '../patch/patch';
import { PRESETS } from '../patch/presets';
import { toneAmplitude } from '../test/measure';
import { createSynthEngine, MAX_VOICES } from './synthEngine';

const SR = 48000;
const METHODS = [
  'setValueAtTime', 'linearRampToValueAtTime', 'exponentialRampToValueAtTime', 'setTargetAtTime', 'setValueCurveAtTime',
  'cancelScheduledValues', 'cancelAndHoldAtTime',
] as const;

interface Write {
  method: string;
  param: AudioParam | OscillatorNode;
  value?: number;
}

/**
 * Every AudioParam call, and every Waveform an Oscillator is given, from the test's start: the calls since `mark()`,
 * and the value each AudioParam was last set to before them.
 */
let writes: Write[] = [];
let restore: (() => void)[] = [];
beforeEach(() => {
  writes = [];
  const params = AudioParam.prototype as unknown as Record<string, (...args: unknown[]) => unknown>;
  for (const method of METHODS) {
    const original = params[method];
    if (!original) continue;
    params[method] = function (this: AudioParam, ...args: unknown[]) {
      writes.push({ method, param: this, value: method === 'setValueAtTime' ? (args[0] as number) : undefined });
      return original.apply(this, args);
    };
    restore.push(() => (params[method] = original));
  }
  const oscillators = OscillatorNode.prototype;
  const setPeriodicWave = oscillators.setPeriodicWave;
  oscillators.setPeriodicWave = function (this: OscillatorNode, wave: PeriodicWave) {
    writes.push({ method: 'setPeriodicWave', param: this });
    return setPeriodicWave.call(this, wave);
  };
  restore.push(() => (oscillators.setPeriodicWave = setPeriodicWave));
});
afterEach(() => {
  for (const undo of restore) undo();
  restore = [];
});

/**
 * The writes `act` makes, and each AudioParam's value set last before it. A value set after its AudioParam's schedule is
 * cancelled is scheduled again, whatever it was: those are left out of `before`.
 */
function writesOf(act: () => void) {
  const before = new Map<Write['param'], number | undefined>();
  for (const w of writes) if (w.method === 'setValueAtTime') before.set(w.param, w.value);
  const from = writes.length;
  act();
  const made = writes.slice(from);
  for (const w of made) if (w.method.startsWith('cancel')) before.delete(w.param);
  return { made, before };
}

const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;

/**
 * An engine on `patch`, a chord held from the start on as many Voices as it plays; half a second in, `act` on it. The
 * writes before `act`, and those `act` made with each AudioParam's value set last before them.
 */
async function playing(patch: Patch, act: (engine: ReturnType<typeof createSynthEngine>) => void) {
  const ctx = new OfflineAudioContext(1, SR * 0.6, SR);
  const engine = createSynthEngine(ctx);
  engine.applyPatch(patch);
  for (let v = 0; v < patch.voices; v++) engine.noteOn(48 + 3 * v, 0.8, 0);
  const acted = ctx.suspend(0.5).then(() => {
    const whole = writes.length;
    const made = writesOf(() => act(engine));
    void ctx.resume();
    return { whole, ...made };
  });
  await ctx.startRendering();
  return acted;
}

/** Every knob the Demo turns, in the part that turns it, with one tick of its move: a 25th of the way. */
const DEMO_TICKS = TRACK.parts.flatMap((part) =>
  (part.moves ?? []).map((m) => {
    const patch = preset(part.preset);
    const from = m.from ?? (patch[m.id] as number);
    return { part: part.preset, id: m.id, patch: setParam(patch, m.id, from), value: from + (m.to - from) / 25 };
  }),
);

describe('a change writes only what it changes (issue 218)', () => {
  it('writes nothing when the Patch applied again is the same', async () => {
    for (const p of PRESETS) {
      const { made } = await playing(p.patch, (engine) => engine.applyPatch({ ...p.patch }));
      expect(made.map((w) => w.method), p.name).toEqual([]);
    }
  });

  it('writes, on a Demo knob tick, only AudioParams whose value it changes, and far fewer than a whole Patch', async () => {
    for (const tick of DEMO_TICKS) {
      const { whole, made, before } = await playing(tick.patch, (engine) => engine.applyPatch(setParam(tick.patch, tick.id as ParamId, tick.value)));
      const label = `${tick.part}: ${tick.id}`;
      for (const w of made.filter((m) => m.method === 'setValueAtTime')) expect(w.value, label).not.toBe(before.get(w.param));
      expect(made.length, label).toBeLessThan(whole / 10);
    }
  });

  it("writes a Cutoff tick to each Voice's Cutoff alone", async () => {
    const tick = DEMO_TICKS.find((t) => t.id === 'cutoff')!;
    const { made } = await playing(tick.patch, (engine) => engine.applyPatch(setParam(tick.patch, 'cutoff', tick.value)));
    expect(made.map((w) => w.method)).toEqual(Array(MAX_VOICES).fill('setValueAtTime'));
  });

  it('writes a whole new Patch whole, the parameters it shares with the one before too', async () => {
    const acid = preset('Acid');
    const { whole, made } = await playing(acid, (engine) => engine.applyPatch({ ...acid }, { whole: true }));
    expect(made.length).toBeGreaterThan(whole / 2);
  });

  it('sounds as before: a Cutoff turned away and back plays the Patch it came back to', async () => {
    const render = async (away: boolean) => {
      const ctx = new OfflineAudioContext(1, SR * 1.5, SR);
      const engine = createSynthEngine(ctx);
      const patch: Patch = { ...preset('Init'), cutoff: 400, resonance: 0, ampAttack: 0.001, ampSustain: 1, lfoAmount: 0, lfo2Amount: 0 };
      engine.applyPatch(patch);
      engine.noteOn(45, 1, 0);
      const at = (time: number, next: Patch) =>
        ctx.suspend(time).then(() => {
          engine.applyPatch(next);
          return ctx.resume();
        });
      const turns = [at(0.5, setParam(patch, 'cutoff', away ? 6000 : 400)), at(1, { ...patch })];
      const s = (await ctx.startRendering()).getChannelData(0);
      await Promise.all(turns);
      return s;
    };
    const [stayed, turned] = [await render(false), await render(true)];
    const tenth = (s: Float32Array, from: number) => toneAmplitude(s, SR, 110 * 10, from * SR, from * SR + SR / 4);
    expect(tenth(turned, 0.6)).toBeGreaterThan(tenth(stayed, 0.6) * 4); // away, the Filter open
    expect(tenth(turned, 1.2)).toBeCloseTo(tenth(stayed, 1.2), 5); // back, as if it had stayed
  });
});
