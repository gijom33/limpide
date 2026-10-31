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

/** Where along the Amp's top edge it may stand: its box's left, in pixels from the Amp's left. */
export interface Room {
  min: number;
  max: number;
}

/** A pose and where it stands: the drawing's parts, and its place, hop, lean, stretch and fade. */
export interface Pose {
  /** A drop, or melting: a puddle, then a film. */
  form: 'drop' | 'puddle' | 'film';
  /** Droplets thrown up over its head, or out to its sides as it lands. */
  splash: 'none' | 'up' | 'wide';
  legs: 'stand' | 'tuck' | 'walkA' | 'walkB';
  /** `melted`: shut, low on a puddle; `none`: a film has none. */
  eyes: 'open' | 'shut' | 'left' | 'right' | 'happy' | 'melted' | 'none';
  /** Its place along the edge, in the room's pixels. */
  x: number;
  /** How high it is off the edge, in pixels. */
  lift: number;
  /** Its lean, in degrees: positive to the right. */
  tilt: number;
  /** Its height over its resting height; its width shrinks as much. */
  stretch: number;
  /** Its opacity, 1 until a film fades. */
  fade: number;
  /** Melted away: it can go. */
  gone: boolean;
}

/** A hop on a Note: its length, in seconds, and its height, in pixels. */
export const HOP_SECONDS = 0.18;
const HOP_PX = 6;
/** Silent this long, and with nothing turned, it dozes off. */
export const DOZE_SECONDS = 2;
/** A control turned keeps it awake this long. */
const WAKE_SECONDS = 4;
/** The Amp level it can no longer hear (−54 dB, as the Pitch Marker's). */
const SILENT = 0.002;
/** Loud enough to splash. */
const LOUD = 0.85;
/** Its lean at an LFO's full swing, in degrees, and how far it must lean to look that way. */
const LEAN = 7;
const LOOK = 0.6;
/** Its stretch at full level. */
const STRETCH = 0.1;
/** Strolling and nudged by a knob, in pixels a second; a step's length, in seconds. */
const STROLL_SPEED = 36;
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

/** The eyes it shows in turn on each Note or gesture with reduced motion asked for. */
const STILL_EYES: Pose['eyes'][] = ['left', 'open', 'right', 'happy'];

const resting: Omit<Pose, 'x'> = { form: 'drop', splash: 'none', legs: 'stand', eyes: 'open', lift: 0, tilt: 0, stretch: 1, fade: 1, gone: false };

/**
 * The mascot's moves (issue 115). It strolls along its room at random, pausing, blinking and glancing about, and dozes
 * when nothing sounds and nothing is turned. The sound moves it: a hop on each Note's start, a lean with the LFOs, a
 * stretch with the Amp's level, a splash when loud. So do the controls (`gesture`): a Cutoff turn walks it that way, an
 * Envelope fader stretches it, Resonance shivers it (see `gesturesOf`). Sent away (`leave`), it jumps, lands with a
 * splash and melts away. With reduced motion it never moves, changes pose only on a Note or a gesture, and goes at
 * once. `random` (0 to 1) is for the tests.
 */
export function createMascotMotion(random: () => number = Math.random) {
  let x: number | null = null;
  let target: number | null = null;
  let speed = STROLL_SPEED;
  let sliding = false;
  let last: number | null = null;
  let nextStroll = 0;
  let nextBlink = 0;
  let blinkUntil = -Infinity;
  let quietSince: number | null = null;
  let awakeUntil = -Infinity;
  let leftAt: number | null = null;
  const started = new Map<Gesture, { at: number; side: -1 | 1 }>();
  // Reduced motion: the pose holds until a Note or a gesture.
  let heardNote: number | null = null;
  let gestureCount = 0;
  let seenGestures = 0;
  let still: Omit<Pose, 'x'> = resting;
  let stillCount = 0;

  const startGesture = (gesture: Gesture, now: number) => {
    const before = started.get(gesture);
    if (before && now - before.at < GESTURE_SECONDS) return;
    started.set(gesture, { at: now, side: random() < 0.5 ? -1 : 1 });
    gestureCount++;
    awakeUntil = now + WAKE_SECONDS;
    if (gesture === 'brighter' || gesture === 'darker') {
      target = (target ?? x ?? 0) + (gesture === 'brighter' ? NUDGE_PX : -NUDGE_PX);
      speed = NUDGE_SPEED;
      sliding = false;
    } else if (gesture === 'slide') {
      target = (x ?? 0) + (random() * 2 - 1) * SLIDE_PX;
      speed = NUDGE_SPEED;
      sliding = true;
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
    frame(heard: Heard, now: number, reduced: boolean, room: Room): Pose {
      const clamp = (v: number) => Math.min(room.max, Math.max(room.min, v));
      const first = last === null;
      const dt = first ? 0 : Math.min(0.1, now - last!);
      last = now;
      if (first) {
        x = room.min + random() * (room.max - room.min);
        nextStroll = now + 1.5 + random() * 3;
        nextBlink = now + 2 + random() * 4;
      }
      x = clamp(x!);
      const struck = heard.struck !== null && heard.struck !== heardNote;
      heardNote = heard.struck;
      const silent = heard.amp < SILENT;
      if (!silent) quietSince = null;
      else quietSince ??= now;
      const dozing = quietSince !== null && now - quietSince >= DOZE_SECONDS && now >= awakeUntil;

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

      // A stroll now and then to a spot at random, or a glance about instead; never while dozing.
      if (target === null && !dozing && now >= nextStroll) {
        if (random() < 0.3) {
          startGesture('look', now);
          nextStroll = now + 1 + random() * 3;
        } else {
          target = room.min + random() * (room.max - room.min);
          speed = STROLL_SPEED;
          sliding = false;
        }
      }
      let walking: -1 | 0 | 1 = 0;
      if (target !== null) {
        target = clamp(target);
        const away = target - x;
        if (Math.abs(away) <= speed * dt) {
          x = target;
          target = null;
          sliding = false;
          nextStroll = now + 2 + random() * 4.5;
        } else {
          walking = away > 0 ? 1 : -1;
          x += walking * speed * dt;
        }
      }
      if (now >= nextBlink) {
        blinkUntil = now + BLINK_SECONDS;
        nextBlink = now + 2 + random() * 4;
      }

      const pose: Pose = { ...resting, x, eyes: dozing ? 'shut' : 'open' };
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
      if (walking && pose.legs === 'stand' && !sliding) {
        const second = Math.floor(now / STEP_SECONDS) % 2 === 1;
        pose.legs = second ? 'walkB' : 'walkA';
        pose.lift += second ? 1 : 0; // a bob on every other step
      }
      if (walking && pose.eyes !== 'happy') pose.eyes = walking > 0 ? 'right' : 'left';

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
