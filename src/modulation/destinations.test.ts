import { describe, expect, it } from 'vitest';
import { CHOICES, defaultPatch, LFO_DESTINATIONS, PARAMS, type Patch, STAGES } from '../patch/patch';
import { targetText } from '../tutorial/tutorial';
import { linePattern, timelineShows } from '../viewers/timeline';
import { DESTINATIONS, destinationLevel, effectiveValue, lfoDestinations, MODULATED } from './destinations';
import { destinationSwings, LFO_LAWS, type LfoLaw, type Modulation } from './modulationModel';
import { evenReach } from './reach';

const patch = (change: Partial<Patch>): Patch => ({ ...defaultPatch(), lfoAmount: 0, lfo2Amount: 0, ...change });
const at = (change: Partial<Modulation>): Modulation => ({
  amp: 1, filter: 0, cutoff: 1000, lfo: [0, 0], mode: 'lowpass', resonance: 0.2, bandwidth: 1, volume: 1, sounding: null, pitch: 69, vibrato: 0,
  ...change,
});

describe('lfoDestinations: what the active LFOs move (issue 63)', () => {
  it('leaves out an LFO at Depth 0', () => {
    expect(lfoDestinations(patch({ lfoDestination: 'resonance', lfo2Destination: 'pitch' }))).toEqual([]);
  });
  it('lists LFO 1’s first, then LFO 2’s', () => {
    expect(lfoDestinations(patch({ lfoDestination: 'volume', lfoAmount: 0.5, lfo2Destination: 'pulseWidth', lfo2Amount: 0.5 }))).toEqual(['volume', 'pulseWidth']);
  });
  it('lists one Destination once when both LFOs aim at it', () => {
    expect(lfoDestinations(patch({ lfoDestination: 'resonance', lfoAmount: 0.5, lfo2Destination: 'resonance', lfo2Amount: 0.2 }))).toEqual(['resonance']);
  });
});

describe('destinationLevel: where a moved Parameter is, 0–1 on its knob', () => {
  it('follows the Modulation model where it already answers (the Volume after its dip)', () => {
    expect(destinationLevel('volume', patch({ volume: 0.6 }), at({ volume: 0.3 }))).toBeCloseTo(0.3);
  });
  it('adds both LFOs’ swings on a Destination they share', () => {
    const p = patch({ pulseWidth: 0.5, lfoDestination: 'pulseWidth', lfoAmount: 0.5, lfo2Destination: 'pulseWidth', lfo2Amount: 0.25 });
    // 40 points at full Depth: 20 from LFO 1 at its top, 10 from LFO 2 at its top, on a 0.05–0.95 knob.
    expect(destinationLevel('pulseWidth', p, at({ lfo: [1, 1] }))).toBeCloseTo((0.8 - 0.05) / 0.9);
  });
  it('puts Pitch, which has no knob, in the middle, a semitone each way at the edges', () => {
    expect(destinationLevel('pitch', patch({}), at({ vibrato: 0 }))).toBe(0.5);
    expect(destinationLevel('pitch', patch({}), at({ vibrato: 1 }))).toBe(1);
    expect(destinationLevel('pitch', patch({}), at({ vibrato: -0.5 }))).toBe(0.25);
  });
  it('keeps Pitch within the plot when both LFOs swing it past a semitone', () => {
    expect(destinationLevel('pitch', patch({}), at({ vibrato: 1.8 }))).toBe(1);
    expect(destinationLevel('pitch', patch({}), at({ vibrato: -2 }))).toBe(0);
  });
});

describe('timelineShows: the Timeline draws only what something moves (the owner, 2026-10-28)', () => {
  it('shows the Amp Envelope alone with no Filter Envelope and no active LFO', () => {
    expect(timelineShows(patch({ filterEnvAmount: 0, velocityCutoff: 0.7, keyTrack: 0.5 }))).toEqual({ filterEnvelope: false, cutoff: false, destinations: [] });
  });
  it('shows the Filter Envelope and the Cutoff once the Envelope’s Amount is set', () => {
    expect(timelineShows(patch({ filterEnvAmount: 2 }))).toEqual({ filterEnvelope: true, cutoff: true, destinations: [] });
  });
  it('shows the Cutoff for an LFO on it, which takes no line of its own', () => {
    expect(timelineShows(patch({ lfoDestination: 'cutoff', lfoAmount: 0.5, lfo2Destination: 'volume', lfo2Amount: 0.5 }))).toEqual({
      filterEnvelope: false,
      cutoff: true,
      destinations: ['volume'],
    });
  });
});

