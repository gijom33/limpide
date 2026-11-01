import { NOTE_VALUES, TEMPO } from '../music/tempo';
import { CHOICES, defaultPatch, LFO_DESTINATIONS, type LfoDestination, PARAMS, type ParamId, type Patch, type SoundField, setParam } from '../patch/patch';
import { positionToValue } from '../patch/taper';

// Patches at the edges (issue 116): every Parameter at its ends and the middle of its travel, every choice, the Tempo
// at its ends, combined so that every pair of them meets at every pair of their values, with the known hard cases,
// then filled with Patches drawn at random from the same edges. A seed fixes the whole set.

/** One factor of the sweep: a Parameter, a choice, or the page's Tempo (not a Patch's, but Sync follows it). */
export interface EdgeFactor {
  key: SoundField | 'bpm';
  values: readonly (number | string)[];
}

/** A Patch of the sweep, the Tempo it plays at, and where it comes from (a hard case's name, or its place). */
export interface EdgeCase {
  name: string;
  patch: Patch;
  bpm: number;
}

/** How many Patches the sweep holds: the pairs and the hard cases, then Patches at random up to this. */
const SWEEP_SIZE = 1000;
/** How many Patches each pairwise step tries before keeping the one that meets the most pairs not met yet. */
const CANDIDATES = 8;

/** A Parameter's ends and the middle of its travel, snapped as its knob snaps. */
const edgesOf = (id: ParamId) => [0, 0.5, 1].map((position) => setParam(defaultPatch(), id, positionToValue(PARAMS[id], position))[id]);

export const EDGE_FACTORS: readonly EdgeFactor[] = [
  ...(Object.keys(PARAMS) as ParamId[]).map((id) => ({ key: id, values: edgesOf(id) })),
  ...(Object.entries(CHOICES) as [keyof typeof CHOICES, readonly (number | string)[]][]).map(([key, values]) => ({ key, values })),
  { key: 'bpm', values: [TEMPO.min, TEMPO.default, TEMPO.max] },
];

/** A repeatable random number from 0 to 1 (mulberry32). */
function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
}

/** A choice of one value per factor, as their places in `EDGE_FACTORS`' lists, made into a Patch and its Tempo. */
function caseOf(name: string, picks: readonly number[]): EdgeCase {
  const fields = Object.fromEntries(EDGE_FACTORS.map((f, i) => [f.key, f.values[picks[i]]]));
  const { bpm, ...patch } = fields;
  return { name, patch: { ...defaultPatch(), ...patch } as Patch, bpm: bpm as number };
}

/**
 * Patches in which every pair of factors meets at every pair of their values at least once (a pairwise covering set,
 * built greedily): each new one, of a few tried, is the one meeting the most pairs not met yet.
 */
function pairwise(random: () => number): EdgeCase[] {
  const n = EDGE_FACTORS.length;
  const sizes = EDGE_FACTORS.map((f) => f.values.length);
  // unmet[i][j][a * sizes[j] + b]: factor i at its value a and factor j at its value b have not met yet (i < j).
  const unmet = sizes.map((_, i) => sizes.map((sj, j) => (j > i ? new Uint8Array(sizes[i] * sj).fill(1) : new Uint8Array(0))));
  let left = sizes.reduce((sum, si, i) => sum + sizes.slice(i + 1).reduce((s, sj) => s + si * sj, 0), 0);
  const isUnmet = (i: number, a: number, j: number, b: number) => (i < j ? unmet[i][j][a * sizes[j] + b] : unmet[j][i][b * sizes[i] + a]);
  const cases: EdgeCase[] = [];
  while (left > 0) {
    let best: number[] = [];
    let bestMet = -1;
    for (let c = 0; c < CANDIDATES; c++) {
      const order = Array.from({ length: n }, (_, i) => i).sort(() => random() - 0.5);
      const picks = new Array<number>(n).fill(-1);
      let met = 0;
      for (const i of order) {
        let most = -1;
        let chosen: number[] = [];
        for (let a = 0; a < sizes[i]; a++) {
          let count = 0;
          for (let j = 0; j < n; j++) if (picks[j] >= 0 && isUnmet(i, a, j, picks[j])) count++;
          // The first factor placed goes where most of its pairs are left, so a value with unmet pairs is not left out.
          if (picks.every((p) => p < 0)) for (let j = 0; j < n; j++) if (j !== i) for (let b = 0; b < sizes[j]; b++) count += isUnmet(i, a, j, b);
          if (count > most) [most, chosen] = [count, [a]];
          else if (count === most) chosen.push(a);
        }
        picks[i] = chosen[Math.floor(random() * chosen.length)];
        if (order[0] !== i) met += most;
      }
      if (met > bestMet) [bestMet, best] = [met, picks];
    }
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const k = best[i] * sizes[j] + best[j];
        if (unmet[i][j][k]) {
          unmet[i][j][k] = 0;
          left--;
        }
      }
    cases.push(caseOf(`pairwise ${cases.length + 1}`, best));
  }
  return cases;
}

