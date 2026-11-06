import { describe, expect, it } from 'vitest';
import { noteIndex } from '../music/tempo';
import { defaultPatch, LFO_DESTINATIONS, PARAMS, type ParamId } from '../patch/patch';
import { filterTips, OVERLAY_TIPS, osc1PitchTip, PARAM_TIPS, paramTipAt, ringTip, syncedRateTip, TIPS, waveformTip } from './tips';

describe("every Parameter's tip (issue 78)", () => {
  it.each(Object.keys(PARAMS) as ParamId[])('%s has a tip with a title and a body, which its knob or fader shows', (id) => {
    expect(PARAM_TIPS[id].title).not.toBe('');
    expect(PARAM_TIPS[id].body).not.toBe('');
    expect(PARAM_TIPS[id].keys).toMatch(/^↑↓ /); // and its steps (issue 160)
  });

  it('names each control’s steps: the arrows, Shift and Page (issue 160)', () => {
    expect(PARAM_TIPS.cutoff.keys).toBe('↑↓ a semitone · Shift 10 cents · Page an octave');
    expect(PARAM_TIPS.osc2Detune.keys).toBe('↑↓ 1 cent · Shift 0.1 cent · Page 10 cents');
    expect(PARAM_TIPS.ampSustain.keys).toBe('↑↓ 1 % · Shift 0.1 % · Page 10 %');
    // A Mixer fader's in the unit it reads: % outside the Synth Geek Layer, dB inside it; Ring's % in both (issue 201).
    expect(PARAM_TIPS.mixOsc1.keys).toBe('↑↓ 1 % · Shift 0.1 % · Page 10 %');
    expect(PARAM_TIPS.mixOsc1.geekKeys).toBe('↑↓ 0.5 dB · Shift 0.1 dB · Page 6 dB');
    expect(PARAM_TIPS.mixRing.keys).toBe('↑↓ 1 % · Shift 0.1 % · Page 10 %');
    expect(PARAM_TIPS.mixRing.geekKeys).toBeUndefined();
    expect(PARAM_TIPS.ampSustain.geekKeys).toBeUndefined();
    expect(PARAM_TIPS.ampAttack.keys).toBe('↑↓ the next round time · Shift 1 % · Page double or half');
    expect(PARAM_TIPS.osc1Octave.keys).toBe('↑↓ an octave');
    expect(syncedRateTip(noteIndex('1/4'), 120).keys).toBe('↑↓ a note value · Page 2 note values');
  });
});

it('the LFO Destination tip names every Destination, in the order the picker lists them (issue 107)', () => {
  const places = LFO_DESTINATIONS.map((d) => TIPS.lfoDestination.body.indexOf(` ${d.label}: `));
  for (const [i, d] of LFO_DESTINATIONS.entries()) expect(places[i], d.label).toBeGreaterThan(0);
  expect(places).toEqual([...places].sort((a, b) => a - b));
});

it('FM’s tip says its depth follows the knobs, not the Envelope (issue 98)', () => {
  const { body } = TIPS.crossMod;
  expect(body).toMatch(/depth/);
  expect(body).toMatch(/knobs/);
  expect(body).toMatch(/Env Amount/);
});

it('Bead’s tip says who Bead is, the switch to keep it away, and the Notes to send it away for the visit (issue 150)', () => {
  const { title, body } = TIPS.bead;
  expect(title).toBe('Bead');
  expect(body).toMatch(/water drop/);
  expect(body).toMatch(/Off keeps it away/);
  expect(body).toMatch(/B, E, A, D sends it away for this visit/);
});

it('the Guides’ tip says they stand at what the Mixer sends, and what passes them (issues 159 and 194)', () => {
  const { body } = OVERLAY_TIPS.guides;
  expect(body).toMatch(/level the Mixer sends/);
  // Not Resonance alone: a chord, Pink Noise and the Filter at Resonance 0 pass them too (issue 194).
  expect(body).toMatch(/Resonance/);
  expect(body).toMatch(/several Notes/);
  expect(body).toMatch(/Noise/);
  expect(body).not.toMatch(/has been boosted by Resonance/);
  expect(body).not.toMatch(/Oscillator’s level/);
});

it('the Filter toggle’s tip names it Filter and says it draws the Response Curve (issue 161)', () => {
  const { title, body } = OVERLAY_TIPS.curve;
  expect(title).toBe('Filter');
  expect(body).toMatch(/^The Response Curve: the Filter’s gain at every frequency/);
});

it('the Sync tip puts the cycle on the beat only with Retrigger off: on, each Note starts it (issue 112)', () => {
  const { body } = TIPS.lfoSync;
  expect(body).toMatch(/note value at the tempo/);
  expect(body).toMatch(/with Retrigger off, the LFO’s cycle lands on the beat/);
  expect(body).toMatch(/with it on, each Note starts the cycle/);
});

it('a synced Rate’s tip gives its Hz at the tempo, which its readout leaves out (issue 176)', () => {
  const tip = syncedRateTip(noteIndex('1/4'), 120);
  expect(tip.title).toBe('Rate');
  expect(tip.body).toMatch(/note value at the tempo/);
  expect(tip.body).toMatch(/At 120 BPM, 1\/4 is 2.00 Hz\.$/); // read as the Rate in Hz reads it (issue 193)
  expect(TIPS.lfoNote.body).not.toMatch(/beside/);
});

