import type { LfoNumber } from '../patch/patch';
import type { Cling } from './mascotCling';
import type { Act } from './mascotMotion';
import { type Moving, nearestSpan, type Perch, type Span, type Visit } from './mascotPlace';

/** The drop's middle from its box's left, in pixels. */
export const DROP_MIDDLE = 9;
/** The spots tried along an edge, this many pixels apart. */
export const STEP = 4;

/** A line it may be on, in the window's pixels: a section's top edge, or the docked card's. */
export interface Line {
  id: string;
  box: { left: number; right: number; top: number };
}

/**
 * Thrown (issue 127), where it lands: of `edges`, the first under its middle that it comes down onto from its foot, a
 * pixel's leeway, where it comes down clear of what covers it (`clear`, its stretches along the edge), a step either
 * side: once landed, it walks off any text to stand (issue 181). Null while none is under it.
 */
export function landingEdge<E extends Line>(edges: readonly E[], at: { left: number; foot: number }, clear: (edge: E) => readonly Span[]): E | null {
  const middle = at.left + DROP_MIDDLE;
  return (
    edges
      .filter((e) => e.box.left <= middle && e.box.right >= middle && e.box.top >= at.foot - 1)
      .filter((e) => clear(e).some((c) => at.left >= c.min - STEP && at.left <= c.max + STEP))
      .sort((a, b) => a.box.top - b.box.top)[0] ?? null
  );
}

/** The edge its home is on in three and four across: the top right section's, the top row within a few pixels. */
export function homeEdge<E extends Line>(edges: readonly E[]): E {
  const top = Math.min(...edges.map((e) => e.box.top));
  return edges.filter((e) => e.box.top - top < 4).reduce((a, b) => (b.box.right > a.box.right ? b : a));
}

/** What `perchAcross` weighs, in the window's pixels. */
export interface PerchAcross<E extends Line> {
  /** The sections' edges, and its home among them. */
  edges: readonly E[];
  home: E;
  /** The section it is visiting, if any (issue 141). */
  visit: string | null;
  /** The docked card it may stand on (issue 192), if any. */
  card: E | null;
  /** Its box's left and its foot, where it was drawn last. */
  at: { left: number; foot: number };
  /** An edge with room above it in the window for it and its leaps, on the window. */
  inView: (edge: E) => boolean;
  /** An edge with somewhere along it clear of what covers the page and of its text, to stand (issues 164 and 181). */
  clear: (edge: E) => boolean;
  /** An edge with somewhere along it clear of what covers the page, text or not: somewhere it is seen (issue 192). */
  seen: (edge: E) => boolean;
}

/**
 * Which edge it is on in three and four across (issue 115): its home's, or the section's it visits (issue 141). That
 * edge covered (issue 164), the nearest edge in view and clear, from where it is; with none, the docked card's top if
 * that is clear; else its edge all the same, where with nowhere it is seen it waits out of sight behind it (issue 192).
 */
export function perchAcross<E extends Line>({ edges, home, visit, card, at, inView, clear, seen }: PerchAcross<E>): { on: E; perch: Perch } {
  let on = edges.find((e) => e.id === visit) ?? home;
  if (!clear(on)) {
    const off = ({ box }: E) => Math.hypot(Math.max(0, box.left - at.left, at.left - box.right), box.top - at.foot);
    const nearest = edges.filter((e) => inView(e) && clear(e)).sort((a, b) => off(a) - off(b))[0];
    on = nearest ?? (card && clear(card) ? card : on);
  }
  return { on, perch: { id: on.id, foot: on.box.top, hovering: false, ...(seen(on) ? {} : { waiting: true }) } };
}

/** A number at random from `a` to `b`. */
const between = ([a, b]: readonly [number, number], random: () => number) => a + random() * (b - a);
/** How long a visit or a ride lasts, in seconds (issue 141). */
const VISIT_SECONDS = [8, 18] as const;
/**
 * The next visit or ride, this many seconds on (issues 141 and 197): at first, and after pointing the way; after one; and
 * with nowhere to go when one was due. On a phone and in 2 × 2, a ride now and then, from the last one's end.
 */
const NEXT_VISIT = { first: [15, 35], after: [20, 40], nowhere: [10, 20] } as const;
const STACKED_RIDES = [15, 40] as const;

/**
 * Whether a visit or a ride is due now (issues 141 and 197): its time come and none under way, nor a Tutorial or the Tour
 * open, nor reduced motion, nor sent away; not in the middle of a funny turn, which plays to its end first (the owner,
 * 2026-10-30); and standing on its line, or on a phone and in 2 × 2 hovering too.
 */
