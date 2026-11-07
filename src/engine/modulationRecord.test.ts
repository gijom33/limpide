import { describe, expect, it } from 'vitest';
import { DIP, envelopeLevel, type GateEvent } from '../modulation/envelope';
import { PRESSURE_GLIDE } from '../modulation/modulationModel';
import { defaultPatch, type Patch } from '../patch/patch';
import { createModulationRecord, type ModulationRecord } from './modulationRecord';

// The record the engine keeps of what it played, asked as the Viewers ask it (issue 244). The engine's browser tests
// keep the checks that the sound and the record agree.

const patchOf = (knobs: Partial<Patch> = {}): Patch => ({ ...defaultPatch(), ...knobs });
const ampAdsr = (p: Patch) => ({ attack: p.ampAttack, decay: p.ampDecay, sustain: p.ampSustain, release: p.ampRelease });
const filterAdsr = (p: Patch) => ({ attack: p.filterAttack, decay: p.filterDecay, sustain: p.filterSustain, release: p.filterRelease });

/** A record holding `patch` from 0, its LFOs at their Rates, as the engine's first Patch leaves it. */
function recordOf(knobs: Partial<Patch> = {}) {
  const patch = patchOf(knobs);
  const record = createModulationRecord(0);
  record.recordLfoRate(0, 0, patch.lfoRate);
  record.recordLfoRate(1, 0, patch.lfo2Rate);
  record.recordPatch(0, patch);
  return { record, patch };
}

/** A Gate opening or closing on the newest Note, both Envelopes, as the engine records it. */
function gate(record: ModulationRecord, patch: Patch, time: number, on: boolean, velocity = 1) {
  record.amp.record({ time, on, adsr: ampAdsr(patch), peak: velocity });
  record.filter.record({ time, on, adsr: filterAdsr(patch), peak: 1 });
}

/** A Note at `time`: its pitch, then its Gate. */
function note(record: ModulationRecord, patch: Patch, time: number, n: number, velocity = 1, glide = 0) {
  record.recordPitch(time, n, glide);
  gate(record, patch, time, true, velocity);
}

