import type { Waveform } from '../music/harmonics';
import type { Hat, Pose } from './mascotMotion';

/** A pixel run on Bead's 22 × 13 grid (issue 115): its left, top, width and height. */
export type Rect = readonly [x: number, y: number, width: number, height: number];
/** A picture: its pixel runs, each group in a class of the stylesheet. */
export type Picture = readonly (readonly [className: string, rects: readonly Rect[]])[];
/** The tail's four stages, left to right from the drop, in the logo's colours. */
export type Stage = 'osc' | 'filter' | 'amp' | 'mod';

/** The tail's columns, from the drop to the tip, and its rows' middle and swing. */
const TAIL_FROM = 9;
const TAIL_TO = 21;
const MIDDLE = 7;
const SWING = 3;
/** The tail shows a cycle and a half. */
const CYCLES = 1.5;
const stageAt = (x: number): Stage => (x <= 11 ? 'osc' : x <= 15 ? 'filter' : x <= 19 ? 'amp' : 'mod');

/** One cycle of each Waveform, `phase` 0 to 1, from −1 to 1. */
const WAVES: Record<Waveform, (phase: number) => number> = {
  sine: (p) => Math.sin(2 * Math.PI * p),
  triangle: (p) => 1 - 4 * Math.abs(((p + 0.25) % 1) - 0.5),
  saw: (p) => 2 * p - 1,
  square: (p) => (p < 0.5 ? 1 : -1),
  pulse: (p) => (p < 0.25 ? 1 : -1),
};

/**
 * The tail drawn as a line through a row for each column (`row`, from 0 at the drop to 1 at the tip), its jumps
 * joined by a column of pixels, as the logo's saw tooth is.
 */
function tailThrough(row: (along: number) => number): Record<Stage, Rect[]> {
  const tail: Record<Stage, Rect[]> = { osc: [], filter: [], amp: [], mod: [] };
  let before: number | null = null;
  for (let x = TAIL_FROM; x <= TAIL_TO; x++) {
    const y = Math.round(row((x - TAIL_FROM) / (TAIL_TO - TAIL_FROM)));
    const top = before === null || Math.abs(y - before) <= 1 ? y : Math.min(y, before);
    const bottom = before === null || Math.abs(y - before) <= 1 ? y : Math.max(y, before);
    tail[stageAt(x)].push([x, top, 1, bottom - top + 1]);
    before = y;
  }
  return tail;
}

/**
 * Its tail as each Waveform (issue 127), a cycle and a half of it, and straight, stiff with a screaming Resonance,
 * rising from the drop.
 */
export const TAILS: Record<Exclude<Pose['tail'], 'logo'>, Record<Stage, Rect[]>> = {
  sine: tailThrough((t) => MIDDLE - SWING * WAVES.sine((t * CYCLES) % 1)),
  triangle: tailThrough((t) => MIDDLE - SWING * WAVES.triangle((t * CYCLES) % 1)),
  saw: tailThrough((t) => MIDDLE - SWING * WAVES.saw((t * CYCLES) % 1)),
  square: tailThrough((t) => MIDDLE - SWING * WAVES.square((t * CYCLES) % 1)),
  pulse: tailThrough((t) => MIDDLE - SWING * WAVES.pulse((t * CYCLES) % 1)),
  straight: tailThrough((t) => 9 - 7 * t),
};

/** A ring of pixels about (`cx`, `cy`), `radius` across. */
function ring(cx: number, cy: number, radius: number): Rect[] {
  const rects: Rect[] = [];
  for (let y = Math.floor(cy - radius - 1); y <= Math.ceil(cy + radius + 1); y++) {
    for (let x = Math.floor(cx - radius - 1); x <= Math.ceil(cx + radius + 1); x++) {
      if (Math.abs(Math.hypot(x + 0.5 - cx, y + 0.5 - cy) - radius) < 0.5) rects.push([x, y, 1, 1]);
    }
  }
  return rects;
}

