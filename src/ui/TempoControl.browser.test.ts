import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../test/renderHook'; // tells React it runs in a test
import { TempoControl } from './TempoControl';

/** The header's tempo in the page, at a BPM set from outside (Tap, a clock), and its screen reader's status. */
async function tempoControl(bpm: number) {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  const render = (bpm: number) =>
    act(async () => root.render(createElement(TempoControl, { tempo: { bpm, player: false, midi: false }, onSet: () => {}, onTap: () => {} })));
  await render(bpm);
  const status = container.querySelector('[role="status"]') as HTMLElement;
  return {
    status,
    render,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe('TempoControl: the BPM said to a screen reader', () => {
  let unmount = async () => {};
  afterEach(async () => {
    await unmount();
    vi.useRealTimers();
  });
  /** Long enough for a tempo to settle and be said. */
  const settle = () => act(async () => vi.advanceTimersByTime(1000));

  it('says a BPM said before again: Tap to 126, 120 typed, Tap to 126 again (issue 189)', async () => {
    vi.useFakeTimers();
    const tempo = await tempoControl(120);
    unmount = tempo.unmount;
    await tempo.render(126);
    await settle();
    expect(tempo.status.textContent).toBe('Tempo 126 BPM');
    // What a screen reader hears: a change in the status (the same words in the same node are none).
    let changes = 0;
    new MutationObserver((records) => void (changes += records.length)).observe(tempo.status, { childList: true, subtree: true, characterData: true });
    // 120 typed in the BPM, which says its own value: no news.
    const typed = document.body.appendChild(document.createElement('div'));
    typed.className = 'tempo-bpm';
    typed.tabIndex = 0;
    typed.focus();
    await tempo.render(120);
    typed.remove();
    await tempo.render(126);
    await settle();
    expect(changes).toBeGreaterThan(0);
    expect(tempo.status.textContent).toBe('Tempo 126 BPM');
  });
});
