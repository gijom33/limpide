/** Bead's size on screen (issue 115): 2 px a square of its 22 × 13 grid. */
export const WIDTH = 44;
export const HEIGHT = 26;
/** Its drop's middle from its box's left: turned round, its drawing is mirrored about here's double, 20 % of its width. */
const ORIGIN = WIDTH * 0.2;
/** Its tail's middle, from the top of its drawing: level with the control's middle as it points. */
const TAIL_Y = 14;
/** How far a Tutorial's ring stands out round its control: its outline's offset and width. */
export const RING = 6;
/** Its tail's tip stops this short of the ring. */
const GAP = 2;
/** The target text over a control ("→ 800 Hz"): its height, its gap over the control, and its width a letter. */
const TARGET_HEIGHT = 18;
const TARGET_GAP = 6;
const TARGET_LETTER = 7.5;
const TARGET_PADDING = 14;

/** A box in the window's pixels. */
export interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Where Bead clings beside a control (issue 151): on its `side` of it, facing it (`turn`, 1 as drawn, −1 turned round),
 * its box's left at `left` and its foot at `foot`, as the page draws it.
 */
export interface Cling {
  side: 'left' | 'right';
  turn: 1 | -1;
  left: number;
  foot: number;
}

/** What `clingBeside` weighs. */
export interface ClingChoice {
  /** The control it points at. */
  control: Box;
  /** What it must never cover: the ring round the control, the target text over it. */
  keepClear: readonly Box[];
  /** The neighbouring controls and their names: covered as little as can be. */
  neighbours: readonly Box[];
  /** The docked card, if any: it clings on the side away from it when both are as free. */
  card: Box | null;
  /** Where its drawing must stay: the window, under the header and the section tabs where they stay put. */
  within: Box;
}

/** What it covers of the window, clinging: its drop and its tail, turned towards the control. */
export function drawnAt({ side, left, foot }: Cling): Box {
  const [from, to] = side === 'left' ? [left, left + WIDTH] : [left + 2 * ORIGIN - WIDTH, left + 2 * ORIGIN];
  return { left: from, right: to, top: foot - HEIGHT, bottom: foot };
}

/** The target text a Tutorial writes over its control: centred over it, just over its top (an estimate from its length). */
export function targetBox(control: Box, text: string): Box {
  const middle = (control.left + control.right) / 2;
  const half = (text.length * TARGET_LETTER + TARGET_PADDING) / 2;
  return { left: middle - half, right: middle + half, top: control.top - TARGET_GAP - TARGET_HEIGHT, bottom: control.top - TARGET_GAP };
}

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const inside = (a: Box, b: Box) => a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;

/**
 * Where Bead clings beside a control, like a drop on glass (issue 151, decision 3): level with it, its tail's tip just
 * short of its ring, on the side covering the least of the neighbouring controls and names; the side away from the
 * docked card when both cover as little (within a pixel row of its width). Never over `keepClear`, never out of
 * `within`: with neither side free, nowhere (null), and it looks at the control from where it is.
 */
export function clingBeside({ control, keepClear, neighbours, card, within }: ClingChoice): Cling | null {
  const foot = (control.top + control.bottom) / 2 - TAIL_Y + HEIGHT;
  const sides: Cling[] = [
    { side: 'left', turn: 1, left: control.left - RING - GAP - WIDTH, foot },
    { side: 'right', turn: -1, left: control.right + RING + GAP + WIDTH - 2 * ORIGIN, foot },
  ];
  const free = sides
    .map((cling) => ({ cling, drawn: drawnAt(cling) }))
    .filter(({ drawn }) => inside(drawn, within) && keepClear.every((k) => overlap(drawn, k) === 0))
    .map(({ cling, drawn }) => ({ cling, covers: neighbours.reduce((sum, n) => sum + overlap(drawn, n), 0) }));
  if (!free.length) return null;
  const least = Math.min(...free.map((f) => f.covers));
  const best = free.filter((f) => f.covers <= least + WIDTH);
  if (best.length === 1 || !card) return best.at(-1)!.cling;
  // As free both ways: away from the card.
  const away = (card.left + card.right) / 2 < (control.left + control.right) / 2 ? 'right' : 'left';
  return best.find((f) => f.cling.side === away)!.cling;
}

/** What a Tutorial or the Tour asks of Bead while it is open (issue 151). */
export interface Guide {
  /** The control it points the way to, as the page finds it; null for none (a Tutorial's first card). */
  selector: string | null;
  /** What stands for the control while that is hidden: the Display button, for an option in its shut panel. */
  standIn: string | null;
  /** The Step or card shown: each new one, a bounce. */
  step: string;
  /** The Step made: a happy hop. */
  made: boolean;
  /** The Tutorial finished: the fountain. */
  finished: boolean;
}
