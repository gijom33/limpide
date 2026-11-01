import { describe, expect, it } from 'vitest';
import { osc2Cents } from '../modulation/modulationModel';
import type { Waveform } from '../music/harmonics';
import { defaultPatch, type Patch } from '../patch/patch';
import type { PatchChange } from '../patch/patchStore';
import { PRESETS } from '../patch/presets';
import { shareHash } from '../patch/serialize';
import { type EdgeCase, edgeCases } from '../test/edgePatches';
import { energyAboveDb } from '../test/measure';
import { memoryStorage } from '../test/memoryStorage';
import { straightenLimiter } from '../test/straightLimiter';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';
import { createTimeline } from '../viewers/timeline';
import { createViewerStore } from '../viewers/viewerStore';
import { filterStages } from './filterDesign';
import { createSynthEngine, type SynthEngine } from './synthEngine';

// Patches at the edges (issue 116): each of the sweep's Patches (`edgeCases`) rendered offline on a low, a middle and
// a high Note (a chord on all its Voices in the middle), failing on an error value, silence where a source is up and
// the Filter lets it through, the safety limiter working through most of the Note, or an offset over a third of the
// sound's own level; and a smaller set drawn by every Viewer, failing on a slow frame. A failure names the Patch as a
// Share link's #p= part, with the Notes and the Tempo.

const SEED = 116;
const SR = 48000;
/** When the Note starts, a little after the Patch, as a player's would; the Note is held to the end. */
const NOTE = 0.05;
const END = 0.75;
/** The part of the Note judged for silence and offset: past a mid-length Attack, and most of the offset filter's settling. */
const JUDGED = [0.25, END] as const;
const NOTES = { low: 36, middle: 60, high: 96 } as const;
/** The middle chord on a Patch of several Voices: thirds stacked from C4. */
const CHORD = [60, 64, 67, 71, 74, 77, 81, 84];
/** Where the safety limiter starts to bend the sound (the engine's SAFETY_KNEE). */
const LIMITER_KNEE = 0.8;
/** Under this RMS a 50 ms window is silent: −120 dBFS. */
const SILENT = 1e-6;
/** The largest offset allowed, against the sound's own level: a third of it (−10 dB). */
const OFFSET_DB = -10;
/** How many renders run at once: each OfflineAudioContext renders on its own thread. */
const AT_ONCE = 10;
const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

/** A render of `notes` on a case's Patch at its Tempo, the limiter straight; `dcBlock: false` takes 103's filter out. */
async function play({ patch, bpm }: EdgeCase, notes: readonly number[], { dcBlock = true, seconds = END } = {}) {
  const ctx = new OfflineAudioContext(1, Math.round(SR * seconds), SR);
  straightenLimiter(ctx);
  const biquads: BiquadFilterNode[] = [];
  if (!dcBlock) {
    const create = ctx.createBiquadFilter.bind(ctx);
    ctx.createBiquadFilter = () => {
      const node = create();
      biquads.push(node);
      return node;
    };
  }
  const engine = createSynthEngine(ctx);
  // Each Voice's offset filter is its high-pass at 1 Hz: made an all-pass, it lets the offset through, as 1.16.0 did.
  for (const node of biquads) if (node.type === 'highpass' && node.frequency.value === 1) node.type = 'allpass';
  engine.setTempo(bpm, 0);
  engine.applyPatch(patch);
  for (const note of notes) engine.noteOn(note, 1, NOTE);
  return { samples: (await ctx.startRendering()).getChannelData(0), engine };
}

// A twin of the Filter, never connected, to read its gain at a moment's Effective Cutoff and Resonance.
const twinContext = new OfflineAudioContext(1, 128, SR);
const twins = [twinContext.createBiquadFilter(), twinContext.createBiquadFilter()];
function filterGains(patch: Patch, cutoff: number, resonance: number, frequencies: readonly number[]) {
  const at = Float32Array.from(frequencies);
  const total = new Float32Array(at.length).fill(1);
  const [gain, phase] = [new Float32Array(at.length), new Float32Array(at.length)];
  filterStages(patch.filterMode, patch.filterSlope, resonance).forEach((stage, i) => {
    twins[i].type = stage.type;
    twins[i].frequency.value = cutoff;
    twins[i].Q.value = stage.Q;
    twins[i].gain.value = stage.gain;
    twins[i].getFrequencyResponse(at, gain, phase);
    for (let k = 0; k < at.length; k++) total[k] *= gain[k];
  });
  return total;
}

