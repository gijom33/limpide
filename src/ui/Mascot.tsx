import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Theme } from '../app/rememberedSettings';
import type { Word } from '../input/callingPhrase';
import type { PatchStore } from '../patch/patchStore';
import { addToRenderLoop } from '../viewers/renderLoop';
import { createBeadFrame, type Drawn, HEADROOM } from './beadFrame';
import { pageReader } from './beadPage';
import { DROP_MIDDLE, type Guide, HEIGHT, ROWS, WIDTH } from './mascotCling';
import { mascotClock } from './mascotClock';
import { watchCovers } from './mascotCovers';
import type { Pose } from './mascotMotion';
import { CATCH, CLOUD, HATS, HOOK, ICE, type Picture, PROPS, type Rect, ROD_TIP, SKY, type Stage, SUN, TAILS, UMBRELLA } from './mascotPictures';
import { createSpray, MOST_DROPLETS, rainFrom } from './mascotSpray';
import type { Trick } from './mascotTricks';
import { ModulationContext } from './modulationRing';
import { STACKED } from './sections';

declare global {
  interface Window {
    /** In the end-to-end tests' build only, while Bead is out: plays a trick at once, or after the one under way (issue 200). */
    __limpideTrick?: (name: Trick) => void;
  }
}

/**
 * The drawing, on a 22 × 13 grid: a water drop, its tail the Limpide logo's stroke (a saw tooth softening into a sine)
 * in the logo's colours, read left to right from the drop; and each part's variants, which a pose picks. Melting, the
 * drop becomes a puddle, then a film, with no tail.
 */
const SHINE: Rect[] = [[5, 4, 1, 1]];
const TAIL: Record<Stage, Rect[]> = {
  osc: [[9, 9, 1, 1], [10, 7, 1, 2], [11, 5, 1, 2]],
  filter: [[12, 4, 1, 6], [13, 7, 1, 2], [14, 5, 1, 2], [15, 4, 1, 1]],
  amp: [[16, 4, 1, 1], [17, 5, 1, 2], [18, 7, 1, 2], [19, 9, 1, 1]],
  mod: [[20, 9, 1, 1], [21, 7, 1, 2]],
};
const PARTS = {
  form: {
    drop: [[4, 0, 1, 2], [3, 2, 3, 2], [2, 4, 5, 1], [1, 5, 7, 2], [0, 7, 9, 3], [1, 10, 7, 1], [2, 11, 5, 1]],
    squashed: [[2, 8, 5, 1], [0, 9, 9, 3], [1, 12, 7, 1]],
    puddle: [[1, 10, 7, 1], [0, 11, 9, 2]],
    spread: [[0, 11, 9, 1], [-2, 12, 13, 1]],
    film: [[-3, 12, 15, 1]],
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
    wide: [[1, 7, 2, 2], [5, 7, 2, 2]],
    dead: [[1, 7, 1, 1], [3, 7, 1, 1], [2, 8, 1, 1], [1, 9, 1, 1], [3, 9, 1, 1], [5, 7, 1, 1], [7, 7, 1, 1], [6, 8, 1, 1], [5, 9, 1, 1], [7, 9, 1, 1]],
    peek: [[1, 7, 1, 1], [3, 7, 1, 1], [2, 8, 1, 1], [1, 9, 1, 1], [3, 9, 1, 1], [6, 7, 1, 2]],
    melted: [[2, 11, 1, 1], [6, 11, 1, 1]],
    none: [],
  },
} satisfies { [P in 'form' | 'splash' | 'legs' | 'eyes']: Record<Pose[P], Rect[]> };
type Part = keyof typeof PARTS;

