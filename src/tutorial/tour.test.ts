import { describe, expect, it } from 'vitest';
import { parsePhrase } from '../demo/phrase';
import { defaultPatch } from '../patch/patch';
import { cycleLength, TOUR, TOUR_PATCH, type TourCard, tourAt } from './tour';

const card = (title: string) => TOUR.find((c) => c.title === title)!;

describe('The Tour (issue 128)', () => {
  it('has a card for each Section, in the signal’s order, each pointing at its Viewers', () => {
    expect(TOUR.map((c) => c.title)).toEqual(['Oscillators and Mixer', 'Filter', 'Amp', 'LFOs']);
    expect(TOUR.map((c) => c.viewers)).toEqual([
      ['Oscillator Scope', 'Oscillator Spectrum'],
      ['Filter Scope', 'Filter Spectrum'],
      ['Amp Scope', 'Amp Spectrum'],
      ['Envelope Timeline'],
    ]);
  });

  it('says first where the signal comes from and where it goes next', () => {
    expect(card('Oscillators and Mixer').chain).toMatch(/starts here.*Filter/);
    expect(card('Filter').chain).toMatch(/Oscillators.*Amp/);
    expect(card('Amp').chain).toMatch(/Filter.*speakers/);
    expect(card('LFOs').chain).toMatch(/no sound/);
  });

  it('plays on Init, a saw', () => {
    expect(TOUR_PATCH.name).toBe('Init');
    expect(TOUR_PATCH.patch).toEqual(defaultPatch());
    expect(TOUR_PATCH.patch.waveform).toBe('saw');
  });

  it('turns the controls the owner chose, each starting from the Tour’s Patch', () => {
    expect(TOUR.map((c) => c.moves.map((m) => m.id))).toEqual([['waveform'], ['cutoff', 'resonance'], ['ampAttack', 'ampRelease'], ['lfoAmount']]);
    for (const c of TOUR) {
      expect(tourAt(c, 0).values, c.title).toEqual(Object.fromEntries(c.moves.map((m) => [m.id, TOUR_PATCH.patch[m.id]])));
    }
  });

  it('steps the Waveform saw, square, sine and back, over and over', () => {
    const osc = card('Oscillators and Mixer');
    const seen: string[] = [];
    for (let t = 0; t < 2 * cycleLength(osc); t += 0.25) {
      const w = tourAt(osc, t).values.waveform!;
      if (seen.at(-1) !== w) seen.push(w);
    }
    expect(seen).toEqual(['saw', 'square', 'sine', 'square', 'saw', 'square', 'sine', 'square']);
  });

  it('sweeps the Cutoff down and up, then raises the Resonance and lowers it, the Cutoff back where it began', () => {
    const filter = card('Filter');
    const cutoffs = [];
    let t = 0;
    for (; tourAt(filter, t).moving === 'cutoff'; t += 0.1) cutoffs.push(tourAt(filter, t).values.cutoff!);
    expect(Math.min(...cutoffs)).toBeLessThan(300); // down to a dark hum
    expect(tourAt(filter, t).values.cutoff).toBe(2000);
    const resonances = [];
    for (; tourAt(filter, t).moving === 'resonance'; t += 0.1) resonances.push(tourAt(filter, t).values.resonance!);
    expect(Math.max(...resonances)).toBeGreaterThan(0.7);
    expect(tourAt(filter, t).moving).toBe('cutoff'); // and again
    expect(tourAt(filter, cycleLength(filter))).toEqual(tourAt(filter, 0));
  });

  it('lengthens the Amp’s Attack and brings it back, then its Release', () => {
    const amp = card('Amp');
    const half = (amp.moves[0].seconds * (amp.moves[0].path.length - 1)) / 2;
    expect(tourAt(amp, half)).toMatchObject({ moving: 'ampAttack', values: { ampRelease: 0.4 } });
    expect(tourAt(amp, half).values.ampAttack).toBeGreaterThan(0.5);
    expect(tourAt(amp, 2 * half + 0.01).moving).toBe('ampRelease');
    expect(tourAt(amp, 3 * half).values).toMatchObject({ ampAttack: 0.01 });
    expect(tourAt(amp, 3 * half).values.ampRelease).toBeGreaterThan(1.5);
  });

  it('raises LFO 1’s Depth on the Cutoff, holds it, and takes it away', () => {
    const lfo = card('LFOs');
    expect(TOUR_PATCH.patch.lfoDestination).toBe('cutoff');
    const depths = Array.from({ length: Math.round(cycleLength(lfo) * 10) }, (_, i) => tourAt(lfo, i / 10).values.lfoAmount!);
    expect(Math.max(...depths)).toBeGreaterThanOrEqual(0.5);
    // Held up most of the time, so the Cutoff is heard moving by itself.
    expect(depths.filter((d) => d >= 0.5).length).toBeGreaterThan(depths.length / 3);
  });

  it('turns a knob evenly along its travel: halfway in time, halfway along a log knob', () => {
    const sweep: TourCard = { ...card('Filter'), moves: [{ kind: 'param', id: 'cutoff', path: [2000, 200], seconds: 4 }] };
    expect(tourAt(sweep, 2).values.cutoff).toBeCloseTo(632.5, 0);
  });

  it('plays a phrase on every card that the parser reads', () => {
    for (const c of TOUR) expect(parsePhrase(c.phrase, c.bpm).length, c.title).toBeGreaterThan(1);
  });
});
