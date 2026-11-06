import { type Lfo, type LfoNumber, lfoHz } from '../patch/patch';
import { HEIGHT, TURNED_PAST, WIDTH } from './mascotCling';

/**
 * A line the mascot can be on (issue 115), in the window's pixels: a section's top edge it stands on, or, with none in
 * view, a line a little under the header (or a phone's section tabs) where it hovers on its tail (issue 142). `foot` is
 * where the bottom of its drawing goes: on the edge, or `HOVER_UNDER` lower than a drop's height under the header.
 */
export interface Perch {
  id: string;
  foot: number;
  hovering: boolean;
  /**
   * Beside a control a Tutorial's Step or a Tour card is about (issue 151): it slides there down the panel, like a drop
   * on glass, and clings at its side, its span's one spot, following it as the page scrolls.
   */
  cling?: boolean;
  /** With nowhere clear to be, not even its hover line: out of sight, under the header or the tabs or behind its edge (issue 192). */
  waiting?: boolean;
}

/**
 * How it is on its line, or between two; or in the pointer's hold, or thrown from it (issue 127); or sliding down the
 * panel to a control and clinging at its side (issue 151).
 */
export type Moving = 'standing' | 'hovering' | 'falling' | 'flying' | 'landing' | 'held' | 'thrown' | 'sliding' | 'clinging';
/** Settled on its line: standing, hovering, or landing there. */
export const settled = (moving: Moving) => moving === 'standing' || moving === 'hovering' || moving === 'landing';
/** Pointing the way (issue 151): sliding down the panel to a control, or clinging at its side. */
export const pointingTheWay = (moving: Moving) => moving === 'sliding' || moving === 'clinging';
/** In the pointer's hold, or thrown from it (issue 127). */
export const inHand = (moving: Moving) => moving === 'held' || moving === 'thrown';

/** Hovering, how far under the header (or the section tabs) its top is, in pixels, at the bottom of its bob (issue 142). */
export const HOVER_UNDER = 6;

/**
 * The longest step of its motion in one frame, in seconds: a frame later than that (a slow device, a tab coming back)
 * moves it no farther, so in a window drawing fewer than 20 frames a second it moves slower than the clock.
 */
export const LONGEST_STEP = 0.05;

/** Where along a line it may stand: its box's left, in the window's pixels. */
export interface Span {
  min: number;
  max: number;
}

/** Where it is this frame. */
export interface Placed {
  foot: number;
  /** Between lines, its place across the window, which it alone decides then; null on a line. */
  x: number | null;
  moving: Moving;
  /** Flying up, its tail is pushing. */
  thrust: boolean;
  /** Flying up, how far it has swung its tail down under it first (0 to 1), and still before taking off. */
  windup: number;
  /** Its speed across and down the window, in pixels a second. */
  vx: number;
  vy: number;
  /** Falling or flying, how far across its leap goes, from where it set off to where it lands (issue 179); else 0. */
  leap: number;
  /** Landing: how far through (0 to 1), and how hard it hit (0 to 1). */
  landed: number;
  impact: number;
  /** The frame it lands: where, across the window, so its stroll carries on from there. */
  landedAt: number | null;
}

/** Gravity, in pixels a second squared. */
export const GRAVITY = 2200;
/** Its tail's push, flying up: twice gravity, so it pushes for half the way. */
const THRUST = 2 * GRAVITY;
/** Before it takes off, it swings its tail down under it, crouching. */
export const WINDUP_SECONDS = 0.25;
/** How far it clears an edge it flies up to, in pixels, before dropping onto it. */
const CLEARANCE = 8;
/** Stepping off an edge, its little hop up, in pixels a second. */
const HOP_OFF = 180;
/** The fastest it can be thrown, in pixels a second. */
export const FASTEST_THROW = 1800;
/** Thrown against a side of the window, it bounces back with this much of its speed. */
const BOUNCE = 0.5;
/** Taking off to hover, its fastest, in pixels a second, and how fast it eases onto its hover line: its way left, a second. */
const HOVER_SPEED = 500;
const HOVER_EASE = 8;
/** Hovering, its bob up and back, in pixels, and how many bobs a second. */
const HOVER_BOB = 3;
const BOBS_A_SECOND = 0.8;
/** The speed of a landing that splashes it flattest, in pixels a second. */
const HARD_LANDING = 1400;
/** Landing: the splash, the squash and its wobble back. */
export const LANDING_SECONDS = 0.7;
/** Sliding down the panel to a control: its fastest, in pixels a second, and how it eases in at the end (its way left, a second). */
const SLIDE_SPEED = 400;
const SLIDE_EASE = 6;
/** The slowest it slides, in pixels a second, so the end of its way does not drag on. */
const SLIDE_SLOWEST = 30;