describe('the Gates', () => {
  it('give the Envelope levels that replaying every Gate event from the start would, a dip included (issues 45 and 102)', () => {
    const { record, patch } = recordOf({ ampAttack: 0.05, ampDecay: 0.2, ampSustain: 0.6, ampRelease: 0.3, filterAttack: 0.01, filterDecay: 0.1, filterSustain: 0.3, filterRelease: 0.5 });
    const amp: GateEvent[] = [];
    const filter: GateEvent[] = [];
    // Notes that retrigger before the Release ends, and releases before the Decay ends: every segment starts mid-way.
    // Each Note but the first comes while the last still sounds: it dips first, and starts after the dip (issue 102).
    for (const [on, off, velocity] of [[0.1, 0.3, 1], [0.4, 0.45, 0.5], [0.5, 1.2, 0.8], [1.3, 1.31, 1]]) {
      const start = on === 0.1 ? on : on + DIP;
      const events: GateEvent[] = [
        ...(start === on ? [] : [{ time: on, on: false, adsr: ampAdsr(patch), peak: 0, dip: true }]),
        { time: start, on: true, adsr: ampAdsr(patch), peak: velocity },
        { time: off, on: false, adsr: ampAdsr(patch), peak: velocity },
      ];
      for (const e of events) record.amp.record(e);
      amp.push(...events);
      for (const [time, opens] of [[start, true], [off, false]] as const) {
        const e = { time, on: opens, adsr: filterAdsr(patch), peak: 1 };
        record.filter.record(e);
        filter.push(e);
      }
    }
    for (let t = 0; t < 2; t += 0.001) {
      const m = record.modulationAt(t);
      expect(m.amp).toBeCloseTo(envelopeLevel(amp, t), 9);
      expect(m.filter).toBeCloseTo(envelopeLevel(filter, t), 9);
    }
  });

  it('give back each event with the level it starts from (issue 45)', () => {
    const { record, patch } = recordOf({ ampAttack: 0.001, ampSustain: 1 });
    record.amp.record({ time: 0, on: true, adsr: ampAdsr(patch), peak: 0.5 });
    expect(record.amp.record({ time: 1, on: false, adsr: ampAdsr(patch), peak: 0.5 }).start).toBeCloseTo(0.5, 6);
  });

  it('a Gate earlier than events handed over ahead cancels them (Hold switched off mid-rhythm, issue 101)', () => {
    const { record, patch } = recordOf({ ampAttack: 0.005, ampSustain: 1, ampRelease: 0.1 });
    gate(record, patch, 0, true);
    gate(record, patch, 0.4, false);
    gate(record, patch, 0.5, true); // the next tap, handed over ahead…
    gate(record, patch, 0.8, false);
    gate(record, patch, 0.45, false); // …then the Gate closes before it
    const at = record.modulationAt(0.45).amp;
    for (const t of [0.5, 0.6, 0.8, 0.9]) {
      const m = record.modulationAt(t);
      expect(m.amp, `at ${t}`).toBeLessThan(at);
      expect(m.sounding, `at ${t}`).toBeNull();
    }
  });

  it('give the newest Note and its Velocity while its Gate is open, and when it was struck (issue 115)', () => {
    const { record, patch } = recordOf();
    expect(record.modulationAt(0).sounding).toBeNull();
    expect(record.modulationAt(0).struck).toBeNull();
    note(record, patch, 0.1, 72, 0.5);
    expect(record.modulationAt(0.2).sounding).toEqual({ note: 72, velocity: 0.5 });
    expect(record.modulationAt(0.2).struck).toBeCloseTo(0.1, 9);
    gate(record, patch, 0.3, false);
    expect(record.modulationAt(0.4).sounding).toBeNull(); // released: no Note is held any more
    expect(record.modulationAt(0.4).struck).toBeCloseTo(0.1, 9); // still the last Note struck
  });

  it('take a cut to silence over a dip (All Sound Off, issue 185), so the Timeline shows the level gone', () => {
    const { record, patch } = recordOf({ cutoff: 20000, ampAttack: 0.001, ampDecay: 0.01, ampRelease: 10 });
    note(record, patch, 0.05, 57);
    record.amp.record({ time: 0.5, on: false, adsr: ampAdsr(patch), peak: 0, dip: true });
    expect(record.modulationAt(0.45).amp).toBeGreaterThan(0.5);
    expect(record.modulationAt(0.5 + DIP / 2).amp).toBeGreaterThan(0);
    expect(record.modulationAt(0.5 + DIP).amp).toBe(0);
  });

  it('cost no more per moment after 600 Notes than after 10 (issue 45)', () => {
    const timeFor = (notes: number) => {
      const { record, patch } = recordOf({ glide: 0.05 });
      for (let i = 0; i < notes; i++) {
        note(record, patch, (i * 24) / notes, 48 + (i % 24), 0.8, 0.05);
        gate(record, patch, (i * 24) / notes + 12 / notes, false);
      }
      const frame = () => { for (let x = 0; x < 500; x++) record.modulationAt(24 + x / 500); };
      frame(); // warm up
      const start = performance.now();
      for (let i = 0; i < 20; i++) frame();
      return (performance.now() - start) / 20;
    };
    const few = Math.min(timeFor(10), timeFor(10));
    const many = Math.min(timeFor(600), timeFor(600));
    expect(many).toBeLessThan(few * 3 + 1);
  });
});

describe('the pitches and their Glide', () => {
  it('give the sounding pitch in semitones: the Note, sliding over the Glide to the next (issue 244)', () => {
    const { record, patch } = recordOf({ lfoAmount: 0 });
    note(record, patch, 0, 60);
    expect(record.modulationAt(0.2).pitch).toBeCloseTo(60);
    record.recordPitch(0.5, 72, 0.4);
    expect(record.modulationAt(0.5).pitch).toBeCloseTo(60);
    const sliding = record.modulationAt(0.6).pitch;
    expect(sliding).toBeGreaterThan(61);
    expect(sliding).toBeLessThan(71);
    expect(record.modulationAt(0.9).pitch).toBeCloseTo(72, 0); // there by the Glide time (98 % of the way)
  });

  it('slide on from where the last slide has reached, with no jump (issue 244)', () => {
    const { record, patch } = recordOf({ lfoAmount: 0 });
    note(record, patch, 0, 60);
    record.recordPitch(0.5, 72, 0.4);
    const reached = record.modulationAt(0.6).pitch;
    record.recordPitch(0.6, 48, 0.4);
    expect(record.modulationAt(0.6).pitch).toBeCloseTo(reached, 9);
    expect(record.modulationAt(0.7).pitch).toBeLessThan(reached);
  });

  it('slide the Note Key Track follows with them: the Cutoff an octave up per octave at 100 % (issue 244)', () => {
    const { record, patch } = recordOf({ cutoff: 1000, keyTrack: 1, lfoAmount: 0 });
    note(record, patch, 0, 60);
    expect(record.modulationAt(0.1).cutoff).toBeCloseTo(1000, 3);
    record.recordPitch(0.5, 72, 0.4);
    expect(record.modulationAt(0.5).cutoff).toBeCloseTo(1000, 3);
    const sliding = record.modulationAt(0.6).cutoff;
    expect(sliding).toBeGreaterThan(1100);
    expect(sliding).toBeLessThan(1900);
    expect(record.modulationAt(2).cutoff).toBeCloseTo(2000, 0);
  });

  it('give the first Note before it was played, and A4 before any (issue 215)', () => {
    const { record, patch } = recordOf();
    expect(record.hasPitch()).toBe(false);
    expect(record.modulationAt(0).pitch).toBeCloseTo(69, 9);
    note(record, patch, 1, 57);
    expect(record.hasPitch()).toBe(true);
    expect(record.modulationAt(0.5).pitch).toBeCloseTo(57, 9);
  });
});

