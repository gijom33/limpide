import { useContext, useEffect, useRef } from 'react';
import { lfos } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { addToRenderLoop } from '../viewers/renderLoop';
import { gesturesOf } from './mascotGestures';
import { createMascotMotion, type Pose, type Room } from './mascotMotion';
import { ModulationContext } from './modulationRing';

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
/** How long it takes to come up from behind the Amp. */
export const RISE_SECONDS = 0.4;

const rects = (list: readonly Rect[]) => list.map(([x, y, w, h]) => <rect key={`${x} ${y}`} x={x} y={y} width={w} height={h} />);

/** What it must keep clear of, above the Amp's top edge. */
const IN_THE_WAY = 'button, [role=slider], [role=tab], [role=radio], input, canvas, .piano, .knob-value, .fader';
/** The spots tried along the edge, this many pixels apart. */
const STEP = 4;

/**
 * Its room along the Amp's top edge, from the Amp's left: the stretch of spots whose box covers least of the controls
 * and Viewers above the edge, around the leftmost of those (a free stretch of the header over the Amp in three or four
 * across; elsewhere the bottom of the Viewer above, about as much everywhere).
 */
function roomOn(amp: DOMRect): Room {
  const box = { top: amp.top - HEIGHT - HEADROOM, bottom: amp.top };
  const above = [...document.querySelectorAll<HTMLElement>(IN_THE_WAY)]
    .filter((el) => !el.closest('.mascot') && el.checkVisibility({ visibilityProperty: true }))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.top < box.bottom && r.bottom > box.top && r.right > amp.left && r.left < amp.right);
  const covers = (x: number) =>
    above.reduce(
      (sum, r) => sum + Math.max(0, Math.min(r.right, amp.left + x + WIDTH) - Math.max(r.left, amp.left + x)) * Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top)),
      0,
    );
  const spots = Array.from({ length: Math.max(1, Math.floor((amp.width - WIDTH) / STEP) + 1) }, (_, i) => i * STEP);
  const least = Math.min(...spots.map(covers));
  // Within a pixel row of the least is as clear.
  const clear = (x: number) => covers(x) <= least + WIDTH;
  const best = spots.find(clear)!;
  let max = best;
  while (max + STEP <= amp.width - WIDTH && clear(max + STEP)) max += STEP;
  return { min: best, max };
}

/**
 * The mascot (issue 115), called by C, A, D, E: a water drop trailing the Limpide logo, which comes up from behind
 * the Amp section and lives on its top edge, strolling along the stretch with least above it. It moves with what is
 * heard, as the Viewers read it (the Modulation model), and with every control turned, by hand, a Controller or the
 * Demo (`gesturesOf`); sent away, it jumps, splashes and melts. It adds nothing to the sound. No focus, no pointer,
 * nothing for a screen reader. Drawn by the render loop, outside React (ADR-0002).
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
    const motion = createMascotMotion();
    const stopListening = patches.subscribe(({ before, after, by }) => {
      for (const gesture of gesturesOf(before, after, by)) motion.gesture(gesture, context.engine.now());
    });
    let shown: Pose | null = null;
    let up = 0; // how far it has come up from behind the Amp, 0 to 1
    let last = performance.now() / 1000;
    let room: { key: string; room: Room } | null = null;
    const stopDrawing = addToRenderLoop(() => {
      const outer = frame.current!;
      const seconds = performance.now() / 1000;
      const dt = Math.min(0.1, seconds - last);
      last = seconds;
      const amp = document.querySelector('section[aria-label="Amp"]')?.getBoundingClientRect();
      if (!amp) return;
      const origin = (outer.offsetParent ?? document.body).getBoundingClientRect();
      // Its room is found again only when the Amp moves or changes size against the page.
      const key = `${amp.left - origin.left} ${amp.top - origin.top} ${amp.width}`;
      if (room?.key !== key) room = { key, room: roomOn(amp) };
      if (leavingRef.current) motion.leave(context.engine.now());

      const m = context.engine.modulationAt();
      const heard = lfos(context.patch()).flatMap((l, i) => (l.amount > 0 ? [m.lfo[i]] : []));
      const pose = motion.frame(
        { amp: m.amp * m.volume, sway: heard.length ? heard.reduce((a, b) => a + b, 0) / heard.length : 0, struck: m.struck },
        context.engine.now(),
        still.matches,
        room.room,
      );
      if (pose.gone) {
        goneRef.current();
        return;
      }
      for (const part of Object.keys(PARTS) as Part[]) {
        if (shown?.[part] === pose[part]) continue;
        if (shown) parts.current.get(`${part} ${shown[part]}`)!.style.display = 'none';
        parts.current.get(`${part} ${pose[part]}`)!.style.display = '';
      }
      if (shown?.form !== pose.form) tail.current!.style.display = pose.form === 'drop' ? '' : 'none';
      shown = pose;
      // A box whose bottom is the Amp's top edge, hiding what is below it: the Amp's panel, which it comes up from behind.
      outer.style.transform = `translate(${amp.left - origin.left + pose.x}px, ${amp.top - origin.top - HEIGHT - HEADROOM}px)`;
      up = still.matches ? 1 : Math.min(1, up + dt / RISE_SECONDS);
      const rise = up * up * (3 - 2 * up); // eased in and out, from its full height below the edge
      const el = drop.current!;
      el.style.opacity = String(pose.fade);
      el.style.transform = `translateY(${(1 - rise) * HEIGHT - pose.lift}px) rotate(${pose.tilt}deg) scale(${2 - pose.stretch}, ${pose.stretch})`;
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
