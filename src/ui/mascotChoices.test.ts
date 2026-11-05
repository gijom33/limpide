import { describe, expect, it } from 'vitest';
import { clingMove, homeEdge, landingEdge, looksForPlots, nextVisitAt, perchAcross, ridePlot, staysBeside, visitDue, visitFor } from './mascotChoices';

const edge = (id: string, left: number, right: number, top: number) => ({ id, box: { left, right, top } });

describe('where a throw lands (issue 127)', () => {
  const sections = [edge('Oscillators', 0, 400, 100), edge('Filter', 400, 800, 100), edge('Amp', 0, 400, 500), edge('LFOs', 400, 800, 500)];
  const allClear = (e: { box: { left: number; right: number } }) => [{ min: e.box.left, max: e.box.right - 44 }];

  it('on the first edge under its middle that it comes down onto', () => {
    expect(landingEdge(sections, { left: 100, foot: 50 }, allClear)?.id).toBe('Oscillators');
    expect(landingEdge(sections, { left: 500, foot: 300 }, allClear)?.id).toBe('LFOs');
  });

  it('an edge it is just over, by a pixel, still catches it; one above it does not', () => {
    expect(landingEdge(sections, { left: 100, foot: 101 }, allClear)?.id).toBe('Oscillators');
    expect(landingEdge(sections, { left: 100, foot: 102 }, allClear)?.id).toBe('Amp');
  });

  it('its middle, not its box, says which edge is under it', () => {
    // Its box from 391 to 435: its middle, at 400, over the Oscillators' right end; a pixel on, over the Filter.
    const anywhere = () => [{ min: 0, max: 800 }];
    expect(landingEdge(sections, { left: 391, foot: 50 }, anywhere)?.id).toBe('Oscillators');
    expect(landingEdge(sections, { left: 392, foot: 50 }, anywhere)?.id).toBe('Filter');
  });

  it('passes through an edge covered where it comes down, a step either side, onto the next (issues 164 and 181)', () => {
    const covered = (e: { id: string; box: { left: number; right: number } }) => (e.id === 'Oscillators' ? [{ min: 200, max: 356 }] : allClear(e));
    expect(landingEdge(sections, { left: 100, foot: 50 }, covered)?.id).toBe('Amp');
    expect(landingEdge(sections, { left: 196, foot: 50 }, covered)?.id).toBe('Oscillators');
  });

  it('with no edge under it, nowhere', () => {
    expect(landingEdge(sections, { left: 100, foot: 600 }, allClear)).toBeNull();
  });
});

describe('which edge it is on, in three and four across (issues 115, 141, 164 and 192)', () => {
  // Four across: the sections side by side, the top right one a little lower than the others, within 4 px.
  const across = [edge('Oscillators', 0, 300, 100), edge('Filter', 300, 600, 100), edge('Amp', 600, 900, 100), edge('LFOs', 900, 1200, 102)];
  // Two over two: the top row and the row under it.
  const stacked = [edge('Oscillators', 0, 600, 100), edge('Filter', 600, 1200, 100), edge('Amp', 0, 600, 500), edge('LFOs', 600, 1200, 500)];
  const ids = (list: readonly string[]) => (e: { id: string }) => list.includes(e.id);
  const everywhere = () => true;
  const choose = (over: Partial<Parameters<typeof perchAcross>[0]>) =>
    perchAcross({ edges: stacked, home: stacked[1], visit: null, card: null, at: { left: 700, foot: 100 }, inView: everywhere, clear: everywhere, seen: everywhere, ...over });

  it('its home: the top right section, its top row within 4 px', () => {
    expect(homeEdge(across).id).toBe('LFOs');
    expect(homeEdge(stacked).id).toBe('Filter');
  });

  it('stands on its home edge', () => {
    expect(choose({})).toEqual({ on: stacked[1], perch: { id: 'Filter', foot: 100, hovering: false } });
  });

  it('on a visit, on the edge it visits', () => {
    expect(choose({ visit: 'Amp' }).perch).toEqual({ id: 'Amp', foot: 500, hovering: false });
  });

  it('its edge covered, the nearest edge in view and clear, from where it is (issue 164)', () => {
    const clear = ids(['Oscillators', 'Amp', 'LFOs']);
    expect(choose({ clear }).perch.id).toBe('Oscillators');
    expect(choose({ clear, at: { left: 1000, foot: 450 } }).perch.id).toBe('LFOs');
    expect(choose({ clear, inView: ids(['Amp']) }).perch.id).toBe('Amp');
  });

  it('with every edge covered, the docked card’s top, if it is clear (issue 164)', () => {
    const card = edge('card', 200, 800, 300);
    expect(choose({ card, clear: ids(['card']), inView: () => false }).perch).toEqual({ id: 'card', foot: 300, hovering: false });
    expect(choose({ card, clear: () => false, inView: () => false }).perch.id).toBe('Filter');
  });

  it('nowhere clear, under a cover all along its edge, it waits out of sight behind it (issue 192)', () => {
    expect(choose({ clear: () => false, inView: () => false, seen: () => false }).perch).toEqual({ id: 'Filter', foot: 100, hovering: false, waiting: true });
    // Only text over its edge: it stands there all the same.
    expect(choose({ clear: () => false, inView: () => false }).perch).toEqual({ id: 'Filter', foot: 100, hovering: false });
  });
});

