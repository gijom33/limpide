import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SONG } from '../demo/song';
import { TRACK } from '../demo/track';
import { createLibrary } from '../patch/library';
import { setParam } from '../patch/patch';
import { createPatchStore } from '../patch/patchStore';
import { PRESETS } from '../patch/presets';
import { createTempoStore } from '../play/tempoStore';
import { memoryStorage } from '../test/memoryStorage';
import { TOUR, TOUR_LENGTH, TOUR_PATCH } from '../tutorial/tour';
import { rebuild, type Tutorial } from '../tutorial/tutorial';
import { TUTORIALS } from '../tutorial/tutorials';
import { createViewerStore } from '../viewers/viewerStore';
import { createShows } from './shows';

/**
 * The Shows over the real Patch, Viewer and tempo stores, a fake engine that writes down the Notes it is handed
 * (`played`), a fake page for its hide and show, and fake timers: `hold` is the Notes held by hand changing.
 */
function setup(storage = memoryStorage()) {
  const library = createLibrary(storage);
  const patches = createPatchStore({ hash: '', library, apply: () => {} });
  const viewers = createViewerStore({ storage, patches, setTapSource: () => {} });
  const tempo = createTempoStore({ storage, engine: { heardAt: (t: number) => t, setTempo: () => {} } });
  const played: number[] = [];
  const engine = {
    now: () => Date.now() / 1000,
    noteOn: (note: number) => void played.push(note),
    release: () => {},
    noteOff: () => {},
  };
  const heldListeners = new Set<(notes: number[]) => void>();
  const page = new EventTarget();
  const shows = createShows({
    engine, patches, viewers, tempo, storage, page, clock: () => Date.now(),
    onHeld: (listener) => {
      heldListeners.add(listener);
      return () => void heldListeners.delete(listener);
    },
  });
  const hold = (notes: number[]) => heldListeners.forEach((l) => l(notes));
  const pageEvent = (type: 'pagehide' | 'pageshow', persisted = false) => page.dispatchEvent(Object.assign(new Event(type), { persisted }));
  return { shows, patches, viewers, tempo, played, storage, hold, pageEvent };
}

const now = (s: ReturnType<typeof setup>) => s.shows.get();
const mine = setParam(PRESETS[3].patch, 'cutoff', 321);
/** The person's own Patch loaded, and a little changed, to be given back. */
const withMine = (s: ReturnType<typeof setup>) => {
  s.patches.load(PRESETS[3].name, mine);
  return s.patches.get();
};

beforeEach(() => void vi.useFakeTimers());
afterEach(() => void vi.useRealTimers());

