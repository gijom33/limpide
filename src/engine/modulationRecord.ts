import { type GateEvent, levelAfter } from '../modulation/envelope';
import { type BeatGrid, createLfoClock, glideFrom, lfoShape } from '../modulation/lfo';
import {
  effectiveCutoff, effectiveResonance, effectiveVolume, glidedPressure, lfoOffset, type Modulation, NO_PRESSURE, PRESSURE_GLIDE, type Pressure,
  pressed, pressurePitch, soundingPitch,
} from '../modulation/modulationModel';
import { bandwidthOctaves } from '../modulation/passBand';
import { A4_HZ, A4_MIDI, frequencyToNote, noteToFrequency } from '../music/pitch';
import { TEMPO } from '../music/tempo';
import { type LfoNumber, lfos, PARAMS, type Patch } from '../patch/patch';
import { filterStages } from './filterDesign';

/**
 * The record the engine keeps of what it played (issue 244), which every "at time t" question is answered from: the
 * newest Note's Gates with their dips and its pitches with their Glide, the Patches in force, the bend, aftertouch and
 * its glide, each LFO's clock, the tempo, and a pause's carry. The engine schedules the sound and records into it as it
 * goes; nothing here touches audio, so it is tested on its own (ADR-0003: the model mirrors the graph).
 */

// The record is kept by age, not count, so the Timeline's past never changes however busily knobs turn: well beyond
// its few seconds, so a Freeze can be held a while. A count cap still bounds memory.
const MODEL_SECONDS = 30;
const MODEL_LIMIT = 4096;

/**
 * Add an entry to a history (the record's, or a Voice's own pitches), first dropping any later than it: a Gate or a Note handed over ahead of the clock (the
 * Hold rhythm) is cancelled by one that comes earlier, as `cancelAndHoldAtTime` cancels it in the sound.
 */
export function append<T extends { time: number }>(entries: T[], entry: T) {
  while (entries.length && entries[entries.length - 1].time > entry.time) entries.pop();
  entries.push(entry);
}

