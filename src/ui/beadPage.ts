import type { SynthEngine } from '../engine/synthEngine';
import type { Patch } from '../patch/patch';
import type { Control, Reading } from './beadFrame';
import { lineAt } from './LfoPlot';
import type { Guide } from './mascotCling';
import { type CoverWatch, NOT_TEXT } from './mascotCovers';
import type { Cover } from './mascotPlace';
import { SECTIONS, STACKED } from './sections';

/** What it must keep clear of, above its edge: the controls, and (in three and four across) the Viewers. */
const CONTROLS = 'button, [role=slider], [role=tab], [role=radio], input, .piano, .knob-value, .fader';
/** Pointing the way (issue 151): what may stand beside a control it clings to, as little covered as can be. */
const NEIGHBOURS = '[data-learn], canvas, [role=tab], button, h2, h3';
const LFO_PLOTS = '.lfo-plot[data-lfo]';
/**
 * The text is read again this often, in seconds; at once as a cover opens, closes or moves with the page, or the window
 * resizes (issue 220); or this soon after the window or anything in the page scrolls, or a cover slides (issues 181 and
 * 220).
 */
const TEXT_SECONDS = 0.5;
const TEXT_SCROLLED = 0.1;

function readText(): Cover[] {
  const boxes: Cover[] = [];
  // What is not text is passed over whole (issue 220).
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, (node) =>
    node instanceof Element ? (node.matches(NOT_TEXT) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP) : NodeFilter.FILTER_ACCEPT,
  );
  const range = document.createRange();
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    const el = node.parentElement;
    if (!el || !/\S/.test(node.nodeValue ?? '')) continue;
    range.selectNodeContents(node);
    const lines = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
    if (lines.length && el.checkVisibility({ visibilityProperty: true, opacityProperty: true })) boxes.push(...lines.map(({ left, right, top, bottom }) => ({ left, right, top, bottom })));
  }
  return boxes;
}

/** The four sections on the page, by name, where shown. */
const sectionBoxes = () =>
  SECTIONS.map(({ name }) => ({ id: name as string, box: document.querySelector(`section[aria-label="${name}"]`)?.getBoundingClientRect() })).filter(
    (s): s is { id: string; box: DOMRect } => !!s.box && s.box.width > 0,
  );

/**
 * Bead's page, read for each frame (issue 245): everything `createBeadFrame` decides from, from the page itself. Every
 * read is made before the frame writes anything (issue 221); what a frame needs only now and then is read only then,
 * and the page's text only as often as `TEXT_SECONDS` says, or as the page moves.
 */
