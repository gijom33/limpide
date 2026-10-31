import type { Word } from '../input/callingPhrase';
import type { Waveform } from '../music/harmonics';
import type { Gesture } from './mascotGestures';
import type { Fling } from './mascotSpray';
import { JOKES, PICKED_TRICKS, TRICK_MOVES, type Trick } from './mascotTricks';

/** What the mascot hears each frame, from the Modulation model (issue 115). */
export interface Heard {
  /** The Amp Envelope's level, times the Volume (0–1). */
  amp: number;
  /** The LFOs it hears, −1 to 1: their values averaged over those with some Depth; 0 with none. */
  sway: number;
  /** When the newest Note started, in the engine's seconds; null before any. */
  struck: number | null;
  /** What some controls make of it (issue 127): Osc 2's Detune against Osc 1, in cents, 0 unless both are heard. */
  detune?: number;
  /** The Filter fully closed. */
  closed?: boolean;
  /** The Noise's level, 0 to 1, while it is heard. */
  noise?: number;
}

/** What it does through a Demo part (issue 127): conducting, air guitar on its tail, or surfing an LFO's shape. */
export type Act = 'conduct' | 'airGuitar' | 'surf';
/** What it wears: a costume for the date, or a nightcap for the dark theme. */
export type Hat = 'none' | 'ghost' | 'christmas' | 'party' | 'nightcap';

/** Where along its line it may stand: its box's left, in the window's pixels. */
export interface Room {
  min: number;
  max: number;
}

/** A pose and where it stands: the drawing's parts, and its place, hop, lean, stretch and fade. */
export interface Pose {
  /** A drop; or smashed down: squashed, a puddle, spreading, then a film. */
  form: 'drop' | 'squashed' | 'puddle' | 'spread' | 'film';
  /** Droplets thrown up over its head, or out to its sides. */
  splash: 'none' | 'up' | 'wide';
  legs: 'stand' | 'tuck' | 'walkA' | 'walkB';
  /** `melted`: shut, low on a puddle; `none`: a film has none; `dead`: crosses; `peek`: one cross, one open. */
  eyes: 'open' | 'shut' | 'left' | 'right' | 'happy' | 'wide' | 'dead' | 'peek' | 'melted' | 'none';
  /** Its tail: the logo, a Waveform for a moment, or straight, stiff with Resonance. */
  tail: 'logo' | Waveform | 'straight';
  hat: Hat;
  /** How frozen it is in an ice cube, 0 to 1. */
  ice: number;
  /** Its static with the Noise, 0 to 1. */
  fuzz: number;
  /** Its twin's way off to its left, in pixels, Detune splitting it; 0, one drop. */
  twin: number;
  /** Its size, shrinking as it evaporates. */
  size: number;
  /** Fishing, how far down its hook is, 0 at the rod's tip to 1 past the window's bottom; null, no line. */
  hook: number | null;
  /** The ♪ it caught, on its hook. */
  caught: boolean;
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
  /** Droplets to fling this frame (see `Fling`). */
  burst: { count: number; spread: Fling; aim?: number } | null;
  /** The funny turn it is doing, if any. */
  doing: Trick | null;
  /**
   * Something it has for a trick: an umbrella over its head (folded, open), a glass of water, a water gun; a coffee
   * cup, hands over its ears, a suitcase, a baton (up, down), a hand shading its eyes, the sun, a cloud, a soap bubble
   * (small, round it), a fishing rod (straight, bent by a bite).
   */
  prop:
    | 'none' | 'umbrellaShut' | 'umbrella' | 'glassFull' | 'glassHalf' | 'glassLow' | 'glassEmpty' | 'gun'
    | 'cup' | 'hands' | 'suitcase' | 'baton' | 'batonDown' | 'visor' | 'sun' | 'cloud' | 'bubbleSmall' | 'bubble'
    | 'rod' | 'rodBite';
  /** How far the glass has come up beside its mouth and turned over, drinking (0 to 1). */
  sip: number;
  /** The frame it has had enough of being tickled or clicked, and runs off. */
  escaped: boolean;
  /** Melted away: it can go. */
  gone: boolean;
}

/**
 * What it wears on the visitor's date (issue 127): a ghost sheet on 31 October, a Christmas hat from 24 to 26
 * December, a party hat on 24 October, the day Limpide went on GitHub.
 */
