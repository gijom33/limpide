import { describe, expect, it } from 'vitest';
import { osc2Cents } from '../modulation/modulationModel';
import type { Waveform } from '../music/harmonics';
import { noteToFrequency } from '../music/pitch';
import { defaultPatch, PARAMS, type Patch } from '../patch/patch';
import type { PatchChange } from '../patch/patchStore';
import { PRESETS } from '../patch/presets';
import { shareHash } from '../patch/serialize';
import { type EdgeCase, edgeCases } from '../test/edgePatches';
import { dB, energyAboveDb } from '../test/measure';
import { memoryStorage } from '../test/memoryStorage';
import { straightenLimiter } from '../test/straightLimiter';
import { createScope } from '../viewers/scope';
import { createSpectrum } from '../viewers/spectrum';
import { createTimeline } from '../viewers/timeline';
import { createViewerStore } from '../viewers/viewerStore';
import { filterStages } from './filterDesign';
import { createSynthEngine, SAFETY_KNEE, type SynthEngine } from './synthEngine';

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
/** When a legato line's second Note slides in over its first, before the part judged. */
const LEGATO_NOTE = NOTE + 0.1;
/** The part of the Note judged for silence and offset: past a mid-length Attack, and most of the offset filter's settling. */
const JUDGED = [0.25, END] as const;
const NOTES = { low: 36, middle: 60, high: 96 } as const;
/** The middle chord on a Patch of several Voices: thirds stacked from C4. */
const CHORD = [60, 64, 67, 71, 74, 77, 81, 84];
/** Under this RMS a 50 ms window is silent: −120 dBFS. */
const SILENT = 1e-6;
/** The largest offset allowed, against the sound's own level: a third of it (−10 dB). */
const OFFSET_DB = -10;
/** How many renders run at once: each OfflineAudioContext renders on its own thread. */
const AT_ONCE = 10;
/** The Effective Cutoff's range, where the model holds it (20 Hz to 20 kHz), a hair inside each end. */
const [BOTTOM, TOP] = [PARAMS.cutoff.min * 1.0001, PARAMS.cutoff.max * 0.9999];

/**
 * A render of `notes` on a case's Patch at its Tempo, the limiter straight; `dcBlock: false` takes 103's filter out,
 * `notchBelowZero` takes a notch's Q below zero, where it passes nothing, so the silence check has a fault to find.
 */
