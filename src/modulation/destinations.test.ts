import { describe, expect, it } from 'vitest';
import { defaultPatch, type Patch } from '../patch/patch';
import { linePattern, timelineShows } from '../viewers/timeline';
import { destinationLevel, knobLevel, lfoDestinations } from './destinations';
import type { Modulation } from './modulationModel';

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
  it('knobLevel is the knob’s own setting, Pitch’s the middle', () => {
    expect(knobLevel('volume', patch({ volume: 0.6 }))).toBeCloseTo(0.6);
    expect(knobLevel('pitch', patch({}))).toBe(0.5);
  });
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
