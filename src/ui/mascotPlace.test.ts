import { describe, expect, it } from 'vitest';
import { noteIndex } from '../music/tempo';
import type { Lfo } from '../patch/patch';
import { TURNED_PAST, TWIN_PX } from './mascotCling';
import {
  acrossOf, BOX, choosePerch, chooseVisit, clearAlong, createMascotPlace, drawingOf, FASTEST_THROW, GRAVITY, HOVER_UNDER, LANDING_SECONDS,
  LEEWAY, type Moving, nearestSpan, type Perch, type Placed, rideOnDrop, ridesFor, type Span, SWUNG_BELOW, standingCard, surfLean, throwWalls, visitEnds, WINDUP_SECONDS,
} from './mascotPlace';

const H = 26;
const ROOM = 18;
const pick = (current: string | null, tops: Record<string, number>, ceiling = 250, where = 300, overlap = 0) =>
  choosePerch({ current, edges: Object.entries(tops).map(([id, top]) => ({ id, top })), ceiling, overlap, bottom: 812, height: H, headroom: ROOM, where });

describe('which line the mascot is on, on a phone or in 2 × 2 (issue 115)', () => {
  it('stands on a section edge with room over it, below the header and on the window', () => {
    expect(pick(null, { Oscillators: 300, Filter: 1216 })).toEqual({ id: 'Oscillators', foot: 300, hovering: false });
  });

  it('keeps its edge as it scrolls up, until the drop no longer fits under the header', () => {
    expect(pick('Oscillators', { Oscillators: 280, Filter: 1196 }).id).toBe('Oscillators');
    expect(pick('Oscillators', { Oscillators: 250 + H, Filter: 700 }).id).toBe('Oscillators'); // its head at the header
    expect(pick('Oscillators', { Oscillators: 250 + H - 1, Filter: 700 }).id).toBe('Filter');
  });

  it('hovers a little under the header when no edge is in view, then takes the first one that comes (issue 142)', () => {
    expect(pick('Oscillators', { Oscillators: -200, Filter: 900 })).toEqual({ id: 'ceiling', foot: 250 + H + HOVER_UNDER, hovering: true });
    expect(pick('ceiling', { Oscillators: -300, Filter: 790 }, 250, 276).id).toBe('Filter');
  });

  it('stands on an edge just under the section tabs while it shows, over them, rather than hover off its line (issue 142)', () => {
    const over = H - 2;
    // The phone's first section, 12 px under the tabs: on its edge, its top 14 px over them.
    expect(pick(null, { Oscillators: 250 + 12, Filter: 1200 }, 250, 300, over)).toEqual({ id: 'Oscillators', foot: 262, hovering: false });
    expect(pick('ceiling', { Oscillators: 250 + 12, Filter: 1200 }, 250, 276, over).id).toBe('Oscillators');
    // Scrolled until the edge is about to go under the tabs, still on it; once it has, it hovers.
    expect(pick('Oscillators', { Oscillators: 250 + 2, Filter: 1200 }, 250, 300, over).id).toBe('Oscillators');
    expect(pick('Oscillators', { Oscillators: 250 + 1, Filter: 1200 }, 250, 300, over).hovering).toBe(true);
    // Where nothing may be overlapped (the header), as before.
    expect(pick(null, { Oscillators: 250 + 12, Filter: 1200 }).hovering).toBe(true);
    // An edge with room under the tabs still comes first.
    expect(pick(null, { Oscillators: 250 + 12, Filter: 400 }, 250, 300, over).id).toBe('Filter');
  });

  it('moving, takes the edge nearest to where it is', () => {
    expect(pick(null, { Oscillators: 320, Filter: 700 }, 250, 650).id).toBe('Filter');
  });
});

const W = 44;
describe('where along a line it is under no card, tip or panel (issue 164)', () => {
  const line = { left: 0, right: 375, top: 600 };
  const card = (top: number, left = 12, right = 363) => ({ left, right, top, bottom: top + 150 });

  it('with nothing over the line, the whole of it', () => {
    expect(clearAlong(line, [], BOX)).toEqual([{ min: 0, max: 375 - W }]);
  });

  it('with a card over the line, along its whole width, nowhere', () => {
    expect(clearAlong(line, [card(590)], BOX)).toEqual([]);
    expect(clearAlong(line, [card(600 - H + 1)], BOX)).toEqual([]); // over its head by a pixel
  });

  it('a card under the line, or far over it, leaves it whole', () => {
    expect(clearAlong(line, [card(600)], BOX)).toEqual([{ min: 0, max: 375 - W }]); // its top on the line
    expect(clearAlong(line, [{ left: 0, right: 375, top: 100, bottom: 600 - H }], BOX)).toEqual([{ min: 0, max: 375 - W }]);
  });

  it('a card over part of the line leaves the stretches either side where the whole drop fits', () => {
    expect(clearAlong({ left: 800, right: 1300, top: 600 }, [card(590, 900, 1100)], BOX)).toEqual([
      { min: 800, max: 900 - W },
      { min: 1100, max: 1300 - W },
    ]);
    // A gap narrower than the drop is no room.
    expect(clearAlong(line, [card(590, 0, 100), card(590, 130, 375)], BOX)).toEqual([]);
  });

  it('of the stretches left, the one nearest to where it is', () => {
    const spans = [{ min: 0, max: 100 }, { min: 300, max: 400 }];
    expect(nearestSpan(spans, 50)).toEqual(spans[0]);
    expect(nearestSpan(spans, 250)).toEqual(spans[1]);
    expect(nearestSpan(spans, 500)).toEqual(spans[1]);
    expect(nearestSpan([], 50)).toBeNull();
  });
});