/**
 * Where it is across the window this frame: in the air, where its fall or flight has it; the frame it lands, where it
 * landed (its stroll takes that up only from the next frame); else where its stroll has it.
 */
export const acrossOf = (placed: Placed, strolling: number) => placed.x ?? placed.landedAt ?? strolling;

/** A box drawn over the page, in the window's pixels: a docked card, a tip, an open panel (issue 164). */
export interface Cover {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Its drawing, as boxes against its box's left and its foot: what it covers of the page, standing there. */
export type Drawing = readonly Cover[];

/** Its box alone, as wide and as high as it is drawn over its foot. */
export const BOX: Drawing = [{ left: 0, right: WIDTH, top: -HEIGHT, bottom: 0 }];

/** Its tail leaves its drop this far across its box, as drawn, and swings down under its foot this far, standing (issue 181). */
const TAIL_FROM = 18;
export const SWUNG_BELOW = 20;
/**
 * Resting, how far its drawing may still reach past its box, in pixels: stretched taller by the Amp's level (a tenth),
 * breathing as it dozes, leaning with the LFOs (issue 181).
 */
export const LEEWAY = 3;

/**
 * Its whole drawing on a line (issues 181 and 192): its box, and its Detune twin `twin` pixels off on its side (issue
 * 174), as high as `above` over its box (a plot it surfs, under it). Out of sight under a cover is out of sight however
 * it faces, so for covers its tail turned round past its box's left too (strolling right, pointing the way, a funny
 * turn, issue 179). Over text is where it rests, facing as drawn, the logo's way (179): there, `resting`, its tail
 * swung down under its foot (a wag) instead, which a cover never meets (a card's top is its
 * line), and `LEEWAY` all round.
 */
export function drawingOf({ twin = 0, resting = false, above = 0 }: { twin?: number; resting?: boolean; above?: number } = {}): Drawing {
  const [left, right] = [Math.min(0, twin), Math.max(0, twin)];
  if (!resting) return [{ left: left - TURNED_PAST, right: WIDTH + right, top: -HEIGHT - above, bottom: 0 }];
  return [
    { left: left - LEEWAY, right: WIDTH + right + LEEWAY, top: -HEIGHT - above - LEEWAY, bottom: 0 },
    { left: TAIL_FROM + left - LEEWAY, right: WIDTH + right + LEEWAY, top: 0, bottom: SWUNG_BELOW },
  ];
}

/**
 * The stretches of a line where the drop, its foot on the line, covers none of `covers` with its `drawing` (issues 164
 * and 192): its box's lefts, left to right, its box on the line. A cover over its head by a pixel or more takes the
 * spots under it; one whose bottom is at its head, or whose top is on the line (but for a drawing reaching under it),
 * takes none.
 */
export function clearAlong(line: { left: number; right: number; top: number }, covers: readonly Cover[], drawing: Drawing): Span[] {
  let spans: Span[] = line.right - WIDTH >= line.left ? [{ min: line.left, max: line.right - WIDTH }] : [];
  for (const c of covers) {
    for (const d of drawing) {
      if (c.top >= line.top + d.bottom || c.bottom <= line.top + d.top) continue;
      // The lefts that would put this part of its drawing over the cover.
      const [from, to] = [c.left - d.right, c.right - d.left];
      spans = spans.flatMap((s) => {
        if (to <= s.min || from >= s.max) return [s];
        return [...(from >= s.min ? [{ min: s.min, max: from }] : []), ...(to <= s.max ? [{ min: to, max: s.max }] : [])];
      });
    }
  }
  return spans;
}

/**
 * Of the docked cards, in the page's order (the later drawn over the earlier, as the Demo's "stopped" card under a
 * Tutorial's), the one it stands on (issue 192): the topmost with room along its top for its `drawing`, clear of the
 * cards over it; null for none.
 */
export function standingCard<C extends Cover>(cards: readonly C[], drawing: Drawing): C | null {
  for (let i = cards.length - 1; i >= 0; i--) {
    const c = cards[i];
    if (clearAlong({ left: c.left, right: c.right, top: c.top }, cards.slice(i + 1), drawing).length) return c;
  }
  return null;
}

/** Of `spans`, the one nearest to `x` (the first of two as near), or null if there is none. */
export const nearestSpan = (spans: readonly Span[], x: number): Span | null => {
  const off = (s: Span) => Math.max(0, s.min - x, x - s.max);
  return spans.reduce<Span | null>((a, b) => (a === null || off(b) < off(a) ? b : a), null);
};

/** A section's top edge, in the window's pixels: the sections it may stand on, top to bottom. */
export interface Edge {
  id: string;
  top: number;
  /** A card, a tip or a panel over it leaves no room along it for the drop (issue 164). */
  covered?: boolean;
}

/** How far over the window's bottom an edge must be for it to go there, in pixels; the edge it is on, it keeps to the bottom. */
const TAKEABLE_OVER_BOTTOM = 4;

/** What choosePerch weighs, in the window's pixels. */
export interface PerchChoice {
  /** The edge it is on now, if any. */
  current: string | null;
  edges: readonly Edge[];
  /** The top edge of the docked card (the Demo's, a Tutorial's, the Tour's), if one is docked (issue 164). */
  card?: Edge | null;
  /** The bottom of the header (and the section strip): nothing above it is in view. */
  ceiling: number;
  /** How far its top may go over the ceiling, standing on an edge just under it: over the section strip, drawn above it. */
  overlap: number;
  /** The window's bottom. */
  bottom: number;
  /** The drop's height, and the room it needs over it. */
  height: number;
  headroom: number;
  /** Where its foot is now. */
  where: number;
  /** A card, a tip or a panel over its hover line, all along it (issue 192). */
  hoverCovered?: boolean;
}

/**
 * Which line to be on, on a phone or in 2 × 2 (issue 115), where it must stay in view: a section's top edge with room
 * over it below the header, and on the window, else a line a little under the header to hover on (issue 142). It keeps its edge while that has
 * room for the drop, or `overlap` less; moving, it takes the edge nearest to where it is. With no edge roomy enough, an
 * edge just under the ceiling, the drop over it by up to `overlap`, rather than hover just off that line (issue 142).
 * An edge a card, a tip or a panel covers is never kept nor taken; with every edge in view covered, it stands on the
 * docked card's top edge until one is clear again (issue 164). With its hover line covered too, it waits out of sight,
 * tucked up under the header or the tabs, rather than hover under the cover (issue 192).
 */
export function choosePerch({ current, edges, card = null, ceiling, overlap, bottom, height, headroom, where, hoverCovered = false }: PerchChoice): Perch {
  const fits = (e: Edge) => e.top - height >= ceiling - overlap;
  const inView = (e: Edge) => e.top <= bottom;
  const takeable = (e: Edge) => e.top <= bottom - TAKEABLE_OVER_BOTTOM;
  const clear = edges.filter((e) => !e.covered);
  const keep = clear.find((e) => e.id === current && fits(e) && inView(e));
  if (keep) return { id: keep.id, foot: keep.top, hovering: false };
  const roomy = clear.filter((e) => takeable(e) && e.top - height - headroom >= ceiling);
  const fitting = clear.filter((e) => takeable(e) && fits(e));
  const nearest = (list: readonly Edge[]) => list.reduce((a, b) => (Math.abs(b.top - where) < Math.abs(a.top - where) ? b : a));
  const hidden = edges.some((e) => e.covered && fits(e) && inView(e));
  const onCard = card && !card.covered && hidden && fits(card) && inView(card) ? card : null;
  const chosen = roomy.length ? nearest(roomy) : fitting.length ? nearest(fitting) : onCard;
  if (chosen) return { id: chosen.id, foot: chosen.top, hovering: false };
  const hover = ceiling + height + HOVER_UNDER;
  return hoverCovered ? { id: 'waiting', foot: hover, hovering: true, waiting: true } : { id: 'ceiling', foot: hover, hovering: true };
}

/**
 * Where the mascot is between its lines (issue 115), by the laws of motion. On its line it follows it as the page
 * scrolls. To a lower one it hops off its edge (or lets go of the header) and falls under gravity, across to a spot in
 * the new line's span, landing as hard as it fell. To a higher one it swings its tail down under it, then the tail
 * pushes it up until it has just the speed to clear the edge, and it coasts over and drops onto it. To a line at its
 * own height (a section beside it), the same, in an arc the higher the farther it goes. With no edge in view it takes off at once, its tail whirling,
 * and eases onto its hover line, at its own spot across, bobbing there (issue 142); from it, it drops with no hop, or
 * flies up without crouching.
 * `from` starts it falling from that height (an arrival from the top of the window). With reduced motion it is on the
 * new line at once.
 */
export function createMascotPlace({ from, random = Math.random }: { from?: number; random?: () => number } = {}) {
  let on: string | null = null; // the line it is on, or flying or falling to
  let foot = 0;
  let x = 0;
  let toX = 0;
  let leapFrom = 0; // where across its leap set off
  let vx = 0;
  let vy = 0;
  let moving: Moving = 'standing';
  let thrust = false;
  let windupFrom = -Infinity;
  let clearance = CLEARANCE;
  let landedAt = -Infinity;
  let hoverSince = -Infinity;
  let impact = 0;
  let last: number | null = null;
  let walls: Span = { min: -Infinity, max: Infinity };
  // Let go near a plot it rides (issue 197): it drops from the pointer's hold, its throw given up, onto the line.
  let droppedOntoLine = false;
  const placed = (landedX: number | null = null): Placed => ({
    foot,
    x: moving === 'falling' || moving === 'flying' || moving === 'held' || moving === 'thrown' || moving === 'sliding' || moving === 'clinging' ? x : null,
    moving,
    thrust: moving === 'flying' && thrust,
    windup: moving === 'flying' ? Math.min(1, (last! - windupFrom) / WINDUP_SECONDS) : 1,
    vx,
    vy,
    leap: moving === 'falling' || moving === 'flying' ? toX - leapFrom : 0,
    landed: moving === 'landing' ? Math.min(1, (last! - landedAt) / LANDING_SECONDS) : 1,
    impact,
    landedAt: landedX,
  });
  /** A spot in `span` for it to land: where it is if that is in it, else one at random. */
  const spotIn = (span: Span, at: number) => (at >= span.min && at <= span.max ? at : span.min + random() * (span.max - span.min));

  return {
    /** Held by the pointer (issue 127), its box's left at `across` and its foot at `down`, in the window's pixels. */
    hold(across: number, down: number) {
      x = toX = across;
      foot = down;
      vx = vy = 0;
      moving = 'held';
    },
    /** Let go at this speed (capped): it flies under gravity, bouncing off the window's sides, `between` its lefts. */
    toss(speedAcross: number, speedDown: number, between: Span) {
      if (moving !== 'held') return;
      const speed = Math.hypot(speedAcross, speedDown);
      const scale = speed > FASTEST_THROW ? FASTEST_THROW / speed : 1;
      vx = speedAcross * scale;
      vy = speedDown * scale;
      walls = between;
      moving = 'thrown';
    },
    /**
     * Let go near an LFO plot it rides (issue 197): its throw given up, it drops from where it is held onto the line, at
     * its nearest spot along it; held under the line, it flies up onto it at once, its tail already under it.
     */
    dropOntoLine() {
      if (moving !== 'held') return;
      vx = vy = 0;
      moving = 'falling';
      droppedOntoLine = true;
      on = '';
    },
    /** This frame, on `perch` (whose span is `span`), at `at` across the window when on its line. */
    frame(perch: Perch, span: Span, now: number, reduced: boolean, at: number): Placed {
      const dt = last === null ? 0 : Math.min(LONGEST_STEP, now - last);
      last = now;
      const restsAs: Moving = perch.hovering ? 'hovering' : 'standing';
      if (moving === 'held') {
        on = perch.id;
        return placed();
      }
      if (moving === 'thrown') {
        // Free under gravity: it lands on the line when it comes down onto it from above; under it, it flies back up.
        on = perch.id;
        const before = foot;
        vy += GRAVITY * dt;
        foot += vy * dt;
        x += vx * dt;
        if (x < walls.min || x > walls.max) {
          x = Math.min(walls.max, Math.max(walls.min, x));
          vx = -vx * BOUNCE;
        }
        if (vy > 0 && before <= perch.foot && foot >= perch.foot) {
          foot = perch.foot;
          impact = Math.min(1, vy / HARD_LANDING);
          moving = perch.hovering ? 'hovering' : 'landing';
          landedAt = now;
          if (perch.hovering) hoverSince = now;
          vx = vy = 0;
          return placed(x);
        }
        if (vy > 0 && foot > perch.foot) {
          toX = spotIn(span, x);
          leapFrom = x;
          windupFrom = -Infinity;
          clearance = CLEARANCE;
          moving = 'flying';
          thrust = true;
        }
        return placed();
      }
      if (perch.cling && !reduced) {
        // Beside a control (issue 151): from its line, where its stroll has it, or from beside another, where it clings,
        // it slides there down the panel, easing in, and clings, following the control. Coming in there, it is there.
        if (on === null) moving = 'clinging';
        else if (perch.id !== on) {
          if (!pointingTheWay(moving)) x = at;
          moving = 'sliding';
        }
        on = perch.id;
        const [offX, offY] = [span.min - x, perch.foot - foot];
        const away = Math.hypot(offX, offY);
        const step = Math.max(SLIDE_SLOWEST, Math.min(SLIDE_SPEED, SLIDE_EASE * away)) * dt;
        if (moving === 'clinging' || away <= 0.5 || step >= away) {
          const arrived = moving === 'sliding';
          x = span.min;
          foot = perch.foot;
          vx = vy = 0;
          moving = 'clinging';
          return placed(arrived ? x : null);
        }
        x += (offX / away) * step;
        foot += (offY / away) * step;
        [vx, vy] = dt > 0 ? [((offX / away) * step) / dt, ((offY / away) * step) / dt] : [0, 0];
        return placed();
      }
      if (on === null || reduced) {
        const arriving = on === null && !reduced && from !== undefined && !perch.hovering;
        on = perch.id;
        if (arriving) {
          foot = from;
          x = toX = leapFrom = at;
          vx = vy = 0;
          moving = 'falling';
        } else {
          foot = perch.foot;
          moving = restsAs;
          hoverSince = now;
          return placed();
        }
      }
      if (perch.id !== on) {
        on = perch.id;
        const dropped = droppedOntoLine;
        droppedOntoLine = false;
        // Leaving a control's side, from where it clung; let go near a plot, from where it was held.
        if (!pointingTheWay(moving) && !dropped) x = at;
        toX = dropped ? Math.min(span.max, Math.max(span.min, x)) : spotIn(span, at);
        leapFrom = x;
        if (dropped && !perch.hovering) {
          // Dropped onto its line, or flying up onto it from under it.
          if (perch.foot < foot) {
            windupFrom = -Infinity;
            clearance = CLEARANCE;
            moving = 'flying';
            thrust = true;
          }
        } else if (moving === 'hovering' && perch.hovering) foot = perch.foot;
        else if (perch.hovering) {
          // Losing ground: it takes off at once, its tail whirling, for its hover line (issue 142).
          windupFrom = -Infinity;
          moving = 'flying';
          thrust = true;
          vx = 0;
        } else if (perch.foot > foot) {
          // Down: a hop off its edge, the bigger the farther across it goes; hovering, its tail stops and it drops.
          vy = moving === 'hovering' ? 0 : -(HOP_OFF + Math.min(420, Math.abs(toX - x) * 0.5));
          moving = 'falling';
        } else {
          // Up: its tail swung down under it, then a push. From the air, or hovering, at once.
          windupFrom = moving === 'falling' || moving === 'flying' || moving === 'hovering' ? -Infinity : now;
          // Over the edge by a little, or, going far across (a section beside it), in a higher arc.
          // Its top stays in the window: the arc goes no higher than the drop's height under its top.
          clearance = Math.max(CLEARANCE, Math.min(CLEARANCE + Math.min(160, Math.abs(toX - x) * 0.3), perch.foot - 30));
          moving = 'flying';
          thrust = true;
          vy = Math.min(vy, 0);
        }
      }
      if (moving === 'flying' && perch.hovering) {
        // Onto its hover line, faster the farther it is, its tail whirling, to its spot across.
        const off = perch.foot - foot;
        const step = Math.sign(off) * Math.min(HOVER_SPEED, HOVER_EASE * Math.abs(off)) * dt;
        if (Math.abs(off) <= 0.5 || Math.abs(step) >= Math.abs(off)) {
          foot = perch.foot;
          moving = 'hovering';
          hoverSince = now;
          x = toX;
          vx = vy = 0;
          return placed(toX);
        }
        foot += step;
        const across = (toX - x) * Math.min(1, HOVER_EASE * dt);
        x += across;
        [vx, vy] = dt > 0 ? [across / dt, step / dt] : [0, 0];
        return placed();
      }
      if (moving === 'flying' && now - windupFrom < WINDUP_SECONDS) {
        // Still on its old line, the page's scroll aside; across, nothing yet.
        vx = 0;
        return placed();
      }
      if (moving === 'falling' || moving === 'flying') {
        const goal = perch.foot;
        const pushing = moving === 'flying' && thrust;
        vy += (GRAVITY - (pushing ? THRUST : 0)) * dt;
        foot += vy * dt;
        if (pushing) {
          // Enough speed to coast up to just over the line: the tail stops pushing.
          const above = foot - (goal - clearance);
          if (vy < 0 && vy * vy >= 2 * GRAVITY * Math.max(0, above)) thrust = false;
        }
        // Across: at the speed that brings it over its spot when it comes down onto the line, the time till then solving
        // down = vy t + GRAVITY t² / 2 (down is positive, so rising, vy < 0, leaves it longer).
        const down = goal - foot;
        const timeLeft = pushing ? 0.35 : (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * GRAVITY * Math.max(0, down)))) / GRAVITY;
        vx = (toX - x) / Math.max(0.05, timeLeft);
        x += vx * dt;
        if (!pushing && vy > 0 && foot >= goal) {
          foot = goal;
          impact = Math.min(1, vy / HARD_LANDING);
          moving = 'landing';
          landedAt = now;
          x = toX;
          vx = vy = 0;
          return placed(toX);
        }
        return placed();
      }
      foot = perch.foot;
      if (moving === 'landing' && now - landedAt >= LANDING_SECONDS) moving = restsAs;
      if (moving !== 'landing') moving = restsAs;
      // Hovering, it bobs gently up from its line and back; with reduced motion, still.
      if (moving === 'hovering' && !reduced) foot -= (HOVER_BOB * (1 - Math.cos(2 * Math.PI * BOBS_A_SECOND * (now - hoverSince)))) / 2;
      return placed();
    },
  };
}