describe('The Shows: the Demo, the Song and Listen, one playing at a time (issues 75, 243)', () => {
  it('plays the Demo from its first part, its Preset loaded, until stopped', () => {
    const s = setup();
    s.shows.playDemo();
    expect(now(s)).toMatchObject({ playing: 'demo', demo: 0, demoTrack: TRACK });
    expect(s.patches.get().name).toBe(TRACK.parts[0].preset);
    vi.advanceTimersByTime(1000);
    expect(s.played.length).toBeGreaterThan(0);
    s.shows.stopDemo();
    expect(now(s)).toMatchObject({ playing: null, demo: null, tookOver: false });
  });

  it('makes the page’s tempo the player’s while it plays, the person’s coming back when it stops (issue 112)', () => {
    const s = setup();
    s.tempo.set(100);
    s.shows.playDemo();
    expect(s.tempo.get()).toEqual({ bpm: TRACK.bpm, player: true, midi: false });
    s.shows.stopDemo();
    expect(s.tempo.get()).toEqual({ bpm: 100, player: false, midi: false });
    s.shows.toggleSong(() => 4);
    expect(s.tempo.get()).toEqual({ bpm: SONG.bpm, player: true, midi: false });
    s.shows.toggleSong(() => 4);
    expect(s.tempo.get().bpm).toBe(100);
    s.shows.startTutorial(TUTORIALS[0]);
    s.shows.toggleListen();
    expect(s.tempo.get().bpm).toBe(TUTORIALS[0].bpm);
    s.shows.toggleListen();
    expect(s.tempo.get().bpm).toBe(100);
  });

  it('plays one at a time: the Song stops Listen, the Demo stops the Song', () => {
    const s = setup();
    s.shows.startTutorial(TUTORIALS[0]);
    s.shows.toggleListen();
    expect(now(s).playing).toBe('listen');
    s.shows.toggleSong(() => 4);
    expect(now(s).playing).toBe('song');
    s.shows.playDemo();
    expect(now(s)).toMatchObject({ playing: 'demo', demo: 0 });
    s.shows.stopDemo();
    expect(now(s).playing).toBeNull();
  });

  it('moves the piano to the octave of the Demo’s part, and of Listen’s phrase', () => {
    const s = setup();
    const octaves: number[] = [];
    s.shows.onOctave((octave) => octaves.push(octave));
    // The Tour's first card plays A3, E3 and G3: the piano from C3 shows them.
    s.shows.startTour();
    expect(octaves).toEqual([3]);
    s.shows.playDemo();
    expect(octaves).toHaveLength(2);
  });

  it('ends the Demo by itself after its last part: back to Init, silent, the tempo given back', () => {
    const s = setup();
    s.tempo.set(100);
    s.shows.playDemo({ from: TRACK.parts.length - 1 });
    expect(now(s).demo).toBe(TRACK.parts.length - 1);
    vi.advanceTimersByTime(60_000);
    expect(now(s).playing).toBeNull();
    expect(s.patches.get().name).toBe(PRESETS[0].name);
    expect(s.tempo.get().bpm).toBe(100);
  });

  it('plays a riff on a shared sound, which stays loaded at its end', () => {
    const s = setup();
    withMine(s);
    s.shows.playDemo({ shared: true });
    expect(now(s).demoTrack.parts).toHaveLength(1);
    expect(now(s).demoTrack.parts[0].preset).toBe(PRESETS[3].name);
    vi.advanceTimersByTime(60_000);
    expect(now(s).playing).toBeNull();
    expect(s.patches.get().name).toBe(PRESETS[3].name);
  });

  it('leaves a knob turned by hand where it was put until the Demo’s next part (issue 73)', () => {
    const s = setup();
    // Kick's Filter Envelope Amount turns from its first beat.
    s.shows.playDemo();
    vi.advanceTimersByTime(1000);
    s.patches.change((p) => setParam(p, 'filterEnvAmount', 1), 'hand');
    vi.advanceTimersByTime(1000);
    expect(s.patches.get().patch.filterEnvAmount).toBe(1);
  });

  it('follows the Section of the knob the Demo turns, until the person scrolls, then from its next part (issue 227)', () => {
    const s = setup();
    s.shows.playDemo();
    vi.advanceTimersByTime(500);
    expect(now(s).follow?.name).toBe('Filter');
    s.shows.personScrolled();
    const { follow } = now(s);
    vi.advanceTimersByTime(5000);
    expect(now(s).follow).toBe(follow);
    s.shows.playDemo({ from: 1 });
    vi.advanceTimersByTime(500);
    expect(now(s).follow).not.toBe(follow);
  });
});

describe('The person taking over (issues 79, 242, 243)', () => {
  it('stops the Demo when the person takes over, and says so for 6 s', () => {
    const s = setup();
    s.shows.playDemo();
    s.shows.takeOver();
    expect(now(s)).toMatchObject({ playing: null, tookOver: true });
    // The Demo's part stays loaded: the sound the person took over is theirs.
    expect(s.patches.get().name).toBe(TRACK.parts[0].preset);
    vi.advanceTimersByTime(5900);
    expect(now(s).tookOver).toBe(true);
    vi.advanceTimersByTime(200);
    expect(now(s).tookOver).toBe(false);
  });

  it('says nothing of a takeover when the Demo was not playing, or was stopped by its own button', () => {
    const s = setup();
    s.shows.takeOver();
    expect(now(s).tookOver).toBe(false);
    s.shows.toggleSong(() => 4);
    s.shows.takeOver();
    expect(now(s)).toMatchObject({ playing: 'song', tookOver: false });
    s.shows.playDemo();
    s.shows.stopDemo();
    expect(now(s).tookOver).toBe(false);
  });

  it('clears “you are playing now” as the Song, a Tutorial, the Tour or the Demo starts, or when dismissed', () => {
    const s = setup();
    const starts = [
      () => s.shows.toggleSong(() => 4),
      () => s.shows.startTutorial(TUTORIALS[0]),
      () => s.shows.startTour(),
      () => s.shows.playDemo(),
      () => s.shows.dismissTookOver(),
    ];
    for (const start of starts) {
      s.shows.playDemo();
      s.shows.takeOver();
      start();
      expect(now(s).tookOver).toBe(false);
    }
  });

  it('ends the Song on a Note played by hand after it started, not one already held (issue 75)', () => {
    const s = setup();
    s.hold([60]);
    s.shows.toggleSong(() => 4);
    expect(now(s).playing).toBe('song');
    s.hold([60, 64]);
    expect(now(s).playing).toBeNull();
  });

  it('plays Listen and the Demo on through a Note played by hand', () => {
    const s = setup();
    s.shows.startTutorial(TUTORIALS[0]);
    s.shows.toggleListen();
    s.hold([60]);
    expect(now(s).playing).toBe('listen');
    s.shows.playDemo();
    s.hold([62]);
    expect(now(s).playing).toBe('demo');
  });

  it('moves the Song with the piano’s octave', () => {
    const s = setup();
    let octave = 4;
    s.shows.toggleSong(() => octave);
    vi.advanceTimersByTime(2000);
    const low = Math.min(...s.played);
    s.played.length = 0;
    octave = 6;
    vi.advanceTimersByTime(4000);
    expect(Math.min(...s.played)).toBeGreaterThan(low + 12);
  });

  it('plays nothing on, and gives the Tour’s Patch back, once the page goes', () => {
    const s = setup();
    s.shows.toggleSong(() => 4);
    s.shows.leave();
    const count = s.played.length;
    vi.advanceTimersByTime(1000);
    expect(s.played.length).toBe(count);
    const kept = withMine(s);
    s.shows.startTour();
    s.shows.leave();
    expect(s.patches.get()).toEqual(kept);
  });
});

