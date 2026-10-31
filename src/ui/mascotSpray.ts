/** One droplet the mascot flings (issue 115): where it is, in the page's pixels, its speed, and its age. */
export interface Droplet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  /** Where it ends as it falls, if somewhere: an umbrella, the edge. */
  until: number;
  /** Its gravity, in pixels a second squared: steam's rises. */
  gravity: number;
}

/**
 * How droplets leave it: `up`, a splash up and out from its foot (landing, smashing down); `side`, flung out sideways
 * (shaking itself, sneezing); `down`, sprayed below (its tail pushing it up); `all`, escaping every way (a click or a
 * touch); `drip`, dribbled at its foot (waddling); `spout`, straight up from its head (a fountain, a burp); `rain`,
 * falling from the sky around; `shower`, from a cloud just over it; `steam`, rising as it evaporates; `jet`, shot from a water gun, its way given by `strength`'s sign; `pour`, out of a glass
 * turned over, a little its way (`strength`'s sign); `arc`, a fountain's jet up at the angle `strength` (radians from
 * straight up, positive to the right).
 */
export type Fling = 'up' | 'side' | 'down' | 'all' | 'drip' | 'spout' | 'rain' | 'shower' | 'steam' | 'jet' | 'pour' | 'arc';

/** Gravity on a droplet, in pixels a second squared (lighter than on the drop itself, for a slower, prettier arc). */
export const DROPLET_GRAVITY = 1500;
/** Steam rises, slowing as it goes. */
const STEAM_GRAVITY = 30;
/** The most droplets in the air at once; older ones make way. */
export const MOST_DROPLETS = 60;

/**
 * The mascot's droplets (issue 115): flung at `x`, `y` (`fling`), each flies under gravity until its life is over, or
 * until it falls to `until`. `strength` (0 to 1) scales a splash's speed. `random` (0 to 1) is for the tests.
 */
export function createSpray(random: () => number = Math.random) {
  let droplets: Droplet[] = [];
  const between = (a: number, b: number) => a + random() * (b - a);
  const either = () => (random() < 0.5 ? -1 : 1);
  return {
    fling(count: number, x: number, y: number, fling: Fling, strength = 0.5, until = Infinity) {
      for (let i = 0; i < count; i++) {
        let vx: number;
        let vy: number;
        if (fling === 'up') {
          vx = either() * between(40, 240);
          vy = -between(160, 420) * (0.6 + strength);
        } else if (fling === 'side') {
          vx = either() * between(120, 240);
          vy = -between(40, 160);
        } else if (fling === 'down') {
          vx = between(-40, 40);
          vy = between(180, 320);
        } else if (fling === 'drip') {
          vx = between(-30, 30);
          vy = -between(20, 70);
        } else if (fling === 'spout') {
          vx = between(-50, 50);
          vy = -between(280, 420);
        } else if (fling === 'rain' || fling === 'shower') {
          vx = 0;
          vy = between(160, 220);
        } else if (fling === 'steam') {
          vx = between(-20, 20);
          vy = -between(25, 45);
        } else if (fling === 'arc') {
          const speed = between(400, 440);
          vx = Math.sin(strength) * speed;
          vy = -Math.cos(strength) * speed;
        } else if (fling === 'pour') {
          vx = Math.sign(strength || 1) * between(70, 110);
          vy = between(0, 40);
        } else if (fling === 'jet') {
          vx = Math.sign(strength || 1) * between(380, 480);
          vy = -between(0, 70);
        } else {
          const angle = random() * 2 * Math.PI;
          const speed = between(110, 260);
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed - 60;
        }
        const spread = fling === 'shower' ? between(-10, 10) : fling === 'rain' || fling === 'pour' || fling === 'arc' ? 0 : between(-3, 3);
        const life = fling === 'rain' || fling === 'shower' || fling === 'arc' ? 2 : fling === 'steam' ? between(0.6, 0.9) : between(0.45, 0.85);
        droplets.push({ x: x + spread, y, vx, vy, age: 0, life, until, gravity: fling === 'steam' ? STEAM_GRAVITY : DROPLET_GRAVITY });
      }
      if (droplets.length > MOST_DROPLETS) droplets = droplets.slice(-MOST_DROPLETS);
    },
    /** Moves them on by `dt` seconds; those whose life is over are gone. */
    step(dt: number): readonly Droplet[] {
      for (const d of droplets) {
        d.vy += d.gravity * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.age += dt;
      }
      droplets = droplets.filter((d) => d.age < d.life && d.y < d.until);
      return droplets;
    },
  };
}