/** A source's first eight Harmonics (odd only for the square and the triangle), or a sine's one. */
const harmonicsOf = (f: number, waveform: Waveform) =>
  waveform === 'sine' ? [f] : Array.from({ length: 8 }, (_, n) => (waveform === 'square' || waveform === 'triangle' ? 2 * n + 1 : n + 1) * f);
const NOISE_BAND = Array.from({ length: 31 }, (_, i) => 20 * 1000 ** (i / 30));
const AUDIBLE = (f: number) => f >= 20 && f <= 20000;

/**
 * The Effective Cutoff at an end of its range, 20 Hz or 20 kHz, where the model holds it and the sound's Filter goes
 * on past it (to the top of what the browser plays, or towards 0 Hz): a finding of issue 116, open to the owner. What
 * changes is out of hearing, but a high-pass or band-pass past the top plays nothing, and a low-pass or band-pass
 * past the bottom nothing heard, so silence is not judged there; nor an offset where it closes, or at the bottom,
 * where what it lets through under 20 Hz is not the model's.
 */
const closedAtAnEnd = (patch: Patch, cutoff: number) =>
  (cutoff >= 19999 && (patch.filterMode === 'highpass' || patch.filterMode === 'bandpass')) ||
  (cutoff <= 20.001 && (patch.filterMode === 'lowpass' || patch.filterMode === 'bandpass'));

/**
 * What the Filter lets through at `t`, by the Modulation model, of what the sources that are up play: each pitched
 * source's fundamental and first Harmonics, Ring's sum and difference, Noise's whole band, those a person hears.
 * `heard` is the most it lets through of any of them; `plain`, of a pitched source's fundamental (Noise's 1 kHz).
 * `subAudio`: whether something plays under 20 Hz, other than an offset: a source that low, Pink Noise (as much in
 * each octave down to the offset filter's), or where Ring or FM meets Osc 1 and Osc 2, a Harmonic of one that close to
 * a Harmonic of the other (their difference tone).
 */
function passed(engine: SynthEngine, patch: Patch, t: number, notes: readonly number[]) {
  const m = engine.modulationAt(t);
  // The newest Note is the chord's top: the lowest is as far under it.
  const f0 = hz(m.pitch + Math.min(...notes) - notes[notes.length - 1]);
  const f1 = f0 * 2 ** patch.osc1Octave;
  const f2 = f0 * 2 ** (osc2Cents(patch, m.lfo, m.filter) / 1200);
  const sub = f1 * 2 ** patch.subOctave;
  const fundamentals = [
    ...(patch.mixOsc1 > 0 ? [f1] : []), ...(patch.mixOsc2 > 0 ? [f2] : []), ...(patch.mixSub > 0 ? [sub] : []), ...(patch.mixRing > 0 ? [f1 + f2] : []),
    ...(patch.mixNoise > 0 ? [1000] : []),
  ].filter(AUDIBLE);
  const all = [
    ...(patch.mixOsc1 > 0 ? harmonicsOf(f1, patch.waveform) : []),
    ...(patch.mixOsc2 > 0 ? harmonicsOf(f2, patch.osc2Waveform) : []),
    ...(patch.mixSub > 0 ? harmonicsOf(sub, patch.subWaveform) : []),
    ...(patch.mixRing > 0 ? [f1 + f2, Math.abs(f1 - f2)] : []),
    ...(patch.mixNoise > 0 ? NOISE_BAND : []),
  ].filter(AUDIBLE);
  const meet = patch.mixRing > 0 || patch.crossMod > 0;
  const difference = (n: number, k: number) => Math.abs(n * f1 - k * f2);
  const close = (d: number) => d > 0.01 && d < 20;
  const subAudio =
    [...(patch.mixOsc1 > 0 || meet ? [f1] : []), ...(patch.mixOsc2 > 0 || meet ? [f2] : []), ...(patch.mixSub > 0 ? [sub] : [])].some((f) => f < 20) ||
    (patch.mixNoise > 0 && patch.noiseColour === 'pink') ||
    (meet && Array.from({ length: 256 }, (_, i) => difference((i % 16) + 1, Math.floor(i / 16) + 1)).some(close));
  const most = (frequencies: number[]) => (frequencies.length ? Math.max(...filterGains(patch, m.cutoff, m.resonance, frequencies)) : 0);
  return { open: m.amp * m.volume, cutoff: m.cutoff, heard: most(all), plain: most(fundamentals), subAudio };
}

