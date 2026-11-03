import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import type { AudioSession } from '../app/session';
import { createLibrary } from '../patch/library';
import { createPatchStore } from '../patch/patchStore';
import { createTempoStore } from '../play/tempoStore';
import { createViewerStore } from '../viewers/viewerStore';
import { memoryStorage } from './memoryStorage';

// React's act() warns unless it is told it runs in a test.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Renders a hook in a component of its own, in the page, for its unit tests: `result.current` is what it returned at
 * its latest render; `rerender` renders it again with new props; `unmount` takes it away, its effects cleaned up.
 */
export async function renderHook<P, R>(hook: (props: P) => R, props: P) {
  const result = { current: undefined as R };
  const Probe = ({ props }: { props: P }) => {
    result.current = hook(props);
    return null;
  };
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  await act(async () => root.render(createElement(Probe, { props })));
  return {
    result,
    rerender: (next: P) => act(async () => root.render(createElement(Probe, { props: next }))),
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

/**
 * An audio session for a hook's tests: the real Patch and Viewer stores on memory storage, an engine and a Note input
 * that only write down what they are asked (`played`), and no audio.
 */
export function testSession() {
  const storage = memoryStorage();
  const library = createLibrary(storage);
  const patches = createPatchStore({ hash: '', library, apply: () => {} });
  const viewers = createViewerStore({ storage, patches, setTapSource: () => {} });
  const played: string[] = [];
  const pressed = new Set<(note: number) => void>();
  const engine = {
    now: () => performance.now() / 1000,
    noteOn: (note: number) => void played.push(`on ${note}`),
    release: (note: number) => void played.push(`release ${note}`),
    noteOff: () => void played.push('off'),
  };
  const input = {
    press: (note: number) => {
      played.push(`press ${note}`);
      for (const listener of pressed) listener(note);
    },
    release: (note: number) => void played.push(`let go ${note}`),
    setHold: () => {},
  };
  const tempo = createTempoStore({ storage, engine: { heardAt: (pageTime) => pageTime, setTempo: () => {} } });
  const session = {
    engine, input, patches, viewers, library, tempo, shared: false,
    onHeld: () => () => {},
    onPress: (listener: (note: number) => void) => {
      pressed.add(listener);
      return () => pressed.delete(listener);
    },
    muteInput: () => {},
  } as unknown as AudioSession;
  return { session, storage, played };
}
