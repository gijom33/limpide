import { useContext, useEffect, useRef } from 'react';
import { lfos } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { addToRenderLoop } from '../viewers/renderLoop';
import { gesturesOf } from './mascotGestures';
import { createMascotMotion, type Pose, type Room } from './mascotMotion';
import { choosePerch, createMascotPlace, type Moving, type Perch } from './mascotPlace';
import { ModulationContext } from './modulationRing';
import { SECTIONS } from './sections';

type Rect = readonly [x: number, y: number, width: number, height: number];

/**
 * The drawing, on a 22 × 13 grid: a water drop, its tail the Limpide logo's stroke (a saw tooth softening into a sine)
 * in the logo's colours, read left to right from the drop; and each part's variants, which a pose picks. Melting, the
 * drop becomes a puddle, then a film, with no tail.
 */
const SHINE: Rect[] = [[5, 4, 1, 1]];
const TAIL: Record<'osc' | 'filter' | 'amp' | 'mod', Rect[]> = {
  osc: [[9, 9, 1, 1], [10, 7, 1, 2], [11, 5, 1, 2]],
  filter: [[12, 4, 1, 6], [13, 7, 1, 2], [14, 5, 1, 2], [15, 4, 1, 1]],
  amp: [[16, 4, 1, 1], [17, 5, 1, 2], [18, 7, 1, 2], [19, 9, 1, 1]],
  mod: [[20, 9, 1, 1], [21, 7, 1, 2]],
};
const PARTS = {
  form: {
    drop: [[4, 0, 1, 2], [3, 2, 3, 2], [2, 4, 5, 1], [1, 5, 7, 2], [0, 7, 9, 3], [1, 10, 7, 1], [2, 11, 5, 1]],
    puddle: [[1, 10, 7, 1], [0, 11, 9, 2]],
    film: [[0, 12, 10, 1]],
  },
  splash: {
    none: [],
    up: [[1, 0, 1, 1], [2, 1, 1, 1], [6, 1, 1, 1], [7, 0, 1, 1]],
    wide: [[0, 5, 1, 1], [8, 5, 1, 1], [1, 2, 1, 1], [7, 2, 1, 1]],
  },
  legs: { stand: [[2, 12, 1, 1], [6, 12, 1, 1]], tuck: [], walkA: [[2, 12, 1, 1]], walkB: [[6, 12, 1, 1]] },
  eyes: {
    open: [[2, 7, 1, 2], [6, 7, 1, 2]],
    shut: [[2, 8, 1, 1], [6, 8, 1, 1]],
    left: [[1, 7, 1, 2], [5, 7, 1, 2]],
    right: [[3, 7, 1, 2], [7, 7, 1, 2]],
    happy: [[1, 8, 1, 1], [2, 7, 1, 1], [3, 8, 1, 1], [5, 8, 1, 1], [6, 7, 1, 1], [7, 8, 1, 1]],
    melted: [[2, 11, 1, 1], [6, 11, 1, 1]],
    none: [],
  },
} satisfies { [P in 'form' | 'splash' | 'legs' | 'eyes']: Record<Pose[P], Rect[]> };
type Part = keyof typeof PARTS;

/** Its size on screen: 2 px a square of the grid. */
const WIDTH = 44;
const HEIGHT = 26;
/** Room over its head for its leaps and the splash. */
const HEADROOM = 18;
/** How long it takes to come up from behind its edge, or down from under the header. */
export const RISE_SECONDS = 0.4;
/** Phones and the sections 2 × 2 (the stylesheet's breakpoint): it keeps in view as the page scrolls. */
const STACKED = '(max-width: 860px)';

const rects = (list: readonly Rect[]) => list.map(([x, y, w, h]) => <rect key={`${x} ${y}`} x={x} y={y} width={w} height={h} />);

/** What it must keep clear of, above its edge. */
const IN_THE_WAY = 'button, [role=slider], [role=tab], [role=radio], input, canvas, .piano, .knob-value, .fader';
/** The spots tried along an edge, this many pixels apart. */
const STEP = 4;

/**
 * Its room along a section's top edge, in the window's pixels: the stretch of spots where it covers least of the
 * controls and Viewers above the edge, standing (its leaps may brush past them; it takes no pointer), around the
 * leftmost of those: the whole edge in three or four across; on a phone and in 2 × 2, where the Viewer above comes
 * close, its left end.
 */