it('a slow synced Rate’s tip reads its Hz to three figures, a readout keeping two (issue 225)', () => {
  expect(syncedRateTip(noteIndex('4 bars'), 40).body).toMatch(/At 40 BPM, 4 bars is 0\.0417 Hz\.$/); // a cycle every 24.0 s
  expect(syncedRateTip(noteIndex('4 bars'), 120).body).toMatch(/At 120 BPM, 4 bars is 0\.13 Hz\.$/);
});

it('a synced Rate’s tip works its Hz out under the hood, at the tempo, as it changes (issue 137)', () => {
  expect(syncedRateTip(noteIndex('1/8'), 120).underTheHood?.where).toMatch(/^1\/8 at 120 BPM: 120 ÷ 60 × 2 = 4 Hz,/);
  expect(syncedRateTip(noteIndex('1/8 D'), 90).underTheHood?.where).toMatch(/^1\/8 D at 90 BPM: 90 ÷ 60 × 4\/3 = 2 Hz,/);
  expect(syncedRateTip(noteIndex('1/16 T'), 120).underTheHood?.where).toMatch(/^1\/16 T at 120 BPM: 120 ÷ 60 × 6 = 12 Hz,/);
  expect(syncedRateTip(noteIndex('1/16 T'), 120).body).toMatch(/At 120 BPM, 1\/16 T is 12 Hz\.$/);
});

it('the tempo’s, Tap Tempo’s and Sync’s tips say why a synced wobble stays on the beat when the tempo changes (issue 137)', () => {
  expect(TIPS.lfoSync.body).toMatch(/follows the tempo: double the BPM and the LFO runs twice as fast/);
  expect(TIPS.tempo.body).toMatch(/keeps to the beat/);
  expect(TIPS.tapTempo.body).toMatch(/synced LFO’s speed follows it/);
});

it('an Envelope fader’s tip works out τ at its setting; the others, Glide’s too, keep their own (issue 168)', () => {
  expect(paramTipAt('ampDecay', 0.3).underTheHood?.where).toMatch(/^τ = Decay ÷ 4 = 75\.0 ms now/);
  expect(paramTipAt('filterAttack', 0.03).underTheHood?.where).toMatch(/^τ = Attack ÷ 3 = 10\.0 ms now/);
  expect(paramTipAt('glide', 0.4).underTheHood?.formula).toBe('f = f₂ + (f₁ − f₂)·e^(−t/τ)');
  expect(paramTipAt('glide', 0.4)).toBe(PARAM_TIPS.glide);
  expect(paramTipAt('ampDecay', 0.3)).toMatchObject({ title: 'Decay', keys: PARAM_TIPS.ampDecay.keys, history: PARAM_TIPS.ampDecay.history });
  expect(paramTipAt('keyTrack', 0.5)).toBe(PARAM_TIPS.keyTrack);
});

it('the Waveform’s, Osc 1 Pitch’s (FM’s rule), Ring’s and the Filter’s tips give their formulas under the hood, at the settings picked (issue 235)', () => {
  // Each Oscillator's Waveform its own series: a Square's odd Harmonics, a Pulse's gaps at its width.
  expect(waveformTip('square', 0.25)).toMatchObject({ title: 'Waveform', history: TIPS.waveform.history });
  expect(waveformTip('square', 0.25).underTheHood?.formula).toBe('bₙ = 4 / (π n),  odd n only');
  expect(waveformTip('pulse', 0.2).underTheHood?.where).toMatch(/every 5th Harmonic missing/);
  // FM's and Ring's at the knobs: FM's on Osc 1's Pitch, as FM's own has no room for it on a phone; Ring's keys kept.
  const fm = osc1PitchTip({ ...defaultPatch(), crossMod: 0.5 });
  expect(fm).toMatchObject({ title: 'Pitch', body: TIPS.osc1Pitch.body });
  expect(fm.underTheHood?.formula).toContain('β = 4 × FM = 2.00');
  expect(PARAM_TIPS.crossMod.underTheHood).toBeUndefined();
  const ring = ringTip({ ...defaultPatch(), osc2Octave: 1, osc2Semitone: 3 });
  expect(ring).toMatchObject({ title: 'Ring', keys: PARAM_TIPS.mixRing.keys });
  expect(ring.underTheHood?.where).toContain('1.38 and 3.38 × f₁ now');
  // The Mode's and the Slope's the response for both as picked.
  const { mode, slope } = filterTips('highpass', 24);
  expect(mode.title).toBe('Filter Mode');
  expect(slope.title).toBe('Slope');
  for (const tip of [mode, slope]) expect(tip.underTheHood?.formula).toMatch(/^\|H\| = \(x² \/ .*\)²$/);
});

it('the Synth Geek Layer’s tip says its formulas are in the tips, none on the Viewers (issue 235)', () => {
  expect(OVERLAY_TIPS.geek.body).not.toMatch(/under the (Oscillator|Filter) Spectrum/);
  expect(OVERLAY_TIPS.geek.body).toMatch(/Waveform’s, FM’s \(on Osc 1’s Pitch\), Ring’s and the Filter’s/);
});
