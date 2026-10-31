import type { Pose } from './mascotMotion';
import type { Fling } from './mascotSpray';

/** What a trick has to hand each frame: the time, the way it faces it, and a way to fling droplets. */
export interface TrickContext {
  now: number;
  /** The way it does the trick: −1 left, 1 right. */
  side: -1 | 1;
  /** Fling `count` droplets, once every `every` seconds at most (Infinity: once in the trick). */
  spray(count: number, fling: Fling, every: number): void;
}

interface TrickMove {
  seconds: number;
  /** How far it travels along the trick, its way (negative: backwards). */
  travel?: number;
  /** Picked at random when nothing is played; false for one the mascot does only for a reason. */
  picked?: boolean;
  /** Its pose at `p`, 0 to 1 through the trick, from the pose it would have anyway. */
  move(pose: Pose, p: number, c: TrickContext): void;
}

const TAU = 2 * Math.PI;
/** A quick bump at `at` through the trick, `width` long: 0 outside it, 1 at its middle. */
const bump = (p: number, at: number, width: number) => (Math.abs(p - at) < width / 2 ? Math.sin(((p - at) / width + 0.5) * Math.PI) : 0);

/**
 * The mascot's funny turns when nothing is played (issue 115), each a few seconds or less: what it does, frame by
 * frame. Most are picked at random; `scared` comes at the edge of its room.
 */
