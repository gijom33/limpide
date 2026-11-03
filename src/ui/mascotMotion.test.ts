import { describe, expect, it } from 'vitest';
import { createMascotMotion, DOZE_SECONDS, GESTURE_SECONDS, type Heard, HOP_SECONDS, hatOn, LEAVE_SECONDS, NUDGE_PX, type Pose, type Room, WAVE_SECONDS } from './mascotMotion';
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

  it('put down mid-stroll (back from a visit, a throw), or picked up or tickled, it strolls again a moment later', () => {
    for (const stop of ['place', 'pickUp', 'tickle'] as const) {
      const motion = createMascotMotion(seeded());
      // Frame by frame until it is mid-stroll, moving from one frame to the next; stopped there.
      let t = 0;
      let was = motion.frame(playing, t, false, wide).x;
      for (let x = was; x === was && t < 30; ) [was, x] = [x, motion.frame(playing, (t += 1 / 60), false, wide).x];
      expect(t).toBeLessThan(30);
      if (stop === 'place') motion.place(was);
      else motion[stop](t);
      const after = run(motion, t + 1 / 60, t + 15).map((p) => p.x);
      expect(Math.max(...after) - Math.min(...after), stop).toBeGreaterThan(20);
    }
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
    // Each turn dealt, by itself or on cue, then cut short by a pick-up, so the next comes once it listens no more.
    for (let t = 4; dealt.length < cards; t += 3.1) {
      let pose = motion.frame(quiet, t, false, wide);
      if (!pose.doing) {
        motion.gesture('perform', t);
        pose = motion.frame(quiet, t + 0.01, false, wide);
      }
      dealt.push(pose.doing!);
      motion.pickUp(t + 0.02);
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

describe('what the controls, the words, the page and the Demo make of it (issue 127)', () => {
  it('a Waveform chosen: its tail takes that wave a moment, then is the logo again', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(quiet, 0, false, spot);
    motion.wave('square', 1);
    expect(motion.frame(quiet, 1.1, false, spot).tail).toBe('square');
    expect(motion.frame(quiet, 1 + WAVE_SECONDS - 0.1, false, spot).tail).toBe('square');
    expect(motion.frame(quiet, 1 + WAVE_SECONDS + 0.1, false, spot).tail).toBe('logo');
  });

  it('Resonance turned past three quarters: eyes wide, tail straight, a moment only (the owner)', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(quiet, 0, false, spot);
    motion.scream(1);
    expect(motion.frame(quiet, 1.1, false, spot)).toMatchObject({ tail: 'straight', eyes: 'wide' });
    expect(motion.frame(quiet, 1 + WAVE_SECONDS + 0.1, false, spot).tail).toBe('logo');
  });

  it('Detune splits it in two, farther the more, wobbling as they beat; one drop at 0', () => {
    const motion = createMascotMotion(seeded());
    const gaps = (detune: number) => run(motion, 1, 3, { ...quiet, detune }, spot).map((p) => Math.abs(p.twin));
    expect(gaps(0).every((g) => g === 0)).toBe(true);
    const small = gaps(10);
    const big = gaps(-50);
    expect(Math.max(...big)).toBeGreaterThan(Math.max(...small));
    expect(Math.max(...big) - Math.min(...big)).toBeGreaterThan(3); // the wobble
    expect(Math.max(...big)).toBeLessThanOrEqual(16);
  });

  it("Detune's twin stands on the side of its sign: left below 0 cents, right above; still there with reduced motion (issue 174)", () => {
    const twins = (detune: number, reduced: boolean) => run(createMascotMotion(seeded()), 1, 3, { ...quiet, detune }, spot, reduced).map((p) => p.twin);
    for (const reduced of [false, true]) {
      expect(twins(-30, reduced).every((t) => t < 0)).toBe(true);
      expect(twins(30, reduced).every((t) => t > 0)).toBe(true);
      expect(twins(0, reduced).every((t) => t === 0)).toBe(true);
    }
    // With reduced motion, still: the one gap, 30 cents of 50 putting it 9.6 px off.
    expect(new Set(twins(-30, true))).toEqual(new Set([-9.6]));
    expect(new Set(twins(30, true))).toEqual(new Set([9.6]));
  });

  it('the Filter fully closed freezes it still in an ice cube; opened, it melts, dripping', () => {
    const motion = createMascotMotion(seeded());
    const frozen = run(motion, 1, 2, { ...playing, closed: true }, wide);
    expect(frozen.at(-1)!.ice).toBe(1);
    const xs = frozen.slice(-20).map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(2); // a shiver, no stroll
    const melting = run(motion, 2, 4, playing, wide);
    expect(melting[10].ice).toBeGreaterThan(0);
    expect(melting.at(-1)!.ice).toBe(0);
    expect(melting.filter((p) => p.burst?.spread === 'drip').length).toBeGreaterThan(3);
  });

  it('the Noise heard gives it static, more the louder; none with reduced motion', () => {
    const motion = createMascotMotion(seeded());
    expect(motion.frame({ ...playing, noise: 0.8 }, 1, false, spot).fuzz).toBe(0.8);
    expect(motion.frame({ ...playing, noise: 0 }, 1.1, false, spot).fuzz).toBe(0);
    expect(createMascotMotion(seeded()).frame({ ...playing, noise: 0.8 }, 1, true, spot).fuzz).toBe(0);
  });

  it('a word cues its trick at once; the theme its own', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(playing, 0, false, spot);
    motion.word('dead', 1);
    expect(motion.frame(playing, 1.1, false, spot).doing).toBe('playDead');
    motion.word('baggage', 5);
    expect(motion.frame(playing, 5.1, false, wide).doing).toBe('suitcase');
    motion.theme('dark', 10);
    expect(motion.frame(playing, 10.1, false, spot)).toMatchObject({ doing: 'nightcap', hat: 'nightcap' });
    motion.theme('light', 15);
    expect(motion.frame(playing, 15.1, false, spot)).toMatchObject({ doing: 'shades', prop: 'visor' });
  });

  it('words and the theme that come during a funny turn each play after it, in order', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(playing, 0, false, spot);
    motion.word('dead', 1);
    motion.word('cafe', 1.2);
    motion.theme('dark', 1.4);
    const doing = run(motion, 1.1, 30, playing, spot).map((p) => p.doing).filter((d, i, all) => d && d !== all[i - 1]);
    expect(doing.slice(0, 3)).toEqual(['playDead', 'coffee', 'nightcap']);
  });

  it('with reduced motion, a word, the theme or the Slope cue only changes its pose, and tickles still work after', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(quiet, 0, true, spot);
    const before = motion.frame(quiet, 0.5, true, spot).eyes;
    motion.word('dead', 1);
    const after = motion.frame(quiet, 1.1, true, spot);
    expect(after.doing).toBeNull();
    expect(after.eyes).not.toBe(before);
    motion.gesture('perform', 5);
    expect(motion.frame(quiet, 5.1, true, spot).doing).toBeNull();
    motion.tickle(6);
    expect(motion.frame(quiet, 6.05, true, spot).eyes).toBe('happy');
    motion.gesture('taller', 7);
    const turned = motion.frame(quiet, 7.1, true, spot).eyes;
    motion.gesture('louder', 8);
    expect(motion.frame(quiet, 8.1, true, spot).eyes).not.toBe(turned);
  });

  it('after a coffee it strolls faster for a while', () => {
    const speeds = (coffee: boolean) => {
      const motion = createMascotMotion(seeded(7));
      motion.frame(playing, 0, false, wide);
      if (coffee) motion.word('cafe', 0.1);
      const poses = run(motion, 3.2, 12, playing, wide);
      return poses.reduce((sum, p, i) => sum + (i ? Math.abs(p.x - poses[i - 1].x) : 0), 0);
    };
    expect(speeds(true)).toBeGreaterThan(speeds(false) * 1.3);
  });

  it('its eyes follow a pointer near it, when nothing else has them', () => {
    const motion = createMascotMotion(() => 0.99);
    motion.frame(quiet, 0, false, spot);
    motion.pointer(60);
    expect(motion.frame(quiet, 0.5, false, spot).eyes).toBe('right');
    motion.pointer(-60);
    expect(motion.frame(quiet, 0.6, false, spot).eyes).toBe('left');
    motion.pointer(null);
    expect(motion.frame(quiet, 0.7, false, spot).eyes).toBe('open');
  });

  it('its costume for the date, under a nightcap a moment when the theme turns dark', () => {
    expect(hatOn(new Date(2026, 9, 31))).toBe('ghost');
    expect(hatOn(new Date(2026, 11, 24))).toBe('christmas');
    expect(hatOn(new Date(2026, 11, 26))).toBe('christmas');
    expect(hatOn(new Date(2026, 11, 27))).toBe('none');
    expect(hatOn(new Date(2027, 9, 24))).toBe('party');
    const motion = createMascotMotion(seeded());
    motion.dress('christmas');
    expect(motion.frame(quiet, 0, false, spot).hat).toBe('christmas');
    motion.theme('dark', 1);
    expect(motion.frame(quiet, 1.1, false, spot).hat).toBe('nightcap');
    expect(motion.frame(quiet, 6, false, spot).hat).toBe('christmas');
  });

  it('through a Demo part: the baton down on each Note; air guitar strummed on its tail; surfing end to end', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(playing, 0, false, wide);
    motion.act('conduct');
    expect(motion.frame({ ...playing, struck: 1 }, 1.05, false, wide).prop).toBe('batonDown');
    expect(motion.frame({ ...playing, struck: 1 }, 1.5, false, wide).prop).toBe('baton');
    motion.act('airGuitar');
    const strum = motion.frame({ ...playing, struck: 2 }, 2.02, false, wide);
    expect(strum.wag).toBeGreaterThan(50);
    expect(strum.eyes).toBe('shut');
    motion.act('surf');
    const ride = run(motion, 3, 12, playing, wide);
    expect(Math.min(...ride.map((p) => p.x))).toBe(0);
    expect(Math.max(...ride.map((p) => p.x))).toBe(200);
    expect(ride.every((p) => p.doing === null)).toBe(true);
  });

  it('a funny turn plays to its end: a control turned or a Note meanwhile neither stops nor moves it (the owner)', () => {
    const motion = createMascotMotion(seeded());
    motion.frame(quiet, 0, false, wide);
    motion.place(100);
    motion.word('deaf', 1); // its ears covered for 2.2 s, standing where it is
    const during: Pose[] = [];
    for (let t = 1.05; t < 3.1; t += 1 / 60) {
      if (Math.abs(t - 1.5) < 0.01) motion.gesture('brighter', t);
      during.push(motion.frame({ ...playing, struck: t > 2 ? 2 : null }, t, false, wide));
    }
    expect(during.every((p) => p.doing === 'earsCovered')).toBe(true);
    expect(during.every((p) => Math.abs(p.x - 100) < 2 && p.lift === 0)).toBe(true);
    // Over, the next control walks it again.
    motion.frame(playing, 3.4, false, wide);
    motion.gesture('brighter', 3.5);
    const after = run(motion, 3.5, 4.2, playing, wide);
    expect(after.at(-1)!.x).toBeGreaterThan(110);
  });

  it('fishing, once begun, goes on to the ♪ whatever comes: tickles, a click, a word, the Filter closed, a long quiet (the owner)', () => {
    // A deal that starts with fishing, cued just before it would doze off.
    let motion = createMascotMotion(seeded(1));
    for (let seed = 1; ; seed++) {
      motion = createMascotMotion(seeded(seed));
      motion.frame(quiet, 0, false, wide);
      motion.gesture('perform', 18);
      if (motion.frame(quiet, 18, false, wide).doing === 'fishing') break;
    }
    const poses: Pose[] = [];
    for (let t = 18 + 1 / 60; t < 18 + 5.6; t += 1 / 60) {
      if (Math.abs(t - 19) < 0.01) motion.tickle(t);
      if (Math.abs(t - 19.5) < 0.01) motion.poke(t);
      if (Math.abs(t - 20) < 0.01) motion.word('dead', t);
      poses.push(motion.frame({ ...quiet, closed: t > 21 }, t, false, wide));
    }
    expect(poses.every((p) => p.doing === 'fishing' && p.ice === 0)).toBe(true);
    expect(poses.some((p) => p.caught && p.hook === 0)).toBe(true); // it got its ♪
    // Then the word it heard, before the Filter freezes it.
    expect(motion.frame(quiet, 23.7, false, wide).doing).toBe('playDead');
  });
});


