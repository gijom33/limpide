import { describe, expect, it } from 'vitest';
import { TOUR, TOUR_END } from './tour';
import { endLine, FROM_INIT, TUTORIALS } from './tutorials';

/**
 * The synth words a newcomer needs explained (issue 129, decisions 2 and 7): each the first time a Tutorial, or the
 * Tour, uses it, in the same sentence, in a few plain words. `use` finds the word; `gloss` the plain words that say
 * what it is, as the Tutorials write them.
 */
const WORDS: { word: string; use: RegExp; gloss: RegExp }[] = [
  { word: 'Init', use: /\bInit\b/, gloss: /plain/ },
  { word: 'Oscillator', use: /\bOsc(illator)?s?\b/, gloss: /\bmakes?\b/ },
  { word: 'Waveform', use: /\bWaveform\b/, gloss: /shape/ },
  { word: 'Harmonic', use: /\bHarmonics?\b/, gloss: /stack/ },
  { word: 'Scope', use: /\bScopes?\b/, gloss: /shape|picture|draws/ },
  { word: 'Spectrum', use: /\bSpectrums?\b/, gloss: /\bline/ },
  { word: 'Envelope Timeline', use: /\bTimeline\b/, gloss: /seconds/ },
  { word: 'Mixer', use: /\bMixer\b/, gloss: /level|loud/ },
  { word: 'Filter', use: /\bFilter\b/, gloss: /tone knob/ },
  { word: 'low-pass', use: /low-pass/, gloss: /lets/ },
  { word: 'Cutoff', use: /\bCutoff\b/, gloss: /where|point/ },
  { word: 'Resonance', use: /\bResonance\b/, gloss: /lift/ },
  { word: 'Slope', use: /\bSlope\b/, gloss: /steep/ },
  { word: 'Amp', use: /\bAmp\b/, gloss: /loud|volume/ },
  { word: 'Envelope', use: /\bEnvelope\b(?! Timeline)/, gloss: /over time/ },
  { word: 'Filter Envelope', use: /Filter(’s)? Envelope|Filter has an Envelope/, gloss: /open/ },
  { word: 'Attack', use: /\bAttack\b/, gloss: /how fast|rise/ },
  { word: 'Decay', use: /\bDecay\b/, gloss: /how fast|how long|falls|drops|closes back/ },
  { word: 'Sustain', use: /\bSustain\b/, gloss: /level|hold|held|settles/ },
  { word: 'Release', use: /\bRelease\b/, gloss: /let go/ },
  { word: 'Amount', use: /\bAmount\b/, gloss: /how far/ },
  { word: 'octave', use: /\boctaves?\b/i, gloss: /doubl|half|quarter/ },
  { word: 'Semitone', use: /\bsemitones?\b/i, gloss: /piano key/ },
  { word: 'Hz', use: /(?<!k)Hz\b/, gloss: /vibrations a second|times a second/ },
  { word: 'kHz', use: /kHz\b/, gloss: /000|thousand/ },
  { word: 'ms', use: /\d\s?ms\b/, gloss: /thousandths of a second/ },
  { word: 'dB', use: /\bdB\b/, gloss: /decibels/ },
  { word: 'Ideal', use: /\bIdeal\b/, gloss: /should/ },
  { word: 'Snapshot', use: /\bSnapshot\b/, gloss: /copy/ },
  { word: 'Velocity', use: /\bVelocity\b/, gloss: /hard/ },
  { word: 'Glide', use: /\bGlide\b/, gloss: /slide/ },
  { word: 'Pulse Width', use: /\bPulse Width\b/, gloss: /stays up/ },
  { word: 'FM', use: /\bFM\b/, gloss: /bend/ },
  { word: 'Ring', use: /\bRing\b/, gloss: /multipl/ },
  { word: 'Sub', use: /\bSub\b/, gloss: /below|under/ },
  { word: 'Noise', use: /\bNoise\b/, gloss: /hiss/ },
  { word: 'White', use: /\bWhite\b/, gloss: /every pitch/ },
  { word: 'Pink', use: /\bPink\b/, gloss: /softer|darker/ },
  { word: 'LFO', use: /\bLFOs?\b/, gloss: /slow|by itself/ },
  { word: 'Depth', use: /\bDepth\b/, gloss: /how far/ },
  { word: 'Rate', use: /\bRate\b/, gloss: /how fast/ },
  { word: 'Retrigger', use: /\bRetrigger\b/, gloss: /over|again/ },
];

// A Tutorial's name is a name, not a use of its words ("FM Ladder", "Ring Bell").
const NAMES = new RegExp(TUTORIALS.map((t) => t.preset).join('|'), 'g');
const sentences = (text: string) => text.replace(NAMES, '').split(/(?<=[.!?:;])\s+/);

/** The first text of a reading, in order, that uses each word must say what it is, in a sentence that names it. */
function unexplained(texts: string[]): string[] {
  const missing: string[] = [];
  for (const { word, use, gloss } of WORDS) {
    const first = texts.find((t) => sentences(t).some((s) => use.test(s)));
    if (first && !sentences(first).some((s) => use.test(s) && gloss.test(s))) missing.push(`${word}, first in: “${first}”`);
  }
  return missing;
}

// Note: sentences split on a colon or semicolon too, so a word and its gloss are close, as a newcomer reads them.
describe('every synth word explained where first used (issue 129)', () => {
  for (const tutorial of TUTORIALS) {
    it(`in ${tutorial.preset}, read from its first card to its last`, () => {
      // The first card (its own words, then how a Tutorial goes), each Step's instruction then its note, the last card.
      const texts = [`${tutorial.intro} ${FROM_INIT}`, ...tutorial.steps.flatMap((s) => [s.say, s.note]), `${tutorial.summary} ${endLine(tutorial)}`];
      expect(unexplained(texts)).toEqual([]);
    });
  }

  it('in the Tour, card by card', () => {
    const texts = [...TOUR.map((c) => [c.look, c.chain, c.does, c.sees].join(' ')), TOUR_END];
    expect(unexplained(texts)).toEqual([]);
  });

  it('says Harmonics, not partials, rungs, spikes or bars (decision 7)', () => {
    const all = [...TUTORIALS.flatMap((t) => [t.intro, t.teaches, t.summary, ...t.steps.flatMap((s) => [s.say, s.note])]), ...TOUR.flatMap((c) => [c.look, c.chain, c.does, c.sees])];
    expect(all.filter((t) => /\b(partials?|rungs?|spikes?|bars)\b/i.test(t))).toEqual([]);
  });
});

describe('each Tutorial’s first and last card (issue 129, decisions 6 and 8)', () => {
  it('opens with words of its own and a line for the menu of what it teaches', () => {
    for (const t of TUTORIALS) {
      expect(t.intro.length, t.preset).toBeGreaterThan(40);
      expect(t.teaches.length, t.preset).toBeLessThanOrEqual(60);
    }
  });

  it('ends naming the next Tutorial and what it teaches; the last says it was the last', () => {
    expect(endLine(TUTORIALS[0])).toBe(`Next: Acid, ${TUTORIALS[1].teaches}. It is under Tutorial, at the top.`);
    expect(endLine(TUTORIALS[TUTORIALS.length - 1])).toMatch(/^That was the last Tutorial/);
  });
});