function roomOn(section: DOMRect): Room {
  const box = { top: section.top - HEIGHT - 2, bottom: section.top };
  const above = [...document.querySelectorAll<HTMLElement>(IN_THE_WAY)]
    .filter((el) => !el.closest('.mascot') && el.checkVisibility({ visibilityProperty: true }))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.top < box.bottom && r.bottom > box.top && r.right > section.left && r.left < section.right);
  const covers = (x: number) =>
    above.reduce(
      (sum, r) => sum + Math.max(0, Math.min(r.right, x + WIDTH) - Math.max(r.left, x)) * Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top)),
      0,
    );
  const spots = Array.from({ length: Math.max(1, Math.floor((section.width - WIDTH) / STEP) + 1) }, (_, i) => section.left + i * STEP);
  const least = Math.min(...spots.map(covers));
  // Within a pixel row of the least is as clear.
  const clear = (x: number) => covers(x) <= least + WIDTH;
  const best = spots.find(clear)!;
  let max = best;
  while (max + STEP <= section.right - WIDTH && clear(max + STEP)) max += STEP;
  return { min: best, max };
}

/** The four sections on the page, by name, where shown. */
const sectionBoxes = () =>
  SECTIONS.map(({ name }) => ({ id: name as string, box: document.querySelector(`section[aria-label="${name}"]`)?.getBoundingClientRect() })).filter(
    (s): s is { id: string; box: DOMRect } => !!s.box && s.box.width > 0,
  );

/**
 * The mascot (issue 115), called by B, E, A, D, as in a bead of water: a water drop trailing the Limpide logo. In
 * three and four across it lives on the top edge of the top right section; on a phone and in 2 × 2 it keeps in view as
 * the page scrolls, on the top edge of a section in the right column, or hanging under the header when none has room.
 * It comes at a spot at random, one of three ways (up from behind its edge, down from the top of the window like rain,
 * or popping up with a hop), and lives its life along its line (`createMascotMotion`): strolls, glances, funny turns
 * when nothing is played, dozing. Between lines it moves by the laws of motion (`createMascotPlace`): falling, it
 * stretches like a raindrop as it speeds up and splashes as hard as it lands; flying up, its tail spins under it. It
 * moves with what is heard, as the Viewers read it (the Modulation model), and with every control turned, by hand, a
 * Controller or the Demo (`gesturesOf`); sent away, it jumps, splashes and melts, or, hanging or in the air, drips away
 * down the window. It adds nothing to the sound. No focus, no pointer, nothing for a screen reader. Drawn by the render
 * loop, outside React (ADR-0002).
 */
