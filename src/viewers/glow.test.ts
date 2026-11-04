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

  it('frozen, keeps its outlines at the fade of the moment it froze, adding none', () => {
    const glow = createGlow<string>();
    const live = frames(glow, [0, 20, 40, 60, 80]);
    const frozen = frames(glow, [100, 2000, 5000], { frozen: true });
    // The frame frozen at 100 ms draws the outline of 80 ms too; then nothing moves.
    expect(frozen.map((p) => p.value)).toEqual([...live.map((p) => p.value), 'at 80']);
    expect(frames(glow, [9000], { frozen: true })).toEqual(frozen);
  });
});
