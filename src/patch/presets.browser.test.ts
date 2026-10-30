import { beforeAll, describe, expect, it } from 'vitest';
import { createSynthEngine } from '../engine/synthEngine';
import { dB, frequencyAround, toneAmplitude, toneAmplitudeHann } from '../test/measure';
import type { Patch } from './patch';
import { PRESET_GROUPS, PRESETS } from './presets';

// The Presets rendered offline, as reviews 13 to 15 heard them (issue 108): their levels against their group, and
// what their words promise.

const SR = 48000;
const C4 = 60;
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
/** When the Note starts: a little after 0, as a player's would. */
const NOTE = 0.05;

/**
 * A Note (or a chord, one Note a hundredth of a second after the other) held from NOTE to `hold`, rendered to
 * `seconds`. The safety limiter's curve is made straight, so the samples are what reaches it (review 14's method).
 */
async function play(patch: Patch, notes: number[], hold: number, seconds: number, velocity = 1) {
  const ctx = new OfflineAudioContext(1, Math.round(SR * seconds), SR);
  const shaper = ctx.createWaveShaper.bind(ctx);
  const curve = Object.getOwnPropertyDescriptor(WaveShaperNode.prototype, 'curve')!;
  ctx.createWaveShaper = () => {
    const node = shaper();
    // The limiter's curve is the one longer than the LFOs' two-point clamp: ±4 in, ±4 out, a straight line.
    Object.defineProperty(node, 'curve', {
      get: () => curve.get!.call(node),
      set: (c: Float32Array) => curve.set!.call(node, c.length > 2 ? Float32Array.of(-4, 4) : c),
    });
    return node;
  };
  const engine = createSynthEngine(ctx);
  engine.applyPatch(patch);
  notes.forEach((note, i) => engine.noteOn(note, velocity, NOTE + i * 0.01));
  engine.noteOff(hold);
  return (await ctx.startRendering()).getChannelData(0);
}

/** The loudest 100 ms (RMS, in 10 ms steps), in dBFS: review 14's level. */
function loudestDb(s: Float32Array) {
  const [size, step] = [SR / 10, SR / 100];
  let most = 0;
  for (let from = 0; from + size <= s.length; from += step) {
    let sum = 0;
    for (let i = from; i < from + size; i++) sum += s[i] * s[i];
    most = Math.max(most, sum / size);
  }
  return 10 * Math.log10(most);
}
const peak = (s: Float32Array) => s.reduce((most, v) => Math.max(most, Math.abs(v)), 0);
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length / 2;
  return Number.isInteger(middle) ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[Math.floor(middle)];
};
/** A window of `length` seconds from `from` seconds after the Note, in samples. */
const span = (from: number, length = 0.04) => [Math.round((NOTE + from) * SR), Math.round((NOTE + from + length) * SR)] as const;
/**
 * The partial at `ratio` times the Note against the Note's own, in dB, over a window of `length` seconds from `from`
 * seconds after it (Hann-windowed, so a strong neighbour does not leak in).
 */
const partialDb = (s: Float32Array, note: number, ratio: number, from: number, length = 0.04) => {
  const window = s.subarray(...span(from, length));
  return dB(toneAmplitudeHann(window, SR, hz(note) * ratio) / toneAmplitudeHann(window, SR, hz(note)));
};
/** How bright: the 2nd to 20th Harmonics' power against the 1st's, in dB, over a window from `from` seconds after the Note. */
function brightnessDb(s: Float32Array, note: number, from: number) {
  const power = (n: number) => toneAmplitude(s, SR, hz(note) * n, ...span(from)) ** 2;
  let upper = 0;
  for (let n = 2; n <= 20; n++) upper += power(n);
  return 10 * Math.log10(upper / power(1));
}