describe('its whole drawing along a line, its twin and its tail included (issues 181 and 192)', () => {
  const line = { left: 0, right: 375, top: 600 };
  const over = (left: number, right: number) => ({ left, right, top: 500, bottom: 700 });

  it('a cover beside its stretch keeps off its tail turned round, past its box’s left (issue 179)', () => {
    expect(clearAlong(line, [over(0, 100)], BOX)).toEqual([{ min: 100, max: 375 - W }]);
    expect(clearAlong(line, [over(0, 100)], drawingOf())).toEqual([{ min: 100 + TURNED_PAST, max: 375 - W }]);
  });

  it('and off its Detune twin, on its side (issue 174)', () => {
    expect(clearAlong(line, [over(0, 100)], drawingOf({ twin: -TWIN_PX }))).toEqual([{ min: 100 + TURNED_PAST + TWIN_PX, max: 375 - W }]);
    expect(clearAlong(line, [over(300, 375)], drawingOf())).toEqual([{ min: 0, max: 300 - W }]);
    expect(clearAlong(line, [over(300, 375)], drawingOf({ twin: TWIN_PX }))).toEqual([{ min: 0, max: 300 - W - TWIN_PX }]);
  });

  it('resting, it faces as drawn: text left of its box is clear of it, a little apart, but for its twin there (issue 181)', () => {
    const label = over(0, 100);
    expect(clearAlong(line, [label], drawingOf({ resting: true }))).toEqual([{ min: 100 + LEEWAY, max: 375 - W }]);
    expect(clearAlong(line, [label], drawingOf({ resting: true, twin: -TWIN_PX }))).toEqual([{ min: 100 + TWIN_PX + LEEWAY, max: 375 - W }]);
    // Over its head by a pixel: as if over it, its top leaving a little room.
    expect(clearAlong(line, [{ left: 0, right: 375, top: 500, bottom: 600 - H - LEEWAY + 1 }], drawingOf({ resting: true }))).toEqual([]);
    expect(clearAlong(line, [{ left: 0, right: 375, top: 500, bottom: 600 - H - LEEWAY }], drawingOf({ resting: true }))).toHaveLength(1);
  });

  it('resting, its tail swung down under its foot keeps off a heading just under the line, its body may stand over it (issue 181)', () => {
    const heading = { left: 20, right: 52, top: 613, bottom: 626 };
    expect(clearAlong(line, [heading], drawingOf())).toEqual([{ min: 0, max: 375 - W }]);
    // Its tail leaves its drop 18 px from its box's left: over the heading, no spot from 20 − 44 to 52 − 18, a little apart.
    expect(clearAlong(line, [heading], drawingOf({ resting: true }))).toEqual([{ min: 52 - 18 + LEEWAY, max: 375 - W }]);
    expect(clearAlong(line, [{ ...heading, top: 600 + SWUNG_BELOW }], drawingOf({ resting: true }))).toEqual([{ min: 0, max: 375 - W }]);
  });
});

describe('the docked card it stands on, with two docked (issue 192)', () => {
  // The Demo's "stopped" card, and a Tutorial's over it, later in the page.
  const demo = { left: 400, right: 1040, top: 760, bottom: 880 };
  const tutorial = { left: 360, right: 1080, top: 700, bottom: 880 };

  it('the one drawn over the others: the later one', () => {
    expect(standingCard([demo, tutorial], drawingOf())).toBe(tutorial);
    expect(standingCard([tutorial, demo], drawingOf())).toBe(demo);
    expect(standingCard([demo], drawingOf())).toBe(demo);
    expect(standingCard([], drawingOf())).toBeNull();
  });

  it('one too narrow for it, the one under, where its top is clear of the one over', () => {
    const narrow = { left: 700, right: 720, top: 650, bottom: 880 };
    expect(standingCard([demo, narrow], drawingOf())).toBe(demo);
    // A card's top covered all along by the one over it is never stood on.
    const under = { left: 705, right: 715, top: 700, bottom: 880 };
    expect(standingCard([under, narrow], drawingOf())).toBeNull();
  });
});

