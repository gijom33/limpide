import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { createLibrary } from './library';
import { defaultPatch, setParam } from './patch';
import { initialPatch, PRESET_GROUPS, PRESETS, stepPreset } from './presets';
import { patchToShare, sanitizePatch, shareHash } from './serialize';

describe('Presets', () => {
  it('start from a clean Init, then offer plenty of sounds, grouped so they can be found', () => {
    expect(PRESETS[0].name).toBe('Init');
    expect(PRESETS[0].patch).toEqual(defaultPatch());
    expect(PRESETS.length).toBeGreaterThanOrEqual(50);
    // Grouped in a fixed order, each group's Presets next to each other (the arrows step through them in order).
    const order = PRESETS.map((p) => p.group).filter((g, i, all) => g !== all[i - 1]);
    expect(order).toEqual(PRESET_GROUPS);
    for (const group of PRESET_GROUPS.slice(1)) expect(PRESETS.filter((p) => p.group === group).length, group).toBeGreaterThanOrEqual(3);
  });

  it('make use of every part of the synth, the newest included', () => {
    const using = (test: (p: (typeof PRESETS)[number]['patch']) => boolean) => PRESETS.filter((p) => test(p.patch)).length;
    expect(using((p) => p.mixSub > 0)).toBeGreaterThanOrEqual(8);
    expect(using((p) => p.keyTrack > 0)).toBeGreaterThanOrEqual(8);
    expect(using((p) => p.velocityCutoff > 0)).toBeGreaterThanOrEqual(5);
    expect(using((p) => p.glide > 0.01)).toBeGreaterThanOrEqual(4);
    expect(using((p) => p.voices > 1)).toBeGreaterThanOrEqual(6);
    expect(using((p) => p.voices === 2)).toBeGreaterThan(0); // not only the maximum
    for (const mode of ['lowpass', 'highpass', 'bandpass', 'notch'] as const) expect(using((p) => p.filterMode === mode), mode).toBeGreaterThan(0);
    // Every LFO destination, both LFOs, and Retrigger.
    const aims = (p: (typeof PRESETS)[number]['patch'], d: string) => (p.lfoAmount > 0 && p.lfoDestination === d) || (p.lfo2Amount > 0 && p.lfo2Destination === d);
    for (const d of ['cutoff', 'pitch', 'pulseWidth', 'resonance', 'osc2Pitch', 'detune'] as const) expect(using((p) => aims(p, d)), d).toBeGreaterThan(0);
    expect(using((p) => p.lfo2Amount > 0)).toBeGreaterThanOrEqual(8);
    expect(using((p) => p.lfoAmount > 0 && p.lfo2Amount > 0)).toBeGreaterThanOrEqual(4); // both at once
    expect(using((p) => (p.lfoAmount > 0 && p.lfoRetrigger === 'note') || (p.lfo2Amount > 0 && p.lfo2Retrigger === 'note'))).toBeGreaterThanOrEqual(3);
    // The Oscillators' additions (issues 88 to 93).
    for (const [name, uses] of Object.entries({
      ring: (p) => p.mixRing > 0, crossMod: (p) => p.crossMod > 0, osc1Octave: (p) => p.osc1Octave !== 0, subOctave: (p) => p.mixSub > 0 && p.subOctave === -2,
      subWaveform: (p) => p.mixSub > 0 && p.subWaveform === 'sine', pink: (p) => p.mixNoise > 0 && p.noiseColour === 'pink', osc2EnvAmount: (p) => p.osc2EnvAmount !== 0,
    } satisfies Record<string, (p: (typeof PRESETS)[number]['patch']) => boolean>))
      expect(using(uses), name).toBeGreaterThan(0);
  });

  it('have different names, and no two sound the same', () => {
    expect(new Set(PRESETS.map((p) => p.name)).size).toBe(PRESETS.length);
    expect(new Set(PRESETS.map((p) => JSON.stringify(p.patch))).size).toBe(PRESETS.length);
  });

  it('are all valid Patches, with nothing clamped or replaced', () => {
    for (const preset of PRESETS) expect(sanitizePatch(preset.patch), preset.name).toEqual(preset.patch);
  });

  it('each explain what they show off', () => {
    for (const preset of PRESETS) expect(preset.about.length, preset.name).toBeGreaterThan(20);
  });

  // Issue 53: a chord on a Pad played one Note. Sounds made to be played as chords have Voices for them; a drone,
  // a pluck and the teaching Presets stay on one Voice.
  it('give chords their Voices: every Pad (but the drone), Piano and key', () => {
    const keys = ['Harp', 'Clav', 'Organ', 'Electric Piano', 'Marimba', 'Glass Keys'];
    const chordal = PRESETS.filter((p) => (p.group === 'Pads' && p.name !== 'Dark Drone') || p.group === 'Pianos' || keys.includes(p.name));
    expect(chordal.length).toBeGreaterThan(15);
    for (const p of chordal) expect(p.patch.voices, p.name).toBeGreaterThan(1);
  });
  it('step forward and back, wrapping at the ends', () => {
    expect(stepPreset(0, 1)).toBe(1);
    expect(stepPreset(PRESETS.length - 1, 1)).toBe(0);
    expect(stepPreset(0, -1)).toBe(PRESETS.length - 1);
  });
});

describe('initialPatch: what plays when the page opens', () => {
  const mine = setParam(defaultPatch(), 'cutoff', 700);

  it('prefers a share link', () => {
    const library = createLibrary(memoryStorage());
    library.saveCurrent(defaultPatch());
    expect(initialPatch(`#p=${patchToShare(mine)}`, library)).toEqual({ patch: mine, name: 'Shared Patch', shared: true });
    // With its name, since 1.11 (issue 53).
    expect(initialPatch(`#${shareHash(mine, 'Dark & low')}`, library)).toEqual({ patch: mine, name: 'Dark & low', shared: true });
  });

  it('then the autosaved Patch from last time', () => {
    const library = createLibrary(memoryStorage());
    library.saveCurrent(mine);
    expect(initialPatch('', library)).toEqual({ patch: mine, name: 'Last session', shared: false });
  });

  it('then the Init Preset', () => {
    expect(initialPatch('#p=%%%', createLibrary(memoryStorage()))).toEqual({ patch: defaultPatch(), name: 'Init', shared: false });
  });
});

describe('tremolo (issue 60)', () => {
  it('Tremolo Keys and Trance Gate aim an LFO at Volume: a gentle sine, and a full-Depth Square that chops the pad', () => {
    const keys = PRESETS.find((p) => p.name === 'Tremolo Keys')!;
    const gate = PRESETS.find((p) => p.name === 'Trance Gate')!;
    expect(keys.group).toBe('Keys & Plucks');
    expect(keys.patch).toMatchObject({ lfoDestination: 'volume', lfoWaveform: 'sine' });
    expect(keys.patch.voices).toBeGreaterThan(1);
    expect(gate.group).toBe('Pads');
    expect(gate.patch).toMatchObject({ lfoDestination: 'volume', lfoWaveform: 'square', lfoAmount: 1 });
  });
});

