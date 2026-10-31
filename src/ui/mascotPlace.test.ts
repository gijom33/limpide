import { describe, expect, it } from 'vitest';
import { choosePerch, createMascotPlace, LANDING_SECONDS, type Moving, type Perch } from './mascotPlace';

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

/** Frames at 60 a second, the perch given by `at(t)`. */
function run(place: ReturnType<typeof createMascotPlace>, from: number, to: number, at: (t: number) => Perch, reduced = false) {
  const frames: { t: number; foot: number; moving: Moving; landed: number }[] = [];
  for (let t = from; t <= to; t += 1 / 60) frames.push({ t, ...place.frame(at(t), t, reduced) });
  return frames;
}
const edge = (id: string, foot: number): Perch => ({ id, foot, hanging: false });
const changes = (frames: { moving: Moving }[]) => frames.map((f) => f.moving).filter((m, i, all) => m !== all[i - 1]);

describe('the mascot between its lines (issue 115)', () => {
  it('follows its edge as the page scrolls', () => {
    const place = createMascotPlace();
    const frames = run(place, 0, 1, (t) => edge('Amp', 400 - 100 * t));
    expect(frames.every((f) => f.moving === 'standing' && Math.abs(f.foot - (400 - 100 * f.t)) < 1e-9)).toBe(true);
  });

  it('to a lower edge, falls like rain, faster and faster, then lands with a splash and stands', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 300), 0, false);
    const frames = run(place, 0.01, 1.5, () => edge('Filter', 700));
    expect(changes(frames)).toEqual(['falling', 'landing', 'standing']);
    const falling = frames.filter((f) => f.moving === 'falling');
    const steps = falling.slice(1).map((f, i) => f.foot - falling[i].foot);
    expect(steps.at(-1)!).toBeGreaterThan(steps[0] * 3);
    const landing = frames.filter((f) => f.moving === 'landing');
    expect(landing.length / 60).toBeCloseTo(LANDING_SECONDS, 1);
    expect(frames.at(-1)!.foot).toBe(700);
  });

  it('to a higher line, flies up on its tail, and from under the header to an edge, drops', () => {
    const place = createMascotPlace();
    place.frame(edge('Filter', 700), 0, false);
    const up = run(place, 0.01, 1.5, () => ({ id: 'ceiling', foot: 276, hanging: true }));
    expect(changes(up)).toEqual(['flying', 'hanging']);
    expect(up.at(-1)!.foot).toBe(276);
    const down = run(place, 1.51, 3, () => edge('Amp', 600));
    expect(changes(down)).toEqual(['falling', 'landing', 'standing']);
  });

  it('turns back mid-flight for a new line, from where it is', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 300), 0, false);
    const falling = run(place, 0.01, 0.2, () => edge('Filter', 900));
    const mid = falling.at(-1)!.foot;
    expect(mid).toBeGreaterThan(300);
    const back = run(place, 0.21, 2, () => edge('Oscillators', 300));
    expect(back[0].moving).toBe('flying');
    expect(back[0].foot).toBeLessThan(mid);
    expect(back.at(-1)).toMatchObject({ foot: 300, moving: 'standing' });
  });

  it('with reduced motion, is on the new line at once', () => {
    const place = createMascotPlace();
    place.frame(edge('Oscillators', 300), 0, true);
    expect(place.frame(edge('Filter', 700), 0.02, true)).toMatchObject({ foot: 700, moving: 'standing' });
  });
});