/** The index of the last entry at or before `t`, −1 if none: a binary search (the entries are in time order). */
export function lastAt(entries: readonly { time: number }[], t: number): number {
  let lo = -1;
  let hi = entries.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (entries[mid].time <= t) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Drop entries older than the record keeps, always keeping the one in force at the oldest kept time. */
function trim<T extends { time: number }>(entries: T[], now: number) {
  const oldest = now - MODEL_SECONDS;
  let drop = 0;
  while (drop + 1 < entries.length && entries[drop + 1].time <= oldest) drop++;
  if (entries.length - drop > MODEL_LIMIT) drop = entries.length - MODEL_LIMIT;
  if (drop) entries.splice(0, drop);
}

/** A Gate event in a history, with the Envelope's level when it came. */
export type GateRecord = GateEvent & { start: number };

/**
 * One Envelope's Gate events, each keeping the level it starts from, so a past moment's level is one search away rather
 * than a replay (the Timeline asks for every column, every frame, issue 45). Trimmed by age as it is added to.
 */
export function createGateHistory() {
  const events: GateRecord[] = [];
  return {
    /** Record a Gate event (cancelling any later), and give it back with the level it starts from. */
    record(e: GateEvent): GateRecord {
      const entry = { ...e, start: 0 };
      append(events, entry);
      const previous = events[events.length - 2];
      if (previous) entry.start = levelAfter(previous, previous.start, entry.time);
      trim(events, e.time);
      return entry;
    },
    /** The Envelope's level at `t` (0 before any event). */
    levelAt(t: number) {
      const i = lastAt(events, t);
      return i < 0 ? 0 : levelAfter(events[i], events[i].start, t);
    },
    /** The latest event at or before `t`, and the latest Gate on at or before it (the Note's Velocity and start). */
    at(t: number): { latest?: GateRecord; opened?: GateRecord } {
      let i = lastAt(events, t);
      const latest = events[i];
      while (i >= 0 && !events[i].on) i--;
      return { latest, opened: events[i] };
    },
  };
}

export function createModulationRecord(start: number) {
  // The newest Note's pitches, each keeping where its slide starts from (frequency and Note).
  const pitches: { time: number; frequency: number; note: number; glide: number; from: number; fromNote: number }[] = [];
  // Patches in force over time, so past moments use the Cutoff and Amount of their time.
  const patches: { time: number; patch: Patch }[] = [];
  const amp = createGateHistory();
  const filter = createGateHistory();
  // The pitch bend over time, in cents.
  const bends: { time: number; cents: number }[] = [];
  // Aftertouch over time (issue 132): each pressure as it came, and the amount its glide started from (issue 219).
  const pressures: { time: number; pressure: Pressure; from: number }[] = [];
  // Each LFO's phase, advanced with every Rate change and restart exactly as its oscillator is (ADR-0003).
  const lfoClocks = [createLfoClock(start, PARAMS.lfoRate.default), createLfoClock(start, PARAMS.lfo2Rate.default)] as const;
  // The tempo synced LFOs follow (issue 112).
  let tempo: BeatGrid = { bpm: TEMPO.default, origin: start };
  // From when the past was last carried on by a pause (issue 216).
  let carriedAt = -Infinity;

  const bendAt = (t: number) => {
    const i = lastAt(bends, t);
    return i >= 0 ? bends[i].cents : 0;
  };
  /** Where aftertouch's glide has reached at `t`. */
  const pressureAt = (t: number) => {
    const i = lastAt(pressures, t);
    return i >= 0 ? glidedPressure(pressures[i].from, pressures[i].pressure, t - pressures[i].time) : NO_PRESSURE;
  };
  /**
   * Where the newest Note's slide has reached at `t`, through its Glide, in Hz (`frequency`) or in semitones (`note`):
   * before the first Note, the first Note's; with none, `none`.
   */
  const slideAt = (t: number, [to, from]: readonly ['frequency', 'from'] | readonly ['note', 'fromNote'], none: number) => {
    const i = lastAt(pitches, t);
    if (i < 0) return pitches[0]?.[to] ?? none;
    const p = pitches[i];
    return glideFrom(p[from], p[to], p.glide, t - p.time);
  };
  /** The newest Note's frequency at `t`, through its Glide (none: 0). */
  const glidingAt = (t: number) => slideAt(t, ['frequency', 'from'], 0);
  /** The Note Key Track follows at `t`: the same slide as the Oscillators, in semitones (none: A4). */
  const trackedNoteAt = (t: number) => slideAt(t, ['note', 'fromNote'], A4_MIDI);
  /** The Patch in force at `t` (before the first, the first). */
  const patchAt = (t: number) => (patches.length ? patches[Math.max(0, lastAt(patches, t))].patch : undefined);
  /** Both LFOs' values at `t`, under the Patch then in force. */
  const lfoValues = (then: Patch, t: number): [number, number] => {
    const [one, two] = lfos(then);
    return [lfoShape(one.waveform, lfoClocks[0].phaseAt(t)), lfoShape(two.waveform, lfoClocks[1].phaseAt(t))];
  };

  return {
    /** The newest Note's Amp Envelope Gate events, its dips and All Sound Off's cut among them. */
    amp,
    /** The newest Note's Filter Envelope Gate events. */
    filter,
    /** LFO `i` (0 for LFO 1) runs at `rate` from `t`, as the engine sets its oscillators to. */
    recordLfoRate(i: number, t: number, rate: number) {
      lfoClocks[i].setRate(t, rate);
    },
    /** LFO `i`'s cycle starts again at `t` (a Note, when it retriggers; a lock onto the beat), at phase `start`. */
    recordLfoRestart(i: number, t: number, start: number) {
      lfoClocks[i].restart(t, start);
    },
    /** LFO `i`'s restarts after `t` are called off (a Gate off before their Notes): its cycle runs on through them. */
    cancelLfoRestarts(i: number, t: number) {
      lfoClocks[i].cancelAfter(t);
    },
    /** LFO `i`'s Rate changes after `t` are called off (a pull onto the beat cut short, issue 112): restarts stay. */
    cancelLfoRates(i: number, t: number) {
      lfoClocks[i].cancelRatesAfter(t);
    },
    /** LFO `i`'s phase (0–1) at `t`. */
    lfoPhaseAt: (i: number, t: number) => lfoClocks[i].phaseAt(t),

    /** The Patch in force from `t` (one at the same moment replaces it: the clock standing still). */
    recordPatch(t: number, patch: Patch) {
      if (patches.at(-1)?.time === t) patches.pop();
      patches.push({ time: t, patch });
      trim(patches, t);
      for (const clock of lfoClocks) clock.forgetBefore(t - MODEL_SECONDS);
    },
    /** Whether any Note's pitch has been recorded: the first Note has nothing to glide from. */
    hasPitch: () => pitches.length > 0,
    /** The newest Note moves to `note` at `t`, over `glide` seconds (0: at once) from where the last slide has reached. */
    recordPitch(t: number, note: number, glide: number) {
      const entry = { time: t, frequency: noteToFrequency(note), note, glide, from: noteToFrequency(note), fromNote: note };
      append(pitches, entry);
      const previous = pitches[pitches.length - 2];
      if (previous) {
        entry.from = glideFrom(previous.from, previous.frequency, previous.glide, t - previous.time);
        entry.fromNote = glideFrom(previous.fromNote, previous.note, previous.glide, t - previous.time);
      }
      trim(pitches, t);
    },
    /** The bend wheel at `cents` from `t`. */
    recordBend(t: number, cents: number) {
      append(bends, { time: t, cents });
      trim(bends, t);
    },
    bendAt,
    /**
     * Aftertouch at `pressure` from `t` (issue 219): it glides from where it has reached, as the bend wheel moves Pitch;
     * moved to another Destination while pressed, it starts there at once. Gives the glide's time constant, if it glides.
     */
    recordPressure(t: number, pressure: Pressure): number | undefined {
      const was = pressureAt(t);
      const glide = pressure.destination === was.destination || !was.amount ? PRESSURE_GLIDE : undefined;
      append(pressures, { time: t, pressure, from: glide ? was.amount : pressure.amount });
      trim(pressures, t);
      return glide;
    },
    pressureAt,
    /** The pressure last sent at or before `t`, where its glide is going. */
    pressureTo(t: number) {
      const i = lastAt(pressures, t);
      return i >= 0 ? pressures[i].pressure : NO_PRESSURE;
    },
    /** The tempo synced LFOs follow from now: `bpm`, its beats counted from `origin`. */
    setTempo(bpm: number, origin: number) {
      tempo = { bpm, origin };
    },
    tempo: () => tempo,

    /**
     * Back from a pause of `seconds`, at `t` (issue 216): each LFO's history and the beat move back by it, so the phase
     * now is the one shown at the end of the pause. Nothing sounded through it, so the Envelopes, Notes and Patches stay
     * where they were. The past is settled from here only.
     */
    carryOn(seconds: number, t: number) {
      tempo = { bpm: tempo.bpm, origin: tempo.origin - seconds };
      for (const clock of lfoClocks) clock.shift(-seconds);
      carriedAt = t;
    },
    /**
     * From when the past stays as it is (issue 215): it is only ever added to at or after now, but before the first
     * Patch and the first Note they stand in for what came before, and a pause carries the LFOs' past on. Infinity
     * before either.
     */
    settledFrom: () => (patches.length && pitches.length ? Math.max(patches[0].time, pitches[0].time, carriedAt) : Infinity),

    patchAt,
    /** The Modulation model at `t`, from the record. */
    modulationAt(t: number): Modulation {
      const filterLevel = filter.levelAt(t);
      const knobs = patchAt(t);
      const lfo: [number, number] = knobs ? lfoValues(knobs, t) : [0, 0];
      // The sound's Patch then: the knobs as aftertouch moved its Destination.
      const pressure = pressureAt(t);
      const then = knobs && pressed(knobs, pressure);
      // The newest Note, while its Gate is open, and its Velocity (the Amp Envelope's peak) until the next Note.
      const { latest, opened } = amp.at(t);
      const velocity = opened?.peak ?? 0;
      const latestPitch = lastAt(pitches, t);
      const note = latestPitch >= 0 ? pitches[latestPitch].note : A4_MIDI;
      const gliding = frequencyToNote(glidingAt(t) || A4_HZ);
      const vibrato = then ? soundingPitch(then, gliding, lfo) - gliding : 0;
      const resonance = then ? effectiveResonance(then, lfo) : 0;
      return {
        amp: amp.levelAt(t),
        filter: filterLevel,
        lfo,
        cutoff: then ? effectiveCutoff(then, filterLevel, lfo, velocity, trackedNoteAt(t)) : 0,
        resonance,
        mode: then?.filterMode ?? 'lowpass',
        bandwidth: then ? bandwidthOctaves(filterStages(then.filterMode, then.filterSlope, resonance)[0].Q) : 1,
        volume: then ? effectiveVolume(then, lfo) : 1,
        sounding: latest?.on ? { note, velocity } : null,
        struck: opened ? opened.time : null,
        pitch: gliding + vibrato + pressurePitch(pressure) + bendAt(t) / 100,
        vibrato,
        pressure,
      };
    },
    /**
     * The newest Note's frequency at `t` through its Glide, at Osc 1's Octave, the bend and aftertouch on Pitch with it;
     * with `withVibrato`, the LFOs on Pitch too. With the Sub sounding, the sound repeats at the Sub's pitch, one or two
     * octaves lower: that is the fundamental.
     */
    fundamentalAt(t: number, { withVibrato }: { withVibrato: boolean }) {
      const then = patchAt(t);
      const pressure = pressureAt(t);
      const vibrato = withVibrato && then ? lfoOffset(pressed(then, pressure), 'pitch', lfoValues(then, t)) : 0;
      const cents = bendAt(t) + pressurePitch(pressure) * 100;
      const frequency = (glidingAt(t) || A4_HZ) * 2 ** ((then?.osc1Octave ?? 0) + vibrato / 12 + cents / 1200);
      return then?.mixSub ? frequency * 2 ** then.subOctave : frequency;
    },
    /** LFO `n`'s value times the Depth in force at `t` (−1 to 1). */
    lfoSwingAt(t: number, n: LfoNumber = 1) {
      const then = patchAt(t);
      if (!then) return 0;
      const l = lfos(then)[n - 1];
      // At Depth 0 the swing is 0 whatever the phase: the clock is not read (issue 257), as the plots ask every frame.
      return l.amount === 0 ? 0 : l.amount * lfoShape(l.waveform, lfoClocks[n - 1].phaseAt(t));
    },
  };
}
export type ModulationRecord = ReturnType<typeof createModulationRecord>;
