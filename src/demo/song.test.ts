import { describe, expect, it, vi } from 'vitest';
import { parsePhrase, phraseLength } from './phrase';
import { SONG, type SongHost, startSong } from './song';

function fakeHost() {
  let clock = 0;
  let octave = 4;
  let voices = 8;
  const calls: { kind: string; note?: number; at: number }[] = [];
  const keys: number[][] = [];
  const host: SongHost = {
    now: () => clock,
    octave: () => octave,
    voices: () => voices,
    noteOn: (note, _v, at) => calls.push({ kind: 'on', note, at }),
    noteOff: (at) => calls.push({ kind: 'off', at }),
    release: (note, at) => calls.push({ kind: 'release', note, at }),
    onNotes: (notes) => keys.push(notes),
  };
  const run = (seconds: number) => {
    for (let t = 0; t < seconds; t += 0.04) {
      clock += 0.04;
      vi.advanceTimersByTime(40);
    }
  };
  return { host, calls, keys, run, setOctave: (o: number) => (octave = o), setVoices: (v: number) => (voices = v) };
}

const length = phraseLength(SONG.phrase, SONG.bpm);
const ons = (calls: { kind: string; note?: number; at: number }[]) => calls.filter((c) => c.kind === 'on');

describe('the Song', () => {
  it('only uses the 13 keys from the piano’s C to the C above, in whole bars', () => {
    const notes = parsePhrase(SONG.phrase, SONG.bpm).map((e) => e.note);
    expect(Math.min(...notes)).toBe(60); // C4: the piano's first key at octave 4
    expect(Math.max(...notes)).toBe(72); // C5
    expect(((length * SONG.bpm) / 60) % 4).toBe(0);
  });

  it('loops without a gap: each pass starts exactly one Song after the last', () => {
    vi.useFakeTimers();
    const { host, calls, run } = fakeHost();
    const stop = startSong(host);
    run(length * 2 + 1);
    stop();
    const count = parsePhrase(SONG.phrase, SONG.bpm).length;
    const notes = ons(calls);
    expect(notes.length).toBeGreaterThan(2 * count);
    expect(notes[count].at - notes[0].at).toBeCloseTo(length, 6);
    expect(notes[2 * count].at - notes[count].at).toBeCloseTo(length, 6);
    vi.useRealTimers();
  });

  it('hands every start and end to the engine in time order', () => {
    vi.useFakeTimers();
    const { host, calls, run } = fakeHost();
    const stop = startSong(host);
    run(length + 1);
    const times = calls.map((c) => c.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    stop();
    vi.useRealTimers();
  });

  it('moves with the piano’s octave from the next Note; a Note ends as the Note it started as', () => {
    vi.useFakeTimers();
    const { host, calls, run, setOctave } = fakeHost();
    const stop = startSong(host);
    run(2);
    const before = ons(calls).length;
    setOctave(5);
    run(2);
    const after = ons(calls).slice(before);
    expect(after.length).toBeGreaterThan(0);
    expect(after.every((c) => c.note! >= 72 && c.note! <= 84)).toBe(true);
    // Every release is of a Note that was started.
    const started = new Set(ons(calls).map((c) => c.note));
    expect(calls.filter((c) => c.kind === 'release').every((c) => started.has(c.note))).toBe(true);
    stop();
    vi.useRealTimers();
  });

  it('on one Voice, ends each Note by closing the Gate; on several, releases it by Note', () => {
    vi.useFakeTimers();
    const { host, calls, run, setVoices } = fakeHost();
    setVoices(1);
    const stop = startSong(host);
    run(1);
    expect(calls.some((c) => c.kind === 'off')).toBe(true);
    expect(calls.some((c) => c.kind === 'release')).toBe(false);
    setVoices(8);
    const at = calls.length;
    run(1);
    expect(calls.slice(at).some((c) => c.kind === 'release')).toBe(true);
    stop();
    vi.useRealTimers();
  });

  it('lights the keys sounding now; stopping silences everything, clears the keys and hands nothing more over', () => {
    vi.useFakeTimers();
    const { host, calls, keys, run } = fakeHost();
    const stop = startSong(host);
    run(1);
    expect(keys.some((k) => k.length > 0)).toBe(true);
    stop();
    expect(keys.at(-1)).toEqual([]);
    expect(calls.at(-1)!.kind).toBe('off');
    const before = calls.length;
    run(2);
    expect(calls.length).toBe(before);
    vi.useRealTimers();
  });
});