describe('every Preset’s level against its group’s (issue 108)', () => {
  /**
   * Those meant to sit apart, and by how much, in dB from their group's median. The test still holds each to within
   * 3 dB of that, so a level that drifts further is caught.
   */
  const APART: Record<string, { by: number; why: string }> = {
    'Thin Pulse': { by: -8, why: 'so narrow a pulse carries little energy, as its words say' },
    'Ring Bell': { by: -4.5, why: 'two sines multiplied sound quieter than either alone, as its words say' },
    Vowel: { by: -12.5, why: 'a narrow band-pass lets little through, as its words say' },
    'Breathing Bell': { by: -5.5, why: 'four Voices, where the rest of its group has one: the master makes room for them' },
    Pluck: { by: 9.5, why: 'one Voice, for its Tutorial, among keys of six and eight (issue 125 decides where it sits)' },
  };
  const levels = new Map<string, number>();

  // Each Note held for its Attack and a second: the loudest moment of a slow swell comes after its Attack.
  beforeAll(async () => {
    const queue = [...PRESETS];
    const render = async () => {
      for (let p = queue.shift(); p; p = queue.shift()) {
        const hold = NOTE + p.patch.ampAttack + 1;
        levels.set(p.name, loudestDb(await play(p.patch, [C4], hold, hold + 0.05)));
      }
    };
    // Several at once: each OfflineAudioContext renders on its own thread.
    await Promise.all(Array.from({ length: 6 }, render));
  }, 300_000);

  for (const group of PRESET_GROUPS)
    it(`keeps each of ${group} within 3 dB of the group’s median on C4`, () => {
      const members = PRESETS.filter((p) => p.group === group);
      const middle = median(members.map((p) => levels.get(p.name)!));
      const table = members.map((p) => `${p.name} ${levels.get(p.name)!.toFixed(1)} (${(levels.get(p.name)! - middle).toFixed(1)})`).join(', ');
      for (const p of members) {
        const off = levels.get(p.name)! - middle - (APART[p.name]?.by ?? 0);
        expect(Math.abs(off), `${p.name} in ${group}, median ${middle.toFixed(1)} dBFS: ${table}`).toBeLessThanOrEqual(3);
      }
    });

  it('names only Presets that exist', () => {
    for (const name of Object.keys(APART)) expect(PRESETS.some((p) => p.name === name), name).toBe(true);
  });
});

describe('the Presets reworked for issue 108 stay clear of the limiter', () => {
  // Their sound changed, not only their Volume (which only lowers it): each Note on C2, C4 and C6, and a chord, held
  // through its Attack and half a second more.
  const REWORKED = [
    'High-pass Buzz', 'Pluck Shape', 'Chip Lead', 'Sync-ish Lead', 'Ring Lead', 'Ring Sweep', 'Square Lead', 'Clav', 'Organ', 'Electric Piano',
    'Tremolo Keys', 'Marimba', 'Chorus Pluck', 'FM Bell', 'Kalimba', 'Zap Pluck', 'Felt Piano', 'Tine Piano', 'Choir', 'Breathing Pad', 'Glass Pad',
    'Poly Keys', 'Chord Organ', 'Kick', 'Tom', 'Cowbell', 'Wind', 'Ocean', 'Trill', 'Wah', 'Robot',
  ];
  it.each(REWORKED)('%s', async (name) => {
    const patch = preset(name);
    const hold = NOTE + patch.ampAttack + 0.5;
    const renders = await Promise.all([
      ...[36, C4, 84].map((note) => play(patch, [note], hold, hold + 0.05)),
      ...(patch.voices > 1 ? [play(patch, [C4, 64, 67, 71].slice(0, patch.voices), hold, hold + 0.05)] : []),
    ]);
    for (const s of renders) expect(peak(s)).toBeLessThan(0.8);
  });
});

