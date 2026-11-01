import { describe, expect, it } from 'vitest';
import { acrossOf, choosePerch, clearAlong, createMascotPlace, FASTEST_THROW, GRAVITY, HOVER_UNDER, LANDING_SECONDS, type Moving, nearestSpan, type Perch, type Placed, type Span, WINDUP_SECONDS } from './mascotPlace';

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
    expect(clearAlong(line, [], W, H)).toEqual([{ min: 0, max: 375 - W }]);
  });

  it('with a card over the line, along its whole width, nowhere', () => {
    expect(clearAlong(line, [card(590)], W, H)).toEqual([]);
    expect(clearAlong(line, [card(600 - H + 1)], W, H)).toEqual([]); // over its head by a pixel
  });

  it('a card under the line, or far over it, leaves it whole', () => {
    expect(clearAlong(line, [card(600)], W, H)).toEqual([{ min: 0, max: 375 - W }]); // its top on the line
    expect(clearAlong(line, [{ left: 0, right: 375, top: 100, bottom: 600 - H }], W, H)).toEqual([{ min: 0, max: 375 - W }]);
  });

  it('a card over part of the line leaves the stretches either side where the whole drop fits', () => {
    expect(clearAlong({ left: 800, right: 1300, top: 600 }, [card(590, 900, 1100)], W, H)).toEqual([
      { min: 800, max: 900 - W },
      { min: 1100, max: 1300 - W },
    ]);
    // A gap narrower than the drop is no room.
    expect(clearAlong(line, [card(590, 0, 100), card(590, 130, 375)], W, H)).toEqual([]);
  });

  it('of the stretches left, the one nearest to where it is', () => {
    const spans = [{ min: 0, max: 100 }, { min: 300, max: 400 }];
    expect(nearestSpan(spans, 50)).toEqual(spans[0]);
    expect(nearestSpan(spans, 250)).toEqual(spans[1]);
    expect(nearestSpan(spans, 500)).toEqual(spans[1]);
    expect(nearestSpan([], 50)).toBeNull();
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

  it('never thrown faster than its fastest', () => {
    const place = held();
    place.hold(500, 300);
    place.toss(30000, 0, walls);
    const [first] = run(place, 0.1, 0.12, () => edge);
    expect(first.vx).toBeLessThanOrEqual(FASTEST_THROW);
  });
});

