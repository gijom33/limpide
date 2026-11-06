import type { Theme } from '../app/rememberedSettings';
import type { Word } from '../input/callingPhrase';
import { type LfoNumber, lfos, type Patch } from '../patch/patch';
import type { PatchChange } from '../patch/patchStore';
import { createDemoActs } from './demoActs';
import { lineWiderThan } from './LfoPlot';
import { clingMove, DROP_MIDDLE, homeEdge, landingEdge, looksForPlots, nextVisitAt, perchAcross, ridePlot, STEP, staysBeside, visitDue, visitFor } from './mascotChoices';
import { type Box, type Cling, clingBeside, crosses, type Guide, HEIGHT, RING, ROWS, TAIL_HEIGHT, TWIN_PX, targetBox, WIDTH } from './mascotCling';
import { gesturesOf, looksOf } from './mascotGestures';
import { type Act, createMascotMotion, hatOn, type Pose, type Room, SCREAMING } from './mascotMotion';
import { HATS, ICE, PROPS, SKY_TOP, skyLift, topOf, UMBRELLA } from './mascotPictures';
import {
  acrossOf, type Cover, choosePerch, chooseVisit, clearAlong, createMascotPlace, type Drawing, drawingOf, HOVER_UNDER, type Moving, nearestSpan, type Perch, type Placed, rideOf, rideOnDrop,
  ridesFor, type Span, standingCard, surfLean, throwWalls, type Visit, visitEnds,
} from './mascotPlace';
import type { Trick } from './mascotTricks';

/**
 * Bead's frame in three steps (issue 245): the page is read into a `Reading` (`readPage`, or a script in the tests), a
 * frame decides from Bead's state, that reading and the time what it does (`createBeadFrame`'s `step`, touching no
 * page), and the Mascot draws what was decided.
 */

/** A box in the window's pixels, with its size. */
export interface Rect extends Box {
  width: number;
  height: number;
}

/** A section shown on the page, by name, and its box. */
export interface Section {
  id: string;
  box: Rect;
}

/** An LFO plot drawing an LFO that is on, with its own tips (issue 197): shown, they are over the plot while the pointer is. */
export interface Plot {
  lfo: LfoNumber;
  box: Rect;
  tips: readonly unknown[];
}

/** A control Bead points the way to, or clung to last (issue 151), as the page shows it now. */
export interface Control {
  box: Rect;
  /** Shown: a tab coming into view is laid out a moment before it is visible. */
  shown: boolean;
  /** Still in the page. */
  connected: boolean;
  /** The target text over it ("→ 800 Hz"), if any. */
  target: string | null;
  /** The Section holding it, by name, and that Section's box; null outside the Sections (the Display button). */
  section: string | null;
  sectionBox: Rect | null;
  /** What may stand beside it, as little covered as can be: in its Section, or the header. */
  neighbours(): readonly Box[];
}

/** The page as a frame reads it, in plain values: from the page itself (`readPage`), or from a script in the tests. */
export interface Reading {
  /** The four sections, where shown. */
  sections: readonly Section[];
  /** The box of what holds Bead's drawing: its writes are against it. */
  page: { left: number; top: number };
  window: { width: number; height: number; clientWidth: number; scrollX: number; scrollY: number };
  /** Phones and the sections 2 × 2: it keeps in view as the page scrolls. */
  stacked: boolean;
  reduced: boolean;
  /** The bottoms of the header and of a phone's section tabs, in the window; 0 for none. */
  header: number;
  strip: number;
  /** What is drawn over the page (issue 164), each with its box; the cards and panels of those; the docked cards. */
  coverings: readonly { el: unknown; box: Cover }[];
  panels: readonly Box[];
  docked: readonly Rect[];
  /** The page's text, as the boxes of its lines (issue 181). */
  text: readonly Cover[];
  /** Where the pointer is, a mouse's, for its eyes. */
  pointer: { x: number; y: number } | null;
  /** What it hears. `wave`: where a plot `box` draws LFO `lfo` at `x` from its left, the y from its top. */
  sound: {
    patch: Patch;
    bpm: number;
    lfo: readonly [number, number];
    amp: number;
    volume: number;
    struck: number | null;
    wave(lfo: LfoNumber, box: { width: number; height: number }, x: number): number;
  };
  /** What the app asks of it: sent away, the Demo part playing, a Tutorial or the Tour open. */
  asked: { leaving: boolean; demoPart: number | null; guide: Guide | null };
  // The rest are read only as a frame needs them, so a frame costs no more while it stays home.
  /** A panel or dialog open, which hides it. */
  dialogOpen(): boolean;
  /** The plots of the LFOs that are on. */
  plots(): readonly Plot[];
  /** The page's box, for the sides a throw bounces off. */
  body(): { left: number; right: number };
  /** The controls shown that reach into `band`, and with `viewers` the Viewers too. */
  controlsIn(band: Box, viewers: boolean): readonly Box[];
  /** The control `guide` points at (or its stand-in), as a handle; null for none. */
  guided(guide: Guide): object | null;
  /** A control by its handle, as it is now. */
  control(handle: object): Control;
}

