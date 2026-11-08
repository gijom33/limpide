import { beforeAll, describe, expect, it } from 'vitest';
import { TRACK } from '../demo/track';
import { filterStages, makeUp } from '../engine/filterDesign';
import { createSynthEngine } from '../engine/synthEngine';
import { noteHz } from '../music/tempo';
import { dB, energyAboveDb, frequencyAround, toneAmplitude, toneAmplitudeHann } from '../test/measure';
import { straightenLimiter } from '../test/straightLimiter';
import { applyStep } from '../tutorial/tutorial';
import { tutorialFor } from '../tutorial/tutorials';
import { describePatch } from './describe';
import { type Patch, setLfo, setParam } from './patch';
import { PRESET_GROUPS, PRESETS } from './presets';

// The Presets rendered offline, as reviews 13 to 15 heard them (issue 108): their levels against their group, and
// what their words promise.

const SR = 48000;
const [C2, C3, C4, A4, C5, C6, C7] = [36, 48, 60, 69, 72, 84, 96];
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
const preset = (name: string) => PRESETS.find((p) => p.name === name)!.patch;
/** When the Note starts: a little after 0, as a player's would. */
const NOTE = 0.05;

/**
 * A Note (or a chord, one Note a hundredth of a second after the other) held from NOTE to `hold`, rendered to
 * `seconds`. The safety limiter's curve is made straight, so the samples are what reaches it (review 14’s method); with `bpm`, at that tempo from 0.
 */
