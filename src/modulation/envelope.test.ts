import { describe, expect, it } from 'vitest';
import { type AutomationStep, DIP, envelopeLevel, envelopeSchedule, type GateEvent } from './envelope';

const adsr = { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.3 };
const on = (time: number, peak = 1): GateEvent => ({ time, on: true, adsr, peak });
const off = (time: number): GateEvent => ({ time, on: false, adsr, peak: 1 });

describe('envelopeLevel', () => {
  it('is silent before the Gate ever opens', () => {
    expect(envelopeLevel([], 1)).toBe(0);
    expect(envelopeLevel([on(1)], 0.5)).toBe(0);
  });

  it('reaches 95% of its peak at the end of Attack (an analogue-style curve)', () => {
    expect(envelopeLevel([on(0)], 0.1)).toBeCloseTo(1 - Math.exp(-3), 6);
  });

  it('settles at Sustain while the Gate stays open', () => {
    expect(envelopeLevel([on(0)], 3)).toBeCloseTo(0.5, 3);
  });

  it('scales with the peak (Velocity)', () => {
    expect(envelopeLevel([on(0, 0.6)], 3)).toBeCloseTo(0.3, 3);
  });

  it('fades to nearly silent one Release time after the Gate closes', () => {
    const events = [on(0), off(2)];
    expect(envelopeLevel(events, 2 + 0.3) / envelopeLevel(events, 2)).toBeCloseTo(Math.exp(-6), 6);
  });

  it('releases from wherever it was when the Gate closes mid-Attack, without jumping', () => {
    const events = [on(0), off(0.05)];
    expect(envelopeLevel(events, 0.05 + 1e-9)).toBeCloseTo(envelopeLevel([on(0)], 0.05), 6);
  });

  it('retriggers from wherever it was mid-Release, without jumping to zero', () => {
    const events = [on(0), off(1), on(1.1)];
    const before = envelopeLevel([on(0), off(1)], 1.1);
    expect(before).toBeGreaterThan(0.05);
    expect(envelopeLevel(events, 1.1 + 1e-9)).toBeCloseTo(before, 6);
  });

  it('dips in a straight line to silence over DIP, from wherever it was, and attacks from silence after it (issue 102)', () => {
    const dip: GateEvent = { time: 1, on: false, adsr, peak: 0, dip: true };
    const events = [on(0), off(0.8), dip, on(1 + DIP)];
    const before = envelopeLevel([on(0), off(0.8)], 1);
    expect(envelopeLevel(events, 1 + DIP / 4)).toBeCloseTo(before * 0.75, 9);
    expect(envelopeLevel(events, 1 + DIP)).toBeCloseTo(0, 12);
    expect(envelopeLevel(events, 1 + DIP + 0.1)).toBeCloseTo(envelopeLevel([on(0)], 0.1), 9);
  });
});

describe('a dip’s schedule', () => {
  it('sets the level it starts from outright, then ramps to silence at the end of the dip (issue 102)', () => {
    expect(envelopeSchedule({ time: 1, on: false, adsr, peak: 0, dip: true }, 0.4)).toEqual([
      { kind: 'cancelAndSet', time: 1, value: 0.4 },
      { kind: 'linearRamp', time: 1 + DIP, target: 0 },
    ]);
  });
});

/**
 * An independent, sample-by-sample model of how Web Audio runs the schedule (setTargetAtTime and
 * cancelAndHoldAtTime), to check that what the engine plays is what the model draws.
 */
function simulate(stepsAt: AutomationStep[][], until: number, dt = 1e-4) {
  let pending: AutomationStep[] = [];
  let value = 0;
  let active: Extract<AutomationStep, { kind: 'setTarget' }> | undefined;
  const values: { t: number; v: number }[] = [];
  let next = 0;
  for (let t = 0; t <= until; t += dt) {
    while (next < stepsAt.length && stepsAt[next][0].time <= t + dt / 2) {
      const [cancel, ...targets] = stepsAt[next++];
      pending = pending.filter((s) => s.time < cancel.time); // cancelAndHold drops later events
      active = undefined; // and holds the current value
      pending.push(...targets);
    }
    for (const s of pending) if (s.kind === 'setTarget' && s.time <= t && (!active || s.time >= active.time)) active = s;
    if (active) value = active.target + (value - active.target) * Math.exp(-dt / active.timeConstant);
    values.push({ t, v: value });
  }
  return (t: number) => values[Math.round(t / dt)].v;
}

describe('envelopeSchedule', () => {
  it('plays back exactly the envelope the model draws, through press, release and retrigger', () => {
    const events = [on(0.01), off(0.6), on(0.75, 0.8), off(1.4)];
    const played = simulate(
      events.map((e) => envelopeSchedule(e)),
      2,
    );
    for (const t of [0.05, 0.11, 0.3, 0.6, 0.7, 0.8, 1.0, 1.5, 1.9]) {
      expect(played(t), `t = ${t}`).toBeCloseTo(envelopeLevel(events, t), 2);
    }
  });
});
