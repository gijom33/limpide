import { describe, expect, it } from 'vitest';
import { createMascotMotion, DOZE_SECONDS, GESTURE_SECONDS, type Heard, HOP_SECONDS, LEAVE_SECONDS, NUDGE_PX, type Pose, type Room } from './mascotMotion';
import { JOKES, PICKED_TRICKS } from './mascotTricks';

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
    const poses = run(motion, 0, DOZE_SECONDS + 7.5, quiet); // it first wakes 8 to 15 s after dozing off
    const dozing = poses.slice(60 * (DOZE_SECONDS + 0.1));
    expect(new Set(dozing.map((p) => p.x)).size).toBe(1);
    expect(dozing.every((p) => p.eyes === 'shut')).toBe(true);
  });

  it('strolls and plays even when nothing is heard, before dozing', () => {
    const poses = run(createMascotMotion(seeded(5)), 0, DOZE_SECONDS - 0.5, quiet);
    const xs = poses.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(40);
  });

  it('with nothing played, does many funny turns, at random', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 24; seed++) {
      for (const p of run(createMascotMotion(seeded(seed)), 0, DOZE_SECONDS - 0.5, quiet)) if (p.doing) seen.add(p.doing);
    }
    expect(seen.size).toBeGreaterThanOrEqual(12);
  });

  it('the Filter Slope cues a funny turn when nothing has been played for a while, and a glance with music', () => {
    const motion = createMascotMotion(seeded(3));
    motion.frame(quiet, 0, false, wide);
    motion.frame(quiet, 4, false, wide);
    motion.gesture('perform', 4);
    expect(motion.frame(quiet, 4.05, false, wide).doing).not.toBeNull();
    const busy = createMascotMotion(seeded(3));
    busy.frame(playing, 0, false, wide);
    busy.gesture('perform', 0.5);
    expect(busy.frame(playing, 0.55, false, wide).doing).toBeNull();
  });

  it('keeps its tricks for when nothing is played: with music it listens', () => {
    const poses = run(createMascotMotion(seeded(2)), 0, 15, playing, spot);
    expect(poses.some((p) => p.turn < 0 || p.splash === 'wide' || Math.abs(p.wag) > 0)).toBe(false);
  });

  it('wakes now and then from dozing, yawning, then dozes off again', () => {
    const poses = run(createMascotMotion(seeded(9)), 0, DOZE_SECONDS + 40, quiet, spot);
    const later = poses.slice(60 * (DOZE_SECONDS + 1));
    const awake = later.filter((p) => p.eyes !== 'shut').length;
    expect(awake).toBeGreaterThan(60);
    expect(later.at(-1)!.eyes === 'shut' || awake < later.length).toBe(true);
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

describe('the mascot dancing, tickled and frightened (issue 115)', () => {
  it('dances along with the music, a step each Note, turning back at the ends', () => {
    const motion = createMascotMotion(seeded(4));
    const poses: Pose[] = [];
    for (let t = 0; t <= 8; t += 1 / 60) poses.push(motion.frame({ amp: 0.6, sway: 0, struck: Math.floor(t / 0.25) * 0.25 }, t, false, wide));
    const xs = poses.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(80);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(200);
  });

  it('tickled, squirms and giggles where it is, and stops soon after', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, wide);
    const poses: Pose[] = [];
    for (let t = 0.5; t <= 1.5; t += 1 / 60) {
      motion.tickle(t);
      poses.push(motion.frame(quiet, t, false, wide));
    }
    expect(poses.every((p) => p.eyes === 'happy')).toBe(true);
    expect(Math.max(...poses.map((p) => p.tilt)) - Math.min(...poses.map((p) => p.tilt))).toBeGreaterThan(10);
    expect(new Set(poses.map((p) => p.x)).size).toBe(1);
    expect(motion.frame(quiet, 2, false, wide).eyes).not.toBe('happy');
  });

  it('now and then, at an end of its room, looks over the edge, takes fright and scoots back', () => {
    let frightened = 0;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const motion = createMascotMotion(seeded(seed));
      const poses = run(motion, 0, 19, playing, { min: 0, max: 60 });
      // A fright: eyes shut, a nervous droplet, at an end; then it is back from that end.
      const fright = poses.findIndex((p) => p.burst?.spread === 'side' && (p.x < 3 || p.x > 57));
      if (fright < 0) continue;
      frightened++;
      const end = poses[fright].x < 30 ? 0 : 60;
      expect(Math.abs(poses[Math.min(poses.length - 1, fright + 45)].x - end)).toBeGreaterThan(15);
    }
    expect(frightened).toBeGreaterThan(1);
  });
});