/** What a frame decided, for the Mascot to draw. */
export interface Drawn {
  pose: Pose;
  where: Placed;
  /** Its own time, and the frame's length, in seconds. */
  now: number;
  dt: number;
  /** Its box's left in the window; its foot is `where.foot`. */
  left: number;
  /** The drop's transform origin; its tail's turn, in degrees. */
  origin: string;
  tailTurn: number;
  /** On its surfboard (issue 204). */
  onBoard: boolean;
  /** Drawn smaller about its foot, to be seen whole under what is over the page (issue 200). */
  shrink: number;
  /** How far up its sun and cloud are drawn, in squares of its grid (issue 237). */
  skyRows: number;
  /** What it is doing, for the tests and the stylesheet. */
  marks: { act: string; ride: string; board: string; tail: string; hat: string; doing: string; prop: string; moving: string; pointing: string };
  /** How far it has come into view (0 to 1), and from where. */
  up: number;
  comingFrom: 'edge' | 'header' | 'sky';
  page: { left: number; top: number };
  /** What is over the page above it: on a phone and in 2 × 2 the header's foot, else 0 (issue 200). */
  overPage: number;
  windowHeight: number;
}

/** Room over its head for its leaps and the splash. */
export const HEADROOM = 18;
/** How far under the section strip an edge must show for it to stand there, in pixels (issue 142). */
const EDGE_SHOWING = 2;
/** Hovering, how far either way from where it lost ground it may stray, in pixels (issue 142). */
const HOVER_REACH = 12;
/** How long it takes to come up from behind its edge, or down from under the header to hover. */
export const RISE_SECONDS = 0.4;
/** Its tail whirling under it, flying up or hovering: how many times a second, and how far either way, in degrees. */
const WHIRLS = 12;
const WHIRL_DEGREES = 22;
/** Its eyes follow a pointer this near its middle, in pixels. */
const EYES_ON_PX = 150;
/** The steepest it aims its tail, up or down, in degrees. */
const STEEPEST_AIM = 60;
/** On its board, the line's slope is read this many pixels across under its middle; its tail raised this many degrees. */
const SURF_SPAN = 8;
const BALANCING = 15;

/** How high each hat and prop drawn with the drop goes over the drop's top, on the grid. */
const HAT_TOP: Partial<Record<Pose['hat'], number>> = Object.fromEntries(Object.entries(HATS).map(([hat, p]) => [hat, topOf(p)]));
const PROP_TOP: Partial<Record<Pose['prop'], number>> = {
  ...Object.fromEntries(Object.entries(PROPS).map(([prop, p]) => [prop, topOf(p)])),
  umbrella: topOf([['', UMBRELLA.canopy]]),
  umbrellaShut: topOf([['', UMBRELLA.shut]]),
};

/** Whether an edge leaves room above it in the window for the mascot to stand on it, its headroom too. */
const roomAbove = (box: Box) => box.top - HEIGHT - HEADROOM >= 0;
/** The sections in the right-hand column: their right edges at the rightmost, give or take a few pixels. */
function rightColumn<S extends { box: Box }>(sections: readonly S[]): S[] {
  const rightmost = Math.max(...sections.map((s) => s.box.right));
  return sections.filter((s) => rightmost - s.box.right < 4);
}

/**
 * Its room along a section's top edge, in the window's pixels: within the stretches `clear` of the cards, tips and panels
 * (issue 164), the spots where it covers least of what is above the edge, standing (its leaps may brush past it); of
 * those, the run of spots nearest to `near`, where it is, or with nothing over the edge the leftmost run, as before: the
 * whole edge in three or four across.
 * On a phone and in 2 × 2 the Viewer of the section above comes down to just over the edge all along it: there it keeps
 * clear of the controls only, and passes over the Viewer's bottom, rather than being kept to the edge's left end (the
 * owner, 2026-10-30).
 */