describe('A Tutorial (issues 57, 158, 243)', () => {
  const sub = TUTORIALS[0];

  it('starts on Init, stopping what plays and ending the Tour', () => {
    const s = setup();
    s.shows.toggleSong(() => 4);
    s.shows.startTutorial(sub);
    expect(now(s)).toMatchObject({ playing: null, tutorial: { tutorial: sub, index: -1 } });
    expect(s.patches.get().name).toBe(PRESETS[0].name);
    const kept = withMine(s);
    s.shows.startTour();
    expect(now(s).tutorial).toBeNull();
    s.shows.startTutorial(sub);
    expect(now(s).tour).toBeNull();
    // The Tour gave the person's Patch back before the Tutorial's Init.
    expect(kept.name).not.toBe(PRESETS[0].name);
    expect(s.patches.get().name).toBe(PRESETS[0].name);
  });

  it('counts a Step once its control rests within reach, snapping it to the target', () => {
    const s = setup();
    s.shows.startTutorial(sub);
    s.shows.moveTutorial(1);
    const step = sub.steps[0];
    if (step.kind !== 'param') throw new Error('Sub Ladder starts on a knob');
    s.patches.change((p) => setParam(p, step.id, step.to * 0.99), 'hand');
    vi.advanceTimersByTime(300);
    // Moved again before it settled: the wait starts again.
    s.patches.change((p) => setParam(p, step.id, step.to * 0.98), 'hand');
    vi.advanceTimersByTime(300);
    expect(now(s).tutorial?.done[0]).toBe(false);
    vi.advanceTimersByTime(150);
    expect(now(s).tutorial?.done[0]).toBe(true);
    expect(s.patches.get().patch[step.id]).toBe(step.to);
  });

  it('does a Step for the person', () => {
    const s = setup();
    s.shows.startTutorial(sub);
    s.shows.moveTutorial(1);
    s.shows.doStep();
    vi.advanceTimersByTime(500);
    expect(now(s).tutorial?.done[0]).toBe(true);
  });

  it('turns off a Display Step’s overlay that is on as it comes, and gives it back if the Tutorial is left (issue 158)', () => {
    const s = setup();
    const display = sub.steps.findIndex((step) => step.kind === 'display');
    const step = sub.steps[display];
    if (step.kind !== 'display') throw new Error('Sub Ladder has a Display Step');
    s.viewers.dispatch({ type: 'showOverlay', overlay: step.overlay });
    s.shows.startTutorial(sub);
    s.shows.moveTutorial(display + 1);
    expect(s.viewers.get().overlays[step.overlay]).toBe(false);
    s.shows.quitTutorial();
    expect(s.viewers.get().overlays[step.overlay]).toBe(true);
    expect(now(s).tutorial).toBeNull();
  });

  it('gives the overlays back as the page hides, and turns them off again if the browser brings it back', () => {
    const s = setup();
    const display = sub.steps.findIndex((step) => step.kind === 'display');
    const step = sub.steps[display];
    if (step.kind !== 'display') throw new Error('Sub Ladder has a Display Step');
    s.viewers.dispatch({ type: 'showOverlay', overlay: step.overlay });
    s.shows.startTutorial(sub);
    s.shows.moveTutorial(display + 1);
    s.pageEvent('pagehide');
    expect(s.viewers.get().overlays[step.overlay]).toBe(true);
    s.pageEvent('pageshow', true);
    expect(s.viewers.get().overlays[step.overlay]).toBe(false);
  });

  it('clears the Snapshot its Step took as it is left, not one the person took since', () => {
    const tutorial = TUTORIALS.find((t) => t.steps.some((step) => step.kind === 'action'))!;
    const at = tutorial.steps.findIndex((step) => step.kind === 'action');
    const s = setup();
    s.shows.startTutorial(tutorial);
    s.shows.moveTutorial(at + 1);
    s.shows.doStep();
    vi.advanceTimersByTime(500);
    expect(s.viewers.get().viewer.snapshot).not.toBeNull();
    s.shows.quitTutorial();
    expect(s.viewers.get().viewer.snapshot).toBeNull();

    s.shows.startTutorial(tutorial);
    s.shows.moveTutorial(at + 1);
    s.shows.doStep();
    vi.advanceTimersByTime(500);
    s.viewers.dispatch({ type: 'takeSnapshot' });
    s.shows.quitTutorial();
    expect(s.viewers.get().viewer.snapshot).not.toBeNull();
  });

  it('keeps the Patch as the person built it when left', () => {
    const s = setup();
    s.shows.startTutorial(sub);
    s.patches.change((p) => setParam(p, 'cutoff', 777), 'hand');
    s.shows.quitTutorial();
    expect(s.patches.get().patch.cutoff).toBe(777);
  });

  it('counts as finished on its last card, remembered, and names a sound that matches after its Preset', () => {
    const storage = memoryStorage();
    const s = setup(storage);
    s.shows.startTutorial(sub);
    s.patches.change(() => rebuild(sub), 'hand');
    s.shows.moveTutorial(sub.steps.length + 1);
    expect(now(s).tutorial).toMatchObject({ index: sub.steps.length, differs: [] });
    expect(now(s).finished.has(sub.preset)).toBe(true);
    expect(s.patches.get().name).toBe(sub.preset);
    expect(setup(storage).shows.get().finished.has(sub.preset)).toBe(true);
  });

  it('lists what differs from the Preset on its last card', () => {
    const s = setup();
    s.shows.startTutorial(sub);
    s.shows.moveTutorial(sub.steps.length + 1);
    expect(now(s).tutorial?.differs.length).toBeGreaterThan(0);
    expect(s.patches.get().name).toBe(PRESETS[0].name);
  });

  it('plays its phrase over and over on Listen, which a quit stops', () => {
    const s = setup();
    s.shows.startTutorial(sub);
    s.shows.toggleListen();
    expect(now(s).playing).toBe('listen');
    s.shows.toggleListen();
    expect(now(s).playing).toBeNull();
    s.shows.toggleListen();
    s.shows.quitTutorial();
    expect(now(s).playing).toBeNull();
  });

  it('starts the next Tutorial from its last card, giving back what the first changed', () => {
    const s = setup();
    const next: Tutorial = TUTORIALS[1];
    s.shows.startTutorial(sub);
    s.shows.startTutorial(next);
    expect(now(s).tutorial).toMatchObject({ tutorial: next, index: -1 });
  });
});