describe('the fundamental', () => {
  it('is A4 before any Note, then the Note’s (issue 244)', () => {
    const { record, patch } = recordOf();
    expect(record.fundamentalAt(0, { withVibrato: false })).toBeCloseTo(440);
    note(record, patch, 0, 57);
    expect(record.fundamentalAt(0, { withVibrato: false })).toBeCloseTo(220);
  });

  it('stays on Osc 1, whatever Osc 2 is tuned to (issue 244)', () => {
    const { record, patch } = recordOf({ mixOsc2: 1, osc2Octave: 2, osc2Semitone: 5 });
    note(record, patch, 0, 57);
    expect(record.fundamentalAt(0, { withVibrato: false })).toBeCloseTo(220);
  });

  it('counts from Osc 1’s Octave, and from the Sub below it while it sounds (issues 90 and 91)', () => {
    const { record, patch } = recordOf({ osc1Octave: -1 });
    note(record, patch, 0, 57);
    expect(record.fundamentalAt(0.5, { withVibrato: false })).toBeCloseTo(110);
    record.recordPatch(1, patchOf({ osc1Octave: 1, mixSub: 0.5 }));
    expect(record.fundamentalAt(1.5, { withVibrato: false })).toBeCloseTo(220);
    record.recordPatch(2, patchOf({ mixSub: 1, subOctave: -2 }));
    expect(record.fundamentalAt(2.5, { withVibrato: false })).toBeCloseTo(55);
  });

  it('moves with the bend and aftertouch on Pitch; with vibrato asked for, with the LFOs on Pitch too (issues 52, 132 and 180)', () => {
    const { record, patch } = recordOf({ lfoDestination: 'pitch', lfoAmount: 1, lfoRate: 1, lfoWaveform: 'sawDown' });
    note(record, patch, 0, 57);
    // A quarter of the way into its cycle the falling saw is at −½: half a semitone flat.
    expect(record.fundamentalAt(0.25, { withVibrato: false })).toBeCloseTo(220, 6);
    expect(record.fundamentalAt(0.25, { withVibrato: true })).toBeCloseTo(220 * 2 ** (-0.5 / 12), 6);
    record.recordBend(0.5, 200);
    expect(record.fundamentalAt(0.6, { withVibrato: false })).toBeCloseTo(220 * 2 ** (200 / 1200), 6);
    record.recordPressure(1, { destination: 'pitch', amount: 1 });
    expect(record.fundamentalAt(1.5, { withVibrato: false })).toBeCloseTo(220 * 2 ** (300 / 1200), 6);
  });
});

