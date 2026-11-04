import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type CoverWatch, watchCovers } from './mascotCovers';

/** Lets the page draw a frame, so a scroll's event and the observers have come. */
const aFrame = () => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done())));

/** A box of the page's at a place, by its style, with `className`. */
function box(className: string, left: number, top: number, parent: Element = document.body) {
  const el = parent.appendChild(document.createElement('div'));
  el.className = className;
  Object.assign(el.style, { position: 'fixed', left: `${left}px`, top: `${top}px`, width: '100px', height: '50px' });
  return el;
}

describe('watchCovers: what Bead keeps clear of, kept up to date as the page changes (issue 220)', () => {
  let watch: CoverWatch;
  let page: HTMLElement;
  beforeEach(() => {
    page = document.body.appendChild(document.createElement('div'));
    watch = watchCovers();
  });
  afterEach(() => {
    watch.stop();
    page.remove();
    vi.restoreAllMocks();
  });

  it('sees a panel the moment it opens, at its place, and no longer once it closes', () => {
    expect(watch.covers()).toEqual([]);
    const panel = box('tempo-panel', 30, 40, page);
    expect(watch.covers().map(({ el, box: { left, top } }) => ({ el, left, top }))).toEqual([{ el: panel, left: 30, top: 40 }]);
    panel.remove();
    expect(watch.covers()).toEqual([]);
  });

  it('sees a docked card hidden and shown again, and tells the cards and the panels apart from the tips', () => {
    const card = box('docked', 200, 300, page);
    const tip = box('tooltip', 10, 10, page);
    expect(watch.covers().map((c) => c.el)).toEqual([card, tip]);
    expect(watch.docked().map((r) => r.top)).toEqual([300]);
    expect(watch.panels().map((r) => r.top)).toEqual([300]);
    card.hidden = true;
    expect(watch.covers().map((c) => c.el)).toEqual([tip]);
    expect(watch.docked()).toEqual([]);
    card.hidden = false;
    expect(watch.docked().map((r) => r.top)).toEqual([300]);
  });

  it('sees a tip that becomes one by its class, inside what was there already', () => {
    const holder = page.appendChild(document.createElement('section'));
    const tip = box('', 5, 6, holder);
    expect(watch.covers()).toEqual([]);
    tip.className = 'tooltip';
    expect(watch.covers().map((c) => c.el)).toEqual([tip]);
  });

  it('reads a card again where it is dragged to', () => {
    const card = box('docked', 200, 300, page);
    expect(watch.docked()[0].left).toBe(200);
    card.style.left = '260px';
    expect(watch.docked()[0].left).toBe(260);
  });

  it('reads a panel again once what holds it scrolls', async () => {
    const scroller = page.appendChild(document.createElement('div'));
    Object.assign(scroller.style, { position: 'fixed', left: '0', top: '0', width: '300px', height: '200px', overflow: 'auto' });
    const panel = scroller.appendChild(document.createElement('div'));
    panel.className = 'patch-panel';
    Object.assign(panel.style, { marginTop: '100px', height: '50px' });
    scroller.appendChild(document.createElement('div')).style.height = '1000px';
    expect(watch.panels()[0].top).toBe(100);
    scroller.scrollTop = 60;
    await aFrame();
    expect(watch.panels()[0].top).toBe(40);
  });

  it('with nothing changed, reads no box again', async () => {
    box('tempo-panel', 30, 40, page);
    box('docked', 200, 300, page);
    watch.covers();
    await aFrame();
    watch.covers();
    const read = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    for (let i = 0; i < 5; i++) {
      watch.covers();
      watch.docked();
      watch.panels();
    }
    expect(read).not.toHaveBeenCalled();
  });

  it('counts a cover opening, moving and closing, and the window resizing, but nothing else the page does', async () => {
    const moved = watch.moved();
    page.appendChild(document.createElement('p')).textContent = 'Cutoff';
    expect(watch.moved()).toBe(moved);
    const panel = box('display-panel', 0, 0, page);
    expect(watch.moved()).toBe(moved + 1);
    panel.style.top = '20px';
    expect(watch.moved()).toBe(moved + 2);
    watch.covers();
    expect(watch.moved()).toBe(moved + 2);
    panel.remove();
    expect(watch.moved()).toBe(moved + 3);
    dispatchEvent(new Event('resize'));
    expect(watch.moved()).toBe(moved + 4);
  });

  it('reads no box again for a drawing’s shapes, nor for the marks the tests read', async () => {
    box('tempo-panel', 30, 40, page);
    const drawing = page.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    const dot = drawing.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
    watch.covers();
    await aFrame();
    watch.covers();
    const read = vi.spyOn(Element.prototype, 'getBoundingClientRect');
    dot.setAttribute('cy', '4'); // a Viewer's or a plot's drawing, every frame
    drawing.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'rect'));
    page.dataset.beats = '3'; // a mark for the tests, named in no style
    watch.covers();
    expect(read).not.toHaveBeenCalled();
    page.className = 'folded'; // and a change that may move it
    watch.covers();
    expect(read).toHaveBeenCalled();
  });

  it('counts the scrolls, of the window or inside the page, apart from the text moving', async () => {
    const scroller = page.appendChild(document.createElement('div'));
    Object.assign(scroller.style, { height: '100px', overflow: 'auto' });
    scroller.appendChild(document.createElement('div')).style.height = '1000px';
    await aFrame();
    const [moved, scrolls] = [watch.moved(), watch.scrolls()];
    scroller.scrollTop = 50;
    await aFrame();
    expect(watch.scrolls()).toBe(scrolls + 1);
    expect(watch.moved()).toBe(moved);
  });
});