export const TRICK_MOVES = {
  /** Like a wet dog: a shiver from nose to tail, droplets flying off, eyes screwed shut. */
  shake: {
    seconds: 0.9,
    move(pose, p, c) {
      pose.x += Math.sin(c.now * TAU * 18) * 2 * (1 - p);
      pose.tilt += Math.sin(c.now * TAU * 9) * 6 * (1 - p);
      pose.wag = Math.sin(c.now * TAU * 9) * 25 * (1 - p);
      pose.eyes = 'shut';
      if (p > 0.2 && p < 0.75) c.spray(1, 'side', 0.07);
    },
  },
  /** Waddling along like a happy dog, its tail going, dribbling water behind it. */
  waddle: {
    seconds: 2.2,
    travel: 45,
    move(pose, p, c) {
      pose.wag = Math.sin(c.now * TAU * 6) * 32;
      pose.tilt += Math.sin(c.now * TAU * 3) * 8;
      pose.eyes = 'happy';
      if (p < 0.95) c.spray(1, 'drip', 0.12);
    },
  },
  /** Jumping into a puddle that is not there: up, and down with a splash. */
  puddle: {
    seconds: 1,
    move(pose, p, c) {
      if (p < 0.55) {
        pose.lift += Math.sin((p / 0.55) * Math.PI) * 12;
        pose.legs = 'tuck';
      } else {
        const q = (p - 0.55) / 0.45;
        pose.stretch *= 1 - 0.25 * Math.exp(-5 * q) * Math.cos(14 * q);
        c.spray(8, 'up', Infinity);
      }
      pose.eyes = 'happy';
    },
  },
  /** Ah… ah… choo! Rearing back, then a sneeze that sprays and rocks it. */
  sneeze: {
    seconds: 1.4,
    move(pose, p, c) {
      if (p < 0.6) {
        const q = p / 0.6;
        pose.stretch *= 1 + 0.12 * q;
        pose.tilt -= c.side * 9 * q + Math.sin(q * TAU * 2) * 2;
        pose.eyes = q > 0.6 ? 'shut' : 'open';
      } else if (p < 0.72) {
        pose.stretch *= 0.8;
        pose.tilt += c.side * 10;
        pose.x += c.side * 3;
        pose.eyes = 'shut';
        c.spray(6, 'side', Infinity);
      } else pose.eyes = 'happy';
    },
  },
  /** Sliding backwards while its feet walk forwards, looking the way it is not going. */
  moonwalk: {
    seconds: 2,
    travel: -40,
    move(pose, _p, c) {
      pose.eyes = c.side > 0 ? 'right' : 'left';
      pose.tilt -= c.side * 4;
    },
  },
  /** Round and round after its own tail. */
  chase: {
    seconds: 1.6,
    move(pose, p, c) {
      pose.turn = Math.cos(p * TAU * 3);
      pose.x += Math.sin(p * TAU * 3) * 4;
      pose.wag = Math.sin(c.now * TAU * 8) * 30;
      pose.eyes = 'happy';
    },
  },
  /** Two spins, then a dizzy wobble, eyes shut, until it finds its feet. */
  dizzy: {
    seconds: 1.8,
    move(pose, p, c) {
      if (p < 0.4) {
        pose.turn = Math.cos((p / 0.4) * TAU * 2);
        pose.eyes = 'happy';
      } else {
        const q = (p - 0.4) / 0.6;
        pose.tilt += Math.sin(c.now * TAU * 1.5) * 12 * (1 - q);
        pose.x += Math.sin(c.now * TAU * 1.5) * 2 * (1 - q);
        pose.eyes = 'shut';
      }
    },
  },
  /** Leaning back and spouting water from the top of its head, like a little whale. */
  fountain: {
    seconds: 1.6,
    move(pose, p, c) {
      pose.tilt -= c.side * 8 * Math.sin(p * Math.PI);
      pose.stretch *= 1.05;
      pose.eyes = 'happy';
      if (p > 0.2 && p < 0.8) c.spray(1, 'spout', 0.06);
    },
  },
  /** Three hiccups: sudden little jumps, eyes shut each time. */
  hiccup: {
    seconds: 1.8,
    move(pose, p) {
      const hic = bump(p, 0.15, 0.08) + bump(p, 0.5, 0.08) + bump(p, 0.82, 0.08);
      pose.lift += hic * 4;
      pose.stretch *= 1 + 0.08 * hic;
      if (hic > 0) pose.eyes = 'shut';
    },
  },
  /** A little dance of its own: leaning side to side, a hop on each lean, feet in turn. */
  twist: {
    seconds: 1.8,
    move(pose, p) {
      const beat = Math.sin(p * TAU * 4);
      pose.tilt += beat * 12;
      pose.lift += Math.abs(beat) * 3;
      pose.legs = beat > 0 ? 'walkA' : 'walkB';
      pose.eyes = 'happy';
    },
  },
  /** On one foot, wobbling more and more, then catching itself. */
  balance: {
    seconds: 2,
    move(pose, p, c) {
      const wobble = p < 0.8 ? 0.5 + p : (1 - p) * 6.5;
      pose.legs = c.side > 0 ? 'walkB' : 'walkA';
      pose.tilt += Math.sin(c.now * TAU * 2) * 6 * wobble;
      pose.eyes = p < 0.8 ? 'open' : 'happy';
    },
  },
  /**
   * A little cloud comes over and rains on it: it winces and shivers, then puts up an umbrella, balanced on the tip of
   * its head, and sways happily under it while the rain patters on it; then the cloud is gone, and the umbrella.
   */
  umbrella: {
    seconds: 3.4,
    move(pose, p, c) {
      pose.cloud = p < 0.88;
      if (p < 0.88) c.spray(1, 'rain', 0.045);
      if (p < 0.2) {
        pose.eyes = 'shut';
        pose.stretch *= 0.92;
        pose.x += Math.sin(c.now * TAU * 16) * 1;
      } else if (p < 0.92) {
        pose.prop = 'umbrella';
        const up = bump(p, 0.24, 0.08);
        pose.lift += up * 4;
        pose.tilt += Math.sin(c.now * TAU * 0.8) * 5;
        pose.eyes = 'happy';
      }
    },
  },
  /**
   * A glass of water appears beside it: it lifts it to its mouth and tips it, drinking it down in gulps as the water
   * goes, puts it down, swells a little, and burps a droplet.
   */
  drink: {
    seconds: 3.2,
    move(pose, p, c) {
      if (p < 0.9) pose.prop = p < 0.3 ? 'glassFull' : p < 0.48 ? 'glassHalf' : 'glassEmpty';
      // Up to its mouth, held there tipped while it drinks, then down again.
      pose.sip = p < 0.1 ? 0 : p < 0.2 ? (p - 0.1) / 0.1 : p < 0.6 ? 1 : p < 0.7 ? 1 - (p - 0.6) / 0.1 : 0;
      if (p >= 0.2 && p < 0.6) {
        const gulp = Math.sin((p - 0.2) * TAU * 6);
        pose.sip += 0.08 * gulp;
        pose.tilt += 4; // its head back a little, to drink
        pose.stretch *= 1 + 0.04 * gulp + 0.25 * (p - 0.2);
        pose.eyes = 'shut';
      } else if (p >= 0.6) {
        const q = (p - 0.6) / 0.4;
        pose.stretch *= 1.1 * (1 - q) + q;
        if (q > 0.35 && q < 0.5) {
          pose.eyes = 'shut';
          c.spray(1, 'spout', Infinity);
        } else pose.eyes = 'happy';
      } else pose.eyes = 'happy';
    },
  },
  /**
   * A water gun: pulled out, it turns to aim it its way, fires a jet of water with a little recoil, blows on the
   * barrel like a cowboy, and puts it away. (The gun is drawn on its left: it faces right by turning round.)
   */
  waterGun: {
    seconds: 2.8,
    move(pose, p, c) {
      pose.turn = c.side > 0 ? -1 : 1;
      if (p < 0.88) pose.prop = 'gun';
      if (p < 0.12) {
        pose.lift += Math.sin((p / 0.12) * Math.PI) * 4;
        pose.eyes = 'happy';
      } else if (p < 0.3) {
        pose.eyes = 'left'; // along the barrel, turned with it
      } else if (p < 0.68) {
        pose.x -= c.side * Math.abs(Math.sin(c.now * TAU * 15)) * 1.5; // the recoil
        pose.tilt -= c.side * 3;
        pose.eyes = 'happy';
        c.spray(1, 'jet', 0.03);
      } else if (p < 0.85) {
        pose.eyes = 'shut'; // blowing on the barrel
        pose.stretch *= 1 + 0.05 * Math.sin(((p - 0.68) / 0.17) * Math.PI);
      } else {
        pose.wag = Math.sin(c.now * TAU * 6) * 25;
        pose.eyes = 'happy';
      }
    },
  },
  /** Three bounces, getting lower. */
  bounce: {
    seconds: 1,
    move(pose, p) {
      const hop = Math.abs(Math.sin(p * Math.PI * 3)) * 8 * (1 - 0.5 * p);
      pose.lift += hop;
      pose.legs = hop > 1 ? 'tuck' : 'stand';
      pose.eyes = 'happy';
    },
  },
  /** Turning round once. */
  spin: {
    seconds: 0.7,
    move(pose, p) {
      pose.turn = Math.cos(p * TAU);
      pose.eyes = 'happy';
    },
  },
  /** A jelly jiggle, dying away. */
  jiggle: {
    seconds: 1,
    move(pose, p) {
      pose.stretch *= 1 + 0.18 * Math.sin(p * 10 * Math.PI) * (1 - p);
    },
  },
  /** A happy tail wag. */
  wag: {
    seconds: 1.2,
    move(pose, p) {
      pose.wag = Math.sin(p * 8 * Math.PI) * 30 * (1 - 0.3 * p);
      pose.eyes = 'happy';
    },
  },
  /** Leaning out to look one way. */
  peek: {
    seconds: 1.4,
    move(pose, p, c) {
      pose.tilt += c.side * 18 * Math.sin(p * Math.PI);
      pose.eyes = c.side > 0 ? 'right' : 'left';
    },
  },
  /** A big stretch, eyes shut. */
  yawn: {
    seconds: 1.6,
    move(pose, p) {
      pose.stretch *= 1 + 0.2 * Math.sin(p * Math.PI);
      pose.eyes = 'shut';
    },
  },
  /** At an end of its room: leaning out to look down, then a fright, a shiver and a nervous droplet. */
  scared: {
    seconds: 0.8,
    picked: false,
    move(pose, p, c) {
      if (p < 0.55) {
        pose.tilt += c.side * 16 * Math.sin((p / 0.55) * (Math.PI / 2));
        pose.eyes = c.side > 0 ? 'right' : 'left';
      } else {
        const q = (p - 0.55) / 0.45;
        pose.lift += Math.sin(Math.min(1, q * 2) * Math.PI) * 5;
        pose.x += Math.sin(c.now * TAU * 20) * 1.5;
        pose.tilt -= c.side * 6 * (1 - q);
        pose.eyes = 'shut';
        pose.legs = 'tuck';
        c.spray(1, 'side', 0.3);
      }
    },
  },
} satisfies Record<string, TrickMove>;

export type Trick = keyof typeof TRICK_MOVES;
/** The tricks picked at random. */
export const PICKED_TRICKS = (Object.keys(TRICK_MOVES) as Trick[]).filter((t) => (TRICK_MOVES[t] as TrickMove).picked !== false);