describe('the LFOs', () => {
  it('on Pitch wobble the sounding pitch a semitone each way at full Depth; aimed elsewhere, not at all (issue 244)', () => {
    const swing = (destination: 'pitch' | 'cutoff') => {
      const { record, patch } = recordOf({ lfoDestination: destination, lfoAmount: 1, lfoRate: 5, lfoWaveform: 'triangle' });
      note(record, patch, 0, 60);
      const moments = Array.from({ length: 200 }, (_, i) => record.modulationAt(0.1 + i / 1000));
      // The vibrato on its own, so the piano can draw it apart from the Note: the pitch less the vibrato is the Note.
      for (const m of moments) expect(m.pitch - m.vibrato).toBeCloseTo(60);
      const pitches = moments.map((m) => m.pitch);
      return [Math.min(...pitches), Math.max(...pitches)];
    };
    const [lo, hi] = swing('pitch');
    expect(lo).toBeCloseTo(59, 1);
    expect(hi).toBeCloseTo(61, 1);
    expect(swing('cutoff')).toEqual([60, 60]);
  });

  it('swing by their value times the Depth in force, under the Patch of the moment (issue 244)', () => {
    const { record } = recordOf({ lfoAmount: 0.5, lfoRate: 1, lfoWaveform: 'square', lfo2Amount: 1, lfo2Rate: 1, lfo2Waveform: 'square' });
    expect(Math.abs(record.lfoSwingAt(0.1))).toBeCloseTo(0.5, 9);
    expect(Math.abs(record.lfoSwingAt(0.1, 2))).toBeCloseTo(1, 9);
    record.recordPatch(1, patchOf({ lfoAmount: 0 }));
    expect(record.lfoSwingAt(1.1)).toBe(0);
    expect(Math.abs(record.lfoSwingAt(0.1))).toBeCloseTo(0.5, 9); // the past keeps its Depth
  });

  it('give no swing before any Patch (issue 244)', () => {
    expect(createModulationRecord(0).lfoSwingAt(1)).toBe(0);
  });
});

describe('the Patches over time', () => {
  it('give the Cutoff in force at each moment, so a hand sweep is drawn as a sweep (issue 244)', () => {
    const { record } = recordOf({ cutoff: 300 });
    record.recordPatch(0.5, patchOf({ cutoff: 3000 }));
    expect(record.modulationAt(0.25).cutoff).toBe(300);
    expect(record.modulationAt(0.75).cutoff).toBe(3000);
    expect(record.patchAt(0.75)?.cutoff).toBe(3000);
  });

  it('replace the one recorded at the same moment, the clock standing still (issue 215)', () => {
    const { record } = recordOf({ cutoff: 300 });
    record.recordPatch(0.5, patchOf({ cutoff: 3000 }));
    record.recordPatch(0.5, patchOf({ cutoff: 1000 }));
    expect(record.patchAt(0.75)?.cutoff).toBe(1000);
    expect(record.patchAt(0.25)?.cutoff).toBe(300);
  });

  it('give the first before it, and none before any (issue 215)', () => {
    expect(createModulationRecord(0).patchAt(1)).toBeUndefined();
    const record = createModulationRecord(0);
    record.recordPatch(1, patchOf({ cutoff: 300 }));
    expect(record.patchAt(0)?.cutoff).toBe(300);
  });
});

describe('the bend and aftertouch', () => {
  it('the bend moves the pitch by its cents from its moment on, until the next (issue 52)', () => {
    const { record, patch } = recordOf({ lfoAmount: 0 });
    note(record, patch, 0, 45);
    record.recordBend(0.2, 200);
    record.recordBend(0.6, -100);
    expect(record.modulationAt(0.1).pitch).toBeCloseTo(45, 9);
    expect(record.modulationAt(0.4).pitch).toBeCloseTo(47, 9);
    expect(record.modulationAt(0.8).pitch).toBeCloseTo(44, 9);
    expect(record.bendAt(0.4)).toBe(200);
  });

  it('aftertouch glides from where it has reached: two thirds of a step one glide on, and all of it soon after (issue 219)', () => {
    const { record } = recordOf();
    expect(record.recordPressure(1, { destination: 'pitch', amount: 1 })).toBe(PRESSURE_GLIDE);
    expect(record.pressureAt(1).amount).toBeCloseTo(0, 9);
    expect(record.pressureAt(1 + PRESSURE_GLIDE).amount).toBeCloseTo(1 - Math.exp(-1), 6);
    expect(record.pressureAt(1.5).amount).toBe(1);
    expect(record.pressureTo(1)).toEqual({ destination: 'pitch', amount: 1 });
    expect(record.modulationAt(1.5).pitch).toBeCloseTo(70, 6); // a semitone over A4 at full pressure
    // Pressing less, mid-glide, starts from where it has reached.
    record.recordPressure(2, { destination: 'pitch', amount: 0.5 });
    const reached = record.pressureAt(2 + PRESSURE_GLIDE / 2).amount;
    record.recordPressure(2 + PRESSURE_GLIDE / 2, { destination: 'pitch', amount: 0 });
    expect(record.pressureAt(2 + PRESSURE_GLIDE / 2).amount).toBeCloseTo(reached, 9);
  });

  it('aftertouch moved to another Destination while pressed starts there at once (issue 219)', () => {
    const { record } = recordOf();
    record.recordPressure(1, { destination: 'cutoff', amount: 1 });
    expect(record.recordPressure(2, { destination: 'resonance', amount: 0.5 })).toBeUndefined();
    expect(record.pressureAt(2)).toEqual({ destination: 'resonance', amount: 0.5 });
  });

  it('aftertouch moves the Patch the model plays, not the Patch in force (issue 132)', () => {
    const { record } = recordOf({ cutoff: 1000, lfoAmount: 0 });
    record.recordPressure(1, { destination: 'cutoff', amount: 1 });
    expect(record.modulationAt(2).cutoff).toBeGreaterThan(1000);
    expect(record.patchAt(2)?.cutoff).toBe(1000);
  });
});