async function play({ patch, bpm }: EdgeCase, notes: readonly number[], { dcBlock = true, notchBelowZero = false, seconds = END } = {}) {
  const ctx = new OfflineAudioContext(1, Math.round(SR * seconds), SR);
  straightenLimiter(ctx);
  const biquads: BiquadFilterNode[] = [];
  if (!dcBlock || notchBelowZero) {
    const create = ctx.createBiquadFilter.bind(ctx);
    ctx.createBiquadFilter = () => {
      const node = create();
      biquads.push(node);
      return node;
    };
  }
  const engine = createSynthEngine(ctx);
  // Each Voice's offset filter is its high-pass at 1 Hz: made an all-pass, it lets the offset through, as 1.16.0 did.
  if (!dcBlock) for (const node of biquads) if (node.type === 'highpass' && node.frequency.value === 1) node.type = 'allpass';
  engine.setTempo(bpm, 0);
  engine.applyPatch(patch);
  if (notchBelowZero) {
    const under = ctx.createConstantSource();
    under.offset.value = -100;
    for (const node of biquads) if (node.type === 'notch') under.connect(node.Q);
    under.start();
  }
  // With Legato on, one Voice plays a legato line (issue 119): a fifth under the Note, then the Note over it.
  const line = patch.legato === 'on' && patch.voices === 1;
  if (line) engine.noteOn(notes[0] - 7, 1, NOTE);
  for (const note of notes) engine.noteOn(note, 1, line ? LEGATO_NOTE : NOTE);
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
 * The Effective Cutoff at an end of its range, 20 Hz or 20 kHz, where the model and the sound's Filter both hold it
 * (issue 166): a high-pass or band-pass at the top lets through only what is above hearing, and a low-pass or
 * band-pass at the bottom what is under it, so silence is not judged there; nor an offset where it closes, or at the
 * bottom, where what it lets through is under 20 Hz.
 */
const closedAtAnEnd = (patch: Patch, cutoff: number) =>
  (cutoff >= TOP && (patch.filterMode === 'highpass' || patch.filterMode === 'bandpass')) ||
  (cutoff <= BOTTOM && (patch.filterMode === 'lowpass' || patch.filterMode === 'bandpass'));

/**
 * What the Filter lets through at `t`, by the Modulation model, of what the sources that are up play: each pitched
 * source's fundamental and first Harmonics, Ring's sum and difference, Noise's whole band, those a person hears.
 * `heard` is the most it lets through of any of them; `fundamental`, of a pitched source's fundamental (Noise's 1 kHz).
 * `subAudio`: whether something plays under 20 Hz, other than an offset: a source that low, Pink Noise (as much in
 * each octave down to the offset filter's), or where Ring or FM meets Osc 1 and Osc 2, a Harmonic of one that close to
 * a Harmonic of the other (their difference tone).
 */
function passed(engine: SynthEngine, patch: Patch, t: number, notes: readonly number[]) {
  const m = engine.modulationAt(t);
  // The newest Note is the chord's top: the lowest is as far under it.
  const f0 = noteToFrequency(m.pitch + Math.min(...notes) - notes[notes.length - 1]);
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
  return { open: m.amp * m.volume, cutoff: m.cutoff, heard: most(all), fundamental: most(fundamentals), subAudio };
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
      if (Math.abs(samples[i]) > SAFETY_KNEE) {
        limited++;
        break;
      }
  }
  // Each 50 ms window judged: whether it should sound, whether it does.
  const silent: number[] = [];
  let [windows, offsetJudged, closed] = [0, true, false];
  for (let from = JUDGED[0]; from + 0.05 <= JUDGED[1] + 1e-9; from += 0.05) {
    windows++;
    const p = passed(engine, patch, from + 0.025, notes);
    closed ||= p.open >= 0.01 && closedAtAnEnd(patch, p.cutoff);
    const shouldSound = p.open >= 0.01 && !closedAtAnEnd(patch, p.cutoff) && p.heard >= 0.1;
    if (shouldSound && rmsOf(samples, ...span(from, from + 0.05)) < SILENT) silent.push(from);
    // The offset is judged only where the Note plainly sounds, and nothing under 20 Hz but an offset could make one.
    offsetJudged &&= p.open >= 0.01 && p.fundamental >= 0.5 && !p.subAudio && !closedAtAnEnd(patch, p.cutoff) && p.cutoff > BOTTOM;
  }
  const [a, b] = span(...JUDGED);
  const offset = offsetOf(samples, a, b);
  const level = rmsOf(samples, a, b, offset);
  return { errorAt, limited: limited / frames, silent, windows, offsetDb: dB(Math.abs(offset) / level), offsetJudged, closed };
}

type FaultKind = 'error' | 'silence' | 'limiter' | 'offset';

/** What a render does wrong, in words, and which of the faults it is: none when it does nothing wrong. */
function faultsOf(r: ReturnType<typeof measure>): { kind: FaultKind; words: string }[] {
  return [
    ...(r.errorAt >= 0 ? [{ kind: 'error' as const, words: `an error value at ${(r.errorAt / SR).toFixed(3)} s` }] : []),
    ...(r.silent.length ? [{ kind: 'silence' as const, words: `silent from ${r.silent[0].toFixed(2)} s (${r.silent.length} of ${r.windows} windows of 50 ms)` }] : []),
    ...(r.limited > 0.5 ? [{ kind: 'limiter' as const, words: `the limiter working in ${Math.round(r.limited * 100)} % of the Note` }] : []),
    ...(r.offsetJudged && r.offsetDb > OFFSET_DB ? [{ kind: 'offset' as const, words: `an offset ${r.offsetDb.toFixed(1)} dB against its level` }] : []),
  ];
}

/**
 * How far the sources stack, in sources at full: the Mixer's levels summed, times the square root of the Notes played
 * (a chord's Voices add as power, as the master makes room for them).
 */
const stacked = (p: Patch, notes: readonly number[]) => (p.mixOsc1 + p.mixOsc2 + p.mixRing + p.mixNoise + p.mixSub) * Math.sqrt(notes.length);