describe('the mascot fed up, and its tricks dealt (issue 115)', () => {
  it('deals its tricks like a shuffled deck: each once before any comes again, the jokes three times', () => {
    const motion = createMascotMotion(seeded(6));
    motion.frame(quiet, 0, false, wide);
    const dealt: string[] = [];
    const cards = PICKED_TRICKS.length + 2 * JOKES.length;
    for (let i = 0; i < cards; i++) {
      const t = 4 + i * 0.5; // a cue again within a gesture's length carries on
      motion.gesture('perform', t);
      dealt.push(motion.frame(quiet, t, false, wide).doing!);
    }
    expect(new Set(dealt).size).toBe(PICKED_TRICKS.length);
    for (const joke of JOKES) expect(dealt.filter((d) => d === joke)).toHaveLength(3);
  });

  it('tickled too long, it runs off to the far end of its room, and will not be tickled for a while', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, { min: 0, max: 200 }); // the middle
    motion.place(40); // nearer the left end
    const poses: Pose[] = [];
    for (let t = 0.1; t <= 6; t += 1 / 60) {
      motion.tickle(t);
      poses.push(motion.frame(quiet, t, false, { min: 0, max: 200 }));
    }
    const ran = poses.findIndex((p) => p.escaped);
    expect(ran / 60).toBeGreaterThan(2);
    expect(ran / 60).toBeLessThan(5);
    expect(poses.slice(ran).some((p) => p.x === 200)).toBe(true);
    expect(poses.slice(ran + 5, ran + 60).every((p) => p.eyes !== 'happy')).toBe(true);
  });

  it('clicked again and again, it runs off too', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, wide);
    let ran = false;
    for (let i = 0; i < 6 && !ran; i++) {
      motion.poke(0.2 + i * 0.25);
      ran = motion.frame(quiet, 0.2 + i * 0.25, false, wide).escaped;
    }
    expect(ran).toBe(true);
  });
});

describe('the mascot leaving (issue 115)', () => {
  it('crouches, leaps, slams back down stretched long, and smashes into a burst, a puddle that spreads, a film', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(playing, 0, false, spot);
    motion.leave(1);
    const poses = run(motion, 1, 1 + LEAVE_SECONDS + 0.05, playing, spot);
    expect(poses[3].stretch).toBeLessThan(0.9); // the crouch
    const top = poses.findIndex((p) => p.lift === Math.max(...poses.map((q) => q.lift)));
    expect(poses[top].lift).toBeGreaterThan(18);
    // Coming down it speeds up and stretches long.
    const slam = poses.slice(top, poses.findIndex((p) => p.form !== 'drop'));
    expect(slam.at(-1)!.stretch).toBeGreaterThan(1.3);
    expect(slam.at(-2)!.lift - slam.at(-1)!.lift).toBeGreaterThan(slam[1].lift - slam[2].lift);
    const forms = poses.map((p) => p.form).filter((f, i, all) => f !== all[i - 1]);
    expect(forms).toEqual(['drop', 'squashed', 'puddle', 'spread', 'film']);
    const bursts = poses.filter((p) => p.burst);
    expect(bursts).toHaveLength(1);
    expect(bursts[0].burst).toEqual({ count: 14, spread: 'up' });
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