/** Its costumes (issue 127), on its head: the ghost sheet is drawn under its eyes, the hats over everything. */
export const HATS: Record<Exclude<Hat, 'none'>, Picture> = {
  ghost: [
    [
      'mascot-sheet',
      [[3, -1, 3, 1], [2, 0, 5, 2], [1, 2, 7, 2], [0, 4, 9, 1], [-1, 5, 11, 6], [-1, 11, 3, 1], [3, 11, 3, 1], [7, 11, 3, 1], [-1, 12, 1, 1], [4, 12, 1, 1], [9, 12, 1, 1]],
    ],
  ],
  christmas: [
    ['mascot-hat-red', [[3, 0, 3, 1], [4, -1, 3, 1], [5, -2, 2, 1], [6, -3, 1, 1]]],
    ['mascot-sheet', [[2, 1, 5, 1], [7, -4, 2, 2]]],
  ],
  party: [
    ['mascot-hat-stripe', [[2, 1, 5, 1], [3, -1, 3, 1]]],
    ['mascot-hat-band', [[3, 0, 3, 1], [4, -2, 1, 1]]],
    ['mascot-hat-pom', [[4, -3, 1, 1]]],
  ],
  nightcap: [
    ['mascot-hat-night', [[3, 0, 3, 1], [2, -1, 3, 1], [1, -2, 2, 1], [0, -1, 1, 1]]],
    ['mascot-sheet', [[2, 1, 5, 1], [-1, 0, 1, 1]]],
  ],
};

/** Frozen in an ice cube, with a glint. */
export const ICE: Picture = [
  ['mascot-ice', [[-1, -1, 11, 14]]],
  ['mascot-shine', [[0, 0, 1, 3], [1, 0, 2, 1]]],
];

/** Its props for the new tricks that move with it (issue 127), on its own grid. */
export const PROPS: Partial<Record<Pose['prop'], Picture>> = {
  cup: [
    ['mascot-cup', [[-4, 8, 3, 3], [-5, 9, 1, 1]]],
    ['mascot-coffee', [[-4, 8, 3, 1]]],
  ],
  hands: [['mascot-hand', [[-1, 6, 1, 3], [9, 6, 1, 3]]]],
  visor: [['mascot-hand', [[-1, 5, 10, 1], [-2, 6, 1, 1]]]],
  suitcase: [
    ['mascot-case', [[-9, 7, 5, 5]]],
    ['mascot-handle', [[-8, 6, 3, 1], [-4, 9, 4, 1]]],
  ],
  baton: [
    ['mascot-handle', [[-1, 6, 1, 1], [-2, 5, 1, 1], [-3, 4, 1, 1]]],
    ['mascot-shine', [[-4, 3, 1, 1]]],
  ],
  batonDown: [
    ['mascot-handle', [[-1, 8, 1, 1], [-2, 9, 1, 1], [-3, 10, 1, 1]]],
    ['mascot-shine', [[-4, 11, 1, 1]]],
  ],
  bubbleSmall: [['mascot-bubble', ring(-2, 9.5, 1.6)]],
  bubble: [['mascot-bubble', ring(4.5, 6.5, 8)]],
  rod: [['mascot-handle', [[-1, 8, 1, 1], [-2, 7, 1, 1], [-3, 6, 1, 1], [-4, 5, 1, 1], [-5, 4, 1, 1], [-6, 3, 1, 1], [-7, 2, 1, 1]]]],
  rodBite: [['mascot-handle', [[-1, 8, 1, 1], [-2, 7, 1, 1], [-3, 6, 1, 1], [-4, 6, 1, 1], [-5, 5, 1, 1], [-6, 5, 1, 1], [-7, 5, 1, 1]]]],
};

/** The rod's tip on the grid, straight and bent: the line hangs from there. */
export const ROD_TIP = { rod: { x: -7, y: 2 }, rodBite: { x: -7, y: 5 } } as const;
/** The hook, and the ♪ on it, in the page's pixels from where the line ends. */
export const HOOK: Rect[] = [[-1, 0, 2, 7], [-1, 6, 6, 2], [3, 3, 2, 4]];
export const CATCH: Rect[] = [[5, 6, 2, 10], [0, 13, 6, 5], [7, 6, 2, 2], [9, 8, 2, 2]];

/** Its props that stay put while it shrinks (issue 127), on the same grid: the sun, and the cloud over its head. */
export const SKY: Partial<Record<Pose['prop'], Picture>> = {
  sun: [['mascot-sun', [[-9, 0, 3, 3], [-8, -2, 1, 1], [-8, 4, 1, 1], [-11, 1, 1, 1], [-5, 1, 1, 1]]]],
  cloud: [['mascot-cloud', [[-2, -2, 13, 2], [0, -4, 8, 2]]]],
};
/**
 * The cloud's underside, on the grid, and its span across: its shower falls from there. The sun beside it and the
 * cloud low over it, so both stay under the header where it is closest (three across).
 */
export const CLOUD = { bottom: 0, from: -2, to: 11 };