const span = (from: number, to: number) => [Math.round(from * SR), Math.round(to * SR)] as const;
function rmsOf(s: Float32Array, from: number, to: number, mean = 0) {
  let sum = 0;
  for (let i = from; i < to; i++) sum += (s[i] - mean) ** 2;
  return Math.sqrt(sum / (to - from));
}
/**
 * The offset: the mean under a Blackman–Harris window, which leaves out everything 8 Hz and more from 0 Hz by 90 dB, so
 * a low Note's cycles or a slow wobble do not count as one.
 */
function offsetOf(s: Float32Array, from: number, to: number) {
  let [sum, weights] = [0, 0];
  for (let i = from; i < to; i++) {
    const x = (2 * Math.PI * (i - from)) / (to - from - 1);
    const w = 0.35875 - 0.48829 * Math.cos(x) + 0.14128 * Math.cos(2 * x) - 0.01168 * Math.cos(3 * x);
    sum += s[i] * w;
    weights += w;
  }
  return sum / weights;
}

/** What the sweep measures of one render. */
function measure(samples: Float32Array, engine: SynthEngine, patch: Patch, notes: readonly number[]) {
  const errorAt = samples.findIndex((v) => !Number.isFinite(v));
  // The share of the Note's 10 ms frames in which a sample passes the limiter's knee.
  let [frames, limited] = [0, 0];
  for (let from = NOTE; from + 0.01 <= END + 1e-9; from += 0.01) {
    const [a, b] = span(from, from + 0.01);
    frames++;
    for (let i = a; i < b; i++)
      if (Math.abs(samples[i]) > LIMITER_KNEE) {
        limited++;
        break;
      }
  }
  // Each 50 ms window judged: whether it should sound, whether it does.
  const silent: number[] = [];
  let [windows, plain] = [0, true];
  for (let from = JUDGED[0]; from + 0.05 <= JUDGED[1] + 1e-9; from += 0.05) {
    windows++;
    const p = passed(engine, patch, from + 0.025, notes);
    const shouldSound = p.open >= 0.01 && !closedAtAnEnd(patch, p.cutoff) && p.heard >= 0.1;
    if (shouldSound && rmsOf(samples, ...span(from, from + 0.05)) < SILENT) silent.push(from);
    // The offset is judged only where the Note plainly sounds, and nothing under 20 Hz but an offset could make one.
    plain &&= p.open >= 0.01 && p.plain >= 0.5 && !p.subAudio && !closedAtAnEnd(patch, p.cutoff) && p.cutoff > 20.001;
  }
  const [a, b] = span(...JUDGED);
  const offset = offsetOf(samples, a, b);
  const level = rmsOf(samples, a, b, offset);
  return { errorAt, limited: limited / frames, silent, windows, offsetDb: 20 * Math.log10(Math.abs(offset) / level), offsetJudged: plain };
}