export function pageReader({ engine, patch, covering, holder, asked }: {
  engine: Pick<SynthEngine, 'modulationAt' | 'tempo' | 'shownNow' | 'lfoSwingAt'>;
  patch: () => Patch;
  covering: CoverWatch;
  /** Bead's frame, whose writes are against what holds it. */
  holder: () => HTMLElement;
  asked: () => Reading['asked'];
}) {
  const stacked = matchMedia(STACKED);
  const still = matchMedia('(prefers-reduced-motion: reduce)');
  // Where the pointer is in the window, for its eyes.
  let pointer: { x: number; y: number } | null = null;
  const follow = (e: PointerEvent) => void (pointer = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null);
  addEventListener('pointermove', follow, { passive: true });
  // The page's text as last read, and when, with the watch's counts by then (issues 181 and 220).
  let textRead: { at: number; moved: number; shifted: number; boxes: Cover[] } | null = null;
  const textNow = (seconds: number) => {
    const [moved, shifted] = [covering.moved(), covering.shifted()];
    const since = textRead ? seconds - textRead.at : Infinity;
    if (!textRead || textRead.moved !== moved || since >= TEXT_SECONDS || (textRead.shifted !== shifted && since >= TEXT_SCROLLED)) {
      textRead = { at: seconds, moved, shifted, boxes: readText() };
    }
    return textRead.boxes;
  };
  const bottomOf = (q: string) => document.querySelector(q)?.getBoundingClientRect().bottom ?? 0;

  /**
   * The page now, at `seconds` of the page's time; with `text` false, without the page's text, as a throw needs none
   * (its reads are kept to their own time). With no section shown, none of what covers it.
   */
  function read(seconds: number, { text = true } = {}): Reading {
    const sections = sectionBoxes();
    const view = { width: innerWidth, height: innerHeight, clientWidth: document.documentElement.clientWidth, scrollX, scrollY };
    // A control's reading, once a frame.
    const controls = new Map<object, Control>();
    const control = (handle: object): Control => {
      const known = controls.get(handle);
      if (known) return known;
      const el = handle as Element;
      const box = el.getBoundingClientRect();
      const section = el.closest('section[aria-label]');
      const read: Control = {
        box,
        shown: box.width > 0 && el.checkVisibility({ visibilityProperty: true }),
        connected: el.isConnected,
        target: el.getAttribute('data-tutorial-target'),
        section: section?.getAttribute('aria-label') ?? null,
        sectionBox: section?.getBoundingClientRect() ?? null,
        neighbours: () =>
          [...(el.closest('section[aria-label], header') ?? document.body).querySelectorAll(NEIGHBOURS)]
            .filter((n) => n !== el && !n.contains(el) && !el.contains(n) && !n.closest('.mascot'))
            .map((n) => n.getBoundingClientRect())
            .filter((r) => r.width > 0 && r.height > 0),
      };
      controls.set(handle, read);
      return read;
    };
    const empty = sections.length === 0;
    const m = empty ? null : engine.modulationAt();
    return {
      sections,
      page: (holder().offsetParent ?? document.body).getBoundingClientRect(),
      window: view,
      stacked: stacked.matches,
      reduced: still.matches,
      header: bottomOf('header'),
      strip: bottomOf('.section-strip'),
      coverings: empty ? [] : covering.covers(),
      text: empty || !text ? [] : textNow(seconds),
      docked: empty ? [] : covering.docked(),
      pointer,
      sound: {
        patch: patch(),
        bpm: engine.tempo().bpm,
        lfo: m?.lfo ?? [0, 0],
        amp: m?.amp ?? 0,
        volume: m?.volume ?? 0,
        struck: m?.struck ?? null,
        wave: (lfo, box, x) => lineAt({ engine, lfo, box, x, now: engine.shownNow() }),
      },
      asked: asked(),
      panels: () => covering.panels(),
      dialogOpen: () => !!document.querySelector('.display-panel, [role=dialog]'),
      plots: () =>
        // The LFO plots drawing an LFO that is on, in the window, each with its own tip: shown, it is over the plot while
        // the pointer is, as after a drop there, so it never keeps Bead off its line (issue 197). Each the box of its
        // drawing, inside its border, where its line is drawn: on a steep line a pixel across is pixels up (issue 270).
        [...document.querySelectorAll<HTMLElement>(`${LFO_PLOTS}:not([data-inactive])`)].map((el) => ({
          lfo: Number(el.dataset.lfo) as 1 | 2,
          box: (el.querySelector('svg') ?? el).getBoundingClientRect(),
          tips: (el.getAttribute('aria-describedby') ?? '').split(' ').flatMap((id): Element[] => {
            const tip = id ? document.getElementById(id) : null;
            return tip ? [tip] : [];
          }),
        })),
      body: () => document.body.getBoundingClientRect(),
      controlsIn: (band, viewers) =>
        [...document.querySelectorAll<HTMLElement>(viewers ? `${CONTROLS}, canvas` : CONTROLS)]
          .filter((el) => !el.closest('.mascot') && el.checkVisibility({ visibilityProperty: true }))
          .map((el) => el.getBoundingClientRect())
          .filter((r) => r.width > 0 && r.top < band.bottom && r.bottom > band.top && r.right > band.left && r.left < band.right),
      guided: (guide: Guide) => {
        let el = guide.selector ? document.querySelector(guide.selector) : null;
        if (guide.standIn && !el?.checkVisibility()) el = document.querySelector(guide.standIn);
        return el;
      },
      control,
    };
  }
  return {
    read,
    stop: () => removeEventListener('pointermove', follow),
  };
}
