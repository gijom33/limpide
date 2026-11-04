import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../test/renderHook'; // tells React it runs in a test
import { useHeaderPanel } from './useHeaderPanel';

/** An open header panel, its wrapper drawn or not (a narrow Tempo in a wide layout), and a button outside it. */
function Panel({ shown, setOpen }: { shown: boolean; setOpen: (open: boolean) => void }) {
  const { wrapper, button } = useHeaderPanel(true, setOpen);
  return createElement(
    'div',
    null,
    shown &&
      createElement(
        'div',
        { ref: wrapper },
        createElement('button', { ref: button, type: 'button' }, 'Tempo'),
        createElement('div', null, createElement('button', { type: 'button' }, 'Tap')),
      ),
    createElement('button', { type: 'button' }, 'Elsewhere'),
  );
}

async function openPanel() {
  const closed: boolean[] = [];
  const setOpen = (open: boolean) => void closed.push(!open);
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  const render = (shown: boolean) => act(async () => root.render(createElement(Panel, { shown, setOpen })));
  await render(true);
  const named = (name: string) => [...container.querySelectorAll('button')].find((b) => b.textContent === name) as HTMLButtonElement;
  return {
    closed,
    render,
    named,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe('useHeaderPanel: how a header panel closes', () => {
  let unmount = async () => {};
  afterEach(() => unmount());

  it('closes when the focus leaves it by Tab (issue 189)', async () => {
    const p = await openPanel();
    unmount = p.unmount;
    p.named('Tap').focus();
    p.named('Elsewhere').focus();
    expect(p.closed).toEqual([true]);
  });

  it('still closes on Tab out, and stays open on a press in it, once drawn again while open: a narrow Tempo after a turn to a wide layout and back (issue 188)', async () => {
    const p = await openPanel();
    unmount = p.unmount;
    await p.render(false);
    await p.render(true);
    p.named('Tap').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    expect(p.closed).toEqual([]);
    p.named('Tap').focus();
    p.named('Elsewhere').focus();
    expect(p.closed).toEqual([true]);
  });
});