describe('a visit or a ride ending (issues 141, 151 and 192)', () => {
  const ride = { id: 'ride 1', until: 20, ride: 1 as const };
  const visit = { id: 'Filter', until: 20 };
  const now = { now: 10, stacked: false, rideable: [1, 2] as (1 | 2)[], inView: ['Filter', 'Amp'], held: false, leaving: false, guided: false };

  it('goes on while its time lasts and its LFO is one to ride, or its section in view', () => {
    expect(visitEnds(ride, now)).toBe(false);
    expect(visitEnds(visit, now)).toBe(false);
    expect(visitEnds(ride, { ...now, now: 20 })).toBe(true);
    expect(visitEnds(visit, { ...now, now: 20 })).toBe(true);
  });

  it('the window turning stacked ends a visit, not a ride: on a phone and in 2 × 2 it rides too (issues 192, 197)', () => {
    expect(visitEnds(ride, { ...now, stacked: true })).toBe(false);
    expect(visitEnds(visit, { ...now, stacked: true })).toBe(true);
  });

  it('a ride ends as its LFO stops being one to ride, it is picked up, sent away, or a Tutorial opens', () => {
    expect(visitEnds(ride, { ...now, rideable: [2] })).toBe(true);
    expect(visitEnds(ride, { ...now, held: true })).toBe(true);
    expect(visitEnds(ride, { ...now, leaving: true })).toBe(true);
    expect(visitEnds(ride, { ...now, guided: true })).toBe(true);
  });

  it('a visit ends as its section leaves the view; a Tutorial keeps it past its time', () => {
    expect(visitEnds(visit, { ...now, inView: ['Amp'] })).toBe(true);
    expect(visitEnds(visit, { ...now, now: 20, guided: true })).toBe(false);
  });
});

describe('thrown, it bounces off the page’s sides (issue 192)', () => {
  it('the page’s sides in the window: below 320 px wide, the page’s, not the window’s', () => {
    expect(throwWalls({ left: 0, right: 1440 })).toEqual({ min: 0, max: 1440 - W });
    // A window 300 px wide, the page 320 px, scrolled 20 px to its right.
    expect(throwWalls({ left: -20, right: 300 })).toEqual({ min: -20, max: 300 - W });
  });
});

describe('which line, with a card docked over the page (issue 164)', () => {
  // A phone: the section tabs' foot at 250, a card docked from 640 to the window's bottom.
  const card = { id: 'card', top: 640 };
  const choose = (current: string | null, edges: { id: string; top: number; covered?: boolean }[], where = 300, docked: typeof card | null = card) =>
    choosePerch({ current, edges, card: docked, ceiling: 250, overlap: H - 2, bottom: 812, height: H, headroom: ROOM, where });

  it('never keeps nor takes an edge the card covers: it goes to one in view and clear', () => {
    const edges = [{ id: 'Oscillators', top: 400 }, { id: 'Filter', top: 700, covered: true }];
    expect(choose('Filter', edges, 700)).toEqual({ id: 'Oscillators', foot: 400, hovering: false });
    expect(choose(null, edges, 700).id).toBe('Oscillators');
  });

  it('with every edge in view covered, stands on the card’s top edge, and goes back once one is clear', () => {
    expect(choose('Filter', [{ id: 'Filter', top: 700, covered: true }], 700)).toEqual({ id: 'card', foot: 640, hovering: false });
    expect(choose('card', [{ id: 'Filter', top: 700, covered: true }], 640).id).toBe('card');
    expect(choose('card', [{ id: 'Filter', top: 600 }], 640).id).toBe('Filter');
  });

  it('with no edge in view at all, hovers under the header (issue 142)', () => {
    expect(choose('Filter', [{ id: 'Filter', top: -300 }, { id: 'Amp', top: 1200 }], 276).hovering).toBe(true);
  });

  it('with every edge covered and no card to stand on, hovers', () => {
    expect(choose('Filter', [{ id: 'Filter', top: 700, covered: true }], 700, null).hovering).toBe(true);
  });

  it('with its hover line covered too (a phone’s page-wide description), waits out of sight, never under it (issue 192)', () => {
    const covered = (edges: { id: string; top: number; covered?: boolean }[], docked: typeof card | null = null) =>
      choosePerch({ current: 'Filter', edges, card: docked, ceiling: 250, overlap: H - 2, bottom: 812, height: H, headroom: ROOM, where: 700, hoverCovered: true });
    expect(covered([{ id: 'Filter', top: 700, covered: true }])).toEqual({ id: 'waiting', foot: 250 + H + HOVER_UNDER, hovering: true, waiting: true });
    expect(covered([{ id: 'Filter', top: -300 }])).toMatchObject({ waiting: true });
    // Somewhere clear comes first: an edge, or the card's top.
    expect(covered([{ id: 'Filter', top: 700 }]).id).toBe('Filter');
    expect(covered([{ id: 'Filter', top: 700, covered: true }], card).id).toBe('card');
  });
});

/** Frames at 60 a second, the perch given by `at(t)`, standing at `x` when on its line. */
function run(place: ReturnType<typeof createMascotPlace>, from: number, to: number, at: (t: number) => Perch, reduced = false, span: Span = { min: 0, max: 300 }, startX = 100) {
  const frames: (Placed & { t: number })[] = [];
  let x = startX;
  for (let t = from; t <= to; t += 1 / 60) {
    const f = place.frame(at(t), span, t, reduced, x);
    if (f.landedAt !== null) x = f.landedAt;
    frames.push({ t, ...f });
  }
  return frames;
}
const edge = (id: string, foot: number): Perch => ({ id, foot, hovering: false });
const changes = (frames: { moving: Moving }[]) => frames.map((f) => f.moving).filter((m, i, all) => m !== all[i - 1]);
const span = { min: 0, max: 300 };
/** Its hover line on a phone, the section tabs' foot at 250. */
const hover: Perch = { id: 'ceiling', foot: 250 + H + HOVER_UNDER, hovering: true };

