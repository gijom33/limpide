import { describe, expect, it } from 'vitest';
import { stepParam, stepWords } from '../patch/grid';
import { formatParam } from '../patch/patch';
import { clampBpm, formatSyncedRate, NOTE_VALUES, noteHz, noteIndex, TEMPO, TEMPO_STEPS, tappedBpm, wholeBpm } from './tempo';

describe('the note values (issue 112)', () => {
  it('go from 4 bars to 1/32, each straight, dotted and triplet, slowest first', () => {
    expect(NOTE_VALUES).toHaveLength(24);
    for (const name of ['4 bars', '2 bars', '1 bar', '1/2', '1/4', '1/8', '1/16', '1/32'])
      for (const kind of ['', ' D', ' T']) expect(NOTE_VALUES.map((v) => v.name)).toContain(`${name}${kind}`);
    for (let i = 1; i < NOTE_VALUES.length; i++) expect(NOTE_VALUES[i].beats).toBeLessThan(NOTE_VALUES[i - 1].beats);
  });

  it('give the Hz of their length at the tempo: 1/8 at 120 is 4 Hz, 1/4 D at 120 is 4/3 Hz, 1 bar at 60 is 0.25 Hz', () => {
    expect(noteHz(noteIndex('1/8'), 120)).toBeCloseTo(4, 12);
    expect(noteHz(noteIndex('1/4 D'), 120)).toBeCloseTo(4 / 3, 12);
    expect(noteHz(noteIndex('1 bar'), 60)).toBeCloseTo(0.25, 12);
    expect(noteHz(noteIndex('1/4 T'), 90)).toBeCloseTo(2.25, 12);
    expect(noteHz(noteIndex('4 bars'), 120)).toBeCloseTo(1 / 8, 12);
    expect(noteHz(noteIndex('1/32'), 240)).toBeCloseTo(32, 12);
  });

  it('named by the note value, its Hz read as the Rate in Hz reads it, for its tip: "1/8", "4.00 Hz" (issue 193)', () => {
    expect(formatSyncedRate(noteIndex('1/8'), 120)).toEqual({ note: '1/8', hz: '4.00 Hz' });
    expect(formatSyncedRate(noteIndex('1/4'), 120)).toEqual({ note: '1/4', hz: formatParam('lfoRate', 2) });
    expect(formatSyncedRate(noteIndex('1/4 D'), 120)).toEqual({ note: '1/4 D', hz: '1.33 Hz' });
    expect(formatSyncedRate(noteIndex('4 bars'), 120)).toEqual({ note: '4 bars', hz: '0.13 Hz' });
    expect(formatSyncedRate(noteIndex('1/32 T'), 240)).toEqual({ note: '1/32 T', hz: '48 Hz' });
  });
});

describe('the tempo', () => {
  it('is a BPM to a tenth from 40 to 240, 120 by default (issue 223)', () => {
    expect(TEMPO).toEqual({ min: 40, max: 240, default: 120 });
    expect(clampBpm(20)).toBe(40);
    expect(clampBpm(300)).toBe(240);
    expect(clampBpm(127.6)).toBe(127.6);
    expect(clampBpm(127.64)).toBe(127.6);
    expect(clampBpm(120.1 + 0.2)).toBe(120.3);
  });

  it('a Controller’s knob, a clock and the taps set a whole BPM', () => {
    expect(wholeBpm(127.6)).toBe(128);
    expect(wholeBpm(300)).toBe(240);
  });

  it('steps as every knob does: the arrows 1 BPM, Shift a tenth, Page 10, to the next on each grid (issue 223)', () => {
    const step = (bpm: number, direction: 1 | -1, size: 'unit' | 'fine' | 'coarse') => stepParam(TEMPO_STEPS, bpm, direction, size);
    expect(step(120, 1, 'unit')).toBe(121);
    expect(step(120.3, 1, 'unit')).toBe(121);
    expect(step(120, 1, 'fine')).toBe(120.1);
    expect(step(120.9, -1, 'fine')).toBe(120.8);
    expect(step(123, 1, 'coarse')).toBe(130);
    expect(step(239.5, 1, 'coarse')).toBe(240);
    expect(stepWords(TEMPO_STEPS.grid)).toBe('↑↓ 1 BPM · Shift 0.1 BPM · Page 10 BPM');
  });

  it('is set from four taps, by the time between them', () => {
    expect(tappedBpm([0, 0.5, 1, 1.5])).toBe(120);
    expect(tappedBpm([10, 10.47, 10.94, 11.4])).toBe(129);
    // One gap is no tempo; a pause longer than the slowest beat starts the count again.
    expect(tappedBpm([0])).toBeUndefined();
    expect(tappedBpm([0, 5, 5.5, 6, 6.5])).toBe(120);
    expect(tappedBpm([0, 5])).toBeUndefined();
  });
});