describe('when a visit or a ride is due (issues 141 and 197)', () => {
  const quiet = { visit: false, now: 30, next: 20, guided: false, reduced: false, leaving: false, doing: false, moving: 'standing' as const, stacked: false };

  it('its time come, standing on its edge with nothing else under way', () => {
    expect(visitDue(quiet)).toBe(true);
    expect(visitDue({ ...quiet, now: 19 })).toBe(false);
  });

  it('not on a visit already, pointing the way, with reduced motion, sent away, nor in a funny turn (the owner, 2026-10-30)', () => {
    for (const not of [{ visit: true }, { guided: true }, { reduced: true }, { leaving: true }, { doing: true }]) expect(visitDue({ ...quiet, ...not })).toBe(false);
  });

  it('not on its way between lines; hovering, only on a phone and in 2 × 2, where it rides from its hover line too', () => {
    for (const moving of ['falling', 'flying', 'landing', 'held', 'thrown', 'sliding', 'clinging'] as const) {
      expect(visitDue({ ...quiet, moving })).toBe(false);
      expect(visitDue({ ...quiet, moving, stacked: true })).toBe(false);
    }
    expect(visitDue({ ...quiet, moving: 'hovering' })).toBe(false);
    expect(visitDue({ ...quiet, moving: 'hovering', stacked: true })).toBe(true);
  });
});

describe('when the next visit or ride comes, in seconds from now (issues 141 and 197)', () => {
  const at = (r: number) => () => r;

  it('at first, and after pointing the way: 15 to 35 seconds on, on every layout', () => {
    for (const stacked of [false, true]) {
      expect(nextVisitAt(100, 'first', stacked, at(0))).toBe(115);
      expect(nextVisitAt(100, 'first', stacked, at(1))).toBe(135);
    }
  });

  it('after a visit or a ride: 20 to 40 seconds on; on a phone and in 2 × 2, 15 to 40', () => {
    expect([nextVisitAt(100, 'after', false, at(0)), nextVisitAt(100, 'after', false, at(1))]).toEqual([120, 140]);
    expect([nextVisitAt(100, 'after', true, at(0)), nextVisitAt(100, 'after', true, at(1))]).toEqual([115, 140]);
  });

  it('with nowhere to go: 10 to 20 seconds on; on a phone and in 2 × 2, 15 to 40', () => {
    expect([nextVisitAt(100, 'nowhere', false, at(0)), nextVisitAt(100, 'nowhere', false, at(1))]).toEqual([110, 120]);
    expect([nextVisitAt(100, 'nowhere', true, at(0)), nextVisitAt(100, 'nowhere', true, at(1))]).toEqual([115, 140]);
  });

  it('a visit or a ride lasts 8 to 18 seconds', () => {
    expect(visitFor({ id: 'Amp' }, 100, at(0))).toEqual({ id: 'Amp', until: 108 });
    expect(visitFor({ id: 'ride 2', ride: 2 }, 100, at(1))).toEqual({ id: 'ride 2', ride: 2, until: 118 });
  });
});

describe('looking for the LFO plots, only when it may ride or surf one, so a frame costs no more at home (issues 141 and 204)', () => {
  const home = { demo: false, rides: 1, visit: null, now: 10, next: 20 };

  it('through a Demo part, always', () => {
    expect(looksForPlots({ ...home, demo: true, rides: 0 })).toBe(true);
  });

  it('outside the Demo, with an LFO to ride: on a ride, or with a visit due', () => {
    expect(looksForPlots(home)).toBe(false);
    expect(looksForPlots({ ...home, now: 20 })).toBe(true);
    expect(looksForPlots({ ...home, visit: { id: 'ride 1', ride: 1, until: 30 } })).toBe(true);
    expect(looksForPlots({ ...home, now: 20, visit: { id: 'Amp', until: 30 } })).toBe(false);
  });

  it('with no LFO to ride, never', () => {
    expect(looksForPlots({ ...home, rides: 0, now: 20 })).toBe(false);
  });
});