describe('the mascot between its lines, by the laws of motion (issue 115)', () => {
  it('follows its edge as the page scrolls', () => {
    const place = createMascotPlace();
    const frames = run(place, 0, 1, (t) => edge('Amp', 400 - 100 * t));
    expect(frames.every((f) => f.moving === 'standing' && Math.abs(f.foot - (400 - 100 * f.t)) < 1e-9 && f.x === null)).toBe(true);
  });

  it('to a lower edge, hops off, falls under gravity, lands as hard as it fell, wobbles, and stands', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 300), span, 0, false, 100);
    const frames = run(place, 1 / 60, 2, () => edge('Filter', 700));
    expect(changes(frames)).toEqual(['falling', 'landing', 'standing']);
    const falling = frames.filter((f) => f.moving === 'falling');
    expect(Math.min(...falling.map((f) => f.foot))).toBeLessThan(300); // the hop off
    // Its speed grows by gravity each frame.
    for (let i = 1; i < falling.length; i++) expect(falling[i].vy - falling[i - 1].vy).toBeCloseTo(GRAVITY / 60, 0);
    const landing = frames.filter((f) => f.moving === 'landing');
    expect(landing[0].impact).toBeGreaterThan(0.6); // 400 px is a hard fall
    expect(landing.length / 60).toBeCloseTo(LANDING_SECONDS, 1);
    expect(frames.at(-1)!.foot).toBe(700);
  });

  it('the frame it lands, it is where it landed, not where its stroll had it, so its splash is there', () => {
    const place = createMascotPlace({ random: () => 0.5 });
    place.frame(edge('Oscillators', 300), span, 0, false, 100);
    const frames = run(place, 1 / 60, 2, () => edge('Filter', 700), false, { min: 200, max: 260 });
    const landing = frames.find((f) => f.landedAt !== null)!;
    expect(acrossOf(landing, 100)).toBe(230);
    expect(acrossOf(frames.find((f) => f.moving === 'falling')!, 100)).not.toBe(100);
    expect(acrossOf(frames.at(-1)!, 230)).toBe(230);
  });

  it('between lines, says how far across its leap goes, for its facing; nothing on a line (issue 179)', () => {
    const place = createMascotPlace({ random: () => 0.5 });
    place.frame(edge('Oscillators', 300), span, 0, false, 100);
    const frames = run(place, 1 / 60, 2, () => edge('Filter', 700), false, { min: 200, max: 260 });
    const falling = frames.filter((f) => f.moving === 'falling');
    expect(falling.length).toBeGreaterThan(10);
    expect(falling.every((f) => f.leap === 130)).toBe(true);
    expect(frames.filter((f) => f.moving !== 'falling').every((f) => f.leap === 0)).toBe(true);
  });

  it('a short drop lands softly', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 300), span, 0, false, 100);
    const frames = run(place, 1 / 60, 1.5, () => edge('Filter', 330));
    expect(frames.find((f) => f.moving === 'landing')!.impact).toBeLessThan(0.4);
  });

  it('falls across to a spot in the new line, landing there', () => {
    const place = createMascotPlace({ random: () => 0.5 });
    place.frame(edge('Oscillators', 300), span, 0, false, 100);
    const frames = run(place, 1 / 60, 2, () => edge('Filter', 700), false, { min: 200, max: 260 });
    const falling = frames.filter((f) => f.moving === 'falling');
    expect(falling[0].x).toBeLessThan(130);
    expect(frames.find((f) => f.landedAt !== null)!.landedAt).toBe(230); // the middle, with this random
  });

  it('to a higher edge, its tail pushes until it can coast over, then it drops onto the edge', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 700), span, 0, false, 100);
    const frames = run(place, 1 / 60, 2, () => edge('Oscillators', 300));
    expect(changes(frames)).toEqual(['flying', 'landing', 'standing']);
    const flying = frames.filter((f) => f.moving === 'flying');
    const pushing = flying.filter((f) => f.thrust);
    expect(pushing.length).toBeGreaterThan(3);
    expect(flying.slice(flying.indexOf(pushing.at(-1)!) + 1).every((f) => !f.thrust)).toBe(true);
    // Over the edge at the top of its arc, by a little, and onto it from above.
    const top = Math.min(...flying.map((f) => f.foot));
    expect(top).toBeLessThan(300);
    expect(top).toBeGreaterThan(300 - 20);
    expect(frames.find((f) => f.moving === 'landing')!.impact).toBeLessThan(0.4);
  });

  it('before flying up, it holds still, swinging its tail down under it', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 700), span, 0, false, 100);
    const frames = run(place, 1 / 60, WINDUP_SECONDS + 0.1, () => edge('Oscillators', 300));
    const winding = frames.filter((f) => f.moving === 'flying' && f.windup < 1);
    expect(winding.length / 60).toBeCloseTo(WINDUP_SECONDS, 1);
    expect(winding.every((f) => f.foot === 700)).toBe(true);
    expect(winding.at(-1)!.windup).toBeGreaterThan(winding[0].windup);
    expect(frames.at(-1)!.foot).toBeLessThan(700); // then off it goes
  });

  it('to a section beside it, at its own height, leaps across in an arc, higher the farther', () => {
    const top = (to: number) => {
      const place = createMascotPlace({ random: () => 0.5 });
      place.frame(edge('Amp', 300), { min: 900, max: 1000 }, 0, false, 950);
      const frames = run(place, 1 / 60, 3, () => edge('Filter', 300), false, { min: to, max: to }, 950);
      expect(changes(frames)).toEqual(['flying', 'landing', 'standing']);
      expect(frames.find((f) => f.landedAt !== null)!.landedAt).toBe(to);
      return 300 - Math.min(...frames.map((f) => f.foot));
    };
    expect(top(600)).toBeGreaterThan(top(850) + 30);
  });

  it('comes down onto its spot by its own flight, never moved across on the frame it lands (issue 140)', () => {
    // Across, to a section beside it, down to one below and up to one above: the frame it lands, no step across bigger
    // than two of its flight's own just before (it lands part way through a frame).
    for (const [from, to, toX] of [[300, 300, 100], [300, 700, 900], [700, 300, 100], [300, 300, 900]]) {
      const place = createMascotPlace({ random: () => 0.5 });
      place.frame(edge('Amp', from), { min: 0, max: 1000 }, 0, false, 500);
      const frames = run(place, 1 / 60, 3, () => edge('Filter', to), false, { min: toX, max: toX }, 500);
      const landing = frames.findIndex((f) => f.landedAt !== null);
      const last = frames[landing - 1];
      expect(Math.abs(toX - last.x!), `${from} to ${to}, to ${toX}`).toBeLessThan((2 * Math.abs(last.vx)) / 60 + 2);
    }
  });

  it('losing ground, takes off at once, its tail whirling, and hovers at its own spot, a little under the tabs (issue 142)', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 252), span, 0, false, 120);
    const frames = run(place, 1 / 60, 1.5, () => hover, false, { min: 108, max: 132 }, 120);
    expect(changes(frames)).toEqual(['flying', 'hovering']);
    const flying = frames.filter((f) => f.moving === 'flying');
    expect(flying.every((f) => f.thrust && f.windup === 1)).toBe(true); // whirling at once, no crouch first
    expect(flying.every((f) => f.x === 120)).toBe(true); // where it lost ground, across
    // Straight to its line, no hop and no fall past it, gently.
    for (let i = 1; i < flying.length; i++) expect(flying[i].foot).toBeGreaterThanOrEqual(flying[i - 1].foot);
    expect(Math.max(...flying.map((f) => f.foot))).toBeLessThanOrEqual(hover.foot);
    expect(flying.length / 60).toBeLessThan(0.7);
    expect(frames.find((f) => f.landedAt !== null)!.landedAt).toBe(120);
  });

  it('hovering, bobs gently up and down, its top never over the tabs; with reduced motion, still (issue 142)', () => {
    const place = createMascotPlace();
    place.frame(hover, span, 0, false, 120);
    const feet = run(place, 1 / 60, 3, () => hover, false, span, 120).map((f) => {
      expect(f.moving).toBe('hovering');
      return f.foot;
    });
    expect(Math.max(...feet)).toBeLessThanOrEqual(hover.foot);
    expect(Math.min(...feet)).toBeGreaterThanOrEqual(hover.foot - HOVER_UNDER); // its top at the tabs' foot at most
    expect(Math.max(...feet) - Math.min(...feet)).toBeGreaterThan(1.5);
    for (let i = 1; i < feet.length; i++) expect(Math.abs(feet[i] - feet[i - 1])).toBeLessThan(0.3); // gently
    const still = createMascotPlace();
    expect(run(still, 0, 2, () => hover, true, span, 120).every((f) => f.moving === 'hovering' && f.foot === hover.foot)).toBe(true);
  });

  it('from an edge far below, flies up under the tabs and hovers; an edge coming into view below, it drops onto it (issue 142)', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 700), span, 0, false, 100);
    const up = run(place, 1 / 60, 2, () => hover);
    expect(changes(up)).toEqual(['flying', 'hovering']);
    expect(up.at(-1)!.foot).toBeGreaterThanOrEqual(hover.foot - HOVER_UNDER);
    const left = up.at(-1)!.foot;
    const down = run(place, 2.01, 3.5, () => edge('Amp', 600));
    expect(changes(down)).toEqual(['falling', 'landing', 'standing']);
    expect(Math.min(...down.map((f) => f.foot))).toBeGreaterThanOrEqual(left); // no hop: its tail stops, and it drops
  });

  it('hovering, an edge coming into view just over it, it flies up onto it at once, its tail already under it (issue 142)', () => {
    const place = createMascotPlace();
    place.frame(hover, span, 0, false, 100);
    run(place, 1 / 60, 1, () => hover);
    const frames = run(place, 1.01, 2.5, () => edge('Oscillators', 252));
    expect(changes(frames)).toEqual(['flying', 'landing', 'standing']);
    expect(frames.every((f) => f.windup === 1)).toBe(true);
    expect(frames.at(-1)!.foot).toBe(252);
  });

  it('arriving from the top of the window, falls onto its edge', () => {
    const place = createMascotPlace({ from: -40 });
    const frames = run(place, 0, 1.5, () => edge('Amp', 108));
    expect(changes(frames)).toEqual(['falling', 'landing', 'standing']);
    expect(frames[0].foot).toBeLessThan(0);
  });

  it('turns back mid-fall for a new line, from where it is', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 300), span, 0, false, 100);
    const falling = run(place, 1 / 60, 0.4, () => edge('Filter', 900));
    const mid = falling.at(-1)!.foot;
    expect(mid).toBeGreaterThan(300);
    const back = run(place, 0.41, 3, () => edge('Oscillators', 300));
    expect(back[0].moving).toBe('flying');
    expect(back.at(-1)).toMatchObject({ foot: 300, moving: 'standing' });
  });

  it('with reduced motion, is on the new line at once', () => {
    const place = createMascotPlace({ from: -40 });
    place.frame(edge('Oscillators', 300), span, 0, true, 100);
    expect(place.frame(edge('Filter', 700), span, 0.02, true, 100)).toMatchObject({ foot: 700, moving: 'standing' });
  });
});