export function visitDue(it: {
  visit: boolean; now: number; next: number; guided: boolean; reduced: boolean; leaving: boolean; doing: boolean; moving: Moving; stacked: boolean;
}): boolean {
  const still = it.moving === 'standing' || (it.stacked && it.moving === 'hovering');
  return !it.visit && it.now >= it.next && !it.guided && !it.reduced && !it.leaving && !it.doing && still;
}

/** When the next visit or ride comes, from `now`: at `first`, `after` one, or with `nowhere` to go when one was due. */
export const nextVisitAt = (now: number, why: keyof typeof NEXT_VISIT, stacked: boolean, random = Math.random) =>
  now + between(stacked && why !== 'first' ? STACKED_RIDES : NEXT_VISIT[why], random);

/** A visit or a ride chosen at `now`, for as long as one lasts. */
export const visitFor = (choice: Omit<Visit, 'until'>, now: number, random = Math.random): Visit => ({ ...choice, until: now + between(VISIT_SECONDS, random) });

/**
 * Whether the frame looks for the LFO plots in view: through a Demo part, to surf (issue 204); outside the Demo, with an
 * LFO to ride, on a ride or with a visit due (issue 141). Never else, so a frame costs no more while it stays home.
 */
export const looksForPlots = ({ demo, rides, visit, now, next }: { demo: boolean; rides: number; visit: Visit | null; now: number; next: number }) =>
  demo || (rides > 0 && (visit ? visit.ride !== undefined : now >= next));

/**
 * The plot it rides or surfs (issues 141, 197 and 204): on a ride, its LFO's among the `rideable` plots in view; else in
 * a Demo part whose act is to surf, the first of `plots`, those in view of an LFO that is on (the owner, 2026-10-30).
 * `surfing`, it is on that plot's line this frame: not with reduced motion, nor in the pointer's hold or thrown, nor on
 * a Demo plot in a funny turn, which plays where it is; on a ride the turn plays on the plot.
 */
export function ridePlot<P extends { lfo: LfoNumber }>({ visit, rideable, plots, act, reduced, moving, doing }: {
  visit: Visit | null; rideable: readonly P[]; plots: readonly P[]; act: Act | null; reduced: boolean; moving: Moving; doing: boolean;
}): { ride: P | undefined; plot: P | undefined; surfing: boolean } {
  const ride = visit?.ride ? rideable.find((p) => p.lfo === visit.ride) : undefined;
  const plot = act === 'surf' ? plots[0] : ride;
  const surfing = !!plot && !reduced && moving !== 'held' && moving !== 'thrown' && (!!ride || !doing);
  return { ride, plot, surfing };
}

/**
 * Pointing the way (issue 151), its next move to clinging beside the control at `cling`: `'cling'`, down the panel (or
 * across from beside another control of its Section, `sameSection`, or on to the one it slides to, `sameControl`) to
 * the control's side; else `{ edge }`, first its usual move to the spot nearest the control along its Section's `edge`
 * (the stretches clear for it there; none, out of reach), from which it slides down once standing there; with no spot
 * there, straight to the control once it has settled; or null, its way under way.
 * `onSection`, its edge last frame was that Section's; `left`, its box's left as drawn.
 */
export function clingMove({ cling, edge, moving, sameSection, sameControl, onSection, left }: {
  cling: Cling; edge: readonly Span[]; moving: Moving; sameSection: boolean; sameControl: boolean; onSection: boolean; left: number;
}): 'cling' | { edge: number } | null {
  const sliding = moving === 'sliding' || moving === 'clinging';
  const along = nearestSpan(edge, cling.left);
  const spot = along && Math.min(along.max, Math.max(along.min, cling.left));
  const settled = moving === 'standing' || moving === 'hovering' || moving === 'landing';
  const atSpot = spot !== null && onSection && moving === 'standing' && Math.abs(left - spot) < 1.5;
  if ((sliding && (sameSection || sameControl)) || atSpot || (spot === null && (settled || sliding))) return 'cling';
  return spot === null ? null : { edge: spot };
}

/**
 * Whether it stays where it clings, `stay`, beside the last control while the next is out of reach: only where it need
 * not turn round to look at the next, at `aimX` across the window: its place was found clear of text for its facing
 * alone, and turned and aiming, its drawing may reach over it (issue 210: beside the Display button, turned to the
 * Tutorial button, over About).
 */
export const staysBeside = (stay: Cling, aimX: number | null) => aimX === null || (aimX < stay.left + DROP_MIDDLE ? -1 : 1) === stay.turn;
