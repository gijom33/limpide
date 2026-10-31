import { beforeAll, describe, expect, it } from 'vitest';
import { createSynthEngine } from '../engine/synthEngine';
import { dB, energyAboveDb, frequencyAround, toneAmplitude, toneAmplitudeHann } from '../test/measure';
import { applyStep } from '../tutorial/tutorial';
import { tutorialFor } from '../tutorial/tutorials';
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

/** A Note held for its Attack and a second (the loudest moment of a slow swell comes after its Attack): its level. */
async function levelOf(patch: Patch, note: number) {
  const hold = NOTE + patch.ampAttack + 1;
  return loudestDb(await play(patch, [note], hold, hold + 0.05));
}
let onC4: Promise<Map<string, number>> | undefined;
/** Every Preset's level on C4, rendered once for the tests that need it. */
function levelsOnC4() {
  onC4 ??= (async () => {
    const levels = new Map<string, number>();
    const queue = [...PRESETS];
    const render = async () => {
      for (let p = queue.shift(); p; p = queue.shift()) levels.set(p.name, await levelOf(p.patch, C4));
    };
    // Several at once: each OfflineAudioContext renders on its own thread.
    await Promise.all(Array.from({ length: 6 }, render));
    return levels;
  })();
  return onC4;
}
const familyMedian = (levels: Map<string, number>, group: string) => median(PRESETS.filter((p) => p.group === group).map((p) => levels.get(p.name)!));

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
  };
  let levels = new Map<string, number>();
  beforeAll(async () => {
    levels = await levelsOnC4();
  }, 300_000);

  for (const group of PRESET_GROUPS)
    it(`keeps each of ${group} within 3 dB of the group’s median on C4`, () => {
      const members = PRESETS.filter((p) => p.group === group);
      const middle = familyMedian(levels, group);
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
    'Tremolo Keys', 'Marimba', 'Chorus Pluck', 'FM Bell', 'Kalimba', 'Zap Pluck', 'Felt Piano', 'Tine Piano', 'Choir', 'Breathing Pad', 'Glass Pad', 'Kick', 'Tom', 'Cowbell', 'Wind', 'Ocean', 'Trill', 'Wah', 'Robot',
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
  for (const name of ['Electric Piano', 'Tremolo Keys', 'Felt Piano', 'Tine Piano'])
    it(`${name}: a hard strike is brighter than a soft one`, async () => {
      const [soft, hard] = await Promise.all([0.35, 1].map((velocity) => play(preset(name), [C4], 1, 1.1, velocity)));
      expect(brightnessDb(hard, C4, 0.005) - brightnessDb(soft, C4, 0.005)).toBeGreaterThan(name === 'Tine Piano' ? 6 : 3);
    });

  it('Marimba’s strike is brighter than the tone after it', async () => {
    const s = await play(preset('Marimba'), [C4], 1, 1.1);
    expect(brightnessDb(s, C4, 0.005) - brightnessDb(s, C4, 0.3)).toBeGreaterThan(3);
  });

  it('Organ shows three clean rungs: the Sub’s, Osc 1’s and Osc 2’s', async () => {
      const s = await play(preset('Organ'), [C4], 1, 1.1);
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

describe('the ten Presets review 15 proposed (issue 125)', () => {
  const ADDED = ['Riser', 'Phase Pad', 'Flute', 'House Organ', 'Sub Drop', 'Rave Stab', 'PWM Bass', 'Pick Pluck', 'Ride', 'Analog Drift Lead'];
  const family = (name: string) => PRESETS.find((p) => p.name === name)!.group;
  let levels = new Map<string, number>();
  beforeAll(async () => {
    levels = await levelsOnC4();
  }, 300_000);

  // Their family's level on C4 holds across the keyboard: on C2 and C6 too, each Note and a chord under the limiter's knee.
  it.each(ADDED)('%s plays at its family’s level on C2, C4 and C6, clear of the limiter', async (name) => {
    const patch = preset(name);
    const middle = familyMedian(levels, family(name));
    const hold = NOTE + patch.ampAttack + 1;
    const notes = await Promise.all([36, C4, 84].map((note) => play(patch, [note], hold, hold + 0.05)));
    const chord = patch.voices > 1 ? [await play(patch, [C4, 64, 67, 71].slice(0, patch.voices), hold, hold + 0.05)] : [];
    for (const [i, s] of notes.entries()) expect(Math.abs(loudestDb(s) - middle), `C${2 + 2 * i} against ${family(name)}’s ${middle.toFixed(1)} dBFS`).toBeLessThanOrEqual(3);
    for (const s of [...notes, ...chord]) expect(peak(s)).toBeLessThan(0.8);
  });

  /** The engine after a Note on C4 from NOTE, rendered for `seconds`, to read its Modulation model. */
  const modelled = async (name: string, seconds: number) => {
    const ctx = new OfflineAudioContext(1, SR * seconds, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(preset(name));
    engine.noteOn(C4, 1, NOTE);
    await ctx.startRendering();
    return engine;
  };
  /** The level over 50 ms from `from` seconds after the Note, in dBFS. */
  const levelAt = (s: Float32Array, from: number) => {
    const [a, b] = span(from, 0.05);
    let sum = 0;
    for (let i = a; i < b; i++) sum += s[i] * s[i];
    return 10 * Math.log10(sum / (b - a));
  };
  /** Everything above `hz` against everything below, over 2048 samples from `from` seconds after the Note. */
  const aboveDb = (s: Float32Array, hz: number, from: number) => energyAboveDb(s, SR, hz, span(from)[0], 2048);

  it('Riser: its six-second Attack takes the high-pass from 200 Hz past 5 kHz, and the Envelope (Osc 2 with it) almost to the top', async () => {
    const engine = await modelled('Riser', 7);
    expect(engine.modulationAt(NOTE).cutoff).toBeCloseTo(200, -1);
    expect(engine.modulationAt(NOTE + 6).cutoff).toBeGreaterThan(5000);
    // Env Amount +24 at the Envelope's level: almost two octaves.
    expect(engine.modulationAt(NOTE + 6).filter).toBeGreaterThan(0.9);
  });

  it('Sub Drop: Osc 2 falls from two octaves over its own pitch to it', async () => {
    const s = await play({ ...preset('Sub Drop'), mixSub: 0 }, [C4], 3, 3.1);
    const C5 = hz(72);
    expect(frequencyAround(s, SR, NOTE + 0.03, 0.04) / C5).toBeGreaterThan(3.2);
    expect(frequencyAround(s, SR, NOTE + 2.5, 0.04) / C5).toBeCloseTo(1, 1);
  });

  it('Phase Pad: the notch travels from under 500 Hz to over 2.5 kHz', async () => {
    const engine = await modelled('Phase Pad', 8);
    const cutoffs = Array.from({ length: 70 }, (_, i) => engine.modulationAt(NOTE + i / 10).cutoff);
    expect(Math.min(...cutoffs)).toBeLessThan(500);
    expect(Math.max(...cutoffs)).toBeGreaterThan(2500);
  });

  it('House Organ: each strike brighter than what follows, and its level falling back', async () => {
    const s = await play(preset('House Organ'), [C4], 1, 1.1);
    expect(aboveDb(s, 1500, 0.002) - aboveDb(s, 1500, 0.3)).toBeGreaterThan(4);
    expect(levelAt(s, 0.6) - levelAt(s, 0.01)).toBeLessThan(-6);
  });

  it('Rave Stab: one finger plays a fifth', async () => {
    const s = await play(preset('Rave Stab'), [C4], 1, 1.1);
    expect(partialDb(s, C4, 1.5, 0.03, 0.12)).toBeGreaterThan(-6);
  });

  it('Pick Pluck: Noise brightens the strike, and is gone from the top once the Filter closes', async () => {
    const [noise, none] = await Promise.all([preset('Pick Pluck'), { ...preset('Pick Pluck'), mixNoise: 0 }].map((p) => play(p, [C4], 1, 1.1)));
    expect(aboveDb(noise, 6000, 0.002) - aboveDb(none, 6000, 0.002)).toBeGreaterThan(3);
    expect(aboveDb(noise, 6000, 0.15)).toBeLessThan(-60);
  });

  it('Ride: fading over a second and a half', async () => {
    const s = await play(preset('Ride'), [C4], 2.5, 2.6);
    expect(levelAt(s, 1) - levelAt(s, 0.01)).toBeGreaterThan(-30);
    expect(levelAt(s, 1.5) - levelAt(s, 0.01)).toBeLessThan(-25);
  });

  it('Analog Drift Lead: the pitch drifts 4 cents either way, one swing every eight seconds', async () => {
    const engine = await modelled('Analog Drift Lead', 9);
    const cents = Array.from({ length: 80 }, (_, i) => engine.modulationAt(NOTE + i / 10).vibrato * 100);
    expect(Math.max(...cents)).toBeCloseTo(4, 0);
    expect(Math.min(...cents)).toBeCloseTo(-4, 0);
  });
});

describe('issue 109’s Tutorials say what the engine plays, at the Step that says it', () => {
  /** The Patch a Tutorial has built once the Step on `control` is made. */
  const atStep = (preset: string, control: string) => {
    const steps = tutorialFor(preset)!.steps;
    const index = steps.findIndex((s) => s.kind !== 'display' && s.id === control);
    expect(index, control).toBeGreaterThanOrEqual(0);
    return steps.slice(0, index + 1).reduce(applyStep, PRESETS[0].patch);
  };
  /** A Note on C4 held 0.6 s, and the partial at `ratio` times it against the Note's own, from 0.3 s, in dB. */
  const partials = async (patch: Patch, ratios: number[]) => {
    const s = await play(patch, [C4], NOTE + 0.6, NOTE + 0.65);
    return ratios.map((ratio) => partialDb(s, C4, ratio, 0.3, 0.2));
  };

  it('FM Ladder: Osc 2 silent changes nothing; FM at 50 % grows the sine into a ladder', async () => {
    const [silent] = await partials(atStep('FM Ladder', 'osc2Waveform'), [2]);
    expect(silent).toBeLessThan(-40);
    const rungs = await partials(atStep('FM Ladder', 'crossMod'), [2, 3, 4]);
    for (const rung of rungs) expect(rung).toBeGreaterThan(-24);
  });

  it('Ring Bell: Ring with Osc 2 an octave up adds 3 times the Note; +3 semitones moves both off the ladder', async () => {
    const [third] = await partials(atStep('Ring Bell', 'mixRing'), [3]);
    expect(third).toBeGreaterThan(-12);
    const [difference, sum, ladder] = await partials(atStep('Ring Bell', 'osc2Semitone'), [2 ** (15 / 12) - 1, 2 ** (15 / 12) + 1, 3]);
    expect(difference).toBeGreaterThan(-15);
    expect(sum).toBeGreaterThan(-15);
    expect(ladder).toBeLessThan(-30);
  });

  it('Ring Bell: with Osc 1 down neither pitch sounds, only the sum and the difference', async () => {
    const s = await play(atStep('Ring Bell', 'mixOsc1'), [C4], NOTE + 0.6, NOTE + 0.65);
    const at = (ratio: number) => toneAmplitudeHann(s.subarray(...span(0.3, 0.2)), SR, hz(C4) * ratio);
    const [difference, sum] = [at(2 ** (15 / 12) - 1), at(2 ** (15 / 12) + 1)];
    expect(dB(at(1) / difference)).toBeLessThan(-30);
    expect(dB(at(2 ** (15 / 12)) / sum)).toBeLessThan(-30);
  });

  it('Deep Breath: a square Sub two down fills the odd rungs, Osc 1 every fourth; as a sine it keeps the first alone', async () => {
    // In Harmonics of the Note: the Sub's 1st and 3rd rungs, the empty 2nd, Osc 1 on the 4th.
    const [first, empty, third] = await partials(atStep('Deep Breath', 'subOctave'), [0.25, 0.5, 0.75]);
    expect(first).toBeGreaterThan(-6);
    expect(third).toBeGreaterThan(-20);
    expect(empty).toBeLessThan(-30);
    const [sineFirst, sineThird] = await partials(atStep('Deep Breath', 'subWaveform'), [0.25, 0.75]);
    expect(sineFirst).toBeGreaterThan(-6);
    expect(sineThird).toBeLessThan(-40);
  });
});
