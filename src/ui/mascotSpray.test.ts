import { describe, expect, it } from 'vitest';
import { createSpray, DROPLET_GRAVITY, MOST_DROPLETS, RAIN_HIGH, rainFrom } from './mascotSpray';

const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe("the mascot's droplets (issue 115)", () => {
  it('a splash goes up and out both ways, then falls back under gravity', () => {
    const spray = createSpray(seeded());
    spray.fling(10, 100, 200, 'up', 1);
    const first = spray.step(1 / 60).map((d) => ({ ...d }));
    expect(first).toHaveLength(10);
    expect(first.every((d) => d.vy < 0)).toBe(true);
    expect(first.some((d) => d.vx < 0) && first.some((d) => d.vx > 0)).toBe(true);
    const later = spray.step(0.1);
    for (const d of later) {
      const before = first.find((f) => f.life === d.life)!;
      expect(d.vy - before.vy).toBeCloseTo(DROPLET_GRAVITY * 0.1, 6);
    }
  });

  it('a harder landing splashes faster', () => {
    const top = (strength: number) => {
      const spray = createSpray(seeded(3));
      spray.fling(8, 0, 0, 'up', strength);
      return Math.min(...spray.step(0).map((d) => d.vy));
    };
    expect(top(1)).toBeLessThan(top(0.1));
  });

  it('a tail sprays down, a shake sideways, a click every way', () => {
    const one = (fling: 'down' | 'side' | 'all') => {
      const spray = createSpray(seeded(5));
      spray.fling(30, 0, 0, fling);
      return spray.step(0);
    };
    expect(one('down').every((d) => d.vy > 0)).toBe(true);
    expect(one('side').every((d) => Math.abs(d.vx) > Math.abs(d.vy))).toBe(true);
    const all = one('all');
    expect(all.some((d) => d.vx < 0) && all.some((d) => d.vx > 0) && all.some((d) => d.vy > 0)).toBe(true);
  });

  it('a water gun shoots a fast jet its way', () => {
    const spray = createSpray(seeded(13));
    spray.fling(5, 0, 0, 'jet', -1);
    expect(spray.step(0).every((d) => d.vx < -300)).toBe(true);
  });

  it('water poured from a glass falls as it goes, a little its way, until it reaches the mouth', () => {
    const spray = createSpray(seeded(17));
    spray.fling(4, 0, 0, 'pour', 1, 10);
    const first = spray.step(0.02).map((d) => ({ ...d }));
    expect(first.every((d) => d.vx > 0 && d.vy > 0)).toBe(true);
    expect(spray.step(0.2)).toHaveLength(0);
  });

  it("a fountain's jet goes up at its angle", () => {
    const spray = createSpray(seeded(19));
    spray.fling(3, 0, 0, 'arc', 0.5);
    for (const d of spray.step(0)) expect(Math.atan2(d.vx, -d.vy)).toBeCloseTo(0.5, 6);
  });

  it('rain falls straight down and ends where it lands', () => {
    const spray = createSpray(seeded(11));
    spray.fling(5, 50, 0, 'rain', 0.5, 40);
    const falling = spray.step(0.05);
    expect(falling.every((d) => d.vx === 0 && d.vy > 0 && d.x === 50)).toBe(true);
    expect(spray.step(0.3)).toHaveLength(0);
  });

  it('each raindrop starts from its own height, 60 to 120 px over its edge, under what is over the page (issue 237)', () => {
    const heights = Array.from({ length: 50 }, (_, i) => 500 - rainFrom(500, 0, i / 49));
    expect(Math.min(...heights)).toBe(RAIN_HIGH.lowest);
    expect(Math.max(...heights)).toBe(RAIN_HIGH.highest);
    expect(new Set(heights.map(Math.round)).size).toBeGreaterThan(40);
    // Under the header's foot, 80 px over its edge: none starts higher.
    expect(Math.max(...Array.from({ length: 50 }, (_, i) => 500 - rainFrom(500, 420, i / 49)))).toBe(80);
  });

  it('droplets are gone after their life, and no more than the most are in the air', () => {
    const spray = createSpray(seeded(7));
    spray.fling(MOST_DROPLETS + 15, 0, 0, 'all');
    expect(spray.step(0)).toHaveLength(MOST_DROPLETS);
    expect(spray.step(1)).toHaveLength(0);
  });
});