function roomOn(reading: Reading, section: Rect, viewers: boolean, clear: readonly Span[], near: number): Room {
  const box = { top: section.top - HEIGHT - 2, bottom: section.top };
  const above = reading.controlsIn({ left: section.left, right: section.right, ...box }, viewers);
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
function hoverRoom(line: Span, at: number | null, random: () => number): Room {
  const spot = at === null ? line.min + random() * (line.max - line.min) : Math.min(line.max, Math.max(line.min, at));
  return { min: Math.max(line.min, spot - HOVER_REACH), max: Math.min(line.max, spot + HOVER_REACH) };
}

/** What is round a control Bead clings to: see `clingFor`. */
interface ClingAround {
  /** The panels over the page. */
  blocks: readonly Box[];
  /** The window's top it stays under: the header's foot, stacked. */
  ceiling: number;
  /** The docked card, if one shows. */
  card: Box | null;
  /** The text it keeps off. */
  text: readonly Box[];
  /** How far its twin stands off on its side. */
  twin: number;
}

/** What the frame starts from. */
export interface BeadStart {
  /** Its own time (the sound's, or the page's while the sound is held stopped), and the page's, in seconds. */
  clock: () => number;
  seconds: () => number;
  /** Stacked as it comes. */
  stacked: boolean;
  random?: () => number;
  /** The day it comes, for its hat. */
  date?: Date;
}

/**
 * Bead's state from frame to frame, and the frame's decision (issue 245): `step` takes a reading of the page and the
 * time, and returns what to draw, 'gone' once it has left, or null with no section shown to be on; it touches no page.
 * The rest are what reaches it between frames: the pointer, the words, the theme, a Tutorial's Steps, the patch.
 */
export function createBeadFrame({ clock, seconds: pageSeconds, stacked: stackedAtStart, random = Math.random, date = new Date() }: BeadStart) {
  const motion = createMascotMotion(random);
  const demoActs = createDemoActs();
  const arrival = (['rise', 'rain', 'pop'] as const)[Math.floor(random() * 3)];
  const place = createMascotPlace(arrival === 'rain' ? { from: -HEADROOM, random } : { random });
  motion.dress(hatOn(date));
  let shown: Pose | null = null;
  let up = 0; // how far it has come into view, 0 to 1
  let comingFrom: 'edge' | 'header' | 'sky' | null = null;
  let last = pageSeconds();
  let perch: Perch | null = null;
  let foot: number | null = null;
  let moving: Moving = 'standing';
  let leaveBy: 'melt' | 'rain' | null = null;
  let room: { key: string; room: Room } | null = null;
  /** The LFOs it may ride now (issue 141). */
  const ridesNow = (reading: Reading) => ridesFor(lfos(reading.sound.patch), reading.sound.bpm, { demo: reading.asked.demoPart !== null, reduced: reading.reduced });
  /**
   * The plots of the LFOs that are on, in view (on a phone and in 2 × 2, under the header and the section tabs, with
   * room for it over the plot), wide enough for it and clear of `coverings` (issue 164) for its drawing, its twin
   * `twinWay` off on its side, but for each plot's own tip (issue 197).
   */
  const plotsInView = (reading: Reading, twinWay: number) => {
    const under = reading.stacked ? Math.max(0, reading.header, reading.strip) : 0;
    return reading
      .plots()
      .map((p) => ({
        ...p,
        clear: clearAlong(
          { left: p.box.left, right: p.box.right, top: p.box.bottom },
          reading.coverings.filter((c) => !p.tips.includes(c.el)).map((c) => c.box),
          drawingOf({ twin: twinWay, above: p.box.height }),
        ),
      }))
      .filter(({ box, clear }) => lineWiderThan(box.width, WIDTH) && box.top - HEIGHT - HEADROOM >= under && box.bottom <= reading.window.height && clear.length > 0);
  };
  // Three or four across: a visit to another section now and then, or a ride on an LFO's plot (issue 141); on a phone
  // and in 2 × 2, a ride only (issue 197).
  let visit: Visit | null = null;
  // On a phone and in 2 × 2, the edge it left for a ride, to go back to (issue 197).
  let rodeFrom: string | null = null;
  // Gone out of sight with nowhere clear to be (issue 192), to come back into view once somewhere is.
  let hid = false;
  // Sent away on a ride: it jumps home first, and melts once it has landed there.
  let gettingOff = false;
  let nextVisit = nextVisitAt(clock(), 'first', stackedAtStart, random);
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
  let clungTo: object | null = null;
  const clings = new WeakMap<object, { key: string; cling: Cling | null }>();
  // Each control it clings to, told from the next.
  const ids = new WeakMap<object, number>();
  let lastId = 0;
  const idOf = (el: object) => {
    if (!ids.has(el)) ids.set(el, ++lastId);
    return ids.get(el)!;
  };
  /**
   * Where it clings beside `control`, if it is within reach: shown, on the window under `ceiling`, under none of
   * `blocks`; its twin `twin` off on its side, over no `text` (issues 181 and 192).
   */
  const clingFor = (reading: Reading, handle: object, { blocks, ceiling, card, text, twin }: ClingAround): { control: Control; cling: Cling | null } => {
    const control = reading.control(handle);
    const { box, shown, target } = control;
    const { width, height, clientWidth } = reading.window;
    // The text within its reach either side of the control: as far as it may go along or down, and its twin.
    const reach = 2 * WIDTH + RING + TWIN_PX + 4; // and its gap to the ring, with a little to spare
    // Each a pixel bigger: clinging, the sound no longer stretches nor leans it (issue 151), so a pixel keeps it apart.
    const near = text
      .filter((t) => t.right > box.left - reach && t.left < box.right + reach && t.bottom > box.top - HEIGHT && t.top < box.bottom + 2 * HEIGHT)
      .map((t) => ({ left: t.left - 1, right: t.right + 1, top: t.top - 1, bottom: t.bottom + 1 }));
    const key = [
      shown, box.left, box.top, box.width, box.height, width, height, ceiling, target, twin,
      ...[...blocks, ...near].flatMap((b) => [b.left, b.top, b.right, b.bottom].map(Math.round)),
    ].join(' ');
    const known = clings.get(handle);
    if (known?.key === key) return { control, cling: known.cling };
    const reachable = shown && box.top >= ceiling && box.bottom <= height && !blocks.some((b) => crosses(b, box));
    let cling: Cling | null = null;
    if (reachable) {
      const ring = { left: box.left - RING, right: box.right + RING, top: box.top - RING, bottom: box.bottom + RING };
      cling = clingBeside({
        control: box,
        keepClear: [ring, ...(target ? [targetBox(box, target)] : []), ...blocks],
        neighbours: control.neighbours(),
        card,
        within: { left: 0, right: clientWidth, top: ceiling, bottom: height },
        text: near,
        twin,
      });
    }
    clings.set(handle, { key, cling });
    return { control, cling };
  };

  /** One frame: from `reading` and the time, what to draw. */
  function step(reading: Reading): Drawn | 'gone' | null {
    const seconds = pageSeconds();
    const dt = Math.min(0.1, seconds - last);
    last = seconds;
    const now = clock();
    const { sections, stacked, reduced: still, asked } = reading;
    const innerHeight = reading.window.height;
    if (!sections.length) return null;
    // What is over the page: it never stands under it (issue 164).
    const covers: Cover[] = reading.coverings.map((c) => c.box);
    // Its whole drawing, its twin on Detune's side as far as it goes (issues 174 and 192): kept clear of the covers; and
    // standing, its tail swung down under its foot too, kept clear of the page's text (issue 181).
    const twinWay = Math.sign(shown?.twin ?? 0) * TWIN_PX;
    const drawing = drawingOf({ twin: twinWay });
    const standing = drawingOf({ twin: twinWay, resting: true });
    const texts = reading.text;
    // What is over the page above it, hiding what goes higher (issue 200): on a phone and in 2 × 2 the header's foot,
    // the section strip being under it; else nothing, but the window's top. Its sun and cloud keep under the header
    // wherever it shows (issue 237).
    const headerFoot = Math.max(0, reading.header);
    const overPage = stacked ? headerFoot : 0;
    // The card it may stand on: the topmost docked (issue 192).
    const docked = standingCard(reading.docked, drawing);
    const card = docked ? { id: 'card', box: docked } : null;
    /**
     * Along a line, where it is under no cover; and where it stands, over no text either (issue 181). On the docked
     * card's top, its tail swung down is behind the card, over none of the page's text there.
     */
    const clearOf = (box: { left: number; right: number; top: number }, drawn: Drawing) => clearAlong(box, covers, drawn);
    const clearOn = (box: Cover) =>
      clearOf(box, drawing).flatMap((s) => clearAlong({ left: s.min, right: s.max + WIDTH, top: box.top }, texts, box === card?.box ? standing.slice(0, 1) : standing));
    // A Tutorial or the Tour open (issue 151): its own life paused, its visits too; closed, home it goes, its life again.
    const guide = leaveBy === null && !asked.leaving ? asked.guide : null;
    motion.guide(guide !== null);
    if (wasGuided && !guide) {
      visit = null;
      nextVisit = nextVisitAt(now, 'first', stacked, random);
      motion.point(null);
      clungIn = clungTo = null;
      bounceDue = false;
    }
    wasGuided = guide !== null;
    const perchBefore = perch?.id ?? null;
    if (themeSwitched && !reading.dialogOpen()) {
      motion.theme(themeSwitched, now);
      themeSwitched = null;
    }

    // The plots of the LFOs that are on, in view, wide enough for it and clear of the cards (issue 164): in a Demo part,
    // to surf; outside the Demo, those it may ride now and then (issue 141), on every layout (issue 197). Looked for
    // only in a Demo part, on a ride, or with a visit due and an LFO to ride, so a frame costs no more while it stays
    // home. On a phone and in 2 × 2, in view is under the header and the section tabs, with room for it over the plot.
    const part = asked.demoPart;
    const rideLfos = ridesNow(reading);
    const looking = looksForPlots({ demo: part !== null, rides: rideLfos.length, visit, now, next: nextVisit });
    const plots = looking ? plotsInView(reading, twinWay) : [];
    const rideable = plots.filter((p) => rideLfos.includes(p.lfo));

    // Its line: the top right section's edge; on a phone or in 2 × 2, a right-column edge in view, or a line under the
    // header to hover on.
    let on: { id: string; box: Rect };
    let homeId: string | null = null;
    // Now and then a visit to another section in view: down to one below, or across to one beside; then home.
    const onScreen = (s: { box: Box }) => roomAbove(s.box) && s.box.top <= innerHeight - 4;
    const clearAt = (s: { box: Box }) => clearOn(s.box).length > 0;
    const inView = (s: { box: Box }) => onScreen(s) && clearAt(s);
    // A visit's or a ride's end (issues 141, 151); the window turning stacked ends a visit too (issue 192).
    if (
      visit &&
      visitEnds(visit, {
        now,
        stacked,
        rideable: rideable.map((p) => p.lfo),
        inView: visit.ride ? [] : sections.filter((s) => s.id === visit!.id && inView(s)).map((s) => s.id),
        held: moving === 'held',
        leaving: asked.leaving,
        guided: guide !== null,
      })
    ) {
      if (visit.ride && asked.leaving) gettingOff = true;
      visit = null;
      nextVisit = nextVisitAt(now, 'after', stacked, random);
    }
    // A visit or a ride due, and nothing in its way.
    const due = visitDue({
      visit: visit !== null, now, next: nextVisit, guided: guide !== null, reduced: still, leaving: leaveBy !== null || asked.leaving,
      doing: !!shown?.doing, moving, stacked,
    });
    if (!stacked) {
      const home = homeEdge(sections);
      homeId = home.id;
      if (due) {
        // A plot to ride (issue 141) comes first (issue 197); else a section in view.
        const choice = chooseVisit(
          rideable.map((p) => p.lfo),
          sections.filter((s) => s.id !== home.id && inView(s)).map((s) => s.id),
          random,
        );
        if (choice) visit = visitFor(choice, now, random);
        else nextVisit = nextVisitAt(now, 'nowhere', false, random);
      }
      ({ on, perch } = perchAcross({
        edges: sections, home, visit: visit?.id ?? null, card, at: drawnAt,
        onScreen, clear: clearAt, seen: (s) => clearOf(s.box, drawing).length > 0,
      }));
    } else {
      // A ride now and then, on a plot in view (issue 197): onto it from its edge, falling or flying on its tail.
      // After it, back to the edge it left, while that is still in view (decision 6).
      if (due) {
        const choice = chooseVisit(rideable.map((p) => p.lfo), [], random);
        if (choice) [visit, rodeFrom] = [visitFor(choice, now, random), perch?.id ?? null];
        else nextVisit = nextVisitAt(now, 'nowhere', true, random);
      }
      const column = rightColumn(sections).sort((a, b) => a.box.top - b.box.top);
      const { header, strip } = reading;
      const ceiling = Math.max(0, header, strip);
      // Under the section strip, not the header, an edge is a line for it while it shows under the strip, the drop over
      // the strip's foot (issue 142): hovering, it would be just off that line.
      const overlap = strip > header ? HEIGHT - EDGE_SHOWING : 0;
      const span = column[0].box;
      // Its hover line, clear of what covers it up to the top of its bob, the header's foot (issues 164 and 192).
      const hoverLine = { left: span.left + 4, right: span.right - 4, top: ceiling + HEIGHT + HOVER_UNDER };
      perch = choosePerch({
        current: (perch?.id.startsWith('surf') ? rodeFrom : perch?.id) ?? null,
        edges: column.map((s) => ({ id: s.id, top: s.box.top, covered: !clearOn(s.box).length })),
        card: card && { id: card.id, top: card.box.top, covered: !clearOn(card.box).length },
        ceiling, overlap, bottom: innerHeight,
        height: HEIGHT, headroom: HEADROOM, where: foot ?? ceiling,
        hoverCovered: !clearOf(hoverLine, drawingOf({ twin: twinWay, above: HOVER_UNDER })).length,
      });
      const id = perch.id;
      on = column.find((s) => s.id === id) ??
        (id === card?.id ? card : { id, box: { left: span.left, right: span.left + span.width, top: perch.foot, bottom: perch.foot, width: span.width, height: 0 } });
    }
    // Thrown (issue 127): it lands on the first edge under it that it comes down onto, staying there a while.
    if (moving === 'thrown') {
      const under = landingEdge(stacked ? rightColumn(sections) : sections, drawnAt, (s) => clearOf(s.box, drawing));
      if (under) {
        on = under;
        perch = { id: under.id, foot: under.box.top, hovering: false };
        if (homeId !== null) visit = under.id === homeId ? null : visitFor({ id: under.id }, now, random);
      }
    }
    // Pointing the way (issue 151): to the Step's or the card's control, by its usual move to the control's Section's
    // edge, then a slide down the panel to its side, where it clings; from beside another control of that Section, a
    // slide across. Out of reach (in a panel, under the card, on a hidden tab, off the window), it stays beside the
    // last control while that is still in reach and it need not turn round, else on its edge, and looks at it. With
    // reduced motion it only looks.
    let guideRoom: Room | null = null;
    let aimAt: { x: number; y: number } | null = null;
    let clinging: Cling | null = null;
    // Beside the control it is pointing the way to, rather than the last one, staying while that is out of reach.
    let beside = false;
    if (guide && moving !== 'held' && moving !== 'thrown') {
      const el = reading.guided(guide);
      const ceiling = stacked ? Math.max(0, reading.header, reading.strip) : 0;
      const around: ClingAround = { blocks: reading.panels, ceiling, card: card?.box ?? null, text: texts, twin: twinWay };
      const found = el ? clingFor(reading, el, around) : null;
      // A control on a hidden tab: towards its Section.
      const seen = found && found.control.box.width > 0 ? found.control.box : found?.control.sectionBox;
      if (seen) aimAt = { x: (seen.left + seen.right) / 2, y: (seen.top + seen.bottom) / 2 };
      let to = found?.cling ? { el: el!, control: found.control, cling: found.cling } : null;
      const sliding = moving === 'sliding' || moving === 'clinging';
      if (!to && sliding && clungTo && reading.control(clungTo).connected) {
        const stay = clingFor(reading, clungTo, around);
        if (stay.cling && staysBeside(stay.cling, aimAt?.x ?? null)) to = { el: clungTo, control: stay.control, cling: stay.cling };
      }
      beside = !!to && to.el === el;
      if (to && !still) {
        // Its Section's edge; for a control outside the Sections (the Display button), the edge just under it.
        const own = to.control.section;
        const [middle, high] = [to.cling.left + DROP_MIDDLE, to.cling.foot];
        const edge = own
          ? sections.find((s) => s.id === own)
          : sections.filter((s) => s.box.left <= middle && s.box.right >= middle && s.box.top >= high).sort((a, b) => a.box.top - b.box.top)[0];
        const section = edge?.id ?? null;
        const edgeClear = edge && edge.box.top - HEIGHT - HEADROOM >= ceiling && edge.box.top <= innerHeight - 4 ? clearOn(edge.box) : [];
        const next = clingMove({
          cling: to.cling, edge: edgeClear, moving, sameSection: clungIn === section, sameControl: to.el === clungTo, onSection: perchBefore === section, left: drawnAt.left,
        });
        if (next === 'cling') {
          perch = { id: `cling ${idOf(to.el)}`, foot: to.cling.foot, hovering: false, cling: true };
          guideRoom = { min: to.cling.left, max: to.cling.left };
          clungIn = section;
          clungTo = to.el;
          clinging = to.cling;
        } else if (next && edge) {
          // First its usual move to the Section's edge, over the control.
          on = edge;
          perch = { id: edge.id, foot: edge.box.top, hovering: false };
          guideRoom = { min: next.edge, max: next.edge };
        }
      }
    }
    // Through a Demo part, one of its acts in turn (issue 204); surfing, its line is an LFO's shape as its plot draws
    // it: the first in view of an LFO that is on, its Depth above 0 (the owner, 2026-10-30). With none, it conducts.
    // Riding outside the Demo (issue 141), the same, on the plot it chose; a funny turn begun meanwhile plays there.
    const act: Act | null = demoActs.act(leaveBy === null ? part : null, plots.length > 0);
    const { ride, plot, surfing } = ridePlot({ visit, rideable, plots, act, reduced: still, moving, doing: !!shown?.doing });
    motion.act(act ?? (ride ? 'surf' : null));
    let surfRoom: Room | null = null;
    if (plot && surfing) {
      // Where the plot draws the LFO under its middle: a second of it across, the newest at the right.
      const { box } = plot;
      const wave = box.top + reading.sound.wave(plot.lfo, box, drawnAt.left + DROP_MIDDLE - box.left);
      perch = { id: `surf ${plot.lfo}`, foot: wave, hovering: false };
      surfRoom = nearestSpan(plot.clear, drawnAt.left)!;
    }
    // Leaving: on its line it melts; hovering or in the air it drips away down the window.
    if (asked.leaving && leaveBy === null && !gettingOff) {
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
    const [dx, dy] = on === card ? [0, 0] : [reading.window.scrollX, reading.window.scrollY];
    const key = `${perch.id} ${box.left + dx} ${perch.hovering ? 0 : box.top + dy} ${box.width} ${[...clear, ...fallback].map((c) => `${Math.round(c.min)}-${Math.round(c.max)}`)}`;
    if (surfRoom) room = { key: 'surf', room: surfRoom };
    else if (room?.key !== key) {
      const whole = { min: box.left, max: box.right - WIDTH };
      // Nothing over the edge, it keeps to the leftmost run, as before; something over it, the run nearest to it.
      const uncovered = clear.length === 1 && clear[0].min === whole.min && clear[0].max === whole.max;
      room = {
        key,
        room: perch.hovering
          ? hoverRoom(nearestSpan(clear, drawnAt.left) ?? { min: box.left + 4, max: box.right - WIDTH - 4 }, shown ? drawnAt.left : null, random)
          : roomOn(reading, box, !stacked, clear.length ? clear : fallback.length ? fallback : [whole], uncovered ? -Infinity : drawnAt.left),
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
    const { sound, pointer } = reading;
    const heard = lfos(sound.patch).flatMap((l, i) => (l.amount > 0 ? [sound.lfo[i]] : []));
    const amp = sound.amp * sound.volume;
    // Its eyes on a pointer near its middle.
    const near = pointer && Math.hypot(pointer.x - drawnAt.left - DROP_MIDDLE, pointer.y - drawnAt.foot + HEIGHT / 2) < EYES_ON_PX;
    motion.pointer(near && pointer ? pointer.x - drawnAt.left - DROP_MIDDLE : null);
    const pose = motion.frame(
      { amp, sway: heard.length ? heard.reduce((a, b) => a + b, 0) / heard.length : 0, struck: sound.struck, ...looksOf(sound.patch, amp) },
      now,
      still,
      span,
    );
    // Run off: on a large screen, to another section.
    if (pose.escaped && !stacked) nextVisit = now;
    const where = place.frame(perch, span, now, still, pose.x);
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
    if (pose.gone || (leaveBy === 'rain' && where.foot >= innerHeight + HEIGHT)) return 'gone';

    // How it stands. Between lines and under the header, the line's moves take over the sound's and the controls'. It
    // keeps its facing, turned its way across a leap and back as it lands (issue 179), but in the pointer's hold or
    // thrown.
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
      tailTurn = 90 + (still ? 0 : Math.sin(now * 2 * Math.PI * WHIRLS) * WHIRL_DEGREES);
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
    // Surfing in the Demo or riding a plot (issue 204): on its board along the line under it, leaning with the wave,
    // forward going down it and back going up; but for a funny turn, which plays there as it would anywhere.
    const onBoard = !!plot && perch.id === `surf ${plot.lfo}` && !pose.doing && (where.moving === 'standing' || where.moving === 'landing');
    if (onBoard) {
      const middle = drawnAt.left + DROP_MIDDLE - plot.box.left;
      const lineAtX = (x: number) => sound.wave(plot.lfo, plot.box, x);
      pose.tilt = surfLean(lineAtX(middle - SURF_SPAN / 2), lineAtX(middle + SURF_SPAN / 2), SURF_SPAN);
      pose.legs = 'tuck';
      pose.wag = -BALANCING; // its tail out behind, raised for balance
    }

    // A trick seen whole under what is over the page (issue 200): where the room over it is short, it hops lower, and
    // if its drawing is still too tall (an umbrella, a cloud), it is drawn smaller about its foot. With room, untouched.
    // Its sun and cloud, twice as far above it, or as far as fits under the header or the window's top (issue 237).
    let shrink = 1;
    const grid = HEIGHT / ROWS;
    const skyRows = skyLift(pose.prop, (where.foot - headerFoot - 1) / grid);
    if (/^(standing|hovering|landing|clinging)$/.test(where.moving)) {
      const room = where.foot - overPage - 1;
      const drawnTop = Math.min(PROP_TOP[pose.prop] ?? 0, HAT_TOP[pose.hat] ?? 0, pose.ice > 0 ? topOf(ICE) : 0);
      const body = (ROWS - drawnTop) * grid * pose.stretch * pose.size;
      pose.lift = Math.min(pose.lift, Math.max(0, room - body));
      const reach = Math.max(body + Math.max(0, pose.lift), (ROWS - (SKY_TOP[pose.prop] ?? ROWS) + skyRows) * grid);
      if (pose.doing && reach > room) shrink = Math.max(0, room) / reach;
    }
    shown = pose;
    // Beside a control, or sliding there, the pointer passes through it to what is under it (issue 151).
    const pointing = where.moving === 'sliding' || where.moving === 'clinging' ? 'yes' : 'no';
    const marks = { act: act ?? '', ride: ride ? String(ride.lfo) : '', board: onBoard ? 'on' : '', tail: pose.tail, hat: pose.hat, doing: pose.doing ?? '', prop: pose.prop, moving: where.moving, pointing };
    const left = acrossOf(where, pose.x);
    drawnAt = { left, foot: where.foot };

    // Coming into view: up from behind its edge (fast for a pop, then a hop), down from under the header, or, falling
    // from the top of the window, all at once.
    // With nowhere clear to be, it goes out of sight: back up under the header or the tabs, hovering, or down behind its
    // edge; and comes back into view once somewhere is (issue 192).
    comingFrom ??= perch.hovering ? 'header' : arrival === 'rain' ? 'sky' : 'edge';
    if (perch.waiting) [comingFrom, hid] = [perch.hovering ? 'header' : 'edge', true];
    const wasUp = up;
    const popping = arrival === 'pop' && !hid;
    if (perch.waiting) up = still ? 0 : Math.max(0, up - dt / RISE_SECONDS);
    else up = still || comingFrom === 'sky' ? 1 : Math.min(1, up + dt / (popping ? RISE_SECONDS / 2 : RISE_SECONDS));
    if (popping && wasUp < 1 && up === 1) motion.gesture('new', now);

    return {
      pose, where, now, dt, left, origin, tailTurn, onBoard, shrink, skyRows, marks, up, comingFrom,
      page: reading.page, overPage, windowHeight: innerHeight,
    };
  }

  return {
    step,
    /** A pointer over it tickles it. */
    tickle: () => motion.tickle(clock()),
    /** A click or a touch on it. */
    poke: () => {
      motion.poke(clock());
      motion.gesture('louder', clock());
    },
    /** A press on it that moves picks it up (issue 127), but while it leaves or with reduced motion: whether it did. */
    pick(x: number, y: number, { reduced, leaving }: { reduced: boolean; leaving: boolean }) {
      if (reduced || leaveBy !== null || leaving) return false;
      grip = { x: x - drawnAt.left, y: y - drawnAt.foot };
      moves = [{ t: pageSeconds(), x, y }];
      motion.pickUp(clock());
      place.hold(drawnAt.left, drawnAt.foot);
      return true;
    },
    drag(x: number, y: number) {
      const t = pageSeconds();
      moves = [...moves.filter((m) => t - m.t < 0.1), { t, x, y }];
      place.hold(x - grip.x, y - grip.y);
    },
    /** Let go, as the page is now: thrown, or onto an LFO's line to ride it. */
    letGo(reading: Reading) {
      // Dropped over or near the plot of an LFO it may ride, one it would ride by itself: onto its line, to ride it
      // (issue 197). Not while it is sent away, nor pointing the way in a Tutorial or the Tour.
      const rides = reading.asked.leaving || reading.asked.guide ? [] : ridesNow(reading);
      // Where the pointer holds it now: a quick drag may be ahead of the last frame drawn.
      const held = moves.at(-1)!;
      const [left, foot] = [held.x - grip.x, held.y - grip.y];
      const bead = { left, right: left + WIDTH, top: foot - HEIGHT, bottom: foot };
      const lfo = rides.length ? rideOnDrop(bead, plotsInView(reading, Math.sign(shown?.twin ?? 0) * TWIN_PX), rides) : null;
      if (lfo !== null) {
        if (reading.stacked) rodeFrom = perch?.id ?? null;
        place.dropOntoLine();
        moving = 'falling';
        visit = visitFor(rideOf(lfo), clock(), random);
        motion.thrown(clock());
        return;
      }
      // Its speed over the last tenth of a second.
      const [first, last] = [moves[0], moves.at(-1)!];
      const dt = Math.max(0.016, last.t - first.t);
      place.toss((last.x - first.x) / dt, (last.y - first.y) / dt, throwWalls(reading.body()));
      motion.thrown(clock());
    },
    word: (w: Word) => motion.word(w, clock()),
    /** A theme switched in Display: it reacts once the panel is closed. */
    theme: (t: Theme) => void (themeSwitched = t),
    /** A new Step or Tour card (a bounce, once beside its control), a Step made (a hop), a Tutorial finished (the fountain). */
    newStep: () => void (bounceDue = true),
    made: () => motion.gesture('hop', clock()),
    finished: () => motion.trick('fountain', clock()),
    /** A trick at once, or after the one under way (issue 200). */
    trick: (name: Trick) => motion.trick(name, clock()),
    /** The patch changed: it moves with every control turned (`gesturesOf`). */
    patchChanged({ before, after, by }: PatchChange) {
      for (const gesture of gesturesOf(before, after, by)) motion.gesture(gesture, clock());
      // Resonance turned past three quarters: it screams a moment (issue 127).
      if (by !== 'load' && after.resonance !== before.resonance && after.resonance > SCREAMING) motion.scream(clock());
      // A Waveform chosen: its tail takes that wave a moment (issue 127).
      if (by !== 'load' && after.waveform !== before.waveform) motion.wave(after.waveform, clock());
      else if (by !== 'load' && after.osc2Waveform !== before.osc2Waveform) motion.wave(after.osc2Waveform, clock());
    },
  };
}
