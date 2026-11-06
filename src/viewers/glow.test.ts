import { describe, expect, it } from 'vitest';
import { createGlow, glows } from './glow';

/** Draws one frame at `time` (ms) with the newest outline `value`, and returns the past ones it draws under it. */
function frames(glow: ReturnType<typeof createGlow<string>>, times: number[], { on = true, frozen = false } = {}) {
  let past: { value: string; alpha: number }[] = [];
  for (const t of times) past = glow({ on, frozen, now: () => t, newest: `at ${t}` });
  return past;
}

describe('Glow (issues 180, 199)', () => {
  it('glows nothing Off, the Scopes alone under Scopes, the Scopes and the Spectrums under All (issue 229)', () => {
    expect([glows('off', 'scope'), glows('scopes', 'scope'), glows('all', 'scope')]).toEqual([false, true, true]);
    expect([glows('off', 'spectrum'), glows('scopes', 'spectrum'), glows('all', 'spectrum')]).toEqual([false, false, true]);
  });

  it('keeps at most a quarter of a second of past outlines, oldest first, each faded by 0.85 per 60th of a second of age', () => {
    const glow = createGlow<string>();
    const step = 1000 / 60;
    const past = frames(glow, Array.from({ length: 40 }, (_, i) => i * step));
    const now = 39 * step;
    // 250 ms is 15 steps: the outlines 1 to 15 steps old, the oldest first.
    expect(past.map((p) => p.value)).toEqual(Array.from({ length: 15 }, (_, i) => `at ${(24 + i) * step}`));
    expect(past.at(-1)?.alpha).toBeCloseTo(0.85);
    expect(past[0].alpha).toBeCloseTo(0.85 ** 15);
    expect(past.every((p) => now - Number(p.value.slice(3)) <= 250)).toBe(true);
  });

  it('keeps one outline per 60th of a second, so a 120 Hz screen draws no more', () => {
    const glow = createGlow<string>();
    const past = frames(glow, Array.from({ length: 80 }, (_, i) => i * (1000 / 120)));
    expect(past.length).toBeLessThanOrEqual(15);
    expect(past.length).toBeGreaterThanOrEqual(14);
  });

  it('keeps none while Off, and drops what it kept when turned Off', () => {
    const glow = createGlow<string>();
    expect(frames(glow, [0, 20, 40, 60], { on: false })).toEqual([]);
    expect(frames(glow, [80, 100, 120])).toHaveLength(2);
    expect(frames(glow, [140], { on: false })).toEqual([]);
  });

  it('after a cycles change, passes over the traces drawn for the old count, and glows again from the new (issue 228)', () => {
    const glow = createGlow<string>();
    const draw = (t: number, cycles: number) => glow({ on: true, frozen: false, now: () => t, newest: `${cycles} at ${t}`, key: String(cycles) });
    for (const t of [0, 20, 40, 60]) draw(t, 2);
    expect(draw(80, 2).map((p) => p.value)).toEqual(['2 at 0', '2 at 20', '2 at 40', '2 at 60']);
    // Four cycles from 100 ms: none of the two-cycle traces is drawn across the new width, though they are not yet stale.
    expect(draw(100, 4)).toEqual([]);
    expect(draw(120, 4).map((p) => p.value)).toEqual(['4 at 100']);
    // And back to two within the quarter of a second: only the two-cycle traces, the four-cycle ones passed over.
    expect(draw(140, 2).map((p) => p.value)).toEqual(['2 at 0', '2 at 20', '2 at 40', '2 at 60', '2 at 80']);
  });

  it('frozen, keeps its outlines at the fade of the moment it froze, adding none', () => {
    const glow = createGlow<string>();
    const live = frames(glow, [0, 20, 40, 60, 80]);
    const frozen = frames(glow, [100, 2000, 5000], { frozen: true });
    // The frame frozen at 100 ms draws the outline of 80 ms too; then nothing moves.
    expect(frozen.map((p) => p.value)).toEqual([...live.map((p) => p.value), 'at 80']);
    expect(frames(glow, [9000], { frozen: true })).toEqual(frozen);
  });
});
