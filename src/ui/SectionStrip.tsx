import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { DEMO_SCROLL_MS, glideTo, scrollBehavior } from './glide';
import { SECTIONS, type SectionName } from './sections';

/** The gap left between the strip and a section it jumps to. */
const LANDING_GAP = 8;
/** Near the top of the page the header keeps its rows whichever way the page scrolls. */
const TOP = 80;
/** Scrolls smaller than this (a resting thumb, a bounce) do not change the header. */
const JITTER = 4;
/** A jump that cannot reach its target (the end of the page) has ended once the page has not scrolled for this long. */
const STILL_MS = 400;

/** The header's rows above the piano slid out of view or back (CSS acts on it on phones only). */
const collapseHeader = (collapsed: boolean) => document.documentElement.toggleAttribute('data-header-collapsed', collapsed);

const section = (name: string) => document.querySelector<HTMLElement>(`section[aria-label="${name}"]`);

/**
 * How far down the window the header and the strip will reach once the page has scrolled to `y`: where the header is
 * sticky (up to 860 px), its rows above the piano slide away on the way down past the page's top and come back on the
 * way up, as the scroll listener below has them do; wider, it scrolls away with the page.
 */
export function headerBottomAt(y: number): number {
  const header = document.querySelector('header')!;
  if (getComputedStyle(header).position !== 'sticky') return Math.max(0, header.getBoundingClientRect().bottom + scrollY - y);
  const collapsed = y > scrollY ? y > TOP : y < scrollY ? false : document.documentElement.hasAttribute('data-header-collapsed');
  const hide = collapsed ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-hide')) || 0 : 0;
  return header.offsetHeight - hide + (document.querySelector('.section-strip')?.getBoundingClientRect().height ?? 0);
}

/**
 * Where the page's top scrolls to, to show a section the least, as the browser's `scrollIntoView({ block: 'nearest' })`
 * would: its top just below the page's scroll padding (the header, issue 189), or its bottom at the window's foot.
 */
function nearestTop(box: DOMRect): number {
  const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const room = innerHeight - padding;
  const above = box.top < padding;
  const below = box.bottom > innerHeight;
  if (above === below) return scrollY; // in view, or over all of the window
  const toTop = (above && box.height <= room) || (below && box.height > room);
  return scrollY + (toTop ? box.top - padding : box.bottom - innerHeight);
}

/**
 * Phones only, up to 600 px (CSS hides it from 601 px, where the sections sit side by side): a strip of the sections, sticky
 * under the header. It shows which section is in view (the one a third of the way down what the header and strip
 * leave visible) and jumps to a section when tapped, landing its top just under the strip.
 *
 * `follow` (the Demo's moving knob, a Controller's bank) brings its section into view when it is out of sight: on a
 * phone with the same jump as a tap, elsewhere with the least scroll that shows the whole section. With `slow` (the
 * Demo's), the scroll lasts long enough to see Bead fall or fly to its new edge (issue 211); with reduced motion it
 * moves the page at once.
 */