describe('the trimming', () => {
  it('keeps 30 s of the past, and the entry in force at its oldest moment (issue 244)', () => {
    const { record, patch } = recordOf();
    for (let s = 0; s <= 40; s++) note(record, patch, s, 40 + s);
    // At 40 s the oldest kept moment is 10 s: the Note struck then stands in for every one before.
    expect(record.modulationAt(10.5).pitch).toBeCloseTo(50, 9);
    expect(record.modulationAt(5).pitch).toBeCloseTo(50, 9);
    expect(record.modulationAt(11.5).pitch).toBeCloseTo(51, 9);
  });

  it('keeps 4096 entries at most, however busy (issue 244)', () => {
    const record = createModulationRecord(0);
    for (let i = 0; i < 5000; i++) record.recordPitch(i / 1000, 20 + (i % 100), 0);
    // The oldest 904 are gone: the first kept stands in for them.
    expect(record.modulationAt(0).pitch).toBeCloseTo(24, 9);
    expect(record.modulationAt(0.95).pitch).toBeCloseTo(70, 9);
  });

  it('keeps the past a moment shows however many changes follow (issue 244)', () => {
    const { record, patch } = recordOf({ lfoAmount: 0.5, lfoRate: 3 });
    note(record, patch, 0, 60);
    const seen = record.modulationAt(1);
    for (let i = 1; i <= 200; i++) {
      const t = 1 + i / 100;
      record.recordLfoRate(0, t, 1 + (i % 7));
      record.recordPatch(t, patchOf({ lfoAmount: 0.5, lfoRate: 1 + (i % 7), cutoff: 500 + i }));
    }
    expect(record.modulationAt(1).lfo[0]).toBeCloseTo(seen.lfo[0], 9);
    expect(record.modulationAt(1).cutoff).toBeCloseTo(seen.cutoff, 6);
  });
});

describe('the settled past (issue 215)', () => {
  it('is settled from the first Patch and the first Note, and never before both (issue 215)', () => {
    const record = createModulationRecord(0);
    expect(record.settledFrom()).toBe(Infinity);
    record.recordPatch(0.2, patchOf());
    expect(record.settledFrom()).toBe(Infinity);
    record.recordPitch(0.5, 60, 0);
    expect(record.settledFrom()).toBe(0.5);
    record.recordPatch(0.8, patchOf({ cutoff: 300 }));
    expect(record.settledFrom()).toBe(0.5);
  });
});

describe('the tempo and a pause’s carry (issue 216)', () => {
  it('keeps the tempo set (issue 112)', () => {
    const record = createModulationRecord(3);
    expect(record.tempo().origin).toBe(3);
    record.setTempo(90, 4);
    expect(record.tempo()).toEqual({ bpm: 90, origin: 4 });
  });

  it('carries the LFOs and the beat on by the time paused, and leaves the Envelopes, Notes and Patches where they were (issue 216)', () => {
    const { record, patch } = recordOf({ lfoAmount: 1, lfoRate: 0.3, lfoWaveform: 'sine', ampSustain: 0.5, ampRelease: 0.2 });
    note(record, patch, 1, 60);
    gate(record, patch, 2, false);
    record.setTempo(120, 1);
    const ahead = record.lfoSwingAt(12.5); // what was drawn at the pause's end, the page's clock running on
    const [amp, pitch] = [record.modulationAt(1.5).amp, record.modulationAt(1.5).pitch];
    record.carryOn(2.5, 10);
    expect(record.lfoSwingAt(10)).toBeCloseTo(ahead, 9);
    expect(record.tempo()).toEqual({ bpm: 120, origin: -1.5 });
    expect(record.modulationAt(1.5).amp).toBeCloseTo(amp, 12);
    expect(record.modulationAt(1.5).pitch).toBeCloseTo(pitch, 12);
    expect(record.settledFrom()).toBe(10); // the LFOs' past before it was carried
  });
});
