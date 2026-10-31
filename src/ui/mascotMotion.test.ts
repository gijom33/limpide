import { describe, expect, it } from 'vitest';
import { createMascotMotion, DOZE_SECONDS, type Heard, HOP_SECONDS } from './mascotMotion';

const quiet: Heard = { amp: 0, sway: 0, struck: null };

describe("the mascot's moves (issue 115)", () => {
  it('hops on a Note: up then down within the hop, with a splash, then back on its feet', () => {
    const motion = createMascotMotion();
    motion.frame(quiet, 0, false);
    const mid = motion.frame({ amp: 0.5, sway: 0, struck: 1 }, 1 + HOP_SECONDS / 2, false);
    expect(mid.lift).toBeGreaterThan(4);
    expect(mid.legs).toBe('tuck');
    expect(mid.splash).toBe(true);
    const after = motion.frame({ amp: 0.5, sway: 0, struck: 1 }, 1 + HOP_SECONDS + 0.01, false);
    expect(after.lift).toBe(0);
    expect(after.legs).toBe('stand');
  });

  it('hops again on the next Note, and not on a Note it already hopped for', () => {
    const motion = createMascotMotion();
    motion.frame({ amp: 0.5, sway: 0, struck: 1 }, 1.05, false);
    expect(motion.frame({ amp: 0.5, sway: 0, struck: 1 }, 2.05, false).lift).toBe(0);
    expect(motion.frame({ amp: 0.5, sway: 0, struck: 2 }, 2.05, false).lift).toBeGreaterThan(0);
  });

  it('sways with an LFO it hears, looking the way it leans; upright without one', () => {
    const motion = createMascotMotion();
    const right = motion.frame({ amp: 0.5, sway: 1, struck: null }, 1, false);
    expect(right.tilt).toBeGreaterThan(0);
    expect(right.eyes).toBe('right');
    expect(motion.frame({ amp: 0.5, sway: -1, struck: null }, 1.1, false).eyes).toBe('left');
    expect(motion.frame({ amp: 0.5, sway: 0, struck: null }, 1.2, false).tilt).toBe(0);
  });

  it('stretches with the Amp level, and splashes when loud', () => {
    const motion = createMascotMotion();
    const soft = motion.frame({ amp: 0.2, sway: 0, struck: null }, 1, false);
    const loud = motion.frame({ amp: 1, sway: 0, struck: null }, 1.1, false);
    expect(loud.stretch).toBeGreaterThan(soft.stretch);
    expect(loud.splash).toBe(true);
    expect(soft.splash).toBe(false);
  });

  it('keeps still when nothing sounds, and dozes off after a while', () => {
    const motion = createMascotMotion();
    motion.frame({ amp: 0.5, sway: 1, struck: null }, 1, false);
    const hush = motion.frame({ ...quiet, sway: 1 }, 1.5, false);
    expect(hush).toMatchObject({ lift: 0, tilt: 0, stretch: 1, eyes: 'open' });
    expect(motion.frame(quiet, 1.5 + DOZE_SECONDS + 0.1, false).eyes).toBe('shut');
  });

  it('with reduced motion, it never moves and changes pose only on each Note', () => {
    const motion = createMascotMotion();
    const first = motion.frame({ amp: 1, sway: 1, struck: 1 }, 1.05, true);
    expect(first).toMatchObject({ lift: 0, tilt: 0, stretch: 1 });
    const same = motion.frame({ amp: 0.3, sway: -1, struck: 1 }, 1.5, true);
    expect(same).toEqual(first);
    const next = motion.frame({ amp: 0.3, sway: -1, struck: 2 }, 2, true);
    expect(next).not.toEqual(first);
    expect(next).toMatchObject({ lift: 0, tilt: 0, stretch: 1 });
  });
});