/** The open umbrella's span across and its top, on the grid: the rain falling there ends on it. */
const CANOPY = { from: -3, to: 12, top: -8 };
/** The rain falls from a stretch of sky this wide either side of it, in pixels. */
const RAIN_WIDE = 80;
/** A glass, on the same grid. */
const GLASS: Rect[] = [[-7, 5, 1, 8], [-3, 5, 1, 8], [-6, 12, 3, 1]];
/** A toy water gun held at its left: its tank of water on top, its body and barrel, its grip. */
const GUN = {
  tank: [[-4, 6, 2, 1]],
  body: [[-3, 7, 3, 2], [-6, 8, 3, 1]],
  grip: [[-2, 9, 1, 2]],
} satisfies Record<string, Rect[]>;
/** The gun's muzzle, in the drawing's pixels from the drop's box: where its jet leaves. */
const MUZZLE = { x: -12, y: 17 };
/** The water in the glass: at its bottom upright; turned over, at its rim, where it falls to. */
const WATER = {
  glassFull: [[-6, 6, 3, 6]],
  glassHalf: [[-6, 9, 3, 3]],
  glassLow: [[-6, 11, 3, 1]],
  glassHalfOver: [[-6, 6, 3, 3]],
  glassLowOver: [[-6, 6, 3, 1]],
  glassEmpty: [],
} satisfies Record<string, Rect[]>;
/**
 * Drinking: the glass's rim (its middle, on the glass) goes to here, turned this far: over its mouth, the glass running
 * off to the left across its left eye, its bottom edge at the rim on the mouth's level (the owner, 2026-11-03: "Bottom
 * edge of glass at level of imaginary mouth"). Turned over, that edge is 2.95 rows under the rim.
 */
const RIM = { x: -5, y: 5 };
const POURING_AT = { x: 4, y: 7 };
const TURNED_OVER = 100;
/** Its mouth's height on the drawing, never drawn: just under its eyes. The poured water ends there. */
const MOUTH_Y = 10;

/**
 * Its surfboard (issue 204), under its foot in place of its legs: a long deck, its nose turned up on the side it faces
 * as drawn, a stripe along it.
 */
const BOARD = {
  deck: [[-2, 12, 13, 1], [-3, 11, 1, 1]],
  stripe: [[0, 12, 1, 1], [4, 12, 1, 1], [8, 12, 1, 1]],
} satisfies Record<string, Rect[]>;

/** Its tail's length turned down under it, in pixels. */
const TAIL_LENGTH = 26;

const rects = (list: readonly Rect[]) => list.map(([x, y, w, h]) => <rect key={`${x} ${y}`} x={x} y={y} width={w} height={h} />);
const picture = (groups: Picture) => groups.map(([className, list]) => <g key={className} className={className}>{rects(list)}</g>);
/** A tail, each stage's pixels in its stage's colour, as the logo's stroke. */
const tailOf = (stages: Record<Stage, readonly Rect[]>) =>
  (Object.keys(stages) as Stage[]).map((stage) => (
    <g key={stage} style={{ fill: `var(--stage-${stage})` }}>
      {rects(stages[stage])}
    </g>
  ));

/** A press on it that moves this far, in pixels, picks it up (issue 127); one that does not is a click. */
const PICK_UP_PX = 6;
/** The pixels of its static with the Noise. */
const STATIC_DOTS = 10;
/** Sliding down the panel, a drip left behind it this often, in seconds. */
const SLIDE_DRIPS = 0.09;

/** Its droplets on their layer: a pixel of the drawing each, fading as they end. */
function drawDroplets(layer: SVGSVGElement, droplets: readonly { x: number; y: number; age: number; life: number }[]) {
  const dots = layer.children;
  for (let i = 0; i < dots.length; i++) {
    const dot = dots[i] as SVGRectElement;
    const d = droplets[i];
    if (!d) {
      if (dot.style.display !== 'none') dot.style.display = 'none';
      continue;
    }
    dot.style.display = '';
    dot.setAttribute('x', String(Math.round(d.x - 1)));
    dot.setAttribute('y', String(Math.round(d.y - 1)));
    dot.style.opacity = String(Math.min(1, (1 - d.age / d.life) * 3));
  }
}

/**
 * Bead as a little picture, still, for its switch in Display (issue 115): there while it is on; turned off, it melts
 * away as Bead does, and comes back with a pop.
 */
export function BeadIcon({ on }: { on: boolean }) {
  // Melting or popping only when switched, not when Display opens.
  const [state, setState] = useState<'on' | 'popping' | 'melting' | 'gone'>(on ? 'on' : 'gone');
  const was = useRef(on);
  useEffect(() => {
    if (was.current === on) return;
    was.current = on;
    setState(on ? 'popping' : 'melting');
  }, [on]);
  return (
    <svg className="bead-icon" data-state={state} viewBox="0 0 22 13" width={33} height={20} shapeRendering="crispEdges" aria-hidden="true">
      {tailOf(TAIL)}
      <g className="mascot-body">{rects(PARTS.form.drop)}</g>
      <g className="mascot-shine">{rects(SHINE)}</g>
      <g className="mascot-eyes">{rects(PARTS.eyes.open)}</g>
    </svg>
  );
}

