import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import '../../test/renderHook'; // tells React it runs in a test
import { useUnderHeader } from './useUnderHeader';

/**
 * A header 100 px tall with a panel's button 10 px down it, as a narrow screen's Tempo: the panel shown in one of two
 * wrappers, as the Tempo's is drawn again after a turn to a wide layout and back, or not at all.
 */
function Header({ shown }: { shown: 'first' | 'second' | null }) {
  const panel = useUnderHeader<HTMLDivElement>();
  const wrapper = (key: string) =>
    createElement(
      'div',
      { key, className: 'button-row', style: { position: 'absolute', top: '10px', right: 0 } },
      createElement('div', { ref: panel, style: { position: 'absolute', top: '100%' } }),
    );
  return createElement('header', { style: { position: 'relative', height: '100px' } }, shown && wrapper(shown));
}

async function header(shown: 'first' | 'second' | null) {
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  const render = (shown: 'first' | 'second' | null) => act(async () => root.render(createElement(Header, { shown })));
  await render(shown);
  return {
    render,
    panel: () => container.querySelector<HTMLElement>('.button-row > div'),
    row: () => container.querySelector<HTMLElement>('.button-row') as HTMLElement,
    unmount: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}

describe('useUnderHeader: a header panel opens under the header (issue 188, decision 1)', () => {
  let unmount = async () => {};
  afterEach(() => unmount());

  it('places the panel 6 px under the header’s foot, measured from its button’s row', async () => {
    const h = await header('first');
    unmount = h.unmount;
    expect(h.panel()?.style.top).toBe('96px');
  });

  it('places it again when the window’s size changes, the button’s row moved (a tablet turned)', async () => {
    const h = await header('first');
    unmount = h.unmount;
    h.row().style.top = '40px';
    await act(async () => window.dispatchEvent(new Event('resize')));
    expect(h.panel()?.style.top).toBe('66px');
  });

  it('places a panel drawn again while open: a narrow Tempo after a turn to a wide layout and back', async () => {
    const h = await header('first');
    unmount = h.unmount;
    await h.render(null);
    await h.render('second');
    expect(h.panel()?.style.top).toBe('96px');
  });
});