export function Mascot({ patches, leaving, onGone }: { patches: PatchStore; leaving: boolean; onGone: () => void }) {
  const context = useContext(ModulationContext);
  const frame = useRef<HTMLDivElement>(null);
  const drop = useRef<HTMLDivElement>(null);
  const parts = useRef(new Map<string, SVGGElement>());
  const tail = useRef<SVGGElement>(null);
  const leavingRef = useRef(leaving);
  leavingRef.current = leaving;
  const goneRef = useRef(onGone);
  goneRef.current = onGone;

  useEffect(() => {
    if (!context) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const stacked = matchMedia(STACKED);
    const motion = createMascotMotion();
    const arrival = (['rise', 'rain', 'pop'] as const)[Math.floor(Math.random() * 3)];
    const place = createMascotPlace(arrival === 'rain' ? { from: -HEADROOM } : {});
    const stopListening = patches.subscribe(({ before, after, by }) => {
      for (const gesture of gesturesOf(before, after, by)) motion.gesture(gesture, context.engine.now());
    });
    let shown: Pose | null = null;
    let up = 0; // how far it has come into view, 0 to 1
    let comingFrom: 'edge' | 'header' | 'sky' | null = null;
    let last = performance.now() / 1000;
    let perch: Perch | null = null;
    let foot: number | null = null;
    let moving: Moving = 'standing';
    let leaveBy: 'melt' | 'rain' | null = null;
    let room: { key: string; room: Room } | null = null;
    const stopDrawing = addToRenderLoop(() => {
      const outer = frame.current!;
      const seconds = performance.now() / 1000;
      const dt = Math.min(0.1, seconds - last);
      last = seconds;
      const now = context.engine.now();
      const sections = sectionBoxes();
      if (!sections.length) return;

      // Its line: the top right section's edge; on a phone or in 2 × 2, a right-column edge in view, or the header.
      let on: { id: string; box: DOMRect };
      if (!stacked.matches) {
        const top = Math.min(...sections.map((s) => s.box.top));
        const right = sections.filter((s) => s.box.top - top < 4).reduce((a, b) => (b.box.right > a.box.right ? b : a));
        perch = { id: right.id, foot: right.box.top, hanging: false };
        on = right;
      } else {
        const rightmost = Math.max(...sections.map((s) => s.box.right));
        const column = sections.filter((s) => rightmost - s.box.right < 4).sort((a, b) => a.box.top - b.box.top);
        const ceiling = Math.max(0, ...['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0));
        perch = choosePerch(perch?.id ?? null, column.map((s) => ({ id: s.id, top: s.box.top })), ceiling, innerHeight, HEIGHT, HEADROOM, foot ?? ceiling);
        const id = perch.id;
        const span = column[0].box;
        on = column.find((s) => s.id === id) ?? { id, box: new DOMRect(span.left, perch.foot, span.width, 0) };
      }
      // Leaving: on its line it melts; hanging or in the air it drips away down the window.
      if (leavingRef.current && leaveBy === null) {
        leaveBy = moving === 'standing' || moving === 'landing' ? 'melt' : 'rain';
        if (leaveBy === 'melt') motion.leave(now);
      }
      if (leaveBy === 'rain') perch = { id: 'away', foot: innerHeight + HEIGHT + HEADROOM, hanging: false };

      // Its room along the line, found again only when the line moves against the page or changes.
      const box = on.box;
      const key = `${perch.id} ${box.left + scrollX} ${perch.hanging ? 0 : box.top + scrollY} ${box.width}`;
      if (room?.key !== key) room = { key, room: perch.hanging ? { min: box.left + 4, max: box.right - WIDTH - 4 } : roomOn(box) };

      const m = context.engine.modulationAt();
      const heard = lfos(context.patch()).flatMap((l, i) => (l.amount > 0 ? [m.lfo[i]] : []));
      const pose = motion.frame(
        { amp: m.amp * m.volume, sway: heard.length ? heard.reduce((a, b) => a + b, 0) / heard.length : 0, struck: m.struck },
        now,
        still.matches,
        room.room,
      );
      const where = place.frame(perch, room.room, now, still.matches, pose.x);
      if (where.landedAt !== null) motion.place(where.landedAt);
      foot = where.foot;
      moving = where.moving;
      if (pose.gone || (leaveBy === 'rain' && where.foot >= innerHeight + HEIGHT)) {
        goneRef.current();
        return;
      }

      // Between lines and under the header, the line's moves take over the sound's and the controls'.
      let tailTurn = 0;
      let origin = '20% 100%';
      const across = Math.max(-15, Math.min(15, where.vx / 40)); // leaning into its way across
      if (where.moving === 'hanging') {
        Object.assign(pose, { legs: 'stand', splash: 'none', lift: 0, tilt: still.matches ? 0 : Math.sin(now * 2.2) * 6 });
        origin = '20% 0%'; // it swings from its tip
      } else if (where.moving === 'falling') {
        // Hopping off, tucked; then a raindrop, longer the faster it falls.
        const speed = Math.max(0, where.vy);
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, tilt: across, turn: 1, eyes: where.vy < 0 ? 'happy' : 'open' });
        pose.stretch = where.vy < 0 ? 0.92 : 1 + Math.min(0.35, speed / 1600);
      } else if (where.moving === 'flying') {
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, tilt: across, turn: 1, eyes: where.thrust ? 'happy' : 'open' });
        pose.stretch = 1 + Math.min(0.2, Math.abs(where.vy) / 2600);
        // Its tail under it, spinning while it pushes, swinging back up as it coasts.
        tailTurn = where.thrust ? 90 + Math.sin(now * 2 * Math.PI * 12) * 22 : Math.max(0, Math.min(90, -where.vy / 6));
      } else if (where.moving === 'landing' && leaveBy !== 'melt') {
        // Squashed as hard as it hit, then a wobble that dies away, like a drop of jelly.
        const p = where.landed;
        const wobble = Math.exp(-5 * p) * Math.cos(16 * p);
        Object.assign(pose, { legs: 'stand', lift: 0, turn: 1 });
        pose.stretch = 1 - 0.4 * where.impact * wobble;
        pose.splash = p < 0.3 && where.impact > 0.25 ? 'wide' : p < 0.2 && where.impact > 0.1 ? 'up' : 'none';
        pose.eyes = p < 0.15 ? 'shut' : where.impact > 0.5 && p < 0.55 ? 'happy' : pose.eyes;
      }

      for (const part of Object.keys(PARTS) as Part[]) {
        if (shown?.[part] === pose[part]) continue;
        if (shown) parts.current.get(`${part} ${shown[part]}`)!.style.display = 'none';
        parts.current.get(`${part} ${pose[part]}`)!.style.display = '';
      }
      if (shown?.form !== pose.form) tail.current!.style.display = pose.form === 'drop' ? '' : 'none';
      const turnTail = tailTurn + pose.wag;
      tail.current!.setAttribute('transform', turnTail ? `rotate(${turnTail} 9 9)` : '');
      shown = pose;

      const page = (outer.offsetParent ?? document.body).getBoundingClientRect();
      outer.style.transform = `translate(${(where.x ?? pose.x) - page.left}px, ${where.foot - HEIGHT - HEADROOM - page.top}px)`;
      // Coming into view: up from behind its edge (fast for a pop, then a hop), down from under the header, or, falling
      // from the top of the window, all at once.
      comingFrom ??= perch.hanging ? 'header' : arrival === 'rain' ? 'sky' : 'edge';
      const wasUp = up;
      up = still.matches || comingFrom === 'sky' ? 1 : Math.min(1, up + dt / (arrival === 'pop' ? RISE_SECONDS / 2 : RISE_SECONDS));
      if (arrival === 'pop' && wasUp < 1 && up === 1) motion.gesture('new', now);
      const rise = up * up * (3 - 2 * up);
      const hidden = (1 - rise) * HEIGHT;
      outer.style.clipPath = up < 1 ? (comingFrom === 'header' ? `inset(${HEADROOM}px -60px -60px -60px)` : 'inset(-60px -60px 0 -60px)') : 'none';
      const el = drop.current!;
      el.style.opacity = String(pose.fade);
      el.style.transformOrigin = origin;
      el.style.transform = `translateY(${(comingFrom === 'header' ? -hidden : hidden) - pose.lift}px) rotate(${pose.tilt}deg) scale(${(2 - pose.stretch) * pose.turn}, ${pose.stretch})`;
    });
    return () => {
      stopListening();
      stopDrawing();
    };
  }, [context, patches]);

  return (
    <div ref={frame} className="mascot" aria-hidden="true" style={{ width: WIDTH, height: HEIGHT + HEADROOM }}>
      <div ref={drop} className="mascot-drop" style={{ transform: `translateY(${HEIGHT}px)` }}>
        <svg viewBox="0 0 22 13" width={WIDTH} height={HEIGHT} shapeRendering="crispEdges">
          <g ref={tail}>
            {(Object.keys(TAIL) as (keyof typeof TAIL)[]).map((stage) => (
              <g key={stage} style={{ fill: `var(--stage-${stage})` }}>
                {rects(TAIL[stage])}
              </g>
            ))}
          </g>
          {(Object.keys(PARTS) as Part[]).flatMap((part) =>
            Object.entries(PARTS[part]).map(([variant, list]) => (
              <g
                key={`${part} ${variant}`}
                ref={(g) => void (g ? parts.current.set(`${part} ${variant}`, g) : parts.current.delete(`${part} ${variant}`))}
                className={part === 'eyes' ? 'mascot-eyes' : 'mascot-body'}
                style={{ display: 'none' }}
              >
                {rects(list)}
                {part === 'form' && variant === 'drop' && <g className="mascot-shine">{rects(SHINE)}</g>}
              </g>
            )),
          )}
        </svg>
      </div>
    </div>
  );
}
