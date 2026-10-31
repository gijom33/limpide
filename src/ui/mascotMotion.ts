/** What the mascot hears each frame, from the Modulation model (issue 115). */
export interface Heard {
  /** The Amp Envelope's level, times the Volume (0–1). */
  amp: number;
  /** The LFOs it hears, −1 to 1: their values averaged over those with some Depth; 0 with none. */
  sway: number;
  /** When the newest Note started, in the engine's seconds; null before any. */
  struck: number | null;
}

/** A pose and where it stands: the drawing's parts, and its hop, lean and stretch. */
export interface Pose {
  arms: 'down' | 'up';
  legs: 'stand' | 'tuck' | 'walkA' | 'walkB';
  eyes: 'open' | 'shut' | 'left' | 'right' | 'happy';
  /** How high the hop has it, in pixels. */
  lift: number;
  /** Its lean, in degrees: positive to the right. */
  tilt: number;
  /** Its height over its resting height; its width shrinks as much. */
  stretch: number;
}

/** A hop's length, in seconds, and its height, in pixels. */
export const HOP_SECONDS = 0.18;
const HOP_PX = 6;
/** Silent this long, it dozes off. */
export const DOZE_SECONDS = 2;
/** The Amp level it can no longer hear (−54 dB, as the Pitch Marker's). */
const SILENT = 0.002;
/** Loud enough to throw its arms up. */
const LOUD = 0.85;
/** Its lean at an LFO's full swing, in degrees, and how far it must lean to look that way. */
const LEAN = 7;
const LOOK = 0.6;
/** Its stretch at full level. */
const STRETCH = 0.1;
/** A step's length while it walks, in seconds. */
const STEP_SECONDS = 0.15;

/** The poses it takes in turn on each Note with reduced motion asked for. */
const STILL_POSES: Pose['eyes'][] = ['left', 'open', 'right', 'happy'];

const resting: Pose = { arms: 'down', legs: 'stand', eyes: 'open', lift: 0, tilt: 0, stretch: 1 };

/**
 * The mascot's moves (issue 115): a hop on each Note's start, a lean with the LFOs, a stretch with the Amp's level,
 * arms up when loud; still when nothing sounds, dozing after `DOZE_SECONDS`. With reduced motion it never moves and
 * changes pose only on each Note. `walking` (−1 left, 1 right) has it stepping to another section instead.
 */
export function createMascotMotion() {
  let heardNote: number | null = null; // the start of the Note it last heard
  let quietSince: number | null = null;
  let still: Pose = resting;
  let stillCount = 0;
  return {
    frame(heard: Heard, now: number, reduced: boolean, walking: -1 | 0 | 1 = 0): Pose {
      const struck = heard.struck !== null && heard.struck !== heardNote;
      heardNote = heard.struck;
      const silent = heard.amp < SILENT;
      if (!silent) quietSince = null;
      else quietSince ??= now;
      const dozing = quietSince !== null && now - quietSince >= DOZE_SECONDS;
      if (walking) {
        const legs = Math.floor(now / STEP_SECONDS + 1e-9) % 2 ? 'walkB' : 'walkA';
        return { ...resting, legs: reduced ? 'stand' : legs, eyes: walking > 0 ? 'right' : 'left' };
      }
      if (reduced) {
        if (struck) still = { ...resting, eyes: STILL_POSES[stillCount++ % STILL_POSES.length] };
        return dozing ? { ...still, eyes: 'shut' } : still;
      }
      if (silent) return { ...resting, eyes: dozing ? 'shut' : 'open' };
      const since = heard.struck === null ? Infinity : now - heard.struck;
      const lift = since < HOP_SECONDS ? Math.sin((since / HOP_SECONDS) * Math.PI) * HOP_PX : 0;
      const hopping = lift > 0;
      const loud = heard.amp > LOUD;
      const look = heard.sway > LOOK ? 'right' : heard.sway < -LOOK ? 'left' : 'open';
      return {
        arms: hopping || loud ? 'up' : 'down',
        legs: hopping ? 'tuck' : 'stand',
        eyes: hopping || loud ? 'happy' : look,
        lift,
        tilt: heard.sway * LEAN,
        stretch: 1 + STRETCH * Math.min(1, heard.amp),
      };
    },
  };
}
