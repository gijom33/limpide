import { describe, expect, it } from 'vitest';
import { acrossOf, choosePerch, createMascotPlace, GRAVITY, LANDING_SECONDS, type Moving, type Perch, type Placed, type Span, WINDUP_SECONDS } from './mascotPlace';

const H = 26;
const ROOM = 18;
const pick = (current: string | null, tops: Record<string, number>, ceiling = 250, where = 300) =>
  choosePerch(current, Object.entries(tops).map(([id, top]) => ({ id, top })), ceiling, 812, H, ROOM, where);

describe('which line the mascot is on, on a phone or in 2 × 2 (issue 115)', () => {
  it('stands on a section edge with room over it, below the header and on the window', () => {
    expect(pick(null, { Oscillators: 300, Filter: 1216 })).toEqual({ id: 'Oscillators', foot: 300, hanging: false });
  });

  it('keeps its edge as it scrolls up, until the drop no longer fits under the header', () => {
    expect(pick('Oscillators', { Oscillators: 280, Filter: 1196 }).id).toBe('Oscillators');
    expect(pick('Oscillators', { Oscillators: 250 + H, Filter: 700 }).id).toBe('Oscillators'); // its head at the header
    expect(pick('Oscillators', { Oscillators: 250 + H - 1, Filter: 700 }).id).toBe('Filter');
  });

  it('hangs under the header when no edge is in view, then takes the first one that comes', () => {
    expect(pick('Oscillators', { Oscillators: -200, Filter: 900 })).toEqual({ id: 'ceiling', foot: 250 + H, hanging: true });
    expect(pick('ceiling', { Oscillators: -300, Filter: 790 }, 250, 276).id).toBe('Filter');
  });

  it('moving, takes the edge nearest to where it is', () => {
    expect(pick(null, { Oscillators: 320, Filter: 700 }, 250, 650).id).toBe('Filter');
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
const edge = (id: string, foot: number): Perch => ({ id, foot, hanging: false });
const changes = (frames: { moving: Moving }[]) => frames.map((f) => f.moving).filter((m, i, all) => m !== all[i - 1]);
const span = { min: 0, max: 300 };

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

  it('climbs to the header and holds on; letting go, it drops to an edge below', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 700), span, 0, false, 100);
    const up = run(place, 1 / 60, 1.5, () => ({ id: 'ceiling', foot: 276, hanging: true }));
    expect(changes(up)).toEqual(['flying', 'hanging']);
    expect(up.at(-1)!.foot).toBe(276);
    const down = run(place, 1.51, 3, () => edge('Amp', 600));
    expect(changes(down)).toEqual(['falling', 'landing', 'standing']);
    expect(Math.min(...down.map((f) => f.foot))).toBeGreaterThanOrEqual(276); // no hop: it lets go
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
