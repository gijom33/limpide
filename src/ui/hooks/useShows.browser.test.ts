import { act } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderHook, testSession } from '../../test/renderHook';
import { useShows } from './useShows';

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

describe('useShows: the page telling the Shows what the person does (issues 79, 243)', () => {
  let unmount = async () => {};
  afterEach(() => unmount());

  it('stops the Demo when the person takes over, and says so: a press on the page, not on a knob', async () => {
    const { session } = testSession();
    const hook = await renderHook(useShows, session.shows);
    unmount = hook.unmount;
    await act(async () => session.shows.playDemo());
    expect(hook.result.current.demo).toBe(0);
    await touch('knob');
    expect(hook.result.current.demo).toBe(0);
    await touch('piano');
    expect(hook.result.current.demo).toBeNull();
    expect(hook.result.current.tookOver).toBe(true);
  });

  it('plays nothing on once the page goes', async () => {
    const { session, played } = testSession();
    const hook = await renderHook(useShows, session.shows);
    await act(async () => session.shows.toggleSong(() => 4));
    await hook.unmount();
    const count = played.length;
    await new Promise((done) => setTimeout(done, 400));
    expect(played.length).toBe(count);
  });
});
