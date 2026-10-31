import { describe, expect, it } from 'vitest';
import { createMascotMotion, DOZE_SECONDS, GESTURE_SECONDS, type Heard, HOP_SECONDS, LEAVE_SECONDS, NUDGE_PX, type Pose, type Room } from './mascotMotion';

const quiet: Heard = { amp: 0, sway: 0, struck: null };
const playing: Heard = { amp: 0.5, sway: 0, struck: null };
/** No room to stroll: it stays where it is. */
const spot: Room = { min: 0, max: 0 };
const wide: Room = { min: 0, max: 200 };

/** A repeatable random: a fixed sequence. */
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

/** Frames at 60 a second from `from` to `to`, all heard as `heard`. */
function run(motion: ReturnType<typeof createMascotMotion>, from: number, to: number, heard = playing, room = wide, reduced = false): Pose[] {
  const poses: Pose[] = [];
  for (let t = from; t <= to; t += 1 / 60) poses.push(motion.frame(heard, t, reduced, room));
  return poses;
}

describe("the mascot's moves with the sound (issue 115)", () => {
  it('hops on a Note: up then down within the hop, with a splash, then back on its feet', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, spot);
    const mid = motion.frame({ amp: 0.5, sway: 0, struck: 1 }, 1 + HOP_SECONDS / 2, false, spot);
    expect(mid.lift).toBeGreaterThan(4);
    expect(mid.legs).toBe('tuck');
    expect(mid.splash).toBe('up');
    const after = motion.frame({ amp: 0.5, sway: 0, struck: 1 }, 1 + HOP_SECONDS + 0.01, false, spot);
    expect(after.lift).toBe(0);
    expect(after.legs).toBe('stand');
  });

  it('sways with an LFO it hears, looking the way it leans; upright without one', () => {
    const motion = createMascotMotion(() => 0.5);
    const right = motion.frame({ amp: 0.5, sway: 1, struck: null }, 1, false, spot);
    expect(right.tilt).toBeGreaterThan(0);
    expect(right.eyes).toBe('right');
    expect(motion.frame({ amp: 0.5, sway: -1, struck: null }, 1.1, false, spot).eyes).toBe('left');
    expect(motion.frame(playing, 1.2, false, spot).tilt).toBe(0);
  });

  it('stretches with the Amp level, and splashes when loud', () => {
    const motion = createMascotMotion(() => 0.5);
    const soft = motion.frame({ amp: 0.2, sway: 0, struck: null }, 1, false, spot);
    const loud = motion.frame({ amp: 1, sway: 0, struck: null }, 1.1, false, spot);
    expect(loud.stretch).toBeGreaterThan(soft.stretch);
    expect(loud.splash).toBe('up');
    expect(soft.splash).toBe('none');
  });

  it('keeps still when nothing sounds, and dozes off after a while', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame({ amp: 0.5, sway: 1, struck: null }, 1, false, spot);
    const hush = motion.frame({ ...quiet, sway: 1 }, 1.5, false, spot);
    expect(hush).toMatchObject({ lift: 0, tilt: 0, stretch: 1, eyes: 'open' });
    expect(motion.frame(quiet, 1.5 + DOZE_SECONDS + 0.1, false, spot).eyes).toBe('shut');
  });
});

