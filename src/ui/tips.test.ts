import { describe, expect, it } from 'vitest';
import { LFO_DESTINATIONS, PARAMS, type ParamId } from '../patch/patch';
import { OVERLAY_TIPS, PARAM_TIPS, syncedRateTip, TIPS } from './tips';

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
    expect(PARAM_TIPS.mixOsc1.keys).toBe('↑↓ 0.5 dB · Shift 0.1 dB · Page 6 dB');
    expect(PARAM_TIPS.ampAttack.keys).toBe('↑↓ the next round time · Shift 1 % · Page double or half');
    expect(PARAM_TIPS.osc1Octave.keys).toBe('↑↓ an octave');
    expect(syncedRateTip('1/4', '2 Hz', 120).keys).toBe('↑↓ a note value · Page 2 note values');
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

it('the Guides’ tip says they stand at what the Mixer sends, so beyond them is Resonance (issue 159)', () => {
  const { body } = OVERLAY_TIPS.guides;
  expect(body).toMatch(/level the Mixer sends/);
  expect(body).toMatch(/one beyond them has been boosted by Resonance/);
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
  const tip = syncedRateTip('1/4', '2 Hz', 120);
  expect(tip.title).toBe('Rate');
  expect(tip.body).toMatch(/note value at the tempo/);
  expect(tip.body).toMatch(/At 120 BPM, 1\/4 is 2 Hz\.$/);
  expect(TIPS.lfoNote.body).not.toMatch(/beside/);
});