describe('a visit due: a ride comes first (issue 197)', () => {
  const always = (r: number) => () => r;

  it('with an LFO to ride, the ride, however the draw goes', () => {
    for (const r of [0, 0.5, 0.99]) expect(chooseVisit([1], ['Filter', 'Oscillators'], always(r))).toEqual({ id: 'ride 1', ride: 1 });
  });

  it('with two to ride, one of them at random', () => {
    expect(chooseVisit([1, 2], ['Filter'], always(0))).toEqual({ id: 'ride 1', ride: 1 });
    expect(chooseVisit([1, 2], ['Filter'], always(0.99))).toEqual({ id: 'ride 2', ride: 2 });
  });

  it('with none to ride, a section in view at random; with none at all, nothing', () => {
    expect(chooseVisit([], ['Filter', 'Oscillators'], always(0.99))).toEqual({ id: 'Oscillators' });
    expect(chooseVisit([], [], always(0))).toBeNull();
  });
});

describe('dropped near an LFO plot it may ride, it rides it (issue 197)', () => {
  // LFO 1's plot, and LFO 2's under it; its box 44 × 26, its foot at `foot`.
  const plots = [
    { lfo: 1 as const, box: { left: 100, right: 300, top: 200, bottom: 260 } },
    { lfo: 2 as const, box: { left: 100, right: 300, top: 400, bottom: 460 } },
  ];
  const bead = (left: number, foot: number) => ({ left, right: left + 44, top: foot - 26, bottom: foot });

  it('its box over the plot: that LFO', () => {
    expect(rideOnDrop(bead(150, 240), plots, [1, 2])).toBe(1);
    expect(rideOnDrop(bead(150, 430), plots, [1, 2])).toBe(2);
  });

  it('within 44 px of the plot, over it, under it or beside it: that LFO', () => {
    expect(rideOnDrop(bead(150, 200 - 44), plots, [1])).toBe(1); // its foot 44 px over the plot
    expect(rideOnDrop(bead(300 + 44, 230), plots, [1])).toBe(1); // 44 px right of it
    expect(rideOnDrop(bead(100 - 44 - 44, 230), plots, [1])).toBe(1); // its right 44 px left of it
  });

  it('farther than 44 px: none', () => {
    expect(rideOnDrop(bead(150, 200 - 45), plots, [1, 2])).toBeNull();
    expect(rideOnDrop(bead(300 + 45, 230), plots, [1, 2])).toBeNull();
    expect(rideOnDrop(bead(300 + 40, 200 - 40), plots, [1, 2])).toBeNull(); // off a corner by 56 px
  });

  it('near an LFO it may not ride (a Saw, a Square, too fast, at Depth 0): none, it lands as anywhere', () => {
    expect(rideOnDrop(bead(150, 240), plots, [2])).toBeNull();
    expect(rideOnDrop(bead(150, 240), plots, [])).toBeNull();
  });

  it('near both, the nearer', () => {
    expect(rideOnDrop(bead(150, 380), plots, [1, 2])).toBe(2);
  });
});

