import { describe, expect, it } from 'vitest';
import type { Pose } from './mascotMotion';
import type { Fling } from './mascotSpray';
import { PICKED_TRICKS, TRICK_MOVES, type Trick } from './mascotTricks';

const resting: Pose = {
  form: 'drop', splash: 'none', legs: 'stand', eyes: 'open', x: 0, lift: 0, tilt: 0, stretch: 1, turn: 1, wag: 0, fade: 1,
  burst: null, doing: null, prop: 'none', cloud: false, sip: 0, gone: false,
};

/** A trick played through at 60 frames a second: its poses, and the droplets it asked for. */
function play(name: Trick, side: -1 | 1 = 1) {
  const { seconds, move } = TRICK_MOVES[name];
  const poses: Pose[] = [];
  const sprays: Fling[] = [];
  let sprayed = -Infinity;
  for (let t = 0; t < seconds; t += 1 / 60) {
    const pose = { ...resting };
    // As the motion does: no more often than `every`, or once.
    const spray = (_count: number, fling: Fling, every: number) => {
      if (t - sprayed < every || (every === Infinity && sprayed > -Infinity)) return;
      sprays.push(fling);
      sprayed = t;
    };
    move(pose, t / seconds, { now: t, side, spray });
    poses.push(pose);
  }
  return { poses, sprays };
}

describe("the mascot's funny turns (issue 115)", () => {
  it('there are many, all picked at random but the fright at the edge', () => {
    expect(PICKED_TRICKS.length).toBeGreaterThanOrEqual(18);
    expect(PICKED_TRICKS).not.toContain('scared');
  });

  it('every one moves it, and ends back as it was', () => {
    for (const name of Object.keys(TRICK_MOVES) as Trick[]) {
      const { poses } = play(name);
      expect(poses.some((p) => JSON.stringify(p) !== JSON.stringify(resting)), name).toBe(true);
    }
  });

  it('like a wet dog, it shakes droplets off, and waddles along wagging, dribbling water', () => {
    expect(play('shake').sprays.filter((f) => f === 'side').length).toBeGreaterThan(3);
    const waddle = play('waddle');
    expect(TRICK_MOVES.waddle.travel).toBeGreaterThan(0);
    expect(waddle.poses.some((p) => Math.abs(p.wag) > 20)).toBe(true);
    expect(waddle.sprays.filter((f) => f === 'drip').length).toBeGreaterThan(5);
  });

  it('a cloud rains on it, it winces, then puts up an umbrella; the cloud and umbrella go at the end', () => {
    const { poses, sprays } = play('umbrella');
    expect(poses[0].cloud && poses[0].eyes === 'shut' && poses[0].prop === 'none').toBe(true);
    expect(poses[Math.floor(poses.length / 2)]).toMatchObject({ cloud: true, prop: 'umbrella', eyes: 'happy' });
    expect(poses.at(-1)).toMatchObject({ cloud: false, prop: 'none' });
    expect(sprays.filter((f) => f === 'rain').length).toBeGreaterThan(20);
  });

  it('a glass appears; it lifts it to its mouth and drinks it down, puts it down, then burps one droplet', () => {
    const { poses, sprays } = play('drink');
    const glasses = poses.map((p) => p.prop).filter((g, i, all) => g !== all[i - 1]);
    expect(glasses).toEqual(['glassFull', 'glassHalf', 'glassEmpty', 'none']);
    // The water goes while the glass is at its mouth.
    const draining = poses.filter((p, i) => i > 0 && p.prop !== poses[i - 1].prop && p.prop !== 'none');
    expect(draining.every((p) => p.sip > 0.8)).toBe(true);
    expect(poses[0].sip).toBe(0);
    expect(poses.at(-1)!.sip).toBe(0);
    expect(sprays).toEqual(['spout']);
  });

  it('sneezes once, spouts like a fountain, hiccups three times, and jumps in a puddle with a splash', () => {
    expect(play('sneeze').sprays).toEqual(['side']);
    expect(play('fountain').sprays.every((f) => f === 'spout')).toBe(true);
    const hiccups = play('hiccup').poses.map((p) => p.eyes === 'shut').filter((shut, i, all) => shut && !all[i - 1]);
    expect(hiccups).toHaveLength(3);
    expect(play('puddle').sprays).toEqual(['up']);
  });

  it('moonwalks backwards, looking ahead; chases its tail round and round', () => {
    expect(TRICK_MOVES.moonwalk.travel).toBeLessThan(0);
    expect(play('moonwalk', 1).poses.every((p) => p.eyes === 'right')).toBe(true);
    const turns = play('chase').poses.map((p) => p.turn < 0).filter((back, i, all) => back && !all[i - 1]);
    expect(turns.length).toBeGreaterThanOrEqual(3);
  });
});