describe('linePattern: the three moved lines told apart', () => {
  const p = patch({ lfoDestination: 'pulseWidth', lfoAmount: 0.5, lfo2Destination: 'volume', lfo2Amount: 0.5 });
  it('dots the Cutoff, dashes LFO 1’s, dash-dots LFO 2’s', () => {
    expect([linePattern(p, 'cutoff'), linePattern(p, 'pulseWidth'), linePattern(p, 'volume')]).toEqual(['dots', 'dashes', 'dashDot']);
  });
  it('gives a Destination both LFOs share LFO 1’s dashes', () => {
    expect(linePattern(patch({ lfoDestination: 'resonance', lfoAmount: 0.5, lfo2Destination: 'resonance', lfo2Amount: 0.5 }), 'resonance')).toBe('dashes');
  });
});

describe('the LFO Destinations, one list (issue 68)', () => {
  it('feeds both LFOs’ choices, the lookup by id and the Tutorials’ names, in one order', () => {
    const ids = LFO_DESTINATIONS.map((d) => d.id);
    expect(CHOICES.lfoDestination).toEqual(ids);
    expect(CHOICES.lfo2Destination).toEqual(ids);
    expect(Object.keys(DESTINATIONS)).toEqual(ids);
    for (const d of LFO_DESTINATIONS) {
      expect(targetText({ kind: 'choice', id: 'lfoDestination', to: d.id, say: '', note: '' })).toBe(d.label);
      expect(STAGES.map((s) => s.id)).toContain(d.stage);
    }
  });
});

describe('the LFOs swing each even Destination by its law (issue 74)', () => {
  const EVEN = ['pitch', 'osc2Pitch', 'detune', 'pulseWidth', 'fm', 'resonance'] as const;
  it.each(EVEN)("%s: full Depth on one LFO swings it the law's amount each way, both LFOs within its room, its knobs following", (d) => {
    const law: LfoLaw = LFO_LAWS[d];
    const { perDepth, knobs } = law;
    const one = patch({ lfoDestination: d, lfoAmount: 1 });
    if (!knobs.length) expect(destinationSwings(one, d)).toEqual([perDepth, 0]);
    for (const knob of knobs) {
      const middle = (PARAMS[knob].min + PARAMS[knob].max) / 2;
      const room = law.room?.(middle) ?? Infinity;
      const swing = Math.min(perDepth, room);
      const p = { ...one, [knob]: middle };
      expect(destinationSwings(p, d, middle)).toEqual([swing, 0]);
      expect(effectiveValue(knob, p, at({ lfo: [1, 0] }))).toBeCloseTo(middle + swing);
      expect(effectiveValue(knob, p, at({ lfo: [-1, 0] }))).toBeCloseTo(middle - swing);
      expect(evenReach(p, knob)).toEqual({ lo: expect.closeTo(middle - swing), hi: expect.closeTo(middle + swing) });
      const [a, b] = destinationSwings({ ...p, lfo2Destination: d, lfo2Amount: 1 }, d, middle);
      expect(a + b).toBeCloseTo(Math.min(2 * perDepth, room));
    }
  });
  it('keeps a Pulse Width and the Resonance off their ends: the room narrows near them', () => {
    expect(LFO_LAWS.pulseWidth.room(0.9)).toBeCloseTo(0.05);
    expect(LFO_LAWS.pulseWidth.room(0.1)).toBeCloseTo(0.05);
    expect(LFO_LAWS.resonance.room(0.1)).toBeCloseTo(0.1);
    expect(LFO_LAWS.resonance.room(0.8)).toBeCloseTo(0.2);
  });
  it('swings FM as it does the Resonance: its whole range from the middle, nothing at 0, never past 100 % (issue 97)', () => {
    const fm = (crossMod: number) => destinationSwings(patch({ crossMod, lfoDestination: 'fm', lfoAmount: 1 }), 'fm', crossMod);
    expect(fm(0.5)).toEqual([0.5, 0]);
    expect(fm(0)).toEqual([0, 0]);
    expect(fm(0.8)[0]).toBeCloseTo(0.2);
  });
  it('rings every knob a law names, and only those: Pulse Width on both Oscillators', () => {
    expect([...MODULATED].sort()).toEqual(['crossMod', 'cutoff', 'osc2Detune', 'osc2PulseWidth', 'osc2Semitone', 'pulseWidth', 'resonance', 'volume']);
  });
});
