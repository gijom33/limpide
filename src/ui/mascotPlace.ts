/**
 * A line the mascot can be on (issue 115), in the window's pixels: a section's top edge it stands on, or the header's
 * bottom it hangs from. `foot` is where the bottom of its drawing goes: on the edge, or a drop's height under the header.
 */
export interface Perch {
  id: string;
  foot: number;
  hanging: boolean;
}

/** How it is on its line, or between two. */
export type Moving = 'standing' | 'hanging' | 'falling' | 'flying' | 'landing';

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
/** The speed of a landing that splashes it flattest, in pixels a second. */
const HARD_LANDING = 1400;
/** Landing: the splash, the squash and its wobble back. */
export const LANDING_SECONDS = 0.7;

/**
 * Where it is across the window this frame: in the air, where its fall or flight has it; the frame it lands, where it
 * landed (its stroll takes that up only from the next frame); else where its stroll has it.
 */
export const acrossOf = (placed: Placed, strolling: number) => placed.x ?? placed.landedAt ?? strolling;

/** A section's top edge, in the window's pixels: the sections it may stand on, top to bottom. */
export interface Edge {
  id: string;
  top: number;
}

/**
 * Which line to be on, on a phone or in 2 × 2 (issue 115), where it must stay in view: a section's top edge with room
 * over it below the header, and on the window, else the header's bottom to hang from. It keeps its edge while that has
 * room for the drop; moving, it takes the edge nearest to where it is.
 */
export function choosePerch(current: string | null, edges: readonly Edge[], ceiling: number, bottom: number, height: number, headroom: number, where: number): Perch {
  const keep = edges.find((e) => e.id === current && e.top - height >= ceiling && e.top <= bottom);
  if (keep) return { id: keep.id, foot: keep.top, hanging: false };
  const roomy = edges.filter((e) => e.top - height - headroom >= ceiling && e.top <= bottom - 4);
  if (!roomy.length) return { id: 'ceiling', foot: ceiling + height, hanging: true };
  const nearest = roomy.reduce((a, b) => (Math.abs(b.top - where) < Math.abs(a.top - where) ? b : a));
  return { id: nearest.id, foot: nearest.top, hanging: false };
}

/**
 * Where the mascot is between its lines (issue 115), by the laws of motion. On its line it follows it as the page
 * scrolls. To a lower one it hops off its edge (or lets go of the header) and falls under gravity, across to a spot in
 * the new line's span, landing as hard as it fell. To a higher one it swings its tail down under it, then the tail
 * pushes it up until it has just the speed to clear the edge, and it coasts over and drops onto it. To a line at its
 * own height (a section beside it), the same, in an arc the higher the farther it goes. Hanging, it climbs to the header the same way and holds on.
 * `from` starts it falling from that height (an arrival from the top of the window). With reduced motion it is on the
 * new line at once.
 */
export function createMascotPlace({ from, random = Math.random }: { from?: number; random?: () => number } = {}) {
  let on: string | null = null; // the line it is on, or flying or falling to
  let foot = 0;
  let x = 0;
  let toX = 0;
  let vx = 0;
  let vy = 0;
  let moving: Moving = 'standing';
  let thrust = false;
  let windupFrom = -Infinity;
  let clearance = CLEARANCE;
  let landedAt = -Infinity;
  let impact = 0;
  let last: number | null = null;
  const placed = (landedX: number | null = null): Placed => ({
    foot,
    x: moving === 'falling' || moving === 'flying' ? x : null,
    moving,
    thrust: moving === 'flying' && thrust,
    windup: moving === 'flying' ? Math.min(1, (last! - windupFrom) / WINDUP_SECONDS) : 1,
    vx,
    vy,
    landed: moving === 'landing' ? Math.min(1, (last! - landedAt) / LANDING_SECONDS) : 1,
    impact,
    landedAt: landedX,
  });
  /** A spot in `span` for it to land: where it is if that is in it, else one at random. */
  const spotIn = (span: Span, at: number) => (at >= span.min && at <= span.max ? at : span.min + random() * (span.max - span.min));

  return {
    /** This frame, on `perch` (whose span is `span`), at `at` across the window when on its line. */
    frame(perch: Perch, span: Span, now: number, reduced: boolean, at: number): Placed {
      const dt = last === null ? 0 : Math.min(0.05, now - last);
      last = now;
      const settled: Moving = perch.hanging ? 'hanging' : 'standing';
      if (on === null || reduced) {
        const arriving = on === null && !reduced && from !== undefined && !perch.hanging;
        on = perch.id;
        if (arriving) {
          foot = from;
          x = toX = at;
          vx = vy = 0;
          moving = 'falling';
        } else {
          foot = perch.foot;
          moving = settled;
          return placed();
        }
      }
      if (perch.id !== on) {
        on = perch.id;
        x = at;
        toX = spotIn(span, at);
        if (moving === 'hanging' && perch.hanging) foot = perch.foot;
        else if (perch.foot > foot) {
          // Down: a hop off its edge, the bigger the farther across it goes, or letting go of the header.
          vy = moving === 'hanging' ? 0 : -(HOP_OFF + Math.min(420, Math.abs(toX - x) * 0.5));
          moving = 'falling';
        } else {
          // Up: its tail swung down under it, then a push. From the air, at once.
          windupFrom = moving === 'falling' || moving === 'flying' ? -Infinity : now;
          // Over the edge by a little, or, going far across (a section beside it), in a higher arc.
          // Its top stays in the window: the arc goes no higher than the drop's height under its top.
          clearance = Math.max(CLEARANCE, Math.min(CLEARANCE + Math.min(160, Math.abs(toX - x) * 0.3), perch.foot - 30));
          moving = 'flying';
          thrust = true;
          vy = Math.min(vy, 0);
        }
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
          if (perch.hanging && foot <= goal) {
            foot = goal;
            moving = 'hanging';
            vx = vy = 0;
            return placed(toX);
          }
        }
        // Across: at the speed that brings it over its spot when it comes down onto the line.
        const down = goal - foot;
        const timeLeft = pushing ? 0.35 : (vy + Math.sqrt(Math.max(0, vy * vy + 2 * GRAVITY * Math.max(0, down)))) / GRAVITY;
        vx = (toX - x) / Math.max(0.05, timeLeft);
        x += vx * dt;
        if (!pushing && vy > 0 && foot >= goal) {
          foot = goal;
          impact = Math.min(1, vy / HARD_LANDING);
          moving = perch.hanging ? 'hanging' : 'landing';
          landedAt = now;
          x = toX;
          vx = vy = 0;
          return placed(toX);
        }
        return placed();
      }
      foot = perch.foot;
      if (moving === 'landing' && now - landedAt >= LANDING_SECONDS) moving = settled;
      if (moving !== 'landing') moving = settled;
      return placed();
    },
  };
}