export function hatOn(date: Date): Hat {
  const [month, day] = [date.getMonth() + 1, date.getDate()];
  if (month === 10 && day === 31) return 'ghost';
  if (month === 12 && day >= 24 && day <= 26) return 'christmas';
  if (month === 10 && day === 24) return 'party';
  return 'none';
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
/**
 * Leaving, smashing itself down: a crouch, a leap, a slam back down stretched long, then, at the smash, a burst of
 * droplets, squashed flat, a puddle, the puddle spreading, and a film fading.
 */
const LEAVING = { crouch: 0.12, leap: 0.3, slam: 0.14, squashed: 0.06, puddle: 0.1, spread: 0.3, film: 0.3 } as const;
export const LEAVE_SECONDS = Object.values(LEAVING).reduce((a, b) => a + b, 0);
const LEAP_PX = 22;
/** Droplets in the smash's burst. */
const SMASH_DROPLETS = 14;
/** Dancing to the music: each Note a step this long, in pixels, at this speed. */
const DANCE_STEP: readonly [number, number] = [8, 18];
const DANCE_SPEED = 170;

/** A tickle lasts this long after the pointer last moved on it. */
const TICKLE_SECONDS = 0.35;
/** Fed up past this (seconds of tickling, a click counting `POKE`, forgotten at `FORGIVE` a second), it runs off. */
const FED_UP = 2.5;
const POKE = 0.6;
const FORGIVE = 0.25;
/** Having run off, it will not be tickled for this long. */
const AWAY_SECONDS = 4;

/** Frightened at an end of its room, it scoots back this far. */
const BACK_OFF_PX = 26;
const lasting = (trick: Trick) => TRICK_MOVES[trick].seconds;
/** How it strolls: a walk, a hop along, or a scoot; and their speeds, in pixels a second. */
type Gait = 'walk' | 'hop' | 'scoot' | 'dance' | 'trick';

/** A Waveform changed, its tail takes that wave this long (issue 127). */
export const WAVE_SECONDS = 3;
/** Resonance turned past this screams a moment, as long as a Waveform's tail: eyes wide, tail straight. */
export const SCREAMING = 0.75;
/** Detune at its most (50 cents) puts its twin this far off, in pixels, wobbling at most this fast (Hz), as they beat. */
const TWIN_PX = 16;
const TWIN_BEAT = 3;
/** How long it takes to freeze into an ice cube, and to melt out of one. */
const FREEZE_SECONDS = 0.4;
const MELT_SECONDS = 1.2;
/** After a coffee, it strolls this much faster, and sooner, for this long. */
const CAFFEINE = 1.8;
const CAFFEINE_SECONDS = 12;
/** The trick each word cues (issue 127); and surfing an LFO's shape, its speed along it, in pixels a second. */
const WORD_TRICKS: Record<Word, Trick> = { dead: 'playDead', fade: 'ghost', cafe: 'coffee', deaf: 'earsCovered', baggage: 'suitcase' };
const SURF_SPEED = 70;

/** The eyes it shows in turn on each Note or gesture with reduced motion asked for. */
const STILL_EYES: Pose['eyes'][] = ['left', 'open', 'right', 'happy'];

const resting: Omit<Pose, 'x'> = {
  form: 'drop',
  splash: 'none',
  legs: 'stand',
  eyes: 'open',
  tail: 'logo',
  hat: 'none',
  ice: 0,
  fuzz: 0,
  twin: 0,
  size: 1,
  hook: null,
  caught: false,
  lift: 0,
  tilt: 0,
  stretch: 1,
  turn: 1,
  wag: 0,
  fade: 1,
  burst: null,
  doing: null,
  prop: 'none',
  sip: 0,
  escaped: false,
  gone: false,
};

/**
 * The mascot's moves (issue 115). It has a life of its own along its room: it strolls to spots at random (walking,
 * hopping along or scooting), glances about, blinks, and when nothing is played does a funny turn now and then (shakes
 * itself like a wet dog, turns round, bounces, jiggles, wags its tail, peeks, yawns); with nothing heard or turned for
 * `DOZE_SECONDS` it dozes, waking now and then. The sound moves it: a hop on each Note's start, a lean with the LFOs, a
 * stretch with the Amp's level, a splash when loud. So do the controls (`gesture`): a Cutoff turn walks it that way, an
 * Envelope fader stretches it, Resonance shivers it (see `gesturesOf`). With music it dances along: each Note a step
 * one way, now and then the other. Sent away (`leave`), it leaps and smashes itself down into a splash that spreads
 * and fades. With reduced motion it never moves, changes pose only on a Note or a gesture, and goes at
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
  let trick: { name: Trick; at: number; side: -1 | 1; sprayed: Map<Fling, number> } | null = null;
  let leftAt: number | null = null;
  let smashed = false;
  let danceWay: -1 | 1 = 1;
  let tickledUntil = -Infinity;
  let lastRoom: Room | null = null;
  // What the controls, the page and the Demo make of it (issue 127).
  let wave: { shape: Waveform; until: number } | null = null;
  let screamUntil = -Infinity;
  let ice = 0;
  let lastDrip = -Infinity;
  let caffeineUntil = -Infinity;
  let hat: Hat = 'none';
  let act: Act | null = null;
  let pointer: number | null = null;
  // A word's or the theme's turn asked for during another: it comes next.
  let queued: Trick | null = null;
  // Its tricks, dealt like a shuffled deck: each once before any comes again, the jokes three times.
  let deck: Trick[] = [];
  const deal = (): Trick => {
    if (!deck.length) {
      deck = [...PICKED_TRICKS, ...JOKES, ...JOKES];
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
    }
    return deck.pop()!;
  };
  // How fed up it is with being tickled and clicked; past `FED_UP` it runs off, and keeps away a while.
  let fedUp = 0;
  let lastTickle = -Infinity;
  let escapedUntil = -Infinity;
  let escaping = false;
  const started = new Map<Gesture, { at: number; side: -1 | 1 }>();
  // Reduced motion: the pose holds until a Note or a gesture.
  let heardNote: number | null = null;
  let gestureCount = 0;
  let seenGestures = 0;
  let still: Omit<Pose, 'x'> = resting;
  let stillCount = 0;
  const between = (a: number, b: number) => a + random() * (b - a);
  const side = (): -1 | 1 => (random() < 0.5 ? -1 : 1);

  /** Starts a funny turn now; one that goes somewhere goes the way it has room for. */
  const perform = (name: Trick, now: number) => {
    let way = side();
    const travel = (TRICK_MOVES[name] as { travel?: number }).travel;
    if (travel && lastRoom) {
      const { min, max } = lastRoom;
      const clamp = (v: number) => Math.min(max, Math.max(min, v));
      if (clamp((x ?? 0) + way * travel) === x) way = way > 0 ? -1 : 1;
      target = clamp((x ?? 0) + way * travel);
      speed = Math.abs(travel) / lasting(name);
      gait = 'trick';
    } else target = null;
    trick = { name, at: now, side: way, sprayed: new Map() };
    nextIdea = now + lasting(name) + between(0.8, 2.5);
    if (name === 'coffee') caffeineUntil = now + lasting(name) + CAFFEINE_SECONDS;
  };

  const startGesture = (gesture: Gesture, now: number) => {
    const before = started.get(gesture);
    if (before && now - before.at < GESTURE_SECONDS) return;
    // A funny turn under way plays to its end before anything else moves it (the owner, 2026-10-30): a control turned
    // meanwhile only keeps it listening.
    if (trick && gesture !== 'look') {
      busySince = now;
      return;
    }
    started.set(gesture, { at: now, side: side() });
    gestureCount++;
    if (gesture === 'perform') {
      // With nothing played for a while, a funny turn on cue; with music, a glance.
      if (now - busySince >= LISTENING_SECONDS && leftAt === null) {
        perform(deal(), now);
        return;
      }
      gesture = 'look';
    }
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

  /**
   * What the controls and the date make of its look (issue 127): its tail a Waveform for a moment, or straight a moment
   * as Resonance screams, else the logo (the owner, 2026-10-30); a twin as Detune splits it, wobbling as the two beat; frozen with the Filter closed; static
   * with the Noise; its costume, unless a trick gave it a nightcap. With reduced motion, still: no wobble, no static.
   */
  const dressed = (pose: Pose, heard: Heard, now: number, reduced: boolean): Pose => {
    if (wave && now >= wave.until) wave = null;
    pose.tail = wave?.shape ?? (now < screamUntil ? 'straight' : pose.tail);
    const cents = Math.min(50, Math.abs(heard.detune ?? 0));
    const gap = (TWIN_PX * cents) / 50;
    pose.twin = gap < 0.5 ? 0 : reduced ? gap : gap * (0.75 + 0.25 * Math.sin(now * 2 * Math.PI * TWIN_BEAT * (cents / 50)));
    pose.ice = ice;
    pose.fuzz = reduced ? 0 : Math.min(1, heard.noise ?? 0);
    if (pose.hat === 'none') pose.hat = hat;
    return pose;
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
    /** Tickled (a pointer over it), until a moment after the last call: it squirms and giggles. */
    tickle(now: number) {
      // A funny turn under way plays to its end: it does not feel the tickle (the owner, 2026-10-30).
      if (leftAt !== null || now < escapedUntil || trick) return;
      fedUp += Math.min(0.1, Math.max(0, now - lastTickle));
      lastTickle = now;
      tickledUntil = now + TICKLE_SECONDS;
      busySince = now;
      trick = null;
      target = null;
    },
    /** Clicked or touched: a tickle, and it counts for more. */
    poke(now: number) {
      if (leftAt !== null || now < escapedUntil || trick) return;
      this.tickle(now);
      fedUp += POKE;
    },
    /** Put down at `at` (after a fall, a flight or a throw): it carries on from there, running off still if it was. */
    place(at: number) {
      x = at;
      if (!escaping) target = null;
    },
    /** Picked up by the pointer (issue 127): whatever it was doing stops. */
    pickUp(now: number) {
      if (leftAt !== null) return;
      trick = null;
      queued = null;
      target = null;
      busySince = now;
    },
    /** Thrown: it counts towards running off, as a click does. */
    thrown(now: number) {
      if (leftAt !== null || now < escapedUntil) return;
      fedUp += POKE;
      busySince = now;
    },
    /** A word spelled with Notes (issue 127): its trick, at once. */
    word(word: Word, now: number) {
      if (leftAt !== null) return;
      gestureCount++;
      // During a funny turn, it comes once that ends.
      if (trick) queued = WORD_TRICKS[word];
      else perform(WORD_TRICKS[word], now);
    },
    /** The theme switched: a nightcap for dark, its eyes shaded for light, for a few seconds. */
    theme(theme: 'dark' | 'light', now: number) {
      if (leftAt !== null) return;
      gestureCount++;
      if (trick) queued = theme === 'dark' ? 'nightcap' : 'shades';
      else perform(theme === 'dark' ? 'nightcap' : 'shades', now);
    },
    /** A Waveform chosen: its tail takes that wave for `WAVE_SECONDS`. */
    wave(shape: Waveform, now: number) {
      wave = { shape, until: now + WAVE_SECONDS };
      gestureCount++;
    },
    /** Resonance turned past three quarters: eyes wide and tail straight for `WAVE_SECONDS`. */
    scream(now: number) {
      screamUntil = now + WAVE_SECONDS;
      gestureCount++;
    },
    /** What it wears for the date. */
    dress(costume: Hat) {
      hat = costume;
    },
    /** What it does through a Demo part, or null: its own life. */
    act(doing: Act | null) {
      if (doing === act) return;
      act = doing;
      // A funny turn under way ends first.
      if (!trick) target = null;
    },
    /** How far the pointer is across from its middle, in pixels, while near; null when it is not. */
    pointer(dx: number | null) {
      pointer = dx;
    },
    frame(heard: Heard, now: number, reduced: boolean, room: Room): Pose {
      lastRoom = room;
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
      if (!silent || act) busySince = now;
      // Freezing with the Filter fully closed, melting as it opens; a funny turn under way ends first.
      const closed = !!heard.closed && !trick;
      ice = Math.min(1, Math.max(0, ice + (closed ? dt / FREEZE_SECONDS : -dt / MELT_SECONDS)));
      if (reduced) ice = closed ? 1 : 0;
      const frozen = ice > 0.5;
      const idle = now - busySince >= LISTENING_SECONDS;
      let dozing = now - busySince >= DOZE_SECONDS && now >= wakeUntil && !trick;
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
        trick = { name: 'yawn', at: now, side: side(), sprayed: new Map() };
        nextIdea = now + lasting('yawn') + between(0.5, 1.5);
      }

      if (leftAt !== null) {
        let t = now - leftAt;
        if (reduced || t >= LEAVE_SECONDS) return { ...resting, x, form: 'film', eyes: 'none', fade: 0, gone: true };
        const phase = (Object.keys(LEAVING) as (keyof typeof LEAVING)[]).find((k) => {
          if (t < LEAVING[k]) return true;
          t -= LEAVING[k];
          return false;
        })!;
        const p = t / LEAVING[phase];
        if (phase === 'crouch') return { ...resting, x, eyes: 'happy', stretch: 1 - 0.25 * Math.sin((p * Math.PI) / 2) };
        if (phase === 'leap') return { ...resting, x, legs: 'tuck', eyes: 'happy', lift: LEAP_PX * (1 - (1 - p) ** 2), stretch: 1.12 };
        if (phase === 'slam') return { ...resting, x, legs: 'tuck', eyes: 'shut', lift: LEAP_PX * (1 - p * p), stretch: 1.12 + 0.25 * p };
        const burst = smashed ? null : { count: SMASH_DROPLETS, spread: 'up' as const };
        smashed = true;
        if (phase === 'squashed') return { ...resting, x, form: 'squashed', eyes: 'melted', splash: 'wide', burst };
        if (phase === 'puddle') return { ...resting, x, form: 'puddle', eyes: 'melted', splash: 'wide', burst };
        if (phase === 'spread') return { ...resting, x, form: 'spread', eyes: 'none', stretch: 1 - 0.3 * p, burst };
        return { ...resting, x, form: 'film', eyes: 'none', stretch: 0.7, fade: 1 - p };
      }

      if (reduced) {
        target = null;
        if (struck || gestureCount !== seenGestures) still = { ...resting, eyes: STILL_EYES[stillCount++ % STILL_EYES.length] };
        seenGestures = gestureCount;
        const held: Pose = { ...(now < tickledUntil ? { ...still, eyes: 'happy' } : dozing ? { ...still, eyes: 'shut' } : still), x };
        return dressed(held, heard, now, true);
      }

      // Had enough of tickles and clicks: it runs off, to the far end of its room, eyes shut, droplets flying.
      fedUp = Math.max(0, fedUp - FORGIVE * dt);
      let escapedNow = false;
      if (fedUp >= FED_UP) {
        fedUp = 0;
        escapedUntil = now + AWAY_SECONDS;
        tickledUntil = -Infinity;
        trick = null;
        target = x - room.min > room.max - x ? room.min : room.max;
        speed = 230;
        gait = 'scoot';
        escaping = true;
        escapedNow = true;
      }
      if (trick && now - trick.at >= lasting(trick.name)) {
        // Frightened at the edge, it scoots back from it.
        if (trick.name === 'scared') {
          target = clamp(x - trick.side * BACK_OFF_PX);
          speed = 150;
          gait = 'scoot';
        }
        trick = null;
        if (queued) {
          perform(queued, now);
          queued = null;
        }
      }
      // What next, when it is free: a stroll, a glance, or (with nothing played) a funny turn.
      // Surfing an LFO's shape through a Demo part: along it, end to end.
      if (act === 'surf' && target === null && !frozen && !trick) {
        target = x - room.min < room.max - x ? room.max : room.min;
        speed = SURF_SPEED;
        gait = 'slide';
      }
      const buzzing = now < caffeineUntil;
      if (target === null && trick === null && !dozing && !frozen && !act && now >= nextIdea) {
        const roll = random();
        if (idle && roll < 0.35) {
          perform(deal(), now);
        } else if (roll < (idle ? 0.45 : 0.25)) {
          startGesture('look', now);
          nextIdea = now + between(1, 3);
        } else {
          // A stroll somewhere along, or (one in three) right to an end, to look over the edge.
          target = random() < 0.33 ? (random() < 0.5 ? room.min : room.max) : room.min + random() * (room.max - room.min);
          const style = random();
          gait = style < 0.6 ? 'walk' : style < 0.85 ? 'hop' : 'scoot';
          speed = (gait === 'walk' ? between(28, 55) : gait === 'hop' ? 50 : 115) * (buzzing ? CAFFEINE : 1);
          nextIdea = Infinity;
        }
      }
      // Dancing: with each Note a step along, one way, turning back at an end or now and then.
      if (struck && !silent && !frozen && !trick && (target === null || gait === 'dance')) {
        if (random() < 0.2) danceWay = danceWay > 0 ? -1 : 1;
        let step = danceWay * between(...DANCE_STEP);
        if (clamp(x + step) !== x + step) {
          danceWay = danceWay > 0 ? -1 : 1;
          step = -step;
        }
        target = clamp(x + step);
        speed = DANCE_SPEED;
        gait = 'dance';
      }
      let walking: -1 | 0 | 1 = 0;
      if (target !== null) {
        target = clamp(target);
        const away = target - x;
        if (Math.abs(away) <= speed * dt) {
          x = target;
          target = null;
          escaping = false;
          nextIdea = now + between(1, 3.5) / (buzzing ? 2 : 1);
          // At an end of its room, now and then it looks over the edge and takes fright.
          const end = x - room.min < 2 ? -1 : room.max - x < 2 ? 1 : 0;
          if (end && gait !== 'dance' && gait !== 'scoot' && gait !== 'trick' && gait !== 'slide' && room.max - room.min > 30 && random() < 0.5) {
            trick = { name: 'scared', at: now, side: end, sprayed: new Map() };
            nextIdea = now + lasting('scared') + between(1, 2.5);
          }
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
        pose.lift = since < HOP_SECONDS && !trick ? Math.sin((since / HOP_SECONDS) * Math.PI) * HOP_PX : 0;
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
        } else if (gait !== 'slide' && gait !== 'dance' && pose.legs === 'stand') {
          const steps = gait === 'scoot' ? STEP_SECONDS / 2 : STEP_SECONDS;
          const second = Math.floor(now / steps) % 2 === 1;
          pose.legs = second ? 'walkB' : 'walkA';
          pose.lift += second ? 1 : 0; // a bob on every other step
          if (gait === 'scoot') pose.tilt += walking * 8; // leaning into it
        }
        if (pose.eyes !== 'happy') pose.eyes = walking > 0 ? 'right' : 'left';
      }
      // A pointer near: its eyes on it, when they are free.
      if (pointer !== null && !walking && (pose.eyes === 'open' || pose.eyes === 'left' || pose.eyes === 'right')) {
        pose.eyes = pointer > 6 ? 'right' : pointer < -6 ? 'left' : 'open';
      }
      if (now < screamUntil && (pose.eyes === 'open' || pose.eyes === 'left' || pose.eyes === 'right')) pose.eyes = 'wide';
      if (buzzing && !walking && !trick) pose.x += Math.sin(now * 2 * Math.PI * 11) * 0.6; // jittery
      if (act === 'conduct') {
        // The baton down on each Note, up between them.
        const since = heard.struck === null ? Infinity : now - heard.struck;
        pose.prop = since < 0.15 ? 'batonDown' : 'baton';
        pose.tilt += since < 0.15 ? 4 : -2;
        if (pose.eyes === 'open') pose.eyes = 'happy';
      } else if (act === 'airGuitar') {
        // Its tail held across it like a guitar, strummed on each Note, eyes shut, rocking.
        const since = heard.struck === null ? Infinity : now - heard.struck;
        pose.wag = 40 + (since < 0.2 ? 18 * (1 - since / 0.2) : 0);
        pose.tilt += Math.sin(now * 2 * Math.PI * 1.5) * 6;
        pose.eyes = 'shut';
      } else if (act === 'surf') {
        pose.legs = 'stand';
        pose.eyes = 'happy';
      }

      if (trick) {
        const doing = trick;
        pose.doing = doing.name;
        TRICK_MOVES[doing.name].move(pose, (now - doing.at) / lasting(doing.name), {
          now,
          side: doing.side,
          spray(count, spread, every, aim) {
            // Each kind of droplet on its own: no more often than `every`, or once in the trick.
            const last = doing.sprayed.get(spread);
            if (last !== undefined && (every === Infinity || now - last < every)) return;
            pose.burst = { count, spread, aim };
            doing.sprayed.set(spread, now);
          },
        });
      }

      if (escapedNow) {
        pose.escaped = true;
        pose.burst = { count: 3, spread: 'side' };
      }
      if (escaping && walking) pose.eyes = 'shut';
      if (now < tickledUntil) {
        // Squirming and giggling: a quick wiggle, little hops, its tail going, its feet everywhere.
        const w = 2 * Math.PI * now;
        pose.eyes = 'happy';
        pose.tilt += Math.sin(w * 7) * 10;
        pose.lift += Math.abs(Math.sin(w * 5)) * 3;
        pose.stretch *= 1 + 0.08 * Math.sin(w * 9);
        pose.wag = Math.sin(w * 8) * 30;
        pose.legs = Math.floor(now / 0.06) % 2 ? 'walkA' : 'walkB';
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
      if (frozen) {
        // Stiff in its ice cube, shivering, its eyes open.
        Object.assign(pose, { legs: 'stand', lift: 0, tilt: 0, stretch: 1, wag: 0, eyes: 'open', prop: 'none' });
        pose.x += Math.sin(now * 2 * Math.PI * 14) * 0.6;
      } else if (ice > 0 && !closed && !pose.burst && now - lastDrip > 0.08) {
        // Melting, it drips.
        pose.burst = { count: 1, spread: 'drip' };
        lastDrip = now;
      }
      return dressed(pose, heard, now, false);
    },
  };
}
