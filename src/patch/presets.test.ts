import { describe, expect, it } from 'vitest';
import { memoryStorage } from '../test/memoryStorage';
import { createLibrary } from './library';
import { CHOICES, defaultPatch, PARAMS, type ParamId, type Patch, setParam } from './patch';
import { initialPatch, PRESET_GROUPS, PRESETS, stepPreset } from './presets';
import { patchToShare, sanitizePatch, shareHash } from './serialize';
import { valueToPosition } from './taper';

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
    for (const d of ['cutoff', 'pitch', 'pulseWidth', 'fm', 'resonance', 'osc2Pitch', 'detune'] as const) expect(using((p) => aims(p, d)), d).toBeGreaterThan(0);
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

  // Review 15's families (issue 125, decision 1): the lessons as they were, then the sounds by what they are, not by
  // how many Notes they play.
  it('sit in the families of issue 125: the lessons, then the sounds', () => {
    expect(PRESET_GROUPS).toEqual([
      'Start', 'Shapes', 'Intervals', 'Filter', 'Envelope', 'LFO',
      'Bass', 'Leads', 'Keys & Organs', 'Pianos', 'Plucks & Mallets', 'Pads', 'Strings, Brass & Choir', 'Drums', 'Movement & Effects',
    ]);
    const family = (name: string) => PRESETS.find((p) => p.name === name)?.group;
    expect(['Organ', 'House Organ', 'Cathedral', 'Electric Piano', 'Rave Stab'].map(family)).toEqual(Array(5).fill('Keys & Organs'));
    expect(['Toy Piano', 'Marimba', 'Vibes', 'Glass Keys', 'FM Bell', 'Poly Pluck', 'Pick Pluck'].map(family)).toEqual(Array(7).fill('Plucks & Mallets'));
    expect(['PWM Strings', 'Strings', 'Brass Swell', 'Brass Section', 'Choir'].map(family)).toEqual(Array(5).fill('Strings, Brass & Choir'));
    // Pluck keeps one Voice for its Tutorial, so it sits with the lessons, beside Pluck Shape.
    expect(family('Pluck')).toBe('Envelope');
    expect(PRESETS.find((p) => p.group === 'Movement & Effects')!.name).toBe('Laser');
    // Gone: the near-copies of decision 2.
    for (const name of ['Chord Organ', 'Poly Keys', 'Bell Chords', 'Chord Pad', 'Out of Tune']) expect(family(name), name).toBeUndefined();
    // Added: review 15's ten.
    const added = ['Riser', 'Phase Pad', 'Flute', 'House Organ', 'Sub Drop', 'Rave Stab', 'PWM Bass', 'Pick Pluck', 'Ride', 'Analog Drift Lead'];
    expect(added.map(family)).toEqual(['Movement & Effects', 'Pads', 'Leads', 'Keys & Organs', 'Movement & Effects', 'Keys & Organs', 'Bass', 'Plucks & Mallets', 'Drums', 'Leads']);
  });

  it('say so when they play on eight Voices (issue 125)', () => {
    for (const p of PRESETS.filter((p) => p.patch.voices === 8)) expect(p.about, p.name).toMatch(/eight Voices/);
  });

  it('start the keyboard on C2 for every Bass, and leave it on C4 for the rest (issue 125)', () => {
    for (const p of PRESETS) expect(p.patch.keyboardOctave, p.name).toBe(p.group === 'Bass' ? 2 : undefined);
  });

  /**
   * How far apart two Patches are (review 15's distance): each Parameter's difference as a share of its control's
   * travel, added up, and 1 for each choice that differs. Volume is left out: it levels a sound, it does not make another.
   */
  const distance = (a: Patch, b: Patch) => {
    const params = (Object.keys(PARAMS) as ParamId[]).filter((id) => id !== 'volume');
    const travel = params.reduce((sum, id) => sum + Math.abs(valueToPosition(PARAMS[id], a[id]) - valueToPosition(PARAMS[id], b[id])), 0);
    return travel + (Object.keys(CHOICES) as (keyof typeof CHOICES)[]).filter((k) => a[k] !== b[k]).length;
  };
  /** Pairs closer than that on purpose: lessons that change one control to compare. */
  const ALIKE: Record<string, string> = {
    'Slow Vibrato ~ Fast Vibrato': 'the same vibrato at 2 and 8 Hz: the LFO lesson',
    'Perfect Fifth ~ Major Third': 'the same two sines a fifth, then a third, apart: the Intervals lesson',
    'Major Third ~ Slow Beats': 'the same two sines a third, then 4 cents, apart: the Intervals lesson',
  };
  it('are no near-copies: every two at least 0.3 apart, unless named with why (review 15)', () => {
    const close: string[] = [];
    for (const [i, a] of PRESETS.entries())
      for (const b of PRESETS.slice(i + 1)) {
        const pair = `${a.name} ~ ${b.name}`;
        if (distance(a.patch, b.patch) < 0.3 && !ALIKE[pair]) close.push(`${pair} ${distance(a.patch, b.patch).toFixed(2)}`);
      }
    expect(close).toEqual([]);
    for (const pair of Object.keys(ALIKE)) {
      const [a, b] = pair.split(' ~ ').map((name) => PRESETS.find((p) => p.name === name)!.patch);
      expect(distance(a, b), pair).toBeLessThan(0.3);
    }
  });

  it('are all valid Patches, with nothing clamped or replaced', () => {
    for (const preset of PRESETS) expect(sanitizePatch(preset.patch), preset.name).toEqual(preset.patch);
  });

  it('each explain what they show off', () => {
    for (const preset of PRESETS) expect(preset.about.length, preset.name).toBeGreaterThan(20);
  });

  // Issue 53: a chord on a Pad played one Note. Sounds made to be played as chords have Voices for them; a drone,
  // a pluck and the teaching Presets stay on one Voice.
  it('give chords their Voices: every Pad (but the drone), Piano, key and mallet', () => {
    const chordal = PRESETS.filter((p) => (p.group === 'Pads' && p.name !== 'Dark Drone') || ['Pianos', 'Keys & Organs', 'Plucks & Mallets'].includes(p.group));
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
    expect(keys.group).toBe('Keys & Organs');
    expect(keys.patch).toMatchObject({ lfoDestination: 'volume', lfoWaveform: 'sine' });
    expect(keys.patch.voices).toBeGreaterThan(1);
    expect(gate.group).toBe('Pads');
    expect(gate.patch).toMatchObject({ lfoDestination: 'volume', lfoWaveform: 'square', lfoAmount: 1 });
  });
});