describe('The Tour (issues 128, 130, 210, 243)', () => {
  it('keeps the person’s Patch aside, plays on its own with its card’s phrase, and gives it back when closed', () => {
    const s = setup();
    const kept = withMine(s);
    s.shows.startTour();
    expect(now(s)).toMatchObject({ playing: 'listen', tour: { index: 0 } });
    expect(s.patches.get().name).toBe(TOUR_PATCH.name);
    s.shows.endTour();
    expect(now(s)).toMatchObject({ playing: null, tour: null });
    expect(s.patches.get()).toEqual(kept);
  });

  it('stops what plays and ends a Tutorial as it starts; started again, it goes back to its first card', () => {
    const s = setup();
    s.shows.startTutorial(TUTORIALS[0]);
    s.shows.startTour();
    expect(now(s).tutorial).toBeNull();
    s.shows.moveTour(2);
    s.shows.startTour();
    expect(now(s).tour?.index).toBe(0);
    s.shows.endTour();
    expect(s.patches.get().name).toBe(PRESETS[0].name);
  });

  it('is ended by a Patch the person loads, which stays', () => {
    const s = setup();
    withMine(s);
    s.shows.startTour();
    s.patches.load(PRESETS[5].name, PRESETS[5].patch);
    expect(now(s)).toMatchObject({ playing: null, tour: null });
    expect(s.patches.get().name).toBe(PRESETS[5].name);
  });

  it('is ended by the Song, the person’s Patch given back for it to play on (issue 242)', () => {
    const s = setup();
    const kept = withMine(s);
    s.shows.startTour();
    s.shows.toggleSong(() => 4);
    expect(now(s)).toMatchObject({ playing: 'song', tour: null });
    expect(s.patches.get()).toEqual(kept);
  });

  it('is ended by the Demo, and by a page hidden, the person’s Patch given back', () => {
    const s = setup();
    withMine(s);
    s.shows.startTour();
    s.shows.playDemo();
    expect(now(s).tour).toBeNull();
    s.shows.stopDemo();
    const kept = withMine(s);
    s.shows.startTour();
    s.pageEvent('pagehide');
    expect(now(s).tour).toBeNull();
    expect(s.patches.get()).toEqual(kept);
  });

  it('gives the person’s Patch back value for value, closed on any card after it turned its controls (issue 250)', () => {
    for (let card = 0; card < TOUR_LENGTH; card++) {
      const s = setup();
      const kept = withMine(s);
      s.shows.startTour();
      for (let i = 0; i < card; i++) s.shows.moveTour(1);
      vi.advanceTimersByTime(4000); // the card turning its controls
      s.shows.endTour();
      expect(s.patches.get(), `closed on card ${card + 1}`).toEqual(kept);
      vi.advanceTimersByTime(4000); // nothing turns it after
      expect(s.patches.get(), `closed on card ${card + 1}`).toEqual(kept);
    }
  });

  it('turns its card’s controls, leaving one the person turns to them for the rest of the card', () => {
    const s = setup();
    s.shows.startTour();
    s.shows.moveTour(1);
    const filter = TOUR[1];
    expect(now(s).tour?.moving).toBe(filter.moves[0].id);
    vi.advanceTimersByTime(1500);
    expect(s.patches.get().patch.cutoff).toBeLessThan(2000);
    s.patches.change((p) => setParam(p, 'cutoff', 5000), 'hand');
    vi.advanceTimersByTime(1000);
    expect(s.patches.get().patch.cutoff).toBe(5000);
    s.shows.moveTour(-1);
    s.shows.moveTour(1);
    // The card again: every control is the synth's, from the Tour's Patch's values.
    expect(s.patches.get().patch.cutoff).toBe(TOUR_PATCH.patch.cutoff);
  });

  it('freezes the Viewers on the Amp card until the person takes Freeze, giving back only its own at Next (issue 130)', () => {
    const s = setup();
    const frozen = () => s.viewers.get().viewer.frozen;
    s.shows.startTour();
    s.shows.moveTour(2);
    vi.advanceTimersByTime(4000);
    expect(frozen()).toBe(true);
    expect(now(s).tour).toMatchObject({ freezing: true });
    expect(now(s).tour?.naming?.[0]).toMatch(/^Attack/);
    s.shows.moveTour(1);
    expect(frozen()).toBe(false);

    s.shows.moveTour(-1);
    vi.advanceTimersByTime(4000);
    // The person unfreezes: Freeze is theirs for the card.
    s.viewers.dispatch({ type: 'toggleFreeze' });
    vi.advanceTimersByTime(50);
    expect(now(s).tour).toMatchObject({ freezing: false, naming: null });
    vi.advanceTimersByTime(7000);
    expect(frozen()).toBe(false);
    s.viewers.dispatch({ type: 'toggleFreeze' });
    s.shows.moveTour(1);
    expect(frozen()).toBe(true);
  });

  it('plays and turns nothing on the cards after the Sections (issue 210)', () => {
    const s = setup();
    s.shows.startTour();
    s.shows.moveTour(TOUR.length);
    expect(now(s)).toMatchObject({ playing: null, tour: { index: TOUR.length, moving: null } });
    s.shows.moveTour(TOUR_LENGTH);
    expect(now(s).tour?.index).toBe(TOUR_LENGTH - 1);
  });

  it('leaves the page to the person who scrolls it, for the rest of the card', () => {
    const s = setup();
    s.shows.startTour();
    expect(now(s).tour?.theirs).toBe(false);
    s.shows.personScrolled();
    expect(now(s).tour?.theirs).toBe(true);
    s.shows.moveTour(1);
    expect(now(s).tour?.theirs).toBe(false);
  });
});
