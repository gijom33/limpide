/**
 * What is drawn over the page, which Bead never stands under (issue 164): the docked cards (the Demo's, a Tutorial's, the
 * Tour's), the tips, the open panels and menus, the Preset's description and the Patch's plain words (issue 123). It
 * stays drawn under them, so it never covers their words or buttons. One list for Bead and its browser tests (issue 224).
 * Each is a class, and at most `:not([hidden])`, on the element itself, never on what holds it: an element becomes one
 * or stops being one only as it is put in or taken out, or by its own class or `hidden` (watchCovers counts on it).
 */
export const DOCKED = '.docked:not([hidden])';
export const PANELS = `${DOCKED}, .patch-about, .patch-words, .patch-panel, .destination-menu, .tutorial-menu-panel, .tempo-panel, .display-panel, .midi-panel, .learn-bar, .quick-setup`;
export const COVERS = `${PANELS}, .tooltip:not([hidden])`;
/**
 * The page's text, which it never stands over (issue 181): every label, readout and heading, as the boxes of its lines,
 * but what is drawn over it anyway (the cards, tips and panels) and what only a screen reader reads.
 */
export const NOT_TEXT = `.mascot, .visually-hidden, ${COVERS}`;
/** Bead's own drawing, its droplets and its fishing line: changed every frame, they move nothing else. */
const BEAD_OWN = '.mascot, .mascot-spray, .mascot-fishing';

export interface CoverWatch {
  /** What covers the page now, in the page's order, each with its box: those shown only. */
  covers(): readonly { el: Element; box: DOMRect }[];
  /** The boxes of the docked cards shown. */
  docked(): readonly DOMRect[];
  /** The boxes of the cards and panels shown: the covers but the tips. */
  panels(): readonly DOMRect[];
  /** A count that changes whenever a cover opens, closes or moves, or the window resizes. */
  moved(): number;
  /** How many times the window, or anything in the page, has scrolled. */
  scrolls(): number;
  stop(): void;
}

/**
 * The `data-` and `aria-` attributes some style rule names: only those of theirs can change how the page looks
 * (`[data-folded]` does; the Viewers' marks for the tests, set every frame, do not).
 */
function styledAttributes(): Set<string> {
  const names = new Set<string>();
  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) for (const [, name] of rule.selectorText.matchAll(/\[\s*((?:data|aria)-[\w-]+)/g)) names.add(name);
      if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) walk(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      // Another site's sheet, whose rules cannot be read: it names none of the page's attributes.
    }
  }
  return names;
}

const sameBox = (a: DOMRect, b: DOMRect) => a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height;

/**
 * What covers the page, kept up to date as the page changes rather than looked for each frame (review 18's finding 4,
 * issue 220): the list as covers are put in, taken out, shown and hidden; their boxes read again only once the page has
 * changed, scrolled or resized, or while one of them, or what holds it, is in a transition or an animation.
 */
export function watchCovers(): CoverWatch {
  const styled = styledAttributes();
  const els = new Set<Element>();
  let ordered: Element[] = [];
  let read: { el: Element; box: DOMRect }[] = [];
  let docked: DOMRect[] = [];
  let panels: DOMRect[] = [];
  let stale = true; // the boxes
  let listChanged = true;
  let moved = 0;
  let scrolls = 0;
  // The covers and what holds them, in a transition or an animation.
  const moving = new Set<Element>();
  const sizes = new ResizeObserver(() => void (stale = true));
  sizes.observe(document.documentElement);

  const consider = (el: Element) => {
    const is = el.matches(COVERS);
    if (is === els.has(el)) return;
    if (is) {
      els.add(el);
      sizes.observe(el);
    } else {
      els.delete(el);
      sizes.unobserve(el);
    }
    listChanged = true;
  };
  const considerAll = (root: Element) => {
    consider(root);
    for (const el of root.querySelectorAll(COVERS)) consider(el);
  };
  const ours = (el: Element) => !!el.closest(BEAD_OWN);
  const take = (records: MutationRecord[]) => {
    for (const r of records) {
      const el = r.target instanceof Element ? r.target : r.target.parentElement;
      if (!el) continue;
      // The cheap tests first: a Demo makes some forty changes a frame. Inside an SVG drawing (a Viewer's, a plot's), its
      // shapes move nothing in the page; nor do the marks no style names.
      if (el instanceof SVGElement && (r.type === 'childList' || el.ownerSVGElement !== null)) continue;
      if (r.type === 'attributes' && /^(data|aria)-/.test(r.attributeName!) && !styled.has(r.attributeName!)) continue;
      if (ours(el)) continue;
      if (r.type === 'attributes') {
        if (r.attributeName === 'class' || r.attributeName === 'hidden') consider(el);
      } else if (r.type === 'childList') {
        for (const n of r.addedNodes) if (n instanceof Element) considerAll(n);
        if (r.removedNodes.length) {
          for (const gone of [...els].filter((c) => !c.isConnected)) {
            els.delete(gone);
            sizes.unobserve(gone);
            listChanged = true;
          }
        }
      }
      stale = true;
    }
  };
  const observer = new MutationObserver(take);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
  considerAll(document.documentElement);

  const onScroll = () => {
    stale = true;
    scrolls++;
  };
  const onResize = () => {
    stale = true;
    moved++;
  };
  const started = (e: Event) => {
    const el = e.target;
    if (el instanceof Element && !ours(el) && [...els].some((c) => el.contains(c))) moving.add(el);
  };
  const ended = (e: Event) => {
    if (e.target instanceof Element && moving.delete(e.target)) stale = true;
  };
  const events: [string, EventListener][] = [
    ['transitionrun', started],
    ['animationstart', started],
    ['transitionend', ended],
    ['transitioncancel', ended],
    ['animationend', ended],
    ['animationcancel', ended],
  ];
  addEventListener('scroll', onScroll, { capture: true, passive: true });
  addEventListener('resize', onResize);
  for (const [name, on] of events) addEventListener(name, on, { capture: true });

  const update = () => {
    take(observer.takeRecords());
    for (const el of moving) if (!el.isConnected) moving.delete(el);
    if (listChanged) {
      ordered = [...els].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
      listChanged = false;
      stale = true;
    }
    if (!stale && !moving.size) return;
    stale = false;
    const before = read;
    read = ordered.map((el) => ({ el, box: el.getBoundingClientRect() })).filter(({ box: r }) => r.width > 0 && r.height > 0);
    if (read.length !== before.length || read.some((c, i) => c.el !== before[i].el || !sameBox(c.box, before[i].box))) moved++;
    docked = read.filter((c) => c.el.matches(DOCKED)).map((c) => c.box);
    panels = read.filter((c) => c.el.matches(PANELS)).map((c) => c.box);
  };
  return {
    covers: () => {
      update();
      return read;
    },
    docked: () => {
      update();
      return docked;
    },
    panels: () => {
      update();
      return panels;
    },
    moved: () => {
      update();
      return moved;
    },
    scrolls: () => scrolls,
    stop: () => {
      observer.disconnect();
      sizes.disconnect();
      removeEventListener('scroll', onScroll, { capture: true });
      removeEventListener('resize', onResize);
      for (const [name, on] of events) removeEventListener(name, on, { capture: true });
    },
  };
}