/** What a render does wrong, in words, and which of the faults it is: none when it does nothing wrong. */
function faultsOf(r: ReturnType<typeof measure>) {
  return [
    ...(r.errorAt >= 0 ? [{ kind: 'error', words: `an error value at ${(r.errorAt / SR).toFixed(3)} s` }] : []),
    ...(r.silent.length ? [{ kind: 'silence', words: `silent from ${r.silent[0].toFixed(2)} s (${r.silent.length} of ${r.windows} windows of 50 ms)` }] : []),
    ...(r.limited > 0.5 ? [{ kind: 'limiter', words: `the limiter working in ${Math.round(r.limited * 100)} % of the Note` }] : []),
    ...(r.offsetJudged && r.offsetDb > OFFSET_DB ? [{ kind: 'offset', words: `an offset ${r.offsetDb.toFixed(1)} dB against its level` }] : []),
  ];
}

/** The sum of the Mixer's levels: past 1, more than one source at full. */
const mixed = (p: Patch) => p.mixOsc1 + p.mixOsc2 + p.mixRing + p.mixNoise + p.mixSub;

/**
 * Faults the sweep finds that are answered, each with the reason: what a Patch does by design, or a finding written in
 * issue 116 for the owner to hear before it is changed.
 */
const ANSWERED: { reason: string; covers(kind: string, patch: Patch): boolean }[] = [
  {
    reason: 'the limiter is there for sources stacked past one at full (ADR-0006, the LIMITING spec plays every source at full)',
    covers: (kind, p) => kind === 'limiter' && mixed(p) > 1,
  },
  {
    reason: 'finding (issue 116, for the owner): an LFO on a band-pass’s or notch’s Resonance swings its Q below zero, where a notch is silent',
    covers: (kind, p) =>
      (kind === 'silence' || kind === 'offset' || kind === 'limiter') &&
      (p.filterMode === 'notch' || p.filterMode === 'bandpass') &&
      [p.lfoAmount > 0 && p.lfoDestination === 'resonance', p.lfo2Amount > 0 && p.lfo2Destination === 'resonance'].some(Boolean),
  },
];

const notesFor = (patch: Patch) => [[NOTES.low], patch.voices > 1 ? CHORD.slice(0, patch.voices) : [NOTES.middle], [NOTES.high]];
const named = ({ patch, bpm, name }: EdgeCase, notes: readonly number[]) => `${name}, MIDI ${notes.join(' ')} at ${bpm} BPM: #${shareHash(patch)}`;
const preset = (name: string): EdgeCase => ({ name, patch: PRESETS.find((p) => p.name === name)!.patch, bpm: 120 });

/** Runs `work` on each item, `AT_ONCE` at a time. */
async function eachAtOnce<T>(items: readonly T[], work: (item: T) => Promise<void>) {
  const queue = [...items];
  const run = async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) await work(item);
  };
  await Promise.all(Array.from({ length: AT_ONCE }, run));
}