describe('picked up and thrown (issue 127)', () => {
  const edge: Perch = { id: 'Amp', foot: 400, hovering: false };
  const walls: Span = { min: 0, max: 1000 };
  const held = () => {
    const place = createMascotPlace();
    place.frame(edge, { min: 0, max: 300 }, 0, false, 100);
    return place;
  };

  it('held, it is where the pointer has it, off its line', () => {
    const place = held();
    place.hold(250, 300);
    const f = place.frame(edge, { min: 0, max: 300 }, 0.1, false, 100);
    expect(f).toMatchObject({ moving: 'held', foot: 300, x: 250 });
  });

  it('let go, it flies under gravity, and lands on its line coming down onto it, as hard as it fell', () => {
    const place = held();
    place.hold(200, 300);
    place.toss(300, -400, walls);
    const frames = run(place, 0.1, 2, () => edge);
    const flight = frames.filter((f) => f.moving === 'thrown');
    expect(Math.min(...flight.map((f) => f.foot))).toBeLessThan(300); // up first
    expect(flight.at(-1)!.x!).toBeGreaterThan(300); // and on across
    const landing = frames.find((f) => f.landedAt !== null)!;
    expect(landing).toMatchObject({ moving: 'landing', foot: 400 });
    expect(landing.impact).toBeGreaterThan(0.5);
  });

  it('thrown at a side of the window, it bounces back off it', () => {
    const place = held();
    place.hold(950, 300);
    place.toss(800, -200, walls);
    const xs = run(place, 0.1, 1, () => edge).filter((f) => f.moving === 'thrown').map((f) => f.x!);
    expect(Math.max(...xs)).toBe(1000);
    expect(xs.at(-1)!).toBeLessThan(1000);
  });

  it('let go under its line, it flies back up onto it with its tail', () => {
    const place = held();
    place.hold(150, 500);
    place.toss(0, 0, walls);
    const frames = run(place, 0.1, 3, () => edge);
    expect(frames.some((f) => f.moving === 'flying')).toBe(true);
    expect(frames.at(-1)!.foot).toBe(400);
  });

  it('thrown with no edge in view, catches itself on its tail coming down to its hover line, or flies up to it (issue 142)', () => {
    const over = held();
    over.hold(200, 200);
    over.toss(0, -300, walls);
    const caught = run(over, 0.1, 2, () => hover);
    expect(changes(caught)).toEqual(['thrown', 'hovering']);
    expect(caught.filter((f) => f.moving === 'hovering').every((f) => f.foot <= hover.foot && f.foot >= hover.foot - HOVER_UNDER)).toBe(true);
    const under = held();
    under.hold(150, 500);
    under.toss(0, 0, walls);
    const back = run(under, 0.1, 3, () => hover);
    expect(changes(back)).toEqual(['flying', 'hovering']); // under its line from the first frame
  });

  it('let go near a plot to ride, it drops onto the line with no throw, at its nearest spot along it (issue 197)', () => {
    const plot: Perch = { id: 'surf 1', foot: 400, hovering: false };
    const over = held();
    over.hold(350, 300);
    over.dropOntoLine();
    const falls = run(over, 0.1, 2, () => plot, false, { min: 0, max: 300 }, 100);
    expect(falls[0]).toMatchObject({ moving: 'falling', vy: expect.any(Number) });
    expect(Math.min(...falls.map((f) => f.foot))).toBeGreaterThanOrEqual(300); // no hop up first
    expect(falls.find((f) => f.landedAt !== null)).toMatchObject({ moving: 'landing', foot: 400, landedAt: 300 });
    const under = held();
    under.hold(150, 500);
    under.dropOntoLine();
    const flies = run(under, 0.1, 3, () => plot, false, { min: 0, max: 300 }, 100);
    expect(changes(flies)[0]).toBe('flying');
    expect(flies.find((f) => f.landedAt !== null)).toMatchObject({ foot: 400, landedAt: 150 });
  });

  it('never thrown faster than its fastest', () => {
    const place = held();
    place.hold(500, 300);
    place.toss(30000, 0, walls);
    const [first] = run(place, 0.1, 0.12, () => edge);
    expect(first.vx).toBeLessThanOrEqual(FASTEST_THROW);
  });
});