/**
 * Thrown, the sides it bounces off (issue 127): the page's, in the window's pixels, its box's lefts between them. Below
 * 320 px wide the page is wider than the window, which scrolls sideways (issue 157): its walls are still the page's
 * (issue 192).
 */
export const throwWalls = (page: { left: number; right: number }): Span => ({ min: page.left, max: page.right - WIDTH });

/** A visit to another section, or a ride on an LFO's plot (issue 141), until `until`. */
export interface Visit {
  id: string;
  until: number;
  ride?: LfoNumber;
}

/**
 * Whether a visit ends now: its time up, but while a Tutorial or the Tour is open (issue 151); its section out of view or
 * covered; or a ride's LFO no longer one to ride (its Depth, Waveform or Rate, the Demo, reduced motion) or its plot out
 * of view, or it picked up, sent away or a Tutorial or the Tour opening (issues 141, 151). The window turning to the
 * stacked layout ends a visit: there it keeps to its column (issue 192); but not a ride, which it makes there too (issue
 * 197).
 */
export function visitEnds(
  visit: Visit,
  now: { now: number; stacked: boolean; rideable: readonly LfoNumber[]; inView: readonly string[]; held: boolean; leaving: boolean; guided: boolean },
): boolean {
  if (now.stacked && !visit.ride) return true;
  if (now.now >= visit.until && !now.guided) return true;
  return visit.ride ? !now.rideable.includes(visit.ride) || now.held || now.leaving || now.guided : !now.inView.includes(visit.id);
}

