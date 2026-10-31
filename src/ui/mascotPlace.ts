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
export type Moving = 'standing' | 'hanging' | 'falling' | 'landing' | 'flying';

/** Falling as rain: its gravity, in pixels a second squared. */
const GRAVITY = 2400;
/** Flying up on its tail: its push, and its top speed, in pixels a second. */
const PUSH = 1800;
const TOP_SPEED = 520;
/** Landing: the splash and its recovery, in seconds. */
export const LANDING_SECONDS = 0.45;

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
 * Where the mascot is between its lines (issue 115). On its line it follows it as the page scrolls. To a lower one it
 * falls like rain, faster and faster, and lands with a splash; to a higher one it flies up on its tail. With reduced
 * motion it is on the new line at once.
 */
export function createMascotPlace() {
  let on: string | null = null; // the line it is on, or flying or falling to
  let foot = 0;
  let moving: Moving = 'standing';
  let speed = 0;
  let landedAt = -Infinity;
  let last: number | null = null;
  return {
    frame(perch: Perch, now: number, reduced: boolean): { foot: number; moving: Moving; landed: number } {
      const dt = last === null ? 0 : Math.min(0.1, now - last);
      last = now;
      const settled: Moving = perch.hanging ? 'hanging' : 'standing';
      if (on === null || reduced) {
        on = perch.id;
        foot = perch.foot;
        moving = settled;
        return { foot, moving, landed: 1 };
      }
      if (perch.id !== on) {
        on = perch.id;
        // A hanging drop whose header moves comes with it; any other change of line is a fall or a flight.
        moving = perch.foot > foot ? 'falling' : 'flying';
        speed = 0;
      }
      if (moving === 'falling') {
        speed += GRAVITY * dt;
        foot += speed * dt;
        if (foot >= perch.foot) {
          foot = perch.foot;
          moving = perch.hanging ? 'hanging' : 'landing';
          landedAt = now;
        }
      } else if (moving === 'flying') {
        speed = Math.min(TOP_SPEED, speed + PUSH * dt);
        foot -= speed * dt;
        if (foot <= perch.foot) {
          foot = perch.foot;
          moving = settled;
        }
      } else {
        foot = perch.foot;
        if (moving === 'landing' && now - landedAt >= LANDING_SECONDS) moving = settled;
        if (moving !== 'landing') moving = settled;
      }
      return { foot, moving, landed: moving === 'landing' ? (now - landedAt) / LANDING_SECONDS : 1 };
    },
  };
}
