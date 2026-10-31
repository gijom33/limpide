import { useContext, useEffect, useRef } from 'react';
import { lfos } from '../patch/patch';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createMascotMotion, type Pose } from './mascotMotion';
import { ModulationContext } from './modulationRing';
import type { SectionName } from './sections';

type Rect = readonly [x: number, y: number, width: number, height: number];

/** The drawing, on a 16 × 12 grid: its body, and each part's variants, which a pose picks. */
const BODY: Rect[] = [[2, 2, 12, 7]];
const PARTS = {
  arms: { down: [[0, 4, 2, 2], [14, 4, 2, 2]], up: [[0, 1, 2, 3], [14, 1, 2, 3], [1, 3, 1, 2], [14, 3, 1, 2]] },
  legs: {
    stand: [[3, 9, 1, 2], [5, 9, 1, 2], [10, 9, 1, 2], [12, 9, 1, 2]],
    tuck: [[3, 9, 1, 1], [5, 9, 1, 1], [10, 9, 1, 1], [12, 9, 1, 1]],
    walkA: [[3, 9, 1, 2], [5, 9, 1, 1], [10, 9, 1, 2], [12, 9, 1, 1]],
    walkB: [[3, 9, 1, 1], [5, 9, 1, 2], [10, 9, 1, 1], [12, 9, 1, 2]],
  },
  eyes: {
    open: [[5, 4, 1, 2], [10, 4, 1, 2]],
    shut: [[5, 5, 1, 1], [10, 5, 1, 1]],
    left: [[4, 4, 1, 2], [9, 4, 1, 2]],
    right: [[6, 4, 1, 2], [11, 4, 1, 2]],
    happy: [[4, 4, 1, 1], [5, 3, 1, 1], [6, 4, 1, 1], [9, 4, 1, 1], [10, 3, 1, 1], [11, 4, 1, 1]],
  },
} satisfies Record<'arms' | 'legs' | 'eyes', Record<string, Rect[]>>;
type Part = keyof typeof PARTS;

/** Its size on screen: 2 px a square of the grid. */
const WIDTH = 32;
const HEIGHT = 24;
/** Its room from the section's name, in pixels. */
const GAP = 10;
/** How fast it walks to another section, in pixels a second. */
const WALK_SPEED = 320;

const rects = (list: readonly Rect[]) => list.map(([x, y, w, h]) => <rect key={`${x} ${y}`} x={x} y={y} width={w} height={h} />);

/** Where it stands on a section: right of its name, its feet on the name's baseline, from `origin`'s top left. */
function perch(section: SectionName, origin: DOMRect): { x: number; y: number } | null {
  const name = document.querySelector(`section[aria-label="${section}"] h2`);
  if (!name) return null;
  const range = document.createRange();
  range.selectNodeContents(name);
  const text = range.getBoundingClientRect();
  return { x: text.right + GAP - origin.left, y: text.bottom - HEIGHT - origin.top };
}

/**
 * The mascot (issue 115), called by C, A, D, E: a small creature after Claude's, perched right of the name of the
 * section of the last control turned, walking there when that changes. It moves with what is heard, as the Viewers
 * read it (the Modulation model), and adds nothing to the sound. No focus, no pointer, nothing for a screen reader.
 * Drawn by the render loop, outside React (ADR-0002).
 */
export function Mascot({ section }: { section: SectionName }) {
  const context = useContext(ModulationContext);
  const box = useRef<HTMLDivElement>(null);
  const parts = useRef(new Map<string, SVGGElement>());
  const sectionRef = useRef(section);
  sectionRef.current = section;

  useEffect(() => {
    if (!context) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = createMascotMotion();
    let at: { x: number; y: number } | null = null;
    let goingTo: SectionName | null = null;
    let shown: Pose | null = null;
    let last = performance.now() / 1000;
    return addToRenderLoop(() => {
      const el = box.current!;
      const seconds = performance.now() / 1000;
      const dt = Math.min(0.1, seconds - last);
      last = seconds;
      const target = perch(sectionRef.current, (el.offsetParent ?? document.body).getBoundingClientRect());
      if (!target) return;
      // A new section: it walks there (it jumps with reduced motion); the same one, it follows any change of layout.
      if (goingTo !== sectionRef.current) {
        if (at && goingTo !== null && !still.matches) goingTo = sectionRef.current;
        else {
          goingTo = sectionRef.current;
          at = target;
        }
      }
      const dx = target.x - at!.x;
      const dy = target.y - at!.y;
      const away = Math.hypot(dx, dy);
      const step = WALK_SPEED * dt;
      let walking: -1 | 0 | 1 = 0;
      if (away <= step || still.matches) at = target;
      else {
        at = { x: at!.x + (dx / away) * step, y: at!.y + (dy / away) * step };
        walking = dx < 0 ? -1 : 1;
      }

      const m = context.engine.modulationAt();
      const heard = lfos(context.patch()).flatMap((l, i) => (l.amount > 0 ? [m.lfo[i]] : []));
      const pose = motion.frame(
        { amp: m.amp * m.volume, sway: heard.length ? heard.reduce((a, b) => a + b, 0) / heard.length : 0, struck: m.struck },
        context.engine.now(),
        still.matches,
        walking,
      );
      for (const part of Object.keys(PARTS) as Part[]) {
        if (shown?.[part] === pose[part]) continue;
        if (shown) parts.current.get(`${part} ${shown[part]}`)!.style.display = 'none';
        parts.current.get(`${part} ${pose[part]}`)!.style.display = '';
      }
      shown = pose;
      el.style.transform = `translate(${at!.x}px, ${at!.y - pose.lift}px) rotate(${pose.tilt}deg) scale(${2 - pose.stretch}, ${pose.stretch})`;
    });
  }, [context]);

  return (
    <div ref={box} className="mascot" aria-hidden="true" style={{ width: WIDTH, height: HEIGHT }}>
      <svg viewBox="0 0 16 12" width={WIDTH} height={HEIGHT} shapeRendering="crispEdges">
        <g className="mascot-body">{rects(BODY)}</g>
        {(Object.keys(PARTS) as Part[]).flatMap((part) =>
          Object.entries(PARTS[part]).map(([variant, list]) => (
            <g
              key={`${part} ${variant}`}
              ref={(g) => void (g ? parts.current.set(`${part} ${variant}`, g) : parts.current.delete(`${part} ${variant}`))}
              className={part === 'eyes' ? 'mascot-eyes' : 'mascot-body'}
              style={{ display: 'none' }}
            >
              {rects(list)}
            </g>
          )),
        )}
      </svg>
    </div>
  );
}