describe('the Presets do what their words say (issue 108, reviews 13 and 15)', () => {
  /** The share of a window's power off the Note's own frequency: 0 for a pure sine. */
  const offCarrier = (s: Float32Array, note: number, from: number) => {
    const [a, b] = span(from, 0.02);
    let sum = 0;
    for (let i = a; i < b; i++) sum += s[i] * s[i];
    return 1 - toneAmplitude(s, SR, hz(note), a, b) ** 2 / 2 / (sum / (b - a));
  };
  const levelDb = (s: Float32Array, from: number) => {
    const [a, b] = span(from, 0.02);
    let sum = 0;
    for (let i = a; i < b; i++) sum += s[i] * s[i];
    return 10 * Math.log10(sum / (b - a));
  };

  it('Zap Pluck starts at full FM and melts to a pure sine as it decays; the falling saw’s next zap comes 45 dB down', async () => {
    const A4 = 69;
    const s = await play(preset('Zap Pluck'), [A4], 1.2, 1.3);
    expect(offCarrier(s, A4, 0)).toBeGreaterThan(0.7);
    expect(offCarrier(s, A4, 0.4)).toBeLessThan(0.1);
    // At 2 Hz, the saw starts again half a second in.
    expect(offCarrier(s, A4, 0.52)).toBeGreaterThan(0.5);
    expect(levelDb(s, 0.52) - levelDb(s, 0)).toBeLessThan(-45);
  });

  for (const note of [57, 69, 81])
    it(`Kalimba on MIDI ${note}: sidebands on the odd Harmonics, a bright tine that turns to a round tone`, async () => {
      const s = await play(preset('Kalimba'), [note], 1.2, 1.3);
      for (const n of [3, 5]) expect(partialDb(s, note, n, 0.005), `${n}f at the strike`).toBeGreaterThan(-18);
      for (const n of [3, 5]) expect(partialDb(s, note, n, 0.4), `${n}f at 0.4 s`).toBeLessThan(-22);
      for (const n of [2, 4]) expect(partialDb(s, note, n, 0.005), `${n}f`).toBeLessThan(-40);
    });

  for (const note of [57, 69, 81])
    it(`FM Bell on MIDI ${note}: its partials, bright at the strike, mellow by 0.4 s`, async () => {
      const s = await play(preset('FM Bell'), [note], 1.2, 1.3);
      // The sidebands of a sine 3.56 times higher: at 4.56 and 6.13 times the Note.
      for (const ratio of [4.564, 6.128]) expect(partialDb(s, note, ratio, 0.4) - partialDb(s, note, ratio, 0.005), `${ratio}f`).toBeLessThan(-5);
    });

  it('FM Sidebands puts its sidebands on the odd Harmonics above the Note, nothing below it', async () => {
    const s = await play(preset('FM Sidebands'), [69], 1, 1.1);
    for (const n of [3, 5]) expect(partialDb(s, 69, n, 0.5)).toBeGreaterThan(-20);
    for (const ratio of [0.5, 2, 4]) expect(partialDb(s, 69, ratio, 0.5), `${ratio}f`).toBeLessThan(-40);
  });

  // Velocity on the Cutoff, where the words promise it: soft and hard strikes differ, not only in level (review 15).
  for (const name of ['Electric Piano', 'Tremolo Keys', 'Poly Keys', 'Felt Piano', 'Tine Piano'])
    it(`${name}: a hard strike is brighter than a soft one`, async () => {
      const [soft, hard] = await Promise.all([0.35, 1].map((velocity) => play(preset(name), [C4], 1, 1.1, velocity)));
      expect(brightnessDb(hard, C4, 0.005) - brightnessDb(soft, C4, 0.005)).toBeGreaterThan(name === 'Tine Piano' ? 6 : 3);
    });

  it('Marimba’s strike is brighter than the tone after it', async () => {
    const s = await play(preset('Marimba'), [C4], 1, 1.1);
    expect(brightnessDb(s, C4, 0.005) - brightnessDb(s, C4, 0.3)).toBeGreaterThan(3);
  });

  for (const name of ['Organ', 'Chord Organ'])
    it(`${name} shows three clean rungs: the Sub's, Osc 1's and Osc 2's`, async () => {
      const s = await play(preset(name), [C4], 1, 1.1);
      // Counted from the Sub, an octave down: rungs 1, 2 and 4; the odd rungs a square Sub would add, gone.
      const rung = (n: number) => partialDb(s, C4, n / 2, 0.5, 0.2);
      for (const n of [2, 4]) expect(rung(n)).toBeGreaterThan(-10);
      for (const n of [3, 5, 7]) expect(rung(n), `rung ${n}`).toBeLessThan(-40);
    });

  it('Trill plays the Note and the whole tone above it, nothing else', async () => {
    const s = await play(preset('Trill'), [C4], 1.2, 1.3);
    // The free LFO runs from the engine's start, upper half first: a 30 ms window in the middle of each half.
    const heard = [];
    for (let t = 1 / 24; t < 1.1; t += 1 / 12) if (t > NOTE + 0.02) heard.push(12 * Math.log2(frequencyAround(s, SR, t, 0.03) / hz(C4)));
    for (const [i, semitones] of heard.entries()) expect(semitones, heard.map((h) => h.toFixed(2)).join(' ')).toBeCloseTo(i % 2 ? 2 : 0, 1);
  });

  it('Square Lead starts each Note’s vibrato in tune, at the centre of the swing', async () => {
    const ctx = new OfflineAudioContext(1, SR, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(preset('Square Lead'));
    // The second Note once the first's Release is over, so it starts at once (into a sounding Voice, it dips first).
    engine.noteOn(C4, 1, 0.1);
    engine.noteOff(0.37);
    engine.noteOn(67, 1, 0.8);
    await ctx.startRendering();
    for (const at of [0.1, 0.8]) {
      expect(engine.modulationAt(at).vibrato).toBeCloseTo(0, 3);
      expect(engine.modulationAt(at + 0.02).vibrato).toBeGreaterThan(0); // rising
    }
  });
});
