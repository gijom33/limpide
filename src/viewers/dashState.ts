/**
 * Where each broken line on a scrolling plot starts its pattern, so its marks travel left with the curve and hold still
 * against it. Dashed from the left edge alone, the marks were measured along the path from wherever the edge happened
 * to be, which changes every frame, so they crawled and blurred (the owner, 2026-10-28). The browser still measures
 * them along the path (a vertical edge is dashed like the rest), but each line starts its pattern where the previous
 * frame's had got to at the new left edge: the length of curve that scrolled off. Only the previous frame's lines are
 * kept: a line that is no longer drawn is forgotten, and starts afresh if it comes back.
 */
export function createDashState() {
  type Line = { left: number; lengths: number[]; travelled: number };
  let previous = new Map<string, Line>();
  let drawn = new Map<string, Line>();
  return {
    /** A new frame begins: the lines drawn in the last one become those to carry on from. */
    nextFrame() {
      previous = drawn;
      drawn = new Map();
    },
    /**
     * How far along its pattern the line `key` has travelled at its left edge: `ys` its height at each column, one
     * pixel apart, `left` the time at its left edge, `pixelsPerSecond` how fast the plot scrolls.
     */
    start(key: string, left: number, ys: readonly number[], pixelsPerSecond: number): number {
      const lengths = [0];
      for (let x = 1; x < ys.length; x++) lengths.push(lengths[x - 1] + Math.hypot(1, ys[x] - ys[x - 1]));
      const before = previous.get(key);
      const gone = before ? (left - before.left) * pixelsPerSecond : -1;
      let travelled = 0;
      if (before && gone >= 0 && gone < before.lengths.length - 1) {
        const i = Math.floor(gone);
        travelled = before.travelled + before.lengths[i] + (before.lengths[i + 1] - before.lengths[i]) * (gone - i);
      }
      drawn.set(key, { left, lengths, travelled });
      return travelled;
    },
  };
}