describe('steam (issue 127)', () => {
  it('rises from it, slowing, and is gone within a second', () => {
    const spray = createSpray(() => 0.5);
    spray.fling(1, 100, 100, 'steam');
    const ys: number[] = [];
    for (let i = 0; i < 30; i++) ys.push(spray.step(1 / 60)[0]?.y ?? Number.NaN);
    expect(ys.every((y) => y < 100)).toBe(true);
    expect(ys[29]).toBeLessThan(ys[0]);
    for (let i = 0; i < 40; i++) spray.step(1 / 60);
    expect(spray.step(1 / 60)).toHaveLength(0);
  });

  it("given the sun's height, rises to it by the end of its life, still slowing as it goes (issue 237)", () => {
    for (const r of [0.1, 0.5, 0.9]) {
      const spray = createSpray(() => r);
      spray.fling(1, 100, 100, 'steam', 1, 50);
      const ys: number[] = [];
      let last = spray.step(0)[0];
      while (last) {
        ys.push(last.y);
        last = spray.step(1 / 120)[0];
      }
      expect(Math.min(...ys)).toBeGreaterThan(48);
      expect(Math.min(...ys)).toBeLessThan(53);
      const rises = ys.slice(1).map((y, i) => ys[i] - y);
      expect(rises.every((d) => d > 0)).toBe(true);
      expect(rises.at(-1)!).toBeLessThan(rises[0]);
    }
  });

  it('never rises less than it would without the sun (issue 237)', () => {
    const highest = (until?: number) => {
      const spray = createSpray(() => 0.5);
      spray.fling(1, 100, 100, 'steam', 1, until);
      let top = 100;
      for (let i = 0; i < 120; i++) for (const d of spray.step(1 / 120)) top = Math.min(top, d.y);
      return top;
    };
    expect(highest(95)).toBeCloseTo(highest(), 6);
  });
});


describe('under a ceiling (issue 200)', () => {
  /** The highest any of its droplets goes, frame by frame, over its life. */
  const highest = (spray: ReturnType<typeof createSpray>) => {
    let top = Infinity;
    for (let i = 0; i < 120; i++) for (const d of spray.step(1 / 120)) top = Math.min(top, d.y);
    return top;
  };

  it('a fountain spouting 30 px under the header keeps its droplets under it, still going up', () => {
    const spray = createSpray(seeded(23));
    spray.under(70);
    spray.fling(20, 100, 100, 'spout', 1);
    expect(spray.step(0).every((d) => d.vy < 0)).toBe(true);
    expect(highest(spray)).toBeGreaterThanOrEqual(70);
  });

  it("a fountain show's arcs and a hard landing's splash, the same", () => {
    for (const [fling, strength] of [['arc', 0.4], ['up', 1], ['all', 1], ['steam', 1]] as const) {
      const spray = createSpray(seeded(29));
      spray.under(60);
      spray.fling(20, 100, 100, fling, strength);
      expect(highest(spray)).toBeGreaterThanOrEqual(60);
    }
  });

  it('steam with the sun low beside it keeps under the ceiling (issue 237)', () => {
    const spray = createSpray(seeded(29));
    spray.under(90);
    spray.fling(20, 100, 100, 'steam', 1, 98);
    expect(highest(spray)).toBeGreaterThanOrEqual(90);
  });

  it('with room enough, droplets fly untouched', () => {
    const free = createSpray(seeded(31));
    free.fling(20, 100, 500, 'spout', 1);
    const roomy = createSpray(seeded(31));
    roomy.under(0);
    roomy.fling(20, 100, 500, 'spout', 1);
    expect(roomy.step(0)).toEqual(free.step(0));
  });
});