const FASTEST_NOTE = NOTE_VALUES.length - 1;

/** The cases the reviews found by hand, or that the issue names: each from Init, a Note sounding through it. */
function hardCases(): EdgeCase[] {
  const from = (name: string, changes: Partial<Patch>, bpm: number = TEMPO.default): EdgeCase => ({ name, patch: { ...defaultPatch(), ...changes }, bpm });
  // What each Destination needs to be moved: a pulse for its Width, Osc 2 heard for its pitch, FM with room.
  const needs: Partial<Record<LfoDestination, Partial<Patch>>> = {
    osc2Pitch: { mixOsc2: 1 },
    detune: { mixOsc2: 1 },
    pulseWidth: { waveform: 'pulse', pulseWidth: 0.5 },
    fm: { crossMod: 0.5 },
  };
  const bothLfos = LFO_DESTINATIONS.flatMap(({ id }) =>
    (['off', 'on'] as const).map((sync) =>
      from(
        `both LFOs on ${id}, Sync ${sync}`,
        {
          ...needs[id], lfoDestination: id, lfo2Destination: id, lfoAmount: 1, lfo2Amount: 1, lfoSync: sync, lfo2Sync: sync,
          lfoRate: PARAMS.lfoRate.max, lfo2Rate: PARAMS.lfo2Rate.min, lfoNote: FASTEST_NOTE, lfo2Note: 0, lfo2Waveform: 'square',
        },
        sync === 'on' ? TEMPO.max : TEMPO.default,
      ),
    ),
  );
  return [
    ...bothLfos,
    from('FM and Ring at full, Osc 2 on the Note', { crossMod: 1, mixRing: 1, osc2Waveform: 'sine', waveform: 'sine', cutoff: 20000 }),
    from('FM and Ring at full, two saws an octave apart', { crossMod: 1, mixRing: 1, mixOsc2: 1, osc2Octave: 1, cutoff: 20000 }),
    from('FM and Ring at full, two squares, full Resonance', { crossMod: 1, mixRing: 1, waveform: 'square', osc2Waveform: 'square', resonance: 1 }),
    from('the Sub two octaves under Osc 1 two octaves down', { osc1Octave: -2, subOctave: -2, mixSub: 1 }),
    from('the Sub two octaves down, a sine, alone', { mixOsc1: 0, subOctave: -2, subWaveform: 'sine', mixSub: 1 }),
    // A legato line (issue 119) sliding the longest Glide under LFOs that do not restart on its second Note.
    from('a legato line, the Glide at its longest, both LFOs retriggered', {
      legato: 'on', glide: PARAMS.glide.max, lfoAmount: 1, lfo2Amount: 1, lfoRetrigger: 'note', lfo2Retrigger: 'note', lfo2Destination: 'cutoff',
    }),
    ...Array.from({ length: 8 }, (_, i) => from(`${i + 1} Voices, a chord on all of them`, { voices: (i + 1) as Patch['voices'], mixOsc2: 1, osc2Semitone: 7 })),
  ];
}

/** Patches drawn at random from the edges, each factor at any of its values. */
const atRandom = (random: () => number, count: number) =>
  Array.from({ length: count }, (_, i) => caseOf(`at random ${i + 1}`, EDGE_FACTORS.map((f) => Math.floor(random() * f.values.length))));

/** The sweep's Patches for a seed: the pairs, the hard cases, then Patches at random, `SWEEP_SIZE` in all. */
export function edgeCases(seed: number): EdgeCase[] {
  const random = seeded(seed);
  const cases = [...hardCases(), ...pairwise(random)];
  return [...cases, ...atRandom(random, Math.max(0, SWEEP_SIZE - cases.length))];
}
