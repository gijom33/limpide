import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HISTORY } from './history';
import { OVERLAY_TIPS, PARAM_TIPS, TIPS, VIEWER_TIPS } from './tips';

// Issue 134: every History line sourced in the research file, at grade A or B (decisions 5 and 16).
const research = readFileSync(new URL('../../docs/research/134-history-in-the-tooltips.md', import.meta.url), 'utf8');

/** The sources the research lists ("- **[S1]** …"). */
const listed = new Set([...research.matchAll(/^- \*\*\[(S\d+)\]\*\*/gm)].map((m) => m[1]));

/**
 * The grades each source's facts carry. A fact's mark, "**A**", applies to the sources cited after it up to the next
 * mark: "**A** (instrumentation) [S11]; 1964: **C** [S32]" grades S11 A and S32 C. A source is as good as the best fact
 * read in it: ARP's 3620 manual [S6] is A for its LFO, though cited beside an unsourced (U) gap.
 */
const grades = new Map<string, Set<string>>();
for (const bullet of research.split('\n').filter((l) => l.startsWith('- '))) {
  for (const [, grade, cited] of bullet.matchAll(/\*\*([ABCU])\*\*((?:(?!\*\*[ABCU]\*\*).)*)/g)) {
    for (const [, source] of cited.matchAll(/\[(S\d+)\]/g)) grades.set(source, (grades.get(source) ?? new Set()).add(grade));
  }
}

const lines = Object.entries(HISTORY);

describe('every History line (issue 134)', () => {
  it('the research file reads as the test expects: its sources listed, its facts graded', () => {
    expect(listed.size).toBeGreaterThan(25);
    expect(grades.get('S1')).toEqual(new Set(['A']));
    expect(grades.get('S8')).toEqual(new Set(['C']));
    expect(grades.get('S11')).toEqual(new Set(['A']));
    expect(grades.get('S6')).toEqual(new Set(['A', 'U']));
    expect(grades.get('S32')).toEqual(new Set(['C']));
  });

  it.each(lines)('%s names its sources, each listed and graded A or B in the research', (_, { sources }) => {
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(listed, source).toContain(source);
      expect([...(grades.get(source) ?? [])].some((g) => g === 'A' || g === 'B'), `${source}: ${[...(grades.get(source) ?? [])]}`).toBe(true);
    }
  });

  it.each(lines)('%s is one sentence of at most 160 characters, with no “first” (decisions 6 and 10)', (_, { line }) => {
    expect(line.length).toBeLessThanOrEqual(160);
    expect(line).toMatch(/^[A-Z].*\.$/);
    expect(line.slice(0, -1)).not.toMatch(/[.!?] /);
    expect(line).not.toMatch(/\bfirst\b/i);
  });

  it('FM’s line says what Limpide does, the Prophet-5’s “Poly Mod”, before Chowning’s digital FM (decision 9)', () => {
    const { line } = HISTORY.fm;
    expect(line).toMatch(/“Poly Mod”.*1978.*Chowning.*1973.*DX7/);
  });
});

describe('the tips that carry one', () => {
  it('Attack, Decay, Sustain and Release share one line, on both Envelopes; the Filter Envelope has its own (decision 13)', () => {
    for (const id of ['ampAttack', 'ampDecay', 'ampSustain', 'ampRelease', 'filterAttack', 'filterDecay', 'filterSustain', 'filterRelease'] as const) {
      expect(PARAM_TIPS[id].history, id).toBe(HISTORY.stages);
    }
    expect(TIPS.filterEnvelope.history).toBe(HISTORY.filterEnvelope);
  });

  it('the Spectrums and the Harmonic Markers have one, the Scopes none (decision 11)', () => {
    for (const viewers of Object.values(VIEWER_TIPS)) {
      expect(viewers.spectrum.history).toBe(HISTORY.spectrum);
      expect(viewers.scope).not.toHaveProperty('history');
    }
    expect(OVERLAY_TIPS.harmonics.history).toBe(HISTORY.harmonicMarkers);
  });

  it('a tip with no musical past has none: Freeze, Snapshot, Theme, Demo, the C16’s (decision 4)', () => {
    for (const tip of [TIPS.freeze, TIPS.snapshot, TIPS.theme, TIPS.demo, TIPS.c16Layout, TIPS.c16Card]) expect(tip).not.toHaveProperty('history');
  });

  it('every line is in some tip', () => {
    const shown = new Set(
      [...Object.values(TIPS), ...Object.values(PARAM_TIPS), ...Object.values(OVERLAY_TIPS), ...Object.values(VIEWER_TIPS).map((v) => v.spectrum)].map(
        (tip) => 'history' in tip && tip.history,
      ),
    );
    for (const [name, line] of lines) expect(shown.has(line), name).toBe(true);
  });
});