/** A ride on LFO `lfo`'s plot, as a visit (issue 141). */
export const rideOf = (lfo: LfoNumber): Omit<Visit, 'until'> => ({ id: `ride ${lfo}`, ride: lfo });

/**
 * Where it goes when a visit is due (issue 197): a ride first, on one of the LFOs `rides` at random, as rides come
 * seldom; with none, one of the sections `inView` at random (issue 141); with neither, nowhere.
 */
export function chooseVisit(rides: readonly LfoNumber[], inView: readonly string[], random = Math.random): Omit<Visit, 'until'> | null {
  if (rides.length) return rideOf(rides[Math.floor(random() * rides.length)]);
  return inView.length ? { id: inView[Math.floor(random() * inView.length)] } : null;
}

/** Dropped this near an LFO's plot, in pixels, it rides it (issue 197): its own width. */
const NEAR_PLOT = WIDTH;

/**
 * Dropped from the pointer's hold with its box at `bead` (issue 197): the LFO of `rideable` whose plot its box is over
 * or within `NEAR_PLOT` of, the nearest, which it rides; null near none, or only near a plot it may not ride (a Saw, a
 * Square, too fast, at Depth 0), when it lands as anywhere.
 */
export function rideOnDrop(bead: Cover, plots: readonly { lfo: LfoNumber; box: Cover }[], rideable: readonly LfoNumber[]): LfoNumber | null {
  const off = ({ box }: { box: Cover }) =>
    Math.hypot(Math.max(0, box.left - bead.right, bead.left - box.right), Math.max(0, box.top - bead.bottom, bead.top - box.bottom));
  const near = plots.filter((p) => rideable.includes(p.lfo) && off(p) <= NEAR_PLOT).sort((a, b) => off(a) - off(b));
  return near[0]?.lfo ?? null;
}

