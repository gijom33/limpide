import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Theme } from '../app/rememberedSettings';
import type { Word } from '../input/callingPhrase';
import { lfos } from '../patch/patch';
import type { PatchStore } from '../patch/patchStore';
import { addToRenderLoop } from '../viewers/renderLoop';
import { lineAt, lineWiderThan } from './LfoPlot';
import { type Box, type Cling, clingBeside, type Guide, HEIGHT, RING, TWIN_PX, targetBox, WIDTH } from './mascotCling';
import { gesturesOf, looksOf } from './mascotGestures';
import { type Act, createMascotMotion, hatOn, type Pose, type Room, SCREAMING } from './mascotMotion';
import { CATCH, CLOUD, HATS, HOOK, ICE, type Picture, PROPS, type Rect, ROD_TIP, SKY, type Stage, TAILS } from './mascotPictures';
import {
  acrossOf, type Cover, choosePerch, clearAlong, createMascotPlace, type Drawing, drawingOf, HOVER_UNDER, type Moving, nearestSpan, type Perch, ridesFor, type Span,
  standingCard, throwWalls, type Visit, visitEnds,
} from './mascotPlace';
import { createSpray, MOST_DROPLETS } from './mascotSpray';
import { ModulationContext } from './modulationRing';
import { SECTIONS, STACKED } from './sections';

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

/** Its props, on the same grid: an umbrella over its head, wider than it (folded, then open), a glass. */
const UMBRELLA = {
  canopy: [[4, -11, 1, 1], [2, -10, 5, 1], [0, -9, 9, 1], [-2, -8, 13, 1], [-3, -7, 15, 1], [-3, -6, 1, 1], [0, -6, 2, 1], [3, -6, 3, 1], [7, -6, 2, 1], [11, -6, 1, 1]],
  shut: [[4, -11, 1, 1], [3, -10, 3, 5]],
  handle: [[4, -5, 1, 5]],
} satisfies Record<string, Rect[]>;
/** The open umbrella's span across and its top, on the grid: the rain falling there ends on it. */
const CANOPY = { from: -3, to: 12, top: -8 };
/** The rain falls from a stretch of sky this wide either side of it, from this high over its edge, in pixels. */
const RAIN_WIDE = 80;
const RAIN_HIGH = 120;
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
 * Drinking: the glass's rim (its middle, on the glass) goes to here, turned this far: over its mouth, under its eyes,
 * the glass running off to the left just under its left eye (the owner, 2026-10-30: over the mouth, then a bit higher).
 */
const RIM = { x: -5, y: 5 };
const POURING_AT = { x: 4, y: 10.5 };
const TURNED_OVER = 100;
/** Its mouth's height on the drawing: the poured water ends there, just under the rim. */
const MOUTH_Y = 12.5;

/** Room over its head for its leaps and the splash. */
const HEADROOM = 18;
/** How far under the section strip an edge must show for it to stand there, in pixels (issue 142). */
const EDGE_SHOWING = 2;
/** Hovering, how far either way from where it lost ground it may stray, in pixels (issue 142). */
const HOVER_REACH = 12;
/** How long it takes to come up from behind its edge, or down from under the header to hover. */
export const RISE_SECONDS = 0.4;
/** The drop's middle from its box's left, and its tail's length turned down under it, in pixels. */
const DROP_MIDDLE = 9;
const TAIL_LENGTH = 26;
/** Its tail whirling under it, flying up or hovering: how many times a second, and how far either way, in degrees. */
const WHIRLS = 12;
const WHIRL_DEGREES = 22;

/** Whether an edge leaves room above it in the window for the mascot to stand on it, its headroom too. */
const roomAbove = (box: DOMRect) => box.top - HEIGHT - HEADROOM >= 0;
/** The sections in the right-hand column: their right edges at the rightmost, give or take a few pixels. */
function rightColumn<S extends { box: DOMRect }>(sections: readonly S[]): S[] {
  const rightmost = Math.max(...sections.map((s) => s.box.right));
  return sections.filter((s) => rightmost - s.box.right < 4);
}

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
/** Its eyes follow a pointer this near its middle, in pixels. */
const EYES_ON_PX = 150;
/** The pixels of its static with the Noise. */
const STATIC_DOTS = 10;
/** The Demo's acts, one per part in turn; surfing an LFO's shape only where one is in view (the owner, 2026-10-30). */
const ACTS: readonly Act[] = ['conduct', 'airGuitar', 'surf'];
const LFO_PLOTS = '.lfo-plot[data-lfo]';

/** What it must keep clear of, above its edge: the controls, and (in three and four across) the Viewers. */
const CONTROLS = 'button, [role=slider], [role=tab], [role=radio], input, .piano, .knob-value, .fader';
/** The spots tried along an edge, this many pixels apart. */
const STEP = 4;
/**
 * What is drawn over the page, which it never stands under (issue 164): the docked cards (the Demo's, a Tutorial's, the
 * Tour's), the tips, the open panels and menus, the Preset's description and the Patch's plain words (issue 123). It
 * stays drawn under them, so it never covers their words or buttons.
 */
const DOCKED = '.docked:not([hidden])';
const PANELS = `${DOCKED}, .patch-about, .patch-words, .patch-panel, .destination-menu, .tutorial-menu-panel, .tempo-panel, .display-panel, .midi-panel, .learn-bar, .quick-setup`;
const COVERS = `${PANELS}, .tooltip:not([hidden])`;
/**
 * The page's text, which it never stands over (issue 181): every label, readout and heading, as the boxes of its lines,
 * but what is drawn over it anyway (the cards, tips and panels) and what only a screen reader reads.
 */