describe('which LFOs it may ride, now and then, outside the Demo (issue 141)', () => {
  const lfo = (settings: Partial<Lfo> = {}): Lfo => ({
    rate: 0.5, amount: 0.5, note: noteIndex('1/4'), waveform: 'sine', destination: 'cutoff', retrigger: 'free', sync: 'off', ...settings,
  });
  const free = { demo: false, reduced: false };

  it('a Sine or a Triangle at 2.5 Hz or slower, with its Depth above 0 (issue 270)', () => {
    expect(ridesFor([lfo(), lfo({ waveform: 'triangle', rate: 1 })], 120, free)).toEqual([1, 2]);
    expect(ridesFor([lfo({ rate: 2.5 }), lfo({ waveform: 'triangle', rate: 2.5 })], 120, free)).toEqual([1, 2]);
    expect(ridesFor([lfo({ rate: 0.05, amount: 0.01 }), lfo({ waveform: 'triangle', rate: 0.2 })], 120, free)).toEqual([1, 2]);
  });

  it('not a Saw, a Saw Down or a Square, whose cliff would throw it off', () => {
    for (const waveform of ['saw', 'sawDown', 'square'] as const) expect(ridesFor([lfo({ waveform }), lfo()], 120, free)).toEqual([2]);
  });

  it('not over 2.5 Hz, nor at a Depth of 0', () => {
    expect(ridesFor([lfo({ rate: 2.6 }), lfo({ amount: 0 })], 120, free)).toEqual([]);
    expect(ridesFor([lfo({ rate: 2.6, waveform: 'triangle' }), lfo({ rate: 4 })], 120, free)).toEqual([]);
  });

  it('synced, by the Hz its note value gives at the tempo (issue 112)', () => {
    // A quarter note: 2 Hz at 120 BPM, 4 at 240; an eighth: 4 Hz at 120; a bar: 0.5 Hz at 120.
    expect(ridesFor([lfo({ sync: 'on', note: noteIndex('1/4'), rate: 5 }), lfo({ sync: 'on', note: noteIndex('1 bar'), rate: 5 })], 120, free)).toEqual([1, 2]);
    expect(ridesFor([lfo({ sync: 'on', note: noteIndex('1/8'), rate: 0.1 }), lfo({ sync: 'on', note: noteIndex('1/4') })], 240, free)).toEqual([]);
    // A quarter-note triplet: 2.5 Hz at 100 BPM, worked out a hair over it in floating point (issue 270); 2.6 at 104.
    expect(ridesFor([lfo({ sync: 'on', note: noteIndex('1/4 T') }), lfo({ sync: 'on', note: noteIndex('1/4 T') })], 100, free)).toEqual([1, 2]);
    expect(ridesFor([lfo({ sync: 'on', note: noteIndex('1/4 T') })], 104, free)).toEqual([]);
  });

  it('never while the Demo plays, nor under reduced motion', () => {
    expect(ridesFor([lfo(), lfo()], 120, { demo: true, reduced: false })).toEqual([]);
    expect(ridesFor([lfo(), lfo()], 120, { demo: false, reduced: true })).toEqual([]);
  });
});