describe("the mascot's own life (issue 115)", () => {
  it('strolls along its room at random, legs in turn, pausing between strolls, never past its ends', () => {
    const poses = run(createMascotMotion(seeded()), 0, 30);
    const xs = poses.map((p) => p.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(200);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(60);
    expect(poses.some((p) => p.legs === 'walkA') && poses.some((p) => p.legs === 'walkB')).toBe(true);
    const pauses = poses.filter((p, i) => i > 0 && p.x === poses[i - 1].x).length;
    expect(pauses).toBeGreaterThan(poses.length / 4);
  });

  it('blinks now and then', () => {
    const poses = run(createMascotMotion(seeded(7)), 0, 8, playing, spot);
    expect(poses.some((p) => p.eyes === 'shut')).toBe(true);
    expect(poses.filter((p) => p.eyes === 'shut').length).toBeLessThan(poses.length / 5);
  });

  it('stays put while it dozes', () => {
    const motion = createMascotMotion(seeded(3));
    const poses = run(motion, 0, 30, quiet);
    const dozing = poses.slice(60 * (DOZE_SECONDS + 0.1));
    expect(new Set(dozing.map((p) => p.x)).size).toBe(1);
    expect(dozing.every((p) => p.eyes === 'shut')).toBe(true);
  });
});

describe("the mascot's answers to the controls (issue 115)", () => {
  it('walks right as the Cutoff opens and left as it closes, stopping at the room’s ends', () => {
    const motion = createMascotMotion(() => 0.5);
    const start = motion.frame(playing, 0, false, wide).x; // the middle, with this random
    motion.gesture('brighter', 0);
    expect(run(motion, 0, 0.5).at(-1)!.x).toBeCloseTo(start + NUDGE_PX, 0);
    motion.gesture('darker', 0.6);
    motion.gesture('darker', 0.6 + GESTURE_SECONDS); // a second turn, once the first is done
    expect(run(motion, 0.6, 1.4).at(-1)!.x).toBeCloseTo(start - NUDGE_PX, 0);
    for (let t = 1.5; t < 10; t += GESTURE_SECONDS) motion.gesture('brighter', t);
    expect(Math.max(...run(motion, 1.5, 10).map((p) => p.x))).toBe(200);
  });

  it('follows a sweep turned every frame, as the Demo turns the Cutoff, at a walk', () => {
    const motion = createMascotMotion(() => 0.5);
    const room = { min: 0, max: 1000 };
    const start = motion.frame(playing, 0, false, room).x;
    let x = start;
    for (let t = 0; t <= 2; t += 1 / 60) {
      motion.gesture('brighter', t);
      x = motion.frame(playing, t, false, room).x;
    }
    // One step a gesture's length: about 24 px each 0.45 s.
    expect(x - start).toBeGreaterThan(80);
    expect(x - start).toBeLessThan(140);
  });

  it('hops higher, shivers, splashes, winces and wiggles', () => {
    const at = (gesture: Parameters<ReturnType<typeof createMascotMotion>['gesture']>[0]) => {
      const motion = createMascotMotion(() => 0.5);
      motion.frame(playing, 0, false, spot);
      motion.gesture(gesture, 0.01);
      return [0.1, 0.15, 0.2, 0.25].map((t) => motion.frame(playing, t, false, spot));
    };
    expect(at('higher')[2].lift).toBeGreaterThan(8);
    expect(new Set(at('rougher').map((p) => p.x)).size).toBeGreaterThan(1);
    expect(at('louder')[1].splash).toBe('up');
    expect(at('quieter')[1].eyes).toBe('shut');
    expect(at('twirl').some((p) => Math.abs(p.tilt) > 3)).toBe(true);
    expect(at('taller')[2].stretch).toBeGreaterThan(at('shorter')[2].stretch);
  });

  it('wakes from dozing when a control is turned', () => {
    const motion = createMascotMotion(() => 0.5);
    run(motion, 0, DOZE_SECONDS + 1, quiet, spot);
    expect(motion.frame(quiet, DOZE_SECONDS + 1.1, false, spot).eyes).toBe('shut');
    motion.gesture('taller', DOZE_SECONDS + 1.2);
    expect(motion.frame(quiet, DOZE_SECONDS + 1.3, false, spot).eyes).not.toBe('shut');
  });
});

describe('the mascot leaving (issue 115)', () => {
  it('jumps, lands with a splash, melts to a puddle, then a film that fades, then is gone', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(playing, 0, false, spot);
    motion.leave(1);
    const poses = run(motion, 1, 1 + LEAVE_SECONDS + 0.05, playing, spot);
    expect(Math.max(...poses.map((p) => p.lift))).toBeGreaterThan(10);
    const forms = poses.map((p) => `${p.form} ${p.splash}`).filter((f, i, all) => f !== all[i - 1]);
    expect(forms).toEqual(['drop up', 'drop wide', 'puddle wide', 'film none']);
    const film = poses.filter((p) => p.form === 'film' && !p.gone);
    expect(film[0].fade).toBeGreaterThan(film.at(-1)!.fade);
    expect(poses.at(-1)!.gone).toBe(true);
    motion.gesture('higher', 3); // nothing turns it back
    expect(motion.frame(playing, 3.1, false, spot).gone).toBe(true);
  });
});

describe('the mascot with reduced motion (issue 115)', () => {
  it('never moves, changes pose only on a Note or a control turned, and goes at once', () => {
    const motion = createMascotMotion(seeded());
    const poses = run(motion, 0, 10, { amp: 1, sway: 1, struck: null }, wide, true);
    expect(new Set(poses.map((p) => JSON.stringify(p))).size).toBe(1);
    expect(poses[0]).toMatchObject({ lift: 0, tilt: 0, stretch: 1 });
    motion.gesture('brighter', 10.1);
    const after = motion.frame(playing, 10.2, true, wide);
    expect(after.x).toBe(poses[0].x);
    expect(after.eyes).not.toBe(poses[0].eyes);
    const note = motion.frame({ amp: 0.5, sway: 0, struck: 10.3 }, 10.3, true, wide);
    expect(note.eyes).not.toBe(after.eyes);
    motion.leave(10.4);
    expect(motion.frame(playing, 10.4, true, wide).gone).toBe(true);
  });
});