const NOT_TEXT = `.mascot, .visually-hidden, ${COVERS}`;
function readText(): Cover[] {
  const boxes: Cover[] = [];
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const el = node.parentElement;
    if (!el || !/\S/.test(node.nodeValue ?? '') || el.closest(NOT_TEXT)) continue;
    range.selectNodeContents(node);
    const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (lines.length && el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) boxes.push(...lines.map(({ left, right, top, bottom }) => ({ left, right, top, bottom })));
  }
  return boxes;
}
/** The text is read again this often, in seconds, or this soon after the page scrolls (issue 181). */
const TEXT_SECONDS = 0.5;
const TEXT_SCROLLED = 0.1;
/** Pointing the way (issue 151): what may stand beside a control it clings to, as little covered as can be. */
const NEIGHBOURS = '[data-learn], canvas, [role=tab], button, h2, h3';
/** Its tail's height over its foot, where its aim at a control is taken from. */
const TAIL_HEIGHT = 12;
/** The steepest it aims its tail, up or down, in degrees. */
const STEEPEST_AIM = 60;
/** Sliding down the panel, a drip left behind it this often, in seconds. */
const SLIDE_DRIPS = 0.09;

/**
 * Its room along a section's top edge, in the window's pixels: within the stretches `clear` of the cards, tips and panels
 * (issue 164), the spots where it covers least of what is above the edge, standing (its leaps may brush past it); of
 * those, the run of spots nearest to `near`, where it is, or with nothing over the edge the leftmost run, as before: the
 * whole edge in three or four across.
 * On a phone and in 2 × 2 the Viewer of the section above comes down to just over the edge all along it: there it keeps
 * clear of the controls only, and passes over the Viewer's bottom, rather than being kept to the edge's left end (the
 * owner, 2026-10-30).
 */
function roomOn(section: DOMRect, viewers: boolean, clear: readonly Span[], near: number): Room {
  const box = { top: section.top - HEIGHT - 2, bottom: section.top };
  const above = [...document.querySelectorAll<HTMLElement>(viewers ? `${CONTROLS}, canvas` : CONTROLS)]
    .filter((el) => !el.closest('.mascot') && el.checkVisibility({ visibilityProperty: true }))
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.top < box.bottom && r.bottom > box.top && r.right > section.left && r.left < section.right);
  const covers = (x: number) =>
    above.reduce(
      (sum, r) => sum + Math.max(0, Math.min(r.right, x + WIDTH) - Math.max(r.left, x)) * Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top)),
      0,
    );
  // Each clear stretch's spots, as runs: with nothing over the edge, one run, from its left end.
  const stretches = clear.map(({ min, max }) => Array.from({ length: Math.floor((max - min) / STEP) + 1 }, (_, i) => min + i * STEP));
  const spots = stretches.flat();
  if (!spots.length) return { min: section.left, max: Math.max(section.left, section.right - WIDTH) };
  const least = Math.min(...spots.map(covers));
  // Within a pixel row of the least is as clear.
  const runs = stretches.flatMap((run) =>
    run.reduce<Span[]>((found, x) => {
      if (covers(x) > least + WIDTH) return found;
      const last = found.at(-1);
      if (last && x - last.max <= STEP) last.max = x;
      else found.push({ min: x, max: x });
      return found;
    }, []),
  );
  return nearestSpan(runs, near)!;
}

/**
 * Its room hovering (issue 142): along `line`, within `HOVER_REACH` of `at`, where it lost ground; arriving with no edge
 * in view (`at` null), about a spot at random.
 */
function hoverRoom(line: Span, at: number | null): Room {
  const spot = at === null ? line.min + Math.random() * (line.max - line.min) : Math.min(line.max, Math.max(line.min, at));
  return { min: Math.max(line.min, spot - HOVER_REACH), max: Math.min(line.max, spot + HOVER_REACH) };
}

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