/** Faults the sweep finds that are answered, each with the reason: what a Patch does by design. */
const ANSWERED: { reason: string; covers(kind: FaultKind, patch: Patch, notes: readonly number[]): boolean }[] = [
  {
    reason: 'the limiter is there for sources stacked to two at full or more (ADR-0006; the LIMITING spec plays every source at full)',
    covers: (kind, p, notes) => kind === 'limiter' && stacked(p, notes) >= 2,
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
    let [offsetsJudged, closedAtTheEnds] = [0, 0];
    await eachAtOnce(jobs, async ({ c, notes }) => {
      const { samples, engine } = await play(c, notes);
      const measured = measure(samples, engine, c.patch, notes);
      if (measured.offsetJudged) offsetsJudged++;
      if (measured.closed) closedAtTheEnds++;
      for (const fault of faultsOf(measured)) {
        const answer = ANSWERED.find((a) => a.covers(fault.kind, c.patch, notes));
        if (answer) answered.set(answer.reason, (answered.get(answer.reason) ?? 0) + 1);
        else faults.push(`${fault.words}: ${named(c, notes)}`);
      }
    });
    console.info(`Answered: ${[...answered].map(([reason, n]) => `${n} × ${reason}`).join('; ') || 'none'}`);
    console.info(`Offset judged on ${offsetsJudged} renders; silence not judged on ${closedAtTheEnds} with the Filter closed at an end of its range`);
    expect(faults.slice(0, 20), `${faults.length} renders of ${jobs.length} at fault (seed ${SEED})`).toEqual([]);
  }, 600_000);

  it('finds 1.16.0’s FM offset: FM Ladder on C2, C4 and C6 with issue 103’s filter taken out, and none with it (control)', async () => {
    const ladder = preset('FM Ladder');
    for (const note of [36, 60, 84]) {
      const [kept, taken] = await Promise.all([true, false].map((dcBlock) => play(ladder, [note], { dcBlock })));
      const kinds = (r: typeof kept) => faultsOf(measure(r.samples, r.engine, ladder.patch, [note])).map((f) => f.kind);
      expect(kinds(taken), `MIDI ${note}`).toEqual(['offset']);
      expect(kinds(kept), `MIDI ${note}`).toEqual([]);
    }
  });

  it('finds a limiter stuck on, and answers it where every source is at full into full Resonance (control, the LIMITING spec’s Patch)', async () => {
    const patch = { ...defaultPatch(), mixOsc2: 1, mixNoise: 1, mixSub: 1, osc2Octave: 1, resonance: 1, cutoff: 300, filterSlope: 24 as const, ampSustain: 1 };
    const { samples, engine } = await play({ name: 'LIMITING', patch, bpm: 120 }, [57]);
    const [fault] = faultsOf(measure(samples, engine, patch, [57]));
    expect(fault.kind).toBe('limiter');
    expect(ANSWERED.find((a) => a.covers(fault.kind, patch, [57]))?.reason).toMatch(/stacked/);
  });

  it('finds a Note silent where the model has it sound: a notch whose Q is taken below zero (control)', async () => {
    const patch = { ...defaultPatch(), filterMode: 'notch' as const, resonance: 0.5 };
    const notch: EdgeCase = { name: 'notch', patch, bpm: 120 };
    const kinds = async (notchBelowZero: boolean) => {
      const { samples, engine } = await play(notch, [60], { notchBelowZero });
      return faultsOf(measure(samples, engine, patch, [60])).map((f) => f.kind);
    };
    expect(await kinds(true)).toContain('silence');
    expect(ANSWERED.some((a) => a.covers('silence', patch, [60]))).toBe(false);
    expect(await kinds(false)).toEqual([]);
  });

  it('keeps a notch sounding with an LFO swinging its Resonance end to end (issue 166)', async () => {
    const patch = { ...defaultPatch(), filterMode: 'notch' as const, resonance: 0.5, lfoDestination: 'resonance' as const, lfoAmount: 1, lfoWaveform: 'square' as const, lfoRate: 1 };
    const { samples, engine } = await play({ name: 'notch', patch, bpm: 120 }, [60]);
    expect(faultsOf(measure(samples, engine, patch, [60]))).toEqual([]);
  });

  // Issue 166: the sound moves the Q as the model moves the Resonance, so a band-pass's Q never passes its floor and
  // the band-pass stays one. Talking Filter is LFO 2's square on its band-pass's Resonance.
  it('keeps a band-pass a band-pass with an LFO on its Resonance: Talking Filter at its LFO’s foot as at the same Resonance held (issue 166)', async () => {
    const talking = preset('Talking Filter');
    const still = { ...talking.patch, lfoAmount: 0 };
    // LFO 2's square: its foot is its second half-cycle, measured from a fifth of the way into it.
    const foot = 1.2 / still.lfo2Rate / 2;
    const swung = await play({ ...talking, patch: still }, [60], { seconds: foot + 0.2 });
    const resonance = swung.engine.modulationAt(foot + 0.05).resonance;
    expect(resonance).toBeLessThan(still.resonance);
    const held = await play({ ...talking, patch: { ...still, lfo2Amount: 0, resonance } }, [60], { seconds: foot + 0.2 });
    const top = (r: typeof swung) => energyAboveDb(r.samples, SR, 4000, Math.round(foot * SR), 4096);
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
      createTimeline(canvas(900, 140), engine, view, () => null),
    ];
    for (let i = 0; i < 2; i++) for (const draw of draws) draw();
    for (const listener of listeners) listener({ before: defaultPatch(), after: patch, by: 'hand' });
    const start = performance.now();
    for (const draw of draws) draw();
    const took = performance.now() - start;
    document.body.replaceChildren();
    return took;
  }
  /**
   * FM at full on Osc 1s richer than a Sine, the heaviest Ideals to work out (issue 166): Osc 2 a whole number of
   * octaves off (one cycle, Fourier-transformed), or not (each Harmonic's sidebands, thousands of them).
   */
  const fm = { ...defaultPatch(), osc2Waveform: 'sine', mixOsc2: 0, crossMod: 1 } as const;
  const HEAVY_FM: EdgeCase[] = [
    { name: 'heavy FM: a triangle swung by a Sine three octaves up', patch: { ...fm, waveform: 'triangle', osc2Octave: 2, osc2Semitone: 12 }, bpm: 120 },
    { name: 'heavy FM: a pulse swung by a Sine three octaves up, detuned', patch: { ...fm, waveform: 'pulse', osc2Octave: 2, osc2Semitone: 12, osc2Detune: 50 }, bpm: 120 },
    { name: 'heavy FM: a square swung by a Sine three octaves under it', patch: { ...fm, waveform: 'square', osc2Octave: -2, osc2Semitone: -12 }, bpm: 120 },
    {
      name: 'heavy FM: a square two octaves down over a Sub, swung by a Sine an octave under it, detuned',
      patch: { ...fm, waveform: 'square', osc1Octave: -2, osc2Octave: -2, osc2Semitone: -12, osc2Detune: 50, mixSub: 0.5, subOctave: -1 },
      bpm: 120,
    },
  ];
  /** The engine having played a case's Notes, for the Viewers to draw. */
  const played = async (c: EdgeCase, notes: readonly number[]) => (await play(c, notes, { seconds: 0.6 })).engine;

  it('draws each in under three times Init’s frame and a millisecond, the bound of issue 45’s draw-cost test', async () => {
    const init: EdgeCase = { name: 'Init', patch: { ...defaultPatch(), cutoff: 2001 }, bpm: 120 };
    const initFrames: number[] = [];
    for (let i = 0; i < 5; i++) initFrames.push(viewersOf(await played(init, [60]), init.patch));
    const budget = Math.min(...initFrames) * 3 + 1;
    // The hard cases, heavy FM, the pairwise set and every Preset, played at once; each frame then drawn alone.
    const cases = [...edgeCases(SEED).filter((c) => !c.name.startsWith('at random')), ...HEAVY_FM, ...PRESETS.map((p) => preset(p.name))];
    const engines = new Map<EdgeCase, SynthEngine>();
    await eachAtOnce(cases, async (c) => void engines.set(c, await played(c, notesFor(c.patch)[1])));
    const slow: string[] = [];
    for (const c of cases) {
      const notes = notesFor(c.patch)[1];
      let took = viewersOf(engines.get(c)!, c.patch);
      // A frame over the budget is drawn again, on new Viewers, twice: a slow frame is one that stays slow.
      for (let again = 0; again < 2 && took > budget; again++) took = Math.min(took, viewersOf(await played(c, notes), c.patch));
      if (took > budget) slow.push(`${took.toFixed(1)} ms: ${named(c, notes)}`);
    }
    expect(slow, `budget ${budget.toFixed(1)} ms (Init ${Math.min(...initFrames).toFixed(1)} ms), ${cases.length} Patches`).toEqual([]);
  }, 200_000);
});
