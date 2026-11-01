import { describe, expect, it } from 'vitest';
import { type Bead, beadAfter, beadOnArrival } from './beadPresence';

const through = (bead: Bead, ...events: Parameters<typeof beadAfter>[1][]) => events.reduce(beadAfter, bead);

describe('Bead out by default (issue 150)', () => {
  it('comes in by itself on a visit with it on, once', () => {
    const arrived = through(beadOnArrival('on'), 'entrance');
    expect(arrived).toMatchObject({ presence: 'up', switch: 'on' });
    expect(through(arrived, 'notes', 'gone', 'entrance').presence).toBe('away');
  });

  it('stays away on a visit with it switched off', () => {
    expect(through(beadOnArrival('off'), 'entrance')).toMatchObject({ presence: 'away', switch: 'off' });
  });

  it('with the switch on, B, E, A, D sends it away and calls it back for the visit, the switch staying on', () => {
    const sent = through(beadOnArrival('on'), 'entrance', 'notes');
    expect(sent).toMatchObject({ presence: 'leaving', switch: 'on' });
    expect(through(sent, 'gone')).toMatchObject({ presence: 'away', switch: 'on' });
    expect(through(sent, 'gone', 'entrance').presence).toBe('away');
    expect(through(sent, 'gone', 'notes')).toMatchObject({ presence: 'up', switch: 'on' });
    expect(through(beadOnArrival('on'), 'notes')).toMatchObject({ presence: 'up', switch: 'on' });
  });

  it('with the switch off, it never appears: the Notes do nothing, until the switch is turned on', () => {
    const off = beadOnArrival('off');
    expect(through(off, 'notes')).toMatchObject({ presence: 'away', switch: 'off' });
    expect(through(off, 'notes', 'entrance', 'notes', 'notes')).toMatchObject({ presence: 'away', switch: 'off' });
    const switchedOff = through(beadOnArrival('on'), 'entrance', 'switch off', 'gone');
    expect(through(switchedOff, 'notes')).toMatchObject({ presence: 'away', switch: 'off' });
    expect(through(switchedOff, 'notes', 'switch on')).toMatchObject({ presence: 'up', switch: 'on' });
  });

  it('while it melts, the Notes do nothing', () => {
    expect(through(beadOnArrival('on'), 'entrance', 'notes', 'notes')).toMatchObject({ presence: 'leaving', switch: 'on' });
  });

  it('once the Notes or the switch have had their say, it no longer comes by itself', () => {
    expect(through(beadOnArrival('on'), 'notes', 'notes', 'gone', 'entrance').presence).toBe('away');
    expect(through(beadOnArrival('on'), 'switch off', 'switch on', 'gone', 'entrance').presence).toBe('up');
    expect(through(beadOnArrival('on'), 'switch off', 'entrance').presence).toBe('away');
  });

  it("Display's switch sends it away and brings it up; switched back on while it melts, it comes back up", () => {
    const off = through(beadOnArrival('on'), 'entrance', 'switch off');
    expect(off).toMatchObject({ presence: 'leaving', switch: 'off' });
    expect(through(off, 'gone', 'switch on')).toMatchObject({ presence: 'up', switch: 'on' });
    expect(through(off, 'switch on')).toMatchObject({ presence: 'leaving', switch: 'on' });
    expect(through(off, 'switch on', 'gone')).toMatchObject({ presence: 'up', switch: 'on', comebacks: 1 });
    expect(through(off, 'gone', 'switch on').comebacks).toBe(0); // up from away: a new Bead anyway
  });
});