/** The four sections on the page, by name, where shown. */
const sectionBoxes = () =>
  SECTIONS.map(({ name }) => ({ id: name as string, box: document.querySelector(`section[aria-label="${name}"]`)?.getBoundingClientRect() })).filter(
    (s): s is { id: string; box: DOMRect } => !!s.box && s.box.width > 0,
  );

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
  const twin = useRef<SVGUseElement>(null);
  const ice = useRef<SVGGElement>(null);
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
  const demoPartNow = useEffectEvent(() => demoPart);
  const leavingNow = useEffectEvent(() => leaving);
  const guideNow = useEffectEvent(() => guide);
  const gone = useEffectEvent(onGone);

  useEffect(() => {
    if (!context) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)');
    // Phones and the sections 2 × 2: it keeps in view as the page scrolls.
    const stacked = matchMedia(STACKED);
    const motion = createMascotMotion();
    const arrival = (['rise', 'rain', 'pop'] as const)[Math.floor(Math.random() * 3)];
    const place = createMascotPlace(arrival === 'rain' ? { from: -HEADROOM } : {});
    motion.dress(hatOn(new Date()));
    const stopListening = patches.subscribe(({ before, after, by }) => {
      for (const gesture of gesturesOf(before, after, by)) motion.gesture(gesture, context.engine.now());
      // Resonance turned past three quarters: it screams a moment (issue 127).
      if (by !== 'load' && after.resonance !== before.resonance && after.resonance > SCREAMING) motion.scream(context.engine.now());
      // A Waveform chosen: its tail takes that wave a moment (issue 127).
      if (by !== 'load' && after.waveform !== before.waveform) motion.wave(after.waveform, context.engine.now());
      else if (by !== 'load' && after.osc2Waveform !== before.osc2Waveform) motion.wave(after.osc2Waveform, context.engine.now());
    });
    // Where the pointer is in the window, for its eyes.
    let pointer: { x: number; y: number } | null = null;
    const follow = (e: PointerEvent) => void (pointer = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null);
    addEventListener('pointermove', follow, { passive: true });
    let shown: Pose | null = null;
    let up = 0; // how far it has come into view, 0 to 1
    let comingFrom: 'edge' | 'header' | 'sky' | null = null;
    let last = performance.now() / 1000;
    let perch: Perch | null = null;
    let foot: number | null = null;
    let moving: Moving = 'standing';
    let leaveBy: 'melt' | 'rain' | null = null;
    let room: { key: string; room: Room } | null = null;
    const between = (a: number, b: number) => a + Math.random() * (b - a);
    // Three or four across: a visit to another section now and then, or a ride on an LFO's plot (issue 141).
    let visit: Visit | null = null;
    // The page's text as last read, and when, where the page was scrolled and how big the window was (issue 181).
    let text: { at: number; x: number; y: number; width: number; height: number; boxes: Cover[] } | null = null;
    const textNow = (seconds: number) => {
      const since = text ? seconds - text.at : Infinity;
      const scrolled = text && (text.x !== scrollX || text.y !== scrollY);
      const resized = text && (text.width !== innerWidth || text.height !== innerHeight);
      if (!text || resized || since >= TEXT_SECONDS || (scrolled && since >= TEXT_SCROLLED)) {
        text = { at: seconds, x: scrollX, y: scrollY, width: innerWidth, height: innerHeight, boxes: readText() };
      }
      return text.boxes;
    };
    // Gone out of sight with nowhere clear to be (issue 192), to come back into view once somewhere is.
    let hid = false;
    // Sent away on a ride: it jumps home first, and melts once it has landed there.
    let gettingOff = false;
    let nextVisit = context.engine.now() + between(15, 35);
    const droplets = createSpray();
    let lastExhaust = -Infinity;
    // Where its middle is in the page, for droplets flung by a click.
    let middle = { x: 0, y: 0 };
    // Where it was drawn last, in the window: its box's left and its foot.
    let drawnAt = { left: 0, foot: 0 };
    // Held by the pointer: where it took hold of it, from its box's left and its foot, and its last moves, for the throw.
    let grip = { x: 0, y: 0 };
    let moves: { t: number; x: number; y: number }[] = [];
    // A theme switched in Display: it reacts once the panel is closed, where it can be seen.
    let themeSwitched: Theme | null = null;
    // Pointing the way (issue 151): a new Step's bounce, due once beside its control; the Section it is clinging in, or
    // on its way down to a control in; the control it last clung to, where it stays while the next is out of reach;
    // where it clings beside each control, worked out again only as the control or what covers the page moves.
    let bounceDue = false;
    let wasGuided = false;
    let clungIn: string | null = null;
    let clungTo: Element | null = null;
    let lastDrip = -Infinity;
    const clings = new WeakMap<Element, { key: string; cling: Cling | null }>();
    // Each control it clings to, told from the next.
    const ids = new WeakMap<Element, number>();
    let lastId = 0;
    const idOf = (el: Element) => {
      if (!ids.has(el)) ids.set(el, ++lastId);
      return ids.get(el)!;
    };
    /**
     * Where it clings beside `el`, if it is within reach: shown, on the window under `ceiling`, under none of `blocks`;
     * its twin `twin` off on its side, over no `text` (issues 181 and 192).
     */
    const clingFor = (el: Element, blocks: readonly Box[], ceiling: number, card: Box | null, text: readonly Box[], twin: number): { box: DOMRect; cling: Cling | null } => {
      const box = el.getBoundingClientRect();
      const target = el.getAttribute('data-tutorial-target');
      // Shown: a tab coming into view is laid out a moment before it is visible.
      const shown = box.width > 0 && el.checkVisibility({ visibilityProperty: true });
      // The text within its reach either side of the control: as far as it may go along or down, and its twin.
      const reach = 2 * WIDTH + RING + TWIN_PX;
      // Still beside it, the sound no longer stretching it (issue 151), a pixel apart is room enough.
      const near = text
        .filter((t) => t.right > box.left - reach && t.left < box.right + reach && t.bottom > box.top - HEIGHT && t.top < box.bottom + 2 * HEIGHT)
        .map((t) => ({ left: t.left - 1, right: t.right + 1, top: t.top - 1, bottom: t.bottom + 1 }));
      const key = [
        shown, box.left, box.top, box.width, box.height, innerWidth, innerHeight, ceiling, target, twin,
        ...[...blocks, ...near].flatMap((b) => [b.left, b.top, b.right, b.bottom].map(Math.round)),
      ].join(' ');
      const known = clings.get(el);
      if (known?.key === key) return { box, cling: known.cling };
      const reachable = shown && box.top >= ceiling && box.bottom <= innerHeight && !blocks.some((b) => b.left < box.right && b.right > box.left && b.top < box.bottom && b.bottom > box.top);
      let cling: Cling | null = null;
      if (reachable) {
        const scope = el.closest('section[aria-label], header') ?? document.body;
        const neighbours = [...scope.querySelectorAll(NEIGHBOURS)]
          .filter((n) => n !== el && !n.contains(el) && !el.contains(n) && !n.closest('.mascot'))
          .map((n) => n.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.height > 0);
        const ring = { left: box.left - RING, right: box.right + RING, top: box.top - RING, bottom: box.bottom + RING };
        cling = clingBeside({
          control: box,
          keepClear: [ring, ...(target ? [targetBox(box, target)] : []), ...blocks],
          neighbours,
          card,
          within: { left: 0, right: document.documentElement.clientWidth, top: ceiling, bottom: innerHeight },
          text: near,
          twin,
        });
      }
      clings.set(el, { key, cling });
      return { box, cling };
    };
    touched.current = {
      tickle: () => motion.tickle(context.engine.now()),
      poke: () => {
        motion.poke(context.engine.now());
        motion.gesture('louder', context.engine.now());
        droplets.fling(9, middle.x, middle.y, 'all');
      },
      pick: (x, y) => {
        if (still.matches || leaveBy !== null || leavingNow()) return false;
        grip = { x: x - drawnAt.left, y: y - drawnAt.foot };
        moves = [{ t: performance.now() / 1000, x, y }];
        motion.pickUp(context.engine.now());
        place.hold(drawnAt.left, drawnAt.foot);
        return true;
      },
      drag: (x, y) => {
        const t = performance.now() / 1000;
        moves = [...moves.filter((m) => t - m.t < 0.1), { t, x, y }];
        place.hold(x - grip.x, y - grip.y);
      },
      letGo: () => {
        // Its speed over the last tenth of a second.
        const [first, last] = [moves[0], moves.at(-1)!];
        const dt = Math.max(0.016, last.t - first.t);
        place.toss((last.x - first.x) / dt, (last.y - first.y) / dt, throwWalls(document.body.getBoundingClientRect()));
        motion.thrown(context.engine.now());
      },
      word: (w) => motion.word(w, context.engine.now()),
      theme: (t) => void (themeSwitched = t),
      step: () => void (bounceDue = true),
      made: () => motion.gesture('hop', context.engine.now()),
      finished: () => motion.trick('fountain', context.engine.now()),
    };
    const stopDrawing = addToRenderLoop(() => {
      const outer = frame.current!;
      const seconds = performance.now() / 1000;
      const dt = Math.min(0.1, seconds - last);
      last = seconds;
      const now = context.engine.now();
      // Every layout read first, before this frame writes anything: a read after a write would make the browser work
      // out the page's styles again in the middle of the frame.
      const sections = sectionBoxes();
      if (!sections.length) return;
      const page = (outer.offsetParent ?? document.body).getBoundingClientRect();
      // What is over the page: it never stands under it (issue 164).
      const covers: Cover[] = [...document.querySelectorAll(COVERS)].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
      // Its whole drawing, its twin on Detune's side as far as it goes (issues 174 and 192): kept clear of the covers; and
      // standing, its tail swung down under its foot too, kept clear of the page's text (issue 181).
      const twinWay = Math.sign(shown?.twin ?? 0) * TWIN_PX;
      const drawing = drawingOf({ twin: twinWay });
      const standing = drawingOf({ twin: twinWay, resting: true });
      const texts = textNow(seconds);
      // The card it may stand on: the topmost docked (issue 192).
      const docked = standingCard(
        [...document.querySelectorAll(DOCKED)].map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0),
        drawing,
      );
      const card = docked ? { id: 'card', box: docked } : null;
      /** Along a line, where it is under no cover; and where it stands, over no text either (issue 181). */
      const clearOf = (box: { left: number; right: number; top: number }, drawn: Drawing) => clearAlong(box, covers, drawn);
      const clearOn = (box: DOMRect) =>
        clearOf(box, drawing).flatMap((s) => clearAlong({ left: s.min, right: s.max + WIDTH, top: box.top }, texts, standing));
      // A Tutorial or the Tour open (issue 151): its own life paused, its visits too; closed, home it goes, its life again.
      const guide = leaveBy === null && !leavingNow() ? guideNow() : null;
      motion.guide(guide !== null);
      if (wasGuided && !guide) {
        visit = null;
        nextVisit = now + between(15, 35);
        motion.point(null);
        clungIn = clungTo = null;
        bounceDue = false;
      }
      wasGuided = guide !== null;
      const perchBefore = perch?.id ?? null;
      if (themeSwitched && !document.querySelector('.display-panel, [role=dialog]')) {
        motion.theme(themeSwitched, now);
        themeSwitched = null;
      }

      // The plots of the LFOs that are on, in view, wide enough for it and clear of the cards (issue 164): in a Demo part,
      // to surf; outside the Demo, those it may ride now and then (issue 141). Looked for only in a Demo part, on a ride,
      // or with a visit due and an LFO to ride, so a frame costs no more while it stays home.
      const part = demoPartNow();
      const rideLfos = stacked.matches ? [] : ridesFor(lfos(context.patch()), context.engine.tempo().bpm, { demo: part !== null, reduced: still.matches });
      const looking = part !== null || (rideLfos.length > 0 && (visit ? visit.ride !== undefined : now >= nextVisit));
      const plots = !looking ? [] : [...document.querySelectorAll<HTMLElement>(`${LFO_PLOTS}:not([data-inactive])`)]
        .map((el) => ({ lfo: Number(el.dataset.lfo) as 1 | 2, box: el.getBoundingClientRect() }))
        .map((p) => ({ ...p, clear: clearOf({ left: p.box.left, right: p.box.right, top: p.box.bottom }, drawingOf({ twin: twinWay, above: p.box.height })) }))
        .filter(({ box, clear }) => lineWiderThan(box.width, WIDTH) && roomAbove(box) && box.bottom <= innerHeight && clear.length > 0);
      const rideable = plots.filter((p) => rideLfos.includes(p.lfo));

      // Its line: the top right section's edge; on a phone or in 2 × 2, a right-column edge in view, or a line under the
      // header to hover on.
      let on: { id: string; box: DOMRect };
      let homeId: string | null = null;
      // Now and then a visit to another section in view: down to one below, or across to one beside; then home.
      const inView = (s: { box: DOMRect }) => roomAbove(s.box) && s.box.top <= innerHeight - 4 && clearOn(s.box).length > 0;
      // A visit's or a ride's end (issues 141, 151); the window turning stacked ends it too (issue 192).
      if (
        visit &&
        visitEnds(visit, {
          now,
          stacked: stacked.matches,
          rideable: rideable.map((p) => p.lfo),
          inView: visit.ride ? [] : sections.filter((s) => s.id === visit!.id && inView(s)).map((s) => s.id),
          held: moving === 'held',
          leaving: leavingNow(),
          guided: guide !== null,
        })
      ) {
        if (visit.ride && leavingNow()) gettingOff = true;
        visit = null;
        nextVisit = now + between(20, 40);
      }
      if (!stacked.matches) {
        const top = Math.min(...sections.map((s) => s.box.top));
        const home = sections.filter((s) => s.box.top - top < 4).reduce((a, b) => (b.box.right > a.box.right ? b : a));
        homeId = home.id;
        // Not in the middle of a funny turn: it plays to its end first (the owner, 2026-10-30).
        if (!visit && now >= nextVisit && !guide && !still.matches && leaveBy === null && !leavingNow() && moving === 'standing' && !shown?.doing) {
          // A plot to ride (issue 141) is a choice beside the sections in view.
          const choices = [
            ...rideable.map((p) => ({ id: `ride ${p.lfo}`, ride: p.lfo })),
            ...sections.filter((s) => s.id !== home.id && inView(s)).map((s) => ({ id: s.id })),
          ];
          if (choices.length) visit = { ...choices[Math.floor(Math.random() * choices.length)], until: now + between(8, 18) };
          else nextVisit = now + between(10, 20);
        }
        on = sections.find((s) => s.id === visit?.id) ?? home;
        // Its edge covered (issue 164): the nearest edge in view clear of it, else the docked card's top.
        if (!clearOn(on.box).length) {
          const off = (s: { box: DOMRect }) => Math.hypot(Math.max(0, s.box.left - drawnAt.left, drawnAt.left - s.box.right), s.box.top - drawnAt.foot);
          const nearest = sections.filter(inView).sort((a, b) => off(a) - off(b))[0];
          on = nearest ?? (card && clearOn(card.box).length ? card : on);
        }
        perch = { id: on.id, foot: on.box.top, hovering: false };
      } else {
        const column = rightColumn(sections).sort((a, b) => a.box.top - b.box.top);
        const [header, strip] = ['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0);
        const ceiling = Math.max(0, header, strip);
        // Under the section strip, not the header, an edge is a line for it while it shows under the strip, the drop over
        // the strip's foot (issue 142): hovering, it would be just off that line.
        const overlap = strip > header ? HEIGHT - EDGE_SHOWING : 0;
        const span = column[0].box;
        // Its hover line, clear of what covers it up to the top of its bob, the header's foot (issues 164 and 192).
        const hoverLine = { left: span.left + 4, right: span.right - 4, top: ceiling + HEIGHT + HOVER_UNDER };
        perch = choosePerch({
          current: perch?.id ?? null,
          edges: column.map((s) => ({ id: s.id, top: s.box.top, covered: !clearOn(s.box).length })),
          card: card && { id: card.id, top: card.box.top, covered: !clearOn(card.box).length },
          ceiling, overlap, bottom: innerHeight,
          height: HEIGHT, headroom: HEADROOM, where: foot ?? ceiling,
          hoverCovered: !clearOf(hoverLine, drawingOf({ twin: twinWay, above: HOVER_UNDER })).length,
        });
        const id = perch.id;
        on = column.find((s) => s.id === id) ?? (id === card?.id ? card : { id, box: new DOMRect(span.left, perch.foot, span.width, 0) });
      }
      // Thrown (issue 127): it lands on the first edge under it that it comes down onto, staying there a while.
      if (moving === 'thrown') {
        const under = (stacked.matches ? rightColumn(sections) : sections)
          .filter((s) => s.box.left <= drawnAt.left + DROP_MIDDLE && s.box.right >= drawnAt.left + DROP_MIDDLE && s.box.top >= drawnAt.foot - 1)
          // Clear of what covers it there: once landed, it walks off any text to stand (issue 181).
          .filter((s) => clearOf(s.box, drawing).some((c) => drawnAt.left >= c.min - STEP && drawnAt.left <= c.max + STEP))
          .sort((a, b) => a.box.top - b.box.top)[0];
        if (under) {
          on = under;
          perch = { id: under.id, foot: under.box.top, hovering: false };
          if (homeId !== null) visit = under.id === homeId ? null : { id: under.id, until: now + between(8, 18) };
        }
      }
      // Pointing the way (issue 151): to the Step's or the card's control, by its usual move to the control's Section's
      // edge, then a slide down the panel to its side, where it clings; from beside another control of that Section, a
      // slide across. Out of reach (in a panel, under the card, on a hidden tab, off the window), it stays beside the
      // last control while that is still in reach, else on its edge, and looks at it. With reduced motion it only looks.
      let guideRoom: Room | null = null;
      let aimAt: { x: number; y: number } | null = null;
      let clinging: Cling | null = null;
      // Beside the control it is pointing the way to, rather than the last one, staying while that is out of reach.
      let beside = false;
      if (guide && moving !== 'held' && moving !== 'thrown') {
        let el = guide.selector ? document.querySelector(guide.selector) : null;
        if (guide.standIn && !el?.checkVisibility()) el = document.querySelector(guide.standIn);
        const blocks = [...document.querySelectorAll(PANELS)].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
        const ceiling = stacked.matches ? Math.max(0, ...['header', '.section-strip'].map((q) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0)) : 0;
        const found = el ? clingFor(el, blocks, ceiling, card?.box ?? null, texts, twinWay) : null;
        // A control on a hidden tab: towards its Section.
        const seen = found && found.box.width > 0 ? found.box : el?.closest('section[aria-label]')?.getBoundingClientRect();
        if (seen) aimAt = { x: (seen.left + seen.right) / 2, y: (seen.top + seen.bottom) / 2 };
        let to = found?.cling ? { el: el!, cling: found.cling } : null;
        const sliding = moving === 'sliding' || moving === 'clinging';
        if (!to && sliding && clungTo?.isConnected) {
          const stay = clingFor(clungTo, blocks, ceiling, card?.box ?? null, texts, twinWay).cling;
          if (stay) to = { el: clungTo, cling: stay };
        }
        beside = !!to && to.el === el;
        if (to && !still.matches) {
          // Its Section's edge; for a control outside the Sections (the Display button), the edge just under it.
          const own = to.el.closest('section[aria-label]')?.getAttribute('aria-label');
          const [middle, high] = [to.cling.left + DROP_MIDDLE, to.cling.foot];
          const edge = own
            ? sections.find((s) => s.id === own)
            : sections.filter((s) => s.box.left <= middle && s.box.right >= middle && s.box.top >= high).sort((a, b) => a.box.top - b.box.top)[0];
          const section = edge?.id ?? null;
          const edgeClear = edge && edge.box.top - HEIGHT - HEADROOM >= ceiling && edge.box.top <= innerHeight - 4 ? clearOn(edge.box) : [];
          const along = nearestSpan(edgeClear, to.cling.left);
          const spot = along && Math.min(along.max, Math.max(along.min, to.cling.left));
          const settled = moving === 'standing' || moving === 'hovering' || moving === 'landing';
          const atSpot = spot !== null && perchBefore === section && moving === 'standing' && Math.abs(drawnAt.left - spot) < 1.5;
          if ((sliding && (clungIn === section || to.el === clungTo)) || atSpot || (spot === null && (settled || sliding))) {
            perch = { id: `cling ${idOf(to.el)}`, foot: to.cling.foot, hovering: false, cling: true };
            guideRoom = { min: to.cling.left, max: to.cling.left };
            clungIn = section;
            clungTo = to.el;
            clinging = to.cling;
          } else if (spot !== null && edge) {
            // First its usual move to the Section's edge, over the control.
            on = edge;
            perch = { id: edge.id, foot: edge.box.top, hovering: false };
            guideRoom = { min: spot, max: spot };
          }
        }
      }
      // Through a Demo part, one of its acts in turn; surfing, its line is an LFO's shape as its plot draws it: the
      // first in view of an LFO that is on, its Depth above 0 (the owner, 2026-10-30). With none, another act.
      // Riding outside the Demo (issue 141), the same, on the plot it chose; a funny turn begun meanwhile plays there.
      const ride = visit?.ride ? rideable.find((p) => p.lfo === visit!.ride) : undefined;
      let act: Act | null = part === null || leaveBy !== null ? null : ACTS[part % ACTS.length];
      if (act === 'surf' && !plots.length) act = part! % 2 ? 'airGuitar' : 'conduct';
      motion.act(act ?? (ride ? 'surf' : null));
      const plot = act === 'surf' ? plots[0] : ride;
      let surfRoom: Room | null = null;
      if (plot && !still.matches && moving !== 'held' && moving !== 'thrown' && (ride || !shown?.doing)) {
        // Where the plot draws the LFO under its middle: a second of it across, the newest at the right.
        const { box } = plot;
        const wave = box.top + lineAt({ engine: context.engine, lfo: plot.lfo, box, x: drawnAt.left + DROP_MIDDLE - box.left, now });
        perch = { id: `surf ${plot.lfo}`, foot: wave, hovering: false };
        surfRoom = nearestSpan(plot.clear, drawnAt.left)!;
      }
      // Leaving: on its line it melts; hovering or in the air it drips away down the window.
      if (leavingNow() && leaveBy === null && !gettingOff) {
        leaveBy = moving === 'standing' || moving === 'landing' ? 'melt' : 'rain';
        if (leaveBy === 'melt') motion.leave(now);
      }
      if (leaveBy === 'rain') perch = { id: 'away', foot: innerHeight + HEIGHT + HEADROOM, hovering: false };

      // Its room along the line, found again only when the line moves against the page (the card's top, against the
      // window) or changes, or what covers it does.
      const box = on.box;
      // Hovering, clear of what covers it up to the top of its bob, the header's foot (issue 164): the page moves under
      // it there, so text may. Standing, clear of text too (issue 181), or, with no such spot, of what covers it.
      const clear = perch.hovering
        ? clearOf({ left: box.left + 4, right: box.right - 4, top: perch.foot }, drawingOf({ twin: twinWay, above: HOVER_UNDER }))
        : clearOn(box);
      const fallback = perch.hovering || clear.length ? [] : clearOf(box, drawing);
      const [dx, dy] = on === card ? [0, 0] : [scrollX, scrollY];
      const key = `${perch.id} ${box.left + dx} ${perch.hovering ? 0 : box.top + dy} ${box.width} ${[...clear, ...fallback].map((c) => `${Math.round(c.min)}-${Math.round(c.max)}`)}`;
      if (surfRoom) room = { key: 'surf', room: surfRoom };
      else if (room?.key !== key) {
        const whole = { min: box.left, max: box.right - WIDTH };
        // Nothing over the edge, it keeps to the leftmost run, as before; something over it, the run nearest to it.
        const uncovered = clear.length === 1 && clear[0].min === whole.min && clear[0].max === whole.max;
        room = {
          key,
          room: perch.hovering
            ? hoverRoom(nearestSpan(clear, drawnAt.left) ?? { min: box.left + 4, max: box.right - WIDTH - 4 }, shown ? drawnAt.left : null)
            : roomOn(box, !stacked.matches, clear.length ? clear : fallback.length ? fallback : [whole], uncovered ? -Infinity : drawnAt.left),
        };
      }

      const span = guideRoom ?? room.room;
      // Facing the control, its tail aimed at it: level beside it, else from where it is (issue 151).
      if (!guide) motion.point(null);
      else if (clinging && beside && moving === 'clinging') motion.point({ way: clinging.turn, angle: 0 }, true);
      else if (aimAt) {
        const [ax, ay] = [aimAt.x - drawnAt.left - DROP_MIDDLE, aimAt.y - drawnAt.foot + TAIL_HEIGHT];
        const angle = Math.max(-STEEPEST_AIM, Math.min(STEEPEST_AIM, (Math.atan2(ay, Math.abs(ax)) * 180) / Math.PI));
        motion.point({ way: ax < 0 ? -1 : 1, angle }, clinging !== null);
      } else motion.point(null);
      const m = context.engine.modulationAt();
      const heard = lfos(context.patch()).flatMap((l, i) => (l.amount > 0 ? [m.lfo[i]] : []));
      const amp = m.amp * m.volume;
      // Its eyes on a pointer near its middle.
      const near = pointer && Math.hypot(pointer.x - drawnAt.left - DROP_MIDDLE, pointer.y - drawnAt.foot + HEIGHT / 2) < EYES_ON_PX;
      motion.pointer(near && pointer ? pointer.x - drawnAt.left - DROP_MIDDLE : null);
      const pose = motion.frame(
        { amp, sway: heard.length ? heard.reduce((a, b) => a + b, 0) / heard.length : 0, struck: m.struck, ...looksOf(context.patch(), amp) },
        now,
        still.matches,
        span,
      );
      // Run off: on a large screen, to another section.
      if (pose.escaped && !stacked.matches) nextVisit = now;
      const where = place.frame(perch, span, now, still.matches, pose.x);
      if (where.landedAt !== null) motion.place(where.landedAt);
      // Its leap across, or its hover, for its facing from the next frame (issue 179).
      motion.leaping(where.leap, where.moving === 'hovering');
      // One small bounce on arriving beside a control, and at each new Step or card: once there, or looking from afar.
      const arrived = where.landedAt !== null && where.moving === 'clinging';
      if (arrived || (bounceDue && guide && (where.moving === 'clinging' || (!clinging && !guideRoom)))) {
        motion.gesture('bounce', now);
        bounceDue = false;
      }
      // Caught on its hover line after a throw, it hovers about where it was caught: its room found there again.
      if (where.landedAt !== null && where.moving === 'hovering') room = null;
      foot = where.foot;
      moving = where.moving;
      if (moving === 'standing' || moving === 'landing') gettingOff = false;
      if (pose.gone || (leaveBy === 'rain' && where.foot >= innerHeight + HEIGHT)) {
        gone();
        return;
      }

      // Between lines and under the header, the line's moves take over the sound's and the controls'. It keeps its
      // facing, turned its way across a leap and back as it lands (issue 179), but in the pointer's hold or thrown.
      let tailTurn = 0;
      let origin = '20% 100%';
      const across = Math.max(-15, Math.min(15, where.vx / 40)); // leaning into its way across
      if (where.moving === 'held') {
        // Dangling from the pointer, wriggling, eyes wide.
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, turn: 1, eyes: 'wide', stretch: 1.12, tilt: Math.sin(now * 2 * Math.PI * 3) * 10 });
        origin = '20% 0%';
      } else if (where.moving === 'thrown') {
        // Tumbling through the air.
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, turn: 1, eyes: 'shut', stretch: 1 });
        pose.tilt = (now * 600 * (where.vx < 0 ? -1 : 1)) % 360;
        origin = '20% 60%';
      } else if (where.moving === 'hovering') {
        // On its tail, straight down under it and whirling (issue 142); its bob is in its foot, and nothing stretches it
        // up over the tabs. With reduced motion, still.
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, tilt: 0, stretch: 1 });
        tailTurn = 90 + (still.matches ? 0 : Math.sin(now * 2 * Math.PI * WHIRLS) * WHIRL_DEGREES);
      } else if (where.moving === 'falling') {
        // Hopping off, tucked; then a raindrop, longer the faster it falls.
        const speed = Math.max(0, where.vy);
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, tilt: across, eyes: where.vy < 0 ? 'happy' : 'open' });
        pose.stretch = where.vy < 0 ? 0.92 : 1 + Math.min(0.35, speed / 1600);
      } else if (where.moving === 'flying' && where.windup < 1) {
        // Crouching, its tail swinging round and down under it.
        Object.assign(pose, { legs: 'stand', splash: 'none', lift: 0, tilt: 0, eyes: 'happy', stretch: 1 - 0.15 * where.windup });
        tailTurn = 90 * where.windup;
      } else if (where.moving === 'flying') {
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, tilt: across, eyes: where.thrust ? 'happy' : 'open' });
        pose.stretch = 1 + Math.min(0.2, Math.abs(where.vy) / 2600);
        // Its tail straight down under it, whirling while it pushes, swinging back up as it coasts.
        tailTurn = where.thrust ? 90 + Math.sin(now * 2 * Math.PI * WHIRLS) * WHIRL_DEGREES : Math.max(0, Math.min(90, -where.vy / 6));
      } else if (where.moving === 'sliding') {
        // Running down the panel like a drop on glass, a little long, leaving drips behind (issue 151).
        Object.assign(pose, { legs: 'tuck', splash: 'none', lift: 0, tilt: 0, stretch: 1.08 });
      } else if (where.moving === 'clinging') {
        pose.legs = 'tuck';
      } else if (where.moving === 'landing' && leaveBy !== 'melt') {
        // Squashed as hard as it hit, then a wobble that dies away, like a drop of jelly.
        const p = where.landed;
        const wobble = Math.exp(-5 * p) * Math.cos(16 * p);
        Object.assign(pose, { legs: 'stand', lift: 0 });
        pose.stretch = 1 - 0.4 * where.impact * wobble;
        pose.splash = p < 0.3 ? 'wide' : 'none';
        pose.eyes = p < 0.15 ? 'shut' : where.impact > 0.5 && p < 0.55 ? 'happy' : pose.eyes;
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
      // Beside a control, or sliding there, the pointer passes through it to what is under it (issue 151).
      const pointing = where.moving === 'sliding' || where.moving === 'clinging' ? 'yes' : 'no';
      const marks = { act: act ?? '', ride: ride ? String(ride.lfo) : '', tail: pose.tail, hat: pose.hat, doing: pose.doing ?? '', prop: pose.prop, moving: where.moving, pointing };
      for (const [mark, value] of Object.entries(marks)) if (outer.dataset[mark] !== value) outer.dataset[mark] = value;

      drawnAt = { left: acrossOf(where, pose.x), foot: where.foot };
      const left = acrossOf(where, pose.x) - page.left + (pose.fuzz ? (Math.random() * 2 - 1) * pose.fuzz : 0);
      const ground = where.foot - page.top;
      outer.style.transform = `translate(${left}px, ${ground - HEIGHT - HEADROOM}px)`;
      // Its droplets, in the page: a splash as it lands (harder, more), its smash, its shake, its tail's spray.
      const base = { x: left + DROP_MIDDLE, y: ground };
      middle = { x: base.x, y: ground - HEIGHT / 2 - pose.lift };
      if (where.landedAt !== null && where.moving === 'landing') droplets.fling(5 + Math.round(9 * where.impact), base.x, base.y, 'up', where.impact);
      if (pose.burst) {
        const { count, spread: fling } = pose.burst;
        if (fling === 'rain') {
          // From the sky all around; on the umbrella, if it is open and the drop falls on it, else down to the edge.
          const grid = HEIGHT / 13;
          for (let i = 0; i < count; i++) {
            const at = base.x + (Math.random() * 2 - 1) * RAIN_WIDE;
            const onUmbrella = pose.prop === 'umbrella' && at >= left + CANOPY.from * grid && at <= left + CANOPY.to * grid;
            droplets.fling(1, at, ground - RAIN_HIGH, 'rain', 0.5, onUmbrella ? ground - HEIGHT + CANOPY.top * grid - pose.lift : ground);
          }
        } else {
          if (fling === 'arc') {
            // Up from its head, in an arc back down to its edge.
            droplets.fling(count, base.x, ground - HEIGHT - pose.lift, 'arc', pose.burst.aim ?? 0, ground);
          } else if (fling === 'pour') {
            // From the glass's rim, falling into its mouth.
            const grid = HEIGHT / 13;
            droplets.fling(count, left + POURING_AT.x * grid, ground - HEIGHT + POURING_AT.y * grid, 'pour', 1, ground - HEIGHT + MOUTH_Y * grid);
          } else if (fling === 'jet') {
            // From the muzzle, turned with it: the gun is drawn on its left.
            const facing = pose.turn < 0 ? -1 : 1;
            droplets.fling(count, left + DROP_MIDDLE + facing * (MUZZLE.x - DROP_MIDDLE), ground - HEIGHT - pose.lift + MUZZLE.y, 'jet', -facing);
          } else if (fling === 'shower') {
            // From under its cloud, down onto it.
            const grid = HEIGHT / 13;
            const at = left + (CLOUD.from + Math.random() * (CLOUD.to - CLOUD.from)) * grid;
            droplets.fling(count, at, ground - HEIGHT + CLOUD.bottom * grid, 'shower', 0.5, ground);
          } else {
            const top = ground - HEIGHT * pose.size - pose.lift;
            const from = fling === 'up' || fling === 'drip' ? base.y : fling === 'spout' || fling === 'steam' ? top : middle.y;
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
        const grid = HEIGHT / 13;
        const tip = ROD_TIP[pose.prop === 'rodBite' ? 'rodBite' : 'rod'];
        // The tip as the drop's transform puts it: scaled, then turned, about its foot, then lifted.
        const [ox, oy] = [WIDTH * 0.2, HEIGHT];
        const dx = (tip.x * grid - ox) * (2 - pose.stretch) * pose.turn * pose.size;
        const dy = (tip.y * grid - oy) * pose.stretch * pose.size;
        const a = (pose.tilt * Math.PI) / 180;
        const x = left + ox + dx * Math.cos(a) - dy * Math.sin(a);
        const y = ground - pose.lift + dx * Math.sin(a) + dy * Math.cos(a);
        const bottom = innerHeight - page.top + 30;
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
      // Coming into view: up from behind its edge (fast for a pop, then a hop), down from under the header, or, falling
      // from the top of the window, all at once.
      // With nowhere clear to be, it goes back up out of sight under the header or the tabs, and comes down again once
      // somewhere is (issue 192).
      comingFrom ??= perch.hovering ? 'header' : arrival === 'rain' ? 'sky' : 'edge';
      if (perch.waiting) [comingFrom, hid] = ['header', true];
      const wasUp = up;
      const popping = arrival === 'pop' && !hid;
      if (perch.waiting) up = still.matches ? 0 : Math.max(0, up - dt / RISE_SECONDS);
      else up = still.matches || comingFrom === 'sky' ? 1 : Math.min(1, up + dt / (popping ? RISE_SECONDS / 2 : RISE_SECONDS));
      if (popping && wasUp < 1 && up === 1) motion.gesture('new', now);
      const rise = up * up * (3 - 2 * up);
      const hidden = (1 - rise) * HEIGHT;
      outer.style.clipPath = up < 1 ? (comingFrom === 'header' ? `inset(${HEADROOM}px -60px -60px -60px)` : 'inset(-60px -60px 0 -60px)') : 'none';
      const el = drop.current!;
      el.style.opacity = String(pose.fade);
      el.style.transformOrigin = origin;
      el.style.transform = `translateY(${(comingFrom === 'header' ? -hidden : hidden) - pose.lift}px) rotate(${pose.tilt}deg) scale(${(2 - pose.stretch) * pose.turn * pose.size}, ${pose.stretch * pose.size})`;
    });
    return () => {
      stopListening();
      stopDrawing();
      removeEventListener('pointermove', follow);
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
    <div ref={frame} className="mascot" aria-hidden="true" style={{ width: WIDTH, height: HEIGHT + HEADROOM }}>
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
        {Object.entries(SKY).map(([name, groups]) => (
          <g key={name} ref={keep(props, name)} className="mascot-prop" style={{ display: 'none' }}>
            {picture(groups)}
          </g>
        ))}
      </svg>
    </div>
    </>
  );
}