describe('Patches at the edges (issue 116)', () => {
  it('gives no error value, no silence where a source is heard through the Filter, no limiter stuck on, no offset', async () => {
    const jobs = edgeCases(SEED).flatMap((c) => notesFor(c.patch).map((notes) => ({ c, notes })));
    const faults: string[] = [];
    const answered = new Map<string, number>();
    await eachAtOnce(jobs, async ({ c, notes }) => {
      const { samples, engine } = await play(c, notes);
      for (const fault of faultsOf(measure(samples, engine, c.patch, notes))) {
        const answer = ANSWERED.find((a) => a.covers(fault.kind, c.patch));
        if (answer) answered.set(answer.reason, (answered.get(answer.reason) ?? 0) + 1);
        else faults.push(`${fault.words}: ${named(c, notes)}`);
      }
    });
    console.info(`Answered: ${[...answered].map(([reason, n]) => `${n} × ${reason}`).join('; ') || 'none'}`);
    expect(faults.slice(0, 20), `${faults.length} renders of ${jobs.length} at fault (seed ${SEED})`).toEqual([]);
  }, 600_000);

  it('finds 1.16.0’s FM offset: FM Ladder on C2, C4 and C6 with issue 103’s filter taken out, and none with it (control)', async () => {
    for (const note of [36, 60, 84]) {
      const [kept, taken] = await Promise.all([true, false].map((dcBlock) => play(preset('FM Ladder'), [note], { dcBlock })));
      const kinds = (r: typeof kept) => faultsOf(measure(r.samples, r.engine, preset('FM Ladder').patch, [note])).map((f) => f.kind);
      expect(kinds(taken), `MIDI ${note}`).toEqual(['offset']);
      expect(kinds(kept), `MIDI ${note}`).toEqual([]);
    }
  });

  it('finds a limiter stuck on, and answers it where every source is at full into full Resonance (control, the LIMITING spec’s Patch)', async () => {
    const patch = { ...defaultPatch(), mixOsc2: 1, mixNoise: 1, mixSub: 1, osc2Octave: 1, resonance: 1, cutoff: 300, filterSlope: 24 as const, ampSustain: 1 };
    const { samples, engine } = await play({ name: 'LIMITING', patch, bpm: 120 }, [57]);
    const [fault] = faultsOf(measure(samples, engine, patch, [57]));
    expect(fault.kind).toBe('limiter');
    expect(ANSWERED.find((a) => a.covers(fault.kind, patch))?.reason).toMatch(/stacked/);
  });

  it('finds a Note silent where the model has it sound: a notch whose Q an LFO on its Resonance takes below zero (control, the finding)', async () => {
    const patch = { ...defaultPatch(), filterMode: 'notch' as const, resonance: 0.5, lfoDestination: 'resonance' as const, lfoAmount: 1, lfoWaveform: 'square' as const, lfoRate: 1 };
    const { samples, engine } = await play({ name: 'notch', patch, bpm: 120 }, [60]);
    const kinds = faultsOf(measure(samples, engine, patch, [60])).map((f) => f.kind);
    expect(kinds).toContain('silence');
    expect(ANSWERED.find((a) => a.covers('silence', patch))?.reason).toMatch(/finding/);
  });

  // The finding (issue 116, for the owner): the model moves the Resonance, the sound moves the Q by half the swing's
  // span either side of the knob's own, and a band-pass's or notch's Q grows by ratios, so near the top of the
  // Resonance its swing passes below zero: there a notch passes nothing and a band-pass everything. Talking Filter,
  // LFO 2's square on its band-pass's Resonance, plays its low half unfiltered. Marked to fail until the owner has
  // heard it changed.
  it.fails('keeps a band-pass a band-pass with an LFO on its Resonance: Talking Filter at its LFO’s foot as at the same Resonance held (finding)', async () => {
    const talking = preset('Talking Filter');
    const still = { ...talking.patch, lfoAmount: 0 };
    const [swung, held] = await Promise.all([
      play({ ...talking, patch: { ...still } }, [60], { seconds: 2 }),
      play({ ...talking, patch: { ...still, lfo2Amount: 0, resonance: 0.2 } }, [60], { seconds: 2 }),
    ]);
    // LFO 2's square at 0.7 Hz: its foot, where the model has the Resonance at 0.2, is its second half-cycle.
    const foot = Math.round(1.2 * SR);
    expect(swung.engine.modulationAt(1.25).resonance).toBeCloseTo(0.2, 2);
    const top = (r: typeof swung) => energyAboveDb(r.samples, SR, 4000, foot, 4096);
    expect(top(swung)).toBeLessThan(top(held) + 6);
  });
});

