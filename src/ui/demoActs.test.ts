import { describe, expect, it } from 'vitest';
import { createDemoActs } from './demoActs';

/** The act each part shows, played in turn from part 1 (index 0), `surfable` saying whether a plot is clear in it. */
const through = (surfable: readonly boolean[]) => {
  const acts = createDemoActs();
  return surfable.map((clear, part) => acts.act(part, clear));
};

describe("Bead's acts through the Demo (issues 127 and 204)", () => {
  it('each part the next act: conducting, the air guitar, surfing; surfing skipped with no plot clear', () => {
    // The Demo's 15 parts, an LFO plot clear in parts 5 to 8 and 13 (1-based), as at 1728 × 1117.
    const clear = Array.from({ length: 15 }, (_, i) => (i >= 4 && i <= 7) || i === 12);
    expect(through(clear)).toEqual([
      'conduct', 'airGuitar', 'conduct', 'airGuitar', 'surf', 'conduct', 'airGuitar', 'surf',
      'conduct', 'airGuitar', 'conduct', 'airGuitar', 'surf', 'conduct', 'airGuitar',
    ]);
  });

  it('with no LFO on, the parts are conducting and the air guitar in turn', () => {
    expect(through(Array(6).fill(false))).toEqual(['conduct', 'airGuitar', 'conduct', 'airGuitar', 'conduct', 'airGuitar']);
  });

  it('a part on surfing’s turn conducts until a plot is clear, then surfs; the next part conducts after a surf', () => {
    const acts = createDemoActs();
    acts.act(0, false);
    acts.act(1, false);
    expect(acts.act(2, false)).toBe('conduct');
    expect(acts.act(2, true)).toBe('surf');
    expect(acts.act(2, false)).toBe('conduct');
    expect(acts.act(3, true)).toBe('conduct');
  });

  it('a part played again from its button takes the next act; out of the Demo, none, and a new Demo starts conducting', () => {
    const acts = createDemoActs();
    expect(acts.act(4, true)).toBe('conduct');
    expect(acts.act(1, true)).toBe('airGuitar');
    expect(acts.act(2, true)).toBe('surf');
    expect(acts.act(null, true)).toBe(null);
    expect(acts.act(5, true)).toBe('conduct');
  });
});