describe('the mascot pointing the way in a Tutorial or the Tour (issue 151)', () => {
  const music = (t: number): Heard => ({ amp: 0.6, sway: 0.9, struck: Math.floor(t * 2) / 2 });

  it('guided, no funny turn, stroll, dance or doze: it stays where it is, however long, with music or none', () => {
    const motion = createMascotMotion(seeded(3));
    motion.guide(true);
    const quietPoses = run(motion, 0, DOZE_SECONDS * 3, quiet);
    expect(quietPoses.every((p) => p.doing === null && p.x === quietPoses[0].x)).toBe(true);
    // Never dozing off: its eyes shut only for a blink.
    let shut = 0;
    let longest = 0;
    for (const p of quietPoses) {
      shut = p.eyes === 'shut' ? shut + 1 : 0;
      longest = Math.max(longest, shut);
    }
    expect(longest).toBeLessThan(15);
    const t0 = DOZE_SECONDS * 3;
    const poses: Pose[] = [];
    for (let t = t0; t < t0 + 10; t += 1 / 60) poses.push(motion.frame(music(t), t, false, wide));
    expect(poses.every((p) => p.x === quietPoses[0].x)).toBe(true);
  });

  it('guided, it still answers the knobs; let go, its life comes back', () => {
    const motion = createMascotMotion(seeded(5));
    motion.guide(true);
    run(motion, 0, 5, quiet);
    motion.gesture('taller', 5);
    const stretched = run(motion, 5, 5 + GESTURE_SECONDS, quiet);
    expect(Math.max(...stretched.map((p) => p.stretch))).toBeGreaterThan(1.1);
    motion.guide(false);
    const free = run(motion, 6, 60, quiet);
    expect(free.some((p) => p.doing !== null)).toBe(true);
    expect(new Set(free.map((p) => Math.round(p.x))).size).toBeGreaterThan(5);
  });

  it('pointing, it faces the control, looks at it and aims its tail at it; still with music, but for blinking', () => {
    const motion = createMascotMotion(seeded(7));
    motion.guide(true);
    motion.point({ way: -1, angle: 20 }, true);
    const poses: Pose[] = [];
    for (let t = 0; t < 10; t += 1 / 60) poses.push(motion.frame(music(t), t, false, spot));
    expect(poses.every((p) => p.turn === -1 && p.wag === 20 && p.lift === 0 && p.tilt === 0 && p.splash === 'none')).toBe(true);
    // Its eyes towards the tail, which it faces: as drawn, then turned round.
    expect(new Set(poses.map((p) => p.eyes))).toEqual(new Set(['right', 'shut']));
    // Looking from afar, the sound moves it as ever.
    motion.point({ way: 1, angle: -30 }, false);
    const afar: Pose[] = [];
    for (let t = 10; t < 12; t += 1 / 60) afar.push(motion.frame(music(t), t, false, spot));
    expect(afar.every((p) => p.turn === 1)).toBe(true);
    expect(afar.some((p) => p.lift > 0)).toBe(true);
  });

  it('a small bounce for a new Step, a happy hop for a Step done, the fountain for a Tutorial finished', () => {
    const motion = createMascotMotion(seeded(9));
    motion.guide(true);
    motion.point({ way: 1, angle: 0 }, true);
    run(motion, 0, 1, quiet, spot);
    motion.gesture('bounce', 1);
    const bounce = Math.max(...run(motion, 1, 1 + GESTURE_SECONDS, quiet, spot).map((p) => p.lift));
    motion.gesture('hop', 2);
    const hop = run(motion, 2, 2 + GESTURE_SECONDS, quiet, spot);
    expect(bounce).toBeGreaterThan(2);
    expect(Math.max(...hop.map((p) => p.lift))).toBeGreaterThan(bounce * 1.5);
    expect(hop.some((p) => p.eyes === 'happy')).toBe(true);
    motion.trick('fountain', 3);
    expect(run(motion, 3, 3.5, quiet, spot).every((p) => p.doing === 'fountain')).toBe(true);
  });

  it('with reduced motion, only its eyes and tail turn towards the control: no bounce, no hop', () => {
    const motion = createMascotMotion(seeded(11));
    motion.guide(true);
    motion.point({ way: -1, angle: 15 }, false);
    run(motion, 0, 1, quiet, spot, true);
    motion.gesture('bounce', 1);
    motion.gesture('hop', 1.2);
    const poses = run(motion, 1, 2, quiet, spot, true);
    expect(poses.every((p) => p.lift === 0 && p.turn === -1 && p.wag === 15 && p.eyes === 'right')).toBe(true);
  });
});