describe('the plot it rides or surfs (issues 141, 197 and 204)', () => {
  const plots = [{ lfo: 2 as const }, { lfo: 1 as const }];
  const riding = { visit: { id: 'ride 1', ride: 1 as const, until: 30 }, rideable: plots, plots, act: null, reduced: false, moving: 'standing' as const, doing: false };

  it('on a ride, the plot of its LFO, while that is one to ride and in view', () => {
    expect(ridePlot(riding)).toEqual({ ride: plots[1], plot: plots[1], surfing: true });
    expect(ridePlot({ ...riding, rideable: [plots[0]] })).toEqual({ ride: undefined, plot: undefined, surfing: false });
  });

  it('surfing in the Demo, the first plot in view of an LFO that is on (the owner, 2026-10-30)', () => {
    expect(ridePlot({ ...riding, visit: null, act: 'surf' })).toEqual({ ride: undefined, plot: plots[0], surfing: true });
    expect(ridePlot({ ...riding, visit: null, act: 'conduct' })).toEqual({ ride: undefined, plot: undefined, surfing: false });
  });

  it('not on it with reduced motion, held or thrown', () => {
    for (const not of [{ reduced: true }, { moving: 'held' as const }, { moving: 'thrown' as const }]) expect(ridePlot({ ...riding, ...not }).surfing).toBe(false);
  });

  it('a funny turn under way keeps it off a Demo plot, not off its ride, where the turn plays', () => {
    expect(ridePlot({ ...riding, doing: true }).surfing).toBe(true);
    expect(ridePlot({ ...riding, visit: null, act: 'surf', doing: true }).surfing).toBe(false);
  });
});

describe('pointing the way: to the control’s side, by its edge first (issue 151)', () => {
  // Beside a control, on its left, facing it; its Section's edge clear from 100 to 400.
  const cling = { side: 'left' as const, turn: 1 as const, left: 200, foot: 300 };
  const away = { cling, edge: [{ min: 100, max: 400 }], moving: 'standing' as const, sameSection: false, sameControl: false, onSection: false, left: 600 };

  it('first, its usual move to the Section’s edge, over the control, or the nearest it may be there', () => {
    expect(clingMove(away)).toEqual({ edge: 200 });
    expect(clingMove({ ...away, edge: [{ min: 260, max: 400 }] })).toEqual({ edge: 260 });
  });

  it('on that edge, at its spot, down the panel to the control’s side', () => {
    expect(clingMove({ ...away, onSection: true, left: 201 })).toBe('cling');
    expect(clingMove({ ...away, onSection: true, left: 202 })).toEqual({ edge: 200 });
    expect(clingMove({ ...away, onSection: true, left: 200, moving: 'landing' })).toEqual({ edge: 200 });
  });

  it('beside a control of the same Section, or sliding to this one, straight across to it', () => {
    expect(clingMove({ ...away, moving: 'clinging', sameSection: true })).toBe('cling');
    expect(clingMove({ ...away, moving: 'sliding', sameControl: true })).toBe('cling');
    expect(clingMove({ ...away, moving: 'clinging' })).toEqual({ edge: 200 });
  });

  it('with no edge for it in reach, straight to the control from where it settled', () => {
    expect(clingMove({ ...away, edge: [] })).toBe('cling');
    expect(clingMove({ ...away, edge: [], moving: 'hovering' })).toBe('cling');
    expect(clingMove({ ...away, edge: [], moving: 'clinging' })).toBe('cling');
    expect(clingMove({ ...away, edge: [], moving: 'falling' })).toBeNull();
  });

  it('beside the last control while the next is out of reach, only if it need not turn round to look at it (issue 210)', () => {
    expect(staysBeside(cling, 400)).toBe(true);
    expect(staysBeside(cling, 100)).toBe(false);
    expect(staysBeside({ ...cling, side: 'right', turn: -1 }, 100)).toBe(true);
    // Its middle, at 209, the line between.
    expect(staysBeside(cling, 209)).toBe(true);
    expect(staysBeside(cling, 208.9)).toBe(false);
    expect(staysBeside(cling, null)).toBe(true);
  });
});