export function SectionStrip({ follow, slow = false }: { follow?: { name: SectionName; key: number } | null; slow?: boolean }) {
  const [current, setCurrent] = useState<string>(SECTIONS[0].name);
  // While a tapped jump scrolls, the header keeps the state the jump gave it, until the page arrives where the jump
  // was going (or stops short of it): a pause or a pixel's settle mid-way must not read as a scroll back up.
  const jumping = useRef<number | null>(null);
  // The Demo's slow scroll under way, if one is: its stop.
  const gliding = useRef<(() => void) | null>(null);

  /** Scrolls the page to `top`: at once with reduced motion, else smoothly, or with `slowly` over DEMO_SCROLL_MS. */
  const scrollPage = (top: number, slowly: boolean) => {
    gliding.current?.();
    const behavior = scrollBehavior();
    if (behavior === 'auto' || !slowly) scrollTo({ top, behavior });
    else {
      const stop = glideTo(top, DEMO_SCROLL_MS, () => gliding.current === stop && (gliding.current = null));
      gliding.current = stop;
    }
  };
  // The slow scroll is the Demo's: it stops with the Demo (its Stop, the ×, a Note, its end), where the page is, and as
  // the strip goes (issue 211).
  useEffect(() => {
    if (slow) return () => gliding.current?.();
  }, [slow]);

  // The header's height, so the strip sits right under it (the header is sticky too), and how much of it slides away
  // while the page scrolls down: everything above the piano, but for a sliver of the header's padding.
  useEffect(() => {
    const header = document.querySelector('header')!;
    const set = () => {
      const box = header.getBoundingClientRect();
      const piano = header.querySelector('.piano')!.getBoundingClientRect();
      document.documentElement.style.setProperty('--header-h', `${box.height}px`);
      document.documentElement.style.setProperty('--header-hide', `${Math.max(0, piano.top - box.top - 4)}px`);
    };
    const observer = new ResizeObserver(set);
    observer.observe(header);
    set();
    return () => observer.disconnect();
  }, []);

  // Scrolling down the page slides the header's rows above the piano away, so the piano and the strip take less of a
  // small screen; any scroll back up brings them back.
  useEffect(() => {
    let last = scrollY;
    let still: ReturnType<typeof setTimeout> | undefined;
    const arrive = () => {
      clearTimeout(still);
      jumping.current = null;
      last = scrollY;
    };
    const onScroll = () => {
      if (jumping.current !== null) {
        clearTimeout(still);
        if (Math.abs(scrollY - jumping.current) <= 2) arrive();
        else still = setTimeout(arrive, STILL_MS);
        return;
      }
      if (Math.abs(scrollY - last) < JITTER) return;
      collapseHeader(scrollY > last && scrollY > TOP);
      last = scrollY;
    };
    // The Demo's slow scroll moves the page a frame at a time, each ending a scroll of its own.
    const onScrollEnd = () => jumping.current !== null && !gliding.current && arrive();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('scrollend', onScrollEnd);
    return () => {
      removeEventListener('scroll', onScroll);
      removeEventListener('scrollend', onScrollEnd);
      clearTimeout(still);
      collapseHeader(false);
    };
  }, []);

  useEffect(() => {
    const spy = () => {
      const strip = document.querySelector('.section-strip')!.getBoundingClientRect();
      if (!strip.height) return; // hidden: not a phone
      const line = strip.bottom + (innerHeight - strip.bottom) / 3;
      let found: string = SECTIONS[0].name;
      for (const s of SECTIONS) if ((section(s.name)?.getBoundingClientRect().top ?? Infinity) <= line) found = s.name;
      // At the very end of the page the last section is the one in view, however short it is.
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) found = SECTIONS[SECTIONS.length - 1].name;
      setCurrent(found);
    };
    addEventListener('scroll', spy, { passive: true });
    addEventListener('resize', spy);
    spy();
    return () => {
      removeEventListener('scroll', spy);
      removeEventListener('resize', spy);
    };
  }, []);

  const jump = (name: string, slowly = false) => {
    const target = section(name);
    if (!target) return;
    // Going down slides the header's rows away; a jump never brings them back (only a scroll of the person's own
    // does), so the piano and the strip stay where the finger expects them. Settle that first, so the landing allows
    // for the header as it will be when the page stops.
    const collapsed =
      document.documentElement.hasAttribute('data-header-collapsed') ||
      (target.getBoundingClientRect().top > 0 && scrollY + target.getBoundingClientRect().top > TOP);
    collapseHeader(collapsed);
    const hide = collapsed ? parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-hide')) || 0 : 0;
    // Where the strip's bottom will be once stuck under the header (overlapping its border by a pixel), not where it
    // is now (at the top of the page it is not stuck yet).
    const header = document.querySelector('header')!.getBoundingClientRect().height - hide;
    const strip = document.querySelector('.section-strip')!.getBoundingClientRect().height;
    const top = target.getBoundingClientRect().top + scrollY - (header - 1 + strip) - LANDING_GAP;
    jumping.current = Math.round(Math.min(Math.max(0, top), document.documentElement.scrollHeight - innerHeight));
    scrollPage(Math.max(0, top), slowly);
    setCurrent(name);
  };

  const jumpNow = useEffectEvent((name: string) => jump(name, slow));
  const scrollNow = useEffectEvent((top: number) => scrollPage(top, slow));
  // Only a new follow moves the page.
  useEffect(() => {
    const target = follow && section(follow.name);
    if (!target) return;
    const box = target.getBoundingClientRect();
    const strip = document.querySelector('.section-strip')!.getBoundingClientRect();
    if (!strip.height) {
      // In 2 × 2 the header stays at the top: a section under it is out of sight too (issue 152).
      const ceiling = Math.max(0, document.querySelector('header')!.getBoundingClientRect().bottom);
      if (box.top < ceiling || box.bottom > innerHeight) scrollNow(nearestTop(box));
      return;
    }
    // In view: all of it below the strip, or, for a section taller than what is left, its top where a jump lands it.
    const room = innerHeight - strip.bottom;
    const shown = box.height <= room ? box.top >= strip.bottom - 1 && box.bottom <= innerHeight + 1 : Math.abs(box.top - strip.bottom - LANDING_GAP) < 24;
    if (!shown) jumpNow(follow.name);
  }, [follow]);

  return (
    <nav className="section-strip" aria-label="Sections">
      {SECTIONS.map((s) => (
        <button key={s.name} type="button" aria-label={s.name} aria-current={current === s.name || undefined} data-section={s.name} onClick={() => jump(s.name)}>
          {s.short}
        </button>
      ))}
    </nav>
  );
}
