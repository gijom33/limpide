export interface Adsr {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

/** A Gate opening or closing, with the Envelope settings in force at that moment. */
export interface GateEvent {
  time: number;
  on: boolean;
  adsr: Adsr;
  /** Level the Attack heads for (Velocity for the Amp Envelope, 1 for the Filter Envelope). */
  peak: number;
  /** A Gate off that dips (issue 102) rather than releasing: the Amp Envelope's, before a Note on a Voice still sounding. */
  dip?: boolean;
}

/**
 * How long a dip lasts (issue 102): a Voice still sounding falls in a straight line to silence over it before a new
 * Note restarts its Oscillators, so the restart finds it silent and does not click. Too short to hear as a gap; the
 * Note starts this much later. Straight rather than curved: exactly silent at its end, and never steeper than it must.
 */
export const DIP = 0.003;

export type AutomationStep =
  | { kind: 'cancelAndHold'; time: number }
  | { kind: 'cancelAndSet'; time: number; value: number }
  | { kind: 'linearRamp'; time: number; target: number }
  | { kind: 'setTarget'; time: number; target: number; timeConstant: number };

// Analogue-style (RC) curves: 95% of the way there at the end of Attack (e^−3), and Decay/Release
// time constants chosen so each stage has visibly finished by its nominal time.
const ATTACK_SHARPNESS = 3;
const DECAY_SHARPNESS = 4;
const RELEASE_SHARPNESS = 6;

function levelWithin(e: GateEvent, start: number, elapsed: number): number {
  const { attack, decay, sustain, release } = e.adsr;
  if (!e.on && e.dip) return start * Math.max(0, 1 - elapsed / DIP);
  if (!e.on) return start * Math.exp((-elapsed * RELEASE_SHARPNESS) / release);
  const approach = (from: number, to: number, t: number, tau: number) => to + (from - to) * Math.exp(-t / tau);
  if (elapsed <= attack) return approach(start, e.peak, elapsed, attack / ATTACK_SHARPNESS);
  const afterAttack = approach(start, e.peak, attack, attack / ATTACK_SHARPNESS);
  return approach(afterAttack, sustain * e.peak, elapsed - attack, decay / DECAY_SHARPNESS);
}

/** The level at `time`, a Gate event having started from `start`, while it is the latest event. */
export const levelAfter = (e: GateEvent, start: number, time: number) => levelWithin(e, start, time - e.time);

/** The Envelope's level at `time`, given every Gate event so far (in time order). */
export function envelopeLevel(events: readonly GateEvent[], time: number): number {
  let level = 0;
  for (let i = 0; i < events.length && events[i].time <= time; i++) {
    const end = i + 1 < events.length && events[i + 1].time <= time ? events[i + 1].time : time;
    level = levelAfter(events[i], level, end);
  }
  return level;
}

/**
 * The AudioParam automation that plays exactly what envelopeLevel describes. Each step starts from the held
 * current value, so a retrigger or early release never jumps (ADR-0003: one model for picture and sound). A dip
 * sets the level it starts from, `start` (the model's), outright: Chromium starts a ramp after a hold from the wrong
 * place, at once at its target.
 */
export function envelopeSchedule(e: GateEvent, start = 0): AutomationStep[] {
  const { attack, decay, sustain, release } = e.adsr;
  const hold: AutomationStep = { kind: 'cancelAndHold', time: e.time };
  if (!e.on && e.dip) return [{ kind: 'cancelAndSet', time: e.time, value: start }, { kind: 'linearRamp', time: e.time + DIP, target: 0 }];
  if (!e.on) return [hold, { kind: 'setTarget', time: e.time, target: 0, timeConstant: release / RELEASE_SHARPNESS }];
  return [
    hold,
    { kind: 'setTarget', time: e.time, target: e.peak, timeConstant: attack / ATTACK_SHARPNESS },
    { kind: 'setTarget', time: e.time + attack, target: sustain * e.peak, timeConstant: decay / DECAY_SHARPNESS },
  ];
}