/**
 * Bead in About (issue 163), at its size on the page (issue 178), standing still on its feet: idle as on the page, it
 * blinks, glances about, wags its tail, and now and then jiggles or hops. All in the stylesheet, so it costs no frame of
 * the render loop, and with reduced motion it is still.
 */
export function BeadIdle() {
  return (
    <svg className="bead-idle" viewBox="0 0 22 13" width={WIDTH} height={HEIGHT} shapeRendering="crispEdges" aria-hidden="true">
      <g className="bead-idle-body">
        <g className="bead-idle-tail">
          {tailOf(TAIL)}
        </g>
        <g className="mascot-body">
          {rects(PARTS.form.drop)}
          {rects(PARTS.legs.stand)}
        </g>
        <g className="mascot-shine">{rects(SHINE)}</g>
        {(['open', 'shut', 'left', 'right'] as const).map((eyes) => (
          <g key={eyes} className={`mascot-eyes bead-idle-eyes-${eyes}`}>
            {rects(PARTS.eyes[eyes])}
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * The mascot (issue 115), out by default (issue 150) and called by B, E, A, D: a water drop trailing the Limpide logo. In
 * three and four across it lives on the top edge of the top right section; on a phone and in 2 × 2 it keeps in view as
 * the page scrolls, on the top edge of a section in the right column (over a phone's section tabs while an edge shows
 * under them, issue 142), or, when none has room, hovering on its tail a little under the header or the tabs, about where
 * it lost ground (issue 142).
 * It comes at a spot at random, one of three ways (up from behind its edge, down from the top of the window like rain,
 * or popping up with a hop), and lives its life along its line (`createMascotMotion`): strolls, glances, funny turns
 * when nothing is played, dozing. Between lines it moves by the laws of motion (`createMascotPlace`): falling, it
 * stretches like a raindrop as it speeds up and splashes as hard as it lands; flying up, its tail spins under it. It
 * moves with what is heard, as the Viewers read it (the Modulation model), and with every control turned, by hand, a
 * Controller or the Demo (`gesturesOf`); sent away, it jumps, splashes and melts, or, hovering or in the air, drips away
 * down the window. It adds nothing to the sound. No focus, no pointer, nothing for a screen reader. Drawn by the render
 * loop, outside React (ADR-0002).
 */
export function Mascot({
  patches,
  leaving,
  onGone,
  theme,
  demoPart,
  word,
  guide,
}: {
  patches: PatchStore;
  leaving: boolean;
  onGone: () => void;
  /** The theme: switched while it is out, it reacts (issue 127). */
  theme: Theme;
  /** The Demo part playing, or null: each part, one of its acts. */
  demoPart: number | null;
  /** The last word spelled with Notes while it is out, `count` telling one from the next. */
  word: { word: Word; count: number } | null;
  /** A Tutorial or the Tour open: the control it points the way to, its Step, and the Step made (issue 151). */
  guide: Guide | null;
}) {
  const context = useContext(ModulationContext);
  const frame = useRef<HTMLDivElement>(null);
  const drop = useRef<HTMLDivElement>(null);
  const parts = useRef(new Map<string, SVGGElement>());
  const tail = useRef<SVGGElement>(null);
  const spray = useRef<SVGSVGElement>(null);
  const umbrella = useRef<SVGGElement>(null);
  const shutUmbrella = useRef<SVGGElement>(null);
  const glass = useRef<SVGGElement>(null);
  const water = useRef(new Map<string, SVGGElement>());
  const gun = useRef<SVGGElement>(null);
  const board = useRef<SVGGElement>(null);
  const twin = useRef<SVGUseElement>(null);
  const ice = useRef<SVGGElement>(null);
  const sky = useRef<SVGGElement>(null);
  const fuzz = useRef<SVGGElement>(null);
  const fishing = useRef<SVGSVGElement>(null);
  // The tail's shapes, the hats and the new props, each a group shown when the pose has it (issue 127).
  const tails = useRef(new Map<string, SVGGElement>());
  const hats = useRef(new Map<string, SVGGElement>());
  const props = useRef(new Map<string, SVGGElement>());
  // A pointer on it tickles it; a click or a touch sends droplets every way; a press that moves picks it up, to be
  // thrown (set up with the drawing below). Words and the theme reach its moves the same way.
  const touched = useRef<{
    tickle(): void;
    poke(): void;
    pick(x: number, y: number): boolean;
    drag(x: number, y: number): void;
    letGo(): void;
    word(word: Word): void;
    theme(theme: Theme): void;
    /** A new Step or Tour card (a bounce, once beside its control), a Step made (a hop), a Tutorial finished (the fountain). */
    step(): void;
    made(): void;
    finished(): void;
  } | null>(null);
  const press = useRef<{ x: number; y: number; picked: boolean } | null>(null);
  // What the loop and its handlers read of the props, as they are now.
  const askedNow = useEffectEvent(() => ({ leaving, demoPart, guide }));
  const gone = useEffectEvent(onGone);

  useEffect(() => {
    if (!context) return;
    // Its own time: the sound's while it runs, the page's while the browser holds the sound stopped (an iPhone, back from
    // another app), so it never stands frozen.
    const clock = mascotClock(() => context.engine.now(), () => performance.now() / 1000);
    const pageSeconds = () => performance.now() / 1000;
    /** What is drawn over the page (issue 164), each with its box: kept up to date as the page changes (issue 220). */
    const covering = watchCovers();
    // Each frame in three steps (issue 245): the page read, Bead's frame decided from it, and drawn.
    const reader = pageReader({ engine: context.engine, patch: context.patch, covering, holder: () => frame.current!, asked: askedNow });
    const bead = createBeadFrame({ clock, seconds: pageSeconds, stacked: matchMedia(STACKED).matches });
    const stopListening = patches.subscribe((change) => bead.patchChanged(change));
    const droplets = createSpray();
    let lastExhaust = -Infinity;
    let lastDrip = -Infinity;
    // Where its middle is in the page, for droplets flung by a click.
    let middle = { x: 0, y: 0 };
    // What was drawn last, so each part is written only as it changes; how far up its sun and cloud are drawn (issue 237).
    let shown: Pose | null = null;
    let skyShown = 0;
    touched.current = {
      tickle: bead.tickle,
      poke: () => {
        bead.poke();
        droplets.fling(9, middle.x, middle.y, 'all');
      },
      pick: (x, y) => bead.pick(x, y, reader.read(pageSeconds(), { text: false })),
      drag: bead.drag,
      letGo: () => bead.letGo(reader.read(pageSeconds(), { text: false })),
      word: bead.word,
      theme: bead.theme,
      step: bead.newStep,
      made: bead.made,
      finished: bead.finished,
    };
    // In the end-to-end tests' build only: a trick played on cue, so a test can watch one where it likes (issue 200).
    if (import.meta.env.MODE === 'e2e') window.__limpideTrick = bead.trick;
    const stopDrawing = addToRenderLoop(() => {
      const outer = frame.current!;
      // Every layout read first, before this frame writes anything: a read after a write would make the browser work
      // out the page's styles again in the middle of the frame.
      const drawn = bead.step(reader.read(pageSeconds()));
      if (drawn === null) return;
      if (drawn === 'gone') {
        gone();
        return;
      }
      // Its drawing, written once every draw of the frame has read the page (issue 221): what is above only reads it.
      return () => draw(outer, drawn);
    });

    /** Writes what the frame decided, and only that; and its droplets and its fishing line, which follow it. */
    function draw(outer: HTMLDivElement, { pose, where, now, dt, left: across, origin, tailTurn, onBoard, shrink, skyRows, marks, up, comingFrom, page, overPage, windowHeight }: Drawn) {
      if (onBoard !== (board.current!.style.display === '')) board.current!.style.display = onBoard ? '' : 'none';
      const grid = HEIGHT / ROWS;
      if (skyRows !== skyShown) {
        sky.current!.setAttribute('transform', skyRows ? `translate(0 ${-skyRows})` : '');
        skyShown = skyRows;
      }

      for (const part of Object.keys(PARTS) as Part[]) {
        if (shown?.[part] === pose[part]) continue;
        if (shown) parts.current.get(`${part} ${shown[part]}`)!.style.display = 'none';
        parts.current.get(`${part} ${pose[part]}`)!.style.display = '';
      }
      if (shown?.form !== pose.form) tail.current!.style.display = pose.form === 'drop' ? '' : 'none';
      if (shown?.tail !== pose.tail) for (const [shape, g] of tails.current) g.style.display = shape === pose.tail ? '' : 'none';
      if (shown?.hat !== pose.hat) for (const [name, g] of hats.current) g.style.display = name === pose.hat ? '' : 'none';
      if (shown?.prop !== pose.prop) for (const [name, g] of props.current) g.style.display = name === pose.prop ? '' : 'none';
      // Its twin, Detune splitting it, off on the side of its sign by half as many squares as pixels, the same side on
      // the page whichever way it faces (issue 174); frozen; its static. Each written only as it changes, to keep its
      // frames cheap.
      const twinned = pose.twin !== 0 && pose.form === 'drop';
      if (twinned || shown?.twin) {
        // Linked to its drawing only while shown: WebKit copies a linked drawing again at every change to it.
        if (twinned) twin.current!.setAttribute('href', '#bead-self');
        else twin.current!.removeAttribute('href');
        twin.current!.style.display = twinned ? '' : 'none';
        if (twinned) twin.current!.setAttribute('transform', `translate(${(pose.turn < 0 ? -pose.twin : pose.twin) / 2} 0)`);
      }
      if (pose.ice > 0 || shown?.ice) {
        ice.current!.style.display = pose.ice > 0 ? '' : 'none';
        ice.current!.style.opacity = String(pose.ice);
      }
      if (pose.fuzz > 0 || shown?.fuzz) {
        const dots = fuzz.current!.children;
        for (let i = 0; i < dots.length; i++) {
          const dot = dots[i] as SVGRectElement;
          const on = Math.random() < pose.fuzz * 0.7;
          dot.style.display = on ? '' : 'none';
          if (on) {
            dot.setAttribute('x', String(Math.floor(Math.random() * 9)));
            dot.setAttribute('y', String(1 + Math.floor(Math.random() * 11)));
          }
        }
      }
      // Turned down, the tail leaves from under the drop's middle rather than its side.
      const under = Math.min(1, tailTurn / 90);
      const turnTail = tailTurn + pose.wag;
      tail.current!.setAttribute('transform', turnTail ? `translate(${-4.5 * under} ${3 * under}) rotate(${turnTail} 9 9)` : '');
      shown = pose;
      // What it is doing, for the tests (issue 127); pointing the way, for the stylesheet too (issue 151).
      for (const [mark, value] of Object.entries(marks)) if (outer.dataset[mark] !== value) outer.dataset[mark] = value;

      const left = across - page.left + (pose.fuzz ? (Math.random() * 2 - 1) * pose.fuzz : 0);
      const ground = where.foot - page.top;
      outer.style.transform = `translate(${left}px, ${ground - HEIGHT - HEADROOM}px)${shrink < 1 ? ` scale(${shrink})` : ''}`;
      // Its droplets kept under what is over the page, a droplet's size under it (issue 200).
      const ceiling = overPage - page.top + 2;
      droplets.under(ceiling);
      // Its droplets, in the page: a splash as it lands (harder, more), its smash, its shake, its tail's spray.
      const base = { x: left + DROP_MIDDLE, y: ground };
      // A point of its drawing as drawn, smaller about its foot where it is (issue 200).
      const drawnX = (x: number) => base.x + (x - base.x) * shrink;
      const drawnY = (y: number) => ground - (ground - y) * shrink;
      middle = { x: base.x, y: ground - HEIGHT / 2 - pose.lift };
      if (where.landedAt !== null && where.moving === 'landing') droplets.fling(5 + Math.round(9 * where.impact), base.x, base.y, 'up', where.impact);
      if (pose.burst) {
        const { count, spread: fling } = pose.burst;
        if (fling === 'rain') {
          // From the sky all around, each drop from its own height (issue 237); on the umbrella, if it is open and
          // the drop falls on it, else down to the edge.
          for (let i = 0; i < count; i++) {
            const at = base.x + (Math.random() * 2 - 1) * RAIN_WIDE;
            const onUmbrella = pose.prop === 'umbrella' && at >= left + CANOPY.from * grid && at <= left + CANOPY.to * grid;
            droplets.fling(1, at, rainFrom(ground, ceiling, Math.random()), 'rain', 0.5, onUmbrella ? drawnY(ground - HEIGHT + CANOPY.top * grid - pose.lift) : ground);
          }
        } else {
          if (fling === 'arc') {
            // Up from its head, in an arc back down to its edge.
            droplets.fling(count, base.x, drawnY(ground - HEIGHT - pose.lift), 'arc', pose.burst.aim ?? 0, ground);
          } else if (fling === 'pour') {
            // From the glass's rim, falling into its mouth.
            droplets.fling(count, drawnX(left + POURING_AT.x * grid), drawnY(ground - HEIGHT + POURING_AT.y * grid), 'pour', 1, drawnY(ground - HEIGHT + MOUTH_Y * grid));
          } else if (fling === 'jet') {
            // From the muzzle, turned with it: the gun is drawn on its left.
            const facing = pose.turn < 0 ? -1 : 1;
            droplets.fling(count, drawnX(left + DROP_MIDDLE + facing * (MUZZLE.x - DROP_MIDDLE)), drawnY(ground - HEIGHT - pose.lift + MUZZLE.y), 'jet', -facing);
          } else if (fling === 'shower') {
            // From under its cloud, wherever it is drawn, down onto it.
            const at = left + (CLOUD.from + Math.random() * (CLOUD.to - CLOUD.from)) * grid;
            droplets.fling(count, drawnX(at), drawnY(ground - HEIGHT + (CLOUD.bottom - skyRows) * grid), 'shower', 0.5, ground);
          } else if (fling === 'steam') {
            // Up from its head to the sun's height (issue 237).
            const sun = drawnY(ground - HEIGHT + (SUN.middle - skyRows) * grid);
            droplets.fling(count, base.x, drawnY(ground - HEIGHT * pose.size - pose.lift), 'steam', 1, sun);
          } else {
            const top = drawnY(ground - HEIGHT * pose.size - pose.lift);
            const from = fling === 'up' || fling === 'drip' ? base.y : fling === 'spout' ? top : drawnY(middle.y);
            droplets.fling(count, base.x, from, fling, 1);
          }
        }
      }
      // Its props: shown as the trick has them.
      umbrella.current!.style.display = pose.prop === 'umbrella' ? '' : 'none';
      shutUmbrella.current!.style.display = pose.prop === 'umbrellaShut' ? '' : 'none';
      gun.current!.style.display = pose.prop === 'gun' ? '' : 'none';
      const glassy = pose.prop.startsWith('glass');
      glass.current!.style.display = glassy ? '' : 'none';
      // Lifted beside its mouth and turned over, about its rim, the open end toward its mouth.
      const s = pose.sip;
      glass.current!.setAttribute(
        'transform',
        s ? `translate(${(POURING_AT.x - RIM.x) * s} ${(POURING_AT.y - RIM.y) * s}) rotate(${TURNED_OVER * s} ${RIM.x} ${RIM.y})` : '',
      );
      const level = pose.sip > 0.5 && (pose.prop === 'glassHalf' || pose.prop === 'glassLow') ? `${pose.prop}Over` : pose.prop;
      for (const [name, g] of water.current) g.style.display = name === level ? '' : 'none';
      if (where.moving === 'sliding' && now - lastDrip > SLIDE_DRIPS) {
        droplets.fling(1, base.x, base.y - 2, 'drip');
        lastDrip = now;
      }
      if (where.moving === 'flying' && where.thrust && now - lastExhaust > 0.035) {
        droplets.fling(1, base.x, ground + TAIL_LENGTH, 'down');
        lastExhaust = now;
      }
      drawDroplets(spray.current!, droplets.step(dt));
      // Fishing: the line hangs straight down from the rod's tip, wherever its lean and turn put the tip, to the hook,
      // down past the window's bottom or on the way back up with its catch (the owner, 2026-10-30).
      const fish = fishing.current!;
      if (pose.hook === null || pose.form !== 'drop') {
        if (fish.style.display !== 'none') fish.style.display = 'none';
      } else {
        fish.style.display = '';
        const tip = ROD_TIP[pose.prop === 'rodBite' ? 'rodBite' : 'rod'];
        // The tip as the drop's transform puts it: scaled, then turned, about its foot, then lifted.
        const [ox, oy] = [WIDTH * 0.2, HEIGHT];
        const dx = (tip.x * grid - ox) * (2 - pose.stretch) * pose.turn * pose.size;
        const dy = (tip.y * grid - oy) * pose.stretch * pose.size;
        const a = (pose.tilt * Math.PI) / 180;
        const x = drawnX(left + ox + dx * Math.cos(a) - dy * Math.sin(a));
        const y = drawnY(ground - pose.lift + dx * Math.sin(a) + dy * Math.cos(a));
        const bottom = windowHeight - page.top + 30;
        const hookY = y + pose.hook * Math.max(0, bottom - y);
        const [line, hook, caught] = fish.children as unknown as [SVGLineElement, SVGGElement, SVGGElement];
        line.setAttribute('x1', String(x));
        line.setAttribute('y1', String(y));
        line.setAttribute('x2', String(x));
        line.setAttribute('y2', String(hookY));
        hook.setAttribute('transform', `translate(${x} ${hookY})`);
        caught.setAttribute('transform', `translate(${x} ${hookY})`);
        caught.style.display = pose.caught ? '' : 'none';
      }
      // Coming into view: up from behind its edge, or down from under the header (issue 192).
      const rise = up * up * (3 - 2 * up);
      const hidden = (1 - rise) * HEIGHT;
      outer.style.clipPath = up < 1 ? (comingFrom === 'header' ? `inset(${HEADROOM}px -60px -60px -60px)` : 'inset(-60px -60px 0 -60px)') : 'none';
      const el = drop.current!;
      el.style.opacity = String(pose.fade);
      el.style.transformOrigin = origin;
      el.style.transform = `translateY(${(comingFrom === 'header' ? -hidden : hidden) - pose.lift}px) rotate(${pose.tilt}deg) scale(${(2 - pose.stretch) * pose.turn * pose.size}, ${pose.stretch * pose.size})`;
    }
    return () => {
      stopListening();
      stopDrawing();
      covering.stop();
      reader.stop();
      if (import.meta.env.MODE === 'e2e') delete window.__limpideTrick;
    };
  }, [context, patches]);

  // A word spelled with Notes while it is out, and the theme switched (issue 127): each once, as it comes.
  const wordSeen = useRef(word?.count);
  useEffect(() => {
    if (!word || word.count === wordSeen.current) return;
    wordSeen.current = word.count;
    touched.current?.word(word.word);
  }, [word]);
  const themeSeen = useRef(theme);
  useEffect(() => {
    if (theme === themeSeen.current) return;
    themeSeen.current = theme;
    touched.current?.theme(theme);
  }, [theme]);

  // A Tutorial's or the Tour's new Step or card, a Step made, a Tutorial finished (issue 151): each once, as it comes.
  const guideSeen = useRef<Guide | null>(null);
  useEffect(() => {
    const was = guideSeen.current;
    guideSeen.current = guide;
    if (!guide) return;
    if (guide.step !== was?.step) touched.current?.step();
    if (guide.made && !was?.made && guide.step === was?.step) touched.current?.made();
    if (guide.finished && !was?.finished) touched.current?.finished();
  }, [guide]);

  const part = (part: Part) =>
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
    ));
  const keep = (map: { current: Map<string, SVGGElement> }, name: string) => (g: SVGGElement | null) =>
    void (g ? map.current.set(name, g) : map.current.delete(name));

  return (
    <>
    <svg ref={spray} className="mascot-spray" aria-hidden="true" shapeRendering="crispEdges">
      {Array.from({ length: MOST_DROPLETS }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a fixed set of droplets, reused by position
        <rect key={i} width={2} height={2} style={{ display: 'none' }} />
      ))}
    </svg>
    <svg ref={fishing} className="mascot-fishing" aria-hidden="true" shapeRendering="crispEdges" style={{ display: 'none' }}>
      <line className="mascot-line" />
      <g className="mascot-hook">{rects(HOOK)}</g>
      <g className="mascot-note">{rects(CATCH)}</g>
    </svg>
    <div ref={frame} className="mascot" aria-hidden="true" style={{ width: WIDTH, height: HEIGHT + HEADROOM, transformOrigin: `${DROP_MIDDLE}px 100%` }}>
      <div
        ref={drop}
        className="mascot-drop"
        style={{ transform: `translateY(${HEIGHT}px)` }}
        onPointerMove={(e) => {
          // Pressed and moved far enough, it is picked up and follows the pointer (issue 127); else a mouse tickles.
          const held = press.current;
          if (held) {
            if (!held.picked && Math.hypot(e.clientX - held.x, e.clientY - held.y) > PICK_UP_PX) held.picked = touched.current?.pick(held.x, held.y) ?? false;
            if (held.picked) touched.current?.drag(e.clientX, e.clientY);
          } else if (e.pointerType === 'mouse') touched.current?.tickle();
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          press.current = { x: e.clientX, y: e.clientY, picked: false };
        }}
        onPointerUp={() => {
          // Let go: thrown if it was picked up, else a click.
          const held = press.current;
          press.current = null;
          if (held?.picked) touched.current?.letGo();
          else if (held) touched.current?.poke();
        }}
        onPointerCancel={() => {
          const held = press.current;
          press.current = null;
          if (held?.picked) touched.current?.letGo();
        }}
      >
        <svg viewBox="0 0 22 13" width={WIDTH} height={HEIGHT} shapeRendering="crispEdges">
          {/* Its twin, as Detune splits it (issue 127): itself again, behind it. */}
          <use ref={twin} className="mascot-twin" style={{ display: 'none' }} />
          <g id="bead-self">
            <g ref={tail}>
              <g ref={keep(tails, 'logo')} style={{ display: 'none' }}>
                {tailOf(TAIL)}
              </g>
              {Object.entries(TAILS).map(([shape, stages]) => (
                <g key={shape} ref={keep(tails, shape)} style={{ display: 'none' }}>
                  {tailOf(stages)}
                </g>
              ))}
            </g>
            {part('form')}
            {part('splash')}
            {part('legs')}
            <g ref={keep(hats, 'ghost')} style={{ display: 'none' }}>
              {picture(HATS.ghost)}
            </g>
            {part('eyes')}
          </g>
          <g ref={ice} style={{ display: 'none' }}>
            {picture(ICE)}
          </g>
          <g ref={fuzz} className="mascot-static">
            {Array.from({ length: STATIC_DOTS }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a fixed set of dots, reused by position
              <rect key={i} width={1} height={1} style={{ display: 'none' }} />
            ))}
          </g>
          {(['christmas', 'party', 'nightcap'] as const).map((hat) => (
            <g key={hat} ref={keep(hats, hat)} className="mascot-prop" style={{ display: 'none' }}>
              {picture(HATS[hat])}
            </g>
          ))}
          {Object.entries(PROPS).map(([name, groups]) => (
            <g key={name} ref={keep(props, name)} className="mascot-prop" style={{ display: 'none' }}>
              {picture(groups)}
            </g>
          ))}
          <g ref={gun} style={{ display: 'none' }}>
            <g className="mascot-body">{rects(GUN.tank)}</g>
            <g className="mascot-gun">{rects(GUN.body)}</g>
            <g className="mascot-handle">{rects(GUN.grip)}</g>
          </g>
          <g ref={shutUmbrella} style={{ display: 'none' }}>
            <g className="mascot-umbrella">{rects(UMBRELLA.shut)}</g>
            <g className="mascot-handle">{rects(UMBRELLA.handle)}</g>
          </g>
          <g ref={umbrella} style={{ display: 'none' }}>
            <g className="mascot-umbrella">{rects(UMBRELLA.canopy)}</g>
            <g className="mascot-handle">{rects(UMBRELLA.handle)}</g>
          </g>
          <g ref={board} className="mascot-prop" style={{ display: 'none' }}>
            <g className="mascot-board">{rects(BOARD.deck)}</g>
            <g className="mascot-board-stripe">{rects(BOARD.stripe)}</g>
          </g>
        </svg>
      </div>
      <svg className="mascot-props" viewBox="0 0 22 13" width={WIDTH} height={HEIGHT} shapeRendering="crispEdges">
        <g ref={glass} style={{ display: 'none' }}>
          {Object.entries(WATER).map(([level, list]) => (
            <g
              key={level}
              ref={(g) => void (g ? water.current.set(level, g) : water.current.delete(level))}
              className="mascot-body"
              style={{ display: 'none' }}
            >
              {rects(list)}
            </g>
          ))}
          <g className="mascot-handle">{rects(GLASS)}</g>
        </g>
        <g ref={sky}>
          {Object.entries(SKY).map(([name, groups]) => (
            <g key={name} ref={keep(props, name)} className="mascot-prop" style={{ display: 'none' }}>
              {picture(groups)}
            </g>
          ))}
        </g>
      </svg>
    </div>
    </>
  );
}