describe('every Viewer draws a Patch at the edges in a frame (issue 116)', () => {
  /**
   * The Viewers of the page, as App wires them, drawing what the engine has just played, warmed up on Init; the frame
   * timed is the first after the Patch takes Init's place, as a turn of a knob, or the Demo, brings one.
   */
  function viewersOf(engine: SynthEngine, patch: Patch) {
    const canvas = (width: number, height: number) => {
      const c = document.createElement('canvas');
      Object.assign(c.style, { width: `${width}px`, height: `${height}px`, display: 'block' });
      document.body.append(c);
      return c;
    };
    const listeners: ((change: PatchChange) => void)[] = [];
    const patches = {
      get: () => ({ patch: defaultPatch(), name: '', changed: false }),
      subscribe: (listener: (change: PatchChange) => void) => {
        listeners.push(listener);
        return () => undefined;
      },
    };
    const store = createViewerStore({ storage: memoryStorage(), patches, setTapSource: engine.setTapSource });
    // Every mark shown: the Guides too, which a first visit leaves off.
    store.dispatch({ type: 'showOverlay', overlay: 'guides' });
    const view = store.get;
    const gateOn = () => engine.modulationAt().sounding !== null;
    const draws = [
      createScope(canvas(360, 140), engine.taps.oscillator, engine.fundamental, view),
      createSpectrum(canvas(360, 140), engine.taps.oscillator, SR, { fundamental: engine.fundamental, view, showIdeal: true, gateOn }),
      createScope(canvas(360, 140), engine.taps.filter, engine.fundamental, view),
      createSpectrum(canvas(360, 140), engine.taps.filter, SR, { fundamental: engine.fundamental, view, showIdeal: true, gateOn, response: engine.filterResponse }),
      createScope(canvas(360, 140), engine.taps.amp, engine.fundamental, view, { limiting: engine.limiting }),
      createSpectrum(canvas(360, 140), engine.taps.amp, SR, { fundamental: engine.fundamental, view }),
      createTimeline(canvas(900, 140), engine, view),
    ];
    for (let i = 0; i < 2; i++) for (const draw of draws) draw();
    for (const listener of listeners) listener({ before: defaultPatch(), after: patch, by: 'hand' });
    const start = performance.now();
    for (const draw of draws) draw();
    const took = performance.now() - start;
    document.body.replaceChildren();
    return took;
  }
  /** The engine having played a case's Notes, for the Viewers to draw. */
  const played = async (c: EdgeCase, notes: readonly number[]) => (await play(c, notes, { seconds: 0.6 })).engine;

  /**
   * Slow frames that are answered: a finding written in issue 116 for the owner. With FM on a Waveform richer than a
   * Sine, the Ideal works out the sidebands of each of Osc 1's Harmonics, thousands of them, once for each Patch; the
   * frames after it are as quick as any. No Preset comes near (the most partials any Preset's Ideal has is 638).
   */
  const richFm = (p: Patch) => p.crossMod > 0 && p.mixOsc1 > 0 && p.waveform !== 'sine';

  it('draws each in under three times Init’s frame and a millisecond, the bound of issue 45’s draw-cost test', async () => {
    const init: EdgeCase = { name: 'Init', patch: { ...defaultPatch(), cutoff: 2001 }, bpm: 120 };
    const initFrames: number[] = [];
    for (let i = 0; i < 5; i++) initFrames.push(viewersOf(await played(init, [60]), init.patch));
    const budget = Math.min(...initFrames) * 3 + 1;
    // The hard cases, the pairwise set and every Preset, played at once; each frame then drawn alone.
    const cases = [...edgeCases(SEED).filter((c) => !c.name.startsWith('at random')), ...PRESETS.map((p) => preset(p.name))];
    const engines = new Map<EdgeCase, SynthEngine>();
    await eachAtOnce(cases, async (c) => void engines.set(c, await played(c, notesFor(c.patch)[1])));
    const [slow, answered]: string[][] = [[], []];
    for (const c of cases) {
      const notes = notesFor(c.patch)[1];
      let took = viewersOf(engines.get(c)!, c.patch);
      // A frame over the budget is drawn again, on new Viewers, twice: a slow frame is one that stays slow.
      for (let again = 0; again < 2 && took > budget; again++) took = Math.min(took, viewersOf(await played(c, notes), c.patch));
      if (took > budget) (richFm(c.patch) ? answered : slow).push(`${took.toFixed(1)} ms: ${named(c, notes)}`);
    }
    console.info(`Slow frames answered (FM on a rich Osc 1, the finding): ${answered.length}`);
    expect(slow, `budget ${budget.toFixed(1)} ms (Init ${Math.min(...initFrames).toFixed(1)} ms), ${cases.length} Patches`).toEqual([]);
  }, 200_000);
});
