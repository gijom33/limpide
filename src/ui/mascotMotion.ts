import type { Gesture } from './mascotGestures';

/** What the mascot hears each frame, from the Modulation model (issue 115). */
export interface Heard {
  /** The Amp Envelope's level, times the Volume (0–1). */
  amp: number;
  /** The LFOs it hears, −1 to 1: their values averaged over those with some Depth; 0 with none. */
  sway: number;
  /** When the newest Note started, in the engine's seconds; null before any. */
  struck: number | null;
}

/** Where along its line it may stand: its box's left, in the window's pixels. */
export interface Room {
  min: number;
  max: number;
}

/** A pose and where it stands: the drawing's parts, and its place, hop, lean, stretch and fade. */
export interface Pose {
  /** A drop, or melting: a puddle, then a film. */
  form: 'drop' | 'puddle' | 'film';
  /** Droplets thrown up over its head, or out to its sides. */
  splash: 'none' | 'up' | 'wide';
  legs: 'stand' | 'tuck' | 'walkA' | 'walkB';
  /** `melted`: shut, low on a puddle; `none`: a film has none. */
  eyes: 'open' | 'shut' | 'left' | 'right' | 'happy' | 'melted' | 'none';
  /** Its place along the line, in the window's pixels. */
  x: number;
  /** How high it is off its line, in pixels. */
  lift: number;
  /** Its lean, in degrees: positive to the right. */
  tilt: number;
  /** Its height over its resting height; its width shrinks as much. */
  stretch: number;
  /** Its width's sign and size as it turns round: 1 facing as drawn, −1 the other way. */
  turn: number;
  /** Its tail's wag, in degrees about where it leaves the drop. */
  wag: number;
  /** Its opacity, 1 until a film fades. */
  fade: number;
  /** Melted away: it can go. */
  gone: boolean;
}

/** A hop on a Note: its length, in seconds, and its height, in pixels. */
export const HOP_SECONDS = 0.18;
const HOP_PX = 6;
/** With nothing heard and nothing turned this long, it dozes off; dozing, it wakes now and then for a while. */
export const DOZE_SECONDS = 20;
/** A control turned, or the sound, keeps its tricks away this long: it is listening. */
const LISTENING_SECONDS = 3;
/** The Amp level it can no longer hear (−54 dB, as the Pitch Marker's). */
const SILENT = 0.002;
/** Loud enough to splash. */
const LOUD = 0.85;
/** Its lean at an LFO's full swing, in degrees, and how far it must lean to look that way. */
const LEAN = 7;
const LOOK = 0.6;
/** Its stretch at full level. */
const STRETCH = 0.1;
/** Nudged by a knob, in pixels a second; a step's length, in seconds. */
const NUDGE_SPEED = 120;
const STEP_SECONDS = 0.16;
/** How far a Cutoff turn walks it, and how far Glide slides it at most, in pixels. */
export const NUDGE_PX = 24;
const SLIDE_PX = 40;
/** A gesture's length; the same one again within it carries on rather than starting over. */
export const GESTURE_SECONDS = 0.45;
/** A blink's length. */
const BLINK_SECONDS = 0.13;
/** Leaving: the jump, the landing's splash, the puddle, then the film fading. */
const JUMP_SECONDS = 0.35;
const LEAP_PX = 14;
const LAND_SECONDS = 0.15;
const PUDDLE_SECONDS = 0.3;
const FILM_SECONDS = 0.4;
export const LEAVE_SECONDS = JUMP_SECONDS + LAND_SECONDS + PUDDLE_SECONDS + FILM_SECONDS;

/** Its funny turns when nothing is played, and how long each lasts. */
export const TRICKS = { shake: 0.9, bounce: 1, spin: 0.7, jiggle: 1, wag: 1.2, peek: 1.4, yawn: 1.6 } as const;
export type Trick = keyof typeof TRICKS;
/** How it strolls: a walk, a hop along, or a scoot; and their speeds, in pixels a second. */
type Gait = 'walk' | 'hop' | 'scoot';

/** The eyes it shows in turn on each Note or gesture with reduced motion asked for. */
const STILL_EYES: Pose['eyes'][] = ['left', 'open', 'right', 'happy'];

