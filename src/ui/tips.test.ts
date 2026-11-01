import { describe, expect, it } from 'vitest';
import { LFO_DESTINATIONS, PARAMS, type ParamId } from '../patch/patch';
import { PARAM_TIPS, TIPS } from './tips';

describe("every Parameter's tip (issue 78)", () => {
  it.each(Object.keys(PARAMS) as ParamId[])('%s has a tip with a title and a body, which its knob or fader shows', (id) => {
    expect(PARAM_TIPS[id].title).not.toBe('');
    expect(PARAM_TIPS[id].body).not.toBe('');
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

it('Bead’s tip says who Bead is and both ways to send it away, the switch and the Notes (issue 150)', () => {
  const { title, body } = TIPS.bead;
  expect(title).toBe('Bead');
  expect(body).toMatch(/water drop/);
  expect(body).toMatch(/Off/);
  expect(body).toMatch(/B, E, A, D/);
});
