import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { SectionStrip } from './SectionStrip';
import { SECTIONS, type SectionName } from './sections';

// React's act() warns unless it is told it runs in a test.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** Lets `n` frames go by, the strip's updates on the page's scroll inside act(). */
const frames = (n: number) =>
  act(
    () =>
      new Promise<void>((done) => {
        const next = () => (n-- > 0 ? requestAnimationFrame(next) : done());
        next();
      }),
  );

/**
 * The strip over a page of four tall sections under a header holding a piano, as on a phone, the page at its top.
 * `render` renders it again with new props.
 */
async function strip() {
  const header = document.body.appendChild(document.createElement('header'));
  header.appendChild(document.createElement('div')).className = 'piano';
  const nav = header.appendChild(document.createElement('div'));
  const main = document.body.appendChild(document.createElement('main'));
  for (const { name } of SECTIONS) {
    const section = main.appendChild(document.createElement('section'));
    section.setAttribute('aria-label', name);
    section.style.height = '1500px';
  }
  scrollTo({ top: 0, behavior: 'instant' });
  const root = createRoot(nav);
  const render = (props: { follow: { name: SectionName; key: number }; slow: boolean }) =>
    act(async () => root.render(createElement(SectionStrip, props)));
  const unmount = async () => {
    await act(async () => root.unmount());
    header.remove();
    main.remove();
    scrollTo({ top: 0, behavior: 'instant' });
  };
  return { render, unmount };
}

describe('SectionStrip: the Demo’s slow scroll (issue 211)', () => {
  let unmount = async () => {};
  afterEach(() => unmount());

  it('glides on to the section while the Demo plays', async () => {
    const s = await strip();
    unmount = s.unmount;
    await s.render({ follow: { name: 'Amp', key: 1 }, slow: true });
    await frames(10);
    const at = scrollY;
    expect(at).toBeGreaterThan(0);
    await frames(10);
    expect(scrollY).toBeGreaterThan(at);
  });

  it('stops where the page is once the Demo stops, mid-glide', async () => {
    const s = await strip();
    unmount = s.unmount;
    const follow = { name: 'Amp', key: 1 } as const;
    await s.render({ follow, slow: true });
    await frames(10);
    await s.render({ follow, slow: false });
    const at = scrollY;
    expect(at).toBeGreaterThan(0);
    await frames(30);
    expect(scrollY).toBe(at);
  });
});
