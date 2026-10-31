import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { TRACK } from '../../demo/track';
import { renderHook, testSession } from '../../test/renderHook';
import { usePlayers } from './usePlayers';

/** usePlayers with a session that writes down what it plays; `started` counts the Demo's starts the page is told of. */
async function players() {
  const { session, played } = testSession();
  const told = { demoStarts: 0, octave: 4 };
  const host = {
    session,
    octaveRef: { current: 4 },
    setOctave: (o: number | ((o: number) => number)) => void (told.octave = typeof o === 'function' ? o(told.octave) : o),
    heldNotes: [] as number[],
    onDemoStart: () => void told.demoStarts++,
  };
  const hook = await renderHook(usePlayers, host);
  return { ...hook, session, played, told, host };
}

/** A press on the page, as the Demo's stop rule hears it, on an element with these classes inside the page's main. */
async function touch(classes: string) {
  const main = document.body.appendChild(document.createElement('main'));
  const target = main.appendChild(document.createElement('div'));
  target.className = classes;
  await act(async () => {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse' }));
  });
  main.remove();
}

describe('usePlayers: the Demo, the Song and Listen (the 1.16.0 review)', () => {
  let unmount = async () => {};
  afterEach(() => unmount());

  it('plays the Demo from its first part, telling the page it started, until stopped', async () => {
    const p = await players();
    unmount = p.unmount;
    await act(async () => p.result.current.playDemo());
    expect(p.told.demoStarts).toBe(1);
    expect(p.result.current.demo).toBe(0);
    expect(p.session.patches.get().name).toBe(TRACK.parts[0].preset);
    await act(async () => p.result.current.stopDemo());
    expect(p.result.current.demo).toBeNull();
    expect(p.result.current.tookOver).toBe(false);
  });

  it('stops the Demo when the person takes over, and says so: a press on the page, not on a knob (issue 79)', async () => {
    const p = await players();
    unmount = p.unmount;
    await act(async () => p.result.current.playDemo());
    await touch('knob');
    expect(p.result.current.demo).toBe(0);
    await touch('piano');
    expect(p.result.current.demo).toBeNull();
    expect(p.result.current.tookOver).toBe(true);
  });

  it('ends the Song on a Note played by hand after it started, not one already held (issue 75)', async () => {
    const p = await players();
    unmount = p.unmount;
    await p.rerender({ ...p.host, heldNotes: [60] });
    await act(async () => p.result.current.toggleSong());
    expect(p.result.current.song).toBe(true);
    await p.rerender({ ...p.host, heldNotes: [60, 64] });
    expect(p.result.current.song).toBe(false);
  });

  it('plays one thing at a time: Listen stops the Demo, the Song stops Listen', async () => {
    const p = await players();
    unmount = p.unmount;
    await act(async () => p.result.current.playDemo());
    await act(async () => p.result.current.startListen({ phrase: 'C4:1 E4:1 G4:1', bpm: 120 }));
    expect(p.result.current.demo).toBeNull();
    expect(p.result.current.listening).toBe(true);
    await act(async () => p.result.current.toggleSong());
    expect(p.result.current.listening).toBe(false);
    expect(p.result.current.song).toBe(true);
    await act(async () => p.result.current.toggleSong());
    expect(p.result.current.song).toBe(false);
  });

  it('plays nothing on once the page goes', async () => {
    const p = await players();
    await act(async () => p.result.current.toggleSong());
    await p.unmount();
    const count = p.played.length;
    await new Promise((done) => setTimeout(done, 400));
    expect(p.played.length).toBe(count);
  });
});
