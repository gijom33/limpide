import { describe, expect, it } from 'vitest';
import { parsePhrase, phraseLength } from '../demo/phrase';
import { defaultPatch } from '../patch/patch';
import { cycleLength, TOUR, TOUR_PATCH, type TourSection, tourAt } from './tour';

const card = (title: string) => TOUR.find((c) => c.title === title)!;

describe('The Tour (issue 128)', () => {
  it('has a card for each Section, in the signal’s order, each pointing at its Viewers', () => {
    expect(TOUR.map((c) => c.title)).toEqual(['Oscillators and Mixer', 'Filter', 'Amp', 'LFOs']);
    expect(TOUR.map((c) => c.viewers)).toEqual([
      ['Oscillator Scope', 'Oscillator Spectrum'],
      ['Filter Scope', 'Filter Spectrum'],
      ['Envelope Timeline', 'Amp Scope', 'Amp Spectrum'],
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
    expect(TOUR.map((c) => c.moves.map((m) => m.id))).toEqual([['waveform'], ['cutoff', 'resonance'], ['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'], ['lfoAmount']]);
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

  describe('the Amp card turns the Envelope’s four stages, one per Note (issue 130)', () => {
    const amp = card('Amp');
    const STAGES = ['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease'] as const;
    const notes = parsePhrase(amp.phrase, amp.bpm);
    /** The one stage away from the Tour's Patch at `t`, or none. */
    const changed = (t: number) => STAGES.filter((id) => tourAt(amp, t).values[id] !== TOUR_PATCH.patch[id]);

    it('plays one Note per stage, its moves and its phrase taking the same time, so they stay together', () => {
      expect(notes).toHaveLength(4);
      expect(cycleLength(amp)).toBeCloseTo(phraseLength(amp.phrase, amp.bpm), 6);
    });

    it('changes Attack, then Decay, then Sustain, then Release, each settled before its Note and held until it has faded', () => {
      notes.forEach((note, i) => {
        const id = STAGES[i];
        // Half a second early the knob has stopped, the stage before it back where it was (the only one changed is this
        // one): the Note carries the change from its key going down to its fade.
        const release = tourAt(amp, note.time + note.duration).values.ampRelease!;
        for (const t of [note.time - 0.5, note.time, note.time + note.duration, note.time + note.duration + release]) {
          expect(changed(t), `${id} at ${t}`).toEqual([id]);
          expect(tourAt(amp, t).values[id]).toBe(tourAt(amp, note.time).values[id]);
        }
      });
    });

    it('freezes the Viewers about three seconds once each Note has faded, naming its stage; after the last, all four', () => {
      // When the Tour freezes, and for how long, read every 50 ms over a pass of the card.
      const spans: { from: number; to: number; frozen: string }[] = [];
      for (let t = 0; t < cycleLength(amp); t += 0.05) {
        const frozen = tourAt(amp, t).naming?.join('; ');
        const last = spans.at(-1);
        if (frozen && last?.frozen === frozen && t - last.to < 0.06) last.to = t;
        else if (frozen) spans.push({ from: t, to: t, frozen });
      }
      // The stage's name first, then what it is, as the card says it (issue 190, review 16's finding 3).
      expect(spans.map((s) => s.frozen)).toEqual(['Attack, the rise', 'Decay, the fall to a steady level', 'Sustain, that level held', 'Attack; Decay; Sustain; Release']);
      spans.forEach((span, i) => {
        const note = notes[i];
        const fade = note.time + note.duration + tourAt(amp, note.time + note.duration).values.ampRelease!;
        // The Note's Release over, with room for the page's clock and the sound's to be a little apart.
        expect(span.from, span.frozen).toBeGreaterThan(fade + 0.15);
        expect(span.from - note.time, span.frozen).toBeLessThan(2 - 0.2); // its onset still on a 2 s Timeline, with room before it
        expect(span.to - span.from, span.frozen).toBeGreaterThan(2.8);
        expect(span.to - span.from, span.frozen).toBeLessThan(3.2);
        if (notes[i + 1]) expect(span.to, span.frozen).toBeLessThan(notes[i + 1].time - 1); // the picture runs before the next
      });
    });

    it('freezes nothing on the other cards', () => {
      for (const c of TOUR.filter((c) => c !== amp)) for (let t = 0; t < cycleLength(c); t += 0.1) expect(tourAt(c, t).naming, c.title).toBeNull();
    });

    it('changes each far enough to see: a slow Attack, a slow Decay, a low Sustain, a long Release', () => {
      const at = (i: number) => tourAt(amp, notes[i].time).values;
      expect(at(0).ampAttack).toBeGreaterThanOrEqual(0.5);
      expect(at(1).ampDecay).toBeGreaterThanOrEqual(0.8);
      expect(at(2).ampSustain).toBeLessThanOrEqual(0.35);
      expect(at(3).ampRelease).toBeGreaterThanOrEqual(0.9);
    });
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
    const sweep: TourSection = { ...card('Filter'), moves: [{ kind: 'param', id: 'cutoff', path: [2000, 200], seconds: 4 }] };
    expect(tourAt(sweep, 2).values.cutoff).toBeCloseTo(632.5, 0);
  });

  it('plays a phrase on every card that the parser reads', () => {
    for (const c of TOUR) expect(parsePhrase(c.phrase, c.bpm).length, c.title).toBeGreaterThan(1);
  });
});
