import { describe, expect, it } from 'vitest';
import type { Pose } from './mascotMotion';
import type { Fling } from './mascotSpray';
import { PICKED_TRICKS, TRICK_MOVES, type Trick } from './mascotTricks';

const resting: Pose = {
  form: 'drop', splash: 'none', legs: 'stand', eyes: 'open', tail: 'logo', hat: 'none', ice: 0, fuzz: 0, twin: 0, size: 1, hook: null, caught: false, x: 0, lift: 0, tilt: 0, stretch: 1, turn: 1, wag: 0, fade: 1,
  burst: null, doing: null, prop: 'none', sip: 0, escaped: false, gone: false,
};

/** A trick played through at 60 frames a second: its poses, and the droplets it asked for. */
function play(name: Trick, side: -1 | 1 = 1) {
  const { seconds, move } = TRICK_MOVES[name];
  const poses: Pose[] = [];
  const sprays: Fling[] = [];
  const sprayed = new Map<Fling, number>();
  for (let t = 0; t < seconds; t += 1 / 60) {
    const pose = { ...resting };
    // As the motion does: each kind no more often than `every`, or once.
    const spray = (_count: number, fling: Fling, every: number) => {
      const last = sprayed.get(fling);
      if (last !== undefined && (every === Infinity || t - last < every)) return;
      sprays.push(fling);
      sprayed.set(fling, t);
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

  it('rain comes, it winces, quickly pops a folded umbrella up and opens it; the rain stops and it goes', () => {
    const { poses, sprays } = play('umbrella');
    expect(poses[0].eyes === 'shut' && poses[0].prop === 'none').toBe(true);
    const props = poses.map((p) => p.prop).filter((g, i, all) => g !== all[i - 1]);
    expect(props).toEqual(['none', 'umbrellaShut', 'umbrella', 'none']);
    expect(poses.findIndex((p) => p.prop === 'umbrella') / 60).toBeLessThan(0.45); // open within a moment
    expect(sprays.filter((f) => f === 'rain').length).toBeGreaterThan(40);
  });

  it('a glass appears; it turns it over beside its mouth and the water pours out as it drinks, then burps', () => {
    const { poses, sprays } = play('drink');
    const glasses = poses.map((p) => p.prop).filter((g, i, all) => g !== all[i - 1]);
    expect(glasses).toEqual(['glassFull', 'glassHalf', 'glassLow', 'glassEmpty', 'none']);
    // The water goes while the glass is turned over at its mouth.
    const draining = poses.filter((p, i) => i > 0 && p.prop !== poses[i - 1].prop && p.prop !== 'none');
    expect(draining.every((p) => p.sip > 0.9)).toBe(true);
    expect(poses[0].sip).toBe(0);
    expect(poses.at(-1)!.sip).toBe(0);
    expect(sprays.filter((f) => f === 'pour').length).toBeGreaterThan(20);
    expect(sprays.at(-1)).toBe('spout');
    expect(Math.max(...poses.map((p) => p.stretch))).toBeGreaterThan(1.1); // filled up
  });

  it('sneezes once, spouts like a fountain, hiccups three times, and jumps in a puddle with a splash', () => {
    expect(play('sneeze').sprays).toEqual(['side']);
    expect(play('fountain').sprays.every((f) => f === 'spout')).toBe(true);
    const hiccups = play('hiccup').poses.map((p) => p.eyes === 'shut').filter((shut, i, all) => shut && !all[i - 1]);
    expect(hiccups).toHaveLength(3);
    expect(play('puddle').sprays).toEqual(['up']);
  });

  it('pulls a water gun, turns to aim it its way, fires a jet, and puts it away', () => {
    for (const side of [-1, 1] as const) {
      const { poses, sprays } = play('waterGun', side);
      expect(poses[Math.floor(poses.length / 2)]).toMatchObject({ prop: 'gun', turn: side > 0 ? -1 : 1 });
      expect(poses.at(-1)!.prop).toBe('none');
      expect(sprays.filter((f) => f === 'jet').length).toBeGreaterThan(10);
    }
  });

  it('a fountain show: two jets swinging side to side and crossing, then a finale straight up', () => {
    const { seconds, move } = TRICK_MOVES.fountainShow;
    const aims: number[] = [];
    const finale: Fling[] = [];
    for (let t = 0; t < seconds; t += 1 / 60) {
      move({ ...resting }, t / seconds, {
        now: t,
        side: 1,
        spray: (_count, fling, _every, aim) => (fling === 'arc' ? aims.push(aim!) : finale.push(fling)),
      });
    }
    expect(aims.some((a) => a > 0.4) && aims.some((a) => a < -0.4)).toBe(true);
    expect(finale.every((f) => f === 'spout') && finale.length > 0).toBe(true);
  });

  it('moonwalks backwards, looking ahead; chases its tail round and round', () => {
    expect(TRICK_MOVES.moonwalk.travel).toBeLessThan(0);
    expect(play('moonwalk', 1).poses.every((p) => p.eyes === 'right')).toBe(true);
    const turns = play('chase').poses.map((p) => p.turn < 0).filter((back, i, all) => back && !all[i - 1]);
    expect(turns.length).toBeGreaterThanOrEqual(3);
  });

  it('more water gags (issue 127): evaporating and raining back, a soap bubble that pops, skipping rope, fishing', () => {
    const evaporate = play('evaporate');
    expect(Math.min(...evaporate.poses.map((p) => p.size))).toBeLessThan(0.3);
    expect(evaporate.poses.at(-1)!.size).toBe(1);
    expect(evaporate.poses.map((p) => p.prop).filter((g, i, all) => g !== all[i - 1])).toEqual(['sun', 'cloud', 'none']);
    expect(evaporate.sprays.includes('steam') && evaporate.sprays.includes('shower')).toBe(true);
    const bubble = play('bubble');
    expect(bubble.poses.map((p) => p.prop).filter((g, i, all) => g !== all[i - 1])).toEqual(['bubbleSmall', 'bubble', 'none']);
    expect(Math.max(...bubble.poses.map((p) => p.lift))).toBeGreaterThan(12);
    expect(bubble.sprays).toEqual(['all']); // the pop
    // Five turns of its tail, a hop each time it comes under.
    const rope = play('skipRope').poses;
    const hops = rope.map((p) => p.lift > 3).filter((up, i, all) => up && !all[i - 1]);
    expect(hops).toHaveLength(5);
    // The hook cast down past the window's bottom, bobbing, a bite, then reeled up with a ♪ on it.
    const fishing = play('fishing').poses;
    expect(fishing.map((p) => p.prop).filter((g, i, all) => g !== all[i - 1])).toEqual(['rod', 'rodBite', 'rod']);
    expect(fishing[0].hook).toBe(0);
    expect(Math.max(...fishing.map((p) => p.hook!))).toBeGreaterThanOrEqual(1);
    const reeled = fishing.findIndex((p) => p.caught);
    expect(fishing[reeled].hook).toBeGreaterThan(0.9);
    expect(fishing.at(-1)).toMatchObject({ hook: 0, caught: true });
    expect(fishing.slice(reeled).every((p, i, all) => i === 0 || p.hook! <= all[i - 1].hook!)).toBe(true); // up, never down
    expect(PICKED_TRICKS).toEqual(expect.arrayContaining(['evaporate', 'bubble', 'skipRope', 'fishing']));
  });

  it('the words\' tricks and the theme\'s come only for a reason, never at random', () => {
    for (const t of ['playDead', 'ghost', 'coffee', 'earsCovered', 'suitcase', 'nightcap', 'shades'] as const) expect(PICKED_TRICKS).not.toContain(t);
  });

  it('plays dead on its back, crosses for eyes, peeks once, and pops up', () => {
    const { poses } = play('playDead');
    expect(Math.min(...poses.map((p) => p.tilt))).toBe(-90);
    const eyes = poses.map((p) => p.eyes).filter((e, i, all) => e !== all[i - 1]);
    expect(eyes).toEqual(['dead', 'peek', 'dead', 'happy']);
    expect(poses.at(-1)!.tilt).toBe(0);
  });

  it('fades to a ghost and back; drinks a coffee; covers its ears; drags a suitcase along', () => {
    const ghost = play('ghost').poses;
    expect(Math.min(...ghost.map((p) => p.fade))).toBeLessThan(0.2);
    expect(ghost.at(-1)!.fade).toBeGreaterThan(0.95);
    expect(play('coffee').poses[0].prop).toBe('cup');
    expect(play('earsCovered').poses[0]).toMatchObject({ prop: 'hands', eyes: 'shut' });
    expect(TRICK_MOVES.suitcase.travel).toBeGreaterThan(0);
    expect(play('suitcase', -1).poses.every((p) => p.prop === 'suitcase' && p.turn === -1)).toBe(true);
  });

  it('the theme switched: a nightcap for dark, a hand shading its eyes for light', () => {
    expect(play('nightcap').poses.every((p) => p.hat === 'nightcap')).toBe(true);
    expect(play('shades').poses.every((p) => p.prop === 'visor')).toBe(true);
  });
});