describe('facing its way, its tail trailing behind it (issue 179)', () => {
  /** Put down at `from`, it walks into a room whose near end is `to`. */
  const walk = (from: number, to: number, seconds = 1.6) => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(playing, 0, false, wide);
    motion.place(from);
    return run(motion, 1 / 60, seconds, playing, from < to ? { min: to, max: to + 50 } : { min: to - 50, max: to });
  };

  it('strolling right it turns round, its tail on its left, quickly; stopped, it faces as drawn again', () => {
    const poses = walk(0, 150);
    const going = poses.filter((p) => p.x > 30 && p.x < 140);
    expect(going.length).toBeGreaterThan(30);
    expect(going.every((p) => p.turn === -1)).toBe(true);
    // Its eyes on its way: turned round, its drawing's left.
    expect(going.every((p) => p.eyes === 'left')).toBe(true);
    // Its width going through zero, in under a fifth of a second, setting off and stopping.
    const setOff = poses.filter((p) => p.x <= 30 && p.turn !== -1);
    expect(setOff.some((p) => Math.abs(p.turn) < 0.5)).toBe(true);
    expect(setOff.length / 60).toBeLessThan(0.2);
    const stopped = poses.filter((p) => p.x === 150);
    expect(stopped.filter((p) => p.turn !== 1).length / 60).toBeLessThan(0.2);
    expect(stopped.at(-1)).toMatchObject({ turn: 1, eyes: 'open' });
  });

  it('a step shorter than its own width does not turn it, nor dance steps to the Notes, however far they take it', () => {
    expect(walk(0, 40).every((p) => p.turn === 1)).toBe(true);
    const motion = createMascotMotion(() => 0.5);
    const poses: Pose[] = [];
    // A Note every twentieth of a second: a step right on each, before the last one is done.
    for (let t = 0; t <= 2; t += 1 / 60) poses.push(motion.frame({ amp: 0.6, sway: 0, struck: Math.floor(t / 0.05) * 0.05 }, t, false, { min: 0, max: 1000 }));
    expect(poses.at(-1)!.x - poses[0].x).toBeGreaterThan(200);
    expect(poses.every((p) => p.turn === 1)).toBe(true);
  });

  it('a funny turn keeps its own turning: dragging its suitcase right, the suitcase behind it, it faces as drawn', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, wide);
    motion.trick('suitcase', 0.1);
    const poses = run(motion, 0.1, 3.6, quiet);
    expect(poses.at(-1)!.x - poses[0].x).toBeGreaterThan(50);
    expect(poses.every((p) => p.doing === 'suitcase' && p.turn === 1)).toBe(true);
  });

  it('leaping or falling between lines it faces its way, unless the leap is shorter than its width; hovering, as still', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, spot);
    const turnAfter = (from: number, across: number, hovers = false) => {
      motion.leaping(across, hovers);
      return run(motion, from, from + 0.3, quiet, spot).at(-1)!.turn;
    };
    expect(turnAfter(0, 200)).toBe(-1);
    expect(turnAfter(0.3, 0)).toBe(1); // landed
    expect(turnAfter(0.6, -200)).toBe(1);
    expect(turnAfter(0.9, 30)).toBe(1);
    // Hovering, strolling along its hover line, it faces as still.
    motion.leaping(0, true);
    motion.place(0);
    expect(run(motion, 1.2, 2.4, quiet, { min: 150, max: 200 }).every((p) => p.turn === 1)).toBe(true);
  });

  it('sent away strolling right, it turns back as it goes, not all at once', () => {
    const motion = createMascotMotion(() => 0.5);
    motion.frame(playing, 0, false, wide);
    motion.place(0);
    expect(run(motion, 1 / 60, 0.5, playing, { min: 150, max: 200 }).at(-1)!.turn).toBe(-1);
    motion.leave(0.5);
    const leaving = run(motion, 0.5 + 1 / 60, 0.8, playing, { min: 150, max: 200 });
    expect(leaving[0].turn).toBeLessThan(0);
    expect(leaving.at(-1)!.turn).toBe(1);
  });

  it('a funny turn begun while it is turned round: facing that way already, it stays; else it turns to it, not at once', () => {
    const turnedRound = () => {
      const motion = createMascotMotion(() => 0.5);
      motion.frame(playing, 0, false, wide);
      motion.place(0);
      expect(run(motion, 1 / 60, 0.5, playing, { min: 150, max: 200 }).at(-1)!.turn).toBe(-1);
      return motion;
    };
    // The water gun, fired to the right, is drawn on its left: turned round already, it stays turned round.
    const gun = turnedRound();
    gun.trick('waterGun', 0.5);
    const firing = run(gun, 0.5, 0.8, playing, { min: 150, max: 200 });
    expect(firing.every((p) => p.doing === 'waterGun' && p.turn === -1)).toBe(true);
    // Dragging the suitcase right, it faces as drawn: it turns there, its width through zero.
    const bag = turnedRound();
    bag.trick('suitcase', 0.5);
    const dragging = run(bag, 0.5, 0.8, playing, { min: 0, max: 400 });
    expect(dragging.some((p) => Math.abs(p.turn) < 0.5)).toBe(true);
    expect(dragging.filter((p) => p.turn !== 1).length / 60).toBeLessThan(0.2);
    expect(dragging.at(-1)!.turn).toBe(1);
  });

  it("setting off right from its line's left end, it turns once its trailing tail is clear of that end", () => {
    // Surfing end to end: first to the left end, then right from it.
    const motion = createMascotMotion(() => 0.5);
    motion.frame(playing, 0, false, wide);
    motion.act('surf');
    const right = run(motion, 1 / 60, 5).filter((p, i, all) => i > 0 && p.x > all[i - 1].x);
    // Turned round, its drawing reaches 26.4 px left of its box (it turns about a fifth of its 44 px).
    expect(right.filter((p) => p.x < 26.4).every((p) => p.turn === 1)).toBe(true);
    expect(right.filter((p) => p.x > 40 && p.x < 200).every((p) => p.turn === -1)).toBe(true); // till it stops
  });

  it('scooting with its tail trailing, it leans in less, so its tail tip stays near its line', () => {
    // Clicked again and again, it runs off right, scooting, turned round.
    const motion = createMascotMotion(() => 0.5);
    motion.frame(quiet, 0, false, wide);
    for (const t of [0.1, 0.2, 0.3, 0.4, 0.5]) motion.poke(t);
    const running = run(motion, 0.6, 2, quiet).filter((p, i, all) => i > 0 && p.x > all[i - 1].x && p.turn === -1);
    expect(running.length).toBeGreaterThan(10);
    // Its tail 35 px behind where it leans about: 3° lifts the tip under 2 px, where 8° would lift it 5.
    expect(Math.max(...running.map((p) => Math.abs(p.tilt)))).toBeGreaterThan(0);
    expect(Math.max(...running.map((p) => Math.abs(p.tilt)))).toBeLessThanOrEqual(3);
  });

  it('strolling left it faces as drawn, its tail on its right', () => {
    const poses = walk(200, 50);
    expect(poses.at(-1)!.x).toBe(50);
    expect(poses.every((p) => p.turn === 1)).toBe(true);
  });
});