describe('sliding down onto the panel and clinging beside a control (issue 151)', () => {
  const cling = (id: string, foot: number): Perch => ({ id: `cling ${id}`, foot, hovering: false, cling: true });

  it('from its edge, slides down the panel to the control’s side, without falling, and clings there', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 300), span, 0, false, 100);
    const frames = run(place, 1 / 60, 3, () => cling('cutoff', 450), false, { min: 160, max: 160 });
    expect(changes(frames)).toEqual(['sliding', 'clinging']);
    const sliding = frames.filter((f) => f.moving === 'sliding');
    // From where it stood, down and across, never past its spot, never back up.
    expect(Math.abs(sliding[0].x! - 100)).toBeLessThan(5);
    for (let i = 1; i < sliding.length; i++) {
      expect(sliding[i].foot).toBeGreaterThanOrEqual(sliding[i - 1].foot);
      expect(sliding[i].x!).toBeGreaterThanOrEqual(sliding[i - 1].x!);
    }
    expect(Math.max(...sliding.map((f) => f.foot))).toBeLessThanOrEqual(450);
    // The frame it arrives says where, once.
    expect(frames.filter((f) => f.landedAt !== null).map((f) => f.landedAt)).toEqual([160]);
    expect(frames.at(-1)).toMatchObject({ moving: 'clinging', foot: 450, x: 160 });
  });

  it('clinging, it stays with the control as the page scrolls or the layout moves it', () => {
    const place = createMascotPlace();
    place.frame(cling('cutoff', 450), { min: 160, max: 160 }, 0, false, 160);
    run(place, 1 / 60, 2, () => cling('cutoff', 450), false, { min: 160, max: 160 });
    const moved = place.frame(cling('cutoff', 380), { min: 175, max: 175 }, 2.1, false, 0);
    expect(moved).toMatchObject({ moving: 'clinging', foot: 380, x: 175 });
  });

  it('from one control to another, slides across from where it clings, not from where its stroll was', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 300), span, 0, false, 100);
    run(place, 1 / 60, 3, () => cling('cutoff', 450), false, { min: 160, max: 160 });
    const frames = run(place, 3 + 1 / 60, 6, () => cling('resonance', 450), false, { min: 260, max: 260 }, 0);
    expect(changes(frames)).toEqual(['sliding', 'clinging']);
    expect(frames[0].x).toBeGreaterThanOrEqual(160);
    expect(frames.every((f) => f.foot === 450)).toBe(true);
    expect(frames.at(-1)!.x).toBe(260);
  });

  it('let go, it hops back up to its edge from where it clung, and lands there', () => {
    const place = createMascotPlace();
    place.frame(cling('cutoff', 450), { min: 160, max: 160 }, 0, false, 160);
    run(place, 1 / 60, 1, () => cling('cutoff', 450), false, { min: 160, max: 160 });
    const frames = run(place, 1 + 1 / 60, 4, () => edge('Amp', 300), false, { min: 150, max: 170 }, 0);
    expect(changes(frames)).toEqual(['flying', 'landing', 'standing']);
    expect(frames[0].x).toBeCloseTo(160, 0);
    expect(frames.at(-1)!.foot).toBe(300);
  });
});

describe('on its surfboard, leaning with the wave (issue 204)', () => {
  it('its board along the line under it: leaning right where the line falls to the right, left where it rises; level on a flat line', () => {
    // The line 3 px lower 6 px further right: about 27° clockwise; 3 px higher: about 27° back.
    expect(surfLean(10, 13, 6)).toBeCloseTo(26.6, 1);
    expect(surfLean(10, 7, 6)).toBeCloseTo(-26.6, 1);
    expect(surfLean(10, 10, 6)).toBe(0);
  });

  it('never steeper than 35°, so it stays on its board on a sharp edge', () => {
    expect(surfLean(0, 40, 6)).toBe(35);
    expect(surfLean(40, 0, 6)).toBe(-35);
  });
});