/** The fastest LFO it rides, in Hz (issue 141): slower, its plot draws a swell it can stand on. */
const RIDE_HZ = 1;

/**
 * The LFOs it may ride now and then, outside the Demo (issue 141), as `lfos` are at `bpm`: those that are on (their Depth
 * above 0), a Sine or a Triangle (a Saw's or a Square's cliff would throw it off), at 1 Hz or slower, or synced, the Hz
 * their note value gives (issue 112). None while the Demo plays (its acts rule there), nor with reduced motion.
 */
export function ridesFor(lfos: readonly Lfo[], bpm: number, { demo, reduced }: { demo: boolean; reduced: boolean }): LfoNumber[] {
  if (demo || reduced) return [];
  // A hair over 1 Hz still counts: a synced note value's Hz is worked out in floating point (a 1/4 at 60 BPM).
  return lfos.flatMap((lfo, i) =>
    lfo.amount > 0 && (lfo.waveform === 'sine' || lfo.waveform === 'triangle') && lfoHz(lfo, bpm) <= RIDE_HZ + 1e-9 ? [(i + 1) as LfoNumber] : [],
  );
}

/** The steepest it leans on its surfboard, in degrees (issue 204). */
const STEEPEST_SURF = 35;

/**
 * On its surfboard (issue 204): its lean, in degrees, positive to the right, with its board along the line under it,
 * which is at `before` and `after` px down the window `across` px apart. Going down the wave it so leans forward, and
 * going up it leans back, whichever way it goes; never steeper than `STEEPEST_SURF`.
 */
export function surfLean(before: number, after: number, across: number): number {
  const degrees = (Math.atan2(after - before, across) * 180) / Math.PI;
  return Math.max(-STEEPEST_SURF, Math.min(STEEPEST_SURF, degrees)) || 0;
}