const resting: Omit<Pose, 'x'> = {
  form: 'drop',
  splash: 'none',
  legs: 'stand',
  eyes: 'open',
  lift: 0,
  tilt: 0,
  stretch: 1,
  turn: 1,
  wag: 0,
  fade: 1,
  gone: false,
};

/**
 * The mascot's moves (issue 115). It has a life of its own along its room: it strolls to spots at random (walking,
 * hopping along or scooting), glances about, blinks, and when nothing is played does a funny turn now and then (shakes
 * itself like a wet dog, turns round, bounces, jiggles, wags its tail, peeks, yawns); with nothing heard or turned for
 * `DOZE_SECONDS` it dozes, waking now and then. The sound moves it: a hop on each Note's start, a lean with the LFOs, a
 * stretch with the Amp's level, a splash when loud. So do the controls (`gesture`): a Cutoff turn walks it that way, an
 * Envelope fader stretches it, Resonance shivers it (see `gesturesOf`). Sent away (`leave`), it jumps, lands with a
 * splash and melts away. With reduced motion it never moves, changes pose only on a Note or a gesture, and goes at
 * once. `random` (0 to 1) is for the tests.
 */
export function createMascotMotion(random: () => number = Math.random) {
  let x: number | null = null;
  let target: number | null = null;
  let speed = NUDGE_SPEED;
  let gait: Gait | 'slide' = 'walk';
  let last: number | null = null;
  let nextIdea = 0;
  let nextBlink = 0;
  let blinkUntil = -Infinity;
  let busySince = 0; // the last time it heard something or a control was turned
  let wakeUntil = -Infinity; // dozing, it wakes now and then until this
  let nextWake = Infinity;
  let trick: { name: Trick; at: number; side: -1 | 1 } | null = null;
  let leftAt: number | null = null;
  const started = new Map<Gesture, { at: number; side: -1 | 1 }>();
  // Reduced motion: the pose holds until a Note or a gesture.
  let heardNote: number | null = null;
  let gestureCount = 0;
  let seenGestures = 0;
  let still: Omit<Pose, 'x'> = resting;
  let stillCount = 0;
  const between = (a: number, b: number) => a + random() * (b - a);
  const side = (): -1 | 1 => (random() < 0.5 ? -1 : 1);

  const startGesture = (gesture: Gesture, now: number) => {
    const before = started.get(gesture);
    if (before && now - before.at < GESTURE_SECONDS) return;
    started.set(gesture, { at: now, side: side() });
    gestureCount++;
    if (gesture !== 'look') {
      busySince = now;
      trick = null;
    }
    if (gesture === 'brighter' || gesture === 'darker') {
      target = (target ?? x ?? 0) + (gesture === 'brighter' ? NUDGE_PX : -NUDGE_PX);
      speed = NUDGE_SPEED;
      gait = 'walk';
    } else if (gesture === 'slide') {
      target = (x ?? 0) + (random() * 2 - 1) * SLIDE_PX;
      speed = NUDGE_SPEED;
      gait = 'slide';
    }
  };

  return {
    /** A control turned: its gesture starts now (in the engine's seconds). */
    gesture(gesture: Gesture, now: number) {
      if (leftAt === null) startGesture(gesture, now);
    },
    /** Sent away: it jumps, splashes and melts from now. */
    leave(now: number) {
      leftAt ??= now;
    },
    /** Put down at `at` (after a fall or a flight to another line): it carries on from there. */
    place(at: number) {
      x = at;
      target = null;
    },
    frame(heard: Heard, now: number, reduced: boolean, room: Room): Pose {
      const clamp = (v: number) => Math.min(room.max, Math.max(room.min, v));
      const first = last === null;
      const dt = first ? 0 : Math.min(0.1, now - last!);
      last = now;
      if (first) {
        x ??= room.min + random() * (room.max - room.min);
        busySince = now;
        nextIdea = now + between(0.8, 2.5);
        nextBlink = now + between(2, 6);
      }
      x = x!;
      // A new room: it walks into it, rather than jumping.
      if (x !== clamp(x) && target === null) {
        target = clamp(x);
        speed = NUDGE_SPEED;
        gait = 'walk';
      }
      const struck = heard.struck !== null && heard.struck !== heardNote;
      heardNote = heard.struck;
      const silent = heard.amp < SILENT;
      if (!silent) busySince = now;
      const idle = now - busySince >= LISTENING_SECONDS;
      let dozing = now - busySince >= DOZE_SECONDS && now >= wakeUntil;
      if (dozing && nextWake === Infinity) {
        // Dropping off: where it is, as it is.
        nextWake = now + between(8, 15);
        target = null;
        trick = null;
      }
      if (!dozing) nextWake = Infinity;
      else if (now >= nextWake) {
        // Awake for a while: a yawn, then its life again, until it dozes off once more.
        wakeUntil = now + between(6, 12);
        nextWake = Infinity;
        dozing = false;
        trick = { name: 'yawn', at: now, side: side() };
        nextIdea = now + TRICKS.yawn + between(0.5, 1.5);
      }

      if (leftAt !== null) {
        let t = now - leftAt;
        if (reduced || t >= LEAVE_SECONDS) return { ...resting, x, form: 'film', eyes: 'none', fade: 0, gone: true };
        if (t < JUMP_SECONDS) return { ...resting, x, legs: 'tuck', eyes: 'happy', splash: 'up', lift: Math.sin((t / JUMP_SECONDS) * Math.PI) * LEAP_PX };
        t -= JUMP_SECONDS;
        if (t < LAND_SECONDS) return { ...resting, x, eyes: 'shut', splash: 'wide', stretch: 0.75 };
        t -= LAND_SECONDS;
        if (t < PUDDLE_SECONDS) return { ...resting, x, form: 'puddle', eyes: 'melted', splash: 'wide' };
        t -= PUDDLE_SECONDS;
        return { ...resting, x, form: 'film', eyes: 'none', fade: 1 - t / FILM_SECONDS };
      }

      if (reduced) {
        target = null;
        if (struck || gestureCount !== seenGestures) still = { ...resting, eyes: STILL_EYES[stillCount++ % STILL_EYES.length] };
        seenGestures = gestureCount;
        return { ...(dozing ? { ...still, eyes: 'shut' } : still), x };
      }

      if (trick && now - trick.at >= TRICKS[trick.name]) trick = null;
      // What next, when it is free: a stroll, a glance, or (with nothing played) a funny turn.
      if (target === null && trick === null && !dozing && now >= nextIdea) {
        const roll = random();
        if (idle && roll < 0.35) {
          const names = Object.keys(TRICKS) as Trick[];
          trick = { name: names[Math.floor(random() * names.length)], at: now, side: side() };
          nextIdea = now + TRICKS[trick.name] + between(0.8, 2.5);
        } else if (roll < (idle ? 0.45 : 0.25)) {
          startGesture('look', now);
          nextIdea = now + between(1, 3);
        } else {
          target = room.min + random() * (room.max - room.min);
          const style = random();
          gait = style < 0.6 ? 'walk' : style < 0.85 ? 'hop' : 'scoot';
          speed = gait === 'walk' ? between(28, 55) : gait === 'hop' ? 50 : 115;
          nextIdea = Infinity;
        }
      }
      let walking: -1 | 0 | 1 = 0;
      if (target !== null) {
        target = clamp(target);
        const away = target - x;
        if (Math.abs(away) <= speed * dt) {
          x = target;
          target = null;
          nextIdea = now + between(1, 3.5);
        } else {
          walking = away > 0 ? 1 : -1;
          x += walking * speed * dt;
        }
      }
      if (now >= nextBlink) {
        blinkUntil = now + BLINK_SECONDS;
        nextBlink = now + between(2, 6);
      }

      const pose: Pose = { ...resting, x, eyes: dozing ? 'shut' : 'open' };
      if (dozing) pose.stretch = 1 + 0.03 * Math.sin(now * 2 * Math.PI * 0.3); // breathing
      if (!silent) {
        const since = heard.struck === null ? Infinity : now - heard.struck;
        pose.lift = since < HOP_SECONDS ? Math.sin((since / HOP_SECONDS) * Math.PI) * HOP_PX : 0;
        const happy = pose.lift > 0 || heard.amp > LOUD;
        pose.splash = happy ? 'up' : 'none';
        pose.legs = pose.lift > 0 ? 'tuck' : 'stand';
        pose.eyes = happy ? 'happy' : heard.sway > LOOK ? 'right' : heard.sway < -LOOK ? 'left' : 'open';
        pose.tilt = heard.sway * LEAN;
        pose.stretch = 1 + STRETCH * Math.min(1, heard.amp);
      }
      if (walking) {
        if (gait === 'hop') {
          // Hopping along: three hops a second.
          const hop = Math.abs(Math.sin(now * Math.PI * 3)) * 5;
          pose.lift += hop;
          pose.legs = hop > 1 ? 'tuck' : 'stand';
        } else if (gait !== 'slide' && pose.legs === 'stand') {
          const steps = gait === 'scoot' ? STEP_SECONDS / 2 : STEP_SECONDS;
          const second = Math.floor(now / steps) % 2 === 1;
          pose.legs = second ? 'walkB' : 'walkA';
          pose.lift += second ? 1 : 0; // a bob on every other step
          if (gait === 'scoot') pose.tilt += walking * 8; // leaning into it
        }
        if (pose.eyes !== 'happy') pose.eyes = walking > 0 ? 'right' : 'left';
      }

      if (trick) {
        const p = (now - trick.at) / TRICKS[trick.name];
        const arc = Math.sin(p * Math.PI);
        if (trick.name === 'shake') {
          // Like a wet dog: a shiver, droplets flying, eyes screwed shut.
          pose.x += Math.sin(now * 2 * Math.PI * 18) * 2 * (1 - p);
          pose.tilt += Math.sin(now * 2 * Math.PI * 9) * 6 * (1 - p);
          pose.wag = Math.sin(now * 2 * Math.PI * 9) * 25 * (1 - p);
          pose.eyes = 'shut';
          if (p > 0.25 && p < 0.7) pose.splash = 'wide';
        } else if (trick.name === 'bounce') {
          const hop = Math.abs(Math.sin(p * Math.PI * 3)) * 8 * (1 - 0.5 * p);
          pose.lift += hop;
          pose.legs = hop > 1 ? 'tuck' : 'stand';
          pose.eyes = 'happy';
        } else if (trick.name === 'spin') {
          pose.turn = Math.cos(p * 2 * Math.PI);
          pose.eyes = 'happy';
        } else if (trick.name === 'jiggle') {
          pose.stretch *= 1 + 0.18 * Math.sin(p * 10 * Math.PI) * (1 - p);
        } else if (trick.name === 'wag') {
          pose.wag = Math.sin(p * 8 * Math.PI) * 30 * (1 - 0.3 * p);
          pose.eyes = 'happy';
        } else if (trick.name === 'peek') {
          pose.tilt += trick.side * 18 * arc;
          pose.eyes = trick.side > 0 ? 'right' : 'left';
        } else if (trick.name === 'yawn') {
          pose.stretch *= 1 + 0.2 * arc;
          pose.eyes = 'shut';
        }
      }

      for (const [gesture, { at, side }] of started) {
        const p = (now - at) / GESTURE_SECONDS;
        if (p >= 1) {
          started.delete(gesture);
          continue;
        }
        const arc = Math.sin(p * Math.PI);
        if (gesture === 'higher' || gesture === 'new') {
          pose.lift += arc * (gesture === 'new' ? 8 : 10);
          pose.legs = 'tuck';
          pose.eyes = 'happy';
          if (gesture === 'new') pose.splash = 'up';
        } else if (gesture === 'lower') pose.stretch *= 1 - 0.22 * arc;
        else if (gesture === 'taller') pose.stretch *= 1 + 0.15 * arc;
        else if (gesture === 'shorter') pose.stretch *= 1 - 0.15 * arc;
        else if (gesture === 'rougher') pose.x += Math.sin(now * 2 * Math.PI * 22) * 1.5 * (1 - p);
        else if (gesture === 'louder') {
          pose.splash = 'up';
          pose.eyes = 'happy';
        } else if (gesture === 'quieter') pose.eyes = 'shut';
        else if (gesture === 'twirl') pose.tilt += Math.sin(p * 4 * Math.PI) * 12 * (1 - p);
        else if (gesture === 'look' && pose.eyes !== 'happy') pose.eyes = side > 0 ? 'right' : 'left';
      }
      if (now < blinkUntil && (pose.eyes === 'open' || pose.eyes === 'left' || pose.eyes === 'right')) pose.eyes = 'shut';
      return pose;
    },
  };
}