async function play(patch: Patch, notes: number[], hold: number, seconds: number, velocity = 1, bpm?: number) {
  const ctx = new OfflineAudioContext(1, Math.round(SR * seconds), SR);
  straightenLimiter(ctx);
  const engine = createSynthEngine(ctx);
  if (bpm) engine.setTempo(bpm, 0);
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

/** The level over `length` seconds from `from` seconds after the Note, in dBFS. */
function levelDb(s: Float32Array, from: number, length: number) {
  const [a, b] = span(from, length);
  let sum = 0;
  for (let i = a; i < b; i++) sum += s[i] * s[i];
  return 10 * Math.log10(sum / (b - a));
}
/** The power of each of a Note's first 30 Harmonics over a 40 ms window from `at` seconds. */
const harmonicPowers = (s: Float32Array, note: number, at: number) => {
  const [a, b] = [Math.round(at * SR), Math.round((at + 0.04) * SR)];
  return Array.from({ length: 30 }, (_, n) => toneAmplitude(s, SR, hz(note) * (n + 1), a, b) ** 2);
};
/** The strongest Harmonic's share of a window's power: near 1, one Harmonic alone, a beep. */
const loneShare = (power: number[]) => Math.max(...power) / power.reduce((sum, p) => sum + p, 0);

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
    'Breathing Bell': { by: -5.5, why: 'four Voices, where the rest of its group has one: the master makes room for them' },
    'Hi-hat': { by: -7, why: 'gone in a tenth of a second, so its loudest 100 ms is mostly silence: its peak is the Open Hat’s (issue 258)' },
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

describe('the band-pass Presets sound as they did before its make-up (issue 231)', () => {
  // Their levels on C4 before the make-up (2026-11-05), in dBFS, as their group's are measured: their Volume is taken
  // down by as much. Talking Filter's LFO 2 moves its Resonance, and the make-up with it, so its loudest moment is
  // taken over 4 seconds, a whole cycle of it: before, its narrowest moments were quieter, which the make-up evens out.
  const BEFORE: Record<string, number> = {
    'Sync-ish Lead': -19.72, Wind: -23.59, Wah: -24.26, 'Talking Filter': -22.62, Robot: -24.7,
  };
  // Raised since, to their group's level (issue 258): the tests of their group hold them.
  const RAISED = ['Vowel', 'Cowbell'];
  const levelOnC4 = async (name: string) => (name === 'Talking Filter' ? loudestDb(await play(preset(name), [C4], 4, 4)) : (await levelsOnC4()).get(name)!);

  it('names every band-pass Preset', () => {
    expect(PRESETS.filter((p) => p.patch.filterMode === 'bandpass').map((p) => p.name).sort()).toEqual([...Object.keys(BEFORE), ...RAISED].sort());
  });

  it.each(Object.keys(BEFORE))('%s plays on C4 within 0.5 dB of its level before', async (name) => {
    const level = await levelOnC4(name);
    expect(Math.abs(level - BEFORE[name]), `${level.toFixed(2)} dBFS`).toBeLessThanOrEqual(0.5);
  }, 300_000);
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

  it('Zap Pluck starts at full FM and melts to a pure sine as it decays; the falling saw’s next zap comes 45 dB down', async () => {
    const s = await play(preset('Zap Pluck'), [A4], 1.2, 1.3);
    expect(offCarrier(s, A4, 0)).toBeGreaterThan(0.7);
    expect(offCarrier(s, A4, 0.4)).toBeLessThan(0.1);
    // At 2 Hz, the saw starts again half a second in.
    expect(offCarrier(s, A4, 0.52)).toBeGreaterThan(0.5);
    expect(levelDb(s, 0.52, 0.02) - levelDb(s, 0, 0.02)).toBeLessThan(-45);
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
  for (const name of ['Electric Piano', 'Tremolo Keys', 'Tine Piano'])
    it(`${name}: a hard strike is brighter than a soft one`, async () => {
      const [soft, hard] = await Promise.all([0.35, 1].map((velocity) => play(preset(name), [C4], 1, 1.1, velocity)));
      expect(brightnessDb(hard, C4, 0.005) - brightnessDb(soft, C4, 0.005)).toBeGreaterThan(name === 'Tine Piano' ? 6 : 3);
    });

  // A triangle under a 300 Hz Cutoff has little above it for Velocity to open: soft over hard, its brightness was 0.99
  // (review 15). Its words, and the line drawn from its settings, say so.
  it('Felt Piano: a harder Note is louder, hardly brighter (issue 258)', async () => {
    const [soft, hard] = await Promise.all([0.35, 1].map((velocity) => play(preset('Felt Piano'), [C4], 1, 1.1, velocity)));
    /** The centroid of the first 20 Harmonics 100 ms into the Note, in Hz: review 15's brightness. */
    const centroid = (s: Float32Array) => {
      const power = harmonicPowers(s, C4, NOTE + 0.1).slice(0, 20);
      return (power.reduce((sum, p, n) => sum + p * (n + 1), 0) / power.reduce((sum, p) => sum + p, 0)) * hz(C4);
    };
    expect(loudestDb(hard) - loudestDb(soft)).toBeGreaterThan(6);
    expect(centroid(soft) / centroid(hard)).toBeGreaterThan(0.95);
    expect(PRESETS.find((p) => p.name === 'Felt Piano')!.about).not.toMatch(/harder Note is brighter/);
    expect(describePatch(preset('Felt Piano'))).not.toMatch(/brighter/);
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

  it('Trill plays the Note and the whole tone above it, nothing else, there and back six times a second', async () => {
    const s = await play(preset('Trill'), [C4], 1.2, 1.3);
    // The free LFO runs from the engine's start, upper half first: a 30 ms window in the middle of each half.
    const heard = [];
    for (let t = 1 / 24; t < 1.1; t += 1 / 12) if (t > NOTE + 0.02) heard.push(12 * Math.log2(frequencyAround(s, SR, t, 0.03) / hz(C4)));
    for (const [i, semitones] of heard.entries()) expect(semitones, heard.map((h) => h.toFixed(2)).join(' ')).toBeCloseTo(i % 2 ? 2 : 0, 1);
  });

  it('Talking Filter talks: a band-pass gliding between vowels, never as narrow as a whistle (issues 166, 205)', async () => {
    const patch = preset('Talking Filter');
    const seconds = 4;
    const ctx = new OfflineAudioContext(1, SR * seconds, SR);
    straightenLimiter(ctx);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(patch);
    engine.noteOn(C4, 1, NOTE);
    const s = (await ctx.startRendering()).getChannelData(0);
    // LFO 2 glides the band from vowel to vowel: a Sine or a Triangle, not a Square's flip (the owner, issue 205).
    expect(['sine', 'triangle']).toContain(patch.lfo2Waveform);
    // At every moment the band is a vowel's formant at its narrowest, no whistle: its Q, as the engine plays it, at or
    // under 6, and its width moving across most of that (LFO 2) as LFO 1 sweeps it.
    const resonances = Array.from({ length: 300 }, (_, i) => engine.modulationAt(NOTE + i * 0.01).resonance);
    const qs = resonances.map((resonance) => filterStages(patch.filterMode, patch.filterSlope, resonance)[0].Q);
    expect(Math.max(...qs)).toBeLessThanOrEqual(6);
    expect(Math.max(...qs) / Math.min(...qs)).toBeGreaterThan(4);
    /** A 40 ms window over C4's first 30 Harmonics: its centroid, in Hz, and the strongest Harmonic's share of it. */
    const windowAt = (t: number) => {
      const power = harmonicPowers(s, C4, t);
      const total = power.reduce((sum, p) => sum + p, 0);
      return { centroid: (power.reduce((sum, p, n) => sum + p * (n + 1), 0) / total) * hz(C4), lone: loneShare(power) };
    };
    const windows = Array.from({ length: 90 }, (_, i) => windowAt(NOTE + 0.05 + i * 0.04));
    // A beep is one Harmonic nearly alone: a vowel always keeps its neighbours.
    for (const [i, { lone }] of windows.entries()) expect(lone, `window ${i}`).toBeLessThan(0.85);
    // LFO 1 sweeps the band an octave either way: its centroid moves by more than a factor of 2.5.
    const centroids = windows.map((w) => w.centroid);
    expect(Math.max(...centroids) / Math.min(...centroids)).toBeGreaterThan(2.5);
    // Still a band-pass, on both sides, at the widest the band gets (LFO 1 then has it near the top of its sweep): the
    // Note's own Harmonic and everything above 8 kHz both cut, against the open saw raised by the band's make-up there
    // (issue 231), by more than 6 dB.
    const widestAt = qs.indexOf(Math.min(...qs));
    const raised = patch.volume * makeUp(patch.filterMode, patch.filterSlope, resonances[widestAt]);
    const open = await play({ ...patch, volume: raised, filterMode: 'lowpass', cutoff: 20000, lfoAmount: 0, lfo2Amount: 0 }, [C4], seconds, seconds);
    const widest = Math.round((NOTE + widestAt * 0.01) * SR);
    const top = (samples: Float32Array) => energyAboveDb(samples, SR, 8000, widest, 4096);
    const first = (samples: Float32Array) => toneAmplitudeHann(samples.subarray(widest, widest + 4096), SR, hz(C4));
    expect(top(s)).toBeLessThan(top(open) - 6);
    expect(dB(first(s) / first(open))).toBeLessThan(-6);
    // Its level: the test of issue 226, below, holds it on C3 and C4.
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
  const levelAt = (s: Float32Array, from: number) => levelDb(s, from, 0.05);
  /** Everything above `hz` against everything below, over 2048 samples from `from` seconds after the Note. */
  const aboveDb = (s: Float32Array, hz: number, from: number) => energyAboveDb(s, SR, hz, span(from)[0], 2048);

  it('Riser: its six-second Attack takes the high-pass from 200 Hz past 5 kHz on C4, and the Envelope (Osc 2 with it) almost to the top', async () => {
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
    const index = steps.findIndex((s) => s.kind !== 'display' && s.kind !== 'params' && s.id === control);
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

// Review 14: the Demo's Tremolo Keys, its LFO synced and free, turns its 1/8 to a 1/16 at bar 6. The player sets it
// as the bar line comes into its look-ahead, 110 to 150 ms early, in the middle of a chord: the tremolo jumped to the
// 1/16's phase there and the sound fell 11 dB in 6 ms. It must change speed from where it is, as 1.19.0's Hz did.
describe('the Demo’s Tremolo Keys at bar 6 (review 14)', () => {
  const part = TRACK.parts.find((p) => p.preset === 'Tremolo Keys')!;
  const [eighth, sixteenth] = part.moves!.filter((m) => m.id === 'lfoNote');
  const ORIGIN = 0.3;
  const bar = ORIGIN + (sixteenth.start! * 60) / TRACK.bpm;
  // 130 ms before the bar line, on a quantum, an Am chord held across it.
  const AT = Math.round(((bar - 0.13) * SR) / 128) * (128 / SR);
  /** The chord from half a second before the bar line, `from` turned to `to` at AT. */
  const render = async (from: Patch, to: Patch) => {
    const ctx = new OfflineAudioContext(1, Math.round(SR * (bar + 0.6)), SR);
    straightenLimiter(ctx);
    const engine = createSynthEngine(ctx);
    engine.setTempo(TRACK.bpm, ORIGIN);
    engine.applyPatch(from);
    for (const note of [57, 60, 64]) engine.noteOn(note, 0.8, bar - 0.5);
    void ctx.suspend(AT).then(() => {
      engine.applyPatch(to);
      void ctx.resume();
    });
    return (await ctx.startRendering()).getChannelData(0);
  };
  /** The largest bend (second difference) from `from` to `to` seconds. */
  const bend = (s: Float32Array, from: number, to: number) => {
    let most = 0;
    for (let i = Math.round(from * SR) + 1; i < Math.round(to * SR) - 1; i++) most = Math.max(most, Math.abs(s[i + 1] - 2 * s[i] + s[i - 1]));
    return most;
  };

  it('turns its 1/8 to a 1/16 mid-chord no more sharply than 1.19.0’s Hz did', async () => {
    let synced = setParam(preset('Tremolo Keys'), 'lfoAmount', 0.8);
    for (const lfo of part.synced ?? []) synced = setLfo(synced, { sync: 'on' }, lfo);
    const asHz = setParam(preset('Tremolo Keys'), 'lfoAmount', 0.8);
    const [now, then] = await Promise.all([
      render(setParam(synced, 'lfoNote', eighth.to), setParam(synced, 'lfoNote', sixteenth.to)),
      render(setParam(asHz, 'lfoRate', noteHz(eighth.to, TRACK.bpm)), setParam(asHz, 'lfoRate', noteHz(sixteenth.to, TRACK.bpm))),
    ]);
    expect(bend(now, AT - 0.005, bar + 0.4)).toBeLessThan(1.5 * bend(then, AT - 0.005, bar + 0.4));
  }, 60_000); // two 12-second renders of six Voices: past the default limit when the whole suite runs at once
});

// Issue 137: the Presets whose LFO is a rhythm use Sync, each at the note value whose Hz at 120 BPM (the engine's tempo
// until one is set) is the Rate it keeps for Sync off. Each is rendered both ways, Sync on and off, and sounds the same.
describe('the Presets synced for issue 137 sound at 120 BPM as their Hz did', () => {
  /** The level in dB of each 20 ms of `s`. */
  const levels = (s: Float32Array) => {
    const size = SR / 50;
    const out: number[] = [];
    for (let from = 0; from + size <= s.length; from += size) {
      let sum = 0;
      for (let i = from; i < from + size; i++) sum += s[i] * s[i];
      out.push(10 * Math.log10(sum / size + 1e-12));
    }
    return out;
  };
  const SYNCED = PRESETS.filter((p) => p.patch.lfoSync === 'on' || p.patch.lfo2Sync === 'on').map((p) => p.name);

  it('are the wobbles and the gates', () => {
    expect(SYNCED).toEqual(['Wobble', 'Double Wobble', 'Growl', 'Trance Gate', 'Stutter']);
  });

  it.each(SYNCED)('%s: its level, each 20 ms over two seconds, and its loudest 100 ms', async (name) => {
    const synced = preset(name);
    const inHz = setLfo(setLfo(synced, { sync: 'off' }, 1), { sync: 'off' }, 2);
    const note = PRESETS.find((p) => p.name === name)!.group === 'Bass' ? 36 : C4;
    const notes = synced.voices > 1 ? [note, note + 4, note + 7] : [note];
    const [on, off] = await Promise.all([play(synced, notes, 2, 2.2), play(inHz, notes, 2, 2.2)]);
    expect(Math.abs(loudestDb(on) - loudestDb(off))).toBeLessThan(0.1);
    const [a, b] = [levels(on), levels(off)];
    // Where it sounds (above −60 dBFS), each 20 ms within a tenth of a dB.
    for (const [i, level] of a.entries()) if (level > -60) expect(Math.abs(level - b[i]), `${name} at ${i * 20} ms`).toBeLessThan(0.1);
  }, 60_000);
});

// Issue 195: at the top of its range the Filter's Resonance fades, and a high-pass falls silent, as they did when the
// Cutoff passed Nyquist; Growl's square drops its resonant Cutoff without reaching the limiter.
describe('the sound at the top edge (issue 195)', () => {
  /**
   * The same Patch with its Filter flat and wide open, Resonance 0 at 20 kHz, which passes a top Harmonic no more than
   * the Filter past Nyquist did before issue 166. (None of the three has an LFO on the Filter.)
   */
  const flatOpen = (patch: Patch): Patch => ({ ...patch, cutoff: 20000, resonance: 0, filterEnvAmount: 0, velocityCutoff: 0, keyTrack: 0 });

  it.each(['Screamer', 'Analog Drift Lead', 'Glide Slide'])('%s: its top Harmonics no louder than through a flat Filter wide open, on C7 in the attack and held, on C6 in the attack', async (name) => {
    const patch = preset(name);
    // The Harmonics from 15 kHz to 20 kHz (the 8th and 9th on C7, the 15th to 19th on C6), at moments from the Note.
    // On C6 the held Note's Cutoff falls back into the top half octave, where a Resonance rings as it always has.
    const checks = [
      { note: C7, harmonics: [8, 9], moments: [0, 0.05, 1] },
      { note: 84, harmonics: [15, 16, 17, 18, 19], moments: [0] },
    ];
    for (const { note, harmonics, moments } of checks) {
      const [s, flat] = await Promise.all([play(patch, [note], 1.2, 1.3), play(flatOpen(patch), [note], 1.2, 1.3)]);
      // Those a source plays: under −80 dB against the Note there is none.
      for (const n of harmonics)
        for (const from of moments) {
          const open = partialDb(flat, note, n, from);
          if (open > -80) expect(partialDb(s, note, n, from), `MIDI ${note}, Harmonic ${n} at ${from} s`).toBeLessThanOrEqual(open + 0.5);
        }
    }
  });

  // Riser at Key Track 1, where on C7 its Envelope takes the high-pass to the top (the Preset itself stops short).
  it('Riser at Key Track 1 on C7: silent once its high-pass reaches the top, its last four seconds held', async () => {
    const s = await play({ ...preset('Riser'), keyTrack: 1 }, [C7], 7.5, 7.6);
    let sum = 0;
    const [from, to] = [Math.round(3.5 * SR), Math.round(7.5 * SR)];
    for (let i = from; i < to; i++) sum += s[i] * s[i];
    expect(10 * Math.log10(sum / (to - from))).toBeLessThan(-60);
  });

  it('Growl stays under the limiter’s knee on every Note from A1 to C7 at 97, 120 and 128 BPM, its square dropping the resonant Cutoff', async () => {
    const notes = Array.from({ length: 64 }, (_, i) => 33 + i);
    for (const bpm of [97, 120, 128]) {
      const peaks = await Promise.all(notes.map((note) => play(preset('Growl'), [note], 1.5, 1.6, 1, bpm).then(peak)));
      const over = notes.flatMap((note, i) => (peaks[i] >= 0.8 ? [`MIDI ${note}: ${peaks[i].toFixed(2)}`] : []));
      expect(over, `${bpm} BPM, loudest ${Math.max(...peaks).toFixed(2)}`).toEqual([]);
    }
  }, 180_000);
});

// Issue 226, from the 1.23.0 ear check: Talking Filter pulsed between a near-sine and a vowel on C5, and Riser held on
// C6 fell silent before its Attack ended.
describe('two Presets high up (issue 226)', () => {
  it('Talking Filter talks on C3 and C5 as on C4: no Harmonic holds over 80 % for more than 60 ms, C3 and C4 at their 1.23.0 levels', async () => {
    const patch = preset('Talking Filter');
    // Their loudest 100 ms in 1.23.0, before the band followed the Note (the ear check of 2026-11-03).
    const before = new Map([
      [C3, -24.2],
      [C4, -21.9],
    ]);
    for (const note of [C3, C4, C5]) {
      const s = await play(patch, [note], 4, 4);
      // 40 ms windows every 20 ms, as the ear check measured: the strongest of the first 30 Harmonics' share of each.
      const shares: number[] = [];
      for (let t = NOTE + 0.05; t + 0.04 < 4; t += 0.02) shares.push(loneShare(harmonicPowers(s, note, t)));
      // The longest run of windows with one Harmonic over 80 %, in ms: k windows in a row span 40 + 20 (k − 1).
      let [run, longest] = [0, 0];
      for (const share of shares) {
        run = share > 0.8 ? run + 1 : 0;
        longest = Math.max(longest, run);
      }
      expect(longest ? 40 + 20 * (longest - 1) : 0, `MIDI ${note}, at most ${(Math.max(...shares) * 100).toFixed(0)} %`).toBeLessThanOrEqual(60);
      const was = before.get(note);
      if (was !== undefined) expect(Math.abs(loudestDb(s) - was), `MIDI ${note}: ${loudestDb(s).toFixed(2)} dBFS`).toBeLessThanOrEqual(1);
    }
  }, 60_000);

  it('Riser held through its Attack never falls silent before its release on C6 or C7, and its C2 and C4 sound as in 1.23.0', async () => {
    const patch = preset('Riser');
    const release = NOTE + patch.filterAttack + 1;
    const [c2, c4, c6, c7] = await Promise.all([C2, C4, C6, C7].map((note) => play(patch, [note], release, release + 0.05)));
    for (const [name, s] of [['C6', c6], ['C7', c7]] as const)
      for (let from = 0.5; NOTE + from + 0.05 <= release; from += 0.05) expect(levelDb(s, from, 0.05), `${name}, ${from.toFixed(2)} s after the Note`).toBeGreaterThan(-40);
    // Their loudest 100 ms in 1.23.0 (the ear check of 2026-11-03): C4 is Key Track's centre, so it is unchanged.
    expect(Math.abs(loudestDb(c2) + 22.0), `C2: ${loudestDb(c2).toFixed(2)} dBFS`).toBeLessThanOrEqual(1);
    // Within half a dB, nothing heard: Chromium on GitHub's Linux renders it at −21.33, the Mac's at −21.5 (2026-11-04).
    expect(Math.abs(loudestDb(c4) + 21.5), `C4: ${loudestDb(c4).toFixed(2)} dBFS`).toBeLessThanOrEqual(0.5);
    for (const s of [c2, c4, c6, c7]) expect(peak(s)).toBeLessThan(0.8);
  }, 60_000);
});

// Issue 258, from reviews 14 and 15: Presets whose level swung across the keyboard, the one that passed the limiter, and
// the Drums 9 dB under the Basses.
describe('the Presets levelled across the keyboard (issue 258)', () => {
  // A fixed Cutoff the Notes climb into or away from: each swung 6.5 to 18 dB from C2 to C6, where the other Presets
  // keep within 6 dB. Key Track now moves each one's Filter with the Note.
  const LEVELLED = [
    'Vowel', 'Breathing Pad', 'Two Speeds', 'Sweep Pad', 'High-pass Buzz', '12 vs 24', 'Resonant Ring', 'Cowbell', 'Dark Drone', 'Talking Filter', 'Wah',
    'Deep Sweep', 'Laser', 'Clav',
  ];
  it.each(LEVELLED)('%s keeps within 6 dB from C2 to C6, octave by octave', async (name) => {
    const levels = await Promise.all([C2, C3, C4, C5, C6].map((note) => levelOf(preset(name), note)));
    expect(Math.max(...levels) - Math.min(...levels), levels.map((l) => l.toFixed(1)).join(' ')).toBeLessThanOrEqual(6);
  });

  // Their fixed Cutoff left little of a C7: 28 to 33 dB under their C6.
  it.each(['Sweep Pad', 'Breathing Pad', 'Dark Drone'])('%s plays its C7 within 6 dB of its C4', async (name) => {
    const [c4, c7] = await Promise.all([C4, C7].map((note) => levelOf(preset(name), note)));
    expect(c7 - c4, `C4 ${c4.toFixed(1)}, C7 ${c7.toFixed(1)} dBFS`).toBeGreaterThan(-6);
  });

  // What four Notes miss: Resonance Swell's peak met a Harmonic on D5, D6 and D#6 (1.48), and Resonant Ring's
  // fundamental met its Cutoff around E6 (review 14's scan).
  it.each(['Resonance Swell', 'Resonant Ring'])('%s: every semitone from C2 to C7 held 4 s, under the limiter’s knee, each within 1.5 dB of the next', async (name) => {
    const notes = Array.from({ length: 61 }, (_, i) => C2 + i);
    const renders: Float32Array[] = [];
    // Eight at a time: 61 renders at once are more than the browser holds.
    for (let i = 0; i < notes.length; i += 8) renders.push(...(await Promise.all(notes.slice(i, i + 8).map((note) => play(preset(name), [note], NOTE + 4, NOTE + 4.05)))));
    const over = notes.flatMap((note, i) => (peak(renders[i]) >= 0.8 ? [`MIDI ${note}: ${peak(renders[i]).toFixed(2)}`] : []));
    expect(over).toEqual([]);
    const levels = renders.map(loudestDb);
    const jumps = notes.slice(1).flatMap((note, i) => (Math.abs(levels[i + 1] - levels[i]) > 1.5 ? [`MIDI ${note}: ${(levels[i + 1] - levels[i]).toFixed(1)} dB`] : []));
    expect(jumps).toEqual([]);
  }, 120_000);

  // Every drum has one Voice and a Bass's room at the master: the kit sat 9 dB under the Basses, the Kick at full Volume
  // 11.7 dB under 808 Boom (review 15). Each on its home Note: the Basses' C2, the Drums' C4.
  it('the Drums’ median within 4 dB of the Basses’, and the Kick within 3 dB of 808 Boom', async () => {
    const drums = familyMedian(await levelsOnC4(), 'Drums');
    const basses = await Promise.all(PRESETS.filter((p) => p.group === 'Bass').map((p) => levelOf(p.patch, C2)));
    expect(Math.abs(median(basses) - drums), `Drums ${drums.toFixed(1)}, Basses ${median(basses).toFixed(1)} dBFS`).toBeLessThanOrEqual(4);
    const [kick, boom] = await Promise.all([levelOf(preset('Kick'), C2), levelOf(preset('808 Boom'), C2)]);
    expect(Math.abs(boom - kick), `Kick ${kick.toFixed(1)}, 808 Boom ${boom.toFixed(1)} dBFS`).toBeLessThanOrEqual(3);
  }, 300_000);

  // Kept apart from its kit (APART above): as loud at its strike, only shorter.
  it('Hi-hat strikes within 2 dB of the Open Hat’s peak', async () => {
    const [closed, open] = await Promise.all(['Hi-hat', 'Open Hat'].map((name) => play(preset(name), [C4], 1, 1.1)));
    expect(Math.abs(dB(peak(closed) / peak(open)))).toBeLessThanOrEqual(2);
  });

  // Where each changed Preset now sits on C4, in dBFS (2026-11-07): the group tests allow 3 dB around a median that
  // moves with them, this 1 dB. Those given only Key Track are unchanged on C4, its centre.
  const NOW: Record<string, number> = {
    Vowel: -19.5, 'Breathing Pad': -23.5, Kick: -17.6, Snare: -22.3, 'Open Hat': -20.4, Ride: -21.0, Tom: -17.6, Cowbell: -19.8, Clang: -20.2,
    'Zap Tom': -19.8, Gong: -19.1,
  };
  it.each(Object.keys(NOW))('%s plays on C4 within 1 dB of where issue 258 left it', async (name) => {
    const level = (await levelsOnC4()).get(name)!;
    expect(Math.abs(level - NOW[name]), `${level.toFixed(2)} dBFS`).toBeLessThanOrEqual(1);
  }, 300_000);
});

// Issue 266: the words review 13 measured, held to what the engine plays.
describe('the Presets’ words review 13 checked hold (issue 266)', () => {
  /** The engine after a Note `note` from NOTE on `patch`, rendered for `seconds`, to read its Modulation model. */
  const modelled = async (patch: Patch, seconds: number, note = C4) => {
    const ctx = new OfflineAudioContext(1, SR * seconds, SR);
    const engine = createSynthEngine(ctx);
    engine.applyPatch(patch);
    engine.noteOn(note, 1, NOTE);
    await ctx.startRendering();
    return engine;
  };
  /** The Model's `key` every tenth of a second over `seconds` from the Note. */
  const across = async (patch: Patch, key: 'cutoff' | 'resonance', seconds: number) => {
    const engine = await modelled(patch, seconds + 0.2);
    return Array.from({ length: seconds * 10 }, (_, i) => engine.modulationAt(NOTE + i / 10)[key]);
  };
  /** The times of the level's dips, each more than 20 dB under its top, over 10 ms windows from `from` seconds. */
  const dips = (s: Float32Array, from: number) => {
    const size = SR / 100;
    const levels: number[] = [];
    for (let a = Math.round(from * SR); a + size <= s.length; a += size) levels.push(levelDb(s, a / SR - NOTE, 0.01));
    const top = Math.max(...levels);
    const times: number[] = [];
    let run: number[] = [];
    for (const [i, level] of [...levels, top].entries()) {
      if (level < top - 20) run.push(i);
      else if (run.length) {
        const lowest = run.reduce((a, b) => (levels[b] < levels[a] ? b : a));
        times.push(from + lowest / 100);
        run = [];
      }
    }
    return times;
  };
  const meanGap = (times: number[]) => (times[times.length - 1] - times[0]) / (times.length - 1);

  it('Slow Beats swells and fades about once every second or two in the middle of the keyboard, faster higher up', async () => {
    const [c4, a4, c5] = await Promise.all([C4, A4, C5].map((note) => play(preset('Slow Beats'), [note], 5.5, 5.6)));
    const [onC4, onA4, onC5] = [c4, a4, c5].map((s) => meanGap(dips(s, 0.2)));
    expect(onC4, `${onC4.toFixed(2)} s`).toBeGreaterThan(1.4);
    expect(onC4, `${onC4.toFixed(2)} s`).toBeLessThan(2);
    expect(onA4, `${onA4.toFixed(2)} s`).toBeGreaterThan(0.85);
    expect(onC5).toBeLessThan(onA4);
  });

  it('Rolling Fifth: Osc 2 rolls about two semitones either side of its fifth, from a fourth to nearly a major sixth', async () => {
    const s = await play({ ...preset('Rolling Fifth'), mixOsc1: 0 }, [C4], 10.6, 10.7);
    const heard = Array.from({ length: 41 }, (_, i) => 12 * Math.log2(frequencyAround(s, SR, NOTE + 0.3 + i / 4, 0.05) / hz(C4)));
    expect(Math.max(...heard)).toBeGreaterThan(8.5);
    expect(Math.max(...heard)).toBeLessThan(9);
    expect(Math.min(...heard)).toBeGreaterThan(5);
    expect(Math.min(...heard)).toBeLessThan(5.5);
  });

  it('Square on Square: every Harmonic of the lower one present but every fourth, which neither square has', async () => {
    const s = await play(preset('Square on Square'), [C4], 1, 1.1);
    // Counted from the Sub, an octave down.
    const rung = (n: number) => partialDb(s, C4, n / 2, 0.5, 0.2);
    for (const n of [1, 2, 3, 5, 6, 7, 9, 10, 11]) expect(rung(n), `rung ${n}`).toBeGreaterThan(-30);
    for (const n of [4, 8, 12]) expect(rung(n), `rung ${n}`).toBeLessThan(-60);
  });

  it('Init: a low-pass Filter at 2 kHz, taking a saw’s high Harmonics down', async () => {
    expect((await across(preset('Init'), 'cutoff', 1)).every((cutoff) => Math.abs(cutoff - 2000) < 1)).toBe(true);
    const [init, open] = await Promise.all([preset('Init'), { ...preset('Init'), cutoff: 20000 }].map((p) => play(p, [C4], 1, 1.1)));
    expect(partialDb(init, C4, 16, 0.5, 0.2) - partialDb(open, C4, 16, 0.5, 0.2)).toBeLessThan(-6);
  });

  it('Deep Sweep: the Cutoff sweeps four octaves, from 200 Hz to 3.2 kHz on C4', async () => {
    const cutoffs = await across(preset('Deep Sweep'), 'cutoff', 5.2);
    expect(Math.min(...cutoffs) / 200).toBeCloseTo(1, 1);
    expect(Math.max(...cutoffs) / 3200).toBeCloseTo(1, 1);
  });

  /**
   * How long Perfect Fifth's two-cycle pattern takes to roll round and come back: the shape of two of Osc 1's cycles
   * from `from` seconds against the same span each two cycles later, the first best match once it has dissolved.
   */
  const rollSeconds = (s: Float32Array, note: number, from: number) => {
    const twoCycles = (2 * SR) / hz(note); // in samples
    const n = Math.round(twoCycles);
    const sampleAt = (x: number) => s[Math.floor(x)] + (s[Math.floor(x) + 1] - s[Math.floor(x)]) * (x - Math.floor(x));
    const shape = (k: number) => Array.from({ length: n }, (_, j) => sampleAt(from * SR + k * twoCycles + (j * twoCycles) / n));
    const first = shape(0);
    const norm = (w: number[]) => Math.sqrt(w.reduce((sum, v) => sum + v * v, 0));
    const likeness = (k: number) => {
      const w = shape(k);
      return w.reduce((sum, v, j) => sum + v * first[j], 0) / norm(w) / norm(first);
    };
    let k = 1;
    while (likeness(k) > 0.5) k++;
    while (likeness(k) < 0.95) k++;
    while (likeness(k + 1) > likeness(k)) k++;
    return (k * twoCycles) / SR;
  };
  it('Perfect Fifth rolls about every two seconds on C4, faster higher up', async () => {
    const [c4, c5] = await Promise.all([C4, C5].map((note) => play(preset('Perfect Fifth'), [note], 3.6, 3.7)));
    const [onC4, onC5] = [rollSeconds(c4, C4, NOTE + 0.2), rollSeconds(c5, C5, NOTE + 0.2)];
    expect(onC4, `${onC4.toFixed(2)} s`).toBeGreaterThan(1.5);
    expect(onC4, `${onC4.toFixed(2)} s`).toBeLessThan(2.5);
    expect(onC5, `${onC5.toFixed(2)} s`).toBeLessThan(onC4 / 1.5);
  });

  it('Self-Oscillation: the Harmonic nearest the Cutoff rings out about 8 dB over the rest, nothing at the Cutoff between them', async () => {
    const s = await play(preset('Self-Oscillation'), [C4], 1.5, 1.6);
    // On C4 Key Track leaves the Cutoff at its knob's 900 Hz, nearest the 3rd Harmonic (785 Hz).
    const level = (ratio: number) => partialDb(s, C4, ratio, 0.5, 0.2);
    const rest = Math.max(0, level(2), level(4), level(5));
    expect(level(3) - rest).toBeGreaterThan(7);
    expect(level(900 / hz(C4))).toBeLessThan(-40);
  });

  it('Clang Alarm hops between a pure sine and a full metal clang and back two and a half times a second', async () => {
    const s = await play(preset('Clang Alarm'), [C4], 1.3, 1.4);
    /** The share of 20 ms of power off the Note's own frequency, centred on `t` seconds. */
    const offShare = (t: number) => {
      const [a, b] = [Math.round((t - 0.01) * SR), Math.round((t + 0.01) * SR)];
      let sum = 0;
      for (let i = a; i < b; i++) sum += s[i] * s[i];
      return 1 - toneAmplitude(s, SR, hz(C4), a, b) ** 2 / 2 / (sum / (b - a));
    };
    // The free LFO runs from the engine's start, its upper half (full FM) first: the middle of each fifth of a second.
    const heard = Array.from({ length: 6 }, (_, i) => offShare(0.1 + i / 5));
    const said = heard.map((h) => h.toFixed(2)).join(' ');
    for (const [i, share] of heard.entries()) {
      if (i % 2) expect(share, said).toBeLessThan(0.1);
      else expect(share, said).toBeGreaterThan(0.5);
    }
  });

  it('Rave Stab: a triad a stab of its Notes, their fifths and the Sub under them', async () => {
    const patch = preset('Rave Stab');
    const s = await play(patch, [C4, 64, 67], 1, 1.1);
    /** The partial `semitones` from C4, against C4. */
    const levelAt = (semitones: number) => partialDb(s, C4, 2 ** (semitones / 12), 0.03, 0.12);
    const fifth = patch.osc2Semitone + patch.osc2Detune / 100;
    for (const note of [0, 4, 7]) {
      expect(levelAt(note), `the Note ${note}`).toBeGreaterThan(-20);
      expect(levelAt(note + fifth), `its fifth ${note + 7}`).toBeGreaterThan(-20);
      expect(levelAt(note - 12), `the Sub ${note - 12}`).toBeGreaterThan(-20);
    }
  });

  it('the LFO Destination tip’s Resonance: as far each way as its knob leaves room, Breathing Pad’s 30 % from 0 to 60 %', async () => {
    const resonances = await across(preset('Breathing Pad'), 'resonance', 6);
    expect(Math.min(...resonances)).toBeCloseTo(0, 1);
    expect(Math.max(...resonances)).toBeCloseTo(0.6, 1);
  });
});
